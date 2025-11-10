# Offline-to-Online Data Synchronization

## Overview

Aplikasi Story Map dilengkapi dengan sistem sinkronisasi offline-to-online yang memungkinkan pengguna untuk membuat story bahkan saat tidak ada koneksi internet. Story yang dibuat secara offline akan otomatis di-sync ke server saat koneksi internet kembali tersedia.

## Fitur Utama

### 1. **Offline Story Creation**

- ✅ Pengguna dapat membuat story dengan foto dan deskripsi saat offline
- ✅ Story disimpan ke IndexedDB dengan status "pending"
- ✅ Foto dikonversi ke base64 untuk penyimpanan offline
- ✅ Notifikasi "Story saved offline. Will sync when online."

### 2. **Automatic Sync**

- ✅ Deteksi otomatis saat koneksi kembali online
- ✅ Auto-sync semua pending stories ke API
- ✅ Retry logic dengan tracking jumlah attempt
- ✅ Error handling untuk sync yang gagal

### 3. **Manual Sync**

- ✅ Tombol sync di navbar dengan badge counter
- ✅ Klik untuk manual trigger sync
- ✅ Visual feedback saat proses sync berlangsung

### 4. **Sync Status Indicators**

- ✅ Badge dengan jumlah pending stories
- ✅ Spinning icon saat sync berlangsung
- ✅ Toast notifications untuk status sync
- ✅ Update real-time setiap 2 detik

## Arsitektur Teknis

### Database Schema (IndexedDB v2)

```javascript
// Object Store: pending-stories
{
  tempId: number (autoIncrement, keyPath),
  status: string ('pending' | 'error'),
  createdAt: string (ISO date, indexed),
  attempts: number (retry counter),
  lastAttempt: string (ISO date),
  error: string (error message if failed),

  // Story data
  description: string,
  lat: number | null,
  lon: number | null,
  photo: {
    name: string,
    type: string,
    size: number,
    data: string (base64)
  }
}
```

### Komponen Utama

#### 1. **SyncManager** (`utils/sync-manager.js`)

Class singleton yang mengelola sinkronisasi offline-to-online.

**Methods:**

- `initialize(apiUrl, authToken)` - Setup dengan API credentials
- `updateToken(token)` - Update auth token
- `saveStoryOffline(formData)` - Simpan story ke pending queue
- `syncPendingStories()` - Sync semua pending stories
- `syncSingleStory(pendingStory)` - Sync satu story
- `retryFailedStories()` - Retry stories yang gagal sync
- `getSyncStatus()` - Get status sync (count, isSyncing, etc)
- `onSync(callback)` - Register listener untuk sync events

**Events:**

- `sync-start` - Sync dimulai
- `sync-progress` - Progress update (current, total, success, failed)
- `sync-complete` - Sync selesai (results: synced, failed, errors)
- `sync-error` - Error saat sync
- `story-queued` - Story baru ditambahkan ke queue

**Helper Methods:**

- `fileToBase64(file)` - Convert File ke base64 string
- `base64ToFile(base64, filename, mimeType)` - Convert base64 ke File object

#### 2. **IDB Helper Extensions** (`utils/idb-helper.js`)

**Pending Queue Management:**

```javascript
// Save pending story
await idbHelper.savePendingStory({
  description: "My story",
  lat: -6.2088,
  lon: 106.8456,
  photo: { name, type, size, data },
});

// Get all pending
const pending = await idbHelper.getPendingStories();

// Update status
await idbHelper.updatePendingStory(tempId, {
  status: "error",
  attempts: 3,
  error: "Network timeout",
});

// Delete after successful sync
await idbHelper.deletePendingStory(tempId);

// Get count for badge
const count = await idbHelper.getPendingCount();
```

#### 3. **Add Story Integration** (`pages/add-story/add-story-presenter.js`)

**Offline Detection & Routing:**

```javascript
async handleSubmit(event) {
  // ... validation ...

  if (!navigator.onLine) {
    // Save offline
    const result = await syncManager.saveStoryOffline(formData);
    showSuccess("Story saved offline! Will sync when online.");
  } else {
    // Normal API call
    const result = await this.model.addStory(apiUrl, formData, token);
    showSuccess("Story added successfully!");
  }
}
```

#### 4. **App Initialization** (`scripts/index.js`)

**Setup & Event Listeners:**

