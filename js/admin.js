// Client API Admin pour Vulsoft
class AdminAPI extends VulsoftAuth {
    constructor() {
        super({ apiUrl: 'http://localhost:8001/api' });
    }

    // Méthodes Admin
    async getAdminStats() {
        return await this.request('/admin/stats');
    }

    async getUsers(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return await this.request(`/admin/users?${queryString}`);
    }

    async toggleUserAdmin(userId) {
        return await this.request(`/admin/users/${userId}/toggle-admin`, {
            method: 'PUT'
        });
    }

    async toggleUserActive(userId) {
        return await this.request(`/admin/users/${userId}/toggle-active`, {
            method: 'PUT'
        });
    }

    async getContactMessages(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return await this.request(`/admin/messages?${queryString}`);
    }

    async updateMessageStatus(messageId, status) {
        return await this.request(`/admin/messages/${messageId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
    }

    async deleteMessage(messageId) {
        return await this.request(`/admin/messages/${messageId}`, {
            method: 'DELETE'
        });
    }

    async getProjectsAdmin(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return await this.request(`/admin/projects?${queryString}`);
    }

    // Méthodes Blog
    async getBlogPosts(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return await this.request(`/blog/posts?${queryString}&published_only=false`);
    }

    async createBlogPost(postData) {
        return await this.request('/blog/posts', {
            method: 'POST',
            body: JSON.stringify(postData)
        });
    }

    async updateBlogPost(postId, postData) {
        return await this.request(`/blog/posts/${postId}`, {
            method: 'PUT',
            body: JSON.stringify(postData)
        });
    }

    async deleteBlogPost(postId) {
        return await this.request(`/blog/posts/${postId}`, {
            method: 'DELETE'
        });
    }

    async getUsersGrowth(days = 30) {
        return await this.request(`/admin/analytics/users-growth?days=${days}`);
    }

    async getMessagesByService() {
        return await this.request('/admin/analytics/messages-by-service');
    }

    async getAnalyticsOverview(days = 7) {
        return await this.request(`/admin/analytics/overview?days=${days}`);
    }

    async getTopPages(limit = 10) {
        return await this.request(`/admin/analytics/top-pages?limit=${limit}`);
    }

    async createAdmin(username, email, password) {
        return await this.request('/admin/create-admin', {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
        });
    }

    async getSubscribers() {
        return await this.request('/newsletter/subscribers');
    }

    async sendNewsletter(subject, content) {
        return await this.request('/newsletter/send', {
            method: 'POST',
            body: JSON.stringify({ subject, content })
        });
    }

    async createProject(projectData) {
        return await this.request('/projects/', {
            method: 'POST',
            body: JSON.stringify(projectData)
        });
    }

    async updateProject(projectId, projectData) {
        return await this.request(`/projects/${projectId}`, {
            method: 'PUT',
            body: JSON.stringify(projectData)
        });
    }

    async deleteProject(projectId) {
        return await this.request(`/projects/${projectId}`, {
            method: 'DELETE'
        });
    }

    async getProjectDetails(projectId) {
        return await this.request(`/projects/${projectId}`);
    }

    async uploadProjectImage(projectId, formData) {
        return await this.request(`/projects/${projectId}/images`, {
            method: 'POST',
            body: formData,
        });
    }

    async deleteProjectImage(imageId) {
        return await this.request(`/projects/images/${imageId}`, {
            method: 'DELETE'
        });
    }

    // --- Blog Methods ---
    async getBlogPosts() {
        return await this.request('/blog/posts?published_only=false');
    }

    async createBlogPost(postData) {
        return await this.request('/blog/posts', {
            method: 'POST',
            body: JSON.stringify(postData)
        });
    }

    async updateBlogPost(postId, postData) {
        return await this.request(`/blog/posts/${postId}`, {
            method: 'PUT',
            body: JSON.stringify(postData)
        });
    }

    async deleteBlogPost(postId) {
        return await this.request(`/blog/posts/${postId}`, { method: 'DELETE' });
    }
}

// Instance globale de l'API Admin
window.adminAPI = new AdminAPI();

// Gestionnaire de navigation
class AdminNavigation {
    constructor() {
        this.currentSection = 'dashboard';
        this.init();
    }

    init() {
        // Gestion des liens de navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.showSection(section);
            });
        });

        // Charger la section par défaut
        this.showSection('dashboard');
    }

    showSection(sectionName) {
        // Masquer toutes les sections
        document.querySelectorAll('.admin-section-content').forEach(section => {
            section.style.display = 'none';
        });

        // Afficher la section demandée
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.style.display = 'block';
        }

        // Mettre à jour la navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        this.currentSection = sectionName;

        // Charger les données de la section
        this.loadSectionData(sectionName);
    }

    async loadSectionData(sectionName) {
        switch (sectionName) {
            case 'dashboard':
                await this.loadDashboard();
                break;
            case 'users':
                await this.loadUsers();
                break;
            case 'messages':
                await this.loadMessages();
                break;
            case 'projects':
                await this.loadProjects();
                break;
            case 'analytics':
                await this.loadAnalytics();
                break;
            case 'newsletter':
                await this.loadNewsletter();
                break;
            case 'blog':
                await this.loadBlog();
                break;
        }
    }

    async loadDashboard() {
        try {
            const stats = await window.adminAPI.getAdminStats();
            this.renderStats(stats);
            this.loadRecentActivity();
        } catch (error) {
            window.notifications?.error('Erreur lors du chargement du dashboard');
        }
    }

    renderStats(stats) {
        const statsGrid = document.getElementById('stats-grid');
        statsGrid.innerHTML = `
            <div class="stat-card">
                <div class="stat-number">${stats.total_users}</div>
                <div class="stat-label">Utilisateurs Total</div>
                <div class="stat-change">+${stats.new_users_today} aujourd'hui</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.unread_messages}</div>
                <div class="stat-label">Messages Non Lus</div>
                <div class="stat-change">${stats.total_messages} total</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.active_projects}</div>
                <div class="stat-label">Projets Actifs</div>
                <div class="stat-change">${stats.total_projects} total</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.completion_rate.toFixed(1)}%</div>
                <div class="stat-label">Taux de Réussite</div>
                <div class="stat-change">Projets terminés</div>
            </div>
        `;
    }

    async loadRecentActivity() {
        const activityEl = document.getElementById('recent-activity');
        activityEl.innerHTML = `
            <div style="padding: 2rem;">
                <div style="margin-bottom: 1rem; padding: 1rem; background: var(--bg-secondary); border-radius: 8px;">
                    <strong>📧 Nouveau message de contact</strong><br>
                    <small style="color: var(--text-secondary);">Il y a 2 heures</small>
                </div>
                <div style="margin-bottom: 1rem; padding: 1rem; background: var(--bg-secondary); border-radius: 8px;">
                    <strong>👤 Nouvel utilisateur inscrit</strong><br>
                    <small style="color: var(--text-secondary);">Il y a 4 heures</small>
                </div>
                <div style="margin-bottom: 1rem; padding: 1rem; background: var(--bg-secondary); border-radius: 8px;">
                    <strong>🚀 Projet mis à jour</strong><br>
                    <small style="color: var(--text-secondary);">Hier</small>
                </div>
            </div>
        `;
    }

    async loadUsers() {
        try {
            const users = await window.adminAPI.getUsers();
            this.renderUsersTable(users);
        } catch (error) {
            window.notifications?.error('Erreur lors du chargement des utilisateurs');
        }
    }

    renderUsersTable(users) {
        const tableEl = document.getElementById('users-table');

        if (users.length === 0) {
            tableEl.innerHTML = '<div class="empty-state">Aucun utilisateur trouvé</div>';
            return;
        }

        const tableHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nom d'utilisateur</th>
                        <th>Email</th>
                        <th>Nom complet</th>
                        <th>Statut</th>
                        <th>Admin</th>
                        <th>Inscription</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr>
                            <td>${user.id}</td>
                            <td>${user.username}</td>
                            <td>${user.email}</td>
                            <td>${user.full_name}</td>
                            <td>
                                <span class="status-badge ${user.is_active ? 'active' : 'inactive'}">
                                    ${user.is_active ? 'Actif' : 'Inactif'}
                                </span>
                            </td>
                            <td>
                                <span class="status-badge ${user.is_admin ? 'active' : 'inactive'}">
                                    ${user.is_admin ? 'Admin' : 'User'}
                                </span>
                            </td>
                            <td>${new Date(user.created_at).toLocaleDateString('fr-FR')}</td>
                            <td>
                                <button class="action-btn secondary" onclick="toggleUserActive(${user.id})">
                                    ${user.is_active ? 'Désactiver' : 'Activer'}
                                </button>
                                <button class="action-btn primary" onclick="toggleUserAdmin(${user.id})">
                                    ${user.is_admin ? 'Retirer Admin' : 'Faire Admin'}
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        tableEl.innerHTML = tableHTML;
    }

    async loadMessages() {
        try {
            const messages = await window.adminAPI.getContactMessages();
            this.renderMessagesTable(messages);
        } catch (error) {
            window.notifications?.error('Erreur lors du chargement des messages');
        }
    }

    renderMessagesTable(messages) {
        const tableEl = document.getElementById('messages-table');

        if (messages.length === 0) {
            tableEl.innerHTML = '<div class="empty-state">Aucun message trouvé</div>';
            return;
        }

        const tableHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nom</th>
                        <th>Email</th>
                        <th>Entreprise</th>
                        <th>Service</th>
                        <th>Statut</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${messages.map(message => `
                        <tr>
                            <td>${message.id}</td>
                            <td>${message.first_name} ${message.last_name}</td>
                            <td>${message.email}</td>
                            <td>${message.company || '-'}</td>
                            <td>${message.service || '-'}</td>
                            <td>
                                <span class="status-badge ${message.status}">
                                    ${message.status}
                                </span>
                            </td>
                            <td>${new Date(message.created_at).toLocaleDateString('fr-FR')}</td>
                            <td>
                                <button class="action-btn secondary" onclick="viewMessage(${message.id})">
                                    Voir
                                </button>
                                <button class="action-btn primary" onclick="markAsRead(${message.id})">
                                    Marquer lu
                                </button>
                                <button class="action-btn danger" onclick="deleteMessage(${message.id})">
                                    Supprimer
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        tableEl.innerHTML = tableHTML;
    }

    async loadProjects() {
        try {
            const projects = await window.adminAPI.getProjectsAdmin();
            this.renderProjectsTable(projects);
        } catch (error) {
            window.notifications?.error('Erreur lors du chargement des projets');
        }
    }

    renderProjectsTable(projects) {
        const tableEl = document.getElementById('projects-table');

        if (projects.length === 0) {
            tableEl.innerHTML = '<div class="empty-state">Aucun projet trouvé</div>';
            return;
        }

        const tableHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Titre</th>
                        <th>Client</th>
                        <th>Technologie</th>
                        <th>Statut</th>
                        <th>Créé</th>
                        <th>Mis à jour</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${projects.map(project => `
                        <tr>
                            <td>${project.id}</td>
                            <td>${project.title}</td>
                            <td>${project.client || '-'}</td>
                            <td>${project.technology || '-'}</td>
                            <td>
                                <span class="status-badge ${project.status === 'en_cours' ? 'active' : 'traite'}">
                                    ${project.status}
                                </span>
                            </td>
                            <td>${new Date(project.created_at).toLocaleDateString('fr-FR')}</td>
                            <td>${new Date(project.updated_at).toLocaleDateString('fr-FR')}</td>
                            <td>
                                <button class="action-btn secondary" onclick="openManageImagesModal(${project.id}, '${project.title.replace(/'/g, "\\'")}')">
                                    Images
                                </button>
                                <button class="action-btn secondary" onclick="openEditProjectModal(${project.id}, '${project.title.replace(/'/g, "\\'")}')">
                                    Modifier
                                </button>
                                <button class="action-btn danger" onclick="deleteProject(${project.id})">
                                    Supprimer
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        tableEl.innerHTML = tableHTML;
    }

    async loadAnalytics() {
        try {
            // Charger l'aperçu des analytics
            const overview = await window.adminAPI.getAnalyticsOverview(7);
            this.renderAnalyticsOverview(overview);
            const topPages = await window.adminAPI.getTopPages();
            this.renderTopPages(topPages);

            // Charger les données de croissance
            const usersGrowth = await window.adminAPI.getUsersGrowth(30);
            this.renderUsersChart(usersGrowth);

            // Charger les données par service
            const serviceData = await window.adminAPI.getMessagesByService();
            this.renderServicesChart(serviceData);
        } catch (error) {
            window.notifications?.error('Erreur lors du chargement des analytics');
        }
    }

    renderAnalyticsOverview(overview) {
        const overviewEl = document.getElementById('analytics-overview');
        overviewEl.innerHTML = `
            <div class="stat-card">
                <div class="stat-number">${overview.total_views}</div>
                <div class="stat-label">Pages Vues</div>
                <div class="stat-change">sur ${overview.period_days} jours</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${overview.unique_visitors}</div>
                <div class="stat-label">Visiteurs Uniques</div>
                <div class="stat-change">sur ${overview.period_days} jours</div>
            </div>
        `;
    }

    renderTopPages(pages) {
        const tableEl = document.getElementById('top-pages-table');
        if (pages.length === 0) {
            tableEl.innerHTML = '<div class="empty-state">Aucune donnée de page vue</div>';
            return;
        }
        const tableHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>URL de la Page</th>
                        <th>Vues</th>
                    </tr>
                </thead>
                <tbody>
                    ${pages.map(page => `
                        <tr>
                            <td><a href="${page.url}" target="_blank">${page.url}</a></td>
                            <td>${page.views}</td>
                        </tr>`).join('')}
                </tbody>
            </table>`;
        tableEl.innerHTML = tableHTML;
    }

    renderUsersChart(data) {
        const chartEl = document.getElementById('users-chart');

        // Graphique simple en ASCII (remplacer par Chart.js en production)
        const chartHTML = `
            <div style="padding: 2rem;">
                <h4>Inscriptions des 30 derniers jours</h4>
                <div style="margin-top: 2rem;">
                    ${data.map(item => `
                        <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
                            <span style="width: 100px; font-size: 0.875rem;">${item.date}</span>
                            <div style="flex: 1; background: var(--bg-secondary); height: 20px; border-radius: 4px; margin: 0 1rem; position: relative;">
                                <div style="background: var(--accent-color); height: 100%; width: ${Math.min(item.count * 10, 100)}%; border-radius: 4px;"></div>
                            </div>
                            <span style="font-weight: 600;">${item.count}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        chartEl.innerHTML = chartHTML;
    }

    renderServicesChart(data) {
        const chartEl = document.getElementById('services-chart');

        const total = data.reduce((sum, item) => sum + item.count, 0);

        const chartHTML = `
            <div style="padding: 2rem;">
                <h4>Répartition des demandes par service</h4>
                <div style="margin-top: 2rem;">
                    ${data.map(item => `
                        <div style="display: flex; align-items: center; margin-bottom: 1rem;">
                            <span style="width: 150px; font-size: 0.875rem;">${item.service}</span>
                            <div style="flex: 1; background: var(--bg-secondary); height: 24px; border-radius: 4px; margin: 0 1rem; position: relative;">
                                <div style="background: var(--accent-color); height: 100%; width: ${(item.count / total * 100)}%; border-radius: 4px;"></div>
                            </div>
                            <span style="font-weight: 600;">${item.count} (${(item.count / total * 100).toFixed(1)}%)</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        chartEl.innerHTML = chartHTML;
    }
}

async function loadNewsletter() {
    try {
        const subscribers = await window.adminAPI.getSubscribers();
        renderSubscribersTable(subscribers);
    } catch (error) {
        window.notifications?.error('Erreur lors du chargement des abonnés');
    }
}

function renderSubscribersTable(subscribers) {
    const tableEl = document.getElementById('subscribers-table');

    if (!subscribers || subscribers.length === 0) {
        tableEl.innerHTML = '<div class="empty-state">Aucun abonné trouvé</div>';
        return;
    }

    const tableHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Email</th>
                    <th>Date d'abonnement</th>
                    <th>Statut</th>
                </tr>
            </thead>
            <tbody>
                ${subscribers.map(sub => `
                    <tr>
                        <td>${sub.id}</td>
                        <td>${sub.email}</td>
                        <td>${new Date(sub.created_at).toLocaleDateString('fr-FR')}</td>
                        <td>
                            <span class="status-badge ${sub.is_active ? 'active' : 'inactive'}">
                                ${sub.is_active ? 'Actif' : 'Inactif'}
                            </span>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    tableEl.innerHTML = tableHTML;
}

async function loadBlog() {
    try {
        const posts = await window.adminAPI.getBlogPosts();
        renderBlogTable(posts);
    } catch (error) {
        window.notifications?.error('Erreur lors du chargement des articles de blog.');
    }
}

function renderBlogTable(posts) {
    const tableEl = document.getElementById('blog-posts-table');
    if (!posts || posts.length === 0) {
        tableEl.innerHTML = '<div class="empty-state">Aucun article trouvé.</div>';
        return;
    }

    const tableHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Titre</th>
                    <th>Auteur</th>
                    <th>Statut</th>
                    <th>Créé le</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${posts.map(post => `
                    <tr>
                        <td>${post.id}</td>
                        <td>${post.title}</td>
                        <td>${post.author.full_name}</td>
                        <td>
                            <span class="status-badge ${post.is_published ? 'active' : 'inactive'}">
                                ${post.is_published ? 'Publié' : 'Brouillon'}
                            </span>
                        </td>
                        <td>${new Date(post.created_at).toLocaleDateString('fr-FR')}</td>
                        <td>
                            <button class="action-btn secondary" onclick="openEditPostModal(${post.id})">
                                Modifier
                            </button>
                            <button class="action-btn danger" onclick="deleteBlogPost(${post.id})">
                                Supprimer
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    tableEl.innerHTML = tableHTML;
}

// Fonctions globales pour les actions
async function toggleUserActive(userId) {
    try {
        const response = await window.adminAPI.toggleUserActive(userId);
        window.notifications?.success(response.message);
        window.adminNav.loadUsers(); // Recharger la liste
    } catch (error) {
        window.notifications?.error(error.message);
    }
}

async function toggleUserAdmin(userId) {
    try {
        const response = await window.adminAPI.toggleUserAdmin(userId);
        window.notifications?.success(response.message);
        window.adminNav.loadUsers(); // Recharger la liste
    } catch (error) {
        window.notifications?.error(error.message);
    }
}

async function markAsRead(messageId) {
    try {
        await window.adminAPI.updateMessageStatus(messageId, 'lu');
        window.notifications?.success('Message marqué comme lu');
        window.adminNav.loadMessages(); // Recharger la liste
    } catch (error) {
        window.notifications?.error(error.message);
    }
}

async function deleteMessage(messageId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
        try {
            await window.adminAPI.deleteMessage(messageId);
            window.notifications?.success('Message supprimé');
            window.adminNav.loadMessages(); // Recharger la liste
        } catch (error) {
            window.notifications?.error(error.message);
        }
    }
}

function viewMessage(messageId) {
    window.notifications?.info('Fonctionnalité de visualisation en développement');
}

function editProject(projectId) {
    window.notifications?.info('Fonctionnalité d\'édition en développement');
}

function deleteProject(projectId) {
    window.notifications?.info('Fonctionnalité de suppression en développement');
}

function createProject() {
    window.notifications?.info('Fonctionnalité de création en développement');
}

function goToSite() {
    window.location.href = '../index.html';
}

function logout() {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
        window.location.href = 'login.html';
    }
}

function exportData() {
    window.notifications?.info('Export des données en développement');
}

function viewLogs() {
    window.notifications?.info('Visualisation des logs en développement');
}

function clearCache() {
    window.notifications?.info('Nettoyage du cache en développement');
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    window.adminNav = new AdminNavigation();

    // Vérifier si l'utilisateur est admin (simulation)
    // En production, vérifier avec un token JWT

    // Remplacer la fonction placeholder
    window.editProject = (projectId, projectTitle) => {
        openEditProjectModal(projectId, projectTitle);
    };
    window.createProject = () => openCreateProjectModal();
    window.deleteProject = (projectId) => deleteProject(projectId);

    // Gérer la fermeture des modales
    window.onclick = function (event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = "none";
        }
    }

    // Gérer la création de projet
    document.getElementById('create-project-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const projectData = {
            title: form.title.value,
            description: form.description.value,
            technology: form.technology.value,
            client: form.client.value,
        };
        try {
            await window.adminAPI.createProject(projectData);
            window.notifications?.success('Projet créé avec succès !');
            closeCreateProjectModal();
            window.adminNav.loadProjects(); // Refresh the projects list
        } catch (error) {
            window.notifications?.error(error.message);
        }
    });

    // Gérer le téléchargement d'image
    document.getElementById('upload-image-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const projectId = form.project_id.value;
        const fileInput = form.file;

        if (fileInput.files.length === 0) {
            window.notifications?.warning('Veuillez sélectionner un fichier.');
            return;
        }

        const formData = new FormData();
        formData.append('file', fileInput.files[0]);

        try {
            await window.adminAPI.uploadProjectImage(projectId, formData);
            window.notifications?.success('Image téléchargée avec succès !');
            fileInput.value = ''; // Reset file input
            await renderProjectImages(projectId);
        } catch (error) {
            window.notifications?.error(error.message);
        }
    });

    // Gérer la modification de projet
    document.getElementById('edit-project-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const projectId = form.querySelector('#edit-project-id').value;
        const projectData = {
            title: form.title.value,
            description: form.description.value,
            technology: form.technology.value,
            client: form.client.value,
            status: form.status.value,
        };

        try {
            await window.adminAPI.updateProject(projectId, projectData);
            window.notifications?.success('Projet mis à jour avec succès !');
            closeEditProjectModal();
            window.adminNav.loadProjects(); // Refresh the projects list
        } catch (error) {
            window.notifications?.error(error.message);
        }
    });

    // Gérer la création/modification d'article de blog
    document.getElementById('blog-post-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const postId = form.querySelector('#blog-post-id').value;
        const postData = {
            title: form.title.value,
            content: form.content.value,
            is_published: form.is_published.checked,
        };

        try {
            if (postId) {
                await window.adminAPI.updateBlogPost(postId, postData);
                window.notifications?.success('Article mis à jour !');
            } else {
                await window.adminAPI.createBlogPost(postData);
                window.notifications?.success('Article créé !');
            }
            closeBlogPostModal();
            window.adminNav.loadBlog();
        } catch (error) {
            window.notifications?.error(error.message);
        }
    });

    // Gérer l'envoi de la newsletter
    document.getElementById('newsletter-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const subject = form.querySelector('#newsletter-subject').value;
        const content = form.querySelector('#newsletter-content').value;

        if (!subject || !content) {
            window.notifications?.warning('Le sujet et le contenu sont requis.');
            return;
        }

        if (!confirm(`Envoyer la newsletter "${subject}" à tous les abonnés ?`)) {
            return;
        }

        try {
            const response = await window.adminAPI.sendNewsletter(subject, content);
            window.notifications?.success(response.message);
            form.reset();
        } catch (error) {
            window.notifications?.error(error.message);
        }
    });

    window.notifications?.success('Interface d\'administration chargée');
});// Fonctions de gestion du blog
async function loadBlogPosts() {
    try {
        const posts = await window.adminAPI.getBlogPosts();
        renderBlogTable(posts);
    } catch (error) {
        console.error('Erreur lors du chargement des articles:', error);
        document.getElementById('blog-table').innerHTML =
            '<div class="empty-state">Erreur lors du chargement des articles</div>';
    }
}

