import ollama


class LLM:

    def __init__(self):
        self.model = "llama3.1"

    def chat(self, message: str, memories=None):
        memory_context = ""

        if memories:
            memory_context = "\n\nRelevant memories about the user:\n"

            for memory in memories:
                memory_context += (
                    f"- {memory['memory']} "
                    f"(category: {memory['category']}, "
                    f"importance: {memory['importance']})\n"
                )

        prompt = f"""
You are a helpful conversational assistant.

Use the relevant long-term memories about the user when they are useful.
Do not mention that you have a memory system unless the user asks about it.
Do not force memories into the conversation when they are irrelevant.

{memory_context}

User:
{message}
"""

        response = ollama.chat(
            model=self.model,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        return response["message"]["content"]