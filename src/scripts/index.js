import "../styles/styles.css";

import App from "./pages/app.js";
import AuthService from "./utils/auth-service.js";
import NotificationService from "./utils/notification-service.js";

document.addEventListener("DOMContentLoaded", async () => {
  const authService = new AuthService();
  const notificationService = new NotificationService();

  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (vapidPublicKey) {
    notificationService.setVapidKey(vapidPublicKey);
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
      showNotificationMessage(
        "Failed to toggle notifications: " + error.message,
        true
      );
    } finally {
      notificationBtn.disabled = false;
    }
  }

  function showNotificationMessage(message, isError = false) {
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

  const notificationBtn = document.getElementById("notification-btn");
  if (notificationBtn) {
    notificationBtn.addEventListener("click", handleNotificationToggle);
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
