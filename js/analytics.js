/**
 * Vulsoft Analytics Tracker
 * Un système de suivi simple et respectueux de la vie privée.
 */
class AnalyticsTracker {
    constructor(apiUrl) {
        this.apiUrl = apiUrl || 'http://localhost:8001/api';
        this.sessionId = this.getSessionId();
        this.auth = new VulsoftAuth(); // Utilise le client d'auth existant
        this.enabled = true; // Peut être contrôlé par un cookie de consentement
    }

    /**
     * Récupère ou génère un ID de session unique.
     */
    getSessionId() {
        let sessionId = sessionStorage.getItem('vulsoft_session_id');
        if (!sessionId) {
            sessionId = `sid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            sessionStorage.setItem('vulsoft_session_id', sessionId);
        }
        return sessionId;
    }

    /**
     * Envoie un événement de suivi au backend.
     * @param {string} eventType - Le type d'événement (ex: 'pageview', 'click').
     * @param {object} details - Données supplémentaires sur l'événement.
     */
    async track(eventType, details = {}) {
        if (!this.enabled) return;

        const payload = {
            session_id: this.sessionId,
            event_type: eventType,
            url: window.location.pathname + window.location.search,
            details: {
                ...details,
                referrer: document.referrer,
                screenWidth: window.innerWidth,
            }
        };

        try {
            // Utilise la méthode `request` de VulsoftAuth pour inclure le token JWT si disponible
            await this.auth.request('/analytics/track', {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            // Ne pas bloquer l'utilisateur si le tracking échoue
            console.warn('Analytics tracking failed:', error.message);
        }
    }

    /**
     * Initialise le suivi pour la page actuelle.
     */
    initPageTracking() {
        // Suivi de la vue de la page
        this.track('pageview');

        // Suivi des clics sur les éléments marqués
        document.body.addEventListener('click', (e) => {
            const trackableElement = e.target.closest('[data-track-click]');
            if (trackableElement) {
                const eventName = trackableElement.dataset.trackClick;
                this.track('click', {
                    element: eventName,
                    tag: trackableElement.tagName,
                    text: trackableElement.textContent.trim().slice(0, 50)
                });
            }
        });
    }
}

// Initialisation automatique du tracker
document.addEventListener('DOMContentLoaded', () => {
    window.vulsoftTracker = new AnalyticsTracker();
    window.vulsoftTracker.initPageTracking();
});