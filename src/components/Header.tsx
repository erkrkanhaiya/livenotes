import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Moon, Sun, ExternalLink, LogOut, Info, Github, ChevronDown } from 'lucide-react';
import { getHighQualityProfileImage, getProfileInitials } from '../utils/profileUtils';
import NotificationCenter from './NotificationCenter';
import reactLogo from '../assets/react.svg';

interface HeaderProps {
  onSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSettings }) => {
  const { user, signOut } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowUserMenu(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isExtension = typeof chrome !== 'undefined' && chrome.runtime && !window.location.protocol.startsWith('http');

  return (
    <header className={`flex items-center justify-between ${isExtension ? 'px-2.5 py-1.5' : 'px-4 sm:px-6 py-3 sm:py-4'} border-b border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card shrink-0 relative z-40`}>
      <div className="flex items-center min-w-0 flex-1">
        <div className={`${isExtension ? 'w-6 h-6' : 'w-8 h-8'} rounded-lg flex items-center justify-center ${isExtension ? 'mr-2' : 'mr-3'} shrink-0 overflow-hidden`}>
          <img src={reactLogo} alt="Live Notes" className={`${isExtension ? 'w-6 h-6' : 'w-8 h-8'} object-contain`} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className={`${isExtension ? 'text-base' : 'text-lg'} font-bold text-gray-800 dark:text-white truncate`}>
            Live Notes
          </h1>
          <p className={`${isExtension ? 'text-[10px]' : 'text-xs'} text-gray-500 dark:text-gray-400 truncate`}>
            {user?.displayName || 'User'}
            {user?.isGuest && (
              <span className="ml-1 px-1 py-0.5 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded text-[10px] font-medium">
                Guest
              </span>
            )}
          </p>
        </div>
      </div>

      <div className={`flex items-center ${isExtension ? 'space-x-1.5' : 'space-x-2'} shrink-0`}>
        {/* Community Notifications */}
        <NotificationCenter />

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`flex items-center ${isExtension ? 'space-x-1 p-0.5' : 'space-x-2 p-1'} hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors`}
            title="User Menu"
          >
            <div className={`${isExtension ? 'w-7 h-7' : 'w-8 h-8'} bg-blue-500 rounded-full flex items-center justify-center overflow-hidden shrink-0`}>
              {getHighQualityProfileImage(user?.photoURL) ? (
                <img
                  src={getHighQualityProfileImage(user?.photoURL)!}
                  alt="Profile"
                  className={`${isExtension ? 'w-7 h-7' : 'w-8 h-8'} rounded-full object-cover`}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = `<span class="text-white ${isExtension ? 'text-[10px]' : 'text-xs'} font-medium">${getProfileInitials(user?.displayName)}</span>`;
                  }}
                />
              ) : (
                <span className={`text-white ${isExtension ? 'text-[10px]' : 'text-xs'} font-medium`}>
                  {getProfileInitials(user?.displayName)}
                </span>
              )}
            </div>
            {!isExtension && (
              <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            )}
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-dark-card rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-50">
              {/* User Info */}
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center overflow-hidden">
                    {getHighQualityProfileImage(user?.photoURL) ? (
                      <img
                        src={getHighQualityProfileImage(user?.photoURL)!}
                        alt="Profile"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-sm font-medium">
                        {getProfileInitials(user?.displayName)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800 dark:text-white truncate">
                      {user?.displayName || 'User'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {user?.email}
                      {user?.isGuest && (
                        <span className="ml-1 px-1 py-0.5 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded text-xs">
                          Guest
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu Options */}
              <div className="py-1">
                {/* Theme Toggle */}
                <button
                  onClick={() => {
                    toggleTheme();
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {isDarkMode ? (
                    <Sun className="h-4 w-4 mr-3 text-gray-500" />
                  ) : (
                    <Moon className="h-4 w-4 mr-3 text-gray-500" />
                  )}
                  {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </button>

                {/* Settings */}
                <button
                  onClick={() => {
                    onSettings();
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Info className="h-4 w-4 mr-3 text-gray-500" />
                  About & Settings
                </button>

                {/* Web Version (only in extension) */}
                {typeof chrome !== 'undefined' && chrome.runtime && !window.location.protocol.startsWith('http') && (
                  <button
                    onClick={() => {
                      window.open(import.meta.env.VITE_WEB_APP_URL || 'https://livenote-ruddy.vercel.app', '_blank');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 mr-3 text-gray-500" />
                    Open Web Version
                  </button>
                )}

                {/* GitHub */}
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowUserMenu(false)}
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Github className="h-4 w-4 mr-3 text-gray-500" />
                  GitHub Repository
                </a>

                <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>

                {/* Sign Out */}
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;