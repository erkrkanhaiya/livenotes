import React from 'react';
import { useNotes } from '../contexts/NotesContext';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onMenuClick, showMenuButton = false }) => {
  const { searchQuery, setSearchQuery } = useNotes();
  const isExtension = typeof chrome !== 'undefined' && chrome.runtime && !window.location.protocol.startsWith('http');

  const handleClear = () => {
    setSearchQuery('');
  };

  return (
    <div className="relative">
      <div className="relative flex items-center">
        {/* Hamburger Menu Button - Only in extension when showMenuButton is true */}
        {isExtension && showMenuButton && onMenuClick && (
          <button
            onClick={onMenuClick}
            className={`${isExtension ? 'mr-1.5 p-1' : 'mr-2 p-1.5'} flex-shrink-0 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors`}
            title="Toggle groups"
          >
            <svg className={`${isExtension ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        
        <div className="relative flex-1">
          <Search className={`absolute ${isExtension ? 'left-1.5 top-1/2 h-3 w-3' : 'left-3 top-1/2 h-4 w-4'} transform -translate-y-1/2 text-gray-400`} />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full ${isExtension ? 'pl-7 pr-7 py-1 text-xs' : 'pl-10 pr-10 py-2 text-sm'} border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-card text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          />
          {searchQuery && (
            <button
              onClick={handleClear}
              className={`absolute ${isExtension ? 'right-1.5 top-1/2' : 'right-3 top-1/2'} transform -translate-y-1/2 p-0.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full transition-colors`}
            >
              <X className={`${isExtension ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5'} text-gray-400`} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchBar;