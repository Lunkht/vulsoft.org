from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import openai
from typing import List

from ..core.config import settings

router = APIRouter()

# Configure OpenAI
openai.api_key = settings.OPENAI_API_KEY

class ChatRequest(BaseModel):
    message: str
    history: List[dict] = []

@router.post("/chat")
async def handle_chat(chat_request: ChatRequest):
    """
    Gère une requête de chat et retourne une réponse de l'IA.
    """
    if not settings.OPENAI_API_KEY or "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" in settings.OPENAI_API_KEY:
        return {"response": "La clé API OpenAI n'est pas configurée sur le serveur. Veuillez contacter l'administrateur."}

    try:
        # Créer un contexte pour l'IA
        messages = [
            {"role": "system", "content": "Tu es VulsoftAI, un assistant virtuel amical et serviable pour le site Vulsoft. Tu réponds aux questions sur les services de développement, les formations et l'entreprise. Sois concis et professionnel."},
        ]
        messages.extend(chat_request.history)
        messages.append({"role": "user", "content": chat_request.message})

        completion = await openai.ChatCompletion.acreate(
            model="gpt-3.5-turbo",
            messages=messages,
            max_tokens=150
        )
        
        ai_response = completion.choices[0].message.content.strip()
        return {"response": ai_response}
        
    except Exception as e:
        print(f"Erreur OpenAI: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la communication avec l'assistant IA.")