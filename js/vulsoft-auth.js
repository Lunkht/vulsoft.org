/**
 * Client d'authentification Vulsoft
 * API propriétaire pour la gestion des utilisateurs
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
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };
        
        // Ajouter le token d'authentification si disponible
        const token = this.getAccessToken();
        if (token && !config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                // Tentative de refresh si token expiré
                if (response.status === 403 && this.getRefreshToken()) {
                    const refreshed = await this.refreshAccessToken();
                    if (refreshed) {
                        // Retry la requête avec le nouveau token
                        config.headers.Authorization = `Bearer ${this.getAccessToken()}`;
                        const retryResponse = await fetch(url, config);
                        const retryData = await retryResponse.json();
                        
                        if (!retryResponse.ok) {
                            throw new Error(retryData.error || 'Erreur de requête');
                        }
                        
                        return retryData;
                    }
                }
                
                throw new Error(data.error || `Erreur HTTP ${response.status}`);
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
                message: response.message,
                userId: response.userId
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Connexion utilisateur
     */
    async login(email, password) {
        try {
            const response = await this.request('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
            
            // Stocker les tokens et les informations utilisateur
            this.setAccessToken(response.accessToken);
            this.setRefreshToken(response.refreshToken);
            this.setCurrentUser(response.user);
            
            // Démarrer le refresh automatique
            this.startAutoRefresh();
            
            // Notifier le changement d'état
            if (this.onAuthStateChanged) {
                this.onAuthStateChanged(response.user);
            }
            
            return {
                success: true,
                user: response.user,
                message: response.message
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
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
            
            const response = await this.request('/auth/refresh', {
                method: 'POST',
                body: JSON.stringify({ refreshToken }),
                headers: {
                    Authorization: '' // Ne pas inclure le token expiré
                }
            });
            
            this.setAccessToken(response.accessToken);
            
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
        try {
            const response = await this.request('/user/profile');
            
            // Mettre à jour les informations utilisateur stockées
            this.setCurrentUser(response.user);
            
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
        
        // Refresh toutes les 10 minutes (token expire dans 15 minutes)
        this.refreshInterval = setInterval(async () => {
            if (this.isAuthenticated()) {
                await this.refreshAccessToken();
            }
        }, 10 * 60 * 1000);
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
            'Un caractère spécial (@$!%*?&)'
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
        const form = document.getElementById(formId);
        if (!form) return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = form.querySelector('[name="email"]').value.trim();
            const password = form.querySelector('[name="password"]').value;
            const errorElement = options.errorElement || 'login-error';
            
            this.clearMessages(errorElement);
            
            if (!this.auth.validateEmail(email)) {
                this.showError(errorElement, 'Email invalide');
                return;
            }
            
            const result = await this.auth.login(email, password);
            
            if (result.success) {
                if (options.onSuccess) {
                    options.onSuccess(result.user);
                } else {
                    this.showSuccess(errorElement, 'Connexion réussie !');
                    setTimeout(() => {
                        window.location.href = options.redirectUrl || '/';
                    }, 1000);
                }
            } else {
                this.showError(errorElement, result.error);
            }
        });
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
            const userData = {
                email: formData.get('email').trim(),
                password: formData.get('password'),
                firstName: formData.get('firstName').trim(),
                lastName: formData.get('lastName').trim()
            };
            
            const confirmPassword = formData.get('confirmPassword');
            const errorElement = options.errorElement || 'register-error';
            const successElement = options.successElement || 'register-success';
            
            this.clearMessages(errorElement);
            this.clearMessages(successElement);
            
            // Validations
            if (!this.auth.validateEmail(userData.email)) {
                this.showError(errorElement, 'Email invalide');
                return;
            }
            
            if (!this.auth.validatePassword(userData.password)) {
                this.showError(errorElement, 'Mot de passe trop faible');
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