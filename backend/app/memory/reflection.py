import json
import ollama
from backend.app.models.memory_model import MemoryDB

# Prompt for topic-focused memory reflection
TOPIC_REFLECTION_PROMPT = """
You are the reflection and high-level reasoning module of an AI long-term memory system.

Your task is to analyze a group of user memories related to a specific topic and synthesize ONE clear, high-level reflection.

CRITICAL RULES:
1. Complete Attribute Preservation: Preserve all essential names, ages, numbers, dates, preferences, relationships, and activities mentioned in the memories. Do NOT silently omit attributes or simplify away details.
2. Fact Grounding: Use ONLY facts directly provided in the memories. NEVER assume, extrapolate, or invent new facts or attributes.
3. Coherent Synthesis: Unify the related facts into a single, cohesive reflection about the user regarding the topic.
4. No Information Loss: If the memories cannot be combined into a meaningful reflection without losing important details, return has_reflection as false.
5. Irrelevant / Insufficient Memories: If the memories are unrelated to each other or do not support a meaningful conclusion about the topic, return has_reflection as false.
6. Output Format: Return ONLY valid JSON. Do not include markdown code fences (such as ```json) or commentary outside JSON.

EXAMPLES:

Example 1 (Attribute Combination):
Topic: "User's dog"
Memories:
- Age of Bruno: 5 years old
- Has a dog named Bruno
- Bruno loves playing fetch
CORRECT Output:
{{
    "has_reflection": true,
    "reflection": "User has a 5-year-old dog named Bruno who loves playing fetch",
    "importance": 9,
    "reasoning": "Combines pet identity, name, age, and activity preference into a single unified reflection"
}}
INCORRECT Output (DO NOT DO THIS):
"reflection": "User has a pet dog named Bruno" (DISALLOWED: dropped age and activity details)

Example 2 (Interest & Habit Synthesis):
Topic: "Sports and activities"
Memories:
- User plays tennis on weekends
- User plays badminton every Tuesday
CORRECT Output:
{{
    "has_reflection": true,
    "reflection": "User actively plays racket sports, including tennis on weekends and badminton on Tuesdays",
    "importance": 7,
    "reasoning": "Synthesizes recurring sports activities while preserving specific sports and schedules"
}}

Example 3 (Unrelated or Insufficient Details):
Topic: "User career"
Memories:
- User bought a new laptop
- User likes Italian food
CORRECT Output:
{{
    "has_reflection": false,
    "reasoning": "Memories do not provide meaningful information about the user's career"
}}

JSON Schema when reflection is generated:
{{
    "has_reflection": true,
    "reflection": "Synthesized reflection statement preserving all source attributes",
    "importance": 7,
    "reasoning": "Brief explanation of how the memories were synthesized"
}}

JSON Schema when NO reflection is formed:
{{
    "has_reflection": false,
    "reasoning": "Reason why no reflection was formed"
}}

Topic:
{topic}

Relevant memories:
{memories_text}
"""


