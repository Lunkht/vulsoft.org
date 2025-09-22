// API Client moderne pour Vulsoft
class VulsoftAPI {
    constructor(baseURL = 'http://localhost:8001/api') {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('vulsoft_token');
    }

    // Méthode générique pour les requêtes
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        // Ajouter le token d'authentification si disponible
        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Erreur API');
            }

            return data;
        } catch (error) {
            console.error('Erreur API:', error);
            throw error;
        }
    }

    // Méthodes pour l'authentification
    async login(username, password) {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);

        const response = await this.request('/auth/token', {
            method: 'POST',
            headers: {},
            body: formData,
        });

        this.token = response.access_token;
        localStorage.setItem('vulsoft_token', this.token);
        return response;
    }

    async register(userData) {
        return await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    }

    async getCurrentUser() {
        return await this.request('/auth/me');
    }

    logout() {
        this.token = null;
        localStorage.removeItem('vulsoft_token');
    }

    // Méthodes pour le contact
    async submitContactForm(contactData) {
        return await this.request('/contact/submit', {
            method: 'POST',
            body: JSON.stringify(contactData),
        });
    }

    async getContactMessages(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return await this.request(`/contact/messages?${queryString}`);
    }

    // Méthodes pour les projets
    async getProjects(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return await this.request(`/projects?${queryString}`);
    }

    async createProject(projectData) {
        return await this.request('/projects', {
            method: 'POST',
            body: JSON.stringify(projectData),
        });
    }

    async getProjectStats() {
        return await this.request('/projects/stats/overview');
    }

    async updateProject(projectId, projectData) {
        return await this.request(`/projects/${projectId}`, {
            method: 'PUT',
            body: JSON.stringify(projectData),
        });
    }

    async deleteProject(projectId) {
        return await this.request(`/projects/${projectId}`, {
            method: 'DELETE',
        });
    }
}

// Instance globale de l'API
window.vulsoftAPI = new VulsoftAPI();

// Utilitaires pour les formulaires
class FormHandler {
    constructor(formSelector, apiMethod) {
        this.form = document.querySelector(formSelector);
        this.apiMethod = apiMethod;
        this.init();
    }

    init() {
        if (this.form) {
            this.form.addEventListener('submit', this.handleSubmit.bind(this));
        }
    }

    async handleSubmit(event) {
        event.preventDefault();
        
        const submitButton = this.form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        
        try {
            // Désactiver le bouton et changer le texte
            submitButton.disabled = true;
            submitButton.textContent = 'Envoi en cours...';
            
            // Collecter les données du formulaire
            const formData = new FormData(this.form);
            const data = Object.fromEntries(formData.entries());
            
            // Convertir les checkboxes en booléens
            Object.keys(data).forEach(key => {
                const input = this.form.querySelector(`[name="${key}"]`);
                if (input && input.type === 'checkbox') {
                    data[key] = input.checked;
                }
            });
            
            // Envoyer les données via l'API
            const response = await this.apiMethod(data);
            
            // Afficher le message de succès
            this.showMessage(response.message, 'success');
            
            // Réinitialiser le formulaire
            this.form.reset();
            
        } catch (error) {
            this.showMessage(error.message, 'error');
        } finally {
            // Réactiver le bouton
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    }

    showMessage(message, type) {
        // Créer ou mettre à jour le message
        let messageEl = this.form.querySelector('.form-message');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.className = 'form-message';
            this.form.appendChild(messageEl);
        }
        
        messageEl.textContent = message;
        messageEl.className = `form-message ${type}`;
        
        // Faire disparaître le message après 5 secondes
        setTimeout(() => {
            messageEl.remove();
        }, 5000);
    }
}

// Utilitaires modernes
class UIUtils {
    static showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type} fade-in`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${this.getIcon(type)}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Styles inline pour les notifications
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
            padding: 1rem;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            backdrop-filter: blur(10px);
        `;
        
        const colors = {
            success: 'background: rgba(16, 185, 129, 0.9); color: white;',
            error: 'background: rgba(239, 68, 68, 0.9); color: white;',
            warning: 'background: rgba(245, 158, 11, 0.9); color: white;',
            info: 'background: rgba(59, 130, 246, 0.9); color: white;'
        };
        
        notification.style.cssText += colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }
    
    static getIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }
    
    static addLoadingState(button) {
        const originalText = button.textContent;
        button.disabled = true;
        button.innerHTML = `<span class="loading-spinner"></span> <span class="loading-dots">Chargement</span>`;
        
        return () => {
            button.disabled = false;
            button.textContent = originalText;
        };
    }
    
    static animateOnScroll() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('slide-up');
                }
            });
        }, { threshold: 0.1 });
        
        document.querySelectorAll('.service-card, .pricing-card, .faq-item').forEach(el => {
            observer.observe(el);
        });
    }
}

// Gestionnaire de formulaire amélioré
class EnhancedFormHandler extends FormHandler {
    constructor(formSelector, apiMethod, options = {}) {
        super(formSelector, apiMethod);
        this.options = {
            showNotifications: true,
            validateOnInput: true,
            autoSave: false,
            ...options
        };
        
        if (this.options.validateOnInput) {
            this.addRealTimeValidation();
        }
        
        if (this.options.autoSave) {
            this.addAutoSave();
        }
    }
    
