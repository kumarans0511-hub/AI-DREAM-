from app.models.memory_model import MemoryDB


class MemoryRetriever:

    def __init__(self):
        self.db = MemoryDB()

    def retrieve(self, query, n_results=3):

        results = self.db.collection.query(
            query_texts=[query],
            n_results=n_results
        )

        memories = []

        if results.get("documents"):
            docs = results["documents"][0]
            metas = results["metadatas"][0]

            for doc, meta in zip(docs, metas):
                memories.append({
                    "memory": doc,
                    "category": meta.get("category"),
                    "importance": meta.get("importance")
                })

        return memories