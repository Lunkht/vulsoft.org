from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import openai
from ..core.config import settings
from typing import List, Dict

router = APIRouter()

# Configure OpenAI only if the key is available and not the placeholder
if settings.OPENAI_API_KEY and settings.OPENAI_API_KEY != "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":
    try:
        openai.api_key = settings.OPENAI_API_KEY
    except Exception as e:
        print(f"Erreur de configuration OpenAI: {e}")
        openai.api_key = None
else:
    print("Avertissement: La clé API OpenAI n'est pas configurée. Le chatbot ne fonctionnera pas.")
    openai.api_key = None

class ChatRequest(BaseModel):
    messages: List[Dict[str, str]]

@router.post("/chat")
async def chat_with_bot(request: ChatRequest):
    """Proxy pour l'API OpenAI. Reçoit un historique de messages et retourne la réponse de l'assistant."""
    if not openai.api_key:
        raise HTTPException(status_code=503, detail="Le service de chatbot est actuellement indisponible.")

    try:
        response = await openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=request.messages,
            max_tokens=150
        )
        return {"reply": response.choices[0].message.content.strip()}
    except Exception as e:
        print(f"Erreur OpenAI: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la communication avec l'assistant AI.")