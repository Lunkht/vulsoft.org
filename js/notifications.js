// Système de notifications modernes pour Vulsoft
class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.container = null;
        this.init();
    }

    init() {
        // Créer le conteneur de notifications
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            pointer-events: none;
        `;
        document.body.appendChild(this.container);
    }

    show(message, type = 'info', options = {}) {
        const notification = new Notification(message, type, options);
        this.notifications.push(notification);
        this.container.appendChild(notification.element);
        
        // Auto-remove après la durée spécifiée
        setTimeout(() => {
            this.remove(notification);
        }, options.duration || 5000);

        return notification;
    }

    remove(notification) {
        const index = this.notifications.indexOf(notification);
        if (index > -1) {
            this.notifications.splice(index, 1);
            notification.remove();
        }
    }

    success(message, options = {}) {
        return this.show(message, 'success', options);
    }

    error(message, options = {}) {
        return this.show(message, 'error', options);
    }

    warning(message, options = {}) {
        return this.show(message, 'warning', options);
    }

    info(message, options = {}) {
        return this.show(message, 'info', options);
    }

    loading(message, options = {}) {
        return this.show(message, 'loading', { ...options, duration: 0 });
    }
}

class Notification {
    constructor(message, type, options = {}) {
        this.message = message;
        this.type = type;
        this.options = {
            duration: 5000,
            closable: true,
            actions: [],
            ...options
        };
        this.element = this.createElement();
        this.animate();
    }

    createElement() {
        const notification = document.createElement('div');
        notification.className = `notification notification-${this.type}`;
        
        const styles = this.getStyles();
        notification.style.cssText = styles.base;

        const icon = this.getIcon();
        const actionsHtml = this.options.actions.length > 0 
            ? `<div class="notification-actions">${this.options.actions.map(action => 
                `<button class="notification-action" onclick="${action.handler}">${action.label}</button>`
              ).join('')}</div>`
            : '';

        notification.innerHTML = `
            <div class="notification-content" style="${styles.content}">
                <div class="notification-header" style="${styles.header}">
                    <span class="notification-icon" style="${styles.icon}">${icon}</span>
                    <span class="notification-message" style="${styles.message}">${this.message}</span>
                    ${this.options.closable ? `<button class="notification-close" style="${styles.close}" onclick="this.closest('.notification').remove()">×</button>` : ''}
                </div>
                ${actionsHtml}
            </div>
        `;

        // Ajouter les événements
        notification.addEventListener('mouseenter', () => {
            notification.style.transform = 'translateX(-5px) scale(1.02)';
        });

        notification.addEventListener('mouseleave', () => {
            notification.style.transform = 'translateX(0) scale(1)';
        });

        return notification;
    }

    getStyles() {
        const colors = {
            success: {
                bg: 'linear-gradient(135deg, #10b981, #059669)',
                border: '#10b981',
                text: '#ffffff'
            },
            error: {
                bg: 'linear-gradient(135deg, #ef4444, #dc2626)',
                border: '#ef4444',
                text: '#ffffff'
            },
            warning: {
                bg: 'linear-gradient(135deg, #f59e0b, #d97706)',
                border: '#f59e0b',
                text: '#ffffff'
            },
            info: {
                bg: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                border: '#3b82f6',
                text: '#ffffff'
            },
            loading: {
                bg: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                border: '#6366f1',
                text: '#ffffff'
            }
        };

        const color = colors[this.type] || colors.info;

        return {
            base: `
                background: ${color.bg};
                color: ${color.text};
                border: 1px solid ${color.border};
                border-radius: 12px;
                box-shadow: 0 8px 25px rgba(0,0,0,0.15), 0 3px 10px rgba(0,0,0,0.1);
                backdrop-filter: blur(10px);
                margin-bottom: 10px;
                max-width: 400px;
                min-width: 300px;
                pointer-events: auto;
                transform: translateX(100%);
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                opacity: 0;
            `,
            content: `
                padding: 1rem 1.25rem;
            `,
            header: `
                display: flex;
                align-items: center;
                gap: 0.75rem;
            `,
            icon: `
                font-size: 1.25rem;
                flex-shrink: 0;
            `,
            message: `
                flex: 1;
                font-weight: 500;
                line-height: 1.4;
            `,
            close: `
                background: rgba(255,255,255,0.2);
                border: none;
                color: inherit;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1rem;
                transition: background 0.2s ease;
                flex-shrink: 0;
            `
        };
    }

    getIcon() {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
            loading: '<div class="loading-spinner" style="width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite;"></div>'
        };
        return icons[this.type] || icons.info;
    }

    animate() {
        // Animation d'entrée
        requestAnimationFrame(() => {
            this.element.style.transform = 'translateX(0)';
            this.element.style.opacity = '1';
        });
    }

    remove() {
        // Animation de sortie
        this.element.style.transform = 'translateX(100%)';
        this.element.style.opacity = '0';
        
        setTimeout(() => {
            if (this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
            }
        }, 400);
    }
}

// Instance globale
window.notifications = new NotificationSystem();

// Ajouter les styles CSS pour les animations
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    .notification-action {
        background: rgba(255,255,255,0.2);
        border: 1px solid rgba(255,255,255,0.3);
        color: inherit;
        padding: 0.5rem 1rem;
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 500;
        transition: all 0.2s ease;
        margin-top: 0.75rem;
        margin-right: 0.5rem;
    }
    
    .notification-action:hover {
        background: rgba(255,255,255,0.3);
        transform: translateY(-1px);
    }
    
    .notification-close:hover {
        background: rgba(255,255,255,0.3) !important;
    }
`;
document.head.appendChild(style);