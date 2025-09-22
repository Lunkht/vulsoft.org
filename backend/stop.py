#!/usr/bin/env python3
"""
Script pour arrêter le serveur Vulsoft API
"""

import os
import signal
import psutil

def stop_server():
    """Arrêter le serveur FastAPI"""
    
    print("🛑 Arrêt du serveur Vulsoft API...")
    
    # Chercher les processus Python qui utilisent le port 8001
    for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
        try:
            if proc.info['name'] == 'python' or proc.info['name'] == 'python3':
                cmdline = ' '.join(proc.info['cmdline'] or [])
                if 'start.py' in cmdline or 'main:app' in cmdline:
                    print(f"📍 Processus trouvé: PID {proc.info['pid']}")
                    proc.terminate()
                    proc.wait(timeout=5)
                    print("✅ Serveur arrêté avec succès")
                    return
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
    
    print("ℹ️  Aucun serveur Vulsoft en cours d'exécution")

if __name__ == "__main__":
    stop_server()