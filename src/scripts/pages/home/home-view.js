class HomeView {
  constructor() {
    this.container = null;
  }

  renderHeroSection(user) {
    const isLoggedIn = user !== null;
    const welcomeMessage = isLoggedIn
      ? `Welcome back, <strong>${user.name}</strong>!`
      : "Login to share your own stories.";

    return `
      <div class="hero-section">
        <p>Welcome to Story Map</p>
        <p class="hero-description">
          Explore amazing stories from around the world on an interactive map.
          ${welcomeMessage}
        </p>
        <div class="cta-buttons">
          <a href="#/map" class="btn btn-primary btn-large">View Story Map</a>
          ${
            !isLoggedIn
              ? '<a href="#/login" class="btn btn-login btn-large">Login</a>'
              : ""
          }
        </div>
      </div>
    `;
  }

  renderFeatureCard(feature) {
    return `
      <div class="feature-card">
        <div class="feature-icon">${feature.icon}</div>
        <h3>${feature.title}</h3>
        <p>${feature.description}</p>
      </div>
    `;
  }

  renderFeaturesSection(features) {
    const featureCards = features
      .map((feature) => this.renderFeatureCard(feature))
      .join("");

    return `
      <div class="features-section">
        ${featureCards}
      </div>
    `;
  }

  render(user, features) {
    return `
      <section class="home-section">
        ${this.renderHeroSection(user)}
        ${this.renderFeaturesSection(features)}
      </section>
    `;
  }

  updateWelcomeMessage(user) {
    const descriptionElement = document.querySelector(".hero-description");
    if (descriptionElement && user) {
      const welcomeMessage = `Welcome back, <strong>${user.name}</strong>!`;
      descriptionElement.innerHTML = `
        Explore amazing stories from around the world on an interactive map.
        ${welcomeMessage}
      `;
    }
  }

  toggleLoginButton(show) {
    const ctaButtons = document.querySelector(".cta-buttons");
    if (!ctaButtons) return;

    const loginButton = ctaButtons.querySelector(".btn-login");
    if (show && !loginButton) {
      const loginBtn = document.createElement("a");
      loginBtn.href = "#/login";
      loginBtn.className = "btn btn-login btn-large";
      loginBtn.textContent = "Login";
      ctaButtons.appendChild(loginBtn);
    } else if (!show && loginButton) {
      loginButton.remove();
    }
  }

  bindEvents(handlers) {
    // Feature cards click handlers
    const featureCards = document.querySelectorAll(".feature-card");
    featureCards.forEach((card, index) => {
      card.addEventListener("click", () => {
        if (handlers.onFeatureClick) {
          handlers.onFeatureClick(index);
        }
      });
    });

    // View Map button click
    const mapButton = document.querySelector('a[href="#/map"]');
    if (mapButton && handlers.onMapButtonClick) {
      mapButton.addEventListener("click", (e) => {
        handlers.onMapButtonClick(e);
      });
    }

    // Login button click
    const loginButton = document.querySelector('a[href="#/login"]');
    if (loginButton && handlers.onLoginButtonClick) {
      loginButton.addEventListener("click", (e) => {
        handlers.onLoginButtonClick(e);
      });
    }
  }

  /**
   * Shows loading state
   */
  showLoading() {
    const homeSection = document.querySelector(".home-section");
    if (homeSection) {
      homeSection.innerHTML = `
        <div style="text-align: center; padding: 60px 20px;">
          <div class="spinner" style="margin: 0 auto 20px;"></div>
          <p>Loading...</p>
        </div>
      `;
    }
  }

  showError(message) {
    const homeSection = document.querySelector(".home-section");
    if (homeSection) {
      homeSection.innerHTML = `
        <div class="error-container" style="text-align: center; padding: 60px 20px;">
          <h2 style="color: #e74c3c; margin-bottom: 15px;">Oops! Something went wrong</h2>
          <p style="color: #555;">${message}</p>
          <a href="#/" class="btn btn-primary" style="margin-top: 20px;">Try Again</a>
        </div>
      `;
    }
  }

  /**
   * Cleanup method when leaving page
   */
  destroy() {
    // Remove any event listeners or cleanup tasks if needed
    this.container = null;
  }
}

export default HomeView;
