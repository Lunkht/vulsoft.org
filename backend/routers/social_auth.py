import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
import secrets

from .. import database, security
from ..core.config import settings

router = APIRouter()

# --- Google OAuth2 ---
GOOGLE_AUTHORIZATION_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"

# --- GitHub OAuth2 ---
GITHUB_AUTHORIZATION_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_API = "https://api.github.com/user"

@router.get("/login/google")
async def login_google(request: Request):
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google OAuth2 n'est pas configuré.")
    
    redirect_uri = request.url_for("callback_google")
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "select_account"
    }
    auth_url = f"{GOOGLE_AUTHORIZATION_URL}?{httpx.URL(params).query.decode()}"
    return RedirectResponse(auth_url)

@router.get("/callback/google", name="callback_google")
async def callback_google(request: Request, code: str, db: Session = Depends(database.get_db)):
    redirect_uri = request.url_for("callback_google")
    token_data = {
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code"
    }
    
    async with httpx.AsyncClient() as client:
        token_response = await client.post(GOOGLE_TOKEN_URL, data=token_data)
        token_json = token_response.json()
        if "error" in token_json:
            raise HTTPException(status_code=400, detail=token_json["error_description"])
        
        user_info_response = await client.get(GOOGLE_USERINFO_URL, headers={"Authorization": f"Bearer {token_json['access_token']}"})
        user_info = user_info_response.json()
        
        email = user_info.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="Impossible de récupérer l'email depuis Google.")

    user = db.query(database.User).filter(database.User.email == email).first()
    if not user:
        user = database.User(
            username=email,
            email=email,
            full_name=user_info.get("name"),
            hashed_password=security.get_password_hash(secrets.token_hex(16)),
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    access_token = security.create_access_token(data={"sub": user.email})
    return RedirectResponse(f"/pages/auth-callback.html#access_token={access_token}")


@router.get("/login/github")
async def login_github():
    if not settings.GITHUB_CLIENT_ID:
        raise HTTPException(status_code=500, detail="GitHub OAuth2 n'est pas configuré.")
    
    params = {"client_id": settings.GITHUB_CLIENT_ID, "scope": "user:email"}
    auth_url = f"{GITHUB_AUTHORIZATION_URL}?{httpx.URL(params).query.decode()}"
    return RedirectResponse(auth_url)

@router.get("/callback/github", name="callback_github")
async def callback_github(request: Request, code: str, db: Session = Depends(database.get_db)):
    token_data = {
        "client_id": settings.GITHUB_CLIENT_ID,
        "client_secret": settings.GITHUB_CLIENT_SECRET,
        "code": code
    }
    
    async with httpx.AsyncClient() as client:
        token_response = await client.post(GITHUB_TOKEN_URL, data=token_data, headers={"Accept": "application/json"})
        token_json = token_response.json()
        if "error" in token_json:
            raise HTTPException(status_code=400, detail=token_json.get("error_description", "Erreur GitHub"))
        
        access_token = token_json["access_token"]
        
        user_info_response = await client.get(GITHUB_USER_API, headers={"Authorization": f"Bearer {access_token}"})
        user_info = user_info_response.json()
        
        email = user_info.get("email")
        if not email:
            emails_response = await client.get(f"{GITHUB_USER_API}/emails", headers={"Authorization": f"Bearer {access_token}"})
            primary_email = next((e for e in emails_response.json() if e.get("primary")), None)
            email = primary_email.get("email") if primary_email else None

        if not email:
            raise HTTPException(status_code=400, detail="Impossible de récupérer un email vérifié depuis GitHub.")

    user = db.query(database.User).filter(database.User.email == email).first()
    if not user:
        user = database.User(
            username=user_info.get("login"),
            email=email,
            full_name=user_info.get("name") or user_info.get("login"),
            hashed_password=security.get_password_hash(secrets.token_hex(16)),
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    access_token = security.create_access_token(data={"sub": user.email})
    return RedirectResponse(f"/pages/auth-callback.html#access_token={access_token}")