function renderBlogTable(posts) {
    const tableEl = document.getElementById('blog-table');

    if (posts.length === 0) {
        tableEl.innerHTML = '<div class="empty-state">Aucun article trouvé</div>';
        return;
    }

    const tableHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Titre</th>
                    <th>Auteur</th>
                    <th>Statut</th>
                    <th>Créé</th>
                    <th>Mis à jour</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${posts.map(post => `
                    <tr>
                        <td>${post.id}</td>
                        <td>${post.title}</td>
                        <td>${post.author?.full_name || 'Inconnu'}</td>
                        <td>
                            <span class="status-badge ${post.is_published ? 'active' : 'inactive'}">
                                ${post.is_published ? 'Publié' : 'Brouillon'}
                            </span>
                        </td>
                        <td>${new Date(post.created_at).toLocaleDateString('fr-FR')}</td>
                        <td>${new Date(post.updated_at).toLocaleDateString('fr-FR')}</td>
                        <td>
                            <button class="action-btn secondary" onclick="editBlogPost(${post.id})">
                                Modifier
                            </button>
                            <button class="action-btn ${post.is_published ? 'secondary' : 'primary'}" 
                                    onclick="togglePostStatus(${post.id}, ${!post.is_published})">
                                ${post.is_published ? 'Dépublier' : 'Publier'}
                            </button>
                            <button class="action-btn danger" onclick="deleteBlogPost(${post.id})">
                                Supprimer
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    tableEl.innerHTML = tableHTML;
}

function openCreatePostModal() {
    const modal = document.createElement('div');
    modal.className = 'blog-modal';
    modal.innerHTML = `
        <div class="blog-modal-content" style="max-width: 900px;">
            <div class="blog-modal-header">
                <h2>Créer un nouvel article</h2>
                <button class="blog-modal-close">&times;</button>
            </div>
            <div class="blog-modal-body">
                <form id="create-post-form">
                    <div class="form-group">
                        <label for="post-title">Titre *</label>
                        <input type="text" id="post-title" name="title" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="post-content">Contenu</label>
                        <textarea id="post-content" name="content" rows="15" 
                                  placeholder="Écrivez votre article en HTML..."></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label class="checkbox-container">
                            <input type="checkbox" id="post-published" name="is_published">
                            <span class="checkmark"></span>
                            Publier immédiatement
                        </label>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="action-btn secondary" onclick="closeModal()">
                            Annuler
                        </button>
                        <button type="submit" class="action-btn primary">
                            Créer l'article
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    addBlogModalStyles();

    // Événements
    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.classList.contains('blog-modal-close')) {
            document.body.removeChild(modal);
        }
    });

    // Gestion du formulaire
    document.getElementById('create-post-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);
        const postData = {
            title: formData.get('title'),
            content: formData.get('content'),
            is_published: document.getElementById('post-published').checked
        };

        try {
            await window.adminAPI.createBlogPost(postData);
            window.notifications?.success('Article créé avec succès !');
            document.body.removeChild(modal);
            loadBlogPosts(); // Recharger la liste
        } catch (error) {
            window.notifications?.error('Erreur lors de la création: ' + error.message);
        }
    });

    setTimeout(() => modal.classList.add('show'), 10);
}

