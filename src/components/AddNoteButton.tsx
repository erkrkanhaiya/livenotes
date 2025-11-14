import React from 'react';
import { Plus } from 'lucide-react';

interface AddNoteButtonProps {
  onClick: () => void;
}

const AddNoteButton: React.FC<AddNoteButtonProps> = ({ onClick }) => {
  return (
    <div className="p-4 border-t border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-center px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow-md animate-scale-in"
      >
        <Plus className="h-5 w-5 mr-2" />
        Add New Note
      </button>
    </div>
  );
};

export default AddNoteButton;