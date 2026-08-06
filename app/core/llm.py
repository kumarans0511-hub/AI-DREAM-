import ollama


class LLM:

    def __init__(self):
        self.model = "llama3.1"

    def chat(self, message: str):

        response = ollama.chat(
            model=self.model,
            messages=[
                {
                    "role": "user",
                    "content": message
                }
            ]
        )

        return response["message"]["content"]