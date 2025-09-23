/**
 * Vulsoft Internationalization (i18n) Manager
 */
class I18nManager {
    constructor(options = {}) {
        this.supportedLanguages = options.supportedLanguages || ['fr', 'en'];
        this.defaultLanguage = options.defaultLanguage || 'fr';
        this.currentLanguage = this.getLanguage();
        this.translations = {};
        this.init();
    }

    async init() {
        await this.loadTranslations(this.currentLanguage);
        this.translatePage();
        this.setupLanguageSwitcher();
    }

    getLanguage() {
        const savedLang = localStorage.getItem('vulsoft_lang');
        if (savedLang && this.supportedLanguages.includes(savedLang)) {
            return savedLang;
        }

        const browserLang = navigator.language.split('-')[0];
        if (this.supportedLanguages.includes(browserLang)) {
            return browserLang;
        }

        return this.defaultLanguage;
    }

    async loadTranslations(lang) {
        try {
            // Adjust path for pages in subdirectories
            const path = window.location.pathname.includes('/pages/') ? '../locales' : 'locales';
            const response = await fetch(`${path}/${lang}.json`);
            if (!response.ok) {
                throw new Error(`Could not load translation file for ${lang}`);
            }
            this.translations = await response.json();
            document.documentElement.lang = lang;
        } catch (error) {
            console.error('I18n Error:', error);
            // Fallback to default language
            if (lang !== this.defaultLanguage) {
                await this.loadTranslations(this.defaultLanguage);
            }
        }
    }

    translatePage() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.getTranslation(key);
            if (translation) {
                // Check for attributes to translate, e.g., data-i18n-placeholder
                const placeholderKey = element.getAttribute('data-i18n-placeholder');
                if (placeholderKey) {
                    const placeholderTranslation = this.getTranslation(placeholderKey);
                    if (placeholderTranslation) {
                        element.placeholder = placeholderTranslation;
                    }
                }
                
                // Translate innerHTML
                element.innerHTML = translation;
            }
        });
    }

    getTranslation(key) {
        return key.split('.').reduce((obj, i) => (obj ? obj[i] : null), this.translations);
    }

    async switchLanguage(lang) {
        if (!this.supportedLanguages.includes(lang)) return;
        this.currentLanguage = lang;
        localStorage.setItem('vulsoft_lang', lang);
        await this.loadTranslations(lang);
        this.translatePage();
        this.updateSwitcherUI();
    }

    setupLanguageSwitcher() {
        document.querySelectorAll('.language-switcher').forEach(switcher => {
            switcher.innerHTML = `
                <button id="lang-fr" onclick="window.i18nManager.switchLanguage('fr')">FR</button>
                 / 
                <button id="lang-en" onclick="window.i18nManager.switchLanguage('en')">EN</button>
            `;
        });
        this.updateSwitcherUI();
    }
    
    updateSwitcherUI() {
        document.querySelectorAll('.language-switcher button').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.getElementById(`lang-${this.currentLanguage}`);
        if (activeBtn) activeBtn.classList.add('active');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.i18nManager = new I18nManager();

    // Handle footer newsletter form
    const footerNewsletterForm = document.getElementById('footer-newsletter-form');
    if (footerNewsletterForm) {
        footerNewsletterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailInput = footerNewsletterForm.querySelector('input[name="email"]');
            const email = emailInput.value.trim();
            if (!email) return;

            try {
                const api = new VulsoftAPI(); // Assumes js/api.js is loaded
                const response = await api.subscribeNewsletter(email);
                window.notifications?.success(response.message || "Merci pour votre abonnement !");
                emailInput.value = '';
            } catch (error) {
                window.notifications?.error(error.message || "Une erreur est survenue.");
            }
        });
    }
});