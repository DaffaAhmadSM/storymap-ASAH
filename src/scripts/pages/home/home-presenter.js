
class HomePresenter {
  constructor(model, view, authService) {
    this.model = model;
    this.view = view;
    this.authService = authService;
  }

  /**
   * Initializes the home page
   */
  init() {
    const user = this.authService.isLoggedIn()
      ? this.authService.getCurrentUser()
      : null;

    const features = this.model.getFeatures();

    this.bindEventHandlers();
  }

  /**
   * Binds event handlers for user interactions
   */
  bindEventHandlers() {
    this.view.bindEvents({
      onFeatureClick: (index) => this.handleFeatureClick(index),
      onMapButtonClick: (e) => this.handleMapButtonClick(e),
      onLoginButtonClick: (e) => this.handleLoginButtonClick(e),
    });
  }

  /**
   * Handles feature card click
   */
  handleFeatureClick(index) {
    const feature = this.model.getFeatureById(index + 1);
    if (feature) {
      console.log(`Feature clicked: ${feature.title}`);
    }
  }

  handleMapButtonClick(event) {
    console.log("Navigating to map...");
  }

  handleLoginButtonClick(event) {
    console.log("Navigating to login...");
  }

  /**
   * Updates user welcome message
   */
  updateUserWelcome() {
    if (this.authService.isLoggedIn()) {
      const user = this.authService.getCurrentUser();
      this.view.updateWelcomeMessage(user);
      this.view.toggleLoginButton(false);
    } else {
      this.view.toggleLoginButton(true);
    }
  }


  getAppStats() {
    return this.model.getAppStats();
  }

  /**
   * Refreshes the page content
   */
  refresh() {
    this.init();
  }

  /**
   * Cleanup method when leaving page
   */
  destroy() {
    this.view.destroy();
  }
}

export default HomePresenter;
