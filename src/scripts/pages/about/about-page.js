import AboutModel from "./about-model.js";
import AboutView from "./about-view.js";
import AboutPresenter from "./about-presenter.js";

export default class AboutPage {
  constructor() {
    this.presenter = null;
  }

  async render() {
    const model = new AboutModel();
    const view = new AboutView();
    const presenter = new AboutPresenter(model, view);

    const pageData = presenter.getPageData();

    return view.render(pageData);
  }

  async afterRender() {
    const model = new AboutModel();
    const view = new AboutView();

    this.presenter = new AboutPresenter(model, view);
    this.presenter.init();
  }

  async onDestroy() {
    if (this.presenter) {
      this.presenter.destroy();
    }
  }
}
