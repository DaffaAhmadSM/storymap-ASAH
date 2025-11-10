/**
 * AboutModel - Model for About Page
 * Handles data operations for about page
 */
class AboutModel {
  constructor() {
    this.appInfo = {
      name: "Story Map",
      version: "1.0.0",
      description:
        "A single-page web application that fetches stories from an API and displays them as interactive markers on a Leaflet.js map.",
      architecture: "Model-View-Presenter (MVP)",
    };

    this.technologies = [
      {
        id: 1,
        name: "Leaflet.js",
        description: "Open-source JavaScript library for interactive maps",
        icon: "🗺️",
      },
      {
        id: 2,
        name: "MVP Architecture",
        description: "Clean separation of concerns for maintainable code",
        icon: "🏗️",
      },
      {
        id: 3,
        name: "Vite",
        description: "Fast build tool and development server",
        icon: "⚡",
      },
      {
        id: 4,
        name: "ES6 Modules",
        description: "Modern JavaScript module system",
        icon: "📦",
      },
    ];

    this.features = [
      {
        id: 1,
        title: "Interactive Map",
        description:
          "Explore stories on a fully interactive map with zoom, pan, and marker interactions.",
      },
      {
        id: 2,
        title: "User Authentication",
        description:
          "Secure login system with JWT token-based authentication.",
      },
      {
        id: 3,
        title: "Responsive Design",
        description:
          "Fully responsive interface that works seamlessly on all devices.",
      },
      {
        id: 4,
        title: "Real-time Updates",
        description:
          "Stories are fetched from a live API with real-time data.",
      },
    ];

    this.team = [
      {
        id: 1,
        role: "Developer",
        description: "Built with modern web technologies and best practices",
      },
    ];
  }

  /**
   * Gets application information
   * @returns {Object} App information
   */
  getAppInfo() {
    return this.appInfo;
  }

  /**
   * Gets all technologies used
   * @returns {Array} Array of technology objects
   */
  getTechnologies() {
    return this.technologies;
  }

  /**
   * Gets a specific technology by id
   * @param {number} id - Technology id
   * @returns {Object|null} Technology object or null
   */
  getTechnologyById(id) {
    return this.technologies.find((tech) => tech.id === id) || null;
  }

  /**
   * Gets all features
   * @returns {Array} Array of feature objects
   */
  getFeatures() {
    return this.features;
  }

  /**
   * Gets a specific feature by id
   * @param {number} id - Feature id
   * @returns {Object|null} Feature object or null
   */
  getFeatureById(id) {
    return this.features.find((feature) => feature.id === id) || null;
  }

  /**
   * Gets team information
   * @returns {Array} Array of team member objects
   */
  getTeam() {
    return this.team;
  }

  /**
   * Gets statistics about the application
   * @returns {Object} App statistics
   */
  getStatistics() {
    return {
      totalTechnologies: this.technologies.length,
      totalFeatures: this.features.length,
      version: this.appInfo.version,
    };
  }
}

export default AboutModel;