    addRealTimeValidation() {
        if (!this.form) return;
        
        const inputs = this.form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
    }
    
    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let message = '';
        
        // Validation email
        if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                message = 'Format email invalide';
            }
        }
        
        // Validation téléphone
        if (field.type === 'tel' && value) {
            const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;
            if (!phoneRegex.test(value)) {
                isValid = false;
                message = 'Format téléphone invalide';
            }
        }
        
        // Validation champs requis
        if (field.required && !value) {
            isValid = false;
            message = 'Ce champ est requis';
        }
        
        this.showFieldValidation(field, isValid, message);
        return isValid;
    }
    
    showFieldValidation(field, isValid, message) {
        // Supprimer l'ancien message
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) existingError.remove();
        
        // Styles du champ
        if (isValid) {
            field.style.borderColor = '#10b981';
        } else {
            field.style.borderColor = '#ef4444';
            
            // Ajouter le message d'erreur
            const errorEl = document.createElement('div');
            errorEl.className = 'field-error';
            errorEl.textContent = message;
            errorEl.style.cssText = `
                color: #ef4444;
                font-size: 0.875rem;
                margin-top: 0.25rem;
                animation: fadeIn 0.3s ease-out;
            `;
            field.parentNode.appendChild(errorEl);
        }
    }
    
    clearFieldError(field) {
        field.style.borderColor = '';
        const errorEl = field.parentNode.querySelector('.field-error');
        if (errorEl) errorEl.remove();
    }
    
    async handleSubmit(event) {
        event.preventDefault();
        
        const submitButton = this.form.querySelector('button[type="submit"]');
        const resetLoading = UIUtils.addLoadingState(submitButton);
        
        try {
            // Validation complète
            const inputs = this.form.querySelectorAll('input[required], textarea[required], select[required]');
            let isFormValid = true;
            
            inputs.forEach(input => {
                if (!this.validateField(input)) {
                    isFormValid = false;
                }
            });
            
            if (!isFormValid) {
                throw new Error('Veuillez corriger les erreurs dans le formulaire');
            }
            
            // Collecter les données
            const formData = new FormData(this.form);
            const data = Object.fromEntries(formData.entries());
            
            // Convertir les checkboxes
            Object.keys(data).forEach(key => {
                const input = this.form.querySelector(`[name="${key}"]`);
                if (input && input.type === 'checkbox') {
                    data[key] = input.checked;
                }
            });
            
            // Envoyer via l'API
            const response = await this.apiMethod(data);
            
            // Notification de succès
            if (this.options.showNotifications) {
                window.notifications?.success(response.message || 'Opération réussie');
            }
            
            // Réinitialiser le formulaire
            this.form.reset();
            
            // Nettoyer les validations
            this.form.querySelectorAll('input, textarea, select').forEach(field => {
                this.clearFieldError(field);
            });
            
        } catch (error) {
            if (this.options.showNotifications) {
                window.notifications?.error(error.message);
            }
        } finally {
            resetLoading();
        }
    }
}

// Initialisation automatique des formulaires
document.addEventListener('DOMContentLoaded', () => {
    // Formulaire de contact avec validation avancée
    new EnhancedFormHandler('#contact-form', 
        (data) => window.vulsoftAPI.submitContactForm(data),
        { validateOnInput: true, showNotifications: true }
    );
    
    // Formulaire de connexion
    new EnhancedFormHandler('#login-form', async (data) => {
        const response = await window.vulsoftAPI.login(data.username, data.password);
        if (response.success) {
            UIUtils.showNotification('Connexion réussie ! Redirection...', 'success');
            setTimeout(() => window.location.href = '/', 2000);
        }
        return response;
    });
    
    // Formulaire d'inscription
    new EnhancedFormHandler('#signup-form', 
        (data) => window.vulsoftAPI.register(data),
        { validateOnInput: true }
    );
    
    // Animations au scroll
    UIUtils.animateOnScroll();
    
    // Indicateur de statut du serveur
    addServerStatusIndicator();
});

// Indicateur de statut du serveur
async function addServerStatusIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'server-status';
    indicator.className = 'status-indicator loading';
    indicator.innerHTML = `
        <span class="status-dot pulse"></span>
        <span>Vérification du serveur...</span>
    `;
    indicator.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
        backdrop-filter: blur(10px);
    `;
    
    document.body.appendChild(indicator);
    
    // Vérifier le statut
    try {
        const response = await fetch('http://localhost:8001/health');
        if (response.ok) {
            indicator.className = 'status-indicator online';
            indicator.innerHTML = `
                <span class="status-dot"></span>
                <span>API en ligne</span>
            `;
        } else {
            throw new Error('Server error');
        }
    } catch {
        indicator.className = 'status-indicator offline';
        indicator.innerHTML = `
            <span class="status-dot"></span>
            <span>API hors ligne</span>
        `;
    }
    
    // Masquer après 5 secondes
    setTimeout(() => {
        indicator.style.opacity = '0';
        setTimeout(() => indicator.remove(), 300);
    }, 5000);
}