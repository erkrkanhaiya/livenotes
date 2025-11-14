import React, { useState, useEffect } from 'react';
import { X, Copy, Share2, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotes } from '../contexts/NotesContext';
import SharingService from '../services/sharingService';
import type { Note } from '../types';

interface ShareModalProps {
  note: Note;
  isOpen: boolean;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ note, isOpen, onClose }) => {
  const { user } = useAuth();
  const { updateSharingSettings } = useNotes();
  const [shareType, setShareType] = useState<'public' | 'private'>('public');
  const [shareUrl, setShareUrl] = useState<string>('');
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string>('');
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState('');
  const [isAddingCollaborator, setIsAddingCollaborator] = useState(false);
  const [allowEditing, setAllowEditing] = useState<boolean>(true);
  const [isUpdatingPermission, setIsUpdatingPermission] = useState(false);

  // Initialize share data when modal opens
  useEffect(() => {
    if (isOpen && note.isShared && note.shareId) {
      // Load existing share type
      setShareType(note.shareType || 'public');
      const url = SharingService.generateShareUrl(note.shareId);
      setShareUrl(url);
      
      // Load existing shared note to get allowEditing
      SharingService.getSharedNote(note.shareId).then(sharedNote => {
        if (sharedNote) {
          setAllowEditing(sharedNote.allowEditing ?? (sharedNote.shareType === 'private'));
        }
      }).catch(err => {
        console.warn('Failed to load shared note details:', err);
      });
    } else if (isOpen) {
      // Reset for new share
      setShareType('public');
      setShareUrl('');
      setCopied(false);
      setError('');
      setAllowEditing(true);
    }
  }, [isOpen, note]);

  if (!isOpen) return null;

  const handleShare = async () => {
    if (!user) return;

    try {
      setIsSharing(true);
      setError('');

      // Use the new context method to handle sharing
      const result = await updateSharingSettings(note.id, shareType);
      
      const url = SharingService.generateShareUrl(result.shareId);
      setShareUrl(url);
      
      console.log(`✅ Note sharing updated to ${shareType}:`, result.shareId);
    } catch (err) {
      console.error('Error updating sharing settings:', err);
      
      if (err instanceof Error) {
        if (err.message.includes('permission')) {
          setError('Permission denied. Please check your Firebase configuration.');
        } else if (err.message.includes('network')) {
          setError('Network error. Please check your internet connection.');
        } else if (err.message.includes('auth')) {
          setError('Authentication error. Please try logging in again.');
        } else {
          setError(`Error: ${err.message}`);
        }
      } else {
        setError('Failed to update sharing settings. Please try again.');
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleAddCollaborator = async () => {
    if (!newCollaboratorEmail.trim() || !user || !note.shareId) return;

    try {
      setIsAddingCollaborator(true);
      setError('');

      // Add collaborator with edit permission
      await SharingService.addCollaborator(note.shareId, newCollaboratorEmail.trim(), 'edit');

      setNewCollaboratorEmail('');
      console.log('✅ Collaborator added successfully');
      
      // Show success message
      const tempError = error;
      setError('✅ Collaborator added successfully!');
      setTimeout(() => setError(tempError), 3000);
    } catch (err) {
      console.error('Error adding collaborator:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to add collaborator. Please try again.');
      }
    } finally {
      setIsAddingCollaborator(false);
    }
  };

  const handleToggleEditPermission = async () => {
    if (!note.shareId || !user || user.id !== note.userId) return;

    const newAllowEditing = !allowEditing;
    
    try {
      setIsUpdatingPermission(true);
      setError('');

      await SharingService.updateEditPermission(note.shareId, newAllowEditing);
      setAllowEditing(newAllowEditing);
      
      console.log(`✅ Edit permission ${newAllowEditing ? 'enabled' : 'disabled'}`);
    } catch (err) {
      console.error('Error updating edit permission:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to update edit permission. Please try again.');
      }
    } finally {
      setIsUpdatingPermission(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-dark-card rounded-lg shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600">
          <h2 className="text-base font-medium text-gray-900 dark:text-white">
            Share "{note.title || 'Untitled'}"
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Simple Toggle - Like Google Docs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Share with others
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={async () => {
                    setShareType('public');
                    // If already shared, update the existing link
                    if (shareUrl) {
                      try {
                        setIsSharing(true);
                        await updateSharingSettings(note.id, 'public');
                        console.log('✅ Updated existing link to public');
                      } catch (err) {
                        console.error('Error updating to public:', err);
                        setError('Failed to update sharing mode');
                      } finally {
                        setIsSharing(false);
                      }
                    }
                  }}
                  disabled={isSharing}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    shareType === 'public'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  } ${isSharing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  🌍 Public
                </button>
                <button
                  onClick={async () => {
                    setShareType('private');
                    // If already shared, update the existing link
                    if (shareUrl) {
                      try {
                        setIsSharing(true);
                        await updateSharingSettings(note.id, 'private');
                        console.log('✅ Updated existing link to private');
                      } catch (err) {
                        console.error('Error updating to private:', err);
                        setError('Failed to update sharing mode');
                      } finally {
                        setIsSharing(false);
                      }
                    }
                  }}
                  disabled={isSharing}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    shareType === 'private'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  } ${isSharing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  🔒 Private
                </button>
              </div>
            </div>
            
                        <p className="text-xs text-gray-500 dark:text-gray-400">
              {isSharing && shareUrl ? (
                "Updating link permissions..."
              ) : shareType === 'public' ? (
                "Anyone with the link can view" 
              ) : shareType === 'private' && shareUrl ? (
                allowEditing ? "Signed-in users can view and edit" : "Signed-in users can view only"
              ) : (
                "Signed-in users can view and edit"
              )}
            </p>
          </div>

          {/* Collaboration Settings for Private Notes */}
          {shareType === 'private' && shareUrl && (
            <div className="space-y-3 border-t pt-3 border-gray-200 dark:border-gray-600">
              {/* Edit Permission Toggle (Admin Only) */}
              {user?.id === note.userId && (
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      Allow Editing
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Control whether others can edit this private note
                    </div>
                  </div>
                  <button
                    onClick={handleToggleEditPermission}
                    disabled={isUpdatingPermission}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      allowEditing ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                    } ${isUpdatingPermission ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        allowEditing ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Manage Access
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.id === note.userId ? 'You are the owner' : 'Shared with you'}
                </span>
              </div>
              
              {/* Current User Permission */}
              <div className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {user?.displayName?.charAt(0) || user?.email?.charAt(0) || '?'}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.displayName || user?.email}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.id === note.userId ? 'Owner' : 'Can edit'}
                  </div>
                </div>
                {user?.id === note.userId && (
                  <button className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400">
                    Manage
                  </button>
                )}
              </div>

              {/* Add Collaborator (only for owner) */}
              {user?.id === note.userId && (
                <div className="space-y-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    💡 Tip: Your current email is <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">{user?.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="email"
                      placeholder="Add people by email..."
                      value={newCollaboratorEmail}
                      onChange={(e) => setNewCollaboratorEmail(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddCollaborator();
                        }
                      }}
                    />
                    <button 
                      onClick={handleAddCollaborator}
                      disabled={!newCollaboratorEmail.trim() || isAddingCollaborator}
                      className="px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded transition-colors"
                    >
                      {isAddingCollaborator ? '...' : 'Add'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Share URL Section */}
          {shareUrl ? (
            <div className="flex items-center space-x-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-3">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none"
              />
              <button
                onClick={handleCopy}
                className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors"
                title={copied ? 'Copied!' : 'Copy link'}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          ) : (
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <Share2 className="h-4 w-4" />
              <span>
                {isSharing ? 'Creating Link...' : shareUrl ? 'Update Link' : 'Get Link'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareModal;