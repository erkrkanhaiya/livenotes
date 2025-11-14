import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import type { AuthContextType, User as AppUser } from '../types';
import { analyticsService } from '../services/analyticsService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log(' Setting up Firebase auth listener');
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        console.log('✅ Firebase user authenticated:', firebaseUser.email);
        const appUser: AppUser = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'Anonymous User',
          photoURL: firebaseUser.photoURL || undefined,
          isGuest: false,
        };
        setUser(appUser);
      } else {
        console.log('❌ No Firebase user found, checking for guest user');
        // Check if there's a guest user session
        const guestUser = getGuestUser();
        if (guestUser) {
          setUser(guestUser);
        } else {
          setUser(null);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getGuestUser = (): AppUser | null => {
    try {
      const guestData = localStorage.getItem('guestUser');
      if (guestData) {
        return JSON.parse(guestData) as AppUser;
      }
    } catch (error) {
      console.error('Error getting guest user:', error);
    }
    return null;
  };

  const createGuestUser = (): AppUser => {
    const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const guestUser: AppUser = {
      id: guestId,
      email: 'guest@local.com',
      displayName: 'Guest User',
      isGuest: true,
    };
    
    localStorage.setItem('guestUser', JSON.stringify(guestUser));
    return guestUser;
  };

  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      
      // Use Chrome Identity API for extensions, regular popup for web
      if (typeof chrome !== 'undefined' && chrome.identity && !window.location.protocol.startsWith('http')) {
        console.log('Using Chrome Identity API for authentication');
        
        await new Promise<void>((resolve, reject) => {
          chrome.identity.getAuthToken({ interactive: true }, async (token) => {
            if (chrome.runtime.lastError || !token) {
              console.error('Chrome Identity API error:', chrome.runtime.lastError);
              reject(new Error(chrome.runtime.lastError?.message || 'Authentication failed'));
              return;
            }
            
            try {
              console.log('Got auth token, signing in with Firebase...');
              const { GoogleAuthProvider, signInWithCredential } = await import('firebase/auth');
              const credential = GoogleAuthProvider.credential(null, token);
              await signInWithCredential(auth, credential);
              console.log('Firebase authentication successful');
              analyticsService.trackLogin('google_chrome_identity');
              resolve();
            } catch (error) {
              console.error('Firebase authentication error:', error);
              reject(error);
            }
          });
        });
      } else {
        // Fallback to Firebase popup (for development)
        console.log('Falling back to Firebase popup authentication');
        await signInWithPopup(auth, googleProvider);
        analyticsService.trackLogin('google_popup');
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log('🔐 Signing in with email in Chrome Extension:', email);
      
      // For Chrome extensions, we need to handle auth differently
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        console.log('📱 Chrome Extension environment detected');
        
        // Set persistence to LOCAL for extensions
        await setPersistence(auth, browserLocalPersistence);
        console.log('✅ Auth persistence set to LOCAL');
      }
      
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Email authentication successful:', result.user.email);
      analyticsService.trackLogin('email');
    } catch (error) {
      console.error('❌ Error signing in with email:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    try {
      setIsLoading(true);
      console.log('📝 Creating account with email in Chrome Extension:', email);
      
      // For Chrome extensions, we need to handle auth differently
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        console.log('📱 Chrome Extension environment detected for signup');
        
        // Set persistence to LOCAL for extensions
        await setPersistence(auth, browserLocalPersistence);
        console.log('✅ Auth persistence set to LOCAL for signup');
      }
      
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('✅ User account created successfully:', userCredential.user.email);
      
      // Update profile with display name
      await updateProfile(userCredential.user, {
        displayName: displayName
      });
      console.log('✅ Profile updated with display name:', displayName);
      
      analyticsService.trackSignUp('email');
    } catch (error) {
      console.error('❌ Error creating account:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInAsGuest = async () => {
    try {
      setIsLoading(true);
      console.log('👤 Creating guest user session');
      
      const guestUser = createGuestUser();
      setUser(guestUser);
      
      console.log('✅ Guest user created:', guestUser.displayName);
      analyticsService.trackSignUp('guest');
    } catch (error) {
      console.error('❌ Error creating guest session:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      
      // Clear guest user data
      localStorage.removeItem('guestUser');
      
      // Sign out from Firebase if authenticated
      await firebaseSignOut(auth);
      
      setUser(null);
      console.log('✅ Successfully signed out');
    } catch (error) {
      console.warn('Sign out cleanup error:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signInAsGuest,
    signOut,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};