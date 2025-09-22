from fastapi import APIRouter, HTTPException
from fastapi_mail import MessageSchema
from pydantic import BaseModel, EmailStr
from typing import List
from ..email_utils import fm

router = APIRouter()

class EmailSchema(BaseModel):
    email: List[EmailStr]
    body: dict

@router.post("/send-test-email")
async def send_test_email(recipient: EmailStr):
    """Envoyer un email de test."""
    message = MessageSchema(
        subject="Email de test Vulsoft API",
        recipients=[recipient],
        body="<h1>Bonjour !</h1><p>Ceci est un email de test envoyé depuis l'API Vulsoft.</p>",
        subtype="html"
    )

    try:
        await fm.send_message(message)
        return {"message": f"Email de test envoyé à {recipient}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
