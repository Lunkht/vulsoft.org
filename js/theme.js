/**
 * Vulsoft Theme Manager
 * Handles Light, Dark, and System theme switching with persistence.
 */
class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'system';
        this.html = document.documentElement;
        this.init();
    }

    init() {
        this.applyTheme(this.theme);
        this.setupEventListeners();
        this.listenToSystemChanges();
    }

    applyTheme(theme) {
        if (theme === 'system') {
            this.html.removeAttribute('data-theme');
        } else {
            this.html.setAttribute('data-theme', theme);
        }

        // Update UI
        document.querySelectorAll('.theme-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.theme === theme);
        });

        // Update trigger icon based on actual applied theme
        this.updateTriggerIcon();
    }

    setTheme(theme) {
        this.theme = theme;
        localStorage.setItem('theme', theme);
        this.applyTheme(theme);

        // Close dropdown
        const container = document.querySelector('.theme-switcher');
        if (container) container.classList.remove('active');
    }

    updateTriggerIcon() {
        const trigger = document.querySelector('.theme-trigger');
        if (!trigger) return;

        const isDark = this.html.getAttribute('data-theme') === 'dark' ||
            (!this.html.hasAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);

        trigger.innerHTML = isDark
            ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            const trigger = e.target.closest('.theme-trigger');
            const container = e.target.closest('.theme-switcher');
            const option = e.target.closest('.theme-option');

            if (trigger) {
                container.classList.toggle('active');
            } else if (option) {
                this.setTheme(option.dataset.theme);
            } else if (!container) {
                const activeContainer = document.querySelector('.theme-switcher.active');
                if (activeContainer) activeContainer.classList.remove('active');
            }
        });
    }

    listenToSystemChanges() {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (this.theme === 'system') {
                this.updateTriggerIcon();
            }
        });
    }
}

// Initialize theme as soon as possible to avoid flash
(function () {
    const savedTheme = localStorage.getItem('theme') || 'system';
    if (savedTheme !== 'system') {
        document.documentElement.setAttribute('data-theme', savedTheme);
    }
})();

document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
});
