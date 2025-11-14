import React from 'react';
import { ExternalLink, Users, Eye, Lock } from 'lucide-react';
import type { SharedNote, NoteColor } from '../types';

const colorClasses: Record<NoteColor, string> = {
  yellow: 'bg-note-yellow border-yellow-300',
  blue: 'bg-note-blue border-blue-300',
  green: 'bg-note-green border-green-300',
  pink: 'bg-note-pink border-pink-300',
  purple: 'bg-note-purple border-purple-300',
  orange: 'bg-note-orange border-orange-300',
};

interface SharedNoteCardProps {
  sharedNote: SharedNote;
  animationDelay?: number;
}

const SharedNoteCard: React.FC<SharedNoteCardProps> = ({ sharedNote, animationDelay = 0 }) => {
  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  const handleOpenSharedNote = () => {
    // Use shareId to open the shared note view in the same tab
    const shareUrl = `${window.location.origin}/share/${sharedNote.shareId}`;
    window.location.href = shareUrl;
  };

  return (
    <div
      className={`
        relative p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md cursor-pointer
        ${colorClasses[sharedNote.color]}
        animate-fade-in
      `}
      style={{ animationDelay: `${animationDelay}s` }}
      onClick={handleOpenSharedNote}
    >
      {/* Header with share type and owner */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            {sharedNote.shareType === 'public' ? (
              <Eye className="h-4 w-4 text-green-600" />
            ) : (
              <Lock className="h-4 w-4 text-blue-600" />
            )}
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {sharedNote.shareType === 'public' ? 'Public' : 'Private'} • by {sharedNote.ownerName}
            </span>
          </div>
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleOpenSharedNote();
          }}
          className="p-1.5 hover:bg-white/50 dark:hover:bg-black/20 rounded-full transition-colors"
          title="Open shared note"
        >
          <ExternalLink className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Note content */}
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-900 dark:text-gray-800 leading-tight">
          {sharedNote.title || 'Untitled'}
        </h3>
        
        {sharedNote.description && (
          <p className="text-sm text-gray-700 dark:text-gray-700 leading-relaxed">
            {truncateText(sharedNote.description)}
          </p>
        )}
      </div>

      {/* Footer with metadata */}
      <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-500">
          <div className="flex items-center space-x-3">
            <span>
              Shared {new Date(sharedNote.createdAt).toLocaleDateString()}
            </span>
            {sharedNote.collaborators && sharedNote.collaborators.length > 0 && (
              <div className="flex items-center space-x-1">
                <Users className="h-3 w-3" />
                <span>{sharedNote.collaborators.length + 1} collaborators</span>
              </div>
            )}
          </div>
          
          {/* Collaborative editing indicator */}
          <div className="flex items-center space-x-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-blue-600 dark:text-blue-400 font-medium">Live</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedNoteCard;