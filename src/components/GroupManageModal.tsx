import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, FileText, Users, Settings } from 'lucide-react';
import type { Group, Note } from '../types';
// import GroupsService from '../services/groupsService';

interface GroupManageModalProps {
  group: Group;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  notes: Note[];
  onAddNoteToGroup: (groupId: string, noteId: string) => Promise<void>;
  onRemoveNoteFromGroup: (groupId: string, noteId: string) => Promise<void>;
}

const GroupManageModal: React.FC<GroupManageModalProps> = ({
  group,
  isOpen,
  onClose,
  onUpdate,
  notes,
  onAddNoteToGroup,
  onRemoveNoteFromGroup,
}) => {
  const [groupNotes, setGroupNotes] = useState<Note[]>([]);
  const [availableNotes, setAvailableNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'notes' | 'settings'>('notes');

  useEffect(() => {
    if (isOpen && group) {
      loadGroupData();
    }
  }, [isOpen, group]);

  const loadGroupData = async () => {
    if (!group) return;
    
    setIsLoading(true);
    try {
      // Get all note IDs in the group
      const noteIds = group.noteIds || [];
      
      // Filter notes that are in this group
      const notesInGroup = notes.filter(note => noteIds.includes(note.id));
      setGroupNotes(notesInGroup);
      
      // Get notes that are NOT in this group (available to add)
      const notesNotInGroup = notes.filter(note => 
        !noteIds.includes(note.id) && note.groupId !== group.id
      );
      setAvailableNotes(notesNotInGroup);
    } catch (error) {
      console.error('Error loading group data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = async (noteId: string) => {
    try {
      await onAddNoteToGroup(group.id, noteId);
      await loadGroupData();
      onUpdate();
    } catch (error) {
      console.error('Error adding note to group:', error);
      alert('Failed to add note to group');
    }
  };

  const handleRemoveNote = async (noteId: string) => {
    if (!confirm('Remove this note from the group?')) return;
    
    try {
      await onRemoveNoteFromGroup(group.id, noteId);
      await loadGroupData();
      onUpdate();
    } catch (error) {
      console.error('Error removing note from group:', error);
      alert('Failed to remove note from group');
    }
  };

  if (!isOpen || !group) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-border">
          <div className="flex items-center space-x-3">
            <Settings className="h-5 w-5 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Manage Group: {group.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-dark-border">
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === 'notes'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Notes ({groupNotes.length})</span>
            </div>
          </button>
          {group.isShared && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === 'settings'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Collaborators</span>
              </div>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading...</span>
            </div>
          ) : activeTab === 'notes' ? (
            <div className="space-y-6">
              {/* Notes in Group */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                  Notes in Group ({groupNotes.length})
                </h3>
                {groupNotes.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      No notes in this group yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {groupNotes.map((note) => (
                      <div
                        key={note.id}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-800 dark:text-white truncate">
                            {note.title || 'Untitled Note'}
                          </h4>
                          {note.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
                              {note.description}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveNote(note.id)}
                          className="ml-4 p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Remove from group"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Available Notes to Add */}
              {availableNotes.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                    Add Notes to Group
                  </h3>
                  <div className="space-y-2">
                    {availableNotes.map((note) => (
                      <div
                        key={note.id}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-800 dark:text-white truncate">
                            {note.title || 'Untitled Note'}
                          </h4>
                          {note.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
                              {note.description}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleAddNote(note.id)}
                          className="ml-4 p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Add to group"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Collaborator management coming soon
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200 dark:border-dark-border">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupManageModal;

