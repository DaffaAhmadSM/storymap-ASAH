self.addEventListener("push", (event) => {
  const data = event.data.json();

  // debug the data received
  console.log("Push received:", data);

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

  event.waitUntil(clients.openWindow("/map"));
});

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});
