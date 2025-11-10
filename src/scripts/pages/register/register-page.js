import RegisterModel from "./register-model.js";
import RegisterView from "./register-view.js";
import RegisterPresenter from "./register-presenter.js";

export default class RegisterPage {
  constructor() {
    this.presenter = null;
  }

  async render() {
    return `
      <main class="register-container" role="main" aria-labelledby="register-heading">
        <div class="register-card">
          <header>
            <h2 id="register-heading">Create Account</h2>
            <p class="register-subtitle">Join us to share your stories</p>
          </header>

          <div id="register-error" class="error-message" role="alert" aria-live="assertive" style="display: none;"></div>
          <div id="register-success" class="success-message" role="status" aria-live="polite" style="display: none;"></div>

          <form id="register-form" class="register-form" aria-label="Registration form">
            <div class="form-group">
              <label for="name-input">
                Name * <span class="sr-only">(Required)</span>
              </label>
              <input 
                type="text" 
                id="name-input" 
                name="name" 
                placeholder="Enter your full name"
                required
                aria-required="true"
                aria-describedby="name-help"
                minlength="2"
              />
              <small id="name-help">At least 2 characters</small>
            </div>

            <div class="form-group">
              <label for="email-input">
                Email * <span class="sr-only">(Required)</span>
              </label>
              <input 
                type="email" 
                id="email-input" 
                name="email" 
                placeholder="Enter your email"
                required
                aria-required="true"
                aria-describedby="email-help"
              />
              <small id="email-help">Must be a valid email address</small>
            </div>

            <div class="form-group">
              <label for="password-input">
                Password * <span class="sr-only">(Required)</span>
              </label>
              <input 
                type="password" 
                id="password-input" 
                name="password" 
                placeholder="Create a password"
                required
                aria-required="true"
                aria-describedby="password-help"
                minlength="8"
              />
              <small id="password-help">At least 8 characters</small>
            </div>

            <div class="form-group">
              <label for="confirm-password-input">
                Confirm Password * <span class="sr-only">(Required)</span>
              </label>
              <input 
                type="password" 
                id="confirm-password-input" 
                name="confirm-password" 
                placeholder="Confirm your password"
                required
                aria-required="true"
                aria-describedby="confirm-password-help"
                minlength="8"
              />
              <small id="confirm-password-help">Must match your password</small>
            </div>

            <button type="submit" class="btn btn-primary" aria-label="Create account">
              Create Account
            </button>
          </form>

          <footer class="register-footer">
            <p>
              Already have an account? 
              <a href="#/login" class="link-primary" aria-label="Go to login page">Sign In</a>
            </p>
          </footer>
        </div>
      </main>
    `;
  }

  async afterRender() {
    const model = new RegisterModel();
    const view = new RegisterView();

    const config = {
      apiUrl: import.meta.env.VITE_API_URL,
    };

    this.presenter = new RegisterPresenter(model, view, config);
    await this.presenter.init();
  }

  async onDestroy() {
    if (this.presenter) {
      this.presenter = null;
    }
  }
}
