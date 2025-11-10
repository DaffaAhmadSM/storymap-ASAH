class RegisterPresenter {
  constructor(model, view, config = {}) {
    this.model = model;
    this.view = view;
    this.apiUrl = config.apiUrl;
  }

  async init() {
    this.view.initForm(this.handleRegister.bind(this));
  }

  async handleRegister(event) {
    event.preventDefault();

    try {
      this.view.hideMessages();
      this.view.setFormDisabled(true);

      const formData = this.view.getFormData();
      this.view.validateForm(formData);

      const result = await this.model.register(
        this.apiUrl,
        formData.name,
        formData.email,
        formData.password
      );

      this.view.showSuccess(
        result.message || "Registration successful! Redirecting to login..."
      );
      this.view.resetForm();

      setTimeout(() => {
        window.location.hash = "#/login";
      }, 2000);
    } catch (error) {
      this.view.showError(
        error.message || "Registration failed. Please try again."
      );
      console.error("Registration error:", error);
    } finally {
      this.view.setFormDisabled(false);
    }
  }
}

export default RegisterPresenter;
