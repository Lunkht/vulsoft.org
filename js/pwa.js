// Gestionnaire PWA pour Vulsoft
class PWAManager {
    constructor() {
        this.deferredPrompt = null;
        this.isInstalled = false;
        this.swRegistration = null;
        this.init();
    }

    async init() {
        // Vérifier le support PWA
        if (!this.isPWASupported()) {
            console.log('📱 PWA non supporté sur ce navigateur');
            return;
        }

        // Enregistrer le Service Worker
        await this.registerServiceWorker();
        
        // Configurer les événements PWA
        this.setupPWAEvents();
        
        // Vérifier si déjà installé
        this.checkInstallStatus();
        
        // Configurer les notifications
        this.setupNotifications();
        
        // Afficher le statut PWA
        this.showPWAStatus();
    }

    isPWASupported() {
        return 'serviceWorker' in navigator && 'PushManager' in window;
    }

    async registerServiceWorker() {
        try {
            this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });
            
            console.log('✅ Service Worker enregistré:', this.swRegistration.scope);
            
            // Écouter les mises à jour
            this.swRegistration.addEventListener('updatefound', () => {
                const newWorker = this.swRegistration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        this.showUpdateAvailable();
                    }
                });
            });
            
        } catch (error) {
            console.error('❌ Erreur Service Worker:', error);
        }
    }

    setupPWAEvents() {
        // Événement d'installation PWA
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('📱 PWA: Prompt d\'installation disponible');
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });

        // Événement après installation
        window.addEventListener('appinstalled', () => {
            console.log('🎉 PWA: Application installée');
            this.isInstalled = true;
            this.hideInstallButton();
            this.showInstallSuccess();
        });

        // Détection du mode standalone
        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('📱 PWA: Mode standalone détecté');
            this.isInstalled = true;
            document.body.classList.add('pwa-standalone');
        }
    }

    checkInstallStatus() {
        // Vérifier si l'app est déjà installée
        if (window.navigator.standalone || 
            window.matchMedia('(display-mode: standalone)').matches) {
            this.isInstalled = true;
            document.body.classList.add('pwa-installed');
        }
    }

    async setupNotifications() {
        if (!('Notification' in window)) {
            console.log('🔔 Notifications non supportées');
            return;
        }

        // Vérifier les permissions
        if (Notification.permission === 'default') {
            this.showNotificationPrompt();
        } else if (Notification.permission === 'granted') {
            await this.subscribeToPush();
        }
    }

    showInstallButton() {
        // Créer le bouton d'installation s'il n'existe pas
        let installBtn = document.getElementById('pwa-install-btn');
        if (!installBtn) {
            installBtn = document.createElement('button');
            installBtn.id = 'pwa-install-btn';
            installBtn.className = 'pwa-install-button';
            installBtn.innerHTML = `
                <span class="install-icon">📱</span>
                <span>Installer l'App</span>
            `;
            installBtn.addEventListener('click', () => this.installPWA());
            
            // Ajouter le bouton dans la navigation ou en bas de page
            const nav = document.querySelector('.nav-actions');
            if (nav) {
                nav.appendChild(installBtn);
            } else {
                document.body.appendChild(installBtn);
            }
        }
        
        installBtn.style.display = 'flex';
        
        // Ajouter les styles CSS
        this.addInstallButtonStyles();
    }

    hideInstallButton() {
        const installBtn = document.getElementById('pwa-install-btn');
        if (installBtn) {
            installBtn.style.display = 'none';
        }
    }

    async installPWA() {
        if (!this.deferredPrompt) {
            console.log('❌ Prompt d\'installation non disponible');
            return;
        }

        try {
            // Afficher le prompt d'installation
            this.deferredPrompt.prompt();
            
            // Attendre la réponse de l'utilisateur
            const { outcome } = await this.deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                console.log('✅ PWA: Installation acceptée');
                window.notifications?.success('Application en cours d\'installation...');
            } else {
                console.log('❌ PWA: Installation refusée');
            }
            
            this.deferredPrompt = null;
            
        } catch (error) {
            console.error('❌ Erreur installation PWA:', error);
        }
    }

    showInstallSuccess() {
        window.notifications?.success('🎉 Application installée avec succès !', {
            duration: 5000
        });
        
        // Masquer le bouton d'installation
        this.hideInstallButton();
    }

    showUpdateAvailable() {
        window.notifications?.info('🔄 Mise à jour disponible', {
            duration: 0,
            actions: [
                {
                    label: 'Mettre à jour',
                    handler: 'updatePWA()'
                },
                {
                    label: 'Plus tard',
                    handler: 'dismissUpdate()'
                }
            ]
        });
    }

    showNotificationPrompt() {
        // Créer une notification personnalisée pour demander la permission
        const notificationPrompt = document.createElement('div');
        notificationPrompt.className = 'notification-prompt';
        notificationPrompt.innerHTML = `
            <div class="notification-prompt-content">
                <div class="notification-prompt-icon">🔔</div>
                <div class="notification-prompt-text">
                    <h4>Activer les notifications</h4>
                    <p>Recevez des notifications pour les nouveaux messages et mises à jour.</p>
                </div>
                <div class="notification-prompt-actions">
                    <button class="btn-secondary" onclick="dismissNotificationPrompt()">Plus tard</button>
                    <button class="btn-primary" onclick="enableNotifications()">Activer</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(notificationPrompt);
        this.addNotificationPromptStyles();
        
        // Animation d'entrée
        setTimeout(() => {
            notificationPrompt.classList.add('show');
        }, 100);
    }

    async enableNotifications() {
        try {
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
                console.log('✅ Notifications autorisées');
                window.notifications?.success('Notifications activées !');
                await this.subscribeToPush();
            } else {
                console.log('❌ Notifications refusées');
                window.notifications?.warning('Notifications désactivées');
            }
            
        } catch (error) {
            console.error('❌ Erreur notifications:', error);
        }
        
        this.dismissNotificationPrompt();
    }

    async subscribeToPush() {
        if (!this.swRegistration) {
            console.log('❌ Service Worker non disponible pour les notifications push');
            return;
        }

        try {
            // Clé publique VAPID (à générer en production)
            const vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa40HI80NM9f4LUjqukYiLdyS-FgS5Q0w-1gFybHV-6f7JjVJvpSrtBKHKiF4o';
            
            const subscription = await this.swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
            });
            
            console.log('✅ Abonnement push créé:', subscription);
            
            // Envoyer l'abonnement au serveur (à implémenter)
            // await this.sendSubscriptionToServer(subscription);
            
        } catch (error) {
            console.error('❌ Erreur abonnement push:', error);
        }
    }

    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    dismissNotificationPrompt() {
        const prompt = document.querySelector('.notification-prompt');
        if (prompt) {
            prompt.classList.remove('show');
            setTimeout(() => prompt.remove(), 300);
        }
    }

    showPWAStatus() {
        // Afficher un indicateur discret du statut PWA
        const statusIndicator = document.createElement('div');
        statusIndicator.className = 'pwa-status-indicator';
        statusIndicator.innerHTML = this.isInstalled ? '📱 App' : '🌐 Web';
        statusIndicator.title = this.isInstalled ? 'Mode Application' : 'Mode Navigateur';
        
        document.body.appendChild(statusIndicator);
        this.addStatusIndicatorStyles();
    }

    addInstallButtonStyles() {
        if (document.getElementById('pwa-install-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'pwa-install-styles';
        styles.textContent = `
            .pwa-install-button {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.75rem 1rem;
                background: var(--accent-color);
                color: white;
                border: none;
                border-radius: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 0.875rem;
                box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
            }
            
            .pwa-install-button:hover {
                background: var(--text-secondary);
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
            }
            
            .install-icon {
                font-size: 1rem;
            }
            
            @media (max-width: 768px) {
                .pwa-install-button {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    z-index: 1000;
                    border-radius: 50px;
                    padding: 1rem 1.5rem;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    addNotificationPromptStyles() {
        if (document.getElementById('notification-prompt-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'notification-prompt-styles';
        styles.textContent = `
            .notification-prompt {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                background: white;
                border-radius: 16px;
                box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                border: 1px solid var(--border-color);
                max-width: 400px;
                transform: translateX(100%);
                transition: transform 0.3s ease;
            }
            
            .notification-prompt.show {
                transform: translateX(0);
            }
            
            .notification-prompt-content {
                padding: 1.5rem;
                display: flex;
                align-items: flex-start;
                gap: 1rem;
            }
            
            .notification-prompt-icon {
                font-size: 2rem;
                flex-shrink: 0;
            }
            
            .notification-prompt-text h4 {
                margin: 0 0 0.5rem 0;
                color: var(--text-primary);
                font-size: 1rem;
            }
            
            .notification-prompt-text p {
                margin: 0;
                color: var(--text-secondary);
                font-size: 0.875rem;
                line-height: 1.4;
            }
            
            .notification-prompt-actions {
                display: flex;
                gap: 0.5rem;
                margin-top: 1rem;
            }
            
            .notification-prompt-actions button {
                padding: 0.5rem 1rem;
                border: none;
                border-radius: 8px;
                font-size: 0.875rem;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .btn-primary {
                background: var(--accent-color);
                color: white;
            }
            
            .btn-secondary {
                background: var(--bg-secondary);
                color: var(--text-primary);
                border: 1px solid var(--border-color);
            }
        `;
        document.head.appendChild(styles);
    }

    addStatusIndicatorStyles() {
        if (document.getElementById('pwa-status-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'pwa-status-styles';
        styles.textContent = `
            .pwa-status-indicator {
                position: fixed;
                bottom: 20px;
                left: 20px;
                background: var(--card-bg);
                border: 1px solid var(--border-color);
                padding: 0.5rem 0.75rem;
                border-radius: 20px;
                font-size: 0.75rem;
                color: var(--text-secondary);
                z-index: 1000;
                backdrop-filter: blur(10px);
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            
            .pwa-installed .pwa-status-indicator {
                background: var(--accent-color);
                color: white;
            }
        `;
        document.head.appendChild(styles);
    }
}

// Fonctions globales pour les événements
window.enableNotifications = function() {
    window.pwaManager?.enableNotifications();
};

window.dismissNotificationPrompt = function() {
    window.pwaManager?.dismissNotificationPrompt();
};

window.updatePWA = function() {
    if (window.pwaManager?.swRegistration) {
        window.pwaManager.swRegistration.waiting?.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
    }
};

window.dismissUpdate = function() {
    // Fermer la notification de mise à jour
    console.log('Mise à jour reportée');
};

// Initialisation automatique
document.addEventListener('DOMContentLoaded', () => {
    window.pwaManager = new PWAManager();
});