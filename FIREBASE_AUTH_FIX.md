# Firebase Auth Network Error Fix

## Problem
Getting `auth/network-request-failed` error when trying to sign in with email/password in Chrome extension or web app.

## Root Cause
Firebase Authentication requires that all domains using it be explicitly authorized in Firebase Console. Chrome extensions use the `chrome-extension://` protocol which must be added to authorized domains.

## Solution

### Step 1: Add Chrome Extension to Firebase Authorized Domains

1. **Get your Chrome Extension ID:**
   - Go to `chrome://extensions/`
   - Find your extension
   - Copy the Extension ID (looks like: `abcdefghijklmnopqrstuvwxyz123456`)

2. **Add to Firebase Console:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Navigate to **Authentication** → **Settings** → **Authorized domains**
   - Click **Add domain**
   - Enter: `chrome-extension://YOUR_EXTENSION_ID`
   - Replace `YOUR_EXTENSION_ID` with your actual extension ID
   - Click **Add**

### Step 2: Add Web App Domain (CRITICAL for web app users)

**This is required for users to login from the web URL!**

1. Go to Firebase Console → Authentication → Settings → Authorized domains
2. Add your web app domain (e.g., `livenote-ruddy.vercel.app`)
   - **Important**: Add the exact domain without `https://` or trailing slashes
   - For Vercel: Add both `your-app.vercel.app` and any custom domains
3. Also add `localhost` for local development
4. **Wait 5-10 minutes** for Firebase to propagate the changes
5. Refresh your web app and try logging in again

**Common web domains to add:**
- `livenote-ruddy.vercel.app` (if using Vercel)
- `localhost` (for local development)
- Any custom domain you're using

### Step 3: Verify Environment Variables

Check your `.env` file has all required variables:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### Step 4: Reload Extension

1. Go to `chrome://extensions/`
2. Find your extension
3. Click **Reload** button
4. Try signing in again

### Step 5: Check Browser Console

Open the extension popup and check console for:
- ✅ `Firebase initialized successfully`
- ✅ `Firebase Auth domain: your-project.firebaseapp.com`
- ❌ Any CORS or network errors

## Common Issues

### Issue: Still getting network error after adding domain

**Solutions:**
1. Wait 5-10 minutes for Firebase to propagate changes
2. Clear browser cache and reload extension
3. Check that you added the exact format: `chrome-extension://EXTENSION_ID` (no trailing slash)
4. Verify your `VITE_FIREBASE_AUTH_DOMAIN` matches your Firebase project

### Issue: Web app also not working

**Solutions:**
1. Add the web domain to Firebase authorized domains
2. Check that the domain matches exactly (including subdomain)
3. For Vercel deployments, add both:
   - `your-app.vercel.app`
   - `your-custom-domain.com` (if using custom domain)

### Issue: CORS errors in console

**Solutions:**
1. Verify manifest.json has all required permissions (already updated)
2. Check that CSP allows Firebase domains (already updated)
3. Disable ad blockers temporarily to test
4. Check browser extensions that might block requests

## Testing

1. **Test Extension:**
   - Open extension popup
   - Try email/password sign in
   - Check console for errors

2. **Test Web App:**
   - Open web app URL
   - Try email/password sign in
   - Check console for errors

3. **Verify in Firebase Console:**
   - Go to Authentication → Users
   - Check if user appears after successful sign in

## Quick Checklist

- [ ] Extension ID added to Firebase authorized domains as `chrome-extension://EXTENSION_ID`
- [ ] Web app domain added to Firebase authorized domains
- [ ] All environment variables set correctly
- [ ] Extension reloaded after changes
- [ ] Browser cache cleared
- [ ] Ad blockers disabled or exceptions added
- [ ] Firebase project has Email/Password auth enabled
- [ ] Firebase project has Google Sign-In enabled (if using)

## Still Having Issues?

1. Check Firebase Console → Authentication → Settings for any warnings
2. Verify your Firebase project is active and not suspended
3. Check Firebase Status page for service outages
4. Try in incognito mode to rule out extension conflicts
5. Check Network tab in DevTools to see if requests are being blocked

