const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'vulsoft_secret_key_2024';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'vulsoft_refresh_secret_2024';

// Configuration de la base de données SQLite
const dbPath = path.join(__dirname, 'vulsoft_auth.db');
const db = new sqlite3.Database(dbPath);

// Initialisation de la base de données
db.serialize(() => {
    // Table des utilisateurs
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        firstName TEXT,
        lastName TEXT,
        role TEXT DEFAULT 'user',
        isActive BOOLEAN DEFAULT 1,
        emailVerified BOOLEAN DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        lastLogin DATETIME
    )`);

    // Table des tokens de rafraîchissement
    db.run(`CREATE TABLE IF NOT EXISTS refresh_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        token TEXT UNIQUE NOT NULL,
        expiresAt DATETIME NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users (id)
    )`);

    // Table des sessions
    db.run(`CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        sessionToken TEXT UNIQUE NOT NULL,
        ipAddress TEXT,
        userAgent TEXT,
        expiresAt DATETIME NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users (id)
    )`);

    // Table des tentatives de connexion
    db.run(`CREATE TABLE IF NOT EXISTS login_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT,
        ipAddress TEXT,
        success BOOLEAN,
        attemptedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// Middlewares de sécurité
app.use(helmet());
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'https://vulsoft.com'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 tentatives par IP
    message: { error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false
});

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Trop de requêtes. Réessayez plus tard.' }
});

app.use('/api/auth', authLimiter);
app.use('/api', generalLimiter);

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token d\'accès requis' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token invalide ou expiré' });
        }
        req.user = user;
        next();
    });
};

// Middleware d'autorisation admin
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Accès administrateur requis' });
    }
    next();
};

// Fonctions utilitaires
const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '15m' }
    );
    
    const refreshToken = jwt.sign(
        { id: user.id, type: 'refresh' },
        JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );
    
    return { accessToken, refreshToken };
};

const logLoginAttempt = (email, ipAddress, success) => {
    db.run(
        'INSERT INTO login_attempts (email, ipAddress, success) VALUES (?, ?, ?)',
        [email, ipAddress, success]
    );
};

// Routes d'authentification

