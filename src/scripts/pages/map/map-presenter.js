class MapPresenter {
  constructor(model, view, authService, config = {}) {
    this.model = model;
    this.view = view;
    this.authService = authService;
    this.apiUrl = config.apiUrl;
    this.bearerToken = config.bearerToken || null;
  }

  setBearerToken(token) {
    this.bearerToken = token;
    this.model.setBearerToken(token);
  }

  checkAuthStatus() {
    if (this.authService.isLoggedIn()) {
      const token = this.authService.getToken();
      this.setBearerToken(token);
    }
  }

  async init() {
    this.checkAuthStatus();
    this.view.initializeMap(-2.5489, 118.0149, 5);
    await this.loadStories();
    this.view.initAddStoryModal(this.handleAddStory.bind(this));
    this.view.initSidebarToggle();
    this.view.onShowStoryDetail = this.handleShowStoryDetail.bind(this);
  }

  async loadStories() {
    try {
      this.view.showLoading(true);
      this.view.showError(null);

      const result = await this.model.fetchAllStories(
        this.apiUrl,
        this.bearerToken
      );

      this.view.showLoading(false);
      this.view.renderMarkers(result.withLocation);
      this.view.renderStoryList(result.withoutLocation);
    } catch (error) {
      this.view.showLoading(false);
      const errorMessage =
        error.message || "Failed to load stories. Please try again later.";
      this.view.showError(errorMessage);
      console.error("Error loading stories:", error);
    }
  }

  async handleAddStory(event) {
    event.preventDefault();

    if (!this.authService.isLoggedIn()) {
      this.view.showError("Please login to add a story");
      return;
    }

    try {
      this.view.showError(null);
      this.view.setFormDisabled(true);

      const formData = this.view.getFormData();

      const photo = formData.get("photo");
      if (!photo || photo.size === 0) {
        throw new Error("Please select a photo");
      }

      const description = formData.get("description");
      if (!description || description.trim() === "") {
        throw new Error("Please enter a description");
      }

      const result = await this.model.addStory(
        this.apiUrl,
        formData,
        this.bearerToken
      );

      this.view.showSuccess(result.message || "Story added successfully!");
      this.view.closeModal();
      await this.loadStories();
    } catch (error) {
      const errorMessage =
        error.message || "Failed to add story. Please try again.";
      this.view.showError(errorMessage);
      console.error("Error adding story:", error);
    } finally {
      this.view.setFormDisabled(false);
    }
  }

  handleShowStoryDetail(storyId) {
    const allStories = this.model.getStories();
    const story = allStories.find((s) => s.id === storyId);

    if (story) {
      this.view.displayStoryDetail(story);
    } else {
      console.error("Story not found:", storyId);
    }
  }

  destroy() {
    this.view.destroy();
  }
}

export default MapPresenter;