class MemoryReflector:
    """
    On-demand cognitive worker that retrieves memories relevant to a specific topic
    and synthesizes a focused, high-level reflection.
    """

    def __init__(
        self,
        db: MemoryDB,
        model: str = "llama3.1",
        dry_run: bool = True,
        similarity_threshold: float = 0.90,
        duplicate_threshold: float = 0.40
    ):
        """
        Initialize the MemoryReflector.

        :param db: Instance of MemoryDB to query and store memories.
        :param model: Ollama model name (default: 'llama3.1').
        :param dry_run: If True, do not persist new reflections to DB by default.
        :param similarity_threshold: Maximum vector distance to consider memories relevant to topic.
        :param duplicate_threshold: Maximum vector distance to consider a reflection duplicate.
        """
        self.db = db
        self.model = model
        self.dry_run = dry_run
        self.similarity_threshold = similarity_threshold
        self.duplicate_threshold = duplicate_threshold

    # =========================================================================
    # STAGE 1: Candidate Memory Retrieval
    # =========================================================================
    def _retrieve_candidates(self, topic: str) -> list:
        """
        Retrieve up to 5 relevant memories for the topic using vector similarity search,
        filtering out results that exceed the similarity threshold.
        """
        results = self.db.find_similar_memories(topic, n_results=5)

        if not results or not results.get("ids") or not results["ids"][0]:
            return []

        matched_ids = results["ids"][0]
        matched_docs = results.get("documents", [[]])[0]
        matched_metas = results.get("metadatas", [[]])[0]
        matched_dists = results.get("distances", [[]])[0]

        candidates = []
        for i, mid in enumerate(matched_ids):
            dist = matched_dists[i] if i < len(matched_dists) else 1.0

            # Only retain memories within the configured similarity threshold
            if dist <= self.similarity_threshold:
                doc = matched_docs[i] if i < len(matched_docs) else ""
                meta = matched_metas[i] if (matched_metas and i < len(matched_metas) and matched_metas[i]) else {}

                candidates.append({
                    "id": str(mid),
                    "memory": doc,
                    "category": meta.get("category", "General"),
                    "importance": int(meta.get("importance", 5)),
                    "distance": dist
                })

        return candidates

    # =========================================================================
    # STAGE 2: LLM Reflection Generation
    # =========================================================================
    def _generate_reflection(self, topic: str, memories: list) -> dict:
        """
        Prompt the Ollama model to synthesize a focused reflection from the candidates.
        """
        memories_text = "\n".join([
            f"- [{m['category']}] (Importance: {m['importance']}) {m['memory']}"
            for m in memories
        ])

        prompt = TOPIC_REFLECTION_PROMPT.format(
            topic=topic,
            memories_text=memories_text
        )

        try:
            response = ollama.chat(
                model=self.model,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )
            raw_content = response["message"]["content"]
            return self._parse_reflection_json(raw_content)

        except Exception as e:
            print(f"[MemoryReflector] LLM reflection error: {e}")
            return None

    def _parse_reflection_json(self, text: str) -> dict:
        """
        Safely extract and parse JSON from the LLM response.
        """
        if not text:
            return None

        try:
            start = text.find("{")
            end = text.rfind("}") + 1

            if start == -1 or end == 0:
                return None

            data = json.loads(text[start:end])

            if data.get("has_reflection") is True and data.get("reflection"):
                importance = data.get("importance", 7)
                try:
                    importance = max(1, min(10, int(importance)))
                except (ValueError, TypeError):
                    importance = 7

                return {
                    "has_reflection": True,
                    "reflection": str(data["reflection"]).strip(),
                    "importance": importance,
                    "reasoning": data.get("reasoning", "")
                }

            return {
                "has_reflection": False,
                "reasoning": data.get("reasoning", "")
            }

        except (json.JSONDecodeError, Exception) as e:
            print(f"[MemoryReflector] JSON parse error: {e}")
            return None

    # =========================================================================
    # STAGE 3: Duplicate Reflection Check
    # =========================================================================
    def _is_duplicate_reflection(self, reflection_text: str) -> bool:
        """
        Check whether an exact match or highly similar reflection already exists.
        """
        results = self.db.find_similar_memories(reflection_text, n_results=3)

        if not results or not results.get("ids") or not results["ids"][0]:
            return False

        matched_docs = results.get("documents", [[]])[0]
        matched_distances = results.get("distances", [[]])[0]

        for i, doc in enumerate(matched_docs):
            # Exact text match (case-insensitive)
            if doc.strip().lower() == reflection_text.strip().lower():
                return True

            # Semantic similarity check
            dist = matched_distances[i] if i < len(matched_distances) else 1.0
            if dist <= self.duplicate_threshold:
                return True

        return False

    # =========================================================================
    # MAIN ENTRY POINT: Reflect on Topic
    # =========================================================================
    def reflect_on_topic(self, topic: str, dry_run: bool = None) -> dict:
        """
        Synthesize a focused reflection on a specific topic:
        1. Retrieve up to 5 relevant memories within the similarity threshold.
        2. If fewer than 2 relevant memories exist, return has_reflection=False safely.
        3. Call Ollama llama3.1 to generate a focused reflection.
        4. If dry_run=False, store the new reflection if not duplicate.
        5. Return a structured result dictionary.

        :param topic: The topic/theme to reflect on.
        :param dry_run: If provided, overrides instance-level dry_run setting.
        :return: Structured result dictionary.
        """
        is_dry_run = self.dry_run if dry_run is None else dry_run

        # 1. Retrieve candidate memories for topic
        candidates = self._retrieve_candidates(topic)
        source_memories = [c["memory"] for c in candidates]

        # 2. Safety check: at least 2 memories required within similarity threshold
        if len(candidates) < 2:
            return {
                "topic": topic,
                "has_reflection": False,
                "reason": "Fewer than 2 relevant memories found within similarity threshold.",
                "reflection": None,
                "category": "Reflection",
                "importance": None,
                "source_memories": source_memories,
                "stored": False,
                "dry_run": is_dry_run
            }

        # 3. Generate reflection via LLM
        synthesis = self._generate_reflection(topic, candidates)

        if not synthesis or not synthesis.get("has_reflection") or not synthesis.get("reflection"):
            return {
                "topic": topic,
                "has_reflection": False,
                "reason": synthesis.get("reasoning") if synthesis else "LLM did not produce a valid reflection.",
                "reflection": None,
                "category": "Reflection",
                "importance": None,
                "source_memories": source_memories,
                "stored": False,
                "dry_run": is_dry_run
            }

        reflection_text = synthesis["reflection"]
        importance = synthesis["importance"]
        stored = False

        # 4. If dry_run=False, persist new non-duplicate reflection to ChromaDB
        if not is_dry_run:
            if not self._is_duplicate_reflection(reflection_text):
                self.db.add_memory(
                    memory=reflection_text,
                    category="Reflection",
                    importance=importance
                )
                stored = True

        # 5. Return structured result
        return {
            "topic": topic,
            "has_reflection": True,
            "reflection": reflection_text,
            "category": "Reflection",
            "importance": importance,
            "source_memories": source_memories,
            "stored": stored,
            "dry_run": is_dry_run
        }
