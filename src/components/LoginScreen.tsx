import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { StickyNote, Eye, EyeOff } from 'lucide-react';
import { getFirebaseErrorMessage } from '../utils/firebaseErrors';

const LoginScreen: React.FC = () => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, signInAsGuest, isLoading } = useAuth();
  const [error, setError] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    displayName?: string;
  }>({});
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [isExtensionContext, setIsExtensionContext] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: ''
  });

  // Detect if we're running in extension context
  useEffect(() => {
    const isExtension = window.location.protocol === 'chrome-extension:';
    setIsExtensionContext(isExtension);
  }, []);

  // Load remembered login details on mount
  useEffect(() => {
    try {
      const rememberedEmail = localStorage.getItem('rememberedEmail');
      const rememberedLoginMethod = localStorage.getItem('rememberedLoginMethod');
      
      if (rememberedEmail) {
        setFormData(prev => ({
          ...prev,
          email: rememberedEmail
        }));
        setRememberMe(true);
        
        // If Google was the last login method, we can show a hint
        if (rememberedLoginMethod === 'google') {
          console.log('📝 Last login was with Google');
        }
      }
    } catch (error) {
      console.error('Error loading remembered login:', error);
    }
  }, []);

  // Field validation functions
  const validateEmail = (email: string): string | null => {
    if (!email.trim()) {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return null;
  };

  const validatePassword = (password: string): string | null => {
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return null;
  };

  const validateDisplayName = (name: string): string | null => {
    if (!name.trim()) {
      return 'Name is required';
    }
    if (name.trim().length < 2) {
      return 'Name must be at least 2 characters';
    }
    return null;
  };

  const validateSignInForm = (): boolean => {
    const errors: typeof fieldErrors = {};
    
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    
    if (emailError) errors.email = emailError;
    if (passwordError) errors.password = passwordError;
    
    console.log('🔍 Validation errors found:', errors);
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateSignUpForm = (): boolean => {
    const errors: typeof fieldErrors = {};
    
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    const nameError = validateDisplayName(formData.displayName);
    
    if (emailError) errors.email = emailError;
    if (passwordError) errors.password = passwordError;
    if (nameError) errors.displayName = nameError;
    
    console.log('🔍 SignUp validation errors found:', errors);
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };



  const handleEmailSignIn = async () => {
    setError('');
    console.log('🔐 Starting email sign-in process...');
    
    // Validate form fields FIRST, before clearing anything
    const isValid = validateSignInForm();
    if (!isValid) {
      console.log('❌ Validation failed: Form has errors');
      return;
    }

    // Only clear field errors if validation passed
    setFieldErrors({});

    try {
      console.log('🔐 Signing in with email:', formData.email);
      await signInWithEmail(formData.email, formData.password);
      console.log('✅ Email authentication successful');
      
      // Save email if "Remember Me" is checked
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', formData.email);
        localStorage.setItem('rememberedLoginMethod', 'email');
        console.log('💾 Saved email for next login');
      } else {
        // Clear remembered data if unchecked
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberedLoginMethod');
      }
    } catch (err: any) {
      console.error('❌ Email login failed:', err);
      console.log('🔍 Error details:', { code: err?.code, message: err?.message });
      
      const errorMessage = getFirebaseErrorMessage(err);
      console.log('🚨 Error message shown to user:', errorMessage);
      
      // Show specific error message for login failures
      if (
        err?.code === 'auth/user-not-found' || 
        err?.code === 'auth/wrong-password' ||
        err?.code === 'auth/invalid-credential' ||
        errorMessage.includes('No account found') || 
        errorMessage.includes('Incorrect password') ||
        errorMessage.includes('Invalid email or password')
      ) {
        setError('❌ Login data is incorrect. Please check your email and password.');
      } else if (err?.code === 'auth/invalid-email') {
        setError('❌ Please enter a valid email address.');
      } else if (err?.code === 'auth/too-many-requests') {
        setError('❌ Too many failed attempts. Please try again later.');
      } else if (err?.code === 'auth/network-request-failed') {
        setError('❌ Network error. Please check your internet connection.');
      } else {
        setError(`❌ ${errorMessage}`);
      }
    }
  };

  const handleEmailSignUp = async () => {
    setError('');
    console.log('📝 Starting email sign-up process...');
    
    // Validate form fields FIRST, before clearing anything
    const isValid = validateSignUpForm();
    if (!isValid) {
      console.log('❌ Validation failed: Form has errors');
      return;
    }

    // Only clear field errors if validation passed
    setFieldErrors({});

    try {
      console.log('📝 Creating account for:', formData.email);
      await signUpWithEmail(formData.email, formData.password, formData.displayName);
      console.log('✅ Email signup successful');
    } catch (err: any) {
      console.error('❌ Email signup failed:', err);
      console.log('🔍 Signup error details:', { code: err?.code, message: err?.message });
      
      const errorMessage = getFirebaseErrorMessage(err);
      console.log('🚨 Error message shown to user:', errorMessage);
      
      // Show specific error messages for signup failures
      if (err?.code === 'auth/email-already-in-use') {
        setError('❌ An account with this email already exists. Please sign in instead.');
      } else if (err?.code === 'auth/weak-password') {
        setError('❌ Password is too weak. Please use at least 6 characters with numbers and letters.');
      } else if (err?.code === 'auth/invalid-email') {
        setError('❌ Please enter a valid email address.');
      } else if (err?.code === 'auth/operation-not-allowed') {
        setError('❌ Email signup is not enabled. Please contact support.');
      } else if (err?.code === 'auth/network-request-failed') {
        setError('❌ Network error. Please check your internet connection.');
      } else {
        setError(`❌ ${errorMessage}`);
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(''); // Clear general error when user starts typing
    
    // Clear field-specific error when user starts typing in that field
    setFieldErrors(prev => ({
      ...prev,
      [field]: undefined
    }));
  };

  const handleTabChange = (tab: 'signin' | 'signup') => {
    setActiveTab(tab);
    setError(''); // Clear error when switching tabs
    setFieldErrors({}); // Clear field errors when switching tabs
    setFormData({ // Reset form when switching tabs
      email: '',
      password: '',
      displayName: ''
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="bg-blue-600 dark:bg-blue-700 p-6 text-center rounded-t-lg">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 rounded-lg mb-3">
            <StickyNote className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white mb-1">Google Notes</h1>
          <p className="text-blue-100 text-sm">Your thoughts, organized beautifully</p>
        </div>

              <div className="p-6 space-y-6">
          {/* Google Sign In Button */}
          <button
            onClick={async () => {
              try {
                setError('');
                setFieldErrors({});
                await signInWithGoogle();
                
                // Save login method if "Remember Me" is checked
                if (rememberMe) {
                  localStorage.setItem('rememberedLoginMethod', 'google');
                  console.log('💾 Saved Google login method');
                } else {
                  localStorage.removeItem('rememberedLoginMethod');
                }
              } catch (err: any) {
                console.error('❌ Google login failed:', err);
                const errorMessage = getFirebaseErrorMessage(err);
                
                if (err?.code === 'auth/popup-closed-by-user') {
                  setError('❌ Sign-in was cancelled. Please try again.');
                } else if (err?.code === 'auth/popup-blocked') {
                  setError('❌ Popup blocked. Please allow popups and try again.');
                } else if (err?.code === 'auth/network-request-failed') {
                  setError('❌ Network error. Please check your internet connection.');
                } else {
                  setError(`❌ Google sign-in failed: ${errorMessage}`);
                }
              }
            }}
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-white mr-2"></div>
                Signing in...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                or continue with email
              </span>
            </div>
          </div>

          {/* Email Authentication Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-600">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                type="button"
                onClick={() => handleTabChange('signin')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'signin'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('signup')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'signup'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Sign Up
              </button>
            </nav>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            if (activeTab === 'signin') {
              handleEmailSignIn();
            } else {
              handleEmailSignUp();
            }
          }} className="mt-6 space-y-4">
            {activeTab === 'signup' && (
              <div>
                <label htmlFor="displayName" className="block text-left text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent ${
                    fieldErrors.displayName 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                  }`}
                  placeholder="Enter your full name"
                  disabled={isLoading}
                />
                {fieldErrors.displayName && (
                  <p className="text-red-600 dark:text-red-400 text-xs mt-1">
                    {fieldErrors.displayName}
                  </p>
                )}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-left text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent ${
                  fieldErrors.email 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                }`}
                placeholder="Enter your email address"
                disabled={isLoading}
              />
              {fieldErrors.email && (
                <p className="text-red-600 dark:text-red-400 text-xs mt-1 font-medium">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-left text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`w-full pl-3 pr-10 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent ${
                    fieldErrors.password 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                  }`}
                  placeholder={activeTab === 'signup' ? 'Create a password (6+ characters)' : 'Enter your password'}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-red-600 dark:text-red-400 text-xs mt-1 font-medium">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Remember Me checkbox - Only show for sign in */}
            {activeTab === 'signin' && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setRememberMe(checked);
                    
                    // Clear stored data if unchecked
                    if (!checked) {
                      localStorage.removeItem('rememberedEmail');
                      localStorage.removeItem('rememberedLoginMethod');
                      console.log('🗑️ Cleared remembered login data');
                    }
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700 dark:text-gray-300 text-left">
                  Remember me
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {activeTab === 'signin' ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                activeTab === 'signin' ? 'Sign in' : 'Create Account'
              )}
            </button>
          </form>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mt-4">
              <p className="text-red-800 dark:text-red-200 text-sm text-center">
                {error}
              </p>
            </div>
          )}

          {/* Guest Login */}
          <div className="mt-6 text-center">
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  or try without signing up
                </span>
              </div>
            </div>
            
            <button
              onClick={async () => {
                try {
                  setError('');
                  await signInAsGuest();
                } catch (err: any) {
                  console.error('❌ Guest login failed:', err);
                  setError('❌ Failed to start guest session. Please try again.');
                }
              }}
              disabled={isLoading}
              className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-gray-300 dark:border-gray-600"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                  Starting guest session...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd"/>
                  </svg>
                  Continue as Guest
                </>
              )}
            </button>
            
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-2">
              Notes will be saved locally. Sign in later to sync to cloud.
            </p>
          </div>

          {/* Web Version Link - Only show in extension context */}
          {isExtensionContext && (
            <div className="mt-6 text-center">
              <button
                onClick={() => window.open(import.meta.env.VITE_WEB_APP_URL || 'http://localhost:5174', '_blank')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium underline hover:no-underline transition-colors"
              >
                🌐 Access Web Version
              </button>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                Use Google Notes in your browser
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default LoginScreen;