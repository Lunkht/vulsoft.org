const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const readline = require('readline');

// Configuration
const dbPath = path.join(__dirname, '..', 'vulsoft_auth.db');

// Interface pour saisie utilisateur
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => {
    return new Promise((resolve) => {
        rl.question(query, resolve);
    });
};

const createAdmin = async () => {
    console.log('🔧 Création d\'un utilisateur administrateur Vulsoft\n');
    
    try {
        // Saisie des informations
        const email = await question('📧 Email de l\'administrateur: ');
        const firstName = await question('👤 Prénom: ');
        const lastName = await question('👤 Nom: ');
        const password = await question('🔒 Mot de passe (8+ caractères): ');
        const confirmPassword = await question('🔒 Confirmez le mot de passe: ');
        
        // Validation
        if (!email || !email.includes('@')) {
            console.error('❌ Email invalide');
            process.exit(1);
        }
        
        if (password.length < 8) {
            console.error('❌ Le mot de passe doit contenir au moins 8 caractères');
            process.exit(1);
        }
        
        if (password !== confirmPassword) {
            console.error('❌ Les mots de passe ne correspondent pas');
            process.exit(1);
        }
        
        // Connexion à la base de données
        const db = new sqlite3.Database(dbPath);
        
        // Vérifier si l'utilisateur existe déjà
        const existingUser = await new Promise((resolve, reject) => {
            db.get('SELECT id FROM users WHERE email = ?', [email], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (existingUser) {
            console.error('❌ Un utilisateur avec cet email existe déjà');
            db.close();
            process.exit(1);
        }
        
        // Hasher le mot de passe
        console.log('🔐 Hashage du mot de passe...');
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        // Créer l'administrateur
        await new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO users (email, password, firstName, lastName, role, isActive, emailVerified) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [email, hashedPassword, firstName, lastName, 'admin', 1, 1],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
        
        console.log('\n✅ Administrateur créé avec succès!');
        console.log(`📧 Email: ${email}`);
        console.log(`👤 Nom: ${firstName} ${lastName}`);
        console.log(`🔑 Rôle: Administrateur`);
        console.log('\n🚀 Vous pouvez maintenant vous connecter avec ces identifiants.');
        
        db.close();
        
    } catch (error) {
        console.error('❌ Erreur lors de la création de l\'administrateur:', error.message);
        process.exit(1);
    } finally {
        rl.close();
    }
};

// Vérifier si la base de données existe
const fs = require('fs');
if (!fs.existsSync(dbPath)) {
    console.error('❌ Base de données non trouvée. Exécutez d\'abord "npm run init-db"');
    process.exit(1);
}

createAdmin();