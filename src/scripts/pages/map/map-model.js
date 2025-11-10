/**
 * MapModel - Model for Map Page
 * Handles data fetching for story map with IndexedDB caching
 */
import idbHelper from '../../utils/idb-helper.js';

class MapModel {
  constructor() {
    this.stories = [];
    this.storiesWithLocation = [];
    this.storiesWithoutLocation = [];
    this.bearerToken = null;
    this.isOnline = navigator.onLine;
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('App is online');
      this.isOnline = true;
    });
    
    window.addEventListener('offline', () => {
      console.log('App is offline');
      this.isOnline = false;
    });
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

      // Try to fetch from network
      try {
        const response = await fetch(endpoint, fetchOptions);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(data.message || "Failed to fetch stories");
        }

        const fetchedStories = data.listStory || [];

        // Store in IndexedDB for offline access
        if (fetchedStories.length > 0) {
          await idbHelper.saveStories(fetchedStories);
          console.log('Stories saved to IndexedDB');
        }

        // Store based on location parameter
        if (locationParam === 1) {
          this.storiesWithLocation = fetchedStories;
        } else if (locationParam === 0) {
          this.storiesWithoutLocation = fetchedStories;
        } else {
          this.stories = fetchedStories;
        }

        return fetchedStories;
      } catch (networkError) {
        console.warn('Network request failed, trying IndexedDB cache:', networkError);
        
        // If network fails, try to get from IndexedDB
        if (locationParam === 1) {
          const cachedStories = await idbHelper.getStoriesWithLocation();
          this.storiesWithLocation = cachedStories;
          return cachedStories;
        } else if (locationParam === 0) {
          const cachedStories = await idbHelper.getStoriesWithoutLocation();
          this.storiesWithoutLocation = cachedStories;
          return cachedStories;
        } else {
          const cachedStories = await idbHelper.getAllStories();
          this.stories = cachedStories;
          return cachedStories;
        }
      }
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

  /**
   * Delete story from IndexedDB cache
   */
  async deleteStoryFromCache(storyId) {
    try {
      await idbHelper.deleteStory(storyId);
      console.log(`Story ${storyId} deleted from cache`);
      return true;
    } catch (error) {
      console.error('Error deleting story from cache:', error);
      throw error;
    }
  }

  /**
   * Clear all cached stories
   */
  async clearCache() {
    try {
      await idbHelper.clearAllStories();
      console.log('All cached stories cleared');
      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw error;
    }
  }

  /**
   * Get cached story count
   */
  async getCachedStoryCount() {
    try {
      return await idbHelper.getStoryCount();
    } catch (error) {
      console.error('Error getting cached story count:', error);
      return 0;
    }
  }

  /**
   * Check if running in offline mode
   */
  isOffline() {
    return !this.isOnline;
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
