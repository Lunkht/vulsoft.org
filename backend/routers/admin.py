from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db, User, ContactMessage, Project

router = APIRouter()

# Modèles Pydantic pour l'admin
class AdminStats(BaseModel):
    total_users: int
    new_users_today: int
    total_messages: int
    unread_messages: int
    total_projects: int
    active_projects: int
    completion_rate: float

class UserAdmin(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    is_active: bool
    is_admin: bool
    created_at: datetime

class ContactMessageAdmin(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    phone: Optional[str]
    company: Optional[str]
    service: Optional[str]
    message: str
    status: str
    created_at: datetime

class ProjectAdmin(BaseModel):
    id: int
    title: str
    description: Optional[str]
    technology: Optional[str]
    client: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime

# Middleware pour vérifier les droits admin
def verify_admin(current_user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Accès administrateur requis")
    return user

@router.get("/stats", response_model=AdminStats)
async def get_admin_stats(db: Session = Depends(get_db)):
    """Obtenir les statistiques générales pour l'admin"""
    
    # Statistiques utilisateurs
    total_users = db.query(User).count()
    today = datetime.utcnow().date()
    new_users_today = db.query(User).filter(
        func.date(User.created_at) == today
    ).count()
    
    # Statistiques messages
    total_messages = db.query(ContactMessage).count()
    unread_messages = db.query(ContactMessage).filter(
        ContactMessage.status == "nouveau"
    ).count()
    
    # Statistiques projets
    total_projects = db.query(Project).count()
    active_projects = db.query(Project).filter(
        Project.status == "en_cours"
    ).count()
    completed_projects = db.query(Project).filter(
        Project.status == "terminé"
    ).count()
    
    completion_rate = (completed_projects / total_projects * 100) if total_projects > 0 else 0
    
    return AdminStats(
        total_users=total_users,
        new_users_today=new_users_today,
        total_messages=total_messages,
        unread_messages=unread_messages,
        total_projects=total_projects,
        active_projects=active_projects,
        completion_rate=completion_rate
    )

@router.get("/users", response_model=List[UserAdmin])
async def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Lister tous les utilisateurs"""
    
    query = db.query(User)
    
    if search:
        query = query.filter(
            (User.username.contains(search)) |
            (User.email.contains(search)) |
            (User.full_name.contains(search))
        )
    
    users = query.order_by(desc(User.created_at)).offset(skip).limit(limit).all()
    return users

@router.put("/users/{user_id}/toggle-admin")
async def toggle_user_admin(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Basculer le statut admin d'un utilisateur"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    user.is_admin = not user.is_admin
    db.commit()
    
    return {"success": True, "message": f"Statut admin {'activé' if user.is_admin else 'désactivé'}"}

@router.put("/users/{user_id}/toggle-active")
async def toggle_user_active(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Activer/désactiver un utilisateur"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    user.is_active = not user.is_active
    db.commit()
    
    return {"success": True, "message": f"Utilisateur {'activé' if user.is_active else 'désactivé'}"}

@router.get("/messages", response_model=List[ContactMessageAdmin])
async def get_contact_messages(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Lister tous les messages de contact"""
    
    query = db.query(ContactMessage)
    
    if status:
        query = query.filter(ContactMessage.status == status)
    
    messages = query.order_by(desc(ContactMessage.created_at)).offset(skip).limit(limit).all()
    return messages

@router.put("/messages/{message_id}/status")
async def update_message_status(
    message_id: int,
    status: str,
    db: Session = Depends(get_db)
):
    """Mettre à jour le statut d'un message"""
    
    valid_statuses = ["nouveau", "lu", "traité", "archivé"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Statut invalide")
    
    message = db.query(ContactMessage).filter(ContactMessage.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message non trouvé")
    
    message.status = status
    db.commit()
    
    return {"success": True, "message": "Statut mis à jour"}

@router.delete("/messages/{message_id}")
async def delete_message(
    message_id: int,
    db: Session = Depends(get_db)
):
    """Supprimer un message"""
    
    message = db.query(ContactMessage).filter(ContactMessage.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message non trouvé")
    
    db.delete(message)
    db.commit()
    
    return {"success": True, "message": "Message supprimé"}

@router.get("/projects", response_model=List[ProjectAdmin])
async def get_projects_admin(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Lister tous les projets pour l'admin"""
    
    query = db.query(Project)
    
    if status:
        query = query.filter(Project.status == status)
    
    projects = query.order_by(desc(Project.updated_at)).offset(skip).limit(limit).all()
    return projects

@router.get("/analytics/users-growth")
async def get_users_growth(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """Obtenir la croissance des utilisateurs sur X jours"""
    
    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(days=days)
    
    # Requête pour obtenir le nombre d'inscriptions par jour
    results = db.query(
        func.date(User.created_at).label('date'),
        func.count(User.id).label('count')
    ).filter(
        func.date(User.created_at) >= start_date
    ).group_by(
        func.date(User.created_at)
    ).order_by('date').all()
    
    return [{"date": str(result.date), "count": result.count} for result in results]

@router.get("/analytics/messages-by-service")
async def get_messages_by_service(db: Session = Depends(get_db)):
    """Répartition des messages par service demandé"""
    
    results = db.query(
        ContactMessage.service,
        func.count(ContactMessage.id).label('count')
    ).filter(
        ContactMessage.service.isnot(None)
    ).group_by(
        ContactMessage.service
    ).all()
    
    return [{"service": result.service or "Non spécifié", "count": result.count} for result in results]

@router.post("/create-admin")
async def create_admin_user(
    username: str,
    email: str,
    password: str,
    db: Session = Depends(get_db)
):
    """Créer un utilisateur administrateur (à utiliser une seule fois)"""
    
    # Vérifier si un admin existe déjà
    existing_admin = db.query(User).filter(User.is_admin == True).first()
    if existing_admin:
        raise HTTPException(status_code=400, detail="Un administrateur existe déjà")
    
    # Vérifier si l'email existe
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")
    
    # Importer la fonction de hashage
    import hashlib
    import secrets
    
    def hash_password(password: str) -> str:
        salt = secrets.token_hex(16)
        return f"{salt}:{hashlib.sha256((salt + password).encode()).hexdigest()}"
    
    # Créer l'admin
    hashed_password = hash_password(password)
    admin_user = User(
        username=username,
        email=email,
        full_name="Administrateur Vulsoft",
        hashed_password=hashed_password,
        is_admin=True,
        is_active=True
    )
    
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)
    
    return {"success": True, "message": "Administrateur créé avec succès", "user_id": admin_user.id}