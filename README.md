# 🚀 Vulsoft - Site Web Moderne avec API Backend

Site web professionnel pour Vulsoft avec backend FastAPI moderne.

## ✨ Fonctionnalités

### Frontend
- **Design moderne** inspiré de Spaceship.com
- **Responsive** sur tous les appareils
- **Animations fluides** et micro-interactions
- **Formulaires interactifs** avec validation
- **Pages complètes** : Accueil, Contact, À propos, Académie, Auth

### Backend API
- **FastAPI moderne** avec documentation automatique
- **Base de données SQLite** intégrée
- **Authentification sécurisée** avec hashage des mots de passe
- **API REST complète** pour contact, utilisateurs, projets
- **Validation automatique** des données

## 🛠 Installation et Démarrage

### 1. Prérequis
- Python 3.11+ installé
- Git (optionnel)

### 2. Installation du Backend

```bash
# Aller dans le dossier backend
cd backend

# Créer l'environnement virtuel
python3 -m venv venv

# Activer l'environnement
source venv/bin/activate  # Linux/Mac
# ou venv\Scripts\activate  # Windows

# Installer les dépendances
pip install -r requirements.txt
```

### 3. Démarrage du Serveur

```bash
# Démarrer le serveur (depuis le dossier backend)
python start.py
```

Le serveur sera accessible sur :
- **Site web** : http://localhost:8001
- **Documentation API** : http://localhost:8001/docs
- **API Alternative** : http://localhost:8001/redoc

### 4. Test de l'API

Ouvrez `test-api.html` dans votre navigateur pour tester l'API de contact.

### 5. Arrêt du Serveur

```bash
# Arrêter proprement le serveur
python stop.py
```

## 📁 Structure du Projet

```
vulsoft/
├── index.html              # Page d'accueil
├── test-api.html           # Page de test API
├── pages/                  # Pages du site
│   ├── contact.html        # Page contact
│   ├── about.html          # Page à propos
│   ├── login.html          # Page connexion
│   └── signup.html         # Page inscription
├── css/                    # Styles CSS
│   ├── main.css           # Styles principaux
│   ├── auth.css           # Styles authentification
│   └── about.css          # Styles page à propos
├── js/                     # Scripts JavaScript
│   └── api.js             # Client API moderne
├── images/                 # Images et assets
└── backend/               # Backend FastAPI
    ├── main.py            # Point d'entrée API
    ├── start.py           # Script de démarrage
    ├── stop.py            # Script d'arrêt
    ├── database.py        # Modèles de données
    ├── requirements.txt   # Dépendances Python
    └── routers/           # Routes API
        ├── auth.py        # Authentification
        ├── contact.py     # Gestion contacts
        └── projects.py    # Gestion projets
```

## 🔗 Endpoints API Principaux

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/user/{id}` - Profil utilisateur

### Contact
- `POST /api/contact/submit` - Soumettre formulaire
- `GET /api/contact/messages` - Lister messages (admin)

### Projets
- `GET /api/projects` - Lister projets
- `POST /api/projects` - Créer projet
- `GET /api/projects/stats/overview` - Statistiques

### Système
- `GET /health` - Vérification santé du serveur

## 🎨 Fonctionnalités Frontend

### Design System
- **Typographie** : Inter/SF Pro Display avec font-weight 800
- **Espacement** : Padding généreux (10rem)
- **Bordures** : Arrondies (16-24px)
- **Animations** : Transitions fluides et micro-interactions
- **Couleurs** : Palette moderne avec mode sombre/clair

### Composants
- **Navigation** : Menu responsive avec actions
- **Formulaires** : Validation en temps réel
- **Cartes** : Effets hover et animations
- **Boutons** : États interactifs
- **Messages** : Notifications de succès/erreur

## 🔧 Configuration

### Variables d'environnement (optionnel)
Créez un fichier `.env` dans le dossier backend :

```env
DATABASE_URL=sqlite:///./vulsoft.db
SECRET_KEY=votre-clé-secrète-très-sécurisée
```

### Personnalisation
- **Couleurs** : Modifiez les variables CSS dans `css/main.css`
- **Contenu** : Éditez les fichiers HTML
- **API** : Ajoutez des routes dans `backend/routers/`

## 🚀 Déploiement

### Production avec Gunicorn
```bash
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8001
```

### Docker (optionnel)
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8001
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
```

## 🐛 Dépannage

### Port déjà utilisé
```bash
# Trouver le processus
lsof -i :8001
# Tuer le processus
kill -9 <PID>
```

### Problème de base de données
```bash
# Supprimer et recréer la DB
rm backend/vulsoft.db
# Redémarrer le serveur
```

### Erreurs de dépendances
```bash
# Réinstaller les dépendances
pip install --upgrade -r requirements.txt
```

## 📞 Support

Pour toute question ou problème :
- **Email** : contact@vulsoft.com
- **Documentation API** : http://localhost:8001/docs
- **Test API** : Ouvrir `test-api.html`

## 🎯 Prochaines Étapes

1. **Ajouter l'authentification JWT** complète
2. **Intégrer un service email** pour les notifications
3. **Ajouter des tests automatisés**
4. **Optimiser les performances**
5. **Déployer en production**

---

**Développé avec ❤️ par l'équipe Vulsoft**