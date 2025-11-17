# Web App Firebase Configuration Check

## Problem
You can log in on mobile/extension but get `auth/invalid-credential` error on web app.

## Root Cause
The web app is likely using **different Firebase environment variables** than your extension/mobile app, causing it to point to a different Firebase project (or no project at all).

## Solution

### Step 1: Verify Firebase Project is the Same

1. **Check Extension/Mobile Firebase Config:**
   - Open extension popup
   - Open browser console (F12)
   - Look for: `🔧 Initializing Firebase with config:`
   - Note the `projectId` and `authDomain`

2. **Check Web App Firebase Config:**
   - Go to https://livenote-ruddy.vercel.app/
   - Open browser console (F12)
   - Look for: `🔧 Initializing Firebase with config:`
   - Compare `projectId` and `authDomain` with extension

3. **If they don't match:**
   - The web app is using a different Firebase project
   - You need to set the correct environment variables in Vercel

### Step 2: Set Environment Variables in Vercel

1. **Go to Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Select your project (`livenote-ruddy` or similar)

2. **Navigate to Settings:**
   - Click on your project
   - Go to **Settings** → **Environment Variables**

3. **Add/Update Firebase Variables:**
   Add these variables (use the SAME values as your extension/mobile):
   ```
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id (optional)
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   ```

4. **Important Settings:**
   - Set environment to: **Production, Preview, Development** (all three)
   - Make sure values match your extension's `.env` file exactly

### Step 3: Redeploy Web App

After setting environment variables:

1. **Option 1: Automatic Redeploy**
   - Vercel will automatically redeploy when you save environment variables
   - Wait for deployment to complete

2. **Option 2: Manual Redeploy**
   - Go to **Deployments** tab
   - Click **...** on latest deployment
   - Click **Redeploy**

### Step 4: Verify After Deployment

1. **Clear Browser Cache:**
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Or open in incognito/private window

2. **Check Console:**
   - Open browser console
   - Look for Firebase initialization messages
   - Verify `projectId` matches your extension

3. **Try Login:**
   - Use the same credentials that work on mobile/extension
   - Check console for any errors

## Quick Checklist

- [ ] Extension and web app show the same `projectId` in console
- [ ] Extension and web app show the same `authDomain` in console
- [ ] All Firebase environment variables are set in Vercel
- [ ] Environment variables are set for Production, Preview, and Development
- [ ] Web app has been redeployed after setting variables
- [ ] Browser cache cleared
- [ ] Tried login with same credentials

## Common Issues

### Issue: Environment variables not showing in console

**Solution:**
- Vite environment variables must start with `VITE_`
- Make sure you're checking the built/deployed version, not local dev
- Check Vercel deployment logs for build errors

### Issue: Variables set but still wrong project

**Solution:**
- Make sure you set variables for ALL environments (Production, Preview, Development)
- Redeploy the app after setting variables
- Check that variable names match exactly (case-sensitive)

### Issue: Works locally but not on Vercel

**Solution:**
- Local `.env` file is different from Vercel environment variables
- Copy values from your local `.env` to Vercel
- Make sure you're using the same Firebase project

## Testing

1. **Compare Firebase Configs:**
   ```javascript
   // In browser console on web app:
   console.log('Web App Firebase:', {
     projectId: firebase.app().options.projectId,
     authDomain: firebase.app().options.authDomain
   });
   ```

2. **Check Firebase Console:**
   - Go to Firebase Console → Authentication → Users
   - Verify your user exists
   - Check which project the user is in

3. **Verify Same Project:**
   - Extension project ID should match web app project ID
   - Both should show the same user in Firebase Console

## Still Having Issues?

1. Check Vercel deployment logs for build errors
2. Verify environment variables are actually being used (check console)
3. Try creating a new user on web app to see if it's a project mismatch
4. Check Firebase Console to see which project has your user account

