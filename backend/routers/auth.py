from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from database import get_db, User
import hashlib
import secrets

router = APIRouter()

# Modèles Pydantic
class UserCreate(BaseModel):
    firstName: str
    lastName: str
    email: str
    phone: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    address: Optional[str] = None
    password: str
    confirmPassword: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    is_active: bool
    created_at: datetime

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    success: bool
    message: str
    user_id: Optional[int] = None

# Fonctions utilitaires simplifiées
def hash_password(password: str) -> str:
    """Hash un mot de passe avec SHA-256 et un salt"""
    salt = secrets.token_hex(16)
    return f"{salt}:{hashlib.sha256((salt + password).encode()).hexdigest()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Vérifie un mot de passe"""
    try:
        salt, hash_part = hashed_password.split(':')
        return hashlib.sha256((salt + plain_password).encode()).hexdigest() == hash_part
    except:
        return False

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def authenticate_user(db: Session, username: str, password: str):
    user = get_user_by_username(db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

# Routes d'authentification
@router.post("/register", response_model=UserResponse)
async def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """Inscription d'un nouvel utilisateur"""
    
    # Validation des mots de passe
    if user.password != user.confirmPassword:
        raise HTTPException(
            status_code=400,
            detail="Les mots de passe ne correspondent pas"
        )
    
    if len(user.password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Le mot de passe doit contenir au moins 8 caractères"
        )
    
    # Créer le nom d'utilisateur à partir de l'email
    username = user.email.split('@')[0]
    full_name = f"{user.firstName} {user.lastName}"
    
    # Vérifier si l'utilisateur existe déjà
    if get_user_by_username(db, username):
        # Si le nom d'utilisateur existe, ajouter un suffixe
        counter = 1
        original_username = username
        while get_user_by_username(db, username):
            username = f"{original_username}{counter}"
            counter += 1
    
    if get_user_by_email(db, user.email):
        raise HTTPException(
            status_code=400,
            detail="Cet email est déjà utilisé"
        )
    
    # Créer le nouvel utilisateur
    hashed_password = hash_password(user.password)
    db_user = User(
        username=username,
        email=user.email,
        full_name=full_name,
        hashed_password=hashed_password
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

@router.post("/login", response_model=LoginResponse)
async def login_user(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """Connexion utilisateur simplifiée"""
    user = authenticate_user(db, login_data.username, login_data.password)
    if not user:
        return LoginResponse(
            success=False,
            message="Nom d'utilisateur ou mot de passe incorrect"
        )
    
    return LoginResponse(
        success=True,
        message="Connexion réussie",
        user_id=user.id
    )

@router.get("/user/{user_id}", response_model=UserResponse)
async def get_user_info(user_id: int, db: Session = Depends(get_db)):
    """Obtenir les informations d'un utilisateur"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return user