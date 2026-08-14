// CoderDojo Fianarantsoa Hub — Service Worker
// Strategy: Cache-First for static assets & avatars, Network-First for navigations

const CACHE_NAME = "coderdojo-hub-v3";
const STATIC_ASSETS = [
  "/",
  "/dashboard",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/logo.jpg",
  "/file.svg",
  "/globe.svg",
  "/next.svg",
  "/vercel.svg",
  "/window.svg",
];

// Install: pre-cache the app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Activate new SW immediately
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  // Take control of all pages immediately
  self.clients.claim();
});

/**
 * Broadcast a message to all controlled clients.
 * Used to notify pages of online/offline state changes.
 */
function broadcastToClients(message) {
  self.clients.matchAll({ type: "window" }).then((clients) => {
    clients.forEach((client) => client.postMessage(message));
  });
}

/**
 * Check if a URL points to a Firebase Storage avatar image.
 */
function isFirebaseStorageAvatar(url) {
  return (
    url.hostname.includes("firebasestorage.googleapis.com") &&
    url.pathname.includes("/o/") &&
    /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url.href)
  );
}

/**
 * Check if a URL is a static asset that should use Cache-First strategy.
 */
function isStaticAsset(url) {
  return (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff2?|ttf|eot|webp)$/) ||
    url.pathname.startsWith("/_next/static/")
  );
}

// Fetch: route requests to the appropriate caching strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Only handle http(s) requests
  if (url.protocol !== "http:" && url.protocol !== "https:") return;
  if (url.hostname.includes("chrome-extension")) return;

  // Skip Firebase Auth & API requests — never cache these
  if (
    url.hostname.includes("identitytoolkit.googleapis.com") ||
    url.hostname.includes("securetoken.googleapis.com") ||
    url.hostname.includes("firebaseio.com") ||
    url.hostname.includes("firestore.googleapis.com") ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }

  // ── Strategy 1: Firebase Storage Avatars — Stale-While-Revalidate ──
  // Serve cached version immediately, update cache in background
  if (isFirebaseStorageAvatar(url)) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then((cached) => {
          const networkFetch = fetch(request)
            .then((response) => {
              if (response.ok) {
                cache.put(request, response.clone());
              }
              return response;
            })
            .catch(() => {
              // Network failed: return cached avatar or fallback to logo
              if (cached) return cached;
              return cache.match("/logo.jpg");
            });

          // Return cached immediately if available, otherwise wait for network
          return cached || networkFetch;
        })
      )
    );
    return;
  }

  // ── Strategy 2: Navigation requests — Network-First with cache fallback ──
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          broadcastToClients({ type: "SW_ONLINE" });
          return response;
        })
        .catch(() => {
          broadcastToClients({ type: "SW_OFFLINE" });
          return caches
            .match(request)
            .then((cached) => cached || caches.match("/"));
        })
    );
    return;
  }

  // ── Strategy 3: Static assets — Cache-First with network fallback ──
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          })
      )
    );
    return;
  }

  // ── Strategy 4: Everything else — Network-First ──
  event.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      })
      .catch(() => caches.match(request))
  );
});
