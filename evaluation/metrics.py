import re

def normalize_text(text):
    """Lowercases, removes punctuation, and extra whitespace."""
    if text is None:
        return ""
    text = str(text).lower()
    text = re.sub(r'[^\w\s]', '', text)
    return " ".join(text.split())

def check_answer_correctness(prediction, expected_answers):
    """
    Checks if any of the expected answers are contained in the prediction.
    Expected answers can be a list (as in LoCoMo) or a string (LongMemEval).
    """
    if not prediction:
        return False
        
    pred_norm = normalize_text(prediction)
    
    if isinstance(expected_answers, str):
        expected_answers = [expected_answers]
    elif isinstance(expected_answers, (int, float)):
        expected_answers = [str(expected_answers)]
        
    for ans in expected_answers:
        ans_norm = normalize_text(ans)
        if not ans_norm:
            continue
        # Exact match or substring match
        if ans_norm in pred_norm:
            return True
            
    return False

def calculate_metrics(results):
    """
    Given a list of result dictionaries, calculate aggregate metrics.
    """
    total = len(results)
    if total == 0:
        return {}
        
    successes = sum(1 for r in results if r.get('status') == 'success')
    failures = total - successes
    
    correct = sum(1 for r in results if r.get('status') == 'success' and r.get('is_correct', False))
    accuracy = correct / successes if successes > 0 else 0.0
    
    avg_retrieved = sum(r.get('num_retrieved_memories', 0) for r in results if r.get('status') == 'success') / successes if successes > 0 else 0.0
    
    return {
        "total_examples": total,
        "successfully_processed": successes,
        "failed_examples": failures,
        "answer_accuracy": accuracy,
        "avg_retrieved_memories": avg_retrieved
    }
