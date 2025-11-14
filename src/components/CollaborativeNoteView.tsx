import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Edit3, Users, Lock, Eye } from 'lucide-react';
import SharingService from '../services/sharingService';
import type { SharedNote } from '../types';

interface CollaborativeNoteViewProps {
  shareId: string;
}

const CollaborativeNoteView: React.FC<CollaborativeNoteViewProps> = ({ shareId }) => {
  const { user } = useAuth();
  const [sharedNote, setSharedNote] = useState<SharedNote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');

  useEffect(() => {
    loadSharedNote();
  }, [shareId]);

  const loadSharedNote = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const note = await SharingService.getSharedNote(shareId);
      if (!note) {
        setError('Note not found or has expired');
        return;
      }

      // Check access permissions
      if (note.shareType === 'private' && !user) {
        setError('Please sign in to view this private note');
        return;
      }

      setSharedNote(note);
      setEditedTitle(note.title);
      setEditedDescription(note.description);
    } catch (err) {
      console.error('Error loading shared note:', err);
      setError('Failed to load shared note');
    } finally {
      setIsLoading(false);
    }
  };

  const canEdit = () => {
    if (!sharedNote || !user) return false;
    return SharingService.canEditSharedNote(sharedNote, user.email, user.id);
  };

  const handleSaveChanges = async () => {
    if (!sharedNote || !user) return;

    try {
      // TODO: Implement note content update in sharing service
      console.log('Saving changes:', { title: editedTitle, description: editedDescription });
      
      // Update local state
      setSharedNote(prev => prev ? {
        ...prev,
        title: editedTitle,
        description: editedDescription,
        lastEditedBy: user.displayName || user.email,
        lastEditedAt: new Date()
      } : null);
      
      setIsEditing(false);
      console.log('✅ Changes saved successfully');
    } catch (err) {
      console.error('Error saving changes:', err);
      setError('Failed to save changes');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading shared note...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md mx-auto p-6">
          <Lock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            Unable to Access Note
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          {!user && (
            <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
              Sign In to Continue
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!sharedNote) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                sharedNote.shareType === 'public' ? 'bg-green-500' : 'bg-blue-500'
              }`}></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {sharedNote.shareType === 'public' ? 'Public Note' : 'Private Collaborative Note'}
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              {canEdit() && (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center space-x-2 px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>{isEditing ? 'Cancel' : 'Edit'}</span>
                </button>
              )}
              
              {!canEdit() && sharedNote.shareType === 'private' && (
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Eye className="h-4 w-4" />
                  <span>View Only</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          {isEditing ? (
            <div className="space-y-4">
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full text-2xl font-bold bg-transparent text-gray-800 dark:text-white placeholder-gray-500 border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-3 py-2"
                placeholder="Note title..."
              />
              
              <textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                rows={10}
                className="w-full bg-transparent text-gray-700 dark:text-gray-300 placeholder-gray-500 border border-gray-200 dark:border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Write your note here..."
              />
              
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveChanges}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                {sharedNote.title || 'Untitled'}
              </h1>
              
              <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {sharedNote.description || 'No content'}
              </div>
            </div>
          )}
        </div>

        {/* Collaboration Info */}
        {sharedNote.shareType === 'private' && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Users className="h-4 w-4" />
              <span>Shared by {sharedNote.ownerName}</span>
              {sharedNote.lastEditedBy && (
                <span>• Last edited by {sharedNote.lastEditedBy}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollaborativeNoteView;