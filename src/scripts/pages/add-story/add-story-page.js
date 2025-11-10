import AddStoryModel from "./add-story-model.js";
import AddStoryView from "./add-story-view.js";
import AddStoryPresenter from "./add-story-presenter.js";
import AuthService from "../../utils/auth-service.js";

export default class AddStoryPage {
  constructor() {
    this.presenter = null;
  }

  async render() {
    const authService = new AuthService();
    const isLoggedIn = authService.isLoggedIn();

    if (!isLoggedIn) {
      window.location.hash = "#/login";
      return `<div class="loading-indicator"><p>Redirecting to login...</p></div>`;
    }

    return `
      <main class="add-story-container" role="main" aria-labelledby="add-story-heading">
        <div class="add-story-content">
          <header class="page-header">
            <h1 id="add-story-heading">Add New Story</h1>
            <p class="page-subtitle">Share your moments with the world</p>
          </header>

          <div id="loading" class="loading-indicator" role="status" aria-live="polite" style="display: none;">
            <div class="spinner" aria-hidden="true"></div>
            <p>Adding your story...</p>
          </div>

          <div id="error" class="error-message" role="alert" aria-live="assertive" style="display: none;"></div>
          
          <div id="success-message" class="success-message" role="status" aria-live="polite" style="display: none;"></div>

          <form id="add-story-form" class="add-story-form" aria-label="Add new story form">
            <fieldset class="form-group">
              <legend>Photo Input Method</legend>
              <div class="radio-group photo-method-group" role="radiogroup" aria-label="Choose photo input method">
                <label class="radio-label">
                  <input 
                    type="radio" 
                    name="photo-method" 
                    value="file"
                    checked
                    aria-label="Choose file from device"
                  />
                  <span>📁 Choose File</span>
                </label>
                
                <label class="radio-label">
                  <input 
                    type="radio" 
                    name="photo-method" 
                    value="camera"
                    aria-label="Take photo with camera"
                  />
                  <span>📷 Take Photo</span>
                </label>
              </div>
            </fieldset>

            <div class="form-group" id="file-input-group">
              <label for="photo-input">Photo * <span class="sr-only">(Required)</span></label>
              <input 
                type="file" 
                id="photo-input" 
                name="photo" 
                accept="image/*"
                aria-describedby="photo-help"
              />
              <small id="photo-help">Max size: 1MB. Supported formats: JPG, PNG, GIF</small>
            </div>

            <div class="form-group" id="camera-input-group" style="display: none;">
              <label id="camera-label">Camera</label>
              <div id="camera-container" class="camera-container" role="region" aria-labelledby="camera-label" aria-describedby="camera-status">
                <video id="camera-video" autoplay playsinline aria-label="Camera preview"></video>
                <canvas id="camera-canvas" style="display: none;" aria-label="Captured photo"></canvas>
              </div>
              <div class="camera-controls" role="group" aria-label="Camera controls">
                <button type="button" id="start-camera-btn" class="btn-camera" aria-label="Start camera">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" role="img" aria-hidden="true">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                    <circle cx="12" cy="13" r="4"></circle>
                  </svg>
                  <span>Start Camera</span>
                </button>
                <button type="button" id="capture-photo-btn" class="btn-camera" style="display: none;" aria-label="Capture photo">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" role="img" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"></circle>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  <span>Capture Photo</span>
                </button>
                <button type="button" id="retake-photo-btn" class="btn-camera" style="display: none;" aria-label="Retake photo">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" role="img" aria-hidden="true">
                    <polyline points="1 4 1 10 7 10"></polyline>
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                  </svg>
                  <span>Retake</span>
                </button>
              </div>
              <small id="camera-status" role="status" aria-live="polite">Click "Start Camera" to begin</small>
            </div>

            <div class="form-group">
              <div id="photo-preview" class="photo-preview" role="img" aria-label="Photo preview"></div>
            </div>

            <div class="form-group">
              <label for="description-input">Description * <span class="sr-only">(Required)</span></label>
              <textarea 
                id="description-input" 
                name="description" 
                rows="4" 
                placeholder="Tell us about your story..."
                required
                aria-required="true"
                aria-describedby="description-help"
              ></textarea>
              <small id="description-help" class="sr-only">Enter a description for your story</small>
            </div>

            <fieldset class="form-group">
              <legend>Location Options</legend>
              
              <div class="radio-group" role="radiogroup" aria-label="Choose location option">
                <label class="radio-label">
                  <input 
                    type="radio" 
                    name="location-type" 
                    value="none"
                    checked
                    aria-label="No location"
                  />
                  <span>No location</span>
                </label>
                
                <label class="radio-label">
                  <input 
                    type="radio" 
                    name="location-type" 
                    value="current"
                    aria-label="Use my current location"
                  />
                  <span>Use my current location</span>
                </label>
                
                <label class="radio-label">
                  <input 
                    type="radio" 
                    name="location-type" 
                    value="pick"
                    aria-label="Pick location from map"
                  />
                  <span>Pick location from map</span>
                </label>
              </div>

              <button 
                type="button" 
                id="pick-location-btn" 
                class="btn-pick-location"
                style="display: none;"
                aria-label="Click to pick location from map"
              >
                Pick Location from Map
              </button>

              <div id="selected-location-info" class="location-info" role="status" aria-live="polite" style="display: none;"></div>
            </fieldset>

            <div class="form-group map-preview-group">
              <label id="map-preview-label">Location Preview</label>
              <div id="preview-map" class="preview-map" role="region" aria-labelledby="map-preview-label"></div>
            </div>

            <div class="form-actions" role="group" aria-label="Form actions">
              <button type="button" id="cancel-btn" class="btn-secondary" aria-label="Cancel and go back to map">
                Cancel
              </button>
              <button type="submit" class="btn-primary" aria-label="Submit story">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" role="img" aria-hidden="true">
                  <polyline points="9 11 12 14 22 4"></polyline>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
                <span>Add Story</span>
              </button>
            </div>
          </form>
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

    const model = new AddStoryModel();
    const view = new AddStoryView();

    const config = {
      apiUrl: import.meta.env.VITE_API_URL,
    };

    this.presenter = new AddStoryPresenter(model, view, authService, config);
    await this.presenter.init();
  }

  async onDestroy() {
    if (this.presenter) {
      this.presenter.destroy();
    }
  }
}
