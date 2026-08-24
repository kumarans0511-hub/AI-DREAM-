import json
import os
import sys

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
# We can reuse the setup and process logic from locomo_runner, or redefine here for independence
from evaluation.locomo_runner import setup_isolated_pipeline, process_turn

def run_longmemeval_eval(dataset_path, output_path, limit=None):
    print(f"Loading LongMemEval dataset from {dataset_path}...")
    with open(dataset_path, 'r') as f:
        dataset = json.load(f)
        
    results = []
    
    for i, sample in enumerate(dataset):
        if limit is not None and i >= limit:
            break
            
        sample_id = sample.get("question_id", f"sample_{i}")
        print(f"Processing sample {i+1}/{len(dataset)} (ID: {sample_id})")
        
        try:
            # 1. Setup clean pipeline
            pipeline = setup_isolated_pipeline()
            
            # 2. Process conversation
            sessions = sample.get("haystack_sessions", [])
            for session_turns in sessions:
                for turn in session_turns:
                    text = turn.get("content", "")
                    if text:
                        # Optionally prepend the role for better context extraction? 
                        # DREAM normally just takes the user's message, but if we need both, we might just pass the text.
                        # We will just pass the text to let the extractor handle it.
                        process_turn(text, pipeline)
            
            # 3. Ask benchmark question
            question = sample.get("question", "")
            expected_answer = sample.get("answer", "")
            
            # Retrieve
            retrieved_memories = pipeline["retriever"].retrieve(question)
            
            # Generate Answer
            prediction = pipeline["llm"].chat(question, retrieved_memories)
            
            # Evaluate
            is_correct = check_answer_correctness(prediction, expected_answer)
            
            results.append({
                "sample_id": sample_id,
                "question_type": sample.get("question_type", "unknown"),
                "question": question,
                "expected_answer": expected_answer,
                "prediction": prediction,
                "is_correct": is_correct,
                "num_retrieved_memories": len(retrieved_memories),
                "status": "success"
            })
            print(f"  Q: {question}\n  A: {prediction}\n  Correct: {is_correct}\n")
            
        except Exception as e:
            print(f"Failed to process sample {sample_id}: {e}")
            results.append({
                "sample_id": sample_id,
                "question": sample.get("question", "unknown"),
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
    dataset_file = os.path.join(os.path.dirname(__file__), '../datasets/longmemeval/longmemeval_oracle.json')
    output_file = os.path.join(os.path.dirname(__file__), 'results/longmemeval_results.json')
    # Run only on the first 10 for quick testing if desired, or all 500
    # For now, we will process the entire dataset as requested by a full runner.
    run_longmemeval_eval(dataset_file, output_file, limit=1)
