// Service Worker pour Vulsoft PWA
const CACHE_NAME = 'vulsoft-v1.0.0';
const STATIC_CACHE = 'vulsoft-static-v1.0.0';
const DYNAMIC_CACHE = 'vulsoft-dynamic-v1.0.0';

// Fichiers à mettre en cache immédiatement
const STATIC_FILES = [
    '/',
    '/index.html',
    '/offline.html',
    '/academie.html',
    '/admin.html',
    '/cours.html',
    '/demo.html',
    '/test-admin.html',
    '/test-api.html',
    '/test-pwa.html',
    '/test-signup.html',
    '/pages/about.html',
    '/pages/admin.html',
    '/pages/contact.html',
    '/pages/course-details.html',
    '/pages/cv.html',
    '/pages/dashboard.html',
    '/pages/login.html',
    '/pages/payment.html',
    '/pages/signup.html',
    '/css/main.css',
    '/css/about.css',
    '/css/academie.css',
    '/css/academy.css',
    '/css/admin.css',
    '/css/auth.css',
    '/css/course-details.css',
    '/css/payment.css',
    '/js/pwa.js',
    '/js/admin.js',
    '/js/api.js',
    '/js/notifications.js',
    '/js/academie.js',
    '/js/auth.js',
    '/js/contact.js',
    '/js/FirebaseConfig.js',
    '/js/index.js',
    '/js/login.js',
    '/js/main.js',
    '/js/script 2.js',
    '/js/SignUp.js',
    '/js/vulsoft-auth.js',
    '/images/flaconsvg.svg',
    '/images/icone.svg',
    '/images/logo-Vulsoft-1.svg',
    '/images/logo.jpg',
    '/font/agency.ttf',
    '/font/futura.ttc'
];

// URLs de l'API à ne pas mettre en cache
const API_URLS = [
    '/api/',
    'localhost:8001'
];

// Installation du Service Worker
self.addEventListener('install', event => {
    console.log('🔧 Service Worker: Installation');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('📦 Service Worker: Mise en cache des fichiers statiques');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('✅ Service Worker: Installation terminée');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('❌ Service Worker: Erreur installation', error);
            })
    );
});

// Activation du Service Worker
self.addEventListener('activate', event => {
    console.log('🚀 Service Worker: Activation');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        // Supprimer les anciens caches
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('🗑️ Service Worker: Suppression ancien cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ Service Worker: Activation terminée');
                return self.clients.claim();
            })
    );
});

// Interception des requêtes (stratégie Cache First pour les statiques, Network First pour l'API)
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Ignorer les requêtes non-HTTP
    if (!request.url.startsWith('http')) {
        return;
    }
    
    // Stratégie pour les requêtes API
    if (isApiRequest(request.url)) {
        event.respondWith(networkFirstStrategy(request));
        return;
    }
    
    // Stratégie pour les fichiers statiques
    event.respondWith(cacheFirstStrategy(request));
});

// Vérifier si c'est une requête API
function isApiRequest(url) {
    return API_URLS.some(apiUrl => url.includes(apiUrl));
}

// Stratégie Cache First (pour les fichiers statiques)
async function cacheFirstStrategy(request) {
    try {
        // Chercher d'abord dans le cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Si pas en cache, récupérer du réseau
        const networkResponse = await fetch(request);
        
        // Mettre en cache si c'est une réponse valide
        if (networkResponse.status === 200) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        console.log('📱 Service Worker: Mode hors-ligne pour', request.url);
        
        // Retourner une page hors-ligne personnalisée
        if (request.destination === 'document') {
            return caches.match('/offline.html') || new Response(
                `<!DOCTYPE html>
                <html>
                <head>
                    <title>Hors ligne - Vulsoft</title>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
                               text-align: center; padding: 2rem; background: #f8fafc; }
                        .offline-container { max-width: 400px; margin: 0 auto; 
                                           background: white; padding: 2rem; border-radius: 12px; 
                                           box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                        .offline-icon { font-size: 4rem; margin-bottom: 1rem; }
                        h1 { color: #1f2937; margin-bottom: 1rem; }
                        p { color: #6b7280; line-height: 1.6; }
                        .retry-btn { background: #3b82f6; color: white; padding: 0.75rem 1.5rem; 
                                   border: none; border-radius: 8px; cursor: pointer; margin-top: 1rem; }
                    </style>
                </head>
                <body>
                    <div class="offline-container">
                        <div class="offline-icon">📱</div>
                        <h1>Mode Hors Ligne</h1>
                        <p>Vous êtes actuellement hors ligne. Cette page a été mise en cache pour vous permettre de continuer à naviguer.</p>
                        <button class="retry-btn" onclick="window.location.reload()">Réessayer</button>
                    </div>
                </body>
                </html>`,
                { headers: { 'Content-Type': 'text/html' } }
            );
        }
        
        return new Response('Contenu non disponible hors ligne', { status: 503 });
    }
}

// Stratégie Network First (pour l'API)
async function networkFirstStrategy(request) {
    try {
        // Essayer d'abord le réseau
        const networkResponse = await fetch(request);
        
        // Mettre en cache si c'est une réponse GET valide
        if (request.method === 'GET' && networkResponse.status === 200) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        // Si le réseau échoue, chercher dans le cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Retourner une réponse d'erreur
        return new Response(
            JSON.stringify({ 
                error: 'Service non disponible hors ligne',
                offline: true 
            }),
            { 
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

// Gestion des notifications push
self.addEventListener('push', event => {
    console.log('🔔 Service Worker: Notification push reçue');
    
    const options = {
        body: 'Vous avez reçu une nouvelle notification de Vulsoft',
        icon: '/images/logo-Vulsoft-1.svg',
        badge: '/images/logo-Vulsoft-1.svg',
        vibrate: [200, 100, 200],
        data: {
            url: '/'
        },
        actions: [
            {
                action: 'open',
                title: 'Ouvrir',
                icon: '/images/logo-Vulsoft-1.svg'
            },
            {
                action: 'close',
                title: 'Fermer'
            }
        ]
    };
    
    if (event.data) {
        const data = event.data.json();
        options.body = data.body || options.body;
        options.data.url = data.url || options.data.url;
    }
    
    event.waitUntil(
        self.registration.showNotification('Vulsoft', options)
    );
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', event => {
    console.log('👆 Service Worker: Clic sur notification');
    
    event.notification.close();
    
    if (event.action === 'close') {
        return;
    }
    
    const url = event.notification.data?.url || '/';
    
    event.waitUntil(
        clients.matchAll({ type: 'window' })
            .then(clientList => {
                // Si une fenêtre est déjà ouverte, la focuser
                for (const client of clientList) {
                    if (client.url === url && 'focus' in client) {
                        return client.focus();
                    }
                }
                
                // Sinon, ouvrir une nouvelle fenêtre
                if (clients.openWindow) {
                    return clients.openWindow(url);
                }
            })
    );
});

// Synchronisation en arrière-plan
self.addEventListener('sync', event => {
    console.log('🔄 Service Worker: Synchronisation en arrière-plan');
    
    if (event.tag === 'background-sync') {
        event.waitUntil(
            // Ici on pourrait synchroniser les données hors ligne
            console.log('📡 Synchronisation des données...')
        );
    }
});

// Gestion des mises à jour
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});