from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
import uvicorn
from pathlib import Path

# Import des routes
from routers import auth, contact, projects, admin
from database import init_db

# Initialisation de l'app FastAPI
app = FastAPI(
    title="Vulsoft API",
    description="API moderne pour le site Vulsoft",
    version="1.0.0"
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En production, spécifier les domaines autorisés
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Servir les fichiers statiques (CSS, JS, images)
app.mount("/static", StaticFiles(directory="../"), name="static")

# Inclusion des routes
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(contact.router, prefix="/api/contact", tags=["Contact"])
app.include_router(projects.router, prefix="/api/projects", tags=["Projects"])
app.include_router(admin.router, prefix="/api/admin", tags=["Administration"])

@app.on_event("startup")
async def startup_event():
    """Initialisation de la base de données au démarrage"""
    await init_db()

@app.get("/", response_class=HTMLResponse)
async def serve_homepage():
    """Servir la page d'accueil"""
    with open("../index.html", "r", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())

@app.get("/pages/{page_name}", response_class=HTMLResponse)
async def serve_page(page_name: str):
    """Servir les pages HTML"""
    page_path = Path(f"../pages/{page_name}")
    if page_path.exists():
        with open(page_path, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    raise HTTPException(status_code=404, detail="Page non trouvée")

@app.get("/health")
async def health_check():
    """Endpoint de santé pour monitoring"""
    return {"status": "healthy", "service": "Vulsoft API"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)