```javascript
// Initialize sync manager
syncManager.initialize(apiUrl, token);

// Auto-sync when back online
window.addEventListener("online", () => {
  syncManager.updateToken(authService.getToken());
  syncManager.syncPendingStories();
});

// Listen to sync events
syncManager.onSync((event, data) => {
  if (event === "sync-complete") {
    showNotification(`Synced ${data.synced} stories!`);
    app.renderPage(); // Refresh to show synced data
  }
});

// Update sync UI every 2 seconds
setInterval(updateSyncUI, 2000);
```

## User Flow

### Scenario 1: Create Story While Offline

1. User mengisi form add story (foto + deskripsi)
2. User submit form
3. App deteksi `!navigator.onLine`
4. Story disimpan ke IndexedDB pending queue
5. Notifikasi: "Story saved offline. Will sync when online."
6. Badge muncul di navbar dengan count pending

### Scenario 2: Auto-Sync When Back Online

1. User kembali online (WiFi/data reconnect)
2. Event `window.addEventListener('online')` triggered
3. `syncManager.syncPendingStories()` dipanggil otomatis
4. Untuk setiap pending story:
   - Convert base64 photo → File object
   - POST ke API `/stories`
   - Jika sukses: simpan ke main cache + hapus dari pending
   - Jika gagal: update status='error' + increment attempts
5. Toast notification: "Synced X stories successfully!"
6. Badge di navbar update/hilang
7. Map page refresh untuk tampilkan story baru

### Scenario 3: Manual Sync

1. User klik tombol sync di navbar
2. Sync button disabled + spinning icon
3. `syncManager.syncPendingStories()` dipanggil
4. Progress ditampilkan via toast
5. Setelah selesai: button enabled kembali
6. Badge update dengan pending count baru

### Scenario 4: Sync Failure & Retry

1. Sync gagal karena network error / server error
2. Story tetap di pending queue
3. Status updated ke 'error'
4. `attempts` counter increment
5. `lastAttempt` timestamp updated
6. Error message disimpan
7. User bisa retry manual via sync button
8. Atau tunggu auto-retry saat online lagi

## UI Components

### 1. **Sync Button** (Navbar)

```html
<button id="sync-btn" class="btn-sync">
  <svg class="icon-sync"><!-- Sync icon --></svg>
  <span class="sync-badge">3</span>
  <!-- Pending count -->
</button>
```

**States:**

- Hidden: Saat tidak ada pending stories
- Visible: Ada pending stories (badge shows count)
- Syncing: Spinning icon animation
- Disabled: During sync process

### 2. **Sync Badge**

