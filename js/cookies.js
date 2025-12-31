/**
 * Vulsoft Cookie Management
 * Handles consent modal, persistence and I18n integration.
 */

class CookieManager {
    constructor() {
        this.storageKey = 'cookieConsent';
        this.init();
    }

    init() {
        const consent = localStorage.getItem(this.storageKey);
        if (!consent) {
            this.showModal();
        }
    }

    showModal() {
        const modalHtml = `
            <div id="cookie-overlay" class="cookie-overlay">
                <div class="cookie-modal">
                    <div class="cookie-logo">
                        <img src="images/logo-Vulsoft-1.svg" alt="Vulsoft Logo">
                    </div>
                    <h2 data-i18n="cookies.title">Votre choix pour vos données</h2>
                    <p class="cookie-desc" data-i18n="cookies.desc1">Pour mettre le site et l'application mobile de Vulsoft à votre disposition nous utilisons des cookies ou technologies similaires qui nous permettent de collecter des informations sur votre appareil.</p>
                    <p class="cookie-desc" data-i18n="cookies.desc2">Certaines de ces technologies sont nécessaires pour faire fonctionner nos services correctement : vous ne pouvez pas les refuser. D'autres sont optionnelles mais contribuent à faciliter votre expérience de lecture et d'une certaine façon à soutenir Vulsoft : vous pouvez à tout moment donner ou retirer votre consentement.</p>
                    <div class="cookie-question" data-i18n="cookies.question">Acceptez-vous que Vulsoft emploie des cookies ou technologies similaires utiles à son fonctionnement ?</div>
                    
                    <div class="cookie-buttons">
                        <button type="button" class="cookie-btn cookie-btn-refuse" id="cookie-refuse" data-i18n="cookies.refuse">Refuser</button>
                        <button type="button" class="cookie-btn cookie-btn-accept" id="cookie-accept" data-i18n="cookies.accept">Accepter</button>
                    </div>
                    
                    <a class="cookie-settings" data-i18n="cookies.settings">Affiner mes choix</a>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const overlay = document.getElementById('cookie-overlay');
        const acceptBtn = document.getElementById('cookie-accept');
        const refuseBtn = document.getElementById('cookie-refuse');

        // Apply translations if I18nManager is available
        if (window.i18nManager) {
            window.i18nManager.translatePage();
        }

        // Show with animation
        setTimeout(() => overlay.classList.add('active'), 100);

        acceptBtn.addEventListener('click', () => this.handleConsent('accepted'));
        refuseBtn.addEventListener('click', () => this.handleConsent('refused'));
    }

    handleConsent(type) {
        localStorage.setItem(this.storageKey, type);
        const overlay = document.getElementById('cookie-overlay');
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.cookieManager = new CookieManager();
});
