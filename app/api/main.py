from fastapi import FastAPI
from app.memory.decision_engine import DecisionEngine
from app.core.llm import LLM
from app.memory.extractor import MemoryExtractor
from app.memory.importance import ImportanceScorer

app = FastAPI()
decision_engine = DecisionEngine()
llm = LLM()
extractor = MemoryExtractor()
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

    return {
        "user": message,
        "assistant": reply,
        "memories": memories
    }
