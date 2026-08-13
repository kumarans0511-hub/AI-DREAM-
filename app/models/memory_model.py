import chromadb


class MemoryDB:

    def __init__(self):

        self.client = chromadb.PersistentClient( path="memory_db" )

        self.collection = self.client.get_or_create_collection( name="dream_memories" )

    def add_memory(self, memory, category, importance):

        memory_id = str( self.collection.count() + 1 )

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

    def get_all_memories(self):

        return self.collection.get()