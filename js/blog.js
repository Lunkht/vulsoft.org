// Navigation logic handled by js/navigation.js
class BlogManager {
    constructor() {
        this.posts = [];
        this.currentPage = 0;
        this.postsPerPage = 6;
        this.loading = false;
        this.hasMore = true;
        this.init();
    }

    init() {
        this.loadPosts();
        this.setupEventListeners();
    }

    setupEventListeners() {
        const loadMoreBtn = document.getElementById('load-more-btn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => this.loadMorePosts());
        }
    }

    async loadPosts() {
        if (this.loading) return;

        this.loading = true;
        this.showLoading();

        try {
            const response = await fetch(`http://localhost:8001/api/blog/posts?skip=${this.currentPage * this.postsPerPage}&limit=${this.postsPerPage}`);

            if (!response.ok) {
                throw new Error('Erreur lors du chargement des articles');
            }

            const posts = await response.json();

            if (posts.length === 0 && this.currentPage === 0) {
                this.showEmpty();
                return;
            }

            if (posts.length < this.postsPerPage) {
                this.hasMore = false;
            }

            this.posts = [...this.posts, ...posts];
            this.renderPosts();
            this.currentPage++;

        } catch (error) {
            console.error('Erreur blog:', error);

            // Si c'est la première page et qu'il y a une erreur, afficher du contenu par défaut
            if (this.currentPage === 0) {
                this.showDefaultContent();
            } else {
                window.notifications?.error('Erreur lors du chargement des articles');
            }
        } finally {
            this.loading = false;
            this.hideLoading();
        }
    }

    async loadMorePosts() {
        if (!this.hasMore || this.loading) return;
        await this.loadPosts();
    }

    renderPosts() {
        const blogGrid = document.getElementById('blog-grid');
        const loadMoreBtn = document.getElementById('load-more-btn');

        // Afficher la grille
        blogGrid.style.display = 'grid';

        // Vider la grille si c'est la première page
        if (this.currentPage === 0) {
            blogGrid.innerHTML = '';
        }

        // Ajouter les nouveaux articles
        this.posts.slice(this.currentPage * this.postsPerPage).forEach(post => {
            const postElement = this.createPostElement(post);
            blogGrid.appendChild(postElement);
        });

        // Gérer le bouton "Charger plus"
        if (this.hasMore && this.posts.length >= this.postsPerPage) {
            loadMoreBtn.style.display = 'block';
        } else {
            loadMoreBtn.style.display = 'none';
        }
    }

    createPostElement(post) {
        const article = document.createElement('article');
        article.className = 'blog-card';

        // Générer une image aléatoire depuis Unsplash
        const keywords = ['technology', 'code', 'developer', 'workplace', 'abstract', 'nature'];
        const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
        const imageUrl = post.image_url || `https://source.unsplash.com/600x400/?${randomKeyword}&sig=${post.id}`;
        // Créer un extrait du contenu
        const excerpt = this.createExcerpt(post.content);

        // Formater la date
        const date = new Date(post.created_at).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        article.innerHTML = `
            <div class="blog-card-image"><img src="${imageUrl}" alt="${post.title}"></div>
            <div class="blog-card-content">
                <h2 class="blog-card-title">${post.title}</h2>
                <p class="blog-card-excerpt">${excerpt}</p>
                <div class="blog-card-meta">
                    <div class="blog-card-author">
                        <span>👤</span>
                        <span>${post.author?.full_name || 'Équipe Vulsoft'}</span>
                    </div>
                    <div class="blog-card-date">${date}</div>
                </div>
            </div>
        `;

        // Ajouter l'événement de clic
        article.addEventListener('click', () => {
            this.openPost(post);
        });

        return article;
    }

    createExcerpt(content) {
        if (!content) return 'Découvrez cet article passionnant...';

        // Supprimer les balises HTML et limiter à 150 caractères
        const plainText = content.replace(/<[^>]*>/g, '');
        return plainText.length > 150 ? plainText.substring(0, 150) + '...' : plainText;
    }

    openPost(post) {
        // Pour l'instant, afficher dans une modal simple
        // Plus tard, on pourra créer une page dédiée
        this.showPostModal(post);
    }

