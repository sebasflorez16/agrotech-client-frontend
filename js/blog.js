/**
 * Engine del Blog de AgroTech
 * Carga posts desde data/posts.json y renderiza el contenido
 */

const BLOG_DATA_URL = 'data/posts.json';
const CONFIG = {
    BACKEND_URL: 'https://agrotechcolombia.com'
};

document.addEventListener('DOMContentLoaded', () => {
    // Detectar si estamos en la lista o en un post individual
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');

    if (postId) {
        // Estamos viendo un post específico
        loadSinglePost(postId);
    } else {
        // Estamos en la página principal del blog
        loadBlogGrid();
    }
});

/**
 * Carga la lista de posts y renderiza las tarjetas
 */
async function loadBlogGrid() {
    const gridContainer = document.getElementById('blog-grid');
    if (!gridContainer) return; // No estamos en la página del blog

    try {
        const response = await fetch(BLOG_DATA_URL);
        const posts = await response.json();

        gridContainer.innerHTML = ''; // Limpiar loader

        posts.forEach(post => {
            const card = createPostCard(post);
            gridContainer.appendChild(card);
        });

    } catch (error) {
        console.error('Error cargando el blog:', error);
        gridContainer.innerHTML = '<p class="text-center">Hubo un error cargando los artículos. Por favor intente más tarde.</p>';
    }
}

/**
 * Crea el HTML para una tarjeta de artículo
 */
function createPostCard(post) {
    const card = document.createElement('div');
    card.className = 'blog-card';

    // Fallback image si no existe
    const imageUrl = post.image || 'images/agrotech satelite 1.png';

    card.innerHTML = `
        <div class="blog-card-image">
            <img src="${imageUrl}" alt="${post.title}">
        </div>
        <div class="blog-card-content">
            <span class="blog-date">${formatDate(post.date)}</span>
            <h3 class="blog-title">${post.title}</h3>
            <p class="blog-summary">${post.summary}</p>
            <a href="blog/${post.id}.html" class="blog-link">Leer más →</a>
        </div>
    `;

    return card;
}

/**
 * Carga un post individual basado en su ID
 */
async function loadSinglePost(id) {
    const titleEl = document.getElementById('post-title');
    const contentEl = document.getElementById('post-content');
    const metaEl = document.getElementById('post-meta');

    if (!titleEl) return;

    try {
        const response = await fetch(BLOG_DATA_URL);
        const posts = await response.json();

        const post = posts.find(p => p.id === id);

        if (!post) {
            titleEl.textContent = 'Artículo no encontrado';
            contentEl.innerHTML = '<div style="text-align: center;"><p>Lo sentimos, este artículo no existe.</p><a href="blog.html" class="neuro-button neuro-button-primary">Volver al Blog</a></div>';
            return;
        }

        // Renderizar contenido básico
        document.title = `${post.title} | Blog AgroTech`; // Cambiar título de la pestaña
        titleEl.textContent = post.title;
        contentEl.innerHTML = post.content;
        metaEl.innerHTML = `Publicado el ${formatDate(post.date)} por <span style="color: var(--brand-green);">${post.author}</span>`;

        // --- SEO & Mejoras ---
        updateMetaTags(post);
        loadRelatedPosts(posts, post.id);

    } catch (error) {
        console.error('Error cargando el post:', error);
    }
}

/**
 * Actualiza los meta tags dinámicos para SEO y Redes Sociales
 */
function updateMetaTags(post) {
    // Description SEO
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        document.head.appendChild(metaDesc);
    }
    metaDesc.content = post.summary;

    // Canonical URL for the specific post
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
    }
    canonical.href = `https://agrotechcolombia.com/post.html?id=${post.id}`;

    // Open Graph / Social Media
    const siteUrl = 'https://agrotechcolombia.com/';
    const imageUrl = post.image.startsWith('http') ? post.image : siteUrl + post.image;

    const ogTags = {
        'og:title': post.title,
        'og:description': post.summary,
        'og:image': imageUrl,
        'og:url': `${siteUrl}post.html?id=${post.id}`,
        'og:type': 'article'
    };

    for (const [property, content] of Object.entries(ogTags)) {
        let tag = document.querySelector(`meta[property="${property}"]`);
        if (!tag) {
            tag = document.createElement('meta');
            tag.setAttribute('property', property);
            document.head.appendChild(tag);
        }
        tag.content = content;
    }

    // Twitter Card
    const twitterTags = {
        'twitter:title': post.title,
        'twitter:description': post.summary,
        'twitter:image': imageUrl
    };
    for (const [name, content] of Object.entries(twitterTags)) {
        let tag = document.querySelector(`meta[name="${name}"]`);
        if (!tag) {
            tag = document.createElement('meta');
            tag.name = name;
            document.head.appendChild(tag);
        }
        tag.content = content;
    }

    // Article Schema JSON-LD
    const articleSchema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': post.title,
        'description': post.summary,
        'image': imageUrl,
        'datePublished': post.date,
        'author': {
            '@type': 'Person',
            'name': post.author
        },
        'publisher': {
            '@type': 'Organization',
            'name': 'AgroTech Colombia',
            'logo': {
                '@type': 'ImageObject',
                'url': siteUrl + 'images/agrotech-logo.webp'
            }
        },
        'mainEntityOfPage': {
            '@type': 'WebPage',
            '@id': `${siteUrl}post.html?id=${post.id}`
        }
    };
    const scriptEl = document.createElement('script');
    scriptEl.type = 'application/ld+json';
    scriptEl.textContent = JSON.stringify(articleSchema);
    document.head.appendChild(scriptEl);
}

/**
 * Carga 2 artículos relacionados (aleatorios o por tag)
 */
function loadRelatedPosts(allPosts, currentId) {
    const relatedGrid = document.getElementById('related-posts-grid');
    if (!relatedGrid) return;

    // Filtrar el post actual
    const otherPosts = allPosts.filter(p => p.id !== currentId);

    // Mezclar aleatoriamente
    const shuffled = otherPosts.sort(() => 0.5 - Math.random());

    // Tomar los primeros 2
    const selected = shuffled.slice(0, 2);

    relatedGrid.innerHTML = '';

    if (selected.length === 0) {
        relatedGrid.parentElement.style.display = 'none'; // Ocultar sección si no hay
        return;
    }

    selected.forEach(post => {
        const card = createPostCard(post);
        // Ajustar estilos para que se vean bien en el footer del post
        card.style.background = 'rgba(255, 255, 255, 0.03)';
        card.style.border = '1px solid rgba(255, 255, 255, 0.05)';
        relatedGrid.appendChild(card);
    });
}

/**
 * Helper para formatear fechas
 */
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-CO', options);
}
