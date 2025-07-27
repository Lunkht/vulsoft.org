# API d'Authentification Vulsoft

Une solution d'authentification propriétaire complète pour les applications Vulsoft.

## Fonctionnalités

- ✅ Inscription et connexion utilisateur
- ✅ Hachage sécurisé des mots de passe (bcrypt)
- ✅ Authentification JWT avec refresh tokens
- ✅ Gestion des rôles (utilisateur/administrateur)
- ✅ Protection contre les attaques par force brute
- ✅ Validation des données d'entrée
- ✅ Interface d'administration
- ✅ Base de données SQLite intégrée
- ✅ Sécurité renforcée (CORS, Helmet, Rate Limiting)

## Installation

### Prérequis

- Node.js 16+ 
- npm ou yarn

### Configuration

1. **Installer les dépendances**
   ```bash
   cd api
   npm install
   ```

2. **Configurer les variables d'environnement**
   ```bash
   cp .env.example .env
   ```
   
   Modifier le fichier `.env` avec vos valeurs :
   ```env
   PORT=3000
   JWT_SECRET=votre_secret_jwt_super_securise
   JWT_REFRESH_SECRET=votre_secret_refresh_super_securise
   DATABASE_PATH=./vulsoft_auth.db
   CORS_ORIGIN=http://localhost:8080
   ```

3. **Créer un administrateur**
   ```bash
   node create-admin.js
   ```

4. **Démarrer le serveur**
   ```bash
   # Mode développement
   npm run dev
   
   # Mode production
   npm start
   ```

## API Endpoints

### Authentification

#### POST `/api/auth/register`
Inscription d'un nouvel utilisateur.

**Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "motdepasse123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Utilisateur créé avec succès",
  "user": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### POST `/api/auth/login`
Connexion utilisateur.

**Body:**
```json
{
  "email": "john@example.com",
  "password": "motdepasse123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "user": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### POST `/api/auth/refresh`
Renouvellement du token d'accès.

**Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### POST `/api/auth/logout`
Déconnexion utilisateur (invalidation du refresh token).

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Profil utilisateur

#### GET `/api/user/profile`
Récupération du profil utilisateur.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

#### PUT `/api/user/profile`
Mise à jour du profil utilisateur.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith"
}
```

### Administration (Accès admin requis)

#### GET `/api/admin/users`
Liste des utilisateurs avec pagination.

**Query Parameters:**
- `page` (optionnel): Numéro de page (défaut: 1)
- `limit` (optionnel): Nombre d'éléments par page (défaut: 10)
- `search` (optionnel): Terme de recherche

#### GET `/api/admin/stats`
Statistiques de l'application.

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalUsers": 150,
    "activeUsers": 142,
    "newUsersToday": 5,
    "loginAttemptsToday": 89
  }
}
```

## Client JavaScript

### Utilisation de base

```javascript
// Initialisation
const auth = new VulsoftAuth({
    apiUrl: 'http://localhost:3000/api',
    onAuthStateChanged: (user) => {
        if (user) {
            console.log('Utilisateur connecté:', user);
        } else {
            console.log('Utilisateur déconnecté');
        }
    }
});

// Inscription
try {
    const result = await auth.register({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'motdepasse123'
    });
    console.log('Inscription réussie:', result);
} catch (error) {
    console.error('Erreur inscription:', error.message);
}

// Connexion
try {
    const result = await auth.login('john@example.com', 'motdepasse123');
    console.log('Connexion réussie:', result);
} catch (error) {
    console.error('Erreur connexion:', error.message);
}

// Vérification de l'état d'authentification
if (auth.isAuthenticated()) {
    const user = auth.getCurrentUser();
    console.log('Utilisateur actuel:', user);
}

// Vérification des droits admin
if (auth.isAdmin()) {
    console.log('Utilisateur administrateur');
}

// Déconnexion
await auth.logout();
```

### Interface utilisateur

```javascript
// Initialisation de l'interface
const authUI = new VulsoftAuthUI(auth);

// L'interface se met à jour automatiquement selon l'état d'authentification
```

## Sécurité

### Mesures implémentées

- **Hachage des mots de passe** : bcrypt avec 12 rounds
- **JWT sécurisés** : Tokens d'accès courts (15 min) et refresh tokens longs (7 jours)
- **Rate limiting** : 100 requêtes par 15 minutes par IP
- **Validation des données** : express-validator pour tous les inputs
- **CORS configuré** : Origine autorisée uniquement
- **Headers de sécurité** : Helmet.js
- **Protection CSRF** : Tokens JWT avec vérification

### Recommandations

1. **Variables d'environnement** : Utilisez des secrets forts et uniques
2. **HTTPS** : Déployez toujours en HTTPS en production
3. **Base de données** : Sauvegardez régulièrement la base SQLite
4. **Logs** : Surveillez les tentatives de connexion suspectes
5. **Mise à jour** : Maintenez les dépendances à jour

## Structure de la base de données

### Table `users`

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    isActive BOOLEAN DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    lastLogin DATETIME
);
```

### Table `refresh_tokens`

```sql
CREATE TABLE refresh_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT UNIQUE NOT NULL,
    userId INTEGER NOT NULL,
    expiresAt DATETIME NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users (id)
);
```

## Développement

### Scripts disponibles

```bash
# Démarrage en mode développement
npm run dev

# Démarrage en production
npm start

# Tests
npm test

# Création d'un admin
node create-admin.js
```

### Tests

```bash
# Installer les dépendances de test
npm install --save-dev jest supertest

# Lancer les tests
npm test
```

## Déploiement

### Variables d'environnement de production

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=votre_secret_production_tres_securise
JWT_REFRESH_SECRET=votre_secret_refresh_production_tres_securise
DATABASE_PATH=/var/lib/vulsoft/vulsoft_auth.db
CORS_ORIGIN=https://votre-domaine.com
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### Avec PM2

```bash
# Installation de PM2
npm install -g pm2

# Démarrage
pm2 start server.js --name "vulsoft-auth"

# Monitoring
pm2 monit

# Logs
pm2 logs vulsoft-auth
```

## Support

Pour toute question ou problème :

1. Vérifiez les logs du serveur
2. Consultez la documentation
3. Contactez l'équipe Vulsoft

## Licence

Propriétaire - Vulsoft Inc.