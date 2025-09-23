document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contact-form');
    if (!contactForm) return;

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitButton = contactForm.querySelector('.submit-button');
        const originalButtonText = submitButton.innerHTML;
        
        // Désactiver le bouton et afficher un état de chargement
        submitButton.disabled = true;
        submitButton.innerHTML = `<span>Envoi en cours...</span>`;

        // Créer un objet FormData à partir du formulaire
        const formData = new FormData(contactForm);

        try {
            const response = await fetch('http://localhost:8001/api/contact/submit', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (response.ok) {
                window.notifications?.success(result.message || 'Message envoyé avec succès !');
                contactForm.reset();
            } else {
                // Gérer les erreurs de validation ou autres erreurs serveur
                throw new Error(result.detail || 'Une erreur est survenue.');
            }
        } catch (error) {
            console.error('Erreur lors de la soumission du formulaire:', error);
            window.notifications?.error(error.message || 'Impossible d\'envoyer le message. Veuillez réessayer.');
        } finally {
            // Réactiver le bouton
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
        }
    });

    // Header scroll effect
    window.addEventListener('scroll', () => {
        const header = document.querySelector('.header');
        if (window.scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Animation au défilement pour le contenu principal
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    const animatedElement = document.querySelector('.contact-content');
    if (animatedElement) {
        observer.observe(animatedElement);
    }
});
