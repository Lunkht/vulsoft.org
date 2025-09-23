/**
 * Client d'authentification Vulsoft
 * API propriétaire pour la gestion des utilisateurs avec JWT et Refresh Tokens
 */

class VulsoftAuth {
    constructor(options = {}) {
        this.apiUrl = options.apiUrl || 'http://localhost:3000/api';
        this.tokenKey = options.tokenKey || 'vulsoft_access_token';
        this.refreshTokenKey = options.refreshTokenKey || 'vulsoft_refresh_token';
        this.userKey = options.userKey || 'vulsoft_user';
        
        // Événements
        this.onAuthStateChanged = options.onAuthStateChanged || null;
        this.onTokenRefreshed = options.onTokenRefreshed || null;
        
        // Auto-refresh des tokens
        this.autoRefresh = options.autoRefresh !== false;
        this.refreshInterval = null;
        
        // Initialiser l'état d'authentification
        this.init();
    }
    
    /**
     * Initialisation du client
     */
    init() {
        // Vérifier si l'utilisateur est connecté
        const token = this.getAccessToken();
        const user = this.getCurrentUser();
        
        if (token && user) {
            this.startAutoRefresh();
            if (this.onAuthStateChanged) {
                this.onAuthStateChanged(user);
            }
        }
    }
    
    /**
     * Effectuer une requête HTTP avec gestion d'erreurs
     */
    async request(endpoint, options = {}) {
        const url = `${this.apiUrl}${endpoint}`;
        const config = {
            headers: {
                ...options.headers
            },
            ...options
        };
        
        if (!(options.body instanceof FormData)) {
            config.headers['Content-Type'] = config.headers['Content-Type'] || 'application/json';
        }
        
        // Ajouter le token d'authentification si disponible
        const token = this.getAccessToken();
        if (token && !config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                // Tentative de refresh si token expiré (401 Unauthorized ou 403 Forbidden)
                if ((response.status === 401 || response.status === 403) && this.getRefreshToken()) {
                    const refreshed = await this.refreshAccessToken();
                    if (refreshed) {
                        // Retry la requête avec le nouveau token
                        config.headers.Authorization = `Bearer ${this.getAccessToken()}`;
                        const retryResponse = await fetch(url, config);
                        const retryData = await retryResponse.json();
                        
                        if (!retryResponse.ok) {
                            throw new Error(retryData.detail || 'Erreur de requête après rafraîchissement');
                        }
                        
                        return retryData;
                    }
                }
                
                throw new Error(data.detail || `Erreur HTTP ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('Erreur requête API:', error);
            throw error;
        }
    }
    
    /**
     * Inscription d'un nouvel utilisateur
     */
    async register(userData) {
        try {
            const response = await this.request('/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
            
            return {
                success: true,
                message: response.message || "Utilisateur créé avec succès",
                user: response.user
            };
        } catch (error) {
            return {
                success: false,
                error: error.message || "Erreur lors de l'inscription"
            };
        }
    }
    
    /**
     * Connexion utilisateur
     */
    async login(email, password) {
        const response = await this.request('/auth/token', {
            method: 'POST',
            body: new URLSearchParams({ 'username': email, 'password': password }),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        if (response.two_factor_required) {
            return {
                success: true,
                two_factor_required: true,
                two_factor_token: response.two_factor_token
            };
        }

        this.setAccessToken(response.access_token);
        this.setRefreshToken(response.refreshToken);
        await this.getProfile();
        this.startAutoRefresh();

        if (this.onAuthStateChanged) {
            this.onAuthStateChanged(this.getCurrentUser());
        }

        return {
            success: true,
            user: this.getCurrentUser(),
            two_factor_required: false
        };
    }

    /**
     * Connexion avec code 2FA
     */
    async loginWith2FA(twoFactorToken, otpCode) {
        const response = await this.request('/auth/token/2fa', {
            method: 'POST',
            body: JSON.stringify({
                two_factor_token: twoFactorToken,
                otp_code: otpCode
            })
        });

        this.setAccessToken(response.access_token);
        this.setRefreshToken(response.refreshToken);
        await this.getProfile();
        this.startAutoRefresh();

        if (this.onAuthStateChanged) {
            this.onAuthStateChanged(this.getCurrentUser());
        }

        return {
            success: true,
            user: this.getCurrentUser()
        };
    }
    
    /**
     * Déconnexion utilisateur
     */
    async logout() {
        try {
            const refreshToken = this.getRefreshToken();
            
            if (refreshToken) {
                await this.request('/auth/logout', {
                    method: 'POST',
                    body: JSON.stringify({ refreshToken })
                });
            }
        } catch (error) {
            console.warn('Erreur lors de la déconnexion:', error.message);
        } finally {
            // Nettoyer le stockage local
            this.clearAuthData();
            
            // Arrêter le refresh automatique
            this.stopAutoRefresh();
            
            // Notifier le changement d'état
            if (this.onAuthStateChanged) {
                this.onAuthStateChanged(null);
            }
        }
    }
    
    /**
     * Rafraîchir le token d'accès
     */
    async refreshAccessToken() {
        try {
            const refreshToken = this.getRefreshToken();
            if (!refreshToken) {
                throw new Error('Aucun refresh token disponible');
            }
            
            const response = await this.request('/auth/refresh-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${refreshToken}`
                }
            });
            
