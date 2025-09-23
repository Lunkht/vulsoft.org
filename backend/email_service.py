from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from pydantic import EmailStr
from typing import List, Dict
from pathlib import Path
from backend.core.config import settings

# Configuration pour fastapi-mail
conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
    MAIL_STARTTLS=settings.MAIL_STARTTLS,
    MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
    TEMPLATE_FOLDER=Path(__file__).parent.parent / 'templates',
)

fm = FastMail(conf)

async def send_email(subject: str, recipients: List[EmailStr], template_name: str, template_body: Dict):
    """
    Envoie un email en utilisant un template.
    """
    message = MessageSchema(
        subject=subject,
        recipients=recipients,
        template_body=template_body,
        subtype="html"
    )
    try:
        await fm.send_message(message, template_name=template_name)
        print(f"Email envoyé à {recipients}")
    except Exception as e:
        print(f"Échec de l'envoi de l'email: {e}")

async def send_welcome_email(email_to: EmailStr, username: str):
    """
    Envoie un email de bienvenue à un nouvel utilisateur.
    """
    await send_email(
        subject="Bienvenue chez Vulsoft !",
        recipients=[email_to],
        template_name="welcome_email.html",
        template_body={"username": username}
    )

async def send_contact_confirmation_email(email_to: EmailStr, first_name: str):
    """
    Envoie un email de confirmation après une soumission de formulaire de contact.
    """
    await send_email(
        subject="Votre message a bien été reçu",
        recipients=[email_to],
        template_name="contact_confirmation.html",
        template_body={"first_name": first_name}
    )

async def send_contact_notification_to_admin(data: Dict):
    """
    Envoie une notification à l'administrateur pour un nouveau message de contact.
    """
    admin_email = settings.MAIL_FROM 
    
    body = f"""
    Nouveau message de contact de {data.get('firstName')} {data.get('lastName')}:
    Email: {data.get('email')}
    Message: {data.get('message')}
    """
    
    if data.get("file_path"):
        file_url = f"http://localhost:8001/{data.get('file_path')}"
        body += f"\n\nPièce jointe: {file_url}"

    message = MessageSchema(subject="Nouveau Message de Contact", recipients=[admin_email], body=body, subtype="plain")
    try:
        await fm.send_message(message)
    except Exception as e:
        print(f"Échec de l'envoi de la notification admin: {e}")

async def send_bulk_email(recipients: List[EmailStr], subject: str, content: str):
    """
    Envoie un email en masse en utilisant BCC pour la confidentialité.
    """
    message = MessageSchema(
        subject=subject,
        recipients=[],  # Le champ "To" peut être vide ou contenir votre propre email
        bcc=recipients,
        body=content,
        subtype="html"
    )
    try:
        await fm.send_message(message)
        print(f"Newsletter envoyée à {len(recipients)} destinataires.")
    except Exception as e:
        print(f"Échec de l'envoi de la newsletter: {e}")