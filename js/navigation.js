/**
 * Vulsoft Global Navigation Manager
 * Handles mobile menu toggle, header scroll effects, and smooth scrolling.
 */
class NavigationManager {
    constructor() {
        this.header = document.querySelector('.header');
        this.menuToggle = document.querySelector('.menu-toggle');
        this.navLinks = document.querySelector('.nav-links');
        this.menuOverlay = document.querySelector('.menu-overlay');
        this.init();
    }

    init() {
        this.setupHeaderScroll();
        this.setupMobileMenu();
        this.setupSmoothScroll();
    }

    setupHeaderScroll() {
        if (!this.header) return;

        const handleScroll = () => {
            if (window.scrollY > 50) {
                this.header.classList.add('scrolled');
            } else {
                this.header.classList.remove('scrolled');
            }
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll(); // Initial check
    }

    setupMobileMenu() {
        if (!this.menuToggle || !this.navLinks) return;

        const toggleMenu = (e) => {
            if (e) e.preventDefault();
            const isOpened = this.navLinks.classList.contains('active');

            this.navLinks.classList.toggle('active');
            if (this.menuOverlay) this.menuOverlay.classList.toggle('active');

            // Toggle body scroll
            document.body.style.overflow = !isOpened ? 'hidden' : '';

            // Update icon
            this.updateMenuIcon(!isOpened);
        };

        this.menuToggle.addEventListener('click', toggleMenu);
        if (this.menuOverlay) {
            this.menuOverlay.addEventListener('click', toggleMenu);
        }

        // Close menu when clicking a link
        this.navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (this.navLinks.classList.contains('active')) {
                    toggleMenu();
                }
            });
        });
    }

    updateMenuIcon(isOpened) {
        if (!this.menuToggle) return;

        this.menuToggle.innerHTML = isOpened
            ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
               </svg>`
            : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
               </svg>`;
    }

    setupSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                const href = anchor.getAttribute('href');
                if (href === '#') return;

                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    window.navManager = new NavigationManager();
});
