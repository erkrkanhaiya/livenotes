import React, { useState, useEffect } from 'react';
import { X, Save, FolderPlus } from 'lucide-react';
import type { Group, CreateGroupData, UpdateGroupData } from '../types';

interface GroupModalProps {
  group?: Group | null;
  onClose: () => void;
  onCreateGroup: (data: CreateGroupData) => Promise<void>;
  onUpdateGroup?: (id: string, data: UpdateGroupData) => Promise<void>;
}

const GroupModal: React.FC<GroupModalProps> = ({ 
  group, 
  onClose, 
  onCreateGroup,
  onUpdateGroup 
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = !!group;

  useEffect(() => {
    if (group) {
      setName(group.name);
      setDescription(group.description || '');
    } else {
      setName('');
      setDescription('');
    }
  }, [group]);

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a group name');
      return;
    }

    try {
      setIsSaving(true);

      if (isEditing && group && onUpdateGroup) {
        await onUpdateGroup(group.id, {
          name: name.trim(),
          description: description.trim(),
        });
      } else {
        await onCreateGroup({
          name: name.trim(),
          description: description.trim(),
        });
      }

      onClose();
    } catch (error) {
      console.error('Error saving group:', error);
      alert(`Failed to ${isEditing ? 'update' : 'create'} group. Please try again.`);
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
          <div className="flex items-center space-x-2">
            <FolderPlus className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white text-left">
              {isEditing ? 'Edit Group' : 'New Group'}
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
        <div className="p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-left">
              Group Name *
            </label>
            <input
              type="text"
              placeholder="Enter group name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-left"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-left">
              Description (Optional)
            </label>
            <textarea
              placeholder="Enter group description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-left"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
          <div className="text-xs text-gray-500 dark:text-gray-400 text-left">
            {isEditing ? `Press Cmd+Enter to save` : 'Press Cmd+Enter to create'}
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
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

export default GroupModal;

