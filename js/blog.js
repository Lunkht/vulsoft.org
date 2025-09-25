document.addEventListener('DOMContentLoaded', () => {
    const blogGrid = document.getElementById('blog-grid');
    const API_URL = 'http://localhost:8001/api';

    async function fetchBlogPosts() {
        if (!blogGrid) return;

        try {
            const response = await fetch(`${API_URL}/blog/posts`);
            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des articles.');
            }
            const posts = await response.json();

            if (posts.length === 0) {
                blogGrid.innerHTML = '<p class="empty-state">Aucun article de blog publié pour le moment.</p>';
                return;
            }

            blogGrid.innerHTML = ''; // Vider le message de chargement
            posts.forEach(post => {
                const postCard = createPostCard(post);
                blogGrid.appendChild(postCard);
            });

        } catch (error) {
            console.error('Erreur:', error);
            blogGrid.innerHTML = `<p class="empty-state" style="color: red;">${error.message}</p>`;
        }
    }

    function createPostCard(post) {
        const card = document.createElement('a');
        card.href = `blog-post.html?id=${post.id}`; // Lien vers la page de détail de l'article
        card.className = 'blog-card';

        const formattedDate = new Date(post.created_at).toLocaleDateString('fr-FR', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        card.innerHTML = `
            <div class="blog-card-image" style="background-image: url('${post.image_url || 'https://placehold.co/600x400/1a1a1a/ffffff?text=Vulsoft'}')"></div>
            <div class="blog-card-content">
                <h3 class="blog-card-title">${post.title}</h3>
                <p class="blog-card-meta">Publié le ${formattedDate}</p>
            </div>
        `;
        return card;
    }

    fetchBlogPosts();
});