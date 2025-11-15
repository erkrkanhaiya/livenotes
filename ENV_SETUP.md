# Environment Variables Setup Guide

This guide will help you set up all required environment variables for the Live Notes Chrome Extension.

## Required Environment Variables

### Firebase Configuration

All Firebase values can be found in your Firebase Console:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** (gear icon) > **General** tab
4. Scroll down to **Your apps** section
5. Click on your web app or add a new web app

#### `VITE_FIREBASE_API_KEY`
- **Location**: Firebase Console > Project Settings > General > Your apps > Web app config
- **Format**: `AIzaSy...` (long string)
- **Required**: ✅ Yes

#### `VITE_FIREBASE_AUTH_DOMAIN`
- **Location**: Firebase Console > Project Settings > General > Your apps > Web app config
- **Format**: `your-project-id.firebaseapp.com`
- **Required**: ✅ Yes

#### `VITE_FIREBASE_PROJECT_ID`
- **Location**: Firebase Console > Project Settings > General > Your apps > Web app config
- **Format**: `your-project-id` (e.g., `mylivenotes-184d`)
- **Required**: ✅ Yes

#### `VITE_FIREBASE_STORAGE_BUCKET`
- **Location**: Firebase Console > Project Settings > General > Your apps > Web app config
- **Format**: `your-project-id.appspot.com`
- **Required**: ✅ Yes

#### `VITE_FIREBASE_MESSAGING_SENDER_ID`
- **Location**: Firebase Console > Project Settings > General > Your apps > Web app config
- **Format**: Numeric string (e.g., `123456789012`)
- **Required**: ✅ Yes

#### `VITE_FIREBASE_APP_ID`
- **Location**: Firebase Console > Project Settings > General > Your apps > Web app config
- **Format**: `1:123456789012:web:abcdef123456`
- **Required**: ✅ Yes

#### `VITE_FIREBASE_MEASUREMENT_ID`
- **Location**: Firebase Console > Project Settings > General > Your apps > Web app config
- **Format**: `G-XXXXXXXXXX`
- **Required**: ⚠️ Optional (for Analytics)

### Google OAuth Configuration

#### `VITE_GOOGLE_CLIENT_ID`
- **Location**: 
  - Firebase Console > Authentication > Sign-in method > Google > Web SDK configuration
  - OR Google Cloud Console > APIs & Services > Credentials
- **Format**: `123456789-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com`
- **Required**: ✅ Yes

### Chrome Extension Configuration

#### `VITE_EXTENSION_KEY`
- **Location**: Chrome Web Store Developer Dashboard (after publishing)
- **How to get**: 
  1. Publish extension to Chrome Web Store
  2. Go to Chrome Web Store Developer Dashboard
  3. Find your extension > More info > Extension ID
  4. Or generate using:
     ```bash
     openssl genrsa -out key.pem 2048
     openssl rsa -in key.pem -pubout -outform DER | openssl base64 -A
     ```
- **Required**: ⚠️ Optional (only needed for Chrome Web Store publishing)

### Web App Configuration

#### `VITE_WEB_APP_URL`
- **Description**: The URL where your web app is deployed
- **Format**: `https://your-app-domain.vercel.app` or `https://your-domain.com`
- **Used for**: "Open Web Version" links in the extension
- **Required**: ⚠️ Optional (defaults to `http://localhost:5174` for development)

## Setup Instructions

### 1. Create `.env` file

Copy the example file:
```bash
cp .env.example .env
```

### 2. Fill in your values

Open `.env` and replace all placeholder values with your actual Firebase and Google OAuth credentials.

### 3. Verify your configuration

After setting up your `.env` file, start the dev server:
```bash
npm run dev
```

Check the browser console for:
- ✅ `All required Firebase environment variables are set`
- ✅ `Firebase initialized successfully`
- ✅ `Firestore initialized successfully`

If you see errors about missing variables, double-check your `.env` file.

## Environment Variables for Different Environments

### Development
- Use `.env` file in the project root
- All variables should be set locally

### Production (Vercel)
1. Go to your Vercel project dashboard
2. Navigate to **Settings** > **Environment Variables**
3. Add all required variables:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_GOOGLE_CLIENT_ID`
   - `VITE_WEB_APP_URL` (optional)

### Chrome Extension Build
- The manifest is generated from environment variables
- Run `npm run generate:manifest` after updating `.env`
- The extension key is only needed for Chrome Web Store publishing

## Troubleshooting

### "Missing required environment variables" error
1. Check that your `.env` file exists in the project root
2. Verify all required variables are set (no empty values)
3. Restart the dev server after changing `.env`
4. Check for typos in variable names (must start with `VITE_`)

### Firebase initialization errors
1. Verify all Firebase config values match your Firebase project
2. Check that Firestore is enabled in Firebase Console
3. Ensure Authentication is enabled with Email/Password and Google providers

### Google Sign-In not working
1. Verify `VITE_GOOGLE_CLIENT_ID` matches your Firebase project's OAuth client
2. Check that Google Sign-In is enabled in Firebase Console > Authentication
3. Ensure the OAuth consent screen is configured in Google Cloud Console

### Web app URL not working
1. Verify `VITE_WEB_APP_URL` is set correctly
2. Check that the URL is accessible and the app is deployed
3. Defaults to `http://localhost:5174` if not set (for development)

## Security Notes

⚠️ **Important**: Never commit your `.env` file to version control!

- The `.env` file is already in `.gitignore`
- Use `.env.example` as a template (without real values)
- For production, use environment variables in your hosting platform (Vercel, etc.)

## Quick Reference

```bash
# Required variables
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_GOOGLE_CLIENT_ID=...

# Optional variables
VITE_FIREBASE_MEASUREMENT_ID=...
VITE_EXTENSION_KEY=...
VITE_WEB_APP_URL=...
```

