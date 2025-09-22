// Client API Admin pour Vulsoft
class AdminAPI extends VulsoftAPI {
    constructor() {
        super();
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

    async getUsersGrowth(days = 30) {
        return await this.request(`/admin/analytics/users-growth?days=${days}`);
    }

    async getMessagesByService() {
        return await this.request('/admin/analytics/messages-by-service');
    }

    async createAdmin(username, email, password) {
        return await this.request('/admin/create-admin', {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
        });
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
                                <button class="action-btn secondary" onclick="editProject(${project.id})">
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
    
    window.notifications?.success('Interface d\'administration chargée');
});