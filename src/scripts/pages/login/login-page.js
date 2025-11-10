import LoginModel from "./login-model.js";
import LoginView from "./login-view.js";
import LoginPresenter from "./login-presenter.js";
import AuthService from "../../utils/auth-service.js";

export default class LoginPage {
  constructor() {
    this.authService = new AuthService();
    this.presenter = null;
  }

  async render() {
    return `
      <div class="login-page-container">
        <div class="login-card">
          <h2>Login to Story Map</h2>
          <form id="login-page-form">
            <div class="form-group">
              <label for="login-email">Email</label>
              <input
                type="email"
                id="login-email"
                name="email"
                required
                placeholder="Enter your email"
                autocomplete="email"
              >
            </div>
            <div class="form-group">
              <label for="login-password">Password</label>
              <input
                type="password"
                id="login-password"
                name="password"
                required
                placeholder="Enter your password"
                autocomplete="current-password"
              >
            </div>
            <div id="login-page-error" class="form-error" style="display: none;"></div>
            <button type="submit" class="btn btn-primary" id="login-submit-btn">
              Login
            </button>
          </form>
          <div class="auth-footer">
            <p>Don't have an account? <a href="#/register" class="auth-link">Create an account</a></p>
          </div>
        </div>
      </div>
    `;
  }

  async afterRender() {
    const model = new LoginModel();
    const view = new LoginView();

    this.presenter = new LoginPresenter(model, view, this.authService);
    this.presenter.init();
  }

  async onDestroy() {
    if (this.presenter) {
      this.presenter.destroy();
    }
  }
}
