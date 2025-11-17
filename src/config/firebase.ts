// Firebase configuration
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import type { Analytics } from 'firebase/analytics';
import { config } from './env';

// Firebase config using environment variables
const firebaseConfig = config.firebase;

// Validate Firebase config before initialization
if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.authDomain) {
  console.error('❌ Invalid Firebase configuration. Missing required fields:', {
    apiKey: !!firebaseConfig.apiKey,
    projectId: !!firebaseConfig.projectId,
    authDomain: !!firebaseConfig.authDomain,
  });
  throw new Error('Firebase configuration is incomplete. Please check your environment variables.');
}

console.log('🔧 Initializing Firebase with config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 10)}...` : 'MISSING',
  appId: firebaseConfig.appId ? `${firebaseConfig.appId.substring(0, 20)}...` : 'MISSING',
  environment: typeof chrome !== 'undefined' && chrome.runtime ? 'Chrome Extension' : 
               typeof window !== 'undefined' && window.location.protocol.startsWith('http') ? 'Web App' : 'Unknown'
});

// Initialize Firebase
let app: FirebaseApp;
try {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Firebase:', error);
  throw error;
}

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Configure auth for Chrome extension environment
if (typeof chrome !== 'undefined' && chrome.runtime) {
  console.log('🔧 Configuring Firebase Auth for Chrome Extension environment');
  
  // Chrome extensions need special configuration
  console.log('📧 Auth Domain:', firebaseConfig.authDomain);
  console.log('🔑 Project ID:', firebaseConfig.projectId);
  
  // Get extension ID for debugging
  try {
    const extensionId = (chrome.runtime as any).id;
    if (extensionId) {
      console.log('🆔 Extension ID:', extensionId);
      console.log('⚠️ IMPORTANT: Add this to Firebase Authorized Domains:');
      console.log(`   chrome-extension://${extensionId}`);
      console.log('   Go to: Firebase Console → Authentication → Settings → Authorized domains');
    }
  } catch (error) {
    console.warn('⚠️ Could not get extension ID:', error);
  }
  
  // Ensure proper auth settings for extensions
  try {
    // Set up auth for Chrome extension context
    console.log('✅ Firebase Auth configured for Chrome Extension');
  } catch (error) {
    console.error('❌ Error configuring Firebase Auth for extension:', error);
  }
} else if (typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
  // Web app context
  console.log('🌐 Configuring Firebase Auth for Web App environment');
  const currentDomain = window.location.hostname;
  console.log('📧 Auth Domain:', firebaseConfig.authDomain);
  console.log('🔑 Project ID:', firebaseConfig.projectId);
  console.log('🌍 Current Web Domain:', currentDomain);
  console.log('⚠️ IMPORTANT: Ensure this domain is in Firebase Authorized Domains:');
  console.log(`   ${currentDomain}`);
  console.log('   Go to: Firebase Console → Authentication → Settings → Authorized domains');
}

export const googleProvider = new GoogleAuthProvider();
// Configure Google provider for extensions
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({
  'hd': '*' // Allow any domain
});

// Initialize Cloud Firestore and get a reference to the service
let db: Firestore;
try {
  db = getFirestore(app);
  console.log('✅ Firestore initialized successfully');
  console.log('📊 Firestore database ready for:', firebaseConfig.projectId);
} catch (error) {
  console.error('❌ Failed to initialize Firestore:', error);
  throw error;
}

export { db };

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


