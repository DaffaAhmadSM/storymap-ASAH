
class LoginView {
  constructor() {
    this.form = null;
    this.errorElement = null;
    this.submitButton = null;
    this.emailInput = null;
    this.passwordInput = null;
  }


  initializeElements() {
    this.form = document.getElementById("login-page-form");
    this.errorElement = document.getElementById("login-page-error");
    this.submitButton = document.getElementById("login-submit-btn");
    this.emailInput = document.getElementById("login-email");
    this.passwordInput = document.getElementById("login-password");
  }

  getFormData() {
    if (!this.emailInput || !this.passwordInput) {
      this.initializeElements();
    }

    return {
      email: this.emailInput?.value || "",
      password: this.passwordInput?.value || "",
    };
  }


  showError(message) {
    if (!this.errorElement) {
      this.initializeElements();
    }

    if (this.errorElement) {
      this.errorElement.textContent = message;
      this.errorElement.style.display = "block";
    }
  }

  /**
   * Hides error message
   */
  hideError() {
    if (!this.errorElement) {
      this.initializeElements();
    }

    if (this.errorElement) {
      this.errorElement.textContent = "";
      this.errorElement.style.display = "none";
    }
  }


  setLoadingState(isLoading) {
    if (!this.submitButton) {
      this.initializeElements();
    }

    if (this.submitButton) {
      if (isLoading) {
        this.submitButton.disabled = true;
        this.submitButton.textContent = "Logging in...";
      } else {
        this.submitButton.disabled = false;
        this.submitButton.textContent = "Login";
      }
    }
  }

  /**
   * Shows success state
   */
  showSuccess() {
    if (!this.submitButton) {
      this.initializeElements();
    }

    if (this.submitButton) {
      this.submitButton.textContent = "Success!";
    }
  }

  /**
   * Resets the form
   */
  resetForm() {
    if (!this.form) {
      this.initializeElements();
    }

    if (this.form) {
      this.form.reset();
    }
  }


  bindSubmit(handler) {
    if (!this.form) {
      this.initializeElements();
    }

    if (this.form) {
      this.form.addEventListener("submit", (event) => {
        event.preventDefault();
        handler();
      });
    }
  }


  setFormDisabled(disabled) {
    if (!this.emailInput || !this.passwordInput || !this.submitButton) {
      this.initializeElements();
    }

    if (this.emailInput) this.emailInput.disabled = disabled;
    if (this.passwordInput) this.passwordInput.disabled = disabled;
    if (this.submitButton) this.submitButton.disabled = disabled;
  }
}

export default LoginView;
