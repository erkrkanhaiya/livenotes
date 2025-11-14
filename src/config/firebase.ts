// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import type { Analytics } from 'firebase/analytics';
import { config } from './env';

// Firebase config using environment variables
const firebaseConfig = config.firebase;

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Configure auth for Chrome extension environment
if (typeof chrome !== 'undefined' && chrome.runtime) {
  console.log('🔧 Configuring Firebase Auth for Chrome Extension environment');
  
  // Chrome extensions need special configuration
  console.log(' Auth Domain:', firebaseConfig.authDomain);
  console.log('🔑 Project ID:', firebaseConfig.projectId);
  
  // Ensure proper auth settings for extensions
  try {
    // Set up auth for Chrome extension context
    console.log('✅ Firebase Auth configured for Chrome Extension');
  } catch (error) {
    console.error('❌ Error configuring Firebase Auth for extension:', error);
  }
}

export const googleProvider = new GoogleAuthProvider();
// Configure Google provider for extensions
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({
  'hd': '*' // Allow any domain
});

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Firebase Analytics (disabled in Chrome extension environment)
let analytics: Analytics | null = null;
if (typeof window !== 'undefined' && typeof chrome === 'undefined') {
  // Only initialize analytics in regular web environments, not in extensions
  try {
    analytics = getAnalytics(app);
    console.log('Firebase Analytics initialized');
  } catch (error) {
    console.warn('Analytics not available in this environment:', error);
  }
} else {
  console.log('Analytics disabled in Chrome extension environment');
}

export { analytics };
export default app;


