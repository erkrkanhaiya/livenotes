// Firebase Auth Error Messages Utility
import type { AuthError } from 'firebase/auth';

export const getFirebaseErrorMessage = (error: any): string => {
  if (!error?.code) {
    return error?.message || 'An unexpected error occurred';
  }

  switch (error.code) {
    // Email/Password Sign In Errors
    case 'auth/user-not-found':
      return 'No account found with this email address';
    
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again';
    
    case 'auth/invalid-email':
      return 'Please enter a valid email address';
    
    case 'auth/user-disabled':
      return 'This account has been disabled';
    
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later';

    // Email/Password Sign Up Errors
    case 'auth/email-already-in-use':
      return 'An account with this email already exists';
    
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters';
    
    case 'auth/operation-not-allowed':
      return 'Email/password accounts are not enabled';

    // General Auth Errors
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection';
    
    case 'auth/invalid-credential':
      return 'Invalid email or password';
    
    case 'auth/credential-already-in-use':
      return 'This credential is already associated with another account';

    // Google Sign In Errors
    case 'auth/popup-closed-by-user':
      return 'Sign in was cancelled';
    
    case 'auth/popup-blocked':
      return 'Pop-up was blocked. Please allow pop-ups and try again';
    
    case 'auth/cancelled-popup-request':
      return 'Sign in was cancelled';

    // Chrome Extension Specific
    case 'auth/unauthorized-domain':
      return 'Authentication not configured for this domain';

    default:
      console.warn('Unhandled Firebase error code:', error.code);
      return error.message || 'Authentication failed. Please try again';
  }
};

export const isFirebaseError = (error: any): error is AuthError => {
  return error && typeof error.code === 'string' && error.code.startsWith('auth/');
};