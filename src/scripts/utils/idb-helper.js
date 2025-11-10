/**
 * IndexedDB Helper for Story Map
 * Provides functions to store and retrieve stories offline
 */

const DB_NAME = "story-map-db";
const DB_VERSION = 2;
const STORE_NAME = "stories";
const PENDING_STORE_NAME = "pending-stories";

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

      // Create stories object store if it doesn't exist
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

        console.log("IndexedDB stories object store created");
      }

      // Create pending stories object store for offline sync
      if (!db.objectStoreNames.contains(PENDING_STORE_NAME)) {
        const pendingStore = db.createObjectStore(PENDING_STORE_NAME, {
          keyPath: "tempId",
          autoIncrement: true,
        });

        pendingStore.createIndex("createdAt", "createdAt", { unique: false });
        pendingStore.createIndex("status", "status", { unique: false });

        console.log("IndexedDB pending-stories object store created");
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

/**
 * Search stories by name or description
 */
async function searchStories(searchQuery) {
  try {
    const allStories = await getAllStories();
    const query = searchQuery.toLowerCase().trim();

    if (!query) {
      return allStories;
    }

    return allStories.filter((story) => {
      const nameMatch = story.name?.toLowerCase().includes(query);
      const descMatch = story.description?.toLowerCase().includes(query);
      return nameMatch || descMatch;
    });
  } catch (error) {
    console.error("Error searching stories:", error);
    return [];
  }
}

/**
 * Filter stories by criteria
 * @param {Object} filters - { hasLocation: boolean, dateFrom: Date, dateTo: Date }
 */
async function filterStories(filters = {}) {
  try {
    let stories = await getAllStories();

    // Filter by location
    if (filters.hasLocation !== undefined) {
      stories = stories.filter(
        (story) => story.hasLocation === filters.hasLocation
      );
    }

    // Filter by date range
    if (filters.dateFrom) {
      stories = stories.filter((story) => {
        const storyDate = new Date(story.createdAt);
        return storyDate >= new Date(filters.dateFrom);
      });
    }

    if (filters.dateTo) {
      stories = stories.filter((story) => {
        const storyDate = new Date(story.createdAt);
        return storyDate <= new Date(filters.dateTo);
      });
    }

    return stories;
  } catch (error) {
    console.error("Error filtering stories:", error);
    return [];
  }
}

/**
 * Sort stories
 * @param {Array} stories - Stories to sort
 * @param {String} sortBy - 'name', 'date', 'newest', 'oldest'
 * @param {String} order - 'asc' or 'desc'
 */
function sortStories(stories, sortBy = "date", order = "desc") {
  const sorted = [...stories];

  switch (sortBy) {
    case "name":
      sorted.sort((a, b) => {
        const nameA = (a.name || "").toLowerCase();
        const nameB = (b.name || "").toLowerCase();
        return order === "asc"
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      });
      break;

    case "date":
    case "newest":
      sorted.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return order === "desc" || sortBy === "newest"
          ? dateB - dateA
          : dateA - dateB;
      });
      break;

    case "oldest":
      sorted.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return order === "asc" ? dateA - dateB : dateB - dateA;
      });
      break;

    default:
      // Default: newest first
      sorted.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB - dateA;
      });
  }

  return sorted;
}

/**
 * Combined search, filter, and sort
 */
async function queryStories(options = {}) {
  try {
    let stories = await getAllStories();

    // Apply search
    if (options.search) {
      const query = options.search.toLowerCase().trim();
      stories = stories.filter((story) => {
        const nameMatch = story.name?.toLowerCase().includes(query);
        const descMatch = story.description?.toLowerCase().includes(query);
        return nameMatch || descMatch;
      });
    }

    // Apply filters
    if (options.hasLocation !== null) {
      if (options.hasLocation == true) {
        stories = stories.filter((story) => story.lat && story.lon !== null);
      } else {
        stories = stories.filter((story) => !story.lat || story.lon === null);
      }
    } else {
      // do not filter by location
    }

    if (options.dateFrom) {
      stories = stories.filter((story) => {
        const storyDate = new Date(story.createdAt);
        return storyDate >= new Date(options.dateFrom);
      });
    }

    if (options.dateTo) {
      stories = stories.filter((story) => {
        const storyDate = new Date(story.createdAt);
        return storyDate <= new Date(options.dateTo);
      });
    }

    // Apply sorting
    if (options.sortBy) {
      stories = sortStories(stories, options.sortBy, options.order);
    }

    return stories;
  } catch (error) {
    console.error("Error querying stories:", error);
    return [];
  }
}

// ==================== OFFLINE SYNC FUNCTIONS ====================

/**
 * Save story to pending queue (for offline creation)
 */
async function savePendingStory(storyData) {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PENDING_STORE_NAME], "readwrite");
      const objectStore = transaction.objectStore(PENDING_STORE_NAME);

      const pendingStory = {
        ...storyData,
        status: "pending",
        createdAt: new Date().toISOString(),
        attempts: 0,
      };

      const request = objectStore.add(pendingStory);

      request.onsuccess = (event) => {
        const tempId = event.target.result;
        resolve({ ...pendingStory, tempId });
      };

      request.onerror = () => {
        reject(new Error("Failed to save pending story"));
      };

      transaction.oncomplete = () => {
        db.close();
        console.log("Pending story saved for sync");
      };
    });
  } catch (error) {
    console.error("Error saving pending story:", error);
    throw error;
  }
}

/**
 * Get all pending stories
 */
async function getPendingStories() {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PENDING_STORE_NAME], "readonly");
      const objectStore = transaction.objectStore(PENDING_STORE_NAME);
      const request = objectStore.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(new Error("Failed to get pending stories"));
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Error getting pending stories:", error);
    return [];
  }
}

/**
 * Update pending story status
 */
async function updatePendingStory(tempId, updates) {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PENDING_STORE_NAME], "readwrite");
      const objectStore = transaction.objectStore(PENDING_STORE_NAME);
      const getRequest = objectStore.get(tempId);

      getRequest.onsuccess = () => {
        const story = getRequest.result;
        if (!story) {
          reject(new Error("Pending story not found"));
          return;
        }

        const updatedStory = { ...story, ...updates };
        const updateRequest = objectStore.put(updatedStory);

        updateRequest.onsuccess = () => {
          resolve(updatedStory);
        };

        updateRequest.onerror = () => {
          reject(new Error("Failed to update pending story"));
        };
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Error updating pending story:", error);
    throw error;
  }
}

/**
 * Delete pending story after successful sync
 */
async function deletePendingStory(tempId) {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PENDING_STORE_NAME], "readwrite");
      const objectStore = transaction.objectStore(PENDING_STORE_NAME);
      const request = objectStore.delete(tempId);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        reject(new Error("Failed to delete pending story"));
      };

      transaction.oncomplete = () => {
        db.close();
        console.log(`Deleted pending story ${tempId}`);
      };
    });
  } catch (error) {
    console.error("Error deleting pending story:", error);
    throw error;
  }
}

/**
 * Get count of pending stories
 */
async function getPendingCount() {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PENDING_STORE_NAME], "readonly");
      const objectStore = transaction.objectStore(PENDING_STORE_NAME);
      const request = objectStore.count();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new Error("Failed to count pending stories"));
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Error counting pending stories:", error);
    return 0;
  }
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
  // Search, Filter, Sort
  searchStories,
  filterStories,
  sortStories,
  queryStories,
  // Offline Sync
  savePendingStory,
  getPendingStories,
  updatePendingStory,
  deletePendingStory,
  getPendingCount,
};
