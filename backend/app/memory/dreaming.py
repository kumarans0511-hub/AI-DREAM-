import json
import ollama
from backend.app.models.memory_model import MemoryDB

# Prompt for synthesizing higher-level reflections from related memories
DREAM_SYNTHESIS_PROMPT = """
You are the memory synthesis and reflection engine of an AI long-term memory system.

Your task is to analyze a group of related user memories and determine if a higher-level insight, reflection, or combined synthesis can be formed.

CRITICAL RULES:
1. Complete Attribute Preservation: When multiple source memories refer to the same entity (person, pet, place, project, object, hobby, etc.), you MUST preserve the key attributes from ALL of those memories in the synthesized reflection. Names, ages, durations, dates, numbers, preferences, relationships, roles, and goals must NEVER be silently discarded or omitted.
2. No Simplification Loss: Do NOT drop or omit specific details (such as age, location, or specific activity) merely to make the reflection sound shorter or simpler. If an attribute was stated in the source memories, it MUST appear in the combined reflection.
3. Safe Entity Combination: If two or more memories describe the same entity and their attributes can be safely combined into a single unified statement, combine them into one rich fact (e.g., combining pet identity + age + name).
4. No Information Loss / Fallback: If memories cannot be combined without losing meaningful attributes, or if synthesizing would produce an overly generalized statement that loses specifics, you MUST return has_insight as false.
5. Strict Grounding: Use ONLY facts explicitly provided in the memories. NEVER assume, extrapolate, or invent new attributes or facts.
6. Unrelated or Pure Duplicate Memories:
   - If the memories are unrelated, return has_insight as false.
   - If the memories are identical duplicate statements that provide no additional attributes or synthesis, return has_insight as false.
7. Output Format: Return ONLY valid JSON. Do not include markdown formatting, code fences (such as ```json), or commentary.

EXAMPLES:

Example 1 (Attribute Combination - Preserving Age and Identity):
Memories:
- Age of Bruno: 5 years old
- Has a dog named Bruno
CORRECT Output:
{{
    "has_insight": true,
    "memory": "User has a 5-year-old dog named Bruno",
    "category": "Reflection",
    "importance": 9,
    "reasoning": "Preserves both the pet identity/name and the specific 5-year-old age attribute"
}}
INCORRECT Output (DO NOT DO THIS):
"memory": "User has a pet dog named Bruno" (DISALLOWED: dropped the age "5 years old")

Example 2 (Attribute Combination - Pet Ownership & Specific Activity):
Memories:
- Has a dog named Bruno
- Playing fetch is an activity Bruno enjoys
CORRECT Output:
{{
    "has_insight": true,
    "memory": "User has a dog named Bruno who enjoys playing fetch",
    "category": "Reflection",
    "importance": 8,
    "reasoning": "Preserves pet name and specific activity preference"
}}

Example 3 (Theme Synthesis with Specific Attributes Preserved):
Memories:
- User plays tennis on weekends
- User plays badminton every Tuesday
CORRECT Output:
{{
    "has_insight": true,
    "memory": "User actively plays racket sports including tennis on weekends and badminton on Tuesdays",
    "category": "Reflection",
    "importance": 7,
    "reasoning": "Identifies racket sports theme while retaining specific sports and schedules"
}}

Example 4 (Duplicate Facts - No New Attributes):
Memories:
- User likes Formula 1
- likes Formula 1
CORRECT Output:
{{
    "has_insight": false,
    "reasoning": "Memories are duplicate statements with no additional attributes to combine"
}}

JSON Schema when an insight is synthesized:
{{
    "has_insight": true,
    "memory": "Synthesized reflection statement preserving all source attributes",
    "category": "Reflection",
    "importance": 7,
    "reasoning": "Explanation of how attributes from source memories were combined"
}}

JSON Schema when NO insight is formed:
{{
    "has_insight": false,
    "reasoning": "Reason why no insight was formed"
}}

Related memories to analyze:
{memories_text}
"""




