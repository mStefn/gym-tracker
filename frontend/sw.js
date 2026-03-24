const CACHE_NAME = 'gym-tracker-v1';

// Assets to be pre-cached during the "install" phase
const ASSETS = [
  './',
  './index.html',
  './admin.html',
  './css/style.css',
  './js/app.js',
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
 * Triggered when the Service Worker is first registered.
 * It downloads and stores all static assets in the cache.
 */
self.addEventListener('install', (event) => {
  // Forces the waiting Service Worker to become the active Service Worker
  globalThis.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('PWA: Pre-caching static assets');
      return cache.addAll(ASSETS);
    })
  );
});

/**
 * ACTIVATE EVENT
 * Triggered after the Service Worker takes control.
 * Used for cleaning up old caches from previous versions.
 */
self.addEventListener('activate', (event) => {
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
  // Ensures that updates to the Service Worker take effect immediately
  return globalThis.clients.claim();
});

/**
 * FETCH EVENT
 * Intercepts network requests.
 * Strategy: Cache-First for static assets, Network-First for API calls.
 */
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip caching for API calls (Backend interaction)
  // We want real-time data from the Go backend, not cached logs.
  if (url.port === '5001' || url.pathname.startsWith('/api')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Strategy for static files: Serve from cache, fallback to network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});