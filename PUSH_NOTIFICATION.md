# Web Push Notification Implementation

## Overview

Implemented a complete web push notification system with subscribe/unsubscribe functionality via a navbar button.

## Features

- ✅ Service Worker for handling push events
- ✅ Subscribe/Unsubscribe functionality
- ✅ Notification permission handling
- ✅ Visual feedback with bell icons (on/off states)
- ✅ Integration with backend API
- ✅ Toast notifications for user feedback
- ✅ Responsive design

## Files Modified/Created

### 1. Service Worker (`public/sw.js`)

- Handles push events from the server
- Displays notifications with custom title, body, icon, and vibration
- Handles notification clicks to open the app
- Auto-activates and claims clients

### 2. Notification Service (`src/scripts/utils/notification-service.js`)

- Class-based service for managing push notifications
- Methods:
  - `setVapidKey(key)` - Set VAPID public key
  - `initialize()` - Register service worker
  - `requestPermission()` - Request notification permission
  - `isSubscribed()` - Check subscription status
  - `subscribe(apiUrl, token)` - Subscribe to push notifications
  - `unsubscribe(apiUrl, token)` - Unsubscribe from push notifications
  - `urlBase64ToUint8Array()` - Convert VAPID key format

### 3. Main App (`src/scripts/index.js`)

- Imported and initialized NotificationService
- Added notification button click handler
- Updated `updateAuthUI()` to show/hide notification button based on login state
- Updates bell icon based on subscription status
- Shows toast messages for success/error feedback

### 4. HTML (`src/index.html`)

- Added notification button to navbar with two bell icons
- Button is hidden by default, shown only for logged-in users
- Icons:
  - Bell icon (active) - shown when subscribed
  - Bell with slash (inactive) - shown when not subscribed

### 5. Styles (`src/styles/styles.css`)

- `.btn-notification` - Circular button with hover effects
- `.btn-notification.subscribed` - Green gradient when subscribed
- Added `@keyframes slideOut` animation for toast notifications
- Responsive and accessible design

### 6. Environment Variables (`.env`)

- `VITE_VAPID_PUBLIC_KEY` - Public key for VAPID authentication

## API Integration

### Subscribe Endpoint

```
POST /notifications/subscribe
Headers: Authorization: Bearer {token}
Body: {
  endpoint: string,
  keys: {
    p256dh: string,
    auth: string
  }
}
```

### Unsubscribe Endpoint

```
DELETE /notifications/subscribe
Headers: Authorization: Bearer {token}
Body: {
  endpoint: string
}
```

### Expected Response

```json
{
  "error": false,
  "message": "success message",
  "data": {...}
}
```

## User Flow

### First Time

1. User logs in
2. Notification bell button appears in navbar (off state)
3. User clicks bell button
4. Browser asks for notification permission
5. On "Allow", subscribes to push notifications
6. Button turns green with active bell icon
7. Success toast message appears

### Unsubscribe

1. User clicks the green bell button
2. Unsubscribes from push notifications
3. Button returns to inactive state (bell with slash)
4. Success toast message appears

### Receiving Notifications

1. Server sends push notification
2. Service worker receives push event
3. Browser displays notification
4. User clicks notification
5. App opens in browser

## Browser Support

- Chrome/Edge (full support)
- Firefox (full support)
- Safari 16+ (full support)
- Opera (full support)

## Security

- Uses VAPID (Voluntary Application Server Identification) for authentication
- Requires HTTPS in production
- User permission required before subscribing
- Service worker scope limited to root path

## Testing

1. Start the dev server
2. Login to the application
3. Click the notification bell button
4. Allow notification permission when prompted
5. Test receiving notifications from the backend
6. Click unsubscribe and verify icon changes

## Notes

- Service worker must be served from public directory
- VAPID key must be stored in environment variables
- Notifications only work over HTTPS (except localhost)
- User must grant permission explicitly
