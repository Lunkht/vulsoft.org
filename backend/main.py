from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
import uvicorn
from pathlib import Path

# Import des routes
from routers import auth, contact, projects, admin, email, analytics, chatbot, payment, social_auth, two_factor, newsletter, blog
from database import init_db

# Initialisation de l'app FastAPI
app = FastAPI(
    title="Vulsoft API",
    description="API moderne pour le site Vulsoft",
    version="1.0.0"
)

# Configuration CORS pour production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://vulsoft.org",
        "https://www.vulsoft.org",
        "http://localhost:3000",  # Pour le développement
        "http://localhost:8000",
        "http://localhost:8001"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Créer le répertoire d'uploads s'il n'existe pas
UPLOADS_DIR = Path("uploads")
UPLOADS_DIR.mkdir(exist_ok=True)

# Servir les fichiers statiques (CSS, JS, images)
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")
app.mount("/", StaticFiles(directory="../", html=True), name="static")

# Inclusion des routes
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(contact.router, prefix="/api/contact", tags=["Contact"])
app.include_router(projects.router, prefix="/api/projects", tags=["Projects"])
app.include_router(admin.router, prefix="/api/admin", tags=["Administration"])
app.include_router(email.router, prefix="/api/email", tags=["Email"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(chatbot.router, prefix="/api/chatbot", tags=["Chatbot"])
app.include_router(payment.router, prefix="/api/payment", tags=["Payment"])
app.include_router(social_auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(two_factor.router, prefix="/api/2fa", tags=["2FA"])
app.include_router(newsletter.router, prefix="/api/newsletter", tags=["Newsletter"])
app.include_router(blog.router, prefix="/api/blog", tags=["Blog"])

@app.on_event("startup")
async def startup_event():
    """Initialisation de la base de données au démarrage"""
    await init_db()

@app.get("/health")
async def health_check():
    """Endpoint de santé pour monitoring"""
    return {"status": "healthy", "service": "Vulsoft API"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)