import React, { useState, useEffect, useRef } from 'react';
import { useNotes } from '../contexts/NotesContext';
import { useAuth } from '../contexts/AuthContext';
import { Pin, Trash2, MoreVertical, Users, Info, Calendar, Clock, RefreshCw, UserMinus, Globe, Share2, X, UserPlus, ChevronDown, ChevronUp, Edit2, Settings } from 'lucide-react';
// import { formatDistanceToNow } from 'date-fns';
import type { Note, NoteColor, SharedNote } from '../types';
import CommunityAvatars from './CommunityAvatars';
import ShareModal from './ShareModal';
import SharingService from '../services/sharingService';

const colorClasses: Record<NoteColor, string> = {
  yellow: 'bg-note-yellow border-yellow-300',
  blue: 'bg-note-blue border-blue-300',
  green: 'bg-note-green border-green-300',
  pink: 'bg-note-pink border-pink-300',
  purple: 'bg-note-purple border-purple-300',
  orange: 'bg-note-orange border-orange-300',
};

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  animationDelay?: number;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onEdit, animationDelay = 0 }) => {
  const { updateNote, deleteNote, refreshCommunityData, leaveCommunity, refreshSharedNotes } = useNotes();
  const { user } = useAuth();
  
  // Check if user is the owner of the note
  const isNoteOwner = () => {
    return user && note.userId === user.id;
  };
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshingCommunity, setIsRefreshingCommunity] = useState(false);
  const [isLeavingCommunity, setIsLeavingCommunity] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [showCollaboratorModal, setShowCollaboratorModal] = useState(false);
  const [sharedNoteData, setSharedNoteData] = useState<SharedNote | null>(null);
  const [isLoadingCollaborators, setIsLoadingCollaborators] = useState(false);
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState('');
  const [isAddingCollaborator, setIsAddingCollaborator] = useState(false);

  // Refs for click-outside detection
  const menuRef = useRef<HTMLDivElement>(null);
  const collaboratorModalRef = useRef<HTMLDivElement>(null);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMenu && menuRef.current && !menuRef.current.contains(event.target as Node)) {
        // Check if click is on the menu button - if so, don't close (it will toggle)
        const target = event.target as HTMLElement;
        const menuButton = target.closest('button[title="More options"]');
        if (!menuButton) {
          setShowMenu(false);
        }
      }
    };

    if (showMenu) {
      // Use a small delay to avoid closing immediately when opening
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showMenu]);

  // Close collaborator modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showCollaboratorModal && collaboratorModalRef.current && !collaboratorModalRef.current.contains(event.target as Node)) {
        setShowCollaboratorModal(false);
      }
    };

    if (showCollaboratorModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCollaboratorModal]);

  const handlePin = async () => {
    try {
      await updateNote(note.id, { isPinned: !note.isPinned });
    } catch (error) {
      console.error('Error pinning note:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    try {
      setIsDeleting(true);
      await deleteNote(note.id);
    } catch (error) {
      console.error('Error deleting note:', error);
      setIsDeleting(false);
    }
  };

  const handleEdit = async () => {
    // Check if note belongs to a group and verify edit permissions
    if (note.groupId && user) {
      try {
        const { default: GroupsService } = await import('../services/groupsService');
        const canEdit = await GroupsService.canEditGroupNotes(
          note.groupId,
          user.id,
          user.email || undefined
        );
        
        if (!canEdit) {
          alert('You do not have permission to edit notes in this group. Your permission is set to "view only".');
          setShowMenu(false);
          return;
        }
      } catch (error) {
        console.error('Error checking edit permission:', error);
        // Allow edit to proceed if check fails (fail open)
      }
    }
    
    onEdit(note);
    setShowMenu(false);
  };



  const handleRefreshCommunity = async () => {
    if (!note.isCommunity) return;
    
    try {
      setIsRefreshingCommunity(true);
      await refreshCommunityData();
      console.log('🔄 Community members refreshed for note:', note.title);
    } catch (error) {
      console.error('Error refreshing community members:', error);
    } finally {
      setIsRefreshingCommunity(false);
      setShowMenu(false);
    }
  };

  const handleLeaveCommunity = async () => {
    if (!note.isCommunity || !note.shareId) return;
    
    if (!confirm(`Are you sure you want to leave the community and remove "${note.title}" from your notes?`)) {
      return;
    }
    
    try {
      setIsLeavingCommunity(true);
      await leaveCommunity(note.shareId, note.id);
      console.log('👋 Left community for note:', note.title);
    } catch (error) {
      console.error('Error leaving community:', error);
      alert('Failed to leave community. Please try again.');
    } finally {
      setIsLeavingCommunity(false);
      setShowMenu(false);
    }
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  // Load shared note data when note is shared
  useEffect(() => {
    if (note.isShared && note.shareId && user) {
      loadSharedNoteData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.isShared, note.shareId, user]);

  const loadSharedNoteData = async () => {
    if (!note.shareId) return;
    
    try {
      setIsLoadingCollaborators(true);
      const sharedNote = await SharingService.getSharedNote(note.shareId);
      if (sharedNote) {
        setSharedNoteData(sharedNote);
      }
    } catch (error) {
      console.error('Error loading shared note data:', error);
    } finally {
      setIsLoadingCollaborators(false);
    }
  };

  const isOwner = () => {
    if (!user || !sharedNoteData) return false;
    return (
      (user.email && (sharedNoteData.ownerEmail === user.email || sharedNoteData.ownerEmail?.toLowerCase() === user.email.toLowerCase())) ||
      (user.id && sharedNoteData.ownerId === user.id)
    );
  };

  const handleAddCollaborator = async () => {
    if (!newCollaboratorEmail.trim() || !note.shareId || !isOwner()) return;

    try {
      setIsAddingCollaborator(true);
      await SharingService.addCollaborator(note.shareId, newCollaboratorEmail.trim(), 'edit');
      setNewCollaboratorEmail('');
      await loadSharedNoteData(); // Refresh collaborators list
      await refreshSharedNotes(); // Refresh shared notes list
      console.log('✅ Collaborator added successfully');
    } catch (err) {
      console.error('Error adding collaborator:', err);
      alert(err instanceof Error ? err.message : 'Failed to add collaborator');
    } finally {
      setIsAddingCollaborator(false);
    }
  };

  const handleRemoveCollaborator = async (collaboratorEmail: string) => {
    if (!note.shareId || !isOwner()) return;

    if (!confirm(`Remove ${collaboratorEmail} from this note?`)) {
      return;
    }

    try {
      await SharingService.removeCollaborator(note.shareId, collaboratorEmail);
      await loadSharedNoteData(); // Refresh collaborators list
      await refreshSharedNotes(); // Refresh shared notes list
      console.log('✅ Collaborator removed successfully');
    } catch (err) {
      console.error('Error removing collaborator:', err);
      alert('Failed to remove collaborator');
    }
  };

  const handleUpdatePermission = async (collaboratorEmail: string, permission: 'view' | 'edit') => {
    if (!note.shareId || !isOwner()) return;

    try {
      await SharingService.updateCollaboratorPermission(note.shareId, collaboratorEmail, permission);
      await loadSharedNoteData(); // Refresh collaborators list
      console.log('✅ Permission updated successfully');
    } catch (err) {
      console.error('Error updating permission:', err);
      alert('Failed to update permission');
    }
  };

  const isExtension = typeof chrome !== 'undefined' && chrome.runtime && !window.location.protocol.startsWith('http');

  return (
    <div
      className={`
        relative ${isExtension ? 'p-2.5' : 'p-4'} rounded-lg border-2 transition-all duration-200 hover:shadow-md
        ${colorClasses[note.color]}
        ${isDeleting ? 'opacity-50 pointer-events-none' : ''}
        animate-fade-in
      `}
      style={{ animationDelay: `${animationDelay}s` }}
    >
      {/* Action buttons at top right */}
      <div className={`absolute ${isExtension ? 'top-1.5 right-1.5' : 'top-2 right-2'} flex items-center ${isExtension ? 'space-x-0.5' : 'space-x-1'}`}>
        {/* Pin button */}
        <button
          onClick={handlePin}
          className={`${isExtension ? 'p-1' : 'p-1.5'} hover:bg-white/50 dark:hover:bg-black/20 rounded-full transition-colors ${
            note.isPinned ? 'bg-white/30 dark:bg-black/10' : ''
          }`}
          title={note.isPinned ? 'Unpin note' : 'Pin note'}
        >
          <Pin className={`${isExtension ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-gray-600 ${note.isPinned ? 'fill-current' : ''}`} />
        </button>

        {/* Share button - Only show for note owners */}
        {/* {isNoteOwner() && (
          <button
            onClick={() => setShowShareModal(true)}
            className={`p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors border ${
              note.isShared || note.isCommunity 
                ? 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700' 
                : 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800 hover:border-blue-300'
            }`}
            title={note.isShared || note.isCommunity ? 'Manage sharing' : 'Share note'}
          >
            <Share2 className={`h-5 w-5 ${
              note.isShared || note.isCommunity ? 'text-green-600 dark:text-green-500' : 'text-blue-600 dark:text-blue-500'
            }`} />
          </button>
        )} */}

        {/* More menu button (for delete) */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className={`${isExtension ? 'p-1' : 'p-1.5'} hover:bg-white/50 dark:hover:bg-black/20 rounded-full transition-colors`}
          title="More options"
        >
          <MoreVertical className={`${isExtension ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-gray-600`} />
        </button>

        {/* Dropdown menu with details */}
        {showMenu && (
          <div ref={menuRef} className={`absolute right-0 ${isExtension ? 'top-7' : 'top-8'} bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10 ${isExtension ? 'py-1.5' : 'py-2'} ${isExtension ? 'min-w-[180px]' : 'min-w-[220px]'}`}>
            {/* Note Details Header */}
            <div className={`${isExtension ? 'px-2 py-1.5' : 'px-3 py-2'} border-b border-gray-200 dark:border-gray-600`}>
              <div className={`flex items-center ${isExtension ? 'space-x-1.5' : 'space-x-2'} text-gray-700 dark:text-gray-300 text-left`}>
                <Info className={`${isExtension ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />
                <span className={`font-medium ${isExtension ? 'text-xs' : 'text-sm'} text-left`}>Note Details</span>
              </div>
            </div>

            {/* Created Date */}
            <div className={`${isExtension ? 'px-2 py-1.5' : 'px-3 py-2'}`}>
              <div className={`flex items-center ${isExtension ? 'space-x-1.5' : 'space-x-2'} ${isExtension ? 'mb-0.5' : 'mb-1'} text-gray-600 dark:text-gray-400 text-left`}>
                <Calendar className={`${isExtension ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />
                <span className={`font-medium ${isExtension ? 'text-xs' : 'text-sm'} text-left`}>Created:</span>
              </div>
              <div className={`${isExtension ? 'ml-5 text-xs' : 'ml-6 text-sm'} text-left text-gray-700 dark:text-gray-300`}>
                {new Date(note.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: '2-digit'
                }).replace(',', '-')} {new Date(note.createdAt).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                }).toLowerCase()}
              </div>
            </div>

            {/* Updated Date */}
            <div className={`${isExtension ? 'px-2 py-1.5' : 'px-3 py-2'}`}>
              <div className={`flex items-center ${isExtension ? 'space-x-1.5' : 'space-x-2'} ${isExtension ? 'mb-0.5' : 'mb-1'} text-gray-600 dark:text-gray-400 text-left`}>
                <Clock className={`${isExtension ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />
                <span className={`font-medium ${isExtension ? 'text-xs' : 'text-sm'} text-left`}>Updated:</span>
              </div>
              <div className={`${isExtension ? 'ml-5 text-xs' : 'ml-6 text-sm'} text-left text-gray-700 dark:text-gray-300`}>
                {new Date(note.updatedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: '2-digit'
                }).replace(',', '-')} {new Date(note.updatedAt).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                }).toLowerCase()}
              </div>
            </div>

            {/* Note Stats */}
            <div className={`${isExtension ? 'px-2 py-1.5' : 'px-3 py-2'} border-b border-gray-200 dark:border-gray-600`}>
              <div className={`flex items-center justify-between ${isExtension ? 'text-xs' : 'text-sm'} text-gray-600 dark:text-gray-400`}>
                <span>Characters: {(note.title + (note.description || '')).length}</span>
                <span>Words: {(note.title + ' ' + (note.description || '')).trim().split(/\s+/).length}</span>
              </div>
            </div>

            {/* Community Info */}
            {note.isCommunity && (
              <div className={`${isExtension ? 'px-2 py-1.5' : 'px-3 py-2'} border-b border-gray-200 dark:border-gray-600`}>
                <div className={`flex items-center justify-between ${isExtension ? 'mb-1.5' : 'mb-2'}`}>
                  <div className={`flex items-center ${isExtension ? 'space-x-1.5' : 'space-x-2'} text-gray-600 dark:text-gray-400`}>
                    <Users className={`${isExtension ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />
                    <span className={`font-medium ${isExtension ? 'text-xs' : 'text-sm'}`}>Community Note</span>
                  </div>
                  <button
                    onClick={handleRefreshCommunity}
                    disabled={isRefreshingCommunity}
                    className={`${isExtension ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'} bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-800/40 text-blue-700 dark:text-blue-300 rounded transition-colors disabled:opacity-50 flex items-center ${isExtension ? 'space-x-0.5' : 'space-x-1'}`}
                    title="Refresh community members"
                  >
                    <RefreshCw className={`${isExtension ? 'h-2.5 w-2.5' : 'h-3 w-3'} ${isRefreshingCommunity ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>
                <div className={`${isExtension ? 'ml-5 text-xs' : 'ml-6 text-sm'} text-gray-700 dark:text-gray-300`}>
                  {note.memberCount || 0} member{(note.memberCount || 0) !== 1 ? 's' : ''}
                  {note.communityMembers && note.communityMembers.length > 0 && (
                    <div className={`${isExtension ? 'mt-0.5 text-[10px]' : 'mt-1 text-xs'} text-gray-500 dark:text-gray-400`}>
                      Latest: {note.communityMembers.slice(0, 3).map(member => member.displayName.split(' ')[0]).join(', ')}
                    </div>
                  )}
                </div>
                
                {/* Leave Community Button */}
                <div className={`${isExtension ? 'mt-2 pt-2' : 'mt-3 pt-3'} border-t border-gray-200 dark:border-gray-600`}>
                  <button
                    onClick={handleLeaveCommunity}
                    disabled={isLeavingCommunity}
                    className={`w-full ${isExtension ? 'px-2 py-1.5' : 'px-3 py-2'} text-left hover:bg-orange-50 dark:hover:bg-orange-900/20 flex items-center text-orange-600 dark:text-orange-400 transition-colors disabled:opacity-50 rounded`}
                  >
                    <UserMinus className={`${isExtension ? 'h-3.5 w-3.5 mr-2' : 'h-4 w-4 mr-3'}`} />
                    <span className={`${isExtension ? 'text-xs' : 'text-sm'} font-medium`}>
                      {isLeavingCommunity ? 'Leaving...' : 'Leave Community'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Delete Button - Only show for note owners */}
            {isNoteOwner() && (
              <button
                onClick={handleDelete}
                className={`w-full ${isExtension ? 'px-2 py-2' : 'px-3 py-3'} text-left hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center text-red-600 transition-colors`}
              >
                <Trash2 className={`${isExtension ? 'h-3.5 w-3.5 mr-2' : 'h-4 w-4 mr-3'}`} />
                <span className={`${isExtension ? 'text-xs' : 'text-sm'} font-medium`}>Delete Note</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div 
        className={`${isExtension ? 'pr-16' : 'pr-20'} cursor-pointer text-left`}
        onClick={handleEdit}
      >
        <h3 className={`${isExtension ? 'text-sm' : 'text-base'} font-semibold text-gray-800 dark:text-gray-900 ${isExtension ? 'mb-1' : 'mb-2'} leading-tight text-left`}>
          {note.title || 'Untitled'}
        </h3>
        {note.description && (
          <p className={`text-gray-700 dark:text-gray-800 ${isExtension ? 'text-xs mb-2' : 'text-sm mb-3'} leading-relaxed text-left`}>
            {truncateText(note.description, isExtension ? 80 : 100)}
          </p>
        )}
        
        <div className={`flex items-center justify-between ${isExtension ? 'gap-1 text-[10px]' : 'gap-2 text-xs'} text-gray-600 dark:text-gray-700`}>
          <span className="text-left">
            {new Date(note.updatedAt).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })}
          </span>
          <div className={`flex items-center flex-wrap ${isExtension ? 'gap-1' : 'gap-2'} justify-end`}>
            {note.isCommunity && note.memberCount && (
              <div className="flex items-center space-x-1 bg-blue-100 dark:bg-blue-900/20 px-2 py-1 rounded-full">
                <Users className="h-3 w-3 text-blue-600" />
                <span className="font-medium text-blue-600 text-left">{note.memberCount}</span>
              </div>
            )}
            {/* Community Avatars */}
            {note.isCommunity && note.communityMembers && note.communityMembers.length > 0 && (
              <CommunityAvatars members={note.communityMembers} />
            )}
            {/* Visibility Indicator */}
            {note.visibility && note.visibility !== 'private' && (
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs text-left ${
                note.visibility === 'public' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' :
                note.visibility === 'community' ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400' :
                ''
              }`}>
                {note.visibility === 'public' ? (
                  <>
                    <Globe className="h-3 w-3" />
                    <span className="text-left">Public</span>
                  </>
                ) : note.visibility === 'community' ? (
                  <>
                    <Users className="h-3 w-3" />
                    <span className="text-left">Community</span>
                  </>
                ) : null}
              </div>
            )}
            {/* Shared/Collaborative Indicator */}
            {(note.isShared || note.isCommunity) && (
              <div className="flex items-center space-x-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-full text-xs">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse mr-1"></div>
                <Share2 className="h-3 w-3" />
                <span className="text-left">{note.isCommunity ? 'Community' : 'Shared'}</span>
              </div>
            )}
            {/* Collaborators Chips - Show after Shared chip */}
            {note.isShared && (note.shareType === 'private' || sharedNoteData?.shareType === 'private') && sharedNoteData && (
              <>
                {sharedNoteData.collaborators && sharedNoteData.collaborators.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCollaboratorModal(true);
                    }}
                    className="flex items-center space-x-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 px-2 py-1 rounded-full text-xs hover:bg-purple-200 dark:hover:bg-purple-800/30 transition-colors text-left"
                    title="Manage collaborators"
                  >
                    <Users className="h-3 w-3" />
                    <span className="text-left">Collaborators({sharedNoteData.collaborators.length})</span>
                    {isOwner() && <Settings className="h-3 w-3 ml-1" />}
                  </button>
                )}
              </>
            )}
            {note.isPinned && (
              <div className="flex items-center space-x-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded-full text-xs">
                <Pin className="h-3 w-3" />
                <span className="text-left">Pinned</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Collaborators Management Modal */}
      {showCollaboratorModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowCollaboratorModal(false)}
        >
          <div 
            ref={collaboratorModalRef}
            className="bg-white dark:bg-dark-card rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center space-x-2 text-left">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white text-left">
                  Manage Collaborators
                </h2>
                {sharedNoteData?.collaborators && (
                  <span className="text-sm text-gray-500 dark:text-gray-400 text-left">
                    ({sharedNoteData.collaborators.length})
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowCollaboratorModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isLoadingCollaborators ? (
                <div className="text-left py-8 text-sm text-gray-500 dark:text-gray-400">
                  Loading collaborators...
                </div>
              ) : (
                <>
                  {/* Owner */}
                  {sharedNoteData && (
                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {sharedNoteData.ownerName?.charAt(0) || sharedNoteData.ownerEmail?.charAt(0) || 'O'}
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-medium text-gray-900 dark:text-white text-left">
                            {sharedNoteData.ownerName || sharedNoteData.ownerEmail}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 text-left">Owner</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Collaborators List */}
                  {sharedNoteData?.collaborators && sharedNoteData.collaborators.length > 0 ? (
                    sharedNoteData.collaborators.map((collaborator, index) => (
                      <div
                        key={collaborator.email || index}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
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
                        {isOwner() && (
                          <div className="flex items-center space-x-2">
                            {/* Permission Dropdown */}
                            <select
                              value={collaborator.permission || 'edit'}
                              onChange={(e) => handleUpdatePermission(collaborator.email, e.target.value as 'view' | 'edit')}
                              className="text-xs px-2 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 text-left"
                            >
                              <option value="view">View</option>
                              <option value="edit">Edit</option>
                            </select>
                            {/* Remove Button */}
                            <button
                              onClick={() => handleRemoveCollaborator(collaborator.email)}
                              className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                              title="Remove collaborator"
                            >
                              <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-left py-8 text-sm text-gray-500 dark:text-gray-400">
                      No collaborators yet
                    </div>
                  )}

                  {/* Add Collaborator (Owner Only) */}
                  {isOwner() && (
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
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
                          <UserPlus className="h-4 w-4" />
                          <span>{isAddingCollaborator ? '...' : 'Add'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          note={note}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
};

export default NoteCard;