self.addEventListener("push", (event) => {
  const data = event.data.json();

  const title = data.title || "Story Map Notification";
  const options = {
    body: data.options?.body || "You have a new notification",
    icon: "/favicon.png",
    badge: "/favicon.png",
    vibrate: [200, 100, 200],
    tag: "story-notification",
    requireInteraction: false,
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = "/#/map";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.location.origin) && "focus" in client) {
            // Focus existing window and navigate to map
            return client.focus().then(() => {
              return client.navigate(targetUrl);
            });
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip caching for:
  // - Non-http(s) requests (chrome-extension, etc)
  // - Vite HMR and dev server requests
  // - Browser extensions
  if (
    !request.url.startsWith("http") ||
    url.pathname.includes("/@vite") ||
    url.pathname.includes("/@fs") ||
    url.pathname.includes("/__vite") ||
    url.pathname.includes("/node_modules") ||
    url.searchParams.has("t") // Vite timestamp query
  ) {
    return;
  }

  // API requests - Network First with Cache Fallback
  if (
    url.pathname.includes("/stories") ||
    url.pathname.includes("/notifications")
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone the response before caching
          const responseClone = response.clone();

          // Only cache successful responses
          if (response.status === 200) {
            caches.open(API_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }

          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }

            // If no cache, return offline page data
            return new Response(
              JSON.stringify({
                error: true,
                message: "You are offline. Showing cached data.",
                listStory: [],
              }),
              {
                headers: { "Content-Type": "application/json" },
              }
            );
          });
        })
    );
    return;
  }

  // Image requests - Cache First with Network Fallback
  if (
    request.destination === "image" ||
    url.pathname.match(/\.(jpg|jpeg|png|gif|svg|webp)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then((response) => {
            // Clone and cache the image
            const responseClone = response.clone();
            caches.open(IMAGE_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
            return response;
          })
          .catch(() => {
            // Return a placeholder image if offline and not cached
            return new Response(
              '<svg width="100" height="100"><rect width="100" height="100" fill="#ccc"/><text x="50%" y="50%" text-anchor="middle" fill="#666">Offline</text></svg>',
              { headers: { "Content-Type": "image/svg+xml" } }
            );
          });
      })
    );
    return;
  }

  // Static assets (HTML, CSS, JS) - Cache First with Network Fallback
  event.respondWith(
    caches
      .match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).then((response) => {
          // Only cache successful GET requests
          if (request.method === "GET" && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
      .catch((error) => {
        console.error("Fetch failed:", error);

        // Return offline page for navigation requests
        if (request.mode === "navigate") {
          return caches.match("/index.html");
        }

        // For other requests, let it fail gracefully
        return new Response("Network error occurred", {
          status: 408,
          headers: { "Content-Type": "text/plain" },
        });
      })
  );
});

const CACHE_NAME = "story-map-v1";
const API_CACHE_NAME = "story-map-api-v1";
const IMAGE_CACHE_NAME = "story-map-images-v1";

// Assets to cache on install
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/images/icon-192x192.png",
  "/images/icon-512x512.png",
  "/stories-placeholder.png",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("Service Worker installing...");

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Caching static assets");
        // Use addAll for critical assets, but don't fail if some are missing
        return cache.addAll(STATIC_ASSETS).catch((error) => {
          console.warn("Some assets failed to cache:", error);
          // Cache assets individually to avoid failing completely
          return Promise.all(
            STATIC_ASSETS.map((url) =>
              cache
                .add(url)
                .catch((err) => console.warn(`Failed to cache ${url}:`, err))
            )
          );
        });
      })
      .then(() => {
        console.log("Service Worker installed successfully");
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("Service Worker installation failed:", error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== CACHE_NAME &&
              cacheName !== API_CACHE_NAME &&
              cacheName !== IMAGE_CACHE_NAME
            ) {
              console.log("Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});
