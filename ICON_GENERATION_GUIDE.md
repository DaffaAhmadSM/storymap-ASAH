# Icon Generation Guide for PWA

## Required Icons

Story Map PWA needs the following icon sizes:

- 72x72
- 96x96
- 128x128
- 144x144
- 152x152
- 192x192 (Required for PWA)
- 384x384
- 512x512 (Required for PWA)

## Quick Icon Generation

### Option 1: Using Online Tools

**Recommended: PWA Asset Generator**
1. Visit: https://www.pwabuilder.com/imageGenerator
2. Upload your base icon (minimum 512x512 PNG)
3. Download the generated icons
4. Place in `/public/images/` directory

**Alternative: Favicon Generator**
1. Visit: https://realfavicongenerator.net/
2. Upload your icon
3. Download the package
4. Extract icons to `/public/images/`

### Option 2: Using ImageMagick (Command Line)

```bash
# Install ImageMagick
# macOS: brew install imagemagick
# Ubuntu: sudo apt-get install imagemagick
# Windows: Download from https://imagemagick.org/

# Create all sizes from a 512x512 source icon
cd public/images

convert icon-512x512.png -resize 72x72 icon-72x72.png
convert icon-512x512.png -resize 96x96 icon-96x96.png
convert icon-512x512.png -resize 128x128 icon-128x128.png
convert icon-512x512.png -resize 144x144 icon-144x144.png
convert icon-512x512.png -resize 152x152 icon-152x152.png
convert icon-512x512.png -resize 192x192 icon-192x192.png
convert icon-512x512.png -resize 384x384 icon-384x384.png
```

### Option 3: Using Node.js Script

```bash
# Install sharp
npm install --save-dev sharp

# Create generate-icons.js
```

```javascript
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const sourceIcon = 'path/to/source-icon.png'; // Your base icon (512x512 or larger)
const outputDir = 'public/images';

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate all sizes
sizes.forEach(size => {
  sharp(sourceIcon)
    .resize(size, size)
    .toFile(path.join(outputDir, `icon-${size}x${size}.png`))
    .then(() => console.log(`✓ Generated icon-${size}x${size}.png`))
    .catch(err => console.error(`✗ Error generating ${size}x${size}:`, err));
});
```

```bash
# Run the script
node generate-icons.js
```

## Screenshot Generation

### Requirements

**Mobile Screenshots (narrow form factor):**
- Size: 540x720 or similar portrait aspect
- Format: PNG
- Quantity: At least 1, recommended 2-3

**Desktop Screenshots (wide form factor):**
- Size: 1280x720 or similar landscape aspect
- Format: PNG
- Quantity: At least 1, recommended 2-3

### How to Capture

**Method 1: Browser DevTools**

1. Open your app in Chrome
2. Open DevTools (F12)
3. Toggle device toolbar (Ctrl+Shift+M)
4. Select device (iPhone 12 for mobile)
5. Navigate to the view you want to capture
6. Right-click → "Capture screenshot"
7. Save as `screenshot-mobile-1.png`

**For desktop screenshots:**
1. Set custom dimensions (1280x720)
2. Capture different app views
3. Save as `screenshot-desktop-1.png`

**Method 2: Screenshot Tools**

- **Windows:** Snipping Tool, Greenshot
- **macOS:** Cmd+Shift+4 (area select)
- **Linux:** GNOME Screenshot, Flameshot

### Recommended Screenshots

1. **Map View** - Main interface with stories
2. **Add Story Form** - Story creation interface
3. **Story List** - Sidebar with stories
4. **Story Detail** - Modal or detail view

## Icon Design Guidelines

### Design Recommendations

✅ **Do:**
- Use simple, recognizable symbols
- Ensure good contrast
- Make it work at small sizes
- Use your brand colors
- Keep it consistent with app theme
- Test on different backgrounds

❌ **Don't:**
- Use photos (hard to recognize when small)
- Include fine details (won't be visible)
- Use text (hard to read at small sizes)
- Make it too complex
- Ignore safe zone for maskable icons

### Maskable Icons

For Android adaptive icons, create a maskable version:

**Safe Zone:**
- Minimum safe zone: 80% of the icon (40% radius circle from center)
- Outer 20% may be cropped on some devices

**Tools:**
- https://maskable.app/ - Test maskable icons
- Add `"purpose": "maskable"` to relevant icons in manifest

## File Structure

```
public/
├── images/
│   ├── icon-72x72.png
│   ├── icon-96x96.png
│   ├── icon-128x128.png
│   ├── icon-144x144.png
│   ├── icon-152x152.png
│   ├── icon-192x192.png
│   ├── icon-384x384.png
│   ├── icon-512x512.png
│   ├── screenshot-mobile-1.png
│   ├── screenshot-mobile-2.png
│   ├── screenshot-desktop-1.png
│   └── screenshot-desktop-2.png
└── manifest.json
```

## Verification

### Check Icon Quality

1. Open DevTools → Application → Manifest
2. Verify all icons load correctly
3. Check for any warnings
4. Test on actual devices

### Check Screenshots

1. DevTools → Application → Manifest
2. Scroll to Screenshots section
3. Verify images display correctly
4. Check mobile and desktop variants

## Optimization

### Compress Icons

```bash
# Using pngquant
pngquant --quality=65-80 public/images/icon-*.png

# Using online tools
# https://tinypng.com/
# https://squoosh.app/
```

### Recommended File Sizes

- 72x72: < 5KB
- 192x192: < 10KB
- 512x512: < 30KB
- Screenshots: < 200KB each

## Testing

### Manual Testing

1. Clear browser cache
2. Reload app
3. Check DevTools → Application → Manifest
4. Verify "No issues" message
5. Test install prompt
6. Check installed app icon

### Lighthouse Audit

```bash
# Run Lighthouse
npx lighthouse https://your-app-url --view

# Check PWA score
# Should be 100 with all icons present
```

## Troubleshooting

### Icons Not Showing

- Check file paths in manifest.json
- Verify files exist in /public/images/
- Check file permissions
- Clear browser cache
- Check DevTools console for errors

### Install Prompt Not Appearing

- Verify 192x192 and 512x512 icons present
- Check manifest.json is valid
- Ensure HTTPS (or localhost)
- Check install criteria met
- Try incognito mode

### Screenshots Not Displaying

- Verify correct sizes
- Check form_factor values
- Ensure PNG format
- Check file size not too large

## Quick Start (TL;DR)

```bash
# 1. Create a 512x512 icon for your app
# 2. Use PWA Asset Generator (easiest):
#    https://www.pwabuilder.com/imageGenerator

# 3. Download and extract to public/images/

# 4. Take screenshots:
#    - Mobile: 540x720 (DevTools → iPhone 12)
#    - Desktop: 1280x720 (Full screen)

# 5. Verify in DevTools:
#    Application → Manifest → Check for issues

# Done! ✅
```

## Resources

- [Web.dev: Add a manifest](https://web.dev/add-manifest/)
- [MDN: Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Maskable Icon Editor](https://maskable.app/editor)
- [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator)
- [Icon Kitchen](https://icon.kitchen/)
