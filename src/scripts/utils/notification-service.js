class NotificationService {
  constructor() {
    this.registration = null;
    this.subscription = null;
    this.vapidPublicKey = null;
  }

  /**
   * Set VAPID public key
   */
  setVapidKey(key) {
    this.vapidPublicKey = key;
  }

  /**
   * Convert URL-safe base64 to Uint8Array for VAPID key
   */
  urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Initialize service worker
   */
  async initialize() {
    if (!("serviceWorker" in navigator)) {
      throw new Error("Service workers are not supported");
    }

    if (!("PushManager" in window)) {
      throw new Error("Push messaging is not supported");
    }

    try {
      this.registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });
      console.log("Service Worker registered successfully");
      return this.registration;
    } catch (error) {
      console.error("Service Worker registration failed:", error);
      throw error;
    }
  }

  /**
   * Request notification permission from user
   */
  async requestPermission() {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  /**
   * Check if user is subscribed to push notifications
   */
  async isSubscribed() {
    if (!this.registration) {
      // Try to get existing registration
      if ("serviceWorker" in navigator) {
        this.registration = await navigator.serviceWorker.ready;
      } else {
        return false;
      }
    }

    const subscription = await this.registration.pushManager.getSubscription();
    this.subscription = subscription;
    return !!subscription;
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(apiUrl, token) {
    if (!this.registration) {
      // Try to get existing registration
      this.registration = await navigator.serviceWorker.ready;
    }

    if (!this.vapidPublicKey) {
      throw new Error("VAPID public key not set");
    }

    const permission = await this.requestPermission();
    if (!permission) {
      throw new Error("Notification permission denied");
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey),
      });

      this.subscription = subscription;

      const subscriptionJSON = subscription.toJSON();

      const response = await fetch(`${apiUrl}/notifications/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          endpoint: subscriptionJSON.endpoint,
          keys: {
            p256dh: subscriptionJSON.keys.p256dh,
            auth: subscriptionJSON.keys.auth,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to subscribe to push notification");
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.message || "Failed to subscribe");
      }

      return data;
    } catch (error) {
      console.error("Subscribe error:", error);
      throw error;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(apiUrl, token) {
    if (!this.subscription) {
      const subscription =
        await this.registration.pushManager.getSubscription();
      if (!subscription) {
        throw new Error("No active subscription");
      }
      this.subscription = subscription;
    }

    try {
      const subscriptionJSON = this.subscription.toJSON();

      const response = await fetch(`${apiUrl}/notifications/subscribe`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          endpoint: subscriptionJSON.endpoint,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to unsubscribe from push notification");
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.message || "Failed to unsubscribe");
      }

      await this.subscription.unsubscribe();
      this.subscription = null;

      return data;
    } catch (error) {
      console.error("Unsubscribe error:", error);
      throw error;
    }
  }

  /**
   * Get current notification permission status
   */
  getPermissionStatus() {
    if (!("Notification" in window)) {
      return "unsupported";
    }
    return Notification.permission;
  }
}

export default NotificationService;
