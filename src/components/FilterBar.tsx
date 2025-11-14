import React from 'react';
import { useNotes } from '../contexts/NotesContext';
import type { NoteColor } from '../types';

const colorMap: Record<NoteColor | 'all', { bg: string; border: string; label: string }> = {
  all: { bg: 'bg-gray-100 dark:bg-gray-700', border: 'border-gray-300 dark:border-gray-600', label: 'All' },
  yellow: { bg: 'bg-note-yellow', border: 'border-yellow-300', label: 'Yellow' },
  blue: { bg: 'bg-note-blue', border: 'border-blue-300', label: 'Blue' },
  green: { bg: 'bg-note-green', border: 'border-green-300', label: 'Green' },
  pink: { bg: 'bg-note-pink', border: 'border-pink-300', label: 'Pink' },
  purple: { bg: 'bg-note-purple', border: 'border-purple-300', label: 'Purple' },
  orange: { bg: 'bg-note-orange', border: 'border-orange-300', label: 'Orange' },
};

const FilterBar: React.FC = () => {
  const { filterColor, setFilterColor } = useNotes();
  const isExtension = typeof chrome !== 'undefined' && chrome.runtime && !window.location.protocol.startsWith('http');

  return (
    <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
      <span className={`${isExtension ? 'text-[10px]' : 'text-xs'} text-gray-500 dark:text-gray-400 whitespace-nowrap mr-1`}>
        Filter:
      </span>
      {(Object.keys(colorMap) as (NoteColor | 'all')[]).map((color) => {
        const config = colorMap[color];
        const isSelected = filterColor === color;
        
        return (
          <button
            key={color}
            onClick={() => setFilterColor(color)}
            className={`
              ${isExtension ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'} rounded-full font-semibold whitespace-nowrap transition-all
              ${isSelected 
                ? `${config.bg} ${config.border} border-2 text-gray-800 dark:text-gray-200` 
                : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }
            `}
          >
            {config.label}
          </button>
        );
      })}
    </div>
  );
};

export default FilterBar;