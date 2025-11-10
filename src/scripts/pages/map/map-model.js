/**
 * MapModel - Model for Map Page
 * Handles data fetching for story map
 */
class MapModel {
  constructor() {
    this.stories = [];
    this.storiesWithLocation = [];
    this.storiesWithoutLocation = [];
    this.bearerToken = null;
  }

  setBearerToken(token) {
    this.bearerToken = token;
  }

  async fetchStories(baseUrl, token = null, locationParam = null) {
    try {
      const authToken = token || this.bearerToken;

      // Build endpoint based on locationParam
      let endpoint = baseUrl + "/stories";
      if (locationParam !== null) {
        endpoint += `?location=${locationParam}`;
      }

      const fetchOptions = {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      };

      if (authToken) {
        fetchOptions.headers["Authorization"] = `Bearer ${authToken}`;
      }

      const response = await fetch(endpoint, fetchOptions);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.message || "Failed to fetch stories");
      }

      const fetchedStories = data.listStory || [];

      // Store based on location parameter
      if (locationParam === 1) {
        this.storiesWithLocation = fetchedStories;
      } else if (locationParam === 0) {
        this.storiesWithoutLocation = fetchedStories;
      } else {
        this.stories = fetchedStories;
      }

      return fetchedStories;
    } catch (error) {
      console.error("Error fetching stories:", error);
      throw error;
    }
  }

  async fetchAllStories(baseUrl, token = null) {
    try {
      // Fetch both stories with and without location
      const [withLocation, withoutLocation] = await Promise.all([
        this.fetchStories(baseUrl, token, 1),
        this.fetchStories(baseUrl, token, 0),
      ]);

      this.stories = [...withLocation, ...withoutLocation];

      return {
        withLocation,
        withoutLocation,
        all: this.stories,
      };
    } catch (error) {
      console.error("Error fetching all stories:", error);
      throw error;
    }
  }

  getStories() {
    return this.stories;
  }

  getStoriesWithLocation() {
    return this.storiesWithLocation;
  }

  getStoriesWithoutLocation() {
    return this.storiesWithoutLocation;
  }


  //Ini fitur untuk menambakan story
  // KRITERIA 3
  async addStory(baseUrl, formData, token) {
    try {
      const endpoint = baseUrl + "/stories";

      const fetchOptions = {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      };

      const response = await fetch(endpoint, fetchOptions);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.message || "Failed to add story");
      }

      return data;
    } catch (error) {
      console.error("Error adding story:", error);
      throw error;
    }
  }
}

export default MapModel;