class MemoryDreamer:
    """
    Offline/background cognitive worker that reviews stored memories,
    discovers related memory clusters, and synthesizes higher-level reflections.
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
        Initialize the MemoryDreamer.

        :param db: Instance of MemoryDB to interact with ChromaDB.
        :param model: Ollama model name (default: 'llama3.1').
        :param dry_run: If True, do not persist any new insights to DB by default.
        :param similarity_threshold: Maximum vector distance to consider memories related.
        :param duplicate_threshold: Maximum vector distance to consider a reflection duplicate.
        """
        self.db = db
        self.model = model
        self.dry_run = dry_run
        self.similarity_threshold = similarity_threshold
        self.duplicate_threshold = duplicate_threshold

    # =========================================================================
    # STAGE 1: Memory Loading & Conversion
    # =========================================================================
    def _load_memory_records(self) -> list:
        """
        Fetch all memories from ChromaDB and convert them into simple dict records:
        [{"id": str, "memory": str, "category": str, "importance": int}, ...]
        """
        raw = self.db.get_all_memories()

        if not raw or not raw.get("ids"):
            return []

        ids = raw.get("ids", [])
        documents = raw.get("documents", [])
        metadatas = raw.get("metadatas", [])

        records = []
        for i, memory_id in enumerate(ids):
            doc = documents[i] if i < len(documents) else ""
            meta = metadatas[i] if (metadatas and i < len(metadatas) and metadatas[i]) else {}

            records.append({
                "id": str(memory_id),
                "memory": doc,
                "category": meta.get("category", "General"),
                "importance": int(meta.get("importance", 5))
            })

        return records

    # =========================================================================
    # STAGE 2: Related Memory Group Discovery
    # =========================================================================
    def _discover_related_groups(self, records: list) -> list:
        """
        Find clusters of semantically related memories using vector similarity search.
        Uses existing db.find_similar_memories() without mutating any records.
        """
        groups = []
        seen_group_keys = set()
        record_map = {r["id"]: r for r in records}

        # Query similar memories for each record to find neighbors
        for record in records:
            # Query up to 4 neighbors or total count
            n_query = min(4, len(records))
            results = self.db.find_similar_memories(record["memory"], n_results=n_query)

            if not results or not results.get("ids") or not results["ids"][0]:
                continue

            matched_ids = results["ids"][0]
            matched_distances = results.get("distances", [[]])[0]

            group_member_ids = {record["id"]}

            for i, other_id in enumerate(matched_ids):
                other_id_str = str(other_id)
                if other_id_str == record["id"]:
                    continue

                dist = matched_distances[i] if i < len(matched_distances) else 1.0

                # Check if distance is within relationship threshold
                if dist <= self.similarity_threshold and other_id_str in record_map:
                    group_member_ids.add(other_id_str)

            # A valid group must have at least 2 related memories
            if len(group_member_ids) >= 2:
                group_key = tuple(sorted(group_member_ids))
                if group_key not in seen_group_keys:
                    seen_group_keys.add(group_key)
                    group_records = [record_map[mid] for mid in group_key]
                    groups.append(group_records)

        return groups

    # =========================================================================
    # STAGE 3: LLM Synthesis & Reflection Generation
    # =========================================================================
    def _synthesize_insight(self, group: list) -> dict:
        """
        Prompt the Ollama model to synthesize a higher-level reflection from a group
        of related memories. Returns parsed insight dict or None.
        """
        # Format memories for the prompt
        memories_text = "\n".join([
            f"- [{m['category']}] (Importance: {m['importance']}) {m['memory']}"
            for m in group
        ])

        prompt = DREAM_SYNTHESIS_PROMPT.format(memories_text=memories_text)

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
            return self._parse_synthesis_json(raw_content)

        except Exception as e:
            print(f"[MemoryDreamer] LLM synthesis error: {e}")
            return None

    def _parse_synthesis_json(self, text: str) -> dict:
        """
        Safely extract and parse the JSON object from the LLM output.
        """
        if not text:
            return None

        try:
            start = text.find("{")
            end = text.rfind("}") + 1

            if start == -1 or end == 0:
                return None

            data = json.loads(text[start:end])

            # Check if LLM indicated a valid insight was formed
            if data.get("has_insight") is True and data.get("memory"):
                importance = data.get("importance", 7)
                try:
                    importance = max(1, min(10, int(importance)))
                except (ValueError, TypeError):
                    importance = 7

                return {
                    "has_insight": True,
                    "memory": str(data["memory"]).strip(),
                    "category": "Reflection",
                    "importance": importance,
                    "reasoning": data.get("reasoning", "")
                }

            return None

        except (json.JSONDecodeError, Exception) as e:
            print(f"[MemoryDreamer] JSON parse error: {e}")
            return None

    # =========================================================================
    # STAGE 4: Duplicate Reflection Check
    # =========================================================================
    def _is_duplicate_reflection(self, insight_text: str) -> bool:
        """
        Reuse existing similarity search to verify if a very similar
        reflection or memory already exists in ChromaDB.
        """
        results = self.db.find_similar_memories(insight_text, n_results=3)

        if not results or not results.get("ids") or not results["ids"][0]:
            return False

        matched_docs = results.get("documents", [[]])[0]
        matched_distances = results.get("distances", [[]])[0]

        for i, doc in enumerate(matched_docs):
            # Check for exact textual match (case-insensitive)
            if doc.strip().lower() == insight_text.strip().lower():
                return True

            # Check for high semantic similarity
            dist = matched_distances[i] if i < len(matched_distances) else 1.0
            if dist <= self.duplicate_threshold:
                return True

        return False

    # =========================================================================
    # MAIN ENTRY POINT: Dream Cycle
    # =========================================================================
    def run_dream_cycle(self, dry_run: bool = None) -> dict:
        """
        Execute a complete dream cycle:
        1. Fetch all existing memories.
        2. Handle safety constraints (< 2 memories).
        3. Discover related memory clusters.
        4. Synthesize higher-level reflections using Ollama LLM.
        5. If dry_run is False, persist non-duplicate reflections to ChromaDB.
        6. Return a comprehensive structured result.

        :param dry_run: If provided, overrides instance-level default dry_run setting.
        :return: Structured summary dictionary.
        """
        is_dry_run = self.dry_run if dry_run is None else dry_run

        # 1. Load memories from ChromaDB
        records = self._load_memory_records()

        # 2. Safety check: at least 2 memories required for clustering & dreaming
        if len(records) < 2:
            return {
                "status": "insufficient_memories",
                "message": "At least 2 memories are required to run a dream cycle.",
                "memories_processed": len(records),
                "groups_found": 0,
                "insights_generated": [],
                "stored": [],
                "dry_run": is_dry_run
            }

        # 3. Discover related memory groups
        groups = self._discover_related_groups(records)

        # 4. Synthesize reflections for each group
        insights_generated = []
        for group in groups:
            synthesis = self._synthesize_insight(group)

            if synthesis and synthesis.get("has_insight"):
                insight_item = {
                    "source_memory_ids": [m["id"] for m in group],
                    "source_memories": [m["memory"] for m in group],
                    "memory": synthesis["memory"],
                    "category": "Reflection",
                    "importance": synthesis["importance"],
                    "reasoning": synthesis.get("reasoning", "")
                }
                insights_generated.append(insight_item)

        # 5. Handle storage according to dry_run mode
        stored_reflections = []
        if not is_dry_run:
            for item in insights_generated:
                # Check for duplicates before storing
                if not self._is_duplicate_reflection(item["memory"]):
                    self.db.add_memory(
                        memory=item["memory"],
                        category="Reflection",
                        importance=item["importance"]
                    )
                    stored_reflections.append({
                        "memory": item["memory"],
                        "category": "Reflection",
                        "importance": item["importance"],
                        "source_memory_ids": item["source_memory_ids"]
                    })

        # 6. Return structured result
        return {
            "status": "completed",
            "memories_processed": len(records),
            "groups_found": len(groups),
            "insights_generated": insights_generated,
            "stored": stored_reflections,
            "dry_run": is_dry_run
        }
