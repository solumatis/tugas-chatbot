"""
Wrapper Gemini API dengan:
- System instruction (persona EduBot)
- In-memory conversation history (memory)
- Konfigurasi parameter kreatif
"""

import os
from typing import List, Dict
from google import genai
from google.genai import types


MODEL_NAME = "gemini-2.5-flash"

SYSTEM_INSTRUCTION = """
Kamu adalah **EduBot**, asisten belajar AI yang cerdas, ramah, dan santai.

Karakter kamu:
- Berbicara seperti kakak tingkat yang pintar, bukan seperti buku teks.
- Menggunakan bahasa Indonesia yang natural, sesekali pakai emoji untuk keakraban.
- Menjelaskan konsep sulit dengan analogi sehari-hari.
- Selalu memotivasi pelajar dan tidak pernah merendahkan.
- Jika ditanya di luar topik edukasi, arahkan kembali dengan sopan.

Format jawaban:
1. **Jawaban inti** — langsung ke poin (maksimal 3 paragraf).
2. **Analogi/Contoh** — jika konsepnya abstrak.
3. **💡 Rekomendasi lanjutan** — saran topik atau latihan berikutnya.

Jika pengguna memberitahu namanya, sapa dengan namanya di respons berikutnya.
"""

GENERATION_CONFIG = types.GenerateContentConfig(
    system_instruction=SYSTEM_INSTRUCTION,
    temperature=0.7,
    top_p=0.95,
    top_k=40,
    max_output_tokens=800,
)


class EduBotGemini:
    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY tidak ditemukan")
        self.client = genai.Client(api_key=self.api_key)
        self.sessions: Dict[str, List[types.Content]] = {}

    def _get_history(self, session_id: str) -> List[types.Content]:
        if session_id not in self.sessions:
            self.sessions[session_id] = []
        return self.sessions[session_id]

    def chat(self, session_id: str, user_message: str) -> str:
        history = self._get_history(session_id)
        history.append(
            types.Content(role="user", parts=[types.Part(text=user_message)])
        )

        try:
            response = self.client.models.generate_content(
                model=MODEL_NAME,
                contents=history,
                config=GENERATION_CONFIG,
            )
            bot_reply = response.text
        except Exception as e:
            return f"⚠️ Maaf, ada kendala teknis: {e}"

        history.append(
            types.Content(role="model", parts=[types.Part(text=bot_reply)])
        )

        if len(history) > 20:
            self.sessions[session_id] = history[-20:]

        return bot_reply

    def reset(self, session_id: str):
        self.sessions.pop(session_id, None)
