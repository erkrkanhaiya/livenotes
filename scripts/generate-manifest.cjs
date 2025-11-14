#!/usr/bin/env node

const { writeFileSync } = require('fs');
const { resolve } = require('path');
const { config } = require('dotenv');

// Load environment variables
config();

// Generate manifest.json with environment variables
const manifest = {
  manifest_version: 3,
  name: "Google Notes Extension",
  description: "A smart note-taking extension with Google authentication, cloud sync, and modern UI",
  version: "1.0.0",
  key: process.env.VITE_EXTENSION_KEY,
  permissions: [
    "storage",
    "identity",
    "activeTab",
    "tabs"
  ],
  host_permissions: [
    "http://localhost:*/*",
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
    default_title: "Google Notes"
  },
  background: {
    service_worker: "background.js"
  },
  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'self'; connect-src 'self' http://localhost:* https://*.googleapis.com https://*.firebaseapp.com wss://*.firebaseapp.com https://www.gstatic.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://firebase.googleapis.com https://*.cloudfunctions.net"
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

// Write manifest to public directory
const manifestPath = resolve(process.cwd(), 'public/manifest.json');
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

console.log('✅ Generated manifest.json with environment variables');
console.log(`📄 Client ID: ${process.env.VITE_GOOGLE_CLIENT_ID}`);
console.log(`🔑 Extension Key: ${process.env.VITE_EXTENSION_KEY?.substring(0, 20)}...`);