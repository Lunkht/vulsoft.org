from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel, EmailStr
from typing import List

from .. import database, security
from ..services import email_service

router = APIRouter()

class SubscriberBase(BaseModel):
    email: EmailStr

class SubscriberOut(SubscriberBase):
    id: int
    is_active: bool
    created_at: database.datetime

    class Config:
        orm_mode = True

class NewsletterRequest(BaseModel):
    subject: str
    content: str # HTML content

@router.post("/subscribe", status_code=201)
async def subscribe_to_newsletter(subscriber: SubscriberBase, db: Session = Depends(database.get_db)):
    """Abonner un nouvel utilisateur à la newsletter."""
    db_subscriber = database.NewsletterSubscriber(email=subscriber.email)
    try:
        db.add(db_subscriber)
        db.commit()
        db.refresh(db_subscriber)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Cet email est déjà abonné.")
    
    return {"success": True, "message": "Vous êtes maintenant abonné à notre newsletter !"}

@router.get("/subscribers", response_model=List[SubscriberOut])
async def get_subscribers(
    db: Session = Depends(database.get_db),
    admin: database.User = Depends(security.verify_admin)
):
    """Récupérer la liste de tous les abonnés."""
    subscribers = db.query(database.NewsletterSubscriber).order_by(database.NewsletterSubscriber.created_at.desc()).all()
    return subscribers

@router.post("/send")
async def send_newsletter(
    newsletter: NewsletterRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(database.get_db),
    admin: database.User = Depends(security.verify_admin)
):
    """Envoyer une newsletter à tous les abonnés actifs."""
    subscribers = db.query(database.NewsletterSubscriber).filter(database.NewsletterSubscriber.is_active == True).all()
    recipient_emails = [s.email for s in subscribers]

    if not recipient_emails:
        raise HTTPException(status_code=400, detail="Aucun abonné actif trouvé.")

    # Utiliser une tâche de fond pour ne pas bloquer la réponse
    background_tasks.add_task(
        email_service.send_bulk_email,
        recipients=recipient_emails,
        subject=newsletter.subject,
        content=newsletter.content
    )

    return {"success": True, "message": f"Newsletter en cours d'envoi à {len(recipient_emails)} abonnés."}