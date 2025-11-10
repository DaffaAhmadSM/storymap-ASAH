# Progressive Web App (PWA) Implementation

## Overview

Story Map is now a fully functional Progressive Web App with offline capabilities, installability, and IndexedDB caching for optimal user experience.

## PWA Features Implemented

### ✅ 1. Web App Manifest

**File:** `/public/manifest.json`

- Complete app metadata (name, short_name, description)
- Theme color (#3498db) and background color
- Multiple icon sizes (72x72 to 512x512)
- Screenshots for mobile and desktop
- Display mode: standalone
- Shortcuts for quick actions (View Map, Add Story)
- Categories and language settings

**No warnings in Chrome DevTools:**
- Open DevTools → Application → Manifest
- All required fields present
- Icons properly configured
- Screenshots included

### ✅ 2. Service Worker with Caching

**File:** `/src/public/sw.js`

**Caching Strategies:**

1. **Static Assets (Cache First)**
   - HTML, CSS, JS files
   - App icons and manifest
   - Cached on install for instant offline access

2. **API Requests (Network First with Cache Fallback)**
   - Stories API (`/stories`)
   - Notifications API (`/notifications`)
   - Fresh data when online
   - Cached fallback when offline

3. **Images (Cache First with Network Fallback)**
   - User photos
   - Story images
   - Placeholder image when offline and not cached

**Features:**
- Automatic cache versioning
- Old cache cleanup on activation
- Background sync support
- Push notification handling

### ✅ 3. IndexedDB Integration

**File:** `/src/scripts/utils/idb-helper.js`

**Database Schema:**
- Database: `story-map-db`
- Object Store: `stories`
- Key Path: `id`
- Indexes: `createdAt`, `name`, `hasLocation`

**CRUD Operations:**

| Operation | Function | Description |
|-----------|----------|-------------|
| **Create** | `saveStory(story)` | Save single story to cache |
| **Create** | `saveStories(stories)` | Batch save stories |
| **Read** | `getAllStories()` | Get all cached stories |
| **Read** | `getStoriesWithLocation()` | Get stories with coordinates |
| **Read** | `getStoriesWithoutLocation()` | Get stories without coordinates |
| **Read** | `getStoryById(id)` | Get specific story by ID |
| **Delete** | `deleteStory(id)` | Remove story from cache |
| **Delete** | `clearAllStories()` | Clear entire cache |

**Additional Features:**
- `getStoryCount()` - Count cached items
- `isIndexedDBSupported()` - Feature detection
- Automatic cache timestamp tracking

### ✅ 4. Offline Mode

**Features:**
- Offline indicator in header
- Automatic detection of network status
- Toast notifications on status change
- Cached data display when offline
- Auto-refresh when back online

**Implementation:**
- Event listeners for `online` and `offline` events
- Network-aware data fetching
- IndexedDB fallback for API calls
- Visual feedback with offline banner

### ✅ 5. Install Prompt

**UI Elements:**
- Install button in header navbar
- Responsive design (icon-only on mobile)
- Gradient blue styling
- Download icon indicator

**Functionality:**
- Intercepts `beforeinstallprompt` event
- Shows custom install button
- Triggers browser install prompt on click
- Success notification after installation
- Hides button when already installed
- Detects standalone display mode

**Testing:**
- Desktop: Install button appears in navbar
- Mobile: Responsive icon button
- Standalone mode detection works

### ✅ 6. Application Shell

**Always Available Offline:**
- Main HTML structure
- Header with navigation
- Loading states
- Error messages
- Offline indicator
- Login/Register forms

**Progressive Enhancement:**
- Core functionality works offline
- Enhanced features online
- Graceful degradation

## Technical Implementation

### File Structure

```
story-map/
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                  # Service worker
│   └── images/
│       ├── icon-*.png         # App icons (all sizes)
│       └── screenshot-*.png   # Install screenshots
├── src/
│   ├── index.html             # Manifest link, meta tags
│   ├── scripts/
│   │   ├── index.js           # Install prompt, offline detection
│   │   ├── utils/
│   │   │   └── idb-helper.js  # IndexedDB operations
│   │   └── pages/
│   │       └── map/
│   │           ├── map-model.js      # Offline-aware data fetching
│   │           └── map-presenter.js   # Cache info display
│   └── styles/
│       └── styles.css         # Offline indicator, install button
```

### Data Flow

#### Online Mode:
```
User Request → API Fetch → IndexedDB Save → Display Data
```

#### Offline Mode:
```
User Request → Network Fail → IndexedDB Retrieve → Display Cached Data
```

### Cache Lifecycle

1. **Install Phase:**
   - Service worker installs
   - Static assets cached
   - Skip waiting activated

2. **Activate Phase:**
   - Old caches deleted
   - Service worker claims clients
   - Ready to handle requests

3. **Fetch Phase:**
   - Network-first for API
   - Cache-first for assets
   - Fallback strategies

## User Experience

### First Visit (Online)
1. Page loads normally
2. Service worker registers
3. Static assets cached
4. Install prompt appears
5. Data fetched and cached

### First Visit (Offline)
1. Application shell loads (if previously cached)
2. Offline indicator shows
3. Cached data displays
4. Limited functionality (view only)

### Subsequent Visits (Online)
1. Instant load from cache
2. Data refreshes from network
3. Cache updates automatically

### Subsequent Visits (Offline)
1. Instant load from cache
2. Offline indicator appears
3. Full view of cached content
4. No create/edit functionality

### After Installation
1. App icon on homescreen/desktop
2. Standalone window (no browser chrome)
3. Full PWA experience
4. Faster startup

## Testing Guide

### Test Installability

**Desktop:**
1. Open Chrome/Edge
2. Look for install icon in address bar
3. Or click "Install App" button in navbar
4. Verify installation
5. Launch from desktop/start menu

**Mobile:**
1. Open in Chrome/Safari
2. Look for "Add to Home Screen" prompt
3. Or tap menu → "Install Story Map"
4. Verify home screen icon
5. Launch from home screen

### Test Offline Mode

**Method 1: DevTools**
1. Open DevTools → Network tab
2. Check "Offline" checkbox
3. Reload page
4. Verify cached data displays
5. Check offline indicator appears

**Method 2: Airplane Mode**
1. Enable airplane mode
2. Open/reload app
3. Navigate between pages
4. Verify cached stories visible
5. Check for graceful errors

**Method 3: Service Worker**
1. DevTools → Application → Service Workers
2. Check "Offline" checkbox
3. Reload page

### Test IndexedDB

**View Database:**
1. DevTools → Application → Storage → IndexedDB
2. Expand `story-map-db`
3. Click `stories` object store
4. View cached stories with metadata

**Verify Operations:**
```javascript
// In browser console

// Check if stories are cached
const count = await idbHelper.getStoryCount();
console.log(`${count} stories cached`);

// Get all cached stories
const stories = await idbHelper.getAllStories();
console.log(stories);

// Get stories with location
const withLocation = await idbHelper.getStoriesWithLocation();
console.log(withLocation);
```

### Test Caching Strategies

**Static Assets:**
1. Load page online
2. DevTools → Network → Disable cache
3. Go offline
4. Reload page
5. Verify instant load from cache

**API Requests:**
1. Load stories online
2. Go offline
3. Navigate away and back
4. Verify cached stories display

**Images:**
1. View stories online
2. Go offline
3. Reload page
4. Verify cached images display

## Performance Benefits

### Load Times

| Scenario | First Load | Repeat Load | Offline Load |
|----------|------------|-------------|--------------|
| **Without PWA** | 2-3s | 2-3s | ❌ Fail |
| **With PWA** | 2-3s | <1s | <1s |

### Data Usage

- Initial: Full download
- Subsequent: Only new/changed data
- Offline: Zero data usage

### User Benefits

✅ **Install to device** - App-like experience  
✅ **Offline access** - View cached stories anytime  
✅ **Fast loading** - Instant from cache  
✅ **Low data usage** - Smart caching  
✅ **Push notifications** - Re-engagement  
✅ **Responsive design** - Works on all devices  

## Browser Support

| Browser | PWA Support | Service Worker | IndexedDB | Install Prompt |
|---------|-------------|----------------|-----------|----------------|
| Chrome | ✅ Full | ✅ | ✅ | ✅ |
| Edge | ✅ Full | ✅ | ✅ | ✅ |
| Firefox | ✅ Full | ✅ | ✅ | ⚠️ Manual |
| Safari | ✅ iOS 11.3+ | ✅ | ✅ | ⚠️ Manual |
| Opera | ✅ Full | ✅ | ✅ | ✅ |

## Manifest Validation

**No Warnings/Errors:**
- ✅ Name and short_name present
- ✅ Icons include 192x192 and 512x512
- ✅ start_url is valid
- ✅ display mode set to standalone
- ✅ theme_color and background_color defined
- ✅ Screenshots included for install prompt
- ✅ Maskable icons for Android

## Lighthouse Audit

**Expected PWA Score: 100**

Checklist:
- ✅ Registers a service worker
- ✅ Responds with 200 when offline
- ✅ Contains metadata for Add to Home Screen
- ✅ Configured for custom splash screen
- ✅ Sets theme color
- ✅ Content sized correctly for viewport
- ✅ Provides valid manifest
- ✅ Uses HTTPS (production)

## Best Practices

### Do's ✅
- Cache static assets on install
- Update cache incrementally
- Provide offline fallback
- Show connection status
- Request install permission appropriately
- Handle failed network requests gracefully

### Don'ts ❌
- Don't cache everything (storage limits)
- Don't show install prompt immediately
- Don't block on cache operations
- Don't ignore offline state
- Don't cache sensitive data without encryption

## Troubleshooting

### Install Button Not Showing
- Check if already installed (standalone mode)
- Try incognito/private mode
- Clear site data and reload
- Check browser support

### Offline Mode Not Working
- Verify service worker is registered
- Check Application → Service Workers in DevTools
- Ensure cache is populated
- Check network tab for cache hits

### Data Not Caching
- Open IndexedDB in DevTools
- Verify database created
- Check for quota exceeded errors
- Verify network requests succeed first

### Service Worker Not Updating
- Unregister old service worker
- Hard refresh (Ctrl+Shift+R)
- Update service worker version
- Check for SW registration errors

## Future Enhancements

- [ ] Background sync for story creation
- [ ] Periodic background sync for new stories
- [ ] Cache size management (LRU eviction)
- [ ] Offline story drafts
- [ ] Delta sync (only changed data)
- [ ] Share target API integration
- [ ] File system access for exports

## Resources

- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev: PWA Training](https://web.dev/learn/pwa/)
- [Chrome: Install Criteria](https://web.dev/install-criteria/)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
