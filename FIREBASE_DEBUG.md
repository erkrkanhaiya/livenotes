# Firebase Configuration Debugging Guide

## Common Issues After Changing Environment Variables

### 1. `ERR_BLOCKED_BY_CLIENT` Error

This error typically indicates that Firestore requests are being blocked. Here's how to fix it:

#### Possible Causes:
- **Ad Blockers**: Ad blockers may block Firestore requests
- **Incorrect Firebase Config**: Environment variables don't match your Firebase project
- **Firestore Security Rules**: Rules may be blocking access
- **Network Issues**: Connectivity problems

#### Solutions:

1. **Check Environment Variables**
   - Ensure all required variables are set in your `.env` file:
     ```
     VITE_FIREBASE_API_KEY=your_api_key
     VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
     VITE_FIREBASE_PROJECT_ID=your_project_id
     VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
     VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
     VITE_FIREBASE_APP_ID=your_app_id
     VITE_GOOGLE_CLIENT_ID=your_google_client_id
     ```
   - Restart the dev server after changing `.env` file
   - Check browser console for validation messages

2. **Disable Ad Blockers**
   - Temporarily disable ad blockers to test if they're blocking Firestore
   - Add exceptions for `firestore.googleapis.com` and `firebase.googleapis.com`

3. **Verify Firebase Project**
   - Go to Firebase Console → Project Settings
   - Ensure the config values match your `.env` file
   - Check that Firestore is enabled in your project

4. **Check Firestore Security Rules**
   - Go to Firebase Console → Firestore Database → Rules
   - Ensure rules allow authenticated users to read/write:
     ```javascript
     rules_version = '2';
     service cloud.firestore {
       match /databases/{database}/documents {
         match /{document=**} {
           allow read, write: if request.auth != null;
         }
       }
     }
     ```

5. **Network Connectivity**
   - Check internet connection
   - Verify firewall isn't blocking Firebase domains
   - Test in incognito mode to rule out extension conflicts

### 2. Login Issues

#### Symptoms:
- Cannot sign in with email/password
- Cannot sign in with Google
- User gets logged out immediately

#### Solutions:

1. **Check Firebase Auth Configuration**
   - Go to Firebase Console → Authentication → Sign-in method
   - Ensure Email/Password and Google providers are enabled
   - For Google Sign-In, verify OAuth client IDs match your environment variables

2. **Verify Auth Domain**
   - Check that `VITE_FIREBASE_AUTH_DOMAIN` matches your Firebase project
   - Format should be: `your-project-id.firebaseapp.com`

3. **Check Browser Console**
   - Look for Firebase initialization errors
   - Check for missing environment variable warnings
   - Verify Firebase config is logged correctly

### 3. Data Saving Issues

#### Symptoms:
- Notes not saving to Firestore
- Groups not being created
- Data only saved locally

#### Solutions:

1. **Check Firestore Connection**
   - Open browser console and look for Firestore initialization messages
   - Check for `ERR_BLOCKED_BY_CLIENT` errors
   - Verify `db` object is initialized (check console logs)

2. **Verify User Authentication**
   - Ensure user is properly authenticated before saving data
   - Check `auth.currentUser` is not null
   - Verify user ID matches Firestore document structure

3. **Check Firestore Rules**
   - Ensure rules allow authenticated users to write
   - Check for specific collection rules that might block writes

### 4. Debugging Steps

1. **Check Console Logs**
   - Look for Firebase initialization messages
   - Check for error messages with details
   - Verify environment variable validation

2. **Test Firebase Connection**
   - Open browser DevTools → Network tab
   - Look for requests to `firestore.googleapis.com`
   - Check if requests are being blocked (status: blocked/canceled)

3. **Verify Environment Variables**
   - Check `.env` file exists in project root
   - Ensure variables start with `VITE_` prefix
   - Restart dev server after changes

4. **Test in Different Environments**
   - Test in Chrome Extension mode
   - Test in web mode
   - Test in incognito mode

### 5. Quick Checklist

- [ ] All environment variables are set in `.env` file
- [ ] Dev server restarted after `.env` changes
- [ ] Firebase project matches environment variables
- [ ] Firestore is enabled in Firebase Console
- [ ] Firestore security rules allow authenticated access
- [ ] Email/Password and Google Sign-In are enabled
- [ ] Ad blockers are disabled or exceptions added
- [ ] Network connectivity is working
- [ ] Browser console shows Firebase initialization success
- [ ] User is authenticated before saving data

### 6. Getting Help

If issues persist:
1. Check browser console for detailed error messages
2. Check Network tab for blocked requests
3. Verify Firebase project settings match your config
4. Test with a fresh Firebase project to isolate issues
5. Check Firebase status page for service outages

