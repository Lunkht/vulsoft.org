// Configuration Firebase (à personnaliser avec vos informations de projet)
const firebaseConfig = {
    apiKey: "VOTRE_API_KEY",
    authDomain: "VOTRE_AUTH_DOMAIN",
    projectId: "VOTRE_PROJECT_ID",
    appId: "VOTRE_APP_ID"
};

// Initialisation Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Éléments DOM
const authTabs = document.querySelectorAll('.auth-tab');
const loginFormWrapper = document.getElementById('login-form-wrapper');
const registerFormWrapper = document.getElementById('register-form-wrapper');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

// Gestion des onglets
authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;
        
        // Mise à jour des onglets actifs
        authTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Affichage du bon formulaire
        if (targetTab === 'login') {
            loginFormWrapper.classList.add('active');
            registerFormWrapper.classList.remove('active');
        } else {
            registerFormWrapper.classList.add('active');
            loginFormWrapper.classList.remove('active');
        }
    });
});

// Fonction pour afficher les messages d'erreur
function showError(message, formType = 'login') {
    // Supprimer les anciens messages d'erreur
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Créer le nouveau message d'erreur
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
        background: #fee;
        color: #c53030;
        padding: 0.75rem;
        border-radius: 6px;
        margin-bottom: 1rem;
        font-size: 0.9rem;
        border: 1px solid #fed7d7;
    `;
    errorDiv.textContent = message;
    
    // Insérer le message au début du formulaire approprié
    const targetForm = formType === 'login' ? loginForm : registerForm;
    targetForm.insertBefore(errorDiv, targetForm.firstChild);
    
    // Supprimer automatiquement après 5 secondes
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 5000);
}

// Fonction pour afficher les messages de succès
function showSuccess(message, formType = 'login') {
    // Supprimer les anciens messages
    const existingMessage = document.querySelector('.success-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Créer le nouveau message de succès
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.style.cssText = `
        background: #f0fff4;
        color: #2d7d32;
        padding: 0.75rem;
        border-radius: 6px;
        margin-bottom: 1rem;
        font-size: 0.9rem;
        border: 1px solid #c6f6d5;
    `;
    successDiv.textContent = message;
    
    // Insérer le message au début du formulaire approprié
    const targetForm = formType === 'login' ? loginForm : registerForm;
    targetForm.insertBefore(successDiv, targetForm.firstChild);
    
    // Supprimer automatiquement après 5 secondes
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.remove();
        }
    }, 5000);
}

// Fonction pour valider l'email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Fonction pour valider le mot de passe
function isValidPassword(password) {
    return password.length >= 6;
}

// Gestion de la connexion
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('remember-me').checked;
    
    // Validation côté client
    if (!email || !password) {
        showError('Veuillez remplir tous les champs.', 'login');
        return;
    }
    
    if (!isValidEmail(email)) {
        showError('Veuillez entrer une adresse email valide.', 'login');
        return;
    }
    
    // Désactiver le bouton pendant la connexion
    const submitButton = loginForm.querySelector('.auth-button');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Connexion...';
    submitButton.disabled = true;
    
    try {
        // Connexion avec Firebase
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        
        // Gestion de "Se souvenir de moi"
        if (rememberMe) {
            await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        } else {
            await auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
        }
        
        showSuccess('Connexion réussie ! Redirection en cours...', 'login');
        
        // Redirection après connexion réussie
        setTimeout(() => {
            window.location.href = '../index.html'; // Ajustez selon votre structure
        }, 1500);
        
    } catch (error) {
        let errorMessage = 'Une erreur est survenue lors de la connexion.';
        
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'Aucun compte trouvé avec cette adresse email.';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Mot de passe incorrect.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Adresse email invalide.';
                break;
            case 'auth/user-disabled':
                errorMessage = 'Ce compte a été désactivé.';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Trop de tentatives. Veuillez réessayer plus tard.';
                break;
        }
        
        showError(errorMessage, 'login');
    } finally {
        // Réactiver le bouton
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
});

// Gestion de l'inscription
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const acceptTerms = document.getElementById('accept-terms').checked;
    
    // Validation côté client
    if (!name || !email || !password || !confirmPassword) {
        showError('Veuillez remplir tous les champs.', 'register');
        return;
    }
    
    if (!isValidEmail(email)) {
        showError('Veuillez entrer une adresse email valide.', 'register');
        return;
    }
    
    if (!isValidPassword(password)) {
        showError('Le mot de passe doit contenir au moins 6 caractères.', 'register');
        return;
    }
    
    if (password !== confirmPassword) {
        showError('Les mots de passe ne correspondent pas.', 'register');
        return;
    }
    
    if (!acceptTerms) {
        showError('Vous devez accepter les conditions d\'utilisation.', 'register');
        return;
    }
    
    // Désactiver le bouton pendant l'inscription
    const submitButton = registerForm.querySelector('.auth-button');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Création du compte...';
    submitButton.disabled = true;
    
    try {
        // Création du compte avec Firebase
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        // Mise à jour du profil utilisateur avec le nom
        await userCredential.user.updateProfile({
            displayName: name
        });
        
        showSuccess('Compte créé avec succès ! Vous pouvez maintenant vous connecter.', 'register');
        
        // Réinitialiser le formulaire
        registerForm.reset();
        
        // Basculer vers l'onglet de connexion après 2 secondes
        setTimeout(() => {
            document.querySelector('[data-tab="login"]').click();
        }, 2000);
        
    } catch (error) {
        let errorMessage = 'Une erreur est survenue lors de la création du compte.';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'Cette adresse email est déjà utilisée.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Adresse email invalide.';
                break;
            case 'auth/weak-password':
                errorMessage = 'Le mot de passe est trop faible.';
                break;
            case 'auth/operation-not-allowed':
                errorMessage = 'La création de compte est temporairement désactivée.';
                break;
        }
        
        showError(errorMessage, 'register');
    } finally {
        // Réactiver le bouton
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
});

// Gestion de la connexion avec Google
document.querySelector('.social-button.google').addEventListener('click', async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    
    try {
        const result = await auth.signInWithPopup(provider);
        showSuccess('Connexion avec Google réussie ! Redirection en cours...', 'login');
        
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 1500);
        
    } catch (error) {
        let errorMessage = 'Erreur lors de la connexion avec Google.';
        
        if (error.code === 'auth/popup-closed-by-user') {
            errorMessage = 'Connexion annulée.';
        } else if (error.code === 'auth/popup-blocked') {
            errorMessage = 'Popup bloquée. Veuillez autoriser les popups pour ce site.';
        }
        
        showError(errorMessage, 'login');
    }
});

// Gestion du lien "Mot de passe oublié"
document.querySelector('.forgot-password').addEventListener('click', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    
    if (!email) {
        showError('Veuillez entrer votre adresse email d\'abord.', 'login');
        return;
    }
    
    if (!isValidEmail(email)) {
        showError('Veuillez entrer une adresse email valide.', 'login');
        return;
    }
    
    try {
        await auth.sendPasswordResetEmail(email);
        showSuccess('Email de réinitialisation envoyé ! Vérifiez votre boîte de réception.', 'login');
    } catch (error) {
        let errorMessage = 'Erreur lors de l\'envoi de l\'email de réinitialisation.';
        
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'Aucun compte trouvé avec cette adresse email.';
        }
        
        showError(errorMessage, 'login');
    }
});

// Vérification de l'état d'authentification
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log('Utilisateur connecté:', user.displayName || user.email);
        // L'utilisateur est déjà connecté, rediriger si nécessaire
        // window.location.href = '../index.html';
    } else {
        console.log('Utilisateur non connecté');
    }
}); 