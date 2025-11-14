import React, { useState, useEffect } from 'react';
import { useNotes } from '../contexts/NotesContext';
import { useAuth } from '../contexts/AuthContext';
import { X, Save, Pin, Palette } from 'lucide-react';
import type { Note, NoteColor, CreateNoteData, UpdateNoteData } from '../types';

const colorOptions: { value: NoteColor; label: string; bg: string }[] = [
  { value: 'yellow', label: 'Yellow', bg: 'bg-note-yellow' },
  { value: 'blue', label: 'Blue', bg: 'bg-note-blue' },
  { value: 'green', label: 'Green', bg: 'bg-note-green' },
  { value: 'pink', label: 'Pink', bg: 'bg-note-pink' },
  { value: 'purple', label: 'Purple', bg: 'bg-note-purple' },
  { value: 'orange', label: 'Orange', bg: 'bg-note-orange' },
];

interface NoteModalProps {
  note?: Note | null;
  onClose: () => void;
}

const NoteModal: React.FC<NoteModalProps> = ({ note, onClose }) => {
  const { createNote, updateNote, selectedGroupId } = useNotes();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<NoteColor>('yellow');
  const [isPinned, setIsPinned] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedGroupIdLocal, setSelectedGroupIdLocal] = useState<string | null>(null);

  const isEditing = !!note;



  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setDescription(note.description);
      setColor(note.color);
      setIsPinned(note.isPinned);
      setSelectedGroupIdLocal(note.groupId || null);
    } else {
      setTitle('');
      setDescription('');
      setColor('yellow');
      setIsPinned(false);
      setSelectedGroupIdLocal(selectedGroupId);
    }
  }, [note, selectedGroupId]);

  const handleSave = async () => {
    if (!title.trim() && !description.trim()) {
      onClose();
      return;
    }

    try {
      setIsSaving(true);

      if (isEditing && note) {
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
              setIsSaving(false);
              return;
            }
          } catch (error) {
            console.error('Error checking edit permission:', error);
            // Allow edit to proceed if check fails (fail open)
          }
        }
        
        console.log('🔄 Updating note:', { noteId: note.id, updates: { title: title.trim(), description: description.trim(), color, isPinned } });
        
        const updates: UpdateNoteData = {
          title: title.trim(),
          description: description.trim(),
          color,
          isPinned,
        };
        await updateNote(note.id, updates);
        console.log('✅ Note updated successfully');
      } else {
        console.log('📝 Creating new note:', { title: title.trim(), description: description.trim(), color, isPinned, groupId: selectedGroupIdLocal });
        
        const newNote: CreateNoteData = {
          title: title.trim(),
          description: description.trim(),
          color,
          isPinned,
          groupId: selectedGroupIdLocal || undefined,
        };
        await createNote(newNote);
        console.log('✅ Note created successfully');
      }

      onClose();
    } catch (error) {
      console.error('❌ Error saving note:', error);
      // Show error to user
      alert(`Failed to ${isEditing ? 'update' : 'create'} note. Please try again.`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSave();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-dark-card rounded-lg shadow-xl animate-scale-in"
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white text-left">
            {isEditing ? 'Edit Note' : 'New Note'}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsPinned(!isPinned)}
              className={`p-2 rounded-lg transition-colors ${
                isPinned
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title={isPinned ? 'Unpin note' : 'Pin note'}
            >
              <Pin className="h-4 w-4" />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                title="Change color"
              >
                <Palette className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </button>
              {showColorPicker && (
                <div className="absolute right-0 top-12 bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-2 z-10">
                  <div className="grid grid-cols-3 gap-2">
                    {colorOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setColor(option.value);
                          setShowColorPicker(false);
                        }}
                        className={`w-8 h-8 rounded-lg border-2 transition-transform hover:scale-110 ${
                          option.bg
                        } ${
                          color === option.value
                            ? 'border-gray-800 dark:border-white'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                        title={option.label}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              <X className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Title */}
          <input
            type="text"
            placeholder="Note title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-lg font-semibold bg-transparent text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border-none outline-none resize-none text-left"
            autoFocus
          />

          {/* Description */}
          <textarea
            placeholder="Write your note here..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full bg-transparent text-gray-700 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-400 border-none outline-none resize-none text-left"
          />

          {/* Compact Share Status */}
          {isEditing && note && (note.isShared || note.isCommunity) && (
            <div className="flex items-center justify-between text-sm p-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-300 text-left">
                  {note.isCommunity ? `Community (${note.memberCount || 0} members)` : 'Shared'}
                </span>
              </div>
              {note.isShared && (
                <button
                  onClick={() => {
                    const shareUrl = `${window.location.origin}/share/${note.shareId}`;
                    navigator.clipboard.writeText(shareUrl);
                    alert('Link copied!');
                  }}
                  className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs transition-colors"
                >
                  Copy
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
          <div className="text-xs text-gray-500 dark:text-gray-400 text-left">
            {isEditing ? `Press Cmd+Enter to save` : 'Press Cmd+Enter to create'}
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg font-medium transition-colors"
          >
            {isSaving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isEditing ? 'Save' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoteModal;