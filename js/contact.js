// Gestion du formulaire de contact
document.getElementById('contact-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Simulation d'envoi
    const submitButton = this.querySelector('.submit-button');
    const originalText = submitButton.innerHTML;
    
    submitButton.innerHTML = '<span>Envoi en cours...</span>';
    submitButton.disabled = true;
    
    setTimeout(() => {
        alert('Merci pour votre message ! Nous vous répondrons dans les plus brefs délais.');
        this.reset();
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }, 2000);
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
