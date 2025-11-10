/**
 * IndexedDB Helper for Story Map
 * Provides functions to store and retrieve stories offline
 */

const DB_NAME = "story-map-db";
const DB_VERSION = 1;
const STORE_NAME = "stories";

/**
 * Open or create the IndexedDB database
 */
function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("IndexedDB is not supported"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error("Failed to open database"));
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, {
          keyPath: "id",
        });

        // Create indexes for efficient querying
        objectStore.createIndex("createdAt", "createdAt", { unique: false });
        objectStore.createIndex("name", "name", { unique: false });
        objectStore.createIndex("hasLocation", "hasLocation", {
          unique: false,
        });

        console.log("IndexedDB object store created");
      }
    };
  });
}

/**
 * Save a single story to IndexedDB
 */
async function saveStory(story) {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const objectStore = transaction.objectStore(STORE_NAME);

      // Add hasLocation flag for easier querying
      const storyData = {
        ...story,
        hasLocation: !!(story.lat && story.lon),
        cachedAt: new Date().toISOString(),
      };

      const request = objectStore.put(storyData);

      request.onsuccess = () => {
        resolve(storyData);
      };

      request.onerror = () => {
        reject(new Error("Failed to save story"));
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Error saving story to IndexedDB:", error);
    throw error;
  }
}

/**
 * Save multiple stories to IndexedDB
 */
async function saveStories(stories) {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const objectStore = transaction.objectStore(STORE_NAME);

      let successCount = 0;
      const errors = [];

      stories.forEach((story) => {
        const storyData = {
          ...story,
          hasLocation: !!(story.lat && story.lon),
          cachedAt: new Date().toISOString(),
        };

        const request = objectStore.put(storyData);

        request.onsuccess = () => {
          successCount++;
        };

        request.onerror = () => {
          errors.push(`Failed to save story: ${story.id}`);
        };
      });

      transaction.oncomplete = () => {
        db.close();
        console.log(`Saved ${successCount} stories to IndexedDB`);
        resolve({ successCount, errors });
      };

      transaction.onerror = () => {
        db.close();
        reject(new Error("Transaction failed"));
      };
    });
  } catch (error) {
    console.error("Error saving stories to IndexedDB:", error);
    throw error;
  }
}

/**
 * Get all stories from IndexedDB
 */
async function getAllStories() {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(new Error("Failed to get stories"));
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Error getting stories from IndexedDB:", error);
    return [];
  }
}

/**
 * Get stories with location
 */
async function getStoriesWithLocation() {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const objectStore = transaction.objectStore(STORE_NAME);
      const index = objectStore.index("hasLocation");
      const request = index.getAll(true);

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(new Error("Failed to get stories with location"));
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Error getting stories with location:", error);
    return [];
  }
}

/**
 * Get stories without location
 */
async function getStoriesWithoutLocation() {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const objectStore = transaction.objectStore(STORE_NAME);
      const index = objectStore.index("hasLocation");
      const request = index.getAll(false);

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(new Error("Failed to get stories without location"));
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Error getting stories without location:", error);
    return [];
  }
}

/**
 * Get a single story by ID
 */
async function getStoryById(id) {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(new Error("Failed to get story"));
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Error getting story by ID:", error);
    return null;
  }
}

/**
 * Delete a story from IndexedDB
 */
async function deleteStory(id) {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.delete(id);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        reject(new Error("Failed to delete story"));
      };

      transaction.oncomplete = () => {
        db.close();
        console.log(`Deleted story ${id} from IndexedDB`);
      };
    });
  } catch (error) {
    console.error("Error deleting story:", error);
    throw error;
  }
}

/**
 * Clear all stories from IndexedDB
 */
async function clearAllStories() {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.clear();

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        reject(new Error("Failed to clear stories"));
      };

      transaction.oncomplete = () => {
        db.close();
        console.log("Cleared all stories from IndexedDB");
      };
    });
  } catch (error) {
    console.error("Error clearing stories:", error);
    throw error;
  }
}

/**
 * Get the count of stories in IndexedDB
 */
async function getStoryCount() {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.count();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new Error("Failed to count stories"));
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Error counting stories:", error);
    return 0;
  }
}

/**
 * Check if IndexedDB is supported
 */
function isIndexedDBSupported() {
  return "indexedDB" in window;
}

export default {
  openDatabase,
  saveStory,
  saveStories,
  getAllStories,
  getStoriesWithLocation,
  getStoriesWithoutLocation,
  getStoryById,
  deleteStory,
  clearAllStories,
  getStoryCount,
  isIndexedDBSupported,
};
