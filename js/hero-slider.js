/**
 * Hero Section Title Slider Logic
 */
document.addEventListener('DOMContentLoaded', () => {
    const heroTitle = document.getElementById('hero-title');
    if (!heroTitle) return;

    const titles = ['index_hero.title1', 'index_hero.title2', 'index_hero.title3'];
    let currentIndex = 0;
    const intervalTime = 5000; // 5 seconds

    function rotateTitle() {
        if (!window.i18nManager) {
            setTimeout(rotateTitle, 100);
            return;
        }

        // Add active class if not present
        if (!heroTitle.classList.contains('active')) {
            heroTitle.classList.add('active');
        }

        setTimeout(() => {
            // Start exit animation
            heroTitle.classList.add('sliding-out');
            heroTitle.classList.remove('active');

            setTimeout(() => {
                // Change title content
                currentIndex = (currentIndex + 1) % titles.length;
                const nextKey = titles[currentIndex];
                const translation = window.i18nManager.getTranslation(nextKey);

                if (translation) {
                    heroTitle.innerHTML = translation;
                    heroTitle.setAttribute('data-i18n', nextKey);
                }

                // Prepare for entry
                heroTitle.classList.remove('sliding-out');
                heroTitle.classList.add('sliding-in');

                // Trigger entry animation
                setTimeout(() => {
                    heroTitle.classList.remove('sliding-in');
                    heroTitle.classList.add('active');
                }, 50);

            }, 600); // Wait for sliding-out animation (match CSS transition)

        }, intervalTime - 600);
    }

    // Set initial active state correctly
    heroTitle.classList.add('active');

    // Start the loop
    setInterval(rotateTitle, intervalTime);
});
