import ollama
import json


class MemoryExtractor:

    def __init__(self):
        self.model = "llama3.1"

        # Docker-compatible Ollama connection
        self.client = ollama.Client(
            host="http://host.docker.internal:11434"
        )

    def extract(self, message: str):

        prompt = f"""
You are a memory extraction system.

Analyze the user message and extract important long-term memories.

Return ONLY valid JSON.

Rules:
- Extract only useful information that should be remembered.
- Ignore casual conversation.
- Categories can be:
  Personal, Preferences, Interests, Relationships, Pets, Work, Education, Other.

Format:

[
    {{
        "memory": "memory statement",
        "category": "category"
    }}
]

User message:

{message}
"""

        response = self.client.chat(
            model=self.model,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        content = response["message"]["content"]

        try:
            memories = json.loads(content)
        except json.JSONDecodeError:
            memories = []

        return memories