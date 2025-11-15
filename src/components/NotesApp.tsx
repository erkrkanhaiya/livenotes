import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotes } from '../contexts/NotesContext';
import { useTheme } from '../contexts/ThemeContext';
import Header from './Header';
import NotesList from './NotesList';
import SharedNoteCard from './SharedNoteCard';
// import AddNoteButton from './AddNoteButton';
import NoteModal from './NoteModal';
import SearchBar from './SearchBar';
import FilterBar from './FilterBar';
import SettingsModal from './SettingsModal';
import GroupList from './GroupList';
import GroupModal from './GroupModal';
import GroupShareModal from './GroupShareModal';
import GroupsService from '../services/groupsService';
import { FolderPlus, Plus, ExternalLink } from 'lucide-react';
import type { Note, Group } from '../types';

const NotesApp: React.FC = () => {
  const { user } = useAuth();
  const { 
    notes, 
    sharedWithMeNotes, 
    searchQuery, 
    filterColor, 
    isLoading, 
    error,
    groups,
    selectedGroupId,
    setSelectedGroupId,
    createGroup,
    updateGroup,
    deleteGroup,
    // shareGroup,
    refreshGroups,
    // addNoteToGroup,
    // removeNoteFromGroup,
    toggleGroupPin,
    leaveGroup,
  } = useNotes();
  const { isDarkMode } = useTheme();
  
  const isExtension = typeof chrome !== 'undefined' && chrome.runtime && !window.location.protocol.startsWith('http');
  
  // Drawer state - hidden by default in extension, visible in web
  const [isDrawerOpen, setIsDrawerOpen] = useState(!isExtension);
  
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [showGroupShareModal, setShowGroupShareModal] = useState(false);
  const [sharingGroup, setSharingGroup] = useState<Group | null>(null);

  // Filter notes based on search query, color filter, and selected group
  const filteredNotes = notes.filter(note => {
    const matchesSearch = searchQuery === '' || 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesColor = filterColor === 'all' || note.color === filterColor;
    
    // If a group is selected, show only notes in that group
    // If no group is selected, show all notes (including those without groups)
    const matchesGroup = selectedGroupId === null || note.groupId === selectedGroupId;
    
    return matchesSearch && matchesColor && matchesGroup;
  });

  // Sort notes: pinned first, then by updated date
  const sortedNotes = filteredNotes.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const handleCreateNote = () => {
    setEditingNote(null);
    setShowNoteModal(true);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setShowNoteModal(true);
  };

  const handleCloseModal = () => {
    setShowNoteModal(false);
    setEditingNote(null);
  };

  const handleCreateGroup = () => {
    setEditingGroup(null);
    setShowGroupModal(true);
  };

  const handleEditGroup = (group: Group) => {
    setEditingGroup(group);
    setShowGroupModal(true);
  };

  const handleCloseGroupModal = () => {
    setShowGroupModal(false);
    setEditingGroup(null);
  };

  const handleShareGroup = (group: Group) => {
    setSharingGroup(group);
    setShowGroupShareModal(true);
  };

  const handleCloseGroupShareModal = () => {
    setShowGroupShareModal(false);
    setSharingGroup(null);
  };


  return (
    <div className={`h-full flex flex-col bg-white dark:bg-dark-bg transition-colors ${isDarkMode ? 'dark' : ''}`}>
      <Header onSettings={() => setShowSettings(true)} />
      
      <div className="flex-1 flex overflow-hidden relative">
        {/* Drawer Overlay - Only visible when drawer is open in extension mode */}
        {isExtension && isDrawerOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setIsDrawerOpen(false)}
          />
        )}

        {/* Groups Sidebar - Collapsible Drawer */}
        {!user?.isGuest && (
          <>
            {/* Drawer Sidebar */}
            <div
              className={`
                ${isExtension ? 'absolute' : 'relative'} 
                ${isExtension ? 'left-0 top-0 bottom-0 z-50' : ''}
                ${isExtension ? (isDrawerOpen ? 'w-56' : 'w-0') : (isDrawerOpen ? 'w-64' : 'w-0')}
                border-r border-gray-200 dark:border-dark-border 
                bg-white dark:bg-dark-card 
                flex flex-col shrink-0
                transition-all duration-300 ease-in-out
                ${isExtension ? 'shadow-lg' : ''}
                overflow-hidden
              `}
            >
              <div className={`${isExtension ? 'p-2' : 'p-4'} border-b border-gray-200 dark:border-dark-border flex-shrink-0`}>
                <div className="flex items-center justify-between">
                  <h3 className={`${isExtension ? 'text-xs' : 'text-sm'} font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide`}>
                    Groups
                  </h3>
                  <button
                    onClick={handleCreateGroup}
                    className={`${isExtension ? 'p-1.5' : 'p-2'} bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors`}
                    title="Create new group"
                  >
                    <FolderPlus className={`${isExtension ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />
                  </button>
                </div>
              </div>
              <div className={`flex-1 overflow-y-auto ${isExtension ? 'p-1.5' : 'p-3'}`}>
                <GroupList
                  groups={groups}
                  selectedGroupId={selectedGroupId}
                  onSelectGroup={(groupId) => {
                    setSelectedGroupId(groupId);
                    // Close drawer in extension mode after selection
                    if (isExtension) {
                      setIsDrawerOpen(false);
                    }
                  }}
                  onEditGroup={handleEditGroup}
                  onDeleteGroup={deleteGroup}
                  onShareGroup={handleShareGroup}
                  onTogglePin={toggleGroupPin}
                  onLeaveGroup={leaveGroup}
                />
              </div>
            </div>
          </>
        )}

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Search and Filter - Responsive */}
          <div className={`${isExtension ? 'px-2.5 py-1.5' : 'px-4 sm:px-6 py-4 sm:py-5'} border-b border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card`}>
            <div className={isExtension ? 'mb-1.5' : 'mb-4'}>
              <SearchBar 
                onMenuClick={() => setIsDrawerOpen(!isDrawerOpen)}
                showMenuButton={isExtension && !user?.isGuest}
              />
            </div>
            <FilterBar />
          </div>

          <div className={`flex-1 overflow-auto ${isExtension ? 'p-2' : 'p-5'}`}>
          {user?.isGuest && (
            <div className={`mb-2 ${isExtension ? 'p-2' : 'p-4'} bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className={`text-orange-800 dark:text-orange-200 ${isExtension ? 'text-xs' : 'text-sm'} font-medium`}>
                    📝 Guest Mode
                  </p>
                  <p className={`text-orange-600 dark:text-orange-300 ${isExtension ? 'text-[10px]' : 'text-xs'} mt-1`}>
                    Notes are saved locally. Sign in to sync across devices.
                  </p>
                </div>
                <button
                  onClick={() => setShowSettings(true)}
                  className={`${isExtension ? 'px-2 py-1 text-[10px]' : 'px-3 py-1.5 text-xs'} bg-orange-500 hover:bg-orange-600 text-white rounded-md font-medium transition-colors`}
                >
                  Sign In
                </button>
              </div>
            </div>
          )}
          
          {error && (
            <div className={`mb-2 ${isExtension ? 'p-2' : 'p-3.5'} bg-red-100 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg`}>
              <p className={`text-red-700 dark:text-red-300 ${isExtension ? 'text-xs' : 'text-sm'}`}>{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-xs text-gray-600 dark:text-gray-400">Loading...</span>
            </div>
          ) : sortedNotes.length === 0 && sharedWithMeNotes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 text-xs">
                {searchQuery || filterColor !== 'all' 
                  ? 'No notes match your filter' 
                  : 'No notes yet. Create your first note!'}
              </p>
            </div>
          ) : (
            <div className={`${isExtension ? 'space-y-1.5' : 'space-y-4'}`}>
              {/* Group Filter Indicator - Responsive with Details */}
              {selectedGroupId && (() => {
                const selectedGroup = groups.find(g => g.id === selectedGroupId);
                if (!selectedGroup) return null;
                
                return (
                  <div className={`mb-1.5 ${isExtension ? 'p-1.5' : 'p-2.5'} bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-left`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={`text-blue-800 dark:text-blue-200 ${isExtension ? 'text-[10px]' : 'text-xs'} font-semibold truncate`}>
                            📁 {selectedGroup.name}
                          </span>
                        </div>
                        {selectedGroup.description && (
                          <p className={`text-blue-700 dark:text-blue-300 ${isExtension ? 'text-[9px]' : 'text-[10px]'} truncate`}>
                            {selectedGroup.description}
                          </p>
                        )}
                        <div className={`flex items-center gap-2 mt-1 ${isExtension ? 'text-[9px]' : 'text-[10px]'} text-blue-600 dark:text-blue-400`}>
                          <span>{selectedGroup.noteCount || 0} notes</span>
                          {selectedGroup.isShared && selectedGroup.collaborators && selectedGroup.collaborators.length > 0 && (
                            <span>• {selectedGroup.collaborators.length} collaborator{selectedGroup.collaborators.length !== 1 ? 's' : ''}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedGroupId(null)}
                        className={`${isExtension ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'} bg-blue-500 hover:bg-blue-600 text-white rounded font-medium transition-colors flex-shrink-0`}
                      >
                        Show All
                      </button>
                    </div>
                  </div>
                );
              })()}
              
              {/* My Notes Section - Responsive */}
              {sortedNotes.length > 0 && (
                <div>
                  <h2 className={`${isExtension ? 'text-xs' : 'text-sm'} font-bold text-gray-800 dark:text-white ${isExtension ? 'mb-1.5' : 'mb-2'} flex items-center text-left`}>
                    <span className={isExtension ? 'mr-1' : 'mr-1.5'}>📝</span>
                    {selectedGroupId ? 'Group Notes' : 'My Notes'}
                    <span className={`ml-2 ${isExtension ? 'text-[10px]' : 'text-xs'} text-gray-500 dark:text-gray-400 font-normal`}>
                      ({sortedNotes.length})
                    </span>
                  </h2>
                  <NotesList notes={sortedNotes} onEditNote={handleEditNote} />
                </div>
              )}

              {/* Shared with Me Section - Responsive */}
              {sharedWithMeNotes.length > 0 && (
                <div className={isExtension ? 'mt-3' : 'mt-4'}>
                  <h2 className={`${isExtension ? 'text-xs' : 'text-sm'} font-bold text-gray-800 dark:text-white ${isExtension ? 'mb-1.5' : 'mb-2'} flex items-center text-left`}>
                    <span className={isExtension ? 'mr-1' : 'mr-1.5'}>🤝</span>
                    Shared with Me
                    <span className={`ml-2 ${isExtension ? 'text-[10px]' : 'text-xs'} text-gray-500 dark:text-gray-400 font-normal`}>
                      ({sharedWithMeNotes.length})
                    </span>
                  </h2>
                  <div className={`grid grid-cols-1 ${isExtension ? 'gap-1.5' : 'gap-2'}`}>
                    {sharedWithMeNotes.map((sharedNote, index) => (
                      <SharedNoteCard
                        key={sharedNote.id}
                        sharedNote={sharedNote}
                        animationDelay={index * 0.05}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          </div>

          {/* Add Note Button - Compact */}
          <div className={`${isExtension ? 'p-2 pt-1.5' : 'p-5 pt-4'} border-t border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card`}>
            <button
              onClick={handleCreateNote}
              className={`w-full flex items-center justify-center ${isExtension ? 'px-3 py-2' : 'px-4 py-3'} bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold ${isExtension ? 'text-xs' : 'text-sm'} transition-colors shadow-sm`}
            >
              <Plus className={`${isExtension ? 'h-3.5 w-3.5 mr-1.5' : 'h-4 w-4 mr-2'}`} />
              Add New Note
            </button>
          </div>

          {/* Web View Link - Only in extension */}
          {isExtension && (
            <div className={`${isExtension ? 'pt-1.5 pb-1.5 px-2' : 'pt-4 pb-3 px-3'} border-t border-gray-200 dark:border-dark-border`}>
              <button
                onClick={() => {
                  const webUrl = import.meta.env.VITE_WEB_APP_URL || 'https://livenote-ruddy.vercel.app/';
                  window.open(webUrl, '_blank');
                }}
                className="flex items-center gap-1.5 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors cursor-pointer"
              >
                <ExternalLink className={`${isExtension ? 'h-3 w-3' : 'h-3.5 w-3.5'}`} />
                <span className={`${isExtension ? 'text-xs' : 'text-sm'} underline`}>
                  Use this in web view
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {showNoteModal && (
        <NoteModal
          note={editingNote}
          onClose={handleCloseModal}
        />
      )}

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
        />
      )}

      {showGroupModal && (
        <GroupModal
          group={editingGroup}
          onClose={handleCloseGroupModal}
          onCreateGroup={createGroup}
          onUpdateGroup={updateGroup}
        />
      )}

      {showGroupShareModal && sharingGroup && (
        <GroupShareModal
          group={sharingGroup}
          isOpen={showGroupShareModal}
          onClose={handleCloseGroupShareModal}
          onShareUpdate={async () => {
            // Refresh groups after sharing to get updated shareId
            await refreshGroups();
            // Update the sharingGroup state with the latest group data
            const updatedGroups = await GroupsService.getUserGroups(user?.id || '');
            const updatedGroup = updatedGroups.find(g => g.id === sharingGroup.id);
            if (updatedGroup) {
              setSharingGroup(updatedGroup);
            }
          }}
        />
      )}

    </div>
  );
};

export default NotesApp;