async function editBlogPost(postId) {
    try {
        // Pour l'instant, on utilise une approche simple
        // Plus tard, on pourra récupérer l'article spécifique
        window.notifications?.info('Fonctionnalité d\'édition en développement');
    } catch (error) {
        window.notifications?.error('Erreur: ' + error.message);
    }
}

async function togglePostStatus(postId, newStatus) {
    try {
        await window.adminAPI.updateBlogPost(postId, { is_published: newStatus });
        window.notifications?.success(newStatus ? 'Article publié !' : 'Article dépublié !');
        loadBlogPosts(); // Recharger la liste
    } catch (error) {
        window.notifications?.error('Erreur: ' + error.message);
    }
}

async function deleteBlogPost(postId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
        try {
            await window.adminAPI.deleteBlogPost(postId);
            window.notifications?.success('Article supprimé !');
            loadBlogPosts(); // Recharger la liste
        } catch (error) {
            window.notifications?.error('Erreur: ' + error.message);
        }
    }
}

function addBlogModalStyles() {
    if (document.getElementById('blog-modal-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'blog-modal-styles';
    styles.textContent = `
        .blog-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
            padding: 2rem;
            box-sizing: border-box;
        }
        
        .blog-modal.show {
            opacity: 1;
        }
        
        .blog-modal-content {
            background: var(--card-bg);
            border-radius: 20px;
            max-width: 600px;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            width: 100%;
        }
        
        .blog-modal-header {
            padding: 2rem 2rem 1rem 2rem;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .blog-modal-header h2 {
            margin: 0;
            color: var(--text-primary);
        }
        
        .blog-modal-close {
            background: none;
            border: none;
            font-size: 2rem;
            color: var(--text-secondary);
            cursor: pointer;
            padding: 0;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.3s ease;
        }
        
        .blog-modal-close:hover {
            background: var(--bg-secondary);
            color: var(--text-primary);
        }
        
        .blog-modal-body {
            padding: 2rem;
        }
        
        .form-group {
            margin-bottom: 1.5rem;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
            color: var(--text-primary);
        }
        
        .form-group input,
        .form-group textarea {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            font-size: 1rem;
            background: var(--bg-secondary);
            color: var(--text-primary);
            box-sizing: border-box;
        }
        
        .form-group textarea {
            resize: vertical;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.875rem;
        }
        
        .checkbox-container {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            cursor: pointer;
        }
        
        .checkbox-container input[type="checkbox"] {
            width: auto;
        }
        
        .form-actions {
            display: flex;
            gap: 1rem;
            justify-content: flex-end;
            margin-top: 2rem;
        }
    `;
    document.head.appendChild(styles);
}

function closeModal() {
    const modal = document.querySelector('.blog-modal');
    if (modal) {
        document.body.removeChild(modal);
    }
}

// Ajouter le blog au gestionnaire de navigation
const originalLoadSectionData = window.adminNav?.loadSectionData;
if (window.adminNav && originalLoadSectionData) {
    window.adminNav.loadSectionData = function (sectionName) {
        if (sectionName === 'blog') {
            loadBlogPosts();
        } else {
            originalLoadSectionData.call(this, sectionName);
        }
    };
}