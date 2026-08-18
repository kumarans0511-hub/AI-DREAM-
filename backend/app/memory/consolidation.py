from backend.app.memory.consolidation_evaluator import ConsolidationEvaluator


class MemoryConsolidator:

    def __init__(self, db, candidate_threshold=0.90):
        self.db = db
        self.candidate_threshold = candidate_threshold
        self.evaluator = ConsolidationEvaluator()

    def find_candidates(self, memory, n_results=3):

        results = self.db.find_similar_memories(
            memory,
            n_results=n_results
        )

        candidates = []

        if not results["ids"][0]:
            return candidates

        for i in range(len(results["ids"][0])):

            distance = results["distances"][0][i]

            if distance <= self.candidate_threshold:

                candidates.append({
                    "id": results["ids"][0][i],
                    "memory": results["documents"][0][i],
                    "category": results["metadatas"][0][i]["category"],
                    "importance": results["metadatas"][0][i]["importance"],
                    "distance": distance
                })

        return candidates

    def consolidate(self, memory, category, importance):

        candidates = self.find_candidates(memory)

        if not candidates:
            return {
                "action": "NEW",
                "memory": memory,
                "category": category,
                "importance": importance
            }

        best_candidate = candidates[0]

        action = self.evaluator.evaluate(
            best_candidate["memory"],
            memory
        )

        if action == "DUPLICATE":

            return {
                "action": "DUPLICATE",
                "memory": best_candidate["memory"],
                "duplicate_of": best_candidate["id"],
                "distance": best_candidate["distance"]
            }

        if action == "UPDATE":

            self.db.update_memory(
                memory_id=best_candidate["id"],
                memory=memory,
                category=category,
                importance=importance
            )

            return {
                "action": "UPDATED",
                "old_memory": best_candidate["memory"],
                "new_memory": memory,
                "memory_id": best_candidate["id"],
                "distance": best_candidate["distance"]
            }

        return {
            "action": "RELATED",
            "memory": best_candidate["memory"],
            "memory_id": best_candidate["id"],
            "new_memory": memory,
            "category": category,
            "importance": importance,
            "distance": best_candidate["distance"]
        }