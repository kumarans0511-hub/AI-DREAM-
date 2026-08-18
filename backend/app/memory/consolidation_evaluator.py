import json
import ollama


class ConsolidationEvaluator:

    def __init__(self):
        self.model = "llama3.1"

    def evaluate(self, old_memory, new_memory):

        prompt = f"""
You are a memory consolidation classifier.

Your task is to compare an EXISTING memory with a NEW memory.

You MUST choose exactly one of:

DUPLICATE
UPDATE
RELATED

Definitions:

DUPLICATE:
The new memory says essentially the SAME FACT as the existing
memory, even if the wording is different.

UPDATE:
The new memory changes an existing fact or provides newer
information about the SAME fact.

RELATED:
The new memory is connected to the existing memory but adds
a DIFFERENT fact. It should NOT replace the existing memory.

IMPORTANT:
Do NOT classify a related fact as UPDATE.

Examples:

Example 1:
Existing: "I have a dog named Bruno"
New: "My dog is named Bruno"
Answer: DUPLICATE

Example 2:
Existing: "Bruno is 3 years old"
New: "Bruno is 4 years old now"
Answer: UPDATE

Example 3:
Existing: "I have a dog named Bruno"
New: "Bruno loves playing fetch"
Answer: RELATED

Example 4:
Existing: "I study AI and Data Science"
New: "I am studying Artificial Intelligence and Data Science"
Answer: DUPLICATE

Example 5:
Existing: "I live in Chennai"
New: "I moved to Bangalore"
Answer: UPDATE

Example 6:
Existing: "I live in Chennai"
New: "I work as a software developer"
Answer: RELATED

Return ONLY valid JSON.

Required format:

{{
    "action": "DUPLICATE"
}}

Existing memory:
{old_memory}

New memory:
{new_memory}
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

        text = response["message"]["content"]

        try:
            result = json.loads(text)

            action = result.get("action", "RELATED")

            if action not in ["DUPLICATE", "UPDATE", "RELATED"]:
                return "RELATED"

            return action

        except (json.JSONDecodeError, TypeError):
            return "RELATED"