// Environment configuration
export const config = {
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || ''
  },
  google: {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
  },
  extension: {
    key: import.meta.env.VITE_EXTENSION_KEY || ''
  },
  web: {
    appUrl: import.meta.env.VITE_WEB_APP_URL || ''
  }
};

// Validate required environment variables
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN', 
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_GOOGLE_CLIENT_ID'
];

const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName] || import.meta.env[varName] === '');

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars);
  console.error('Please check your .env file and ensure all variables are set.');
  console.error('Current Firebase config:', {
    apiKey: config.firebase.apiKey ? '✅ Set' : '❌ Missing',
    authDomain: config.firebase.authDomain ? '✅ Set' : '❌ Missing',
    projectId: config.firebase.projectId ? '✅ Set' : '❌ Missing',
    storageBucket: config.firebase.storageBucket ? '✅ Set' : '❌ Missing',
    messagingSenderId: config.firebase.messagingSenderId ? '✅ Set' : '❌ Missing',
    appId: config.firebase.appId ? '✅ Set' : '❌ Missing',
  });
} else {
  console.log('✅ All required Firebase environment variables are set');
  console.log('🔑 Firebase Project ID:', config.firebase.projectId);
  console.log('🌐 Firebase Auth Domain:', config.firebase.authDomain);
  if (config.web.appUrl) {
    console.log('🌐 Web App URL:', config.web.appUrl);
  } else {
    console.log('ℹ️ Web App URL not set (using default: https://livenote-ruddy.vercel.app)');
  }
}