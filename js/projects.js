document.addEventListener('DOMContentLoaded', () => {
    const projectsGrid = document.getElementById('projects-grid');
    const API_URL = 'http://localhost:8001/api';

    async function loadProjects() {
        projectsGrid.innerHTML = '<div class="loading">Chargement des projets...</div>';

        try {
            const response = await fetch(`${API_URL}/projects`);
            if (!response.ok) {
                throw new Error('API non disponible');
            }
            const projects = await response.json();

            if (projects && projects.length > 0) {
                renderProjects(projects);
            } else {
                console.warn('Aucun projet trouvé via l\'API, affichage du contenu par défaut.');
                renderDefaultProjects();
            }
        } catch (error) {
            console.error('Erreur de chargement des projets:', error);
            renderDefaultProjects();
        }
    }

    function renderProjects(projects) {
        projectsGrid.innerHTML = projects.map(project => `
            <a href="project-details.html?id=${project.id}" class="project-card" title="${project.title}">
                <div class="project-card-image">
                    <img src="${project.primary_image_url || 'https://images.unsplash.com/photo-1517694712202-1428bc648c73?w=600&q=80'}" alt="${project.title}" loading="lazy">
                    <div class="project-card-overlay">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7,7 17,7 17,17"></polyline></svg>
                    </div>
                </div>
                <div class="project-card-content">
                    <h3 class="project-title">${project.title}</h3>
                    <p class="project-description">${project.description}</p>
                    <div class="project-tags">
                        ${(project.technology || '').split(',').map(tag => `<span class="tag">${tag.trim()}</span>`).join('')}
                    </div>
                </div>
            </a>
        `).join('');
    }

    function renderDefaultProjects() {
        const defaultProjects = [
            {
                id: 1,
                title: "Plateforme E-commerce pour Artisanat Local",
                description: "Une solution complète pour permettre aux artisans de vendre leurs créations en ligne, avec un système de paiement intégré.",
                primary_image_url: "https://images.unsplash.com/photo-1579298245158-33e8f568f7d3?w=600&q=80",
                technology: "React, FastAPI, Stripe"
            },
            {
                id: 2,
                title: "Application Mobile de Gestion Agricole",
                description: "Application mobile cross-platform pour aider les agriculteurs à suivre leurs cultures, la météo et les prix du marché.",
                primary_image_url: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&q=80",
                technology: "Flutter, Firebase"
            },
            {
                id: 3,
                title: "Logiciel de Gestion pour Clinique Médicale",
                description: "Ovom vous connecte avec des professionnels de santé, vous aide à gérer vos traitements et vous offre des conseils pour une vie plus saine..",
                primary_image_url: "./images/ovom.png",
                technology: "Python, Qt, SQLite"
            },
            {
                id: 4,
                title: "Site Vitrine pour Cabinet d'Avocats",
                description: "Un site web moderne et professionnel pour présenter les services du cabinet et attirer de nouveaux clients.",
                primary_image_url: "https://images.unsplash.com/photo-1589216532372-1c2a36790049?w=600&q=80",
                technology: "HTML5, CSS3, JavaScript"
            },
            {
                id: 5,
                title: "Système de Réservation pour Hôtel",
                description: "Une application web permettant aux clients de réserver des chambres en ligne avec une disponibilité en temps réel.",
                primary_image_url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80",
                technology: "Vue.js, Node.js, PostgreSQL"
            },
            {
                id: 6,
                title: "Dashboard d'Analyse de Données",
                description: "Un tableau de bord interactif pour visualiser les indicateurs de performance clés (KPIs) d'une entreprise.",
                primary_image_url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80",
                technology: "D3.js, Python, Pandas"
            }
        ];
        renderProjects(defaultProjects);
        window.notifications?.info("Contenu de démonstration affiché. L'API n'a pas répondu.", { duration: 7000 });
    }

    // Charger les projets au chargement de la page
    loadProjects();
});