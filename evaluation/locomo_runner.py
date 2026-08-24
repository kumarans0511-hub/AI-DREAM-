import json
import os
import sys
import ollama

# Add the project root to sys.path so we can import backend modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app.models.memory_model import MemoryDB
from backend.app.memory.extractor import MemoryExtractor
from backend.app.memory.importance import ImportanceScorer
from backend.app.memory.decision_engine import DecisionEngine
from backend.app.memory.consolidation import MemoryConsolidator
from backend.app.memory.retrieval import MemoryRetriever
from backend.app.core.llm import LLM

from evaluation.metrics import check_answer_correctness, calculate_metrics

def setup_isolated_pipeline():
    import shutil
    db_path = os.path.join(os.getcwd(), "memory_db")
    if os.path.exists(db_path):
        try:
            shutil.rmtree(db_path)
        except Exception:
            pass
            
    db = MemoryDB()
    
    extractor = MemoryExtractor()
    # Patch the hardcoded docker host to localhost for local evaluation
    extractor.client = ollama.Client(host=os.getenv("OLLAMA_URL", "http://localhost:11434"))
    
    scorer = ImportanceScorer()
    decision_engine = DecisionEngine()
    consolidator = MemoryConsolidator(db)
    consolidator.evaluator.client = ollama.Client(host=os.getenv("OLLAMA_URL", "http://localhost:11434"))
    
    retriever = MemoryRetriever()
    retriever.db = db # Ensure retriever uses our DB instance
    llm = LLM()
    
    return {
        "db": db,
        "extractor": extractor,
        "scorer": scorer,
        "decision_engine": decision_engine,
        "consolidator": consolidator,
        "retriever": retriever,
        "llm": llm
    }

def process_turn(text, pipeline):
    """Processes a single conversational turn through the DREAM memory pipeline."""
    try:
        memories = pipeline["extractor"].extract(text)
        for mem in memories:
            score = pipeline["scorer"].score(mem["memory"])
            decision = pipeline["decision_engine"].decide(score)
            
            if decision == "STORE":
                result = pipeline["consolidator"].consolidate(
                    memory=mem["memory"],
                    category=mem["category"],
                    importance=score
                )
                
                if result["action"] == "NEW" or result["action"] == "RELATED":
                    pipeline["db"].add_memory(
                        memory=mem["memory"],
                        category=mem["category"],
                        importance=score
                    )
    except Exception as e:
        print(f"Error processing turn: {e}")

def run_locomo_eval(dataset_path, output_path, limit=None):
    print(f"Loading LoCoMo dataset from {dataset_path}...")
    with open(dataset_path, 'r') as f:
        dataset = json.load(f)
        
    results = []
    
    for i, sample in enumerate(dataset):
        if limit is not None and i >= limit:
            break
            
        sample_id = sample.get("sample_id", f"sample_{i}")
        print(f"Processing sample {i+1}/{len(dataset)} (ID: {sample_id})")
        
        try:
            # 1. Setup clean pipeline
            pipeline = setup_isolated_pipeline()
            
            # 2. Process conversation
            conversation = sample.get("conversation", {})
            
            # Extract and sort sessions
            session_keys = [k for k in conversation.keys() if k.startswith("session_") and not k.endswith("_date_time")]
            # Sort by session number
            session_keys.sort(key=lambda x: int(x.split('_')[1]))
            
            for session_key in session_keys:
                session_turns = conversation[session_key]
                for turn in session_turns:
                    text = turn.get("text", "")
                    if text:
                        process_turn(text, pipeline)
            
            # 3. Ask benchmark questions
            qa_list = sample.get("qa", [])
            for qa_idx, qa in enumerate(qa_list):
                question = qa.get("question", "")
                expected_answers = qa.get("answer", [])
                
                # Retrieve
                retrieved_memories = pipeline["retriever"].retrieve(question)
                
                # Generate Answer
                prediction = pipeline["llm"].chat(question, retrieved_memories)
                
                # Evaluate
                is_correct = check_answer_correctness(prediction, expected_answers)
                
                results.append({
                    "sample_id": sample_id,
                    "qa_index": qa_idx,
                    "question": question,
                    "expected_answers": expected_answers,
                    "prediction": prediction,
                    "is_correct": is_correct,
                    "num_retrieved_memories": len(retrieved_memories),
                    "status": "success"
                })
                print(f"  Q: {question}\n  A: {prediction}\n  Correct: {is_correct}\n")
                
        except Exception as e:
            print(f"Failed to process sample {sample_id}: {e}")
            # Add a failure entry for each question in this sample to keep totals consistent
            qa_list = sample.get("qa", [{"question": "unknown"}])
            for qa_idx, qa in enumerate(qa_list):
                results.append({
                    "sample_id": sample_id,
                    "qa_index": qa_idx,
                    "question": qa.get("question", ""),
                    "status": "error",
                    "error": str(e)
                })

    metrics = calculate_metrics(results)
    
    output_data = {
        "metrics": metrics,
        "results": results
    }
    
    with open(output_path, 'w') as f:
        json.dump(output_data, f, indent=2)
        
    print(f"\nEvaluation complete. Metrics:\n{json.dumps(metrics, indent=2)}")
    print(f"Results saved to {output_path}")

if __name__ == "__main__":
    dataset_file = os.path.join(os.path.dirname(__file__), '../datasets/locomo/locomo_refined.json')
    output_file = os.path.join(os.path.dirname(__file__), 'results/locomo_results.json')
    run_locomo_eval(dataset_file, output_file, limit=1)