    showPostModal(post) {
        const modal = document.createElement('div');
        modal.className = 'blog-modal';
        modal.innerHTML = `
            <div class="blog-modal-content">
                <div class="blog-modal-header">
                    <h1>${post.title}</h1>
                    <button class="blog-modal-close">&times;</button>
                </div>
                <div class="blog-modal-meta">
                    <span>Par ${post.author?.full_name || 'Équipe Vulsoft'}</span>
                    <span>${new Date(post.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
                <div class="blog-modal-body">
                    ${post.content || '<p>Contenu en cours de rédaction...</p>'}
                </div>
            </div>
        `;

        // Ajouter les styles de la modal
        this.addModalStyles();

        // Ajouter au DOM
        document.body.appendChild(modal);

        // Événements
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.classList.contains('blog-modal-close')) {
                document.body.removeChild(modal);
            }
        });

        // Animation d'entrée
        setTimeout(() => modal.classList.add('show'), 10);
    }

    addModalStyles() {
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
                max-width: 800px;
                max-height: 90vh;
                overflow-y: auto;
                position: relative;
                box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            }
            
            .blog-modal-header {
                padding: 2rem 2rem 1rem 2rem;
                border-bottom: 1px solid var(--border-color);
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
            }
            
            .blog-modal-header h1 {
                font-size: 1.75rem;
                font-weight: 700;
                color: var(--text-primary);
                margin: 0;
                flex: 1;
                margin-right: 1rem;
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
            
            .blog-modal-meta {
                padding: 1rem 2rem;
                color: var(--text-secondary);
                font-size: 0.875rem;
                display: flex;
                gap: 2rem;
                border-bottom: 1px solid var(--border-color);
            }
            
            .blog-modal-body {
                padding: 2rem;
                line-height: 1.7;
                color: var(--text-primary);
            }
            
            .blog-modal-body h1, .blog-modal-body h2, .blog-modal-body h3 {
                color: var(--text-primary);
                margin-top: 2rem;
                margin-bottom: 1rem;
            }
            
            .blog-modal-body p {
                margin-bottom: 1rem;
            }
            
            .blog-modal-body code {
                background: var(--bg-secondary);
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                font-family: 'Monaco', 'Menlo', monospace;
            }
            
            @media (max-width: 768px) {
                .blog-modal {
                    padding: 1rem;
                }
                
                .blog-modal-content {
                    max-height: 95vh;
                }
                
                .blog-modal-header {
                    padding: 1.5rem 1.5rem 1rem 1.5rem;
                }
                
                .blog-modal-header h1 {
                    font-size: 1.5rem;
                }
                
                .blog-modal-meta {
                    padding: 1rem 1.5rem;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                
                .blog-modal-body {
                    padding: 1.5rem;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    showLoading() {
        const loading = document.getElementById('blog-loading');
        const grid = document.getElementById('blog-grid');
        const empty = document.getElementById('blog-empty');

        loading.style.display = 'block';
        grid.style.display = 'none';
        empty.style.display = 'none';
    }

    hideLoading() {
        const loading = document.getElementById('blog-loading');
        loading.style.display = 'none';
    }

    showEmpty() {
        const loading = document.getElementById('blog-loading');
        const grid = document.getElementById('blog-grid');
        const empty = document.getElementById('blog-empty');

        loading.style.display = 'none';
        grid.style.display = 'none';
        empty.style.display = 'block';
    }

    showDefaultContent() {
        // Afficher du contenu par défaut si l'API n'est pas disponible
        const defaultPosts = [
            {
                id: 1,
                title: "Bienvenue sur le blog Vulsoft",
                content: `<p>Nous sommes ravis de vous accueillir sur notre blog ! Ici, nous partagerons nos connaissances, nos expériences et les dernières tendances en matière de développement logiciel et de transformation digitale.</p>
                         <p>Restez connectés pour découvrir nos articles sur les technologies modernes, les meilleures pratiques de développement, et les innovations qui façonnent l'avenir du digital en Afrique.</p>`,
                author: { full_name: "Équipe Vulsoft" },
                created_at: new Date().toISOString(),
                is_published: true
            },
            {
                id: 2,
                title: "L'avenir du développement web en Afrique",
                content: `<p>L'Afrique connaît une révolution digitale sans précédent. Les développeurs africains sont à l'avant-garde de l'innovation, créant des solutions qui répondent aux défis locaux tout en ayant un impact global.</p>
                         <p>Dans cet article, nous explorons les tendances émergentes, les technologies adoptées et les opportunités qui s'offrent aux développeurs sur le continent.</p>`,
                author: { full_name: "Équipe Vulsoft" },
                created_at: new Date(Date.now() - 86400000).toISOString(), // Hier
                is_published: true
            },
            {
                id: 3,
                title: "Guide complet des Progressive Web Apps",
                content: `<p>Les Progressive Web Apps (PWA) représentent l'avenir des applications web. Elles combinent le meilleur du web et du mobile pour offrir une expérience utilisateur exceptionnelle.</p>
                         <p>Découvrez comment créer des PWA performantes, les meilleures pratiques à suivre, et pourquoi elles sont essentielles pour votre stratégie digitale.</p>`,
                author: { full_name: "Équipe Vulsoft" },
                created_at: new Date(Date.now() - 172800000).toISOString(), // Il y a 2 jours
                is_published: true
            }
        ];

        this.posts = defaultPosts;
        this.renderPosts();
        this.hasMore = false;
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    window.blogManager = new BlogManager();
});