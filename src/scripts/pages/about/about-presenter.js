class AboutPresenter {
  constructor(model, view) {
    this.model = model;
    this.view = view;
  }

  /**
   * Initializes the about page
   */
  init() {
    this.bindEventHandlers();
  }

  getPageData() {
    return {
      appInfo: this.model.getAppInfo(),
      technologies: this.model.getTechnologies(),
      features: this.model.getFeatures(),
      team: this.model.getTeam(),
      statistics: this.model.getStatistics(),
    };
  }

  /**
   * Binds event handlers for user interactions
   */
  bindEventHandlers() {
    this.view.bindEvents({
      onTechClick: (techId) => this.handleTechClick(techId),
      onFeatureClick: (featureId) => this.handleFeatureClick(featureId),
      onMapButtonClick: (e) => this.handleMapButtonClick(e),
      onHomeButtonClick: (e) => this.handleHomeButtonClick(e),
    });
  }

  handleTechClick(techId) {
    const tech = this.model.getTechnologyById(techId);
    if (tech) {
      console.log(`Technology clicked: ${tech.name}`);
    }
  }

  handleFeatureClick(featureId) {
    const feature = this.model.getFeatureById(featureId);
    if (feature) {
      console.log(`Feature clicked: ${feature.title}`);
    }
  }

  handleMapButtonClick(event) {
    console.log("Navigating to map...");
  }

  handleHomeButtonClick(event) {
    console.log("Navigating to home...");
  }

  showSection(sectionName) {
    this.view.highlightSection(sectionName);
  }

  /**
   * Refreshes the page content
   */
  refresh() {
    this.init();
  }

  getStatistics() {
    return this.model.getStatistics();
  }

  /**
   * Cleanup method when leaving page
   */
  destroy() {
    this.view.destroy();
  }
}

export default AboutPresenter;
