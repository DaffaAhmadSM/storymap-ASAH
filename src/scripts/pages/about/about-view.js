class AboutView {
  constructor() {
    this.container = null;
  }

  renderAppInfo(appInfo) {
    return `
      <div class="about-section app-info">
        <h2>About ${appInfo.name}</h2>
        <p class="app-description">${appInfo.description}</p>
        <div class="info-grid">
          <div class="info-item">
            <strong>Version:</strong> ${appInfo.version}
          </div>
          <div class="info-item">
            <strong>Architecture:</strong> ${appInfo.architecture}
          </div>
        </div>
      </div>
    `;
  }

  renderTechnologyCard(tech) {
    return `
      <div class="tech-card" data-tech-id="${tech.id}">
        <div class="tech-icon">${tech.icon}</div>
        <h3>${tech.name}</h3>
        <p>${tech.description}</p>
      </div>
    `;
  }

  renderTechnologies(technologies) {
    const techCards = technologies
      .map((tech) => this.renderTechnologyCard(tech))
      .join("");

    return `
      <div class="about-section technologies">
        <h2>Technologies Used</h2>
        <div class="tech-grid">
          ${techCards}
        </div>
      </div>
    `;
  }

  renderFeatureItem(feature) {
    return `
      <div class="feature-item" data-feature-id="${feature.id}">
        <h3>${feature.title}</h3>
        <p>${feature.description}</p>
      </div>
    `;
  }

  renderFeatures(features) {
    const featureItems = features
      .map((feature) => this.renderFeatureItem(feature))
      .join("");

    return `
      <div class="about-section features">
        <h2>Key Features</h2>
        <div class="features-list">
          ${featureItems}
        </div>
      </div>
    `;
  }

  renderTeam(team) {
    const teamMembers = team
      .map(
        (member) => `
      <div class="team-member">
        <h3>${member.role}</h3>
        <p>${member.description}</p>
      </div>
    `
      )
      .join("");

    return `
      <div class="about-section team">
        <h2>Development</h2>
        <div class="team-grid">
          ${teamMembers}
        </div>
      </div>
    `;
  }

  renderStatistics(stats) {
    return `
      <div class="about-section statistics">
        <h2>Quick Stats</h2>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-number">${stats.totalTechnologies}</div>
            <div class="stat-label">Technologies</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${stats.totalFeatures}</div>
            <div class="stat-label">Features</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${stats.version}</div>
            <div class="stat-label">Version</div>
          </div>
        </div>
      </div>
    `;
  }

  render(data) {
    return `
      <div class="about-container">
        ${this.renderAppInfo(data.appInfo)}
        ${this.renderStatistics(data.statistics)}
        ${this.renderTechnologies(data.technologies)}
        ${this.renderFeatures(data.features)}
        ${this.renderTeam(data.team)}

        <div class="about-section cta">
          <h2>Get Started</h2>
          <p>Ready to explore stories on the map?</p>
          <div class="cta-buttons">
            <a href="#/map" class="btn btn-primary btn-large">View Map</a>
            <a href="#/" class="btn btn-secondary btn-large">Home</a>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents(handlers) {
    const techCards = document.querySelectorAll(".tech-card");
    techCards.forEach((card) => {
      const techId = parseInt(card.dataset.techId);
      card.addEventListener("click", () => {
        if (handlers.onTechClick) {
          handlers.onTechClick(techId);
        }
      });
    });

    const featureItems = document.querySelectorAll(".feature-item");
    featureItems.forEach((item) => {
      const featureId = parseInt(item.dataset.featureId);
      item.addEventListener("click", () => {
        if (handlers.onFeatureClick) {
          handlers.onFeatureClick(featureId);
        }
      });
    });

    // CTA buttons
    const mapButton = document.querySelector('.cta a[href="#/map"]');
    if (mapButton && handlers.onMapButtonClick) {
      mapButton.addEventListener("click", (e) => {
        handlers.onMapButtonClick(e);
      });
    }

    const homeButton = document.querySelector('.cta a[href="#/"]');
    if (homeButton && handlers.onHomeButtonClick) {
      homeButton.addEventListener("click", (e) => {
        handlers.onHomeButtonClick(e);
      });
    }
  }

  /**
   * Shows loading state
   */
  showLoading() {
    const aboutContainer = document.querySelector(".about-container");
    if (aboutContainer) {
      aboutContainer.innerHTML = `
        <div style="text-align: center; padding: 60px 20px;">
          <div class="spinner" style="margin: 0 auto 20px;"></div>
          <p>Loading...</p>
        </div>
      `;
    }
  }

  showError(message) {
    const aboutContainer = document.querySelector(".about-container");
    if (aboutContainer) {
      aboutContainer.innerHTML = `
        <div class="error-container" style="text-align: center; padding: 60px 20px;">
          <h2 style="color: #e74c3c; margin-bottom: 15px;">Error</h2>
          <p style="color: #555;">${message}</p>
          <a href="#/" class="btn btn-primary" style="margin-top: 20px;">Go Home</a>
        </div>
      `;
    }
  }

  highlightSection(sectionClass) {
    const section = document.querySelector(`.${sectionClass}`);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
      section.classList.add("highlighted");
      setTimeout(() => {
        section.classList.remove("highlighted");
      }, 2000);
    }
  }

  /**
   * Cleanup method when leaving page
   */
  destroy() {
    this.container = null;
  }
}

export default AboutView;
