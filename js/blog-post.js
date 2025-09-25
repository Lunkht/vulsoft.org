document.addEventListener('DOMContentLoaded', () => {
    const postContainer = document.getElementById('post-container');
    const relatedPostsSection = document.getElementById('related-posts-section');
    const API_URL = 'http://localhost:8001/api';

    async function fetchPostDetails() {
        if (!postContainer) return;

        const urlParams = new URLSearchParams(window.location.search);
        const postId = urlParams.get('id');

        if (!postId) {
            postContainer.innerHTML = '<p class="empty-state">Identifiant de l\'article manquant.</p>';
            return;
        }

        try {
            const response = await fetch(`${API_URL}/blog/posts/${postId}`);
            if (!response.ok) {
                throw new Error('Article non trouvé ou erreur serveur.');
            }
            const post = await response.json();
            renderPost(post);

            // Charger les articles similaires après avoir affiché l'article principal
            fetchRelatedPosts(postId);

        } catch (error) {
            console.error('Erreur:', error);
            postContainer.innerHTML = `<p class="empty-state" style="color: red;">${error.message}</p>`;
        }
    }

    function renderPost(post) {
        // Mettre à jour le titre de la page
        document.title = `${post.title} - Vulsoft Blog`;

        const formattedDate = new Date(post.created_at).toLocaleDateString('fr-FR', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        // Convertir le contenu Markdown en HTML
        const contentHtml = marked.parse(post.content || '');

        const authorInitials = post.author.full_name
            .split(' ')
            .map(name => name[0])
            .join('')
            .toUpperCase();

        postContainer.innerHTML = `
            <article class="post-article">
                <header class="post-header">
                    <h1 class="post-title">${post.title}</h1>
                    <div class="post-meta">
                        <div class="post-author">
                            <div class="post-author-avatar">${authorInitials}</div>
                            <span>Par ${post.author.full_name}</span>
                        </div>
                        <time datetime="${post.created_at}">
                            Publié le ${formattedDate}
                        </time>
                    </div>
                </header>

                <div class="post-featured-image" style="background-image: url('${post.image_url || 'https://placehold.co/1200x600/1a1a1a/ffffff?text=Vulsoft'}')"></div>

                <div class="post-content">
                    ${contentHtml}
                </div>
            </article>
        `;
    }

    async function fetchRelatedPosts(currentPostId) {
        const relatedGrid = document.getElementById('related-posts-grid');
        if (!relatedGrid) return;

        try {
            // Cet endpoint est un exemple, il faudra l'implémenter côté backend
            const response = await fetch(`${API_URL}/blog/posts/${currentPostId}/related`);
            if (!response.ok) {
                throw new Error('Impossible de charger les articles similaires.');
            }
            const relatedPosts = await response.json();

            if (relatedPosts.length > 0) {
                relatedPostsSection.style.display = 'block';
                relatedGrid.innerHTML = '';
                relatedPosts.forEach(post => {
                    const postCard = createRelatedPostCard(post);
                    relatedGrid.appendChild(postCard);
                });
            }

        } catch (error) {
            console.warn(error.message);
            relatedPostsSection.style.display = 'none';
        }
    }

    function createRelatedPostCard(post) {
        const card = document.createElement('a');
        card.href = `blog-post.html?id=${post.id}`;
        card.className = 'blog-card';

        card.innerHTML = `
            <div class="blog-card-image" style="background-image: url('${post.image_url || 'https://placehold.co/600x400/1a1a1a/ffffff?text=Vulsoft'}')"></div>
            <div class="blog-card-content">
                <h3 class="blog-card-title">${post.title}</h3>
            </div>
        `;
        return card;
    }

    fetchPostDetails();
});