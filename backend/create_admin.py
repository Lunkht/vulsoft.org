#!/usr/bin/env python3
"""
Script pour créer le premier utilisateur administrateur
Usage: python create_admin.py
"""

import requests
import json

def create_admin():
    """Créer le premier administrateur"""
    
    print("🔧 Création du premier administrateur Vulsoft")
    print("=" * 50)
    
    # Demander les informations
    username = input("Nom d'utilisateur admin: ").strip()
    email = input("Email admin: ").strip()
    password = input("Mot de passe admin: ").strip()
    
    if not username or not email or not password:
        print("❌ Tous les champs sont requis")
        return
    
    # Données à envoyer
    data = {
        "username": username,
        "email": email,
        "password": password
    }
    
    try:
        # Envoyer la requête
        response = requests.post(
            "http://localhost:8001/api/admin/create-admin",
            headers={"Content-Type": "application/json"},
            data=json.dumps(data)
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Administrateur créé avec succès !")
            print(f"📧 Email: {email}")
            print(f"👤 Username: {username}")
            print(f"🆔 ID: {result['user_id']}")
            print("\n🌐 Vous pouvez maintenant accéder à l'administration:")
            print("   http://localhost:8001/pages/admin.html")
        else:
            error_data = response.json()
            print(f"❌ Erreur: {error_data.get('detail', 'Erreur inconnue')}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Impossible de se connecter au serveur API")
        print("   Assurez-vous que le serveur est démarré avec: python start.py")
    except Exception as e:
        print(f"❌ Erreur: {e}")

if __name__ == "__main__":
    create_admin()