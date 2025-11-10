import routes from "../routes/routes.js";
import { getActiveRoute } from "../routes/url-parser.js";

class App {
  #content = null;
  #currentPage = null;

  constructor({ content }) {
    this.#content = content;
  }

  async renderPage() {
    const url = getActiveRoute();
    const page = routes[url];

    if (!page) {
      console.error(`No page found for route: ${url}`);
      this.#content.innerHTML =
        '<div class="error-page"><h1>404 - Page Not Found</h1></div>';
      return;
    }

    // Use View Transitions API if supported, fallback to manual transition
    if (!document.startViewTransition) {
      await this.#renderPageWithFallback(page);
      return;
    }

    const transition = document.startViewTransition(async () => {
      if (this.#currentPage && this.#currentPage.onDestroy) {
        await this.#currentPage.onDestroy();
      }

      // Render new page
      this.#content.innerHTML = await page.render();

      // Reset scroll position
      window.scrollTo({ top: 0, behavior: "instant" });

      await page.afterRender();

      this.#currentPage = page;
    });

    await transition.finished;
  }

  async #renderPageWithFallback(page) {
    this.#content.classList.add("page-transition-exit");

    await new Promise((resolve) => setTimeout(resolve, 300));

    if (this.#currentPage && this.#currentPage.onDestroy) {
      await this.#currentPage.onDestroy();
    }

    this.#content.innerHTML = await page.render();

    window.scrollTo({ top: 0, behavior: "instant" });

    this.#content.classList.remove("page-transition-exit");
    this.#content.classList.add("page-transition-enter");

    await page.afterRender();

    setTimeout(() => {
      this.#content.classList.remove("page-transition-enter");
    }, 300);

    this.#currentPage = page;
  }
}

export default App;