- Background: Red (#e74c3c)
- Position: Top-right corner of sync button
- Content: Number of pending stories
- Auto-hide: When count = 0

### 3. **Toast Notifications**

- "Story saved offline"
- "You are back online!"
- "Syncing pending stories..."
- "Synced X stories successfully!"
- "X stories failed to sync" (error style)

## CSS Styling

```css
.btn-sync {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  position: relative;
}

.btn-sync.syncing {
  background: linear-gradient(135deg, #f39c12, #e67e22);
}

.btn-sync.syncing .icon-sync {
  animation: spin 1s linear infinite;
}

.sync-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #e74c3c;
  color: white;
  border-radius: 9px;
  min-width: 18px;
  height: 18px;
  font-size: 0.7rem;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
```

## Error Handling

### Network Errors

```javascript
try {
  await syncSingleStory(pendingStory);
} catch (error) {
  console.error("Sync failed:", error);

  // Update pending story with error
  await idbHelper.updatePendingStory(tempId, {
    status: "error",
    error: error.message,
    attempts: (pendingStory.attempts || 0) + 1,
    lastAttempt: new Date().toISOString(),
  });
}
```

### API Errors

- HTTP 401: Token expired → Prompt user to login
- HTTP 413: File too large → Notify user to reduce photo size
- HTTP 500: Server error → Retry with exponential backoff
- Network timeout → Retry later

### Photo Conversion Errors

```javascript
try {
  const base64 = await fileToBase64(photoFile);
} catch (error) {
  throw new Error("Failed to process photo for offline storage");
}
```

## Performance Considerations

### Photo Storage

- **Problem:** Photos besar dapat membuat IndexedDB bloat
- **Solution:**
  - Compress photos sebelum simpan (future enhancement)
  - Limit pending queue size (max 50 stories)
  - Auto-cleanup old failed stories (> 30 days)

### Sync Batch Size

- Sync satu per satu untuk kontrol error yang lebih baik
- Show progress untuk UX yang lebih baik
- Tidak block UI thread

### IndexedDB Access

- Use transactions untuk atomic operations
- Catch & handle QuotaExceededError
- Periodic cleanup untuk freed space

## Testing Scenarios

### Manual Testing

1. **Offline Creation:**

   - Matikan koneksi internet
   - Buat story dengan foto
   - Cek IndexedDB → harus ada di pending-stories
   - Cek badge → harus muncul dengan count 1

2. **Auto-Sync:**

   - Buat beberapa story offline
   - Nyalakan koneksi internet
   - Tunggu auto-sync (atau refresh page)
   - Cek toast notifications
   - Cek map → story baru harus muncul
   - Cek badge → harus hilang atau update count

3. **Manual Sync:**

   - Buat story offline
   - Klik sync button di navbar
   - Verify spinning icon
   - Verify toast notifications
   - Verify story appears on map

4. **Error Handling:**
   - Buat story offline
   - Logout/clear token
   - Trigger sync → should show 401 error
   - Login kembali
   - Retry sync → should succeed

### Browser DevTools

1. **Network Tab:**

   - Set to "Offline" untuk simulate no connection
   - Throttle to "Slow 3G" untuk test timeout

2. **Application Tab:**

   - IndexedDB → story-map-db → pending-stories
   - Verify data structure
   - Check base64 photo data

3. **Console:**
   - Monitor sync events
   - Check error messages
   - Verify API calls

## Future Enhancements

1. **Exponential Backoff Retry**

   ```javascript
   const delay = Math.min(1000 * Math.pow(2, attempts), 30000);
   setTimeout(() => retrySync(story), delay);
   ```

2. **Conflict Resolution**

   - Jika story sudah ada di server
   - Show diff UI untuk user choose version

3. **Photo Compression**

   ```javascript
   import imageCompression from "browser-image-compression";
   const compressed = await imageCompression(file, {
     maxSizeMB: 1,
     maxWidthOrHeight: 1920,
   });
   ```

4. **Background Sync API**

   ```javascript
   if ("serviceWorker" in navigator && "sync" in registration) {
     await registration.sync.register("sync-stories");
   }
   ```

5. **Periodic Sync Cleanup**

   - Auto-delete failed stories after 30 days
   - Show cleanup notification to user

6. **Sync Statistics**
   - Total stories synced
   - Success rate
   - Average sync time
   - Display in About page

## Security Considerations

1. **Token Management:**

   - Token stored securely in localStorage
   - Auto-refresh before sync if expired
   - Clear pending queue on logout

2. **Photo Data:**

   - Base64 increases size ~33%
   - Consider encryption for sensitive data
   - IndexedDB accessible only to same origin

3. **API Authentication:**
   - Always include Bearer token
   - Handle 401/403 gracefully
   - Prompt re-login if needed

## Browser Compatibility

- ✅ Chrome 24+ (IndexedDB)
- ✅ Firefox 16+ (IndexedDB)
- ✅ Safari 10+ (IndexedDB)
- ✅ Edge 12+ (IndexedDB)
- ⚠️ IE 11 (Partial support, use polyfill)

## Troubleshooting

### Issue: Badge tidak muncul

**Solution:**

```javascript
// Check if sync manager initialized
console.log(syncManager);

// Manually update UI
await updateSyncUI();

// Check pending count
const count = await idbHelper.getPendingCount();
console.log("Pending count:", count);
```

### Issue: Stories tidak ter-sync

**Solution:**

```javascript
// Check online status
console.log("Online:", navigator.onLine);

// Check pending stories
const pending = await idbHelper.getPendingStories();
console.log("Pending stories:", pending);

// Manual trigger sync
await syncManager.syncPendingStories();
```

### Issue: Photo gagal convert

**Solution:**

```javascript
// Check file size
console.log("File size:", file.size / 1024 / 1024, "MB");

// Try reduce quality
const canvas = document.createElement("canvas");
// ... compress image on canvas
```

## API Endpoints Used

### POST /stories

```javascript
// Request
FormData {
  photo: File,
  description: string,
  lat?: number,
  lon?: number
}

// Response
{
  error: false,
  message: "Story created successfully",
  story: {
    id: string,
    name: string,
    description: string,
    photoUrl: string,
    createdAt: string,
    lat?: number,
    lon?: number
  }
}
```

## Summary

Fitur offline-to-online sync memberikan:

- ✅ **Reliability:** Users can create stories anytime, anywhere
- ✅ **User Experience:** Seamless offline/online transition
- ✅ **Data Integrity:** No data loss, automatic retry
- ✅ **Transparency:** Clear sync status and progress indicators
- ✅ **Performance:** Non-blocking, efficient batch processing

Ini membuat Story Map menjadi aplikasi Progressive Web App yang benar-benar offline-first! 🚀
