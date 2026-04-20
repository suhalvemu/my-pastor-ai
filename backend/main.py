from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import json
import os

OLLAMA_BASE = "http://localhost:11434"
OLLAMA_MODEL = "llama3.1:8b"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

with open(os.path.join(os.path.dirname(__file__), "bible_kjv.json"), encoding="utf-8-sig") as f:
    BIBLE_DATA = json.load(f)

BIBLE_INDEX = {book["name"].lower(): book for book in BIBLE_DATA}

PASTOR_SYSTEM_PROMPT = """You are a wise, warm, and compassionate AI Pastor with deep knowledge of the Bible.
You have studied Scripture extensively — including historical context, original Hebrew and Greek,
theology across Christian traditions, and practical application to everyday life.

When someone comes to you:
- Listen carefully to their situation
- Explain Bible passages clearly — their meaning, historical/cultural context, original language insights
- Apply Scripture specifically and personally to what they are going through
- Offer encouragement and truth with love — never judgment
- Reference relevant Bible verses to support your guidance
- Speak like a trusted pastor who genuinely cares, not like a search engine

You serve all Christians globally, across all denominations.
Always ground your responses in Scripture."""

class ChatRequest(BaseModel):
    message: str
    conversation_history: list = []

class VerseRequest(BaseModel):
    reference: str
    situation: str = ""

@app.get("/bible/books")
def get_books():
    return {"books": [book["name"] for book in BIBLE_DATA]}

@app.get("/bible/chapter")
def get_chapter(book: str, chapter: int):
    book_data = BIBLE_INDEX.get(book.lower())
    if not book_data:
        raise HTTPException(status_code=404, detail="Book not found")
    chapters = book_data["chapters"]
    if chapter < 1 or chapter > len(chapters):
        raise HTTPException(status_code=404, detail="Chapter not found")
    import re
    verses = [
        {"verse": i + 1, "text": re.sub(r"\s+", " ", re.sub(r"\{.*?\}", "", text)).strip()}
        for i, text in enumerate(chapters[chapter - 1])
    ]
    return {"book": book_data["name"], "chapter": chapter, "verses": verses}

@app.post("/pastor/chat")
def chat_with_pastor(request: ChatRequest):
    try:
        messages = [{"role": "system", "content": PASTOR_SYSTEM_PROMPT}]
        for msg in request.conversation_history:
            role = "assistant" if msg["role"] == "model" else "user"
            messages.append({"role": role, "content": msg["content"]})
        messages.append({"role": "user", "content": request.message})

        response = requests.post(
            f"{OLLAMA_BASE}/api/chat",
            json={"model": OLLAMA_MODEL, "messages": messages, "stream": False},
            timeout=120,
        )
        data = response.json()
        return {"response": data["message"]["content"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/pastor/explain-verse")
def explain_verse(request: VerseRequest):
    try:
        situation_context = f"\n\nThe person asking is going through this situation: {request.situation}" if request.situation else ""
        prompt = f"""Please explain this Bible verse deeply and apply it personally:
Verse: {request.reference}{situation_context}

Include:
1. What this verse means (historical/cultural context, original language if relevant)
2. The core spiritual truth
3. How to apply this specifically to the situation described"""

        messages = [
            {"role": "system", "content": PASTOR_SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ]
        response = requests.post(
            f"{OLLAMA_BASE}/api/chat",
            json={"model": OLLAMA_MODEL, "messages": messages, "stream": False},
            timeout=120,
        )
        data = response.json()
        return {"explanation": data["message"]["content"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
