"""
EduBot - Flask Backend
"""

import os
import uuid
from flask import Flask, render_template, request, jsonify, session
from dotenv import load_dotenv

from gemini_client import EduBotGemini
from wikipedia_helper import cari_di_wikipedia, butuh_wikipedia

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev-secret")

bot = EduBotGemini()


@app.route("/")
def index():
    if "session_id" not in session:
        session["session_id"] = str(uuid.uuid4())
    return render_template("index.html")


@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    pesan = (data.get("message") or "").strip()
    if not pesan:
        return jsonify({"reply": "Pesan kosong 🤔"}), 400

    session_id = session.get("session_id", "default")

    konteks_wiki = ""
    if butuh_wikipedia(pesan):
        kandidat = pesan.replace("?", "").split()
        topik = " ".join(kandidat[-3:])
        ringkasan = cari_di_wikipedia(topik)
        if ringkasan:
            konteks_wiki = f"\n\n[Info Wikipedia tentang '{topik}']: {ringkasan}"

    balasan = bot.chat(session_id, pesan + konteks_wiki)
    return jsonify({"reply": balasan})


@app.route("/reset", methods=["POST"])
def reset():
    session_id = session.get("session_id", "default")
    bot.reset(session_id)
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
