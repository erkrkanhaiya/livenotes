import React, { useState, useEffect } from 'react';
import { X, Share2, Copy, Check, Users, Settings } from 'lucide-react';
import type { Group } from '../types';
import GroupsService from '../services/groupsService';

interface GroupShareModalProps {
  group: Group;
  isOpen: boolean;
  onClose: () => void;
  onShareUpdate: () => void;
}

const GroupShareModal: React.FC<GroupShareModalProps> = ({
  group,
  isOpen,
  onClose,
  onShareUpdate,
}) => {
  const [shareType, setShareType] = useState<'public' | 'private'>(group.shareType || 'public');
  const [shareUrl, setShareUrl] = useState<string>('');
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string>('');
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState('');
  const [isAddingCollaborator, setIsAddingCollaborator] = useState(false);
  const [allowEditing, setAllowEditing] = useState<boolean>(group.allowEditing ?? true);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [isLoadingCollaborators, setIsLoadingCollaborators] = useState(false);
  const [currentShareId, setCurrentShareId] = useState<string | null>(group.shareId || null);

  useEffect(() => {
    if (isOpen) {
      if (group.shareId) {
        setShareType(group.shareType || 'public');
        setCurrentShareId(group.shareId);
        const url = GroupsService.generateShareUrl(group.shareId);
        setShareUrl(url);
        loadSharedGroupData(group.shareId);
      } else {
        setShareType('public');
        setCurrentShareId(null);
        setShareUrl('');
        setCopied(false);
        setError('');
        setAllowEditing(true);
        setCollaborators([]);
      }
    }
  }, [isOpen, group.shareId, group.shareType]);

  const loadSharedGroupData = async (shareIdToLoad?: string) => {
    const shareId = shareIdToLoad || group.shareId;
    if (!shareId) return;
    
    setIsLoadingCollaborators(true);
    try {
      const sharedGroup = await GroupsService.getSharedGroup(shareId);
      if (sharedGroup) {
        setAllowEditing(sharedGroup.allowEditing ?? (sharedGroup.shareType === 'private'));
        setCollaborators(sharedGroup.collaborators || []);
      }
    } catch (error) {
      console.error('Error loading shared group data:', error);
    } finally {
      setIsLoadingCollaborators(false);
    }
  };

  if (!isOpen) return null;

  const handleShare = async () => {
    try {
      setIsSharing(true);
      setError('');

      // If group is already shared, we might need to update it
      let result;
      if (group.shareId) {
        // Group is already shared, update the share type if needed
        // For now, we'll create a new share (you might want to add an update method)
        result = await GroupsService.shareGroup(
          group.id,
          shareType,
          group.ownerEmail
        );
      } else {
        // First time sharing
        result = await GroupsService.shareGroup(
          group.id,
          shareType,
          group.ownerEmail
        );
      }

      // Update local state with new shareId
      const updatedShareId = result.shareId;
      setCurrentShareId(updatedShareId);
      setShareUrl(GroupsService.generateShareUrl(updatedShareId));
      // Reload the group data to get the updated shareId and collaborators
      await loadSharedGroupData(updatedShareId);
      onShareUpdate();
    } catch (e: any) {
      console.error('Error sharing group:', e);
      setError(e.message || 'Failed to share group');
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopy = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAddCollaborator = async () => {
    if (!newCollaboratorEmail.trim() || !currentShareId) return;

    try {
      setIsAddingCollaborator(true);
      setError('');

      await GroupsService.addGroupCollaborator(
        currentShareId,
        newCollaboratorEmail.trim(),
        'edit'
      );

      setNewCollaboratorEmail('');
      await loadSharedGroupData(currentShareId);
    } catch (e: any) {
      setError(e.message || 'Failed to add collaborator');
    } finally {
      setIsAddingCollaborator(false);
    }
  };

  const handleRemoveCollaborator = async (email: string) => {
    if (!currentShareId) return;

    try {
      await GroupsService.removeGroupCollaborator(currentShareId, email);
      await loadSharedGroupData(currentShareId);
    } catch (e: any) {
      setError(e.message || 'Failed to remove collaborator');
    }
  };

  const handleUpdatePermission = async (email: string, currentPermission: string) => {
    if (!currentShareId) return;

    const newPermission = currentPermission === 'edit' ? 'view' : 'edit';
    try {
      await GroupsService.updateGroupCollaboratorPermission(
        currentShareId,
        email,
        newPermission
      );
      await loadSharedGroupData(currentShareId);
    } catch (e: any) {
      setError(e.message || 'Failed to update permission');
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-dark-card rounded-lg shadow-xl animate-scale-in max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center space-x-2">
            <Share2 className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white text-left">
              Share Group
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            <X className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 text-left">
              Group: {group.name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-left">
              {group.noteCount || 0} notes in this group
            </p>
          </div>

          {/* Share Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 text-left">
              Share Type
            </label>
            <div className="space-y-2">
              <label className="flex items-start space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                <input
                  type="radio"
                  name="shareType"
                  value="public"
                  checked={shareType === 'public'}
                  onChange={(e) => setShareType(e.target.value as 'public' | 'private')}
                  className="mt-1"
                />
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-800 dark:text-white">Public</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Anyone with the link can view
                  </div>
                </div>
              </label>
              <label className="flex items-start space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                <input
                  type="radio"
                  name="shareType"
                  value="private"
                  checked={shareType === 'private'}
                  onChange={(e) => setShareType(e.target.value as 'public' | 'private')}
                  className="mt-1"
                />
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-800 dark:text-white">Private</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Only people you invite can view
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Allow Editing (Private only) */}
          {shareType === 'private' && (
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-left">
                <div className="font-medium text-gray-800 dark:text-white">Allow Editing</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Let collaborators edit notes in this group
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowEditing}
                  onChange={(e) => setAllowEditing(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          )}

          {/* Collaborators List (Private only) */}
          {shareType === 'private' && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 text-left">
                Collaborators
              </h3>
              {!currentShareId ? (
                <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  Share the group first to add collaborators
                </div>
              ) : isLoadingCollaborators ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                </div>
              ) : collaborators.length === 0 ? (
                <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No collaborators yet
                </div>
              ) : (
                <div className="space-y-2">
                  {collaborators.map((collaborator, index) => (
                    <div
                      key={collaborator.email || index}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {collaborator.displayName?.charAt(0) || collaborator.email?.charAt(0) || 'C'}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="text-sm font-medium text-gray-900 dark:text-white text-left">
                            {collaborator.displayName || collaborator.email}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 text-left">
                            {collaborator.email}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <select
                          value={collaborator.permission || 'edit'}
                          onChange={(e) => handleUpdatePermission(collaborator.email, collaborator.permission)}
                          className="text-xs px-2 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 text-left"
                        >
                          <option value="view">View</option>
                          <option value="edit">Edit</option>
                        </select>
                        <button
                          onClick={() => handleRemoveCollaborator(collaborator.email)}
                          className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Remove collaborator"
                        >
                          <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Collaborator - Show only if group is shared */}
              {currentShareId && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2">
                    <input
                      type="email"
                      placeholder="Add collaborator by email..."
                      value={newCollaboratorEmail}
                      onChange={(e) => setNewCollaboratorEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddCollaborator();
                        }
                      }}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-left"
                    />
                    <button
                      onClick={handleAddCollaborator}
                      disabled={!newCollaboratorEmail.trim() || isAddingCollaborator}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <Users className="h-4 w-4" />
                      <span>{isAddingCollaborator ? '...' : 'Add'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Share Link */}
          {shareUrl && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 text-left">
                Share Link
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 text-left"
                />
                <button
                  onClick={handleCopy}
                  className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  title="Copy link"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-700 dark:text-red-300 text-sm text-left">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50">
          <button
            onClick={handleShare}
            disabled={isSharing}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg font-medium transition-colors"
          >
            {isSharing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                <span>Sharing...</span>
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4 mr-2" />
                <span>{shareUrl ? 'Update Share Settings' : 'Generate Share Link'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupShareModal;

