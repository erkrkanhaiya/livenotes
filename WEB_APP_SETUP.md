# LiveNotes Web App - Mobile Setup Guide

This guide explains how to set up and deploy the LiveNotes web app for mobile devices.

## 📱 Features

- **Progressive Web App (PWA)**: Installable on mobile devices
- **Offline Support**: Service worker caches resources for offline use
- **Mobile-Optimized**: Responsive design with touch-friendly UI
- **Cross-Platform**: Works on iOS, Android, and desktop browsers

## 🚀 Building the Web App

### Development Mode

```bash
# Run web app in development mode
npm run dev:web
```

The app will be available at `http://localhost:5174`

### Production Build

```bash
# Build for production
npm run build:web
```

The built files will be in the `dist-web/` directory.

### Preview Production Build

```bash
# Preview the production build
npm run preview:web
```

## 📦 Deployment

### Option 1: Static Hosting (Recommended)

Deploy the `dist-web/` folder to any static hosting service:

- **Vercel**: `vercel deploy dist-web`
- **Netlify**: Drag and drop `dist-web/` folder
- **Firebase Hosting**: `firebase deploy --only hosting`
- **GitHub Pages**: Push `dist-web/` to `gh-pages` branch
- **AWS S3 + CloudFront**: Upload `dist-web/` to S3 bucket

### Option 2: Custom Server

Serve the `dist-web/` folder with any web server:

```bash
# Using serve
npx serve dist-web

# Using http-server
npx http-server dist-web

# Using Python
cd dist-web && python -m http.server 8000
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your_google_client_id

# Web App URL (for sharing links)
VITE_WEB_APP_URL=https://your-domain.com
```

### PWA Manifest

The PWA manifest is located at `public/manifest.web.json`. Update the following:

- `name`: App name
- `short_name`: Short app name
- `theme_color`: Theme color (should match your brand)
- `background_color`: Background color
- `icons`: App icons (see Icons section below)

### Service Worker

The service worker is at `public/sw.js`. It handles:

- Offline caching
- Background sync
- Cache management

## 🎨 Icons

Generate app icons in the following sizes:

- 72x72
- 96x96
- 128x128
- 144x144
- 152x152
- 192x192
- 384x384
- 512x512

Place all icons in `public/icons/` directory.

### Generating Icons

You can use online tools like:
- [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)

Or use the existing icon from the extension and resize it.

## 📱 Mobile Installation

### iOS (Safari)

1. Open the web app in Safari
2. Tap the Share button
3. Select "Add to Home Screen"
4. Customize the name if needed
5. Tap "Add"

### Android (Chrome)

1. Open the web app in Chrome
2. Tap the menu (three dots)
3. Select "Add to Home screen" or "Install app"
4. Tap "Install" or "Add"

## 🔒 Security Considerations

1. **HTTPS Required**: PWA features require HTTPS (except localhost)
2. **Service Worker Scope**: Ensure service worker is served from root
3. **CORS**: Configure Firebase/API CORS settings for your domain
4. **Content Security Policy**: Update CSP headers if needed

## 🐛 Troubleshooting

### Service Worker Not Registering

- Ensure you're using HTTPS (or localhost)
- Check browser console for errors
- Verify `sw.js` is accessible at `/sw.js`

### Icons Not Showing

- Verify icons are in `public/icons/` directory
- Check manifest.json icon paths
- Ensure icons are proper PNG format

### Offline Not Working

- Check service worker registration in DevTools > Application > Service Workers
- Verify cache is being populated
- Check network tab for failed requests

## 📊 Testing

### Chrome DevTools

1. Open DevTools (F12)
2. Go to Application tab
3. Check:
   - Manifest: Verify PWA manifest
   - Service Workers: Check registration
   - Cache Storage: Verify caching

### Lighthouse

Run Lighthouse audit for PWA:

1. Open DevTools
2. Go to Lighthouse tab
3. Select "Progressive Web App"
4. Click "Generate report"

## 🔄 Updates

When updating the app:

1. Update `CACHE_NAME` in `sw.js` to force cache refresh
2. Rebuild: `npm run build:web`
3. Deploy new `dist-web/` folder
4. Users will get update on next visit

## 📚 Additional Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)

