class RegisterView {
  constructor() {
    this.formElement = null;
  }

  getFormElement() {
    return document.getElementById("register-form");
  }

  getNameInput() {
    return document.getElementById("name-input");
  }

  getEmailInput() {
    return document.getElementById("email-input");
  }

  getPasswordInput() {
    return document.getElementById("password-input");
  }

  getConfirmPasswordInput() {
    return document.getElementById("confirm-password-input");
  }

  getErrorElement() {
    return document.getElementById("register-error");
  }

  getSuccessElement() {
    return document.getElementById("register-success");
  }

  showError(message) {
    const errorElement = this.getErrorElement();
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = "block";
      setTimeout(() => {
        errorElement.style.display = "none";
      }, 5000);
    }
  }

  showSuccess(message) {
    const successElement = this.getSuccessElement();
    if (successElement) {
      successElement.textContent = message;
      successElement.style.display = "block";
    }
  }

  hideMessages() {
    const errorElement = this.getErrorElement();
    const successElement = this.getSuccessElement();
    if (errorElement) errorElement.style.display = "none";
    if (successElement) successElement.style.display = "none";
  }

  getFormData() {
    const name = this.getNameInput()?.value.trim();
    const email = this.getEmailInput()?.value.trim();
    const password = this.getPasswordInput()?.value;
    const confirmPassword = this.getConfirmPasswordInput()?.value;

    return { name, email, password, confirmPassword };
  }

  resetForm() {
    const form = this.getFormElement();
    if (form) {
      form.reset();
    }
  }

  setFormDisabled(disabled) {
    const form = this.getFormElement();
    if (form) {
      const inputs = form.querySelectorAll("input, button");
      inputs.forEach((input) => {
        input.disabled = disabled;
      });
    }
  }

  validateForm(data) {
    if (!data.name || data.name.length < 2) {
      throw new Error("Name must be at least 2 characters");
    }

    if (!data.email || !this.isValidEmail(data.email)) {
      throw new Error("Please enter a valid email address");
    }

    if (!data.password || data.password.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }

    if (data.password !== data.confirmPassword) {
      throw new Error("Passwords do not match");
    }

    return true;
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  initForm(onSubmit) {
    const form = this.getFormElement();
    if (form) {
      form.addEventListener("submit", onSubmit);
    }
  }
}

export default RegisterView;
