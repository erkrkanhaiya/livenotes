# Fixing ERR_BLOCKED_BY_CLIENT Error

## What is this error?

`ERR_BLOCKED_BY_CLIENT` occurs when Firestore's real-time listeners (WebSocket connections) are blocked by:
- Ad blockers
- Browser extensions
- Network/firewall restrictions
- Chrome extension Content Security Policy (CSP)

## Changes Made

### 1. Updated Content Security Policy (CSP)
Added WebSocket permissions to the manifest:
- `wss://firestore.googleapis.com` - For Firestore WebSocket connections
- `https://firestore.googleapis.com` - For Firestore HTTPS connections
- `ws://localhost:*` - For local development

### 2. Enhanced Error Handling
- Added fallback to polling mode when real-time listeners fail
- Better error messages to help diagnose the issue
- Automatic retry with polling every 30 seconds

### 3. Improved Logging
- Clear console warnings when listeners are blocked
- Helpful troubleshooting messages

## How to Fix

### Option 1: Disable Ad Blockers (Temporary Test)
1. Disable all ad blockers temporarily
2. Reload the extension
3. Check if the error is gone
4. If it works, add exceptions for:
   - `firestore.googleapis.com`
   - `*.googleapis.com`
   - `*.firebaseapp.com`

### Option 2: Check Browser Extensions
1. Go to `chrome://extensions/`
2. Disable extensions one by one to find the culprit
3. Common culprits:
   - Privacy Badger
   - uBlock Origin
   - AdBlock Plus
   - Ghostery

### Option 3: Verify Manifest Permissions
1. Check that the extension has been reloaded after manifest changes
2. Go to `chrome://extensions/`
3. Click "Reload" on your extension
4. Check the console for CSP errors

### Option 4: Network/Firewall
1. Check if your network/firewall blocks WebSocket connections
2. Try on a different network (mobile hotspot)
3. Check corporate firewall settings

### Option 5: Use Polling Mode (Fallback)
The app will automatically fall back to polling mode if real-time listeners fail:
- Notifications will be checked every 30 seconds
- Data will still sync, just not in real-time
- This is handled automatically - no action needed

## Testing

1. **Check Console Logs:**
   - Look for: `✅ Firestore initialized successfully`
   - Look for: `⚠️ Firestore real-time listener blocked`
   - Look for: `📦 Falling back to polling mode`

2. **Check Network Tab:**
   - Open DevTools → Network
   - Filter by "WS" (WebSocket)
   - Look for connections to `firestore.googleapis.com`
   - Check if they're being blocked

3. **Test Real-time Updates:**
   - Create a note in one window
   - Check if it appears in another window immediately
   - If not, polling mode is active (updates every 30 seconds)

## Manifest Changes

The CSP has been updated to allow:
```json
"connect-src": [
  "self",
  "http://localhost:*",
  "https://*.googleapis.com",
  "https://*.firebaseapp.com",
  "wss://*.firebaseapp.com",
  "wss://firestore.googleapis.com",
  "https://firestore.googleapis.com",
  "https://www.gstatic.com",
  "https://securetoken.googleapis.com",
  "https://identitytoolkit.googleapis.com",
  "https://firebase.googleapis.com",
  "https://*.cloudfunctions.net",
  "ws://localhost:*"
]
```

## After Making Changes

1. **Reload the Extension:**
   ```bash
   # In Chrome, go to chrome://extensions/
   # Click "Reload" on your extension
   ```

2. **Rebuild if Needed:**
   ```bash
   npm run build
   # or
   yarn build
   ```

3. **Check Console:**
   - Open extension popup
   - Open DevTools (F12)
   - Check for initialization messages
   - Look for any CSP errors

## Still Having Issues?

If the error persists:
1. Check browser console for specific error messages
2. Verify all environment variables are set correctly
3. Test in incognito mode (extensions disabled)
4. Check Firebase Console for project status
5. Verify Firestore is enabled in your Firebase project

