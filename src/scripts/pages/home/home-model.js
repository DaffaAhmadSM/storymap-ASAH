
class HomeModel {
  constructor() {
    this.features = [
      {
        id: 1,
        icon: "🗺️",
        title: "Interactive Map",
        description:
          "Explore stories on an interactive Leaflet.js map with markers showing exact locations.",
      },
      {
        id: 2,
        icon: "📍",
        title: "Story Markers",
        description:
          "Click on any marker to view story details including photos and descriptions.",
      },
      {
        id: 3,
        icon: "🔐",
        title: "User Authentication",
        description:
          "Login to access authenticated features and share your own stories.",
      },
    ];
  }


  getFeatures() {
    return this.features;
  }

  getFeatureById(id) {
    return this.features.find((feature) => feature.id === id) || null;
  }


  getAppStats() {
    return {
      totalFeatures: this.features.length,
      appName: "Story Map",
      version: "1.0.0",
    };
  }
}

export default HomeModel;
