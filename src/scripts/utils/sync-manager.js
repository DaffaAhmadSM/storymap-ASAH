/**
 * Sync Manager for Offline-Online Data Synchronization
 * Handles syncing pending stories created offline to the API when online
 */

import idbHelper from "./idb-helper.js";

class SyncManager {
  constructor() {
    this.isSyncing = false;
    this.syncCallbacks = [];
    this.apiUrl = null;
    this.authToken = null;
  }

  /**
   * Initialize sync manager with API credentials
   */
  initialize(apiUrl, authToken) {
    this.apiUrl = apiUrl;
    this.authToken = authToken;

    // Listen for online event to trigger auto-sync
    window.addEventListener("online", () => {
      console.log("Back online - triggering auto-sync");
      this.syncPendingStories();
    });
  }

  /**
   * Update auth token
   */
  updateToken(token) {
    this.authToken = token;
  }

  /**
   * Register callback for sync events7
   */
  onSync(callback) {
    this.syncCallbacks.push(callback);
  }

  /**
   * Trigger sync callbacks
   */
  triggerCallbacks(event, data) {
    this.syncCallbacks.forEach((callback) => {
      try {
        callback(event, data);
      } catch (error) {
        console.error("Sync callback error:", error);
      }
    });
  }

  /**
   * Save story offline (when no internet connection)
   */
  async saveStoryOffline(formData) {
    try {
      // Convert FormData to object for IndexedDB
      const storyData = {
        description: formData.get("description"),
        lat: formData.get("lat") ? parseFloat(formData.get("lat")) : null,
        lon: formData.get("lon") ? parseFloat(formData.get("lon")) : null,
      };

      // Handle photo - convert to base64 for storage
      const photoFile = formData.get("photo");
      if (photoFile) {
        const base64Photo = await this.fileToBase64(photoFile);
        storyData.photo = {
          name: photoFile.name,
          type: photoFile.type,
          size: photoFile.size,
          data: base64Photo,
        };
      }

      // Save to pending queue
      const pendingStory = await idbHelper.savePendingStory(storyData);

      console.log("Story saved offline, will sync when online");

      // Notify listeners
      this.triggerCallbacks("story-queued", pendingStory);

      return {
        success: true,
        offline: true,
        message: "Story saved offline. Will sync when online.",
        pendingStory,
      };
    } catch (error) {
      console.error("Error saving story offline:", error);
      throw error;
    }
  }

  /**
   * Convert file to base64
   */
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Convert base64 to File object
   */
  base64ToFile(base64Data, filename, mimeType) {
    const arr = base64Data.split(",");
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, { type: mimeType });
  }

  /**
   * Sync all pending stories to API
   */
  async syncPendingStories() {
    if (this.isSyncing) {
      console.log("Sync already in progress");
      return;
    }

    if (!navigator.onLine) {
      console.log("Cannot sync - offline");
      return;
    }

    if (!this.apiUrl || !this.authToken) {
      console.warn("Sync manager not initialized with API credentials");
      return;
    }

    try {
      this.isSyncing = true;
      this.triggerCallbacks("sync-start", {});

      const pendingStories = await idbHelper.getPendingStories();

      if (pendingStories.length === 0) {
        console.log("No pending stories to sync");
        this.isSyncing = false;
        this.triggerCallbacks("sync-complete", { synced: 0, failed: 0 });
        return;
      }

      console.log(`Syncing ${pendingStories.length} pending stories...`);

      const results = {
        synced: 0,
        failed: 0,
        errors: [],
      };

      // Sync each pending story
      for (const pendingStory of pendingStories) {
        try {
          await this.syncSingleStory(pendingStory);
          results.synced++;

          // Notify progress
          this.triggerCallbacks("sync-progress", {
            current: results.synced + results.failed,
            total: pendingStories.length,
            success: results.synced,
            failed: results.failed,
          });
        } catch (error) {
          console.error(`Failed to sync story ${pendingStory.tempId}:`, error);
          results.failed++;
          results.errors.push({
            tempId: pendingStory.tempId,
            error: error.message,
          });

          // Update pending story with error info
          await idbHelper.updatePendingStory(pendingStory.tempId, {
            status: "error",
            error: error.message,
            attempts: (pendingStory.attempts || 0) + 1,
            lastAttempt: new Date().toISOString(),
          });
        }
      }

      this.isSyncing = false;
      this.triggerCallbacks("sync-complete", results);

      console.log(
        `Sync complete: ${results.synced} synced, ${results.failed} failed`
      );

      return results;
    } catch (error) {
      this.isSyncing = false;
      this.triggerCallbacks("sync-error", { error: error.message });
      console.error("Sync error:", error);
      throw error;
    }
  }

  /**
   * Sync a single pending story
   */
  async syncSingleStory(pendingStory) {
    try {
      // Convert back to FormData for API
      const formData = new FormData();
      formData.append("description", pendingStory.description);

      if (pendingStory.lat) {
        formData.append("lat", pendingStory.lat.toString());
      }
      if (pendingStory.lon) {
        formData.append("lon", pendingStory.lon.toString());
      }

      // Convert base64 photo back to File
      if (pendingStory.photo) {
        const file = this.base64ToFile(
          pendingStory.photo.data,
          pendingStory.photo.name,
          pendingStory.photo.type
        );
        formData.append("photo", file);
      }

      // Send to API
      const response = await fetch(`${this.apiUrl}/stories`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.message || "Failed to sync story");
      }

      // Successfully synced - delete from pending queue
      await idbHelper.deletePendingStory(pendingStory.tempId);

      // Save the synced story to main cache
      if (data.story) {
        await idbHelper.saveStory(data.story);
      }

      console.log(`Story ${pendingStory.tempId} synced successfully`);

      return data;
    } catch (error) {
      console.error("Error syncing single story:", error);
      throw error;
    }
  }

  /**
   * Retry failed stories
   */
  async retryFailedStories() {
    const pendingStories = await idbHelper.getPendingStories();
    const failedStories = pendingStories.filter((s) => s.status === "error");

    if (failedStories.length === 0) {
      console.log("No failed stories to retry");
      return;
    }

    console.log(`Retrying ${failedStories.length} failed stories...`);

    // Reset status to pending for retry
    for (const story of failedStories) {
      await idbHelper.updatePendingStory(story.tempId, {
        status: "pending",
      });
    }

    // Trigger sync
    return this.syncPendingStories();
  }

  /**
   * Get sync status
   */
  async getSyncStatus() {
    const pendingCount = await idbHelper.getPendingCount();
    const pendingStories = await idbHelper.getPendingStories();
    const failedCount = pendingStories.filter(
      (s) => s.status === "error"
    ).length;

    return {
      isSyncing: this.isSyncing,
      pendingCount,
      failedCount,
      canSync: navigator.onLine && pendingCount > 0,
    };
  }

  /**
   * Clear all pending stories (use with caution!)
   */
  async clearPendingQueue() {
    const pendingStories = await idbHelper.getPendingStories();

    for (const story of pendingStories) {
      await idbHelper.deletePendingStory(story.tempId);
    }

    console.log("Pending queue cleared");
  }
}

// Export singleton instance
const syncManager = new SyncManager();
export default syncManager;
