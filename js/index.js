// Header scroll effect and other global nav logic moved to js/navigation.js

// Scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate');
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', () => {
    const animateElements = document.querySelectorAll('.service-card, .about-content, .contact-content');
    animateElements.forEach(el => observer.observe(el));

    // Mobile menu toggle moved to js/navigation.js
});

// Form submission (si le formulaire existe)
const contactForm = document.querySelector('.contact-form form');
if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
        e.preventDefault();
        alert('Merci pour votre message ! Nous vous répondrons dans les plus brefs délais.');
    });
}
