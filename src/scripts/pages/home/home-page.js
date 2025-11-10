import HomeModel from "./home-model.js";
import HomeView from "./home-view.js";
import HomePresenter from "./home-presenter.js";
import AuthService from "../../utils/auth-service.js";

export default class HomePage {
  constructor() {
    this.authService = new AuthService();
    this.presenter = null;
  }

  async render() {
    const model = new HomeModel();
    const view = new HomeView();

    const isLoggedIn = this.authService.isLoggedIn();
    const user = isLoggedIn ? this.authService.getCurrentUser() : null;
    const features = model.getFeatures();

    return view.render(user, features);
  }

  async afterRender() {
    const model = new HomeModel();
    const view = new HomeView();

    this.presenter = new HomePresenter(model, view, this.authService);
    this.presenter.init();
  }

  async onDestroy() {
    if (this.presenter) {
      this.presenter.destroy();
    }
  }
}
