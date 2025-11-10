// CSS imports
import "../styles/styles.css";

import App from "./pages/app.js";
import AuthService from "./utils/auth-service.js";

document.addEventListener("DOMContentLoaded", async () => {
  const authService = new AuthService();

  // Initialize App with router
  const app = new App({
    content: document.querySelector("#main-content"),
  });

  // Render initial page
  await app.renderPage();

  // Update auth UI on every route change
  window.addEventListener("hashchange", async () => {
    await app.renderPage();
    updateAuthUI();
  });

  // Initial auth UI update
  updateAuthUI();

  // Function to update authentication UI in header
  function updateAuthUI() {
    const userProfile = document.getElementById("user-profile");
    const authLinks = document.getElementById("auth-links");
    const userAvatar = document.getElementById("user-avatar");
    const userName = document.getElementById("user-name");
    const logoutBtn = document.getElementById("logout-btn");

    if (authService.isLoggedIn()) {
      const currentUser = authService.getCurrentUser();
      if (userName) userName.textContent = currentUser.name;
      if (userAvatar) {
        userAvatar.src = currentUser.avatar;
        userAvatar.alt = currentUser.name;
      }
      if (userProfile) userProfile.style.display = "flex";
      if (authLinks) authLinks.style.display = "none";
    } else {
      if (userProfile) userProfile.style.display = "none";
      if (authLinks) authLinks.style.display = "flex";
    }

    // Logout button handler
    if (logoutBtn) {
      logoutBtn.onclick = () => {
        authService.logout();
        updateAuthUI();
        window.location.hash = "#/";
      };
    }
  }
});
