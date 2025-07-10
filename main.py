import os
import requests
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Muat environment variables dari file .env
load_dotenv()

# Inisialisasi aplikasi FastAPI
app = FastAPI(title="Translator API")

# Konfigurasi CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- KONFIGURASI OPENROUTER & SYSTEM PROMPT ---
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
YOUR_SITE_URL = "http://localhost:8000" 
YOUR_SITE_NAME = "My Translator App"

# INI ADALAH SYSTEM PROMPT BARU KITA
SYSTEM_PROMPT = """You are an expert translator. Your sole purpose is to translate text between Indonesian and English.
- If you receive Indonesian text, translate it to English.
- If you receive English text, translate it to Indonesian.
- Do not add any commentary, explanations, or greetings.
- Provide only the translated text as the output.
- If the text cannot be translated or is nonsensical, respond with 'TIDAK BISA DITERJEMAHKAN'.
"""

# Model Pydantic untuk validasi request
class ChatRequest(BaseModel):
    text: str

@app.post("/api/chat")
async def chat(request: ChatRequest):
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="OPENROUTER_API_KEY tidak diatur di server.")

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": YOUR_SITE_URL,
        "X-Title": YOUR_SITE_NAME,
    }

    # --- PERUBAHAN UTAMA ADA DI SINI ---
    # Kita memasukkan System Prompt sebelum pesan dari pengguna
    data = {
        # "model": "deepseek/deepseek-chat:free",
        "model": "google/gemma-3n-e2b-it:free",
        "messages": [
            {
                "role": "system", 
                "content": SYSTEM_PROMPT
            },
            {
                "role": "user", 
                "content": request.text
            }
        ]
    }

    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            data=json.dumps(data)
        )
        response.raise_for_status() 

        response_data = response.json()
        ai_content = response_data.get('choices', [{}])[0].get('message', {}).get('content', 'Maaf, saya tidak bisa merespons saat ini.')
        
        return {"reply": ai_content}

    except requests.exceptions.HTTPError as http_err:
        print(f"HTTP error occurred: {http_err}")
        print(f"Response content: {response.text}")
        raise HTTPException(status_code=response.status_code, detail=f"Error dari API: {response.text}")
    except Exception as e:
        print(f"An error occurred: {e}")
        raise HTTPException(status_code=500, detail="Terjadi kesalahan internal di server.")
