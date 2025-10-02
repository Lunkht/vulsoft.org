#!/usr/bin/env python3
"""
Script de démarrage pour l'API Vulsoft
Usage: python start.py
"""

import uvicorn
import os
from pathlib import Path

def main():
    """Démarrer le serveur FastAPI"""
    
    # Configuration du serveur
    config = {
        "app": "main:app",
        "host": "0.0.0.0",
        "port": 8002,
        "reload": True,  # Rechargement automatique en développement
        "log_level": "info"
    }
    
    print("🚀 Démarrage du serveur Vulsoft API...")
    print(f"📍 URL: http://localhost:{config['port']}")
    print(f"📚 Documentation: http://localhost:{config['port']}/docs")
    print("🔄 Mode rechargement automatique activé")
    print("\n" + "="*50)
    
    # Démarrer le serveur
    uvicorn.run(**config)

if __name__ == "__main__":
    main()