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


# =============================================================================
# SHARED SERVICE INSTANCES
# =============================================================================
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