import "../styles/styles.css";

import App from "./pages/app.js";
import AuthService from "./utils/auth-service.js";
import NotificationService from "./utils/notification-service.js";
import syncManager from "./utils/sync-manager.js";

document.addEventListener("DOMContentLoaded", async () => {
  const authService = new AuthService();
  const notificationService = new NotificationService();

  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (vapidPublicKey) {
    notificationService.setVapidKey(vapidPublicKey);
  }

  // Initialize sync manager
  const apiUrl = import.meta.env.VITE_API_URL;
  const token = authService.getToken();
  if (apiUrl && token) {
    syncManager.initialize(apiUrl, token);
    console.log("Sync manager initialized");
  }

  const app = new App({
    content: document.querySelector("#main-content"),
  });

  await app.renderPage();

  window.addEventListener("hashchange", async () => {
    await app.renderPage();
    updateAuthUI();
  });

  // Register service worker on page load (regardless of login status)
  await registerServiceWorker();

  // Initialize PWA install prompt
  initializePWAInstall();

  // Initialize offline detection
  initializeOfflineDetection();

  updateAuthUI();
  await initializeNotifications();

  async function registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
        console.log("Service Worker registered successfully:", registration);
        notificationService.registration = registration;
      } catch (error) {
        console.error("Service Worker registration failed:", error);
      }
    }
  }

  // PWA Install functionality
  let deferredPrompt = null;

  function initializePWAInstall() {
    const installBtn = document.getElementById("install-btn");

    // Listen for beforeinstallprompt event
    window.addEventListener("beforeinstallprompt", (e) => {
      console.log("beforeinstallprompt event fired");
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Save the event so it can be triggered later
      deferredPrompt = e;
      // Show install button
      if (installBtn) {
        installBtn.style.display = "flex";
      }
    });

    // Handle install button click
    if (installBtn) {
      installBtn.addEventListener("click", async () => {
        if (!deferredPrompt) {
          console.log("No deferred prompt available");
          return;
        }

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to install prompt: ${outcome}`);

        if (outcome === "accepted") {
          console.log("PWA installation accepted");
          showInstallMessage("App installed successfully!", false);
        } else {
          console.log("PWA installation dismissed");
        }

        // Clear the deferred prompt
        deferredPrompt = null;
        installBtn.style.display = "none";
      });
    }

    // Listen for app installed event
    window.addEventListener("appinstalled", () => {
      console.log("PWA installed successfully");
      showInstallMessage(
        "Story Map installed! You can now use it offline.",
        false
      );
      if (installBtn) {
        installBtn.style.display = "none";
      }
      deferredPrompt = null;
    });

    // Check if app is already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      console.log("App is running in standalone mode");
      if (installBtn) {
        installBtn.style.display = "none";
      }
    }
  }

  function showInstallMessage(message, isError = false) {
    const messageDiv = document.createElement("div");
    messageDiv.className = isError
      ? "notification-toast error"
      : "notification-toast success";
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      padding: 15px 20px;
      background: ${isError ? "#e74c3c" : "#27ae60"};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(messageDiv);

    setTimeout(() => {
      messageDiv.style.animation = "slideOut 0.3s ease";
      setTimeout(() => messageDiv.remove(), 300);
    }, 3000);
  }

  // Offline/Online detection
  function initializeOfflineDetection() {
    const offlineIndicator = document.getElementById("offline-indicator");

    function updateOnlineStatus() {
      if (offlineIndicator) {
        if (navigator.onLine) {
          offlineIndicator.style.display = "none";
          console.log("App is online");
        } else {
          offlineIndicator.style.display = "flex";
          console.log("App is offline");
        }
      }
    }

    // Check initial status
    updateOnlineStatus();

    // Listen for online/offline events
    window.addEventListener("online", () => {
      updateOnlineStatus();
      showInstallMessage("You are back online!", false);

      // Trigger sync when back online
      const token = authService.getToken();
      if (token) {
        syncManager.updateToken(token);
        syncManager.syncPendingStories().catch((error) => {
          console.error("Auto-sync failed:", error);
        });
      }

      // Reload current page data when back online
      app.renderPage();
    });

    window.addEventListener("offline", () => {
      updateOnlineStatus();
      showInstallMessage("You are offline. Showing cached data.", true);
    });
  }

  async function initializeNotifications() {
    if (!authService.isLoggedIn()) {
      return;
    }

    try {
      // Service worker already registered, just update UI
      await updateNotificationUI();
    } catch (error) {
      console.error("Failed to initialize notifications:", error);
    }
  }

  async function updateNotificationUI() {
    const notificationBtn = document.getElementById("notification-btn");
    const iconBell = notificationBtn?.querySelector(".icon-bell");
    const iconBellOff = notificationBtn?.querySelector(".icon-bell-off");

    if (!notificationBtn) return;

    if (!authService.isLoggedIn()) {
      notificationBtn.style.display = "none";
      return;
    }

    notificationBtn.style.display = "flex";

    const isSubscribed = await notificationService.isSubscribed();

    if (isSubscribed) {
      if (iconBell) iconBell.style.display = "block";
      if (iconBellOff) iconBellOff.style.display = "none";
      notificationBtn.classList.add("subscribed");
      notificationBtn.title = "Notifications enabled - Click to disable";
    } else {
      if (iconBell) iconBell.style.display = "none";
      if (iconBellOff) iconBellOff.style.display = "block";
      notificationBtn.classList.remove("subscribed");
      notificationBtn.title = "Notifications disabled - Click to enable";
    }
  }

  async function handleNotificationToggle() {
    const notificationBtn = document.getElementById("notification-btn");
    if (!notificationBtn || !authService.isLoggedIn()) return;

    const apiUrl = import.meta.env.VITE_API_URL;
    const token = authService.getToken();

    try {
      notificationBtn.disabled = true;

      // Check if browser supports notifications
      if (!("Notification" in window)) {
        throw new Error("This browser does not support notifications");
      }

      if (!("PushManager" in window)) {
        throw new Error("This browser does not support push notifications");
      }

      // Check if running on HTTPS or localhost
      const isSecure =
        window.isSecureContext ||
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        window.location.protocol === "https:";

      if (!isSecure) {
        throw new Error(
          "Push notifications require HTTPS. Please access the app via HTTPS or localhost."
        );
      }

      // Ensure service worker is registered
      if (!notificationService.registration) {
        await registerServiceWorker();
      }

      const isSubscribed = await notificationService.isSubscribed();

      if (isSubscribed) {
        await notificationService.unsubscribe(apiUrl, token);
        showNotificationMessage("Notifications disabled successfully");
      } else {
        await notificationService.subscribe(apiUrl, token);
        showNotificationMessage("Notifications enabled successfully");
      }

      await updateNotificationUI();
    } catch (error) {
      console.error("Notification toggle error:", error);

      // Show user-friendly error messages
      let errorMessage = error.message;

      if (error.message.includes("HTTPS")) {
        errorMessage =
          "⚠️ Push notifications require HTTPS.\n\n" +
          "Please access the app via:\n" +
          "• https://your-domain.com\n" +
          "• or http://localhost";
      } else if (error.message.includes("denied")) {
        errorMessage =
          "❌ Notification permission denied.\n\n" +
          "Please enable notifications in your browser settings.";
      } else if (error.message.includes("not support")) {
        errorMessage =
          "❌ Your browser doesn't support push notifications.\n\n" +
          "Please use a modern browser like Chrome, Firefox, or Edge.";
      } else if (error.message.includes("VAPID")) {
        errorMessage =
          "⚠️ Push notification configuration error.\n\n" +
          "Please contact the administrator.";
      }

      showNotificationMessage(errorMessage, true);
    } finally {
      notificationBtn.disabled = false;
    }
  }

  function showNotificationMessage(message, isError = false) {
    const messageDiv = document.createElement("div");
    messageDiv.className = isError
      ? "notification-toast error"
      : "notification-toast success";

    // Support multiline messages
    messageDiv.innerHTML = message.replace(/\n/g, "<br>");

    messageDiv.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      padding: 15px 20px;
      background: ${isError ? "#e74c3c" : "#27ae60"};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 10000;
      animation: slideIn 0.3s ease;
      max-width: 400px;
      text-align: left;
      line-height: 1.5;
    `;

    document.body.appendChild(messageDiv);

    setTimeout(
      () => {
        messageDiv.style.animation = "slideOut 0.3s ease";
        setTimeout(() => messageDiv.remove(), 300);
      },
      isError ? 5000 : 3000
    ); // Show errors longer
  }

  const notificationBtn = document.getElementById("notification-btn");
  if (notificationBtn) {
    notificationBtn.addEventListener("click", handleNotificationToggle);
  }

  // Sync button functionality
  const syncBtn = document.getElementById("sync-btn");
  if (syncBtn) {
    syncBtn.addEventListener("click", handleSyncClick);
  }

  // Update sync UI periodically
  setInterval(updateSyncUI, 2000);
  updateSyncUI();

  // Listen to sync events
  syncManager.onSync((event, data) => {
    if (event === "sync-start") {
      showNotificationMessage("Syncing pending stories...");
    } else if (event === "sync-complete") {
      if (data.synced > 0) {
        showNotificationMessage(`Synced ${data.synced} stories successfully!`);
        app.renderPage(); // Refresh page to show synced stories
      }
      if (data.failed > 0) {
        showNotificationMessage(`${data.failed} stories failed to sync`, true);
      }
      updateSyncUI();
    } else if (event === "story-queued") {
      showNotificationMessage("Story saved offline");
      updateSyncUI();
    }
  });

  async function handleSyncClick() {
    if (!authService.isLoggedIn()) return;

    try {
      syncBtn.disabled = true;
      syncBtn.classList.add("syncing");

      const token = authService.getToken();
      syncManager.updateToken(token);

      await syncManager.syncPendingStories();
    } catch (error) {
      console.error("Manual sync error:", error);
      showNotificationMessage("Sync failed: " + error.message, true);
    } finally {
      syncBtn.disabled = false;
      syncBtn.classList.remove("syncing");
    }
  }

  async function updateSyncUI() {
    const syncBadge = document.getElementById("sync-badge");

    if (!authService.isLoggedIn()) {
      if (syncBtn) syncBtn.style.display = "none";
      return;
    }

    try {
      const status = await syncManager.getSyncStatus();

      if (status.pendingCount > 0) {
        if (syncBtn) syncBtn.style.display = "flex";
        if (syncBadge) {
          syncBadge.style.display = "flex";
          syncBadge.textContent = status.pendingCount;
        }

        // Update title with sync info
        if (syncBtn) {
          if (status.isSyncing) {
            syncBtn.title = "Syncing...";
          } else if (status.canSync) {
            syncBtn.title = `Click to sync ${status.pendingCount} pending stories`;
          } else {
            syncBtn.title = `${status.pendingCount} stories pending - will sync when online`;
          }
        }
      } else {
        if (syncBtn) syncBtn.style.display = "none";
      }
    } catch (error) {
      console.error("Error updating sync UI:", error);
    }
  }

  function updateAuthUI() {
    const userProfile = document.getElementById("user-profile");
    const authLinks = document.getElementById("auth-links");
    const userAvatar = document.getElementById("user-avatar");
    const userName = document.getElementById("user-name");
    const logoutBtn = document.getElementById("logout-btn");
    const notificationBtn = document.getElementById("notification-btn");

    if (authService.isLoggedIn()) {
      const currentUser = authService.getCurrentUser();
      if (userName) userName.textContent = currentUser.name;
      if (userAvatar) {
        userAvatar.src = currentUser.avatar;
        userAvatar.alt = currentUser.name;
      }
      if (userProfile) userProfile.style.display = "flex";
      if (authLinks) authLinks.style.display = "none";

      if (notificationBtn) {
        notificationBtn.style.display = "flex";
        updateNotificationUI();
      }
    } else {
      if (userProfile) userProfile.style.display = "none";
      if (authLinks) authLinks.style.display = "flex";
      if (notificationBtn) notificationBtn.style.display = "none";
    }

    if (logoutBtn) {
      logoutBtn.onclick = () => {
        authService.logout();
        updateAuthUI();
        window.location.hash = "#/";
      };
    }
  }
});
