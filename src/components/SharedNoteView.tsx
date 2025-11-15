import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Share2, Lock, ArrowLeft, ExternalLink, Download, Edit, Check, X, Users, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SharingService from '../services/sharingService';
import ShareSettings from './ShareSettings';
import ShareStatus from './ShareStatus';
import CommunityPanel from './CommunityPanel';
import CommunityAvatars from './CommunityAvatars';
import type { SharedNote, NoteColor } from '../types';

const colorClasses: Record<NoteColor, string> = {
  yellow: 'bg-note-yellow border-yellow-300',
  blue: 'bg-note-blue border-blue-300',
  green: 'bg-note-green border-green-300',
  pink: 'bg-note-pink border-pink-300',
  purple: 'bg-note-purple border-purple-300',
  orange: 'bg-note-orange border-orange-300',
};

const SharedNoteView: React.FC = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const [sharedNote, setSharedNote] = useState<SharedNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [requiresLogin, setRequiresLogin] = useState(false);
  const [isCommunityNote, setIsCommunityNote] = useState(false);
  const [browserInfo, setBrowserInfo] = useState<{name: string, canInstall: boolean, isExtensionInstalled: boolean, isWeb: boolean}>({
    name: '', 
    canInstall: false, 
    isExtensionInstalled: false,
    isWeb: false
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!shareId) {
      setError('Invalid share link');
      setLoading(false);
      return;
    }

    // Detect if we're running in extension context or web
    const isExtensionContext = window.location.protocol === 'chrome-extension:';
    const isWeb = !isExtensionContext && (window.location.protocol === 'http:' || window.location.protocol === 'https:');
    
    // Detect if extension is installed
    let isExtensionInstalled = false;
    if (isExtensionContext) {
      // We're in extension context, so extension is installed
      isExtensionInstalled = true;
    } else if (isWeb && typeof chrome !== 'undefined' && chrome.runtime) {
      // On web, try to detect if extension is installed
      // Check if we can access chrome.runtime (this means extension might be installed)
      // But we need to actually check if our specific extension is installed
      // For now, we'll use a simple check: if chrome.runtime exists, assume extension might be installed
      // But we'll show the button anyway and let the store handle it
      // A better approach would be to check for a specific extension ID
      isExtensionInstalled = false; // Default to false, show button to let user install
    }

    // Detect browser and check if extension can be installed
    const userAgent = navigator.userAgent;
    let browserName = 'Browser';
    let canInstall = false;

    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      browserName = 'Chrome';
      canInstall = true;
    } else if (userAgent.includes('Firefox')) {
      browserName = 'Firefox';
      canInstall = true;
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      browserName = 'Safari';
      canInstall = true;
    } else if (userAgent.includes('Edg')) {
      browserName = 'Edge';
      canInstall = true;
    }

    setBrowserInfo({ 
      name: browserName, 
      canInstall: canInstall && isWeb && !isExtensionInstalled,
      isExtensionInstalled,
      isWeb
    });
    
    // Wait for auth to finish loading before checking permissions
    if (!authLoading) {
      loadSharedNote();
    }
  }, [shareId, user, authLoading]);

  // Periodic refresh to show updates from other collaborators (only when not editing)
  useEffect(() => {
    if (!shareId || isEditing || loading || !sharedNote) return;

    const refreshSharedNote = async () => {
      try {
        // Get latest version without showing loading state
        let noteData = await SharingService.getSharedNote(shareId!);
        let isCommunity = false;

        if (!noteData) {
          const communityNote = await SharingService.getCommunityNote(shareId!);
          noteData = communityNote;
          isCommunity = communityNote?.isCommunity || false;
        }

        if (noteData && !isEditing) {
          // Only update if content changed (to avoid unnecessary re-renders)
          if (
            noteData.title !== sharedNote.title ||
            noteData.description !== sharedNote.description ||
            noteData.lastEditedAt?.getTime() !== sharedNote.lastEditedAt?.getTime()
          ) {
            setSharedNote(noteData);
            setIsCommunityNote(isCommunity);
            // Update editing state if not currently editing
            if (!isEditing) {
              setEditedTitle(noteData.title);
              setEditedDescription(noteData.description);
            }
            console.log('🔄 Shared note refreshed with latest updates');
          }
        }
      } catch (err) {
        console.warn('Error refreshing shared note:', err);
        // Don't show error for background refresh
      }
    };

    const interval = setInterval(refreshSharedNote, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [shareId, isEditing, loading, sharedNote]);

  const loadSharedNote = async () => {
    try {
      setLoading(true);
      setError('');

      // First try to get it as a regular shared note
      let noteData = await SharingService.getSharedNote(shareId!);
      let isCommunity = false;

      // If not found as regular note, try as community note
      if (!noteData) {
        const communityNote = await SharingService.getCommunityNote(shareId!);
        noteData = communityNote;
        isCommunity = communityNote?.isCommunity || false;
      }
      
      if (!noteData) {
        setError('This note is no longer available or has expired.');
        return;
      }

      // For public notes, allow access immediately
      if (noteData.shareType === 'public') {
        setSharedNote(noteData);
        setIsCommunityNote(isCommunity);
        setRequiresLogin(false);
        setEditedTitle(noteData.title);
        setEditedDescription(noteData.description);
        return;
      }

      // For private notes, check if user is authenticated
      // Wait a bit more if auth is still loading
      if (authLoading) {
        // Wait for auth to complete
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Check access permissions for private notes
      if (noteData.shareType === 'private' && !user) {
        setRequiresLogin(true);
        setError('This is a private note. Please log in to view it.');
        return;
      }

      // User is authenticated or note is public - allow access
      setSharedNote(noteData);
      setIsCommunityNote(isCommunity);
      setRequiresLogin(false);
      
      // Initialize editing state
      setEditedTitle(noteData.title);
      setEditedDescription(noteData.description);
    } catch (err) {
      console.error('Error loading shared note:', err);
      setError('Failed to load the shared note. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canEdit = () => {
    if (!sharedNote || !user) return false;

    return SharingService.canEditSharedNote(sharedNote, user.email, user.id);
  };

  const isCollaborator = () => {
    if (!sharedNote || !user) return false;
    
    // Check if user is the owner
    if (
      (user.email && (sharedNote.ownerEmail === user.email || sharedNote.ownerEmail?.toLowerCase() === user.email.toLowerCase())) ||
      (user.id && sharedNote.ownerId === user.id)
    ) {
      return false; // Owner is not a collaborator
    }
    
    // Check if user is in collaborators list
    if (sharedNote.collaborators && sharedNote.collaborators.length > 0) {
      return sharedNote.collaborators.some((c: any) => 
        c.email === user.email || c.email?.toLowerCase() === user.email?.toLowerCase()
      );
    }
    
    return false;
  };

  const handleLeave = async () => {
    if (!sharedNote || !user || !shareId) return;

    if (!confirm('Are you sure you want to leave this shared note? You will no longer have access to it.')) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      await SharingService.leaveSharedNote(shareId, user.email || '');
      
      console.log('✅ Successfully left shared note');
      
      // Redirect to app after leaving
      handleGoToApp();
    } catch (err) {
      console.error('Error leaving shared note:', err);
      setError('Failed to leave shared note. Please try again.');
      setLoading(false);
    }
  };

  const handleEdit = () => {
    // For private notes, require login before editing
    if (sharedNote?.shareType === 'private' && !user) {
      setRequiresLogin(true);
      setError('Please log in to edit this private note.');
      return;
    }
    
    setIsEditing(true);
    setEditedTitle(sharedNote?.title || '');
    setEditedDescription(sharedNote?.description || '');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedTitle(sharedNote?.title || '');
    setEditedDescription(sharedNote?.description || '');
  };

  const handleSaveChanges = async () => {
    if (!sharedNote || !user) {
      setError('Please log in to save changes.');
      setRequiresLogin(true);
      setIsEditing(false);
      return;
    }

    // For private notes, ensure user is logged in
    if (sharedNote.shareType === 'private' && !user) {
      setError('Please log in to edit this private note.');
      setRequiresLogin(true);
      setIsEditing(false);
      return;
    }

    try {
      setIsSaving(true);
      setError('');

      // Update the shared note
      await SharingService.updateSharedNoteContent(shareId!, {
        title: editedTitle,
        description: editedDescription,
        lastEditedBy: user.displayName || user.email,
        lastEditedByEmail: user.email || '',
        lastEditedAt: new Date()
      });

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
      setError('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoToApp = () => {
    const baseUrl = import.meta.env.VITE_WEB_APP_URL || window.location.origin;
    window.location.href = baseUrl;
  };

  const handleDownloadExtension = () => {
    let storeUrl = '';
    
    switch (browserInfo.name) {
      case 'Chrome':
        storeUrl = 'https://chrome.google.com/webstore/category/extensions';
        break;
      case 'Firefox':
        storeUrl = 'https://addons.mozilla.org/firefox/';
        break;
      case 'Safari':
        storeUrl = 'https://apps.apple.com/us/story/id1377753262';
        break;
      case 'Edge':
        storeUrl = 'https://microsoftedge.microsoft.com/addons/category/Edge-Extensions';
        break;
      default:
        storeUrl = 'https://chrome.google.com/webstore/category/extensions';
    }
    
    window.open(storeUrl, '_blank');
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {authLoading ? 'Checking authentication...' : 'Loading shared note...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-dark-card rounded-lg shadow-lg p-6 text-center">
          <div className="mb-4">
            {requiresLogin ? (
              <Lock className="h-12 w-12 text-orange-500 mx-auto" />
            ) : (
              <Share2 className="h-12 w-12 text-gray-400 mx-auto" />
            )}
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {requiresLogin ? 'Login Required' : 'Note Not Found'}
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error}
          </p>
          
          <button
            onClick={handleGoToApp}
            className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <ExternalLink className="h-4 w-4" />
            <span>{requiresLogin ? 'Go to App & Login' : 'Go to App'}</span>
          </button>
        </div>
      </div>
    );
  }

  if (!sharedNote) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
      {/* Header */}
      <header className="bg-white dark:bg-dark-card shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleGoToApp}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Go to Live Notes"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            
            <div className="flex items-center space-x-2">
              <Share2 className="h-6 w-6 text-blue-500" />
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                Shared Note
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <ShareStatus 
              sharedNote={sharedNote} 
              isCommunity={isCommunityNote} 
            />

            {user && (sharedNote.ownerEmail === user.email || sharedNote.ownerId === user.id) && (
              <ShareSettings
                sharedNote={sharedNote}
                onUpdate={(updatedNote) => setSharedNote(updatedNote)}
                isOwner={true}
              />
            )}

            {/* Leave button for collaborators */}
            {user && isCollaborator() && (
              <button
                onClick={handleLeave}
                disabled={loading}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-lg transition-colors flex items-center space-x-2"
                title="Leave this shared note"
              >
                <LogOut className="h-4 w-4" />
                <span>Leave</span>
              </button>
            )}

            {browserInfo.canInstall && (
              <button
                onClick={handleDownloadExtension}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Get {browserInfo.name} Extension</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Collaborative Status Bar */}
      {sharedNote.shareType === 'private' && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-300">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">✨ Collaborative Editing</span>
                <span className="text-xs opacity-75">
                  {user 
                    ? (sharedNote.allowEditing ? '• Anyone with access can edit this note' : '• View only - editing disabled by owner')
                    : '• Login required to edit this note'
                  }
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {!user ? (
                  <button
                    onClick={handleGoToApp}
                    className="px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center space-x-1"
                  >
                    <Lock className="h-3 w-3" />
                    <span>Login to Edit</span>
                  </button>
                ) : (
                  <div className="flex items-center space-x-2 text-xs text-blue-600 dark:text-blue-400">
                    <Users className="h-4 w-4" />
                    <span>
                      {sharedNote.collaborators ? sharedNote.collaborators.length + 1 : 1} collaborators
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Note Content */}
          <div className={`
            p-6 rounded-lg border-2 shadow-sm relative
            ${colorClasses[sharedNote.color]}
          `}>
            {/* Edit Button or Login Prompt */}
            {sharedNote.shareType === 'private' && !user ? (
              <div className="absolute top-4 right-4">
                <button
                  onClick={handleGoToApp}
                  className="px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center space-x-2"
                  title="Login required to edit"
                >
                  <Lock className="w-4 h-4" />
                  <span>Login to Edit</span>
                </button>
              </div>
            ) : canEdit() ? (
              <div className="absolute top-4 right-4">
                {!isEditing ? (
                  <button
                    onClick={handleEdit}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit note"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSaveChanges}
                      disabled={isSaving}
                      className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Save changes"
                    >
                      {isSaving ? (
                        <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Check className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Cancel editing"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            ) : null}

            {/* Title */}
            {isEditing ? (
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full text-2xl font-bold text-gray-800 dark:text-gray-900 mb-4 bg-transparent border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-left"
                placeholder="Note title"
              />
            ) : (
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-900 mb-4 pr-12 text-left">
                {sharedNote.title || 'Untitled'}
              </h2>
            )}
            
            {/* Description */}
            {isEditing ? (
              <textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className="w-full h-64 text-gray-700 dark:text-gray-800 bg-transparent border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical text-left"
                placeholder="Note content"
              />
            ) : (
              sharedNote.description && (
                <div className="prose prose-gray dark:prose-invert max-w-none text-left">
                  <pre className="whitespace-pre-wrap font-sans text-gray-700 dark:text-gray-800 leading-relaxed text-left">
                    {sharedNote.description}
                  </pre>
                </div>
              )
            )}

            {/* Note metadata */}
            <div className="mt-6 pt-4 border-t border-gray-300 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span>
                    Shared by <strong>{sharedNote.ownerName}</strong>
                  </span>
                  <span>
                    {new Date(sharedNote.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {/* Community Avatars for community notes */}
                {isCommunityNote && 'members' in sharedNote && (sharedNote as any).members && (
                  <CommunityAvatars members={(sharedNote as any).members} />
                )}
              </div>
            </div>
          </div>

          {/* Community Panel */}
          {isCommunityNote && shareId && (
            <CommunityPanel shareId={shareId} />
          )}

          {/* Call to action */}
          <div className="bg-white dark:bg-dark-card rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Create Your Own Notes
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Start organizing your thoughts with Live Notes. Create, share, and collaborate on notes easily.
            </p>
            <button
              onClick={handleGoToApp}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
            >
              Get Started
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SharedNoteView;