            this.setAccessToken(response.access_token);
            
            if (this.onTokenRefreshed) {
                this.onTokenRefreshed(response.accessToken);
            }
            
            return true;
        } catch (error) {
            console.error('Erreur refresh token:', error.message);
            // Token de refresh invalide, déconnecter l'utilisateur
            await this.logout();
            return false;
        }
    }
    
    /**
     * Obtenir le profil utilisateur
     */
    async getProfile() {
        try { // L'endpoint /me est souvent utilisé pour ça
            const user = await this.request('/auth/me');
            
            // Mettre à jour les informations utilisateur stockées
            this.setCurrentUser(user);
            
            return {
                success: true,
                user: response.user
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Mettre à jour le profil utilisateur
     */
    async updateProfile(userData) {
        try {
            const response = await this.request('/user/profile', {
                method: 'PUT',
                body: JSON.stringify(userData)
            });
            
            // Recharger le profil mis à jour
            await this.getProfile();
            
            return {
                success: true,
                message: response.message
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // --- 2FA Methods ---
    async generate2FASecret() {
        return await this.request('/2fa/generate', { method: 'POST' });
    }

    async enable2FA(otpCode) {
        return await this.request('/2fa/enable', {
            method: 'POST',
            body: JSON.stringify({ otp_code: otpCode })
        });
    }

    async disable2FA(password) {
        return await this.request('/2fa/disable', {
            method: 'POST',
            body: JSON.stringify({ password: password })
        });
    }

    async login(email, password) {
        try {
            const response = await this.request('/auth/token', { // Endpoint standard pour obtenir un token
                method: 'POST',
                body: new URLSearchParams({ 'username': email, 'password': password }),
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
            
            // Check if 2FA is required
            if (response.two_factor_required) {
                return {
                    success: true,
                    two_factor_required: true,
                    two_factor_token: response.two_factor_token
                };
            }

            // Stocker les tokens et les informations utilisateur
            this.setAccessToken(response.access_token);
            this.setRefreshToken(response.refreshToken);
            await this.getProfile(); // Récupérer le profil après connexion

            // Démarrer le refresh automatique
            this.startAutoRefresh();
            
            // Notifier le changement d'état
            if (this.onAuthStateChanged) {
                this.onAuthStateChanged(this.getCurrentUser());
            }
            
            return {
                success: true,
                user: this.getCurrentUser(),
                message: response.message,
                two_factor_required: false
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Vérifier si l'utilisateur est connecté
     */
    isAuthenticated() {
        const token = this.getAccessToken();
        const user = this.getCurrentUser();
        return !!(token && user);
    }
    
    /**
     * Vérifier si l'utilisateur est administrateur
     */
    isAdmin() {
        const user = this.getCurrentUser();
        return user && user.role === 'admin';
    }
    
    /**
     * Démarrer le refresh automatique des tokens
     */
    startAutoRefresh() {
        if (!this.autoRefresh || this.refreshInterval) return;
        
        // Refresh toutes les 25 minutes (le token expire en 30 min par défaut)
        this.refreshInterval = setInterval(async () => {
            if (this.isAuthenticated()) {
                console.log('🔄 Tentative de rafraîchissement du token...');
                await this.refreshAccessToken();
            }
        }, 25 * 60 * 1000);
    }
    
    /**
     * Arrêter le refresh automatique
     */
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }
    
    /**
     * Gestion du stockage local
     */
    setAccessToken(token) {
        localStorage.setItem(this.tokenKey, token);
    }
    
    getAccessToken() {
        return localStorage.getItem(this.tokenKey);
    }
    
    setRefreshToken(token) {
        localStorage.setItem(this.refreshTokenKey, token);
    }
    
    getRefreshToken() {
        return localStorage.getItem(this.refreshTokenKey);
    }
    
    setCurrentUser(user) {
        localStorage.setItem(this.userKey, JSON.stringify(user));
    }
    
    getCurrentUser() {
        const userData = localStorage.getItem(this.userKey);
        return userData ? JSON.parse(userData) : null;
    }
    
    clearAuthData() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.refreshTokenKey);
        localStorage.removeItem(this.userKey);
    }
    
    /**
     * Utilitaires pour les formulaires
     */
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    validatePassword(password) {
        // Au moins 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(password);
    }
    
    getPasswordRequirements() {
        return [
            'Au moins 8 caractères',
            'Une lettre majuscule',
            'Une lettre minuscule',
            'Un chiffre',
            'Un caractère spécial'
        ];
    }
}

// Utilitaires pour l'interface utilisateur
class VulsoftAuthUI {
    constructor(auth) {
        this.auth = auth;
    }
    
    /**
     * Afficher les erreurs dans un élément
     */
    showError(elementId, message) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = message;
            element.style.color = '#ff4d4f';
            element.style.display = 'block';
        }
    }
    
    /**
     * Afficher les messages de succès
     */
    showSuccess(elementId, message) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = message;
            element.style.color = '#3ecf8e';
            element.style.display = 'block';
        }
    }
    
    /**
     * Effacer les messages
     */
    clearMessages(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = '';
            element.style.display = 'none';
        }
    }
    
    /**
     * Gérer un formulaire de connexion
     */
    handleLoginForm(formId, options = {}) {
        const loginForm = document.getElementById(formId);
        if (!loginForm) return;

        const twoFactorFormWrapper = document.getElementById('2fa-form-wrapper');
        const twoFactorForm = document.getElementById('2fa-form');
        const loginFormWrapper = document.getElementById('login-form-wrapper');
        
        let twoFactorToken = null;

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = loginForm.querySelector('[name="username"]').value.trim();
            const password = loginForm.querySelector('[name="password"]').value;
            const errorElement = options.errorElement || 'login-error';
            
            this.clearMessages(errorElement);
            
            try {
                const result = await this.auth.login(email, password);
                
                if (result.two_factor_required) {
                    twoFactorToken = result.two_factor_token;
                    loginFormWrapper.style.display = 'none';
                    twoFactorFormWrapper.style.display = 'block';
                } else {
                    if (options.onSuccess) {
                        options.onSuccess(result.user);
                    }
                }
            } catch (error) {
                this.showError(errorElement, error.message || "Email ou mot de passe incorrect.");
            }
        });

        if (twoFactorForm) {
            twoFactorForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const otpCode = twoFactorForm.querySelector('[name="otp_code"]').value;
                const errorElement = options.errorElement || 'login-error';

                this.clearMessages(errorElement);

                if (!twoFactorToken) {
                    this.showError(errorElement, 'Session 2FA expirée. Veuillez vous reconnecter.');
                    loginFormWrapper.style.display = 'block';
                    twoFactorFormWrapper.style.display = 'none';
                    return;
                }

                try {
                    const result = await this.auth.loginWith2FA(twoFactorToken, otpCode);
                    if (options.onSuccess) {
                        options.onSuccess(result.user);
                    }
                } catch (error) {
                    this.showError(errorElement, error.message || "Code 2FA invalide.");
                    // Vider le champ OTP pour une nouvelle tentative
                    twoFactorForm.querySelector('[name="otp_code"]').value = '';
                }
            });
        }
    }
    
    /**
     * Gérer un formulaire d'inscription
     */
    handleRegisterForm(formId, options = {}) {
        const form = document.getElementById(formId);
        if (!form) return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            // Convertir les champs de formulaire en objet
            const userData = {
                ...Object.fromEntries(formData.entries())
            };
            userData.email = userData.email.trim();
            userData.firstName = userData.firstName.trim();
            userData.lastName = userData.lastName.trim();

            const confirmPassword = formData.get('confirmPassword'); // Assurez-vous que le nom est correct
            const errorElement = options.errorElement || 'register-error';
            const successElement = options.successElement || 'register-success';
            
            this.clearMessages(errorElement);
            this.clearMessages(successElement);
            
            // Validations
            if (!this.auth.validateEmail(userData.email)) {
                this.showError(errorElement, 'Email invalide');
                return;
            }
            
            if (userData.password !== confirmPassword) {
                this.showError(errorElement, 'Les mots de passe ne correspondent pas');
                return;
            }
            
            const result = await this.auth.register(userData);
            
            if (result.success) {
                this.showSuccess(successElement, result.message);
                form.reset();
                
                if (options.onSuccess) {
                    options.onSuccess(result);
                }
            } else {
                this.showError(errorElement, result.error);
            }
        });
    }
    
    /**
     * Mettre à jour l'interface selon l'état d'authentification
     */
    updateAuthState(user) {
        const loginElements = document.querySelectorAll('[data-auth="login"]');
        const logoutElements = document.querySelectorAll('[data-auth="logout"]');
        const userElements = document.querySelectorAll('[data-auth="user"]');
        const adminElements = document.querySelectorAll('[data-auth="admin"]');
        
        if (user) {
            // Utilisateur connecté
            loginElements.forEach(el => el.style.display = 'none');
            logoutElements.forEach(el => el.style.display = 'block');
            userElements.forEach(el => el.style.display = 'block');
            
            // Afficher les éléments admin si nécessaire
            if (user.role === 'admin') {
                adminElements.forEach(el => el.style.display = 'block');
            } else {
                adminElements.forEach(el => el.style.display = 'none');
            }
            
            // Mettre à jour les informations utilisateur
            const userNameElements = document.querySelectorAll('[data-user="name"]');
            const userEmailElements = document.querySelectorAll('[data-user="email"]');
            
            userNameElements.forEach(el => {
                el.textContent = `${user.firstName} ${user.lastName}`;
            });
            
            userEmailElements.forEach(el => {
                el.textContent = user.email;
            });
        } else {
            // Utilisateur déconnecté
            loginElements.forEach(el => el.style.display = 'block');
            logoutElements.forEach(el => el.style.display = 'none');
            userElements.forEach(el => el.style.display = 'none');
            adminElements.forEach(el => el.style.display = 'none');
        }
    }
}

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { VulsoftAuth, VulsoftAuthUI };
} else {
    window.VulsoftAuth = VulsoftAuth;
    window.VulsoftAuthUI = VulsoftAuthUI;
}