"""
Integrasi Wikipedia API (Bahasa Indonesia) untuk memperkaya jawaban.
"""

import requests
from typing import Optional


WIKI_API = "https://id.wikipedia.org/api/rest_v1/page/summary/{}"


def cari_di_wikipedia(topik: str) -> Optional[str]:
    try:
        url = WIKI_API.format(requests.utils.quote(topik))
        r = requests.get(url, timeout=5, headers={"User-Agent": "EduBot/1.0"})
        if r.status_code == 200:
            data = r.json()
            return data.get("extract")
    except Exception:
        return None
    return None


def butuh_wikipedia(pertanyaan: str) -> bool:
    keywords = ["siapa", "dimana", "di mana", "kapan", "sejarah", "biografi"]
    p = pertanyaan.lower()
    return any(k in p for k in keywords)
