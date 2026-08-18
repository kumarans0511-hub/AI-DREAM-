from email import message
import json
import ollama

from backend.app.core.prompts import MEMORY_EXTRACTION_PROMPT


class MemoryExtractor:

    def __init__(self):
        self.model = "llama3.1"

    def extract(self, message):
        prompt = MEMORY_EXTRACTION_PROMPT.format(
            message=message
        )

        response = ollama.chat(
            model=self.model,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        text = response["message"]["content"]

        print("\n===== RAW LLM OUTPUT =====")
        print(text)
        print("==========================\n")

        try:
            start = text.find("[")
            end = text.rfind("]") + 1

            if start == -1 or end == 0:
                return []

            json_text = text[start:end]

            return json.loads(json_text)

        except Exception as e:
            print("Memory Extraction Error:", e)
            return []