// Inscription
app.post('/api/auth/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
    body('firstName').trim().isLength({ min: 2, max: 50 }),
    body('lastName').trim().isLength({ min: 2, max: 50 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Données invalides', 
                details: errors.array() 
            });
        }

        const { email, password, firstName, lastName } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;

        // Vérifier si l'utilisateur existe déjà
        db.get('SELECT id FROM users WHERE email = ?', [email], async (err, row) => {
            if (err) {
                console.error('Erreur base de données:', err);
                return res.status(500).json({ error: 'Erreur serveur' });
            }

            if (row) {
                logLoginAttempt(email, ipAddress, false);
                return res.status(409).json({ error: 'Un compte avec cet email existe déjà' });
            }

            // Hasher le mot de passe
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Créer l'utilisateur
            db.run(
                'INSERT INTO users (email, password, firstName, lastName) VALUES (?, ?, ?, ?)',
                [email, hashedPassword, firstName, lastName],
                function(err) {
                    if (err) {
                        console.error('Erreur création utilisateur:', err);
                        return res.status(500).json({ error: 'Erreur lors de la création du compte' });
                    }

                    logLoginAttempt(email, ipAddress, true);
                    res.status(201).json({ 
                        message: 'Compte créé avec succès',
                        userId: this.lastID 
                    });
                }
            );
        });
    } catch (error) {
        console.error('Erreur inscription:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Connexion
app.post('/api/auth/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Email ou mot de passe invalide' });
        }

        const { email, password } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'];

        // Récupérer l'utilisateur
        db.get(
            'SELECT * FROM users WHERE email = ? AND isActive = 1',
            [email],
            async (err, user) => {
                if (err) {
                    console.error('Erreur base de données:', err);
                    return res.status(500).json({ error: 'Erreur serveur' });
                }

                if (!user) {
                    logLoginAttempt(email, ipAddress, false);
                    return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
                }

                // Vérifier le mot de passe
                const isValidPassword = await bcrypt.compare(password, user.password);
                if (!isValidPassword) {
                    logLoginAttempt(email, ipAddress, false);
                    return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
                }

                // Générer les tokens
                const { accessToken, refreshToken } = generateTokens(user);

                // Sauvegarder le refresh token
                const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours
                db.run(
                    'INSERT INTO refresh_tokens (userId, token, expiresAt) VALUES (?, ?, ?)',
                    [user.id, refreshToken, refreshExpiresAt.toISOString()]
                );

                // Mettre à jour la dernière connexion
                db.run(
                    'UPDATE users SET lastLogin = CURRENT_TIMESTAMP WHERE id = ?',
                    [user.id]
                );

                logLoginAttempt(email, ipAddress, true);

                res.json({
                    message: 'Connexion réussie',
                    accessToken,
                    refreshToken,
                    user: {
                        id: user.id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        role: user.role
                    }
                });
            }
        );
    } catch (error) {
        console.error('Erreur connexion:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Rafraîchir le token
app.post('/api/auth/refresh', (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh token requis' });
    }

    // Vérifier si le token existe en base
    db.get(
        'SELECT rt.*, u.email, u.role FROM refresh_tokens rt JOIN users u ON rt.userId = u.id WHERE rt.token = ? AND rt.expiresAt > datetime(\'now\')',
        [refreshToken],
        (err, tokenData) => {
            if (err) {
                console.error('Erreur base de données:', err);
                return res.status(500).json({ error: 'Erreur serveur' });
            }

            if (!tokenData) {
                return res.status(403).json({ error: 'Refresh token invalide ou expiré' });
            }

            // Vérifier le token JWT
            jwt.verify(refreshToken, JWT_REFRESH_SECRET, (err, decoded) => {
                if (err) {
                    // Supprimer le token invalide
                    db.run('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
                    return res.status(403).json({ error: 'Refresh token invalide' });
                }

                // Générer un nouveau access token
                const newAccessToken = jwt.sign(
                    { id: tokenData.userId, email: tokenData.email, role: tokenData.role },
                    JWT_SECRET,
                    { expiresIn: '15m' }
                );

                res.json({ accessToken: newAccessToken });
            });
        }
    );
});

// Déconnexion
app.post('/api/auth/logout', authenticateToken, (req, res) => {
    const { refreshToken } = req.body;

    if (refreshToken) {
        // Supprimer le refresh token
        db.run('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
    }

    res.json({ message: 'Déconnexion réussie' });
});

// Profil utilisateur
app.get('/api/user/profile', authenticateToken, (req, res) => {
    db.get(
        'SELECT id, email, firstName, lastName, role, emailVerified, createdAt, lastLogin FROM users WHERE id = ?',
        [req.user.id],
        (err, user) => {
            if (err) {
                console.error('Erreur base de données:', err);
                return res.status(500).json({ error: 'Erreur serveur' });
            }

            if (!user) {
                return res.status(404).json({ error: 'Utilisateur non trouvé' });
            }

            res.json({ user });
        }
    );
});

// Mettre à jour le profil
app.put('/api/user/profile', authenticateToken, [
    body('firstName').optional().trim().isLength({ min: 2, max: 50 }),
    body('lastName').optional().trim().isLength({ min: 2, max: 50 })
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Données invalides', details: errors.array() });
    }

    const { firstName, lastName } = req.body;
    const updates = [];
    const values = [];

    if (firstName) {
        updates.push('firstName = ?');
        values.push(firstName);
    }
    if (lastName) {
        updates.push('lastName = ?');
        values.push(lastName);
    }

    if (updates.length === 0) {
        return res.status(400).json({ error: 'Aucune donnée à mettre à jour' });
    }

    updates.push('updatedAt = CURRENT_TIMESTAMP');
    values.push(req.user.id);

    db.run(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        values,
        function(err) {
            if (err) {
                console.error('Erreur mise à jour profil:', err);
                return res.status(500).json({ error: 'Erreur lors de la mise à jour' });
            }

            res.json({ message: 'Profil mis à jour avec succès' });
        }
    );
});

// Routes d'administration

// Lister tous les utilisateurs (admin seulement)
app.get('/api/admin/users', authenticateToken, requireAdmin, (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    db.all(
        'SELECT id, email, firstName, lastName, role, isActive, emailVerified, createdAt, lastLogin FROM users ORDER BY createdAt DESC LIMIT ? OFFSET ?',
        [limit, offset],
        (err, users) => {
            if (err) {
                console.error('Erreur base de données:', err);
                return res.status(500).json({ error: 'Erreur serveur' });
            }

            // Compter le total
            db.get('SELECT COUNT(*) as total FROM users', (err, count) => {
                if (err) {
                    console.error('Erreur base de données:', err);
                    return res.status(500).json({ error: 'Erreur serveur' });
                }

                res.json({
                    users,
                    pagination: {
                        page,
                        limit,
                        total: count.total,
                        pages: Math.ceil(count.total / limit)
                    }
                });
            });
        }
    );
});

// Statistiques (admin seulement)
app.get('/api/admin/stats', authenticateToken, requireAdmin, (req, res) => {
    const queries = {
        totalUsers: 'SELECT COUNT(*) as count FROM users',
        activeUsers: 'SELECT COUNT(*) as count FROM users WHERE isActive = 1',
        newUsersToday: 'SELECT COUNT(*) as count FROM users WHERE date(createdAt) = date(\'now\')',
        loginAttemptsToday: 'SELECT COUNT(*) as count FROM login_attempts WHERE date(attemptedAt) = date(\'now\')'
    };

    const stats = {};
    let completed = 0;
    const total = Object.keys(queries).length;

    Object.entries(queries).forEach(([key, query]) => {
        db.get(query, (err, result) => {
            if (err) {
                console.error(`Erreur statistique ${key}:`, err);
                stats[key] = 0;
            } else {
                stats[key] = result.count;
            }
            
            completed++;
            if (completed === total) {
                res.json({ stats });
            }
        });
    });
});

// Route de test
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'API Vulsoft Auth fonctionnelle',
        timestamp: new Date().toISOString()
    });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
    console.error('Erreur non gérée:', err);
    res.status(500).json({ error: 'Erreur serveur interne' });
});

// Route 404
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route non trouvée' });
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`🚀 Serveur API Vulsoft Auth démarré sur le port ${PORT}`);
    console.log(`📊 Base de données: ${dbPath}`);
    console.log(`🔒 Mode: ${process.env.NODE_ENV || 'development'}`);
});

// Nettoyage gracieux
process.on('SIGINT', () => {
    console.log('\n🛑 Arrêt du serveur...');
    db.close((err) => {
        if (err) {
            console.error('Erreur fermeture base de données:', err);
        } else {
            console.log('✅ Base de données fermée.');
        }
        process.exit(0);
    });
});

module.exports = app;