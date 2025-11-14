import React, { useState } from 'react';
import { Settings, Globe, Lock, Save } from 'lucide-react';
import SharingService from '../services/sharingService';
import type { SharedNote } from '../types';

interface ShareSettingsProps {
  sharedNote: SharedNote;
  onUpdate: (updatedNote: SharedNote) => void;
  isOwner: boolean;
}

const ShareSettings: React.FC<ShareSettingsProps> = ({ sharedNote, onUpdate, isOwner }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [shareType, setShareType] = useState<'public' | 'private'>(sharedNote.shareType);
  const [updating, setUpdating] = useState(false);

  if (!isOwner) return null;

  const handleUpdate = async () => {
    try {
      setUpdating(true);
      await SharingService.updateShareType(sharedNote.shareId, shareType);
      
      const updatedNote = { ...sharedNote, shareType };
      onUpdate(updatedNote);
      setIsOpen(false);
    } catch (error) {
      console.error('Error updating share type:', error);
      alert('Failed to update share settings');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        title="Share Settings"
      >
        <Settings className="h-4 w-4 text-gray-600 dark:text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-10 bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10 p-4 min-w-[250px]">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">
            Share Settings
          </h3>

          <div className="space-y-3">
            <button
              onClick={() => setShareType('public')}
              className={`w-full p-3 rounded-lg border-2 transition-colors text-left ${
                shareType === 'public'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Globe className="h-5 w-5 text-green-500" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    Public
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Anyone with the link can view
                  </div>
                </div>
              </div>
            </button>

            <button
              onClick={() => setShareType('private')}
              className={`w-full p-3 rounded-lg border-2 transition-colors text-left ${
                shareType === 'private'
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Lock className="h-5 w-5 text-orange-500" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    Private
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Login required to view
                  </div>
                </div>
              </div>
            </button>
          </div>

          <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
            <button
              onClick={() => {
                setShareType(sharedNote.shareType);
                setIsOpen(false);
              }}
              className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdate}
              disabled={updating || shareType === sharedNote.shareType}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg transition-colors flex items-center space-x-2 text-sm"
            >
              <Save className="h-3 w-3" />
              <span>{updating ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Overlay to close modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default ShareSettings;