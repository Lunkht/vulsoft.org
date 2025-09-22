# 🚀 Vulsoft API Backend

Backend moderne en Python/FastAPI pour le site Vulsoft.

## ✨ Fonctionnalités

- **API REST moderne** avec FastAPI
- **Authentification JWT** sécurisée
- **Base de données SQLite** (facilement extensible)
- **Validation automatique** des données avec Pydantic
- **Documentation interactive** générée automatiquement
- **CORS configuré** pour le développement

## 🛠 Installation

### 1. Créer un environnement virtuel Python

```bash
# Créer l'environnement virtuel
python -m venv venv

# Activer l'environnement (Linux/Mac)
source venv/bin/activate

# Activer l'environnement (Windows)
venv\Scripts\activate
```

### 2. Installer les dépendances

```bash
pip install -r requirements.txt
```

### 3. Démarrer le serveur

```bash
# Option 1: Avec le script de démarrage
python start.py

# Option 2: Directement avec uvicorn
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 📚 Documentation

Une fois le serveur démarré, accédez à :

- **API Documentation**: http://localhost:8000/docs
- **Alternative docs**: http://localhost:8000/redoc
- **Health check**: http://localhost:8000/health

## 🔗 Endpoints principaux

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/token` - Connexion
- `GET /api/auth/me` - Profil utilisateur

### Contact
- `POST /api/contact/submit` - Soumettre formulaire de contact
- `GET /api/contact/messages` - Lister les messages (admin)

### Projets
- `GET /api/projects` - Lister les projets
- `POST /api/projects` - Créer un projet
- `GET /api/projects/stats/overview` - Statistiques

## 🗄 Base de données

La base de données SQLite est créée automatiquement au premier démarrage dans le fichier `vulsoft.db`.

### Tables créées :
- `users` - Utilisateurs du système
- `contact_messages` - Messages de contact
- `projects` - Projets de l'entreprise

## 🔧 Configuration

### Variables d'environnement (optionnelles)

Créez un fichier `.env` dans le dossier backend :

```env
DATABASE_URL=sqlite:///./vulsoft.db
SECRET_KEY=votre-clé-secrète-très-sécurisée
```

## 🚀 Déploiement

### Production avec Gunicorn

```bash
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Docker (optionnel)

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 🔒 Sécurité

- Mots de passe hashés avec bcrypt
- Tokens JWT avec expiration
- Validation des données avec Pydantic
- CORS configuré pour la production

## 📝 Utilisation avec le Frontend

Le fichier `js/api.js` contient un client JavaScript moderne qui se connecte automatiquement à cette API. Les formulaires sont gérés automatiquement.

## 🐛 Dépannage

### Erreur de port déjà utilisé
```bash
# Trouver le processus utilisant le port 8000
lsof -i :8000

# Tuer le processus
kill -9 <PID>
```

### Problème de base de données
```bash
# Supprimer la base de données pour la recréer
rm vulsoft.db
```

## 📞 Support

Pour toute question ou problème, contactez l'équipe Vulsoft.