document.addEventListener('DOMContentLoaded', () => {
    const projectsGrid = document.getElementById('projects-grid');

    async function loadProjects() {
        projectsGrid.innerHTML = '<div class="loading">Chargement des projets...</div>';

        try {
            const response = await fetch('http://localhost:8001/api/projects');
            const projects = await response.json();

            if (projects && projects.length > 0) {
                renderProjects(projects);
            } else {
                projectsGrid.innerHTML = '<div class="empty-state">Aucun projet trouvé.</div>';
            }
        } catch (error) {
            projectsGrid.innerHTML = '<div class="empty-state">Erreur de chargement des projets.</div>';
            console.error('Erreur de chargement des projets:', error);
        }
    }

    function renderProjects(projects) {
        projectsGrid.innerHTML = projects.map(project => `
            <a href="project-details.html?slug=${project.id}" class="project-card">
                <img src="/${project.primary_image}" alt="${project.title}">
                <h3>${project.title}</h3>
                <p>${project.description}</p>
            </a>
        `).join('');
    }

    // Charger les projets au chargement de la page
    loadProjects();
});