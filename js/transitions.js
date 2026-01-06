/**
 * Vulsoft Page Transition Manager
 * Handles smooth animations between pages.
 */
class PageTransitionManager {
    constructor() {
        this.overlay = null;
        this.shutter = null;
        this.init();
    }

    init() {
        // Create transition elements
        this.createElements();
        
        // Handle initial page reveal
        window.addEventListener('load', () => {
            this.revealPage();
        });

        // Intercept internal link clicks
        this.setupLinkInterception();

        // Handle browser back/forward buttons
        window.addEventListener('popstate', () => {
             // Optional: can trigger transition on back/forward if needed
        });
    }

    createElements() {
        // Main overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'page-transition-overlay';
        document.body.appendChild(this.overlay);

        // Optional Shutter for premium feel
        this.shutter = document.createElement('div');
        this.shutter.className = 'page-transition-shutter';
        document.body.appendChild(this.shutter);
    }

    revealPage() {
        if (this.overlay) {
            this.overlay.classList.add('is-hidden');
        }
        
        // Add fade-in effect to body content
        document.body.classList.add('page-fade-active');
    }

    setupLinkInterception() {
        document.addEventListener('click', (e) => {
            const anchor = e.target.closest('a');
            
            if (!anchor) return;
            
            const href = anchor.getAttribute('href');
            const target = anchor.getAttribute('target');

            // Skip if:
            // 1. Not an internal link
            // 2. Opens in a new tab
            // 3. Is a hash link (handled by smooth scroll)
            // 4. Is a download link
            if (!href || 
                href.startsWith('http') && !href.includes(window.location.hostname) ||
                target === '_blank' ||
                href.startsWith('#') ||
                anchor.hasAttribute('download') ||
                e.metaKey || e.ctrlKey || e.shiftKey) {
                return;
            }

            // Internal link clicked - trigger transition
            e.preventDefault();
            this.handleTransition(href);
        });
    }

    handleTransition(url) {
        if (!this.overlay) {
            window.location.href = url;
            return;
        }

        // Show overlay/shutter
        this.overlay.classList.remove('is-hidden');
        this.overlay.classList.add('is-visible');
        
        if (this.shutter) {
            this.shutter.classList.add('is-active');
        }

        // Wait for animation to finish then redirect
        setTimeout(() => {
            window.location.href = url;
        }, 500); // Should match CSS transition speed
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    // Check if transition manager already exists
    if (!window.pageTransitionManager) {
        window.pageTransitionManager = new PageTransitionManager();
    }
});
