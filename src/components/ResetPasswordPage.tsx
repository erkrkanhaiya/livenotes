import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAuth, confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { collection, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getFirebaseErrorMessage } from '../utils/firebaseErrors';
import { Lock, CheckCircle, XCircle } from 'lucide-react';

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [actionCode, setActionCode] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState<string>('');

  useEffect(() => {
    // Extract action code from URL
    const code = searchParams.get('oobCode') || searchParams.get('code');
    const emailParam = searchParams.get('email');
    
    if (code) {
      setActionCode(code);
      if (emailParam) {
        setEmail(emailParam);
      }
      verifyActionCode(code);
    } else {
      setError('Invalid reset link. Please request a new password reset.');
      setIsVerifying(false);
    }
  }, [searchParams]);

  const verifyActionCode = async (code: string) => {
    try {
      setIsVerifying(true);
      const auth = getAuth();
      
      // Verify the action code and get the email
      const emailFromCode = await verifyPasswordResetCode(auth, code);
      setVerifiedEmail(emailFromCode);
      setEmail(emailFromCode);
      
      // Try to retrieve stored password from Firestore (from OTP flow)
      try {
        const requestRef = doc(collection(db, 'passwordResetRequests'), emailFromCode);
        const requestDoc = await getDoc(requestRef);
        
        if (requestDoc.exists()) {
          const data = requestDoc.data();
          const storedPassword = data.newPassword as string;
          const expiresAt = data.expiresAt as string;
          
          // Check if request is still valid (not expired)
          if (expiresAt && new Date(expiresAt) > new Date() && storedPassword) {
            setNewPassword(storedPassword);
            console.log('Retrieved stored password from OTP flow');
          }
        }
      } catch (e) {
        console.log('Could not retrieve stored password (not critical):', e);
      }
      
      setIsVerifying(false);
    } catch (e: any) {
      console.error('Error verifying action code:', e);
      setError('Invalid or expired reset link. Please request a new password reset.');
      setIsVerifying(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword) {
      setError('Please enter a new password');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!actionCode) {
      setError('Invalid reset link');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const auth = getAuth();
      
      // Confirm password reset with the action code
      await confirmPasswordReset(auth, actionCode, newPassword);
      
      // Clean up: Delete the password reset request from Firestore after successful reset
      try {
        const emailValue = email || verifiedEmail;
        if (emailValue) {
          const requestRef = doc(collection(db, 'passwordResetRequests'), emailValue);
          const requestDoc = await getDoc(requestRef);
          
          if (requestDoc.exists()) {
            // Delete the request after successful reset
            await deleteDoc(requestRef);
            console.log('Cleaned up password reset request from Firestore');
          }
        }
      } catch (e) {
        console.log('Could not clean up Firestore request (not critical):', e);
      }

      setSuccess(true);
      setIsLoading(false);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (e: any) {
      console.error('Error resetting password:', e);
      const errorMessage = getFirebaseErrorMessage(e);
      
      if (e.code === 'auth/expired-action-code') {
        setError('This reset link has expired. Please request a new password reset.');
      } else if (e.code === 'auth/invalid-action-code') {
        setError('Invalid reset link. Please request a new password reset.');
      } else {
        setError('Failed to reset password: ' + (errorMessage || e.message || 'Unknown error'));
      }
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 dark:text-gray-300">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Password Reset Successful!</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your password has been reset successfully. You can now sign in with your new password.
            </p>
            <button
              onClick={() => navigate('/')}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="bg-blue-600 dark:bg-blue-700 p-6 text-center rounded-t-lg">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 rounded-lg mb-3">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white mb-1">Reset Password</h1>
          <p className="text-blue-100 text-sm">Enter your new password</p>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <div className="flex items-center">
                <XCircle className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
              </div>
            </div>
          )}

          {email && (
            <div>
              <label className="block text-left text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
              />
            </div>
          )}

          <div>
            <label htmlFor="newPassword" className="block text-left text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter new password (min 6 characters)"
                disabled={isLoading}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetPassword}
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Resetting Password...
              </>
            ) : (
              'Reset Password'
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;

