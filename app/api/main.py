from fastapi import FastAPI
from app.memory.decision_engine import DecisionEngine
from app.memory.retrieval import MemoryRetriever
from app.models.memory_model import MemoryDB
from app.core.llm import LLM
from app.memory.extractor import MemoryExtractor
from app.memory.importance import ImportanceScorer

app = FastAPI()
decision_engine = DecisionEngine()
db = MemoryDB()
llm = LLM()
extractor = MemoryExtractor()
retriever = MemoryRetriever()
scorer = ImportanceScorer()


@app.get("/")
def home():
    return {
        "Project": "DREAM",
        "Status": "Running"
    }


@app.get("/chat")
def chat(message: str):

    reply = llm.chat(message)

    memories = extractor.extract(message)

    for memory in memories:
        score = scorer.score(memory["memory"])
        decision = decision_engine.decide(score)

        memory["importance"] = score
        memory["decision"] = decision

        # Automatically store important memories
        if decision == "STORE":
            db.add_memory(
                memory=memory["memory"],
                category=memory["category"],
                importance=score
            )

    return {
        "user": message,
        "assistant": reply,
        "memories": memories
    }
@app.get("/memories")
def get_memories(query: str):

    memories = retriever.retrieve(query)

    return {
        "query": query,
        "memories": memories
    }
