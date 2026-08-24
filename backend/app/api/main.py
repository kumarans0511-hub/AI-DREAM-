from contextlib import asynccontextmanager
from fastapi import FastAPI

from backend.app.memory.decision_engine import DecisionEngine
from backend.app.memory.retrieval import MemoryRetriever
from backend.app.memory.consolidation import MemoryConsolidator
from backend.app.models.memory_model import MemoryDB
from backend.app.core.llm import LLM
from backend.app.memory.extractor import MemoryExtractor
from backend.app.memory.importance import ImportanceScorer
from backend.app.memory.dreaming import MemoryDreamer
from backend.app.scheduler.scheduler import DreamScheduler
from backend.app.core.settings_manager import SettingsManager


# =============================================================================
# SHARED SERVICE INSTANCES
# =============================================================================
settings_manager = SettingsManager()
decision_engine = DecisionEngine()
db = MemoryDB()
llm = LLM()
extractor = MemoryExtractor()
retriever = MemoryRetriever()
scorer = ImportanceScorer()
consolidator = MemoryConsolidator(db)

dreamer = MemoryDreamer(
    db=db,
    dry_run=True
)

scheduler = DreamScheduler(
    dreamer=dreamer,
    interval_seconds=3600,
    dry_run=True
)


# =============================================================================
# APPLICATION LIFECYCLE
# =============================================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.start()
    yield
    scheduler.stop()


app = FastAPI(lifespan=lifespan)


# =============================================================================
# API ROUTES
# =============================================================================
@app.get("/")
def home():
    return {
        "project": "DREAM",
        "status": "Running"
    }


@app.get("/chat")
def chat(message: str):

    # 1. Retrieve relevant long-term memories
    retrieved_memories = retriever.retrieve(message)

    # 2. Generate a response using retrieved memories
    reply = llm.chat(
        message,
        memories=retrieved_memories
    )

    # 3. Extract possible new memories
    memories = extractor.extract(message)

    # 4. Process each extracted memory
    for memory in memories:

        # Calculate importance
        score = scorer.score(memory["memory"])

        # Decide whether the memory is important enough
        decision = decision_engine.decide(score)

        memory["importance"] = score
        memory["decision"] = decision
        memory["storage_status"] = "NOT_IMPORTANT"

        # 5. Only important memories reach consolidation
        if decision == "STORE":

            result = consolidator.consolidate(
                memory=memory["memory"],
                category=memory["category"],
                importance=score
            )

            # 6. Handle the consolidation result
            if result["action"] == "NEW":

                db.add_memory(
                    memory=memory["memory"],
                    category=memory["category"],
                    importance=score
                )

                memory["storage_status"] = "STORED"

            elif result["action"] == "DUPLICATE":

                memory["storage_status"] = "DUPLICATE_SKIPPED"
                memory["duplicate_of"] = result["memory"]
                memory["similarity_distance"] = result["distance"]

            elif result["action"] == "UPDATED":

                memory["storage_status"] = "UPDATED"
                memory["updated_memory_id"] = result["memory_id"]
                memory["old_memory"] = result["old_memory"]
                memory["similarity_distance"] = result["distance"]

            elif result["action"] == "RELATED":

                db.add_memory(
                    memory=memory["memory"],
                    category=memory["category"],
                    importance=score
                )

                memory["storage_status"] = "RELATED_STORED"
                memory["related_to"] = result["memory"]
                memory["similarity_distance"] = result["distance"]

    # 7. Return the complete result
    return {
        "user": message,
        "assistant": reply,
        "retrieved_memories": retrieved_memories,
        "new_memories": memories
    }


@app.get("/memories/all")
def get_all_memories():
    raw_data = db.get_all_memories()
    memories = []
    
    if raw_data and raw_data.get("documents"):
        docs = raw_data["documents"]
        metas = raw_data["metadatas"]
        for doc, meta in zip(docs, metas):
            memories.append({
                "memory": doc,
                "category": meta.get("category", "General") if meta else "General",
                "importance": meta.get("importance", 5) if meta else 5
            })
            
    return {
        "memories": memories
    }


@app.get("/memories")
def get_memories(query: str):

    memories = retriever.retrieve(query)

    return {
        "query": query,
        "memories": memories
    }


@app.get("/dream/status")
def dream_status():
    return scheduler.get_status()


@app.post("/dream/trigger")
def dream_trigger():
    return scheduler.trigger_now()


# =============================================================================
# DATASET ROUTES
# =============================================================================
import json as _json
import os as _os
from collections import Counter as _Counter
from functools import lru_cache as _lru_cache

_DATASET_BASE = _os.environ.get("DATASET_BASE", "/app/datasets")
_LOCOMO_PATH  = _os.path.join(_DATASET_BASE, "locomo", "locomo_refined.json")
_LME_PATH     = _os.path.join(_DATASET_BASE, "longmemeval", "longmemeval_oracle.json")

