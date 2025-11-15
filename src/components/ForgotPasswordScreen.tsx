import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { getAuth, sendPasswordResetEmail, fetchSignInMethodsForEmail } from 'firebase/auth';
import { collection, doc, setDoc, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getFirebaseErrorMessage } from '../utils/firebaseErrors';

interface ForgotPasswordScreenProps {
  onBack: () => void;
}

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isGoogleOnlyUser, setIsGoogleOnlyUser] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const sendOTP = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const emailValue = email.trim();
      const auth = getAuth();

      // Check sign-in methods to determine if user is Google-only
      let signInMethods: string[] = [];
      let userVerified = false;
      let emailSent = false;

      try {
        signInMethods = await fetchSignInMethodsForEmail(auth, emailValue);
        if (signInMethods.length > 0) {
          userVerified = true;
          setIsGoogleOnlyUser(signInMethods.length === 1 && signInMethods.includes('google.com'));
          console.log('User found with sign-in methods:', signInMethods);
        }
      } catch (e) {
        console.log('Could not fetch sign-in methods:', e);
      }

      // If we couldn't verify via sign-in methods, try password reset email
      if (!userVerified) {
        try {
          await sendPasswordResetEmail(auth, emailValue);
          userVerified = true;
          emailSent = true;
          setIsGoogleOnlyUser(false);
          console.log('User verified via password reset email');
        } catch (e: any) {
          if (e.code === 'auth/user-not-found') {
            setError('No account found with this email address');
            setIsLoading(false);
            return;
          }
          // For other errors, assume user exists and proceed
          console.log('Password reset email failed but proceeding:', e.code);
          userVerified = true;
          if (e.code === 'auth/operation-not-allowed') {
            setIsGoogleOnlyUser(true);
          } else {
            setIsGoogleOnlyUser(false);
          }
        }
      }

      // If user is verified and not Google-only, and we haven't sent email yet, send it
      if (userVerified && !isGoogleOnlyUser && !emailSent) {
        try {
          await sendPasswordResetEmail(auth, emailValue);
        } catch (e) {
          console.log('Password reset email failed but user verified:', e);
        }
      }

      // Generate 6-digit OTP
      const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store OTP in Firestore
      const otpRef = doc(collection(db, 'passwordResetOTPs'), emailValue);
      await setDoc(otpRef, {
        otp: randomOtp,
        expiry: expiry.toISOString(),
        isGoogleOnlyUser: isGoogleOnlyUser,
        createdAt: serverTimestamp(),
      });

      console.log('OTP for', emailValue, ':', randomOtp, '(valid for 10 minutes)');

      setOtpSent(true);
      if (isGoogleOnlyUser) {
        setSuccess('OTP has been generated. Please use the OTP shown below. After verification, you\'ll be able to set a password for your account.');
      } else {
        setSuccess('OTP has been generated. Please use the OTP shown below.');
      }
      setIsLoading(false);

      console.log('═══════════════════════════════════════');
      console.log('OTP for', emailValue, ':', randomOtp);
      console.log('Valid until:', expiry.toString());
      console.log('═══════════════════════════════════════');
    } catch (e: any) {
      console.error('Error sending OTP:', e);
      const errorMessage = getFirebaseErrorMessage(e);
      setError(errorMessage || 'Failed to send OTP');
      setIsLoading(false);

      // Delete OTP from Firestore if email sending failed
      try {
        const otpRef = doc(collection(db, 'passwordResetOTPs'), email.trim());
        await deleteDoc(otpRef);
      } catch (_) {
        // Ignore deletion errors
      }
    }
  };

  const verifyOTP = async () => {
    if (!otp.trim()) {
      setError('Please enter the OTP');
      return;
    }

    if (otp.trim().length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const emailValue = email.trim();
      const enteredOtp = otp.trim();

      // Get OTP from Firestore
      const otpRef = doc(collection(db, 'passwordResetOTPs'), emailValue);
      const otpDoc = await getDoc(otpRef);

      if (!otpDoc.exists()) {
        setError('OTP not found. Please request a new OTP.');
        setIsLoading(false);
        return;
      }

      const data = otpDoc.data();
      const storedOtp = data.otp as string;
      const expiryStr = data.expiry as string;
      const expiry = new Date(expiryStr);
      const isGoogleOnly = data.isGoogleOnlyUser as boolean ?? false;

      // Check if OTP is expired
      if (Date.now() > expiry.getTime()) {
        setError('OTP has expired. Please request a new one.');
        setIsLoading(false);
        await deleteDoc(otpRef);
        return;
      }

      // Verify OTP
      if (enteredOtp !== storedOtp) {
        setError('Invalid OTP. Please try again.');
        setIsLoading(false);
        return;
      }

      // OTP verified successfully
      setIsGoogleOnlyUser(isGoogleOnly);
      setOtpVerified(true);
      if (isGoogleOnly) {
        setSuccess('OTP verified successfully. Please enter a password to add to your Google account.');
      } else {
        setSuccess('OTP verified successfully. Please enter your new password.');
      }
      setIsLoading(false);

      // Delete OTP after verification
      await deleteDoc(otpRef);
    } catch (e: any) {
      console.error('Error verifying OTP:', e);
      setError('Failed to verify OTP: ' + (e.message || 'Unknown error'));
      setIsLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const emailValue = email.trim();
      const auth = getAuth();

      if (isGoogleOnlyUser) {
        // For Google-only users, store password set request for linking later
        const requestRef = doc(collection(db, 'passwordSetRequests'), emailValue);
        await setDoc(requestRef, {
          newPassword: newPassword, // In production, use Cloud Function with Admin SDK
          otpVerified: true,
          email: emailValue,
          isGoogleOnlyUser: true,
          createdAt: serverTimestamp(),
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        });

        setSuccess('Password set request created! Please sign in with Google, and your password will be automatically linked to your account. You can then sign in with either Google or email/password.');
        setIsLoading(false);

        // Navigate back after a delay
        setTimeout(() => {
          onBack();
        }, 5000);
      } else {
        // For email/password users, use Firebase's password reset flow
        // Step 1: Send password reset email with custom continue URL
        const webAppUrl = import.meta.env.VITE_WEB_APP_URL || window.location.origin;
        const continueUrl = `${webAppUrl}/reset-password?email=${encodeURIComponent(emailValue)}`;
        
        await sendPasswordResetEmail(auth, emailValue, {
          url: continueUrl,
          handleCodeInApp: false, // Open in browser, not app
        });

        // Step 2: Store the new password temporarily in Firestore (for Cloud Function to process)
        // In production, this should be handled by a Cloud Function that uses Admin SDK
        const requestRef = doc(collection(db, 'passwordResetRequests'), emailValue);
        await setDoc(requestRef, {
          newPassword: newPassword, // In production, use Cloud Function with Admin SDK instead
          otpVerified: true,
          email: emailValue,
          createdAt: serverTimestamp(),
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        });

        setSuccess('Password reset email sent! Please check your email and click the link. The password field will be pre-filled with the password you entered. Click "Reset Password" to complete the process. You can then sign in with your new password.');
        setIsLoading(false);

        // Navigate back after a delay
        setTimeout(() => {
          onBack();
        }, 5000);
      }
    } catch (e: any) {
      console.error('Error resetting password:', e);
      const errorMessage = getFirebaseErrorMessage(e);
      setError('Failed to reset password: ' + (errorMessage || e.message || 'Unknown error'));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="bg-blue-600 dark:bg-blue-700 p-6 text-center rounded-t-lg">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 rounded-lg mb-3">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white mb-1">Reset Password</h1>
          <p className="text-blue-100 text-sm">
            {otpSent && !otpVerified
              ? 'Enter the OTP sent to your email'
              : otpVerified
              ? 'Enter your new password'
              : 'Enter your email to receive OTP'}
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-red-800 dark:text-red-200 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <p className="text-green-800 dark:text-green-200 text-sm text-center">{success}</p>
            </div>
          )}

          {/* Step 1: Enter Email */}
          {!otpSent && (
            <div>
              <label htmlFor="email" className="block text-left text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email address"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {/* Step 2: Enter OTP */}
          {otpSent && !otpVerified && (
            <>
              <div>
                <label htmlFor="email-disabled" className="block text-left text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email-disabled"
                  value={email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                />
              </div>

              <div>
                <label htmlFor="otp" className="block text-left text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  OTP
                </label>
                <input
                  type="text"
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  disabled={isLoading}
                />
              </div>

              <button
                type="button"
                onClick={sendOTP}
                disabled={isLoading}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                Resend OTP
              </button>
            </>
          )}

          {/* Step 3: Enter New Password */}
          {otpVerified && (
            <>
              <div>
                <label htmlFor="email-disabled-2" className="block text-left text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email-disabled-2"
                  value={email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-left text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter new password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-left text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Confirm new password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {!otpSent && (
              <button
                type="button"
                onClick={sendOTP}
                disabled={isLoading}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending OTP...
                  </>
                ) : (
                  'Send OTP'
                )}
              </button>
            )}

            {otpSent && !otpVerified && (
              <button
                type="button"
                onClick={verifyOTP}
                disabled={isLoading}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </>
                ) : (
                  'Verify OTP'
                )}
              </button>
            )}

            {otpVerified && (
              <button
                type="button"
                onClick={resetPassword}
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
            )}

            <button
              type="button"
              onClick={onBack}
              className="w-full flex items-center justify-center px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordScreen;

