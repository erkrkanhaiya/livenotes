import React, { useState } from 'react';
import { Folder, FolderOpen, MoreVertical, Share2, Trash2, Edit2, Users, Pin, PinOff, LogOut, Info, X } from 'lucide-react';
import type { Group } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface GroupListProps {
  groups: Group[];
  selectedGroupId: string | null;
  onSelectGroup: (groupId: string | null) => void;
  onEditGroup: (group: Group) => void;
  onDeleteGroup: (groupId: string) => void;
  onShareGroup: (group: Group) => void;
  onTogglePin: (groupId: string) => void;
  onLeaveGroup: (groupId: string) => void;
}

const GroupList: React.FC<GroupListProps> = ({
  groups,
  selectedGroupId,
  onSelectGroup,
  onEditGroup,
  onDeleteGroup,
  onShareGroup,
  onTogglePin,
  onLeaveGroup,
}) => {
  const { user } = useAuth();
  
  // Check if user is owner of a group
  const isOwner = (group: Group) => {
    if (!user) {
      return false;
    }
    
    // Check by ownerId (primary check) - strict equality
    if (group.ownerId && user.id) {
      const ownerIdMatch = String(group.ownerId) === String(user.id);
      if (ownerIdMatch) {
        return true;
      }
    }
    
    // Fallback: Check by email (in case ownerId doesn't match due to auth differences)
    // This handles cases where the same user might have different IDs in extension vs web
    if (group.ownerEmail && user.email) {
      const groupEmail = group.ownerEmail.toLowerCase().trim();
      const userEmail = user.email.toLowerCase().trim();
      if (groupEmail === userEmail) {
        return true;
      }
    }
    
    return false;
  };
  
  // Check if user is a collaborator (not owner)
  const isCollaborator = (group: Group) => {
    if (!user || !user.email) return false;
    if (isOwner(group)) return false;
    
    // Check if user is in collaborators list
    if (group.collaborators && group.collaborators.length > 0) {
      return group.collaborators.some((c: any) => 
        c.email?.toLowerCase() === user.email?.toLowerCase()
      );
    }
    
    // If group is shared but no collaborators list, check if it's shared with user
    return group.isShared && !isOwner(group);
  };
  // Sort groups: pinned first, then by name
  const sortedGroups = [...groups].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return a.name.localeCompare(b.name);
  });
  const [showMenuForGroup, setShowMenuForGroup] = useState<string | null>(null);
  const [showDetailsForGroup, setShowDetailsForGroup] = useState<Group | null>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMenuForGroup && menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenuForGroup(null);
      }
    };

    if (showMenuForGroup) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenuForGroup]);

  const isExtension = typeof chrome !== 'undefined' && chrome.runtime && !window.location.protocol.startsWith('http');

  return (
    <div className="space-y-1.5">
      {/* All Notes Option */}
      <button
        onClick={() => onSelectGroup(null)}
        className={`w-full flex items-center justify-between ${isExtension ? 'p-2' : 'p-3'} rounded-lg transition-colors text-left ${
          selectedGroupId === null
            ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
            : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
        }`}
      >
        <div className="flex items-center space-x-2 min-w-0">
          <Folder className={`${isExtension ? 'h-3.5 w-3.5' : 'h-4 w-4'} shrink-0`} />
          <span className={`${isExtension ? 'text-xs' : 'text-sm'} font-semibold truncate`}>All Notes</span>
        </div>
      </button>

      {/* Groups List */}
      {sortedGroups.map((group) => (
        <div
          key={group.id}
          className={`relative flex items-center gap-1.5 ${isExtension ? 'p-2' : 'p-3'} rounded-lg transition-colors ${
            selectedGroupId === group.id
              ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          <button
            onClick={() => onSelectGroup(group.id)}
            className="flex-1 flex items-start space-x-1.5 text-left min-w-0"
          >
            {selectedGroupId === group.id ? (
              <FolderOpen className={`${isExtension ? 'h-3.5 w-3.5' : 'h-4 w-4'} shrink-0`} />
            ) : (
              <Folder className={`${isExtension ? 'h-3.5 w-3.5' : 'h-4 w-4'} shrink-0`} />
            )}
            <div className="flex-1 min-w-0">
              <div className={`${isExtension ? 'text-xs' : 'text-sm'} font-semibold truncate flex items-center space-x-1`}>
                {group.isPinned && (
                  <Pin className={`${isExtension ? 'h-2.5 w-2.5' : 'h-3 w-3'} text-blue-500 flex-shrink-0`} />
                )}
                <span className="truncate">{group.name}</span>
              </div>
              <div className={`${isExtension ? 'text-[10px]' : 'text-xs'} opacity-75 flex items-center space-x-1.5 mt-0.5 flex-wrap`}>
                <span className="flex items-center space-x-0.5">
                  <Folder className={`${isExtension ? 'h-2.5 w-2.5' : 'h-3 w-3'}`} />
                  <span>{group.noteCount || 0}</span>
                </span>
                {group.isShared && group.collaborators && group.collaborators.length > 0 && (
                  <span className="flex items-center space-x-0.5">
                    <Users className={`${isExtension ? 'h-2.5 w-2.5' : 'h-3 w-3'}`} />
                    <span>{group.collaborators.length}</span>
                  </span>
                )}
                {group.isShared && (!group.collaborators || group.collaborators.length === 0) && !isOwner(group) && (
                  <span className="flex items-center space-x-0.5">
                    <Share2 className={`${isExtension ? 'h-2.5 w-2.5' : 'h-3 w-3'}`} />
                    <span className="truncate">Shared</span>
                  </span>
                )}
              </div>
            </div>
          </button>

          {/* Share button shortcut - Only for owners */}
          {isOwner(group) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShareGroup(group);
              }}
              className={`${isExtension ? 'p-1' : 'p-1.5'} hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors text-blue-600 dark:text-blue-400 shrink-0`}
              title="Share group"
            >
              <Share2 className={`${isExtension ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />
            </button>
          )}

          {/* Menu Button */}
          <div className="relative shrink-0" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenuForGroup(showMenuForGroup === group.id ? null : group.id);
              }}
              className={`${isExtension ? 'p-0.5' : 'p-1'} hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors`}
            >
              <MoreVertical className={`${isExtension ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />
            </button>

            {/* Dropdown Menu */}
            {showMenuForGroup === group.id && (
              <div className="absolute right-0 top-8 bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10 min-w-[160px]">
                {/* Pin/Unpin - Available to all */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePin(group.id);
                    setShowMenuForGroup(null);
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left text-sm"
                >
                  {group.isPinned ? (
                    <>
                      <PinOff className="h-4 w-4" />
                      <span>Unpin</span>
                    </>
                  ) : (
                    <>
                      <Pin className="h-4 w-4" />
                      <span>Pin</span>
                    </>
                  )}
                </button>
                
                {/* Owner-only options */}
                {isOwner(group) && (
                  <>
                    <div className="border-t border-gray-200 dark:border-gray-600"></div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditGroup(group);
                        setShowMenuForGroup(null);
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left text-sm"
                    >
                      <Edit2 className="h-4 w-4" />
                      <span>Edit</span>
                    </button>
                    <div className="border-t border-gray-200 dark:border-gray-600"></div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Are you sure you want to delete "${group.name}"? This will remove all notes from the group but won't delete the notes themselves.`)) {
                          onDeleteGroup(group.id);
                        }
                        setShowMenuForGroup(null);
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 text-left text-sm"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete</span>
                    </button>
                  </>
                )}
                
                {/* Collaborator-only options */}
                {isCollaborator(group) && (
                  <>
                    <div className="border-t border-gray-200 dark:border-gray-600"></div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDetailsForGroup(group);
                        setShowMenuForGroup(null);
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-blue-100 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-left text-sm"
                    >
                      <Info className="h-4 w-4" />
                      <span>Details</span>
                    </button>
                    <div className="border-t border-gray-200 dark:border-gray-600"></div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Are you sure you want to leave "${group.name}"? You will no longer have access to this group.`)) {
                          onLeaveGroup(group.id);
                        }
                        setShowMenuForGroup(null);
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-orange-100 dark:hover:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-left text-sm"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Leave</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Group Details Modal for Collaborators */}
      {showDetailsForGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Group Details</h2>
              <button
                onClick={() => setShowDetailsForGroup(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 text-left">
              {/* Group Name */}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide text-left">
                  Group Name
                </label>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1 text-left">
                  {showDetailsForGroup.name}
                </p>
              </div>

              {/* Description */}
              {showDetailsForGroup.description && (
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide text-left">
                    Description
                  </label>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 text-left">
                    {showDetailsForGroup.description}
                  </p>
                </div>
              )}

              {/* Admin/Owner Information */}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide text-left">
                  Admin / Owner
                </label>
                <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-white font-semibold text-sm">
                        {showDetailsForGroup.ownerName?.charAt(0)?.toUpperCase() || showDetailsForGroup.ownerEmail?.charAt(0)?.toUpperCase() || 'A'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {showDetailsForGroup.ownerName || 'Admin'}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {showDetailsForGroup.ownerEmail}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Collaborators List */}
              {showDetailsForGroup.isShared && showDetailsForGroup.collaborators && showDetailsForGroup.collaborators.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block text-left">
                    Collaborators ({showDetailsForGroup.collaborators.length})
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {showDetailsForGroup.collaborators.map((collaborator: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-xs">
                            {(collaborator.email || collaborator.name || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {collaborator.name || collaborator.email?.split('@')[0] || 'Collaborator'}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            {collaborator.email}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Share Type */}
              {showDetailsForGroup.isShared && (
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide text-left">
                    Share Type
                  </label>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 text-left">
                    {showDetailsForGroup.shareType === 'public' ? 'Public' : 'Private'}
                  </p>
                </div>
              )}

              {/* Created Date */}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide text-left">
                  Created
                </label>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 text-left">
                  {showDetailsForGroup.createdAt
                    ? new Date(showDetailsForGroup.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'N/A'}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-600 flex justify-end">
              <button
                onClick={() => setShowDetailsForGroup(null)}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupList;

