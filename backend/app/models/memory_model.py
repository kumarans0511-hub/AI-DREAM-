import chromadb


class MemoryDB:

    def __init__(self):
        self.client = chromadb.PersistentClient(path="memory_db")

        self.collection = self.client.get_or_create_collection(
            name="dream_memories"
        )

    def add_memory(self, memory, category, importance):

        memory_id = str(self.collection.count() + 1)

        self.collection.add(
            ids=[memory_id],
            documents=[memory],
            metadatas=[
                {
                    "category": category,
                    "importance": importance
                }
            ]
        )

    def find_similar_memories(self, memory, n_results=3):

        results = self.collection.query(
            query_texts=[memory],
            n_results=n_results
        )

        return results

    def update_memory(self, memory_id, memory, category, importance):

        self.collection.update(
            ids=[memory_id],
            documents=[memory],
            metadatas=[
                {
                    "category": category,
                    "importance": importance
                }
            ]
        )

    def delete_memory(self, memory_id):

        self.collection.delete(
            ids=[memory_id]
        )

    def get_all_memories(self):

        return self.collection.get()