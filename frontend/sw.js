const CACHE_NAME = 'gym-tracker-v2.0'; 

// Assets to be pre-cached during the "install" phase
const ASSETS = [
  './',
  './index.html',
  './admin.html',
  './css/style.css?v=2.0',
  './js/app.js?v=2.0',
  './js/state.js',
  './js/auth.js',
  './js/workout.js',
  './js/plans.js',
  './js/dashboard.js',
  './js/stats.js',
  './gym-tracker.webp',
  './img/icon-512.png',
  './manifest.json'
];

/**
 * INSTALL EVENT
 */
globalThis.addEventListener('install', (event) => {
  globalThis.skipWaiting(); 
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('PWA: Pre-caching static assets (v2.0)');
      return cache.addAll(ASSETS);
    })
  );
});

/**
 * ACTIVATE EVENT
 */
globalThis.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('PWA: Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return globalThis.clients.claim(); 
});

/**
 * FETCH EVENT - ZMIENIONA STRATEGIA NA NETWORK-FIRST 
 */
globalThis.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.port === '5001' || url.pathname.startsWith('/api') || url.pathname.startsWith('/last') || url.pathname.startsWith('/log')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Network-First Strategy dla HTML/CSS/JS
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {        
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() => {        
        return caches.match(event.request);
      })
  );
});