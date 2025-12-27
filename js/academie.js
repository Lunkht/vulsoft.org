// Navigation logic handled by js/navigation.js

// Navigation pour les formations par catégorie
const categoryTabs = document.querySelectorAll('.category-tab');
const formationCards = document.querySelectorAll('.formation-card');

categoryTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const category = tab.dataset.category;

        // Update active tab
        categoryTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Filter formations
        formationCards.forEach(card => {
            if (category === 'all' || card.dataset.category === category) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    });
});
