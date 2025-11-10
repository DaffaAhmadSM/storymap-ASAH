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

      // Show info if data is from cache (offline)
      if (this.model.isOffline()) {
        const cacheCount = result.all.length;
        if (cacheCount > 0) {
          this.view.showError(
            `📱 Offline mode: Showing ${cacheCount} cached stories`
          );
        } else {
          this.view.showError("📱 Offline mode: No cached stories available");
        }
        setTimeout(() => this.view.showError(null), 5000);
      }

      this.view.renderMarkers(result.withLocation);
      // Show ALL stories in sidebar (not just those without location)
      this.view.renderStoryList(result.all);

      // Log cache info
      const cacheCount = await this.model.getCachedStoryCount();
      console.log(`${cacheCount} stories cached in IndexedDB`);
      console.log(
        `Displaying ${result.withLocation.length} stories on map, ${result.all.length} stories in sidebar`
      );
    } catch (error) {
      this.view.showLoading(false);

      // Check if we have any cached data
      const cacheCount = await this.model.getCachedStoryCount();

      if (cacheCount > 0 && this.model.isOffline()) {
        // We have cached data, try to display it
        console.log(
          "Error loading from network, attempting to show cached data"
        );
        try {
          const cachedStories = await this.model.fetchAllStories(
            this.apiUrl,
            this.bearerToken
          );
          this.view.renderMarkers(cachedStories.withLocation);
          this.view.renderStoryList(cachedStories.all);
          this.view.showError(
            `📱 Offline: Showing ${cacheCount} cached stories`
          );
          setTimeout(() => this.view.showError(null), 5000);
          return;
        } catch (cacheError) {
          console.error("Failed to load cached stories:", cacheError);
        }
      }

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
