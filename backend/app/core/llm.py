import os
import ollama
import requests

def generate_response(prompt: str, prefer_gemini: bool = False) -> str:
    if prefer_gemini:
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            try:
                model_name = os.getenv("GEMINI_MODEL", "gemini-3.1-pro-preview")
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
                payload = {"contents": [{"parts": [{"text": prompt}]}]}
                response = requests.post(url, json=payload, headers={"Content-Type": "application/json"})
                response.raise_for_status()
                data = response.json()
                text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                if text:
                    print("[LLM] Provider: Gemini | Status: success")
                    return text
            except Exception:
                print("[LLM] Provider: Gemini | Status: failed | Fallback: Ollama")
        else:
            print("[LLM] GEMINI_API_KEY not set. Falling back to Ollama.")
            
    client = ollama.Client(host=os.getenv("OLLAMA_URL", "http://host.docker.internal:11434"))
    response = client.chat(
        model="llama3.1",
        messages=[{"role": "user", "content": prompt}]
    )
    print("[LLM] Provider: Ollama | Status: success")
    return response["message"]["content"]

class LLM:

    def __init__(self):
        self.model = "llama3.1"

        self.client = ollama.Client(
            host=os.getenv("OLLAMA_URL", "http://host.docker.internal:11434")
        )

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

        response = self.client.chat(
            model=self.model,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        return response["message"]["content"]