@_lru_cache(maxsize=1)
def _load_locomo():
    with open(_LOCOMO_PATH, encoding="utf-8") as f:
        return _json.load(f)

@_lru_cache(maxsize=1)
def _load_lme():
    with open(_LME_PATH, encoding="utf-8") as f:
        return _json.load(f)


@app.get("/datasets/info")
def datasets_info():
    """Return high-level statistics for all benchmark datasets."""
    cat_labels = {1: "Single-hop Temporal", 2: "Multi-hop Temporal", 3: "Open-ended", 4: "Adversarial"}

    # LoCoMo
    locomo = _load_locomo()
    locomo_qa_total = sum(len(s.get("qa", [])) for s in locomo)
    locomo_turns    = sum(len(s.get("conversation", {}).keys()) for s in locomo)
    locomo_cats = _Counter()
    for s in locomo:
        for q in s.get("qa", []):
            locomo_cats[cat_labels.get(q.get("category"), "Unknown")] += 1

    # LongMemEval oracle
    lme = _load_lme()
    lme_types = _Counter(q.get("question_type", "unknown") for q in lme)
    avg_sessions = (sum(len(q.get("haystack_sessions", [])) for q in lme) / len(lme)) if lme else 0

    return {
        "locomo": {
            "name":          "LoCoMo",
            "description":   "Long-term Conversation Memory dataset. 10 synthetic conversation sessions with 1,382 QA pairs spanning temporal, multi-hop, open-ended, and adversarial question types.",
            "file":          "locomo_refined.json",
            "size_mb":       round(_os.path.getsize(_LOCOMO_PATH) / 1e6, 2),
            "sessions":      len(locomo),
            "total_qa":      locomo_qa_total,
            "total_turns":   locomo_turns,
            "categories":    dict(locomo_cats),
            "source":        "https://arxiv.org/abs/2309.11696",
        },
        "longmemeval": {
            "name":          "LongMemEval (Oracle)",
            "description":   "Long-term memory evaluation benchmark with 500 single and multi-session questions requiring temporal reasoning, knowledge update tracking, and session-level recall.",
            "file":          "longmemeval_oracle.json",
            "size_mb":       round(_os.path.getsize(_LME_PATH) / 1e6, 2),
            "questions":     len(lme),
            "avg_sessions":  round(avg_sessions, 1),
            "question_types": dict(lme_types),
            "source":        "https://arxiv.org/abs/2410.10813",
        }
    }


@app.get("/datasets/locomo/samples")
def locomo_samples(limit: int = 20, offset: int = 0):
    """Return paginated QA samples from the LoCoMo dataset."""
    cat_labels = {1: "Single-hop Temporal", 2: "Multi-hop Temporal", 3: "Open-ended", 4: "Adversarial"}
    locomo = _load_locomo()
    flat = []
    for session in locomo:
        sid = session.get("sample_id", "?")
        for q in session.get("qa", []):
            flat.append({
                "session_id":  sid,
                "question":    q.get("question", ""),
                "answer":      q.get("answer", []),
                "category":    cat_labels.get(q.get("category"), "Unknown"),
                "multi_modal": q.get("is_multi_modality", False),
                "evidence":    q.get("evidence", []),
            })
    total = len(flat)
    return {"total": total, "offset": offset, "limit": limit, "samples": flat[offset:offset + limit]}


@app.get("/datasets/longmemeval/samples")
def lme_samples(limit: int = 20, offset: int = 0, question_type: str = ""):
    """Return paginated questions from the LongMemEval oracle dataset."""
    lme = _load_lme()
    filtered = [q for q in lme if not question_type or q.get("question_type") == question_type]
    total = len(filtered)
    page = filtered[offset:offset + limit]
    result = []
    for q in page:
        result.append({
            "question_id":   q.get("question_id", ""),
            "question_type": q.get("question_type", ""),
            "question":      q.get("question", ""),
            "answer":        q.get("answer", ""),
            "question_date": q.get("question_date", ""),
            "num_sessions":  len(q.get("haystack_sessions", [])),
        })
    return {"total": total, "offset": offset, "limit": limit, "question_type": question_type, "samples": result}



# =============================================================================
# SETTINGS & STATUS ROUTES
# =============================================================================
@app.get("/settings")
def get_settings():
    return settings_manager.get_all()

@app.post("/settings")
def update_settings(new_settings: dict):
    success = settings_manager.save(new_settings)
    return {"status": "success" if success else "error"}

@app.get("/system/status")
def system_status():
    # 1. Backend API is implicitly online if this runs
    backend_status = "Online"
    
    # 2. Check Ollama
    try:
        # Just check if we can list models or ping
        llm.client.list()
        ollama_status = "Online"
    except Exception:
        ollama_status = "Offline"
        
    # 3. Check ChromaDB
    try:
        db.collection.count()
        chroma_status = "Online"
    except Exception:
        chroma_status = "Offline"
        
    return {
        "backend": backend_status,
        "ollama": ollama_status,
        "chromadb": chroma_status
    }