#!/usr/bin/env node

const { writeFileSync } = require('fs');
const { resolve } = require('path');
const { config } = require('dotenv');

// Load environment variables
config();

// Generate manifest.json with environment variables
const manifest = {
  manifest_version: 3,
  name: "Live Notes",
  description: "A smart note-taking extension with Google authentication, cloud sync, and modern UI",
  version: "1.0.0",
  permissions: [
    "storage",
    "identity",
    "activeTab",
    "tabs"
  ],
  host_permissions: [
    "https://livenote-ruddy.vercel.app/*",
    "https://*.googleapis.com/*",
    "https://*.firebaseapp.com/*",
    "https://*.google.com/*",
    "https://www.gstatic.com/*",
    "https://securetoken.googleapis.com/*",
    "https://identitytoolkit.googleapis.com/*",
    "https://firebase.googleapis.com/*",
    "https://www.googleapis.com/*",
    "https://*.cloudfunctions.net/*"
  ],
  action: {
    default_popup: "index.html",
    default_title: "Live Notes",
    default_icon: {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  icons: {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  background: {
    service_worker: "background.js"
  },
  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'self'; connect-src 'self' https://livenote-ruddy.vercel.app https://*.googleapis.com https://*.firebaseapp.com wss://*.firebaseapp.com wss://firestore.googleapis.com https://firestore.googleapis.com https://www.gstatic.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://firebase.googleapis.com https://*.cloudfunctions.net wss://livenote-ruddy.vercel.app"
  },
  oauth2: {
    client_id: process.env.VITE_GOOGLE_CLIENT_ID,
    scopes: ["openid", "email", "profile"]
  },
  web_accessible_resources: [
    {
      resources: ["*"],
      matches: ["<all_urls>"]
    }
  ]
};

// Only include key if it's provided in environment variables
// For Chrome Web Store, the key should match the one registered in the store
// If updating an existing extension, use the key from Chrome Web Store dashboard
// If it's a new extension, you can omit the key (Chrome will assign one)
if (process.env.VITE_EXTENSION_KEY) {
  manifest.key = process.env.VITE_EXTENSION_KEY;
}

// Write manifest to public directory
const manifestPath = resolve(process.cwd(), 'public/manifest.json');
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

console.log('✅ Generated manifest.json with environment variables');
console.log(`📄 Client ID: ${process.env.VITE_GOOGLE_CLIENT_ID}`);
console.log(`🔑 Extension Key: ${process.env.VITE_EXTENSION_KEY?.substring(0, 20)}...`);