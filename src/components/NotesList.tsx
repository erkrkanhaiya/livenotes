import React from 'react';
import NoteCard from './NoteCard';
import type { Note } from '../types';

interface NotesListProps {
  notes: Note[];
  onEditNote: (note: Note) => void;
}

const NotesList: React.FC<NotesListProps> = ({ notes, onEditNote }) => {
  return (
    <div className="grid grid-cols-1 gap-3">
      {notes.map((note, index) => (
        <NoteCard
          key={note.id}
          note={note}
          onEdit={onEditNote}
          animationDelay={index * 0.05}
        />
      ))}
    </div>
  );
};

export default NotesList;