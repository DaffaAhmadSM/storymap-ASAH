class LoginPresenter {
  constructor(model, view, authService) {
    this.model = model;
    this.view = view;
    this.authService = authService;
  }

  /**
   * Initializes the login page
   */
  init() {
    // Check if already logged in, redirect if true
    if (this.authService.isLoggedIn()) {
      this.navigateToHome();
      return;
    }

    // Initialize view elements
    this.view.initializeElements();

    // Bind form submit event
    this.view.bindSubmit(() => this.handleLogin());
  }

  /**
   * Handles login form submission
   */
  async handleLogin() {
    const { email, password } = this.view.getFormData();

    if (!email || !password) {
      this.view.showError("Please enter both email and password");
      return;
    }

    try {
      this.view.hideError();

      this.view.setLoadingState(true);
      this.view.setFormDisabled(true);

      const userData = await this.model.login(email, password);

      this.authService.saveToken(userData.token);
      this.authService.saveUserData(userData);

      this.view.showSuccess();

      // Navigate to home
      setTimeout(() => {
        this.navigateToHome();
      }, 500);
    } catch (error) {
      this.view.showError(error.message || "Login failed. Please try again.");

      // Reset loading state
      this.view.setLoadingState(false);
      this.view.setFormDisabled(false);

      console.error("Login error:", error);
    }
  }

  /**
   * Navigates to home page
   */
  navigateToHome() {
    window.location.hash = "#/";
  }

  /**
   * Cleanup method when leaving page
   */
  destroy() {
    this.model.clearUser();
  }
}

export default LoginPresenter;
