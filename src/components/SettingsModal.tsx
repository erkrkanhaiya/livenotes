import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { X, LogOut, Moon, Sun, Info, Github, ExternalLink } from 'lucide-react';
import { getHighQualityProfileImage, getProfileInitials } from '../utils/profileUtils';

interface SettingsModalProps {
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { user, signOut } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  const handleSignOut = async () => {
    try {
      await signOut();
      onClose();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md bg-white dark:bg-dark-card rounded-lg shadow-xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            <X className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* User Info */}
          <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center overflow-hidden">
              {getHighQualityProfileImage(user?.photoURL) ? (
                <img
                  src={getHighQualityProfileImage(user?.photoURL)!}
                  alt="Profile"
                  className="w-12 h-12 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = `<span class="text-white text-sm font-medium">${getProfileInitials(user?.displayName)}</span>`;
                  }}
                />
              ) : (
                <span className="text-white text-sm font-medium">
                  {getProfileInitials(user?.displayName)}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-800 dark:text-white">
                {user?.displayName || 'Anonymous User'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user?.email}
              </p>
            </div>
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <div className="flex items-center space-x-3">
              {isDarkMode ? (
                <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <Sun className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              )}
              <span className="text-gray-800 dark:text-white">
                {isDarkMode ? 'Dark Mode' : 'Light Mode'}
              </span>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isDarkMode ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isDarkMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Web Version - Only show in extension mode */}
          {!window.location.protocol.startsWith('http') && (
            <button 
              onClick={() => window.open(import.meta.env.VITE_WEB_APP_URL || 'https://livenote-ruddy.vercel.app', '_blank')}
              className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors text-left"
            >
              <ExternalLink className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <div>
                <span className="text-gray-800 dark:text-white">Web Version</span>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Open Live Notes in browser
                </p>
              </div>
            </button>
          )}

          {/* About */}
          <button className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors text-left">
            <Info className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <div>
              <span className="text-gray-800 dark:text-white">About</span>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Live Notes Extension v1.0.0
              </p>
            </div>
          </button>

          {/* GitHub */}
          <button className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors text-left">
            <Github className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <div>
              <span className="text-gray-800 dark:text-white">Source Code</span>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                View on GitHub
              </p>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-600 space-y-3">
          {user?.isGuest && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Sign in to sync your notes
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                    Your notes are currently saved locally only
                  </p>
                </div>
                <button
                  onClick={() => {
                    // Redirect to sign in by signing out (which will show login screen)
                    handleSignOut();
                  }}
                  className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-md font-medium transition-colors"
                >
                  Sign In
                </button>
              </div>
            </div>
          )}
          
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>{user?.isGuest ? 'Exit Guest Mode' : 'Sign Out'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;