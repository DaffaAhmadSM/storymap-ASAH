import MapModel from "./map-model.js";
import MapView from "./map-view.js";
import MapPresenter from "./map-presenter.js";
import AuthService from "../../utils/auth-service.js";

export default class MapPage {
  constructor() {
    this.presenter = null;
  }

  async render() {
    const authService = new AuthService();
    const isLoggedIn = authService.isLoggedIn();

    if (!isLoggedIn) {
      return `
        <main class="auth-required-container" role="main" aria-labelledby="auth-heading">
          <div class="auth-required-content">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" role="img" aria-label="Microphone icon representing storytelling">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
            <h2 id="auth-heading">Authentication Required</h2>
            <p>Please sign in to view and share stories on the map</p>
            <a href="#/login" class="btn-login" aria-label="Sign in to access map features">
              Sign In
            </a>
          </div>
        </main>
      `;
    }

    return `
      <main role="main" aria-label="Story Map">
        <div id="loading" class="loading-indicator" role="status" aria-live="polite" aria-label="Loading stories">
          <div class="spinner" aria-hidden="true"></div>
          <p>Loading stories...</p>
        </div>

        <div id="error" class="error-message" role="alert" aria-live="assertive" style="display: none;"></div>
        
        <div id="success-message" class="success-message" role="status" aria-live="polite" style="display: none;"></div>

        <a href="#/add-story" id="add-story-btn" class="add-story-btn" aria-label="Add new story">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" role="img" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Add Story</span>
        </a>

        <button id="toggle-sidebar-btn" class="toggle-sidebar-btn" title="Toggle stories sidebar" aria-label="Toggle stories sidebar" aria-expanded="true" aria-controls="story-list-sidebar">✕</button>

        <aside id="story-list-sidebar" class="story-list-sidebar" role="complementary" aria-label="Stories list">
          <div class="story-list-content">
            <h3>Stories</h3>
            <p class="no-stories">Loading stories...</p>
          </div>
        </aside>

        <div id="map" class="map-container" role="application" aria-label="Interactive map showing story locations"></div>

        <div id="story-detail-modal" class="modal" role="dialog" aria-modal="true" aria-labelledby="story-detail-title" style="display: none;">
          <div class="modal-content"></div>
        </div>
      </main>
    `;
  }

  async afterRender() {
    const authService = new AuthService();
    const isLoggedIn = authService.isLoggedIn();

    if (!isLoggedIn) {
      return;
    }

    const model = new MapModel();
    const view = new MapView();

    const config = {
      apiUrl: import.meta.env.VITE_API_URL,
      bearerToken: import.meta.env.VITE_BEARER_TOKEN || null,
    };

    this.presenter = new MapPresenter(model, view, authService, config);
    await this.presenter.init();
  }

  async onDestroy() {
    if (this.presenter) {
      this.presenter.destroy();
    }
  }
}
