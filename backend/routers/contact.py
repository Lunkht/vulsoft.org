from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Dict
from ..database import get_db, ContactMessage
from datetime import datetime
from ..services import email_service

router = APIRouter()

# Modèles Pydantic pour la validation
class ContactRequest(BaseModel):
    firstName: str
    lastName: str
    email: str
    phone: Optional[str] = None
    company: Optional[str] = None
    service: Optional[str] = None
    budget: Optional[str] = None
    message: str
    newsletter: bool = False
    privacy: bool

class ContactResponse(BaseModel):
    success: bool
    message: str
    id: Optional[int] = None

@router.post("/submit", response_model=ContactResponse)
async def submit_contact_form(
    contact_data: ContactRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Traiter la soumission du formulaire de contact"""
    
    # Validation de la politique de confidentialité
    if not contact_data.privacy:
        raise HTTPException(
            status_code=400,
            detail="Vous devez accepter la politique de confidentialité"
        )
    
    try:
        # Créer l'entrée en base de données
        db_contact = ContactMessage(
            first_name=contact_data.firstName,
            last_name=contact_data.lastName,
            email=contact_data.email,
            phone=contact_data.phone,
            company=contact_data.company,
            service=contact_data.service,
            budget=contact_data.budget,
            message=contact_data.message,
            newsletter=contact_data.newsletter,
            created_at=datetime.utcnow()
        )
        
        db.add(db_contact)
        db.commit()
        db.refresh(db_contact)
        
        # Envoyer les emails de confirmation et de notification admin
        background_tasks.add_task(
            email_service.send_contact_confirmation_email,
            email_to=contact_data.email,
            first_name=contact_data.firstName
        )
        background_tasks.add_task(
            email_service.send_contact_notification_to_admin, data=contact_data.dict()
        )
        
        return ContactResponse(
            success=True,
            message="Votre message a été envoyé avec succès. Nous vous recontacterons rapidement.",
            id=db_contact.id
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Erreur lors de l'envoi du message. Veuillez réessayer."
        )

@router.get("/messages")
async def get_contact_messages(
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Récupérer les messages de contact (pour l'admin)"""
    
    query = db.query(ContactMessage)
    
    if status:
        query = query.filter(ContactMessage.status == status)
    
    messages = query.offset(skip).limit(limit).all()
    
    return {
        "messages": messages,
        "total": query.count()
    }

@router.put("/messages/{message_id}/status")
async def update_message_status(
    message_id: int,
    status: str,
    db: Session = Depends(get_db)
):
    """Mettre à jour le statut d'un message"""
    
    message = db.query(ContactMessage).filter(ContactMessage.id == message_id).first()
    
    if not message:
        raise HTTPException(status_code=404, detail="Message non trouvé")
    
    message.status = status
    db.commit()
    
    return {"success": True, "message": "Statut mis à jour"}