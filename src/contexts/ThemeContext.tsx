import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { ThemeContextType } from '../types';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Load theme preference from chrome storage
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['isDarkMode'], (result: any) => {
        if (result.isDarkMode !== undefined) {
          setIsDarkMode(result.isDarkMode);
          updateThemeClass(result.isDarkMode);
        } else {
          // Default to system preference
          const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          setIsDarkMode(systemDark);
          updateThemeClass(systemDark);
        }
      });
    }
  }, []);

  const updateThemeClass = (dark: boolean) => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    updateThemeClass(newTheme);
    
    // Save to chrome storage
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ isDarkMode: newTheme });
    }

    // Send message to background script
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({
        type: 'THEME_CHANGE',
        payload: { isDarkMode: newTheme }
      });
    }
  };

  const value: ThemeContextType = {
    isDarkMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};