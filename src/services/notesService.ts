import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Note, CreateNoteData, UpdateNoteData } from '../types';

const NOTES_COLLECTION = 'notes';

// Generate unique ID for fallback
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const notesService = {
  // Migrate guest notes to authenticated user
  async migrateGuestNotes(fromGuestId: string, toUserId: string): Promise<void> {
    console.log('🔄 Starting guest notes migration:', { fromGuestId, toUserId });
    
    try {
      const guestNotes = this.getLocalNotes(fromGuestId);
      console.log(`📝 Found ${guestNotes.length} guest notes to migrate`);
      
      if (guestNotes.length === 0) {
        console.log('ℹ️ No guest notes to migrate');
        return;
      }

      // Create new notes with the authenticated user ID
      for (const guestNote of guestNotes) {
        try {
          const noteData = {
            title: guestNote.title,
            description: guestNote.description,
            color: guestNote.color,
            isPinned: guestNote.isPinned,
            userId: toUserId,
          };
          
          console.log('📤 Migrating note:', guestNote.title);
          await this.createNote(noteData);
        } catch (error) {
          console.error('❌ Failed to migrate note:', guestNote.title, error);
        }
      }

      // Clear guest notes after successful migration
      localStorage.removeItem(`notes_${fromGuestId}`);
      console.log('✅ Guest notes migration completed and cleared');
      
    } catch (error) {
      console.error('❌ Error during guest notes migration:', error);
      throw error;
    }
  },

  // Get all notes for a user
  async getAllNotes(userId: string): Promise<Note[]> {
    try {
      // Try Firebase first
      if (db) {
        // Use simple query without orderBy to avoid index requirement
        const q = query(
          collection(db, NOTES_COLLECTION),
          where('userId', '==', userId)
        );
        
        const querySnapshot = await getDocs(q);
        const notes = await Promise.all(
          querySnapshot.docs.map(async (docRef) => {
            const noteData = docRef.data();
            const note = {
              id: docRef.id,
              ...noteData,
              createdAt: noteData.createdAt?.toDate() || new Date(),
              updatedAt: noteData.updatedAt?.toDate() || new Date(),
              groupId: noteData.groupId || undefined, // Include groupId if present (can be undefined)
            } as Note;

            // If this is a community note, fetch community members
            if (note.isCommunity && note.shareId) {
              try {
                const SharingService = (await import('./sharingService')).default;
                const communityNote = await SharingService.getCommunityNote(note.shareId);
                if (communityNote) {
                  note.communityMembers = communityNote.members;
                  note.memberCount = communityNote.memberCount;
                }
              } catch (error) {
                console.error('Error loading community data for note:', note.id, error);
              }
            }

            return note;
          })
        );
        
        // Sort on client side to avoid index requirement
        return notes.sort((a, b) => {
          const aTime = a.updatedAt.getTime();
          const bTime = b.updatedAt.getTime();
          return bTime - aTime; // Sort by updatedAt desc
        });
      }
      
      // Fallback to local storage
      return this.getLocalNotes(userId);
    } catch (error: any) {
      console.error('❌ Error getting notes from Firebase:', error);
      if (error?.code === 'unavailable' || error?.message?.includes('ERR_BLOCKED_BY_CLIENT') || error?.message?.includes('network')) {
        console.warn('⚠️ Firestore connection blocked or unavailable. Check:');
        console.warn('1. Ad blockers may be blocking Firestore requests');
        console.warn('2. Firebase environment variables may be incorrect');
        console.warn('3. Firestore security rules may be blocking access');
        console.warn('4. Network connectivity issues');
      }
      console.log('📦 Falling back to local storage');
      return this.getLocalNotes(userId);
    }
  },

  // Create a new note
  async createNote(noteData: CreateNoteData & { userId: string }): Promise<Note> {
    const now = new Date();
    const newNote: Omit<Note, 'id'> = {
      ...noteData,
      isPinned: noteData.isPinned || false,
      createdAt: now,
      updatedAt: now,
      groupId: noteData.groupId, // Include groupId if provided
    };

    try {
      // Try Firebase first
      if (db) {
        // Build Firestore document, excluding undefined values
        const noteDoc: any = {
          title: newNote.title,
          description: newNote.description || '',
          userId: newNote.userId,
          color: newNote.color || 'yellow',
          isPinned: newNote.isPinned || false,
          createdAt: Timestamp.fromDate(now),
          updatedAt: Timestamp.fromDate(now),
        };
        
        // Only include groupId if it exists, is not undefined, and is not empty string
        if (noteData.groupId !== undefined && noteData.groupId !== null && noteData.groupId !== '') {
          noteDoc.groupId = noteData.groupId;
        }
        
        // Include other optional fields if they exist
        if (newNote.isCommunity !== undefined) {
          noteDoc.isCommunity = newNote.isCommunity;
        }
        if (newNote.shareId) {
          noteDoc.shareId = newNote.shareId;
        }
        
        const docRef = await addDoc(collection(db, NOTES_COLLECTION), noteDoc);
        console.log('✅ Note created in Firestore:', docRef.id);
        return { id: docRef.id, ...newNote };
      }
      
      // Fallback to local storage
      console.log('📦 Creating note in local storage (Firestore not available)');
      return this.createLocalNote(newNote);
    } catch (error: any) {
      console.error('❌ Error creating note in Firebase:', error);
      if (error?.code === 'unavailable' || error?.message?.includes('ERR_BLOCKED_BY_CLIENT') || error?.message?.includes('network')) {
        console.warn('⚠️ Firestore connection blocked. Saving to local storage.');
      }
      return this.createLocalNote(newNote);
    }
  },

  // Update an existing note
  async updateNote(id: string, updates: UpdateNoteData): Promise<Note> {
    try {
      // Try Firebase first
      if (db) {
        const noteRef = doc(db, NOTES_COLLECTION, id);
        
        // Filter out undefined values from updates
        const firestoreUpdates: any = {
          updatedAt: Timestamp.fromDate(new Date()),
        };
        
        // Only include defined values
        if (updates.title !== undefined) firestoreUpdates.title = updates.title;
        if (updates.description !== undefined) firestoreUpdates.description = updates.description;
        if (updates.color !== undefined) firestoreUpdates.color = updates.color;
        if (updates.isPinned !== undefined) firestoreUpdates.isPinned = updates.isPinned;
        if (updates.groupId !== undefined) {
          // If groupId is explicitly set to empty string, omit it
          // Firestore doesn't support null, so we omit the field
          if (updates.groupId === '') {
            // Omit groupId field (don't include it in the update)
          } else {
            firestoreUpdates.groupId = updates.groupId;
          }
        }
        if (updates.isCommunity !== undefined) firestoreUpdates.isCommunity = updates.isCommunity;
        if (updates.shareId !== undefined) firestoreUpdates.shareId = updates.shareId;
        
        await updateDoc(noteRef, firestoreUpdates);
        
        // Try to get the existing note from local storage first
        let existingNote = this.getLocalNote(id);
        
        if (!existingNote) {
          // If not found locally, fetch from Firebase
          try {
            const docSnap = await import('firebase/firestore').then(m => m.getDoc(noteRef));
            if (docSnap.exists()) {
              const data = docSnap.data();
              existingNote = {
                id: docSnap.id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
              } as Note;
            }
          } catch (fetchError) {
            console.warn('Could not fetch updated note from Firebase:', fetchError);
          }
        }
        
        if (existingNote) {
          const updatedNote: Note = {
            ...existingNote,
            ...updates,
            updatedAt: new Date(),
            // Ensure groupId is never null (convert to undefined)
            groupId: updates.groupId === null || updates.groupId === '' ? undefined : (updates.groupId ?? existingNote.groupId),
          };
          
          // Update local storage with the new data
          try {
            this.updateLocalNote(id, updates);
          } catch (localError) {
            console.warn('Could not update local storage:', localError);
          }
          
          return updatedNote;
        } else {
          // Last resort: return a basic note object
          throw new Error('Could not retrieve updated note data');
        }
      }
      
      // Fallback to local storage
      return this.updateLocalNote(id, updates);
    } catch (error) {
      console.error('Error updating note in Firebase, falling back to local storage:', error);
      return this.updateLocalNote(id, updates);
    }
  },

  // Get a note by ID
  async getNoteById(noteId: string): Promise<Note | null> {
    try {
      // Try Firebase first
      if (db) {
        const noteRef = doc(db, NOTES_COLLECTION, noteId);
        const docSnap = await getDoc(noteRef);
        
        if (!docSnap.exists()) return null;
        
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          groupId: data.groupId || undefined, // Include groupId if present
        } as Note;
      }
      
      // Fallback to local storage
      return this.getLocalNote(noteId);
    } catch (error) {
      console.error('Error getting note by ID:', error);
      return null;
    }
  },

  // Delete a note
  async deleteNote(id: string): Promise<void> {
    try {
      // Try Firebase first
      if (db) {
        await deleteDoc(doc(db, NOTES_COLLECTION, id));
      }
      
      // Also remove from local storage
      this.deleteLocalNote(id);
    } catch (error) {
      console.error('Error deleting note from Firebase, falling back to local storage:', error);
      this.deleteLocalNote(id);
    }
  },

  // Local storage fallback methods
  getLocalNotes(userId: string): Note[] {
    try {
      const stored = localStorage.getItem(`notes_${userId}`);
      return stored ? JSON.parse(stored).map((note: any) => ({
        ...note,
        createdAt: new Date(note.createdAt),
        updatedAt: new Date(note.updatedAt),
      })) : [];
    } catch {
      return [];
    }
  },

  createLocalNote(noteData: Omit<Note, 'id'>): Note {
    const id = generateId();
    const note: Note = { id, ...noteData };
    
    const existingNotes = this.getLocalNotes(noteData.userId);
    const updatedNotes = [note, ...existingNotes];
    
    localStorage.setItem(`notes_${noteData.userId}`, JSON.stringify(updatedNotes));
    return note;
  },

  updateLocalNote(id: string, updates: UpdateNoteData): Note {
    console.log('🔄 Updating local note:', { id, updates });
    
    const note = this.getLocalNote(id);
    if (!note) {
      console.error('❌ Note not found in local storage:', id);
      throw new Error(`Note with id ${id} not found in local storage`);
    }
    
    const updatedNote: Note = {
      ...note,
      ...updates,
      updatedAt: new Date(),
      // Ensure groupId is never null (convert to undefined)
      groupId: updates.groupId === null || updates.groupId === '' ? undefined : (updates.groupId ?? note.groupId),
    };
    
    console.log('📝 Updated note data:', updatedNote);
    
    const existingNotes = this.getLocalNotes(note.userId);
    const updatedNotes = existingNotes.map(n => n.id === id ? updatedNote : n);
    
    localStorage.setItem(`notes_${note.userId}`, JSON.stringify(updatedNotes));
    return updatedNote;
  },

  deleteLocalNote(id: string): void {
    const note = this.getLocalNote(id);
    if (!note) return;
    
    const existingNotes = this.getLocalNotes(note.userId);
    const updatedNotes = existingNotes.filter(n => n.id !== id);
    
    localStorage.setItem(`notes_${note.userId}`, JSON.stringify(updatedNotes));
  },

  // Get a note by ID from local storage
  getLocalNote(id: string): Note | null {
    try {
      // Search through all user notes to find the one with matching ID
      const keys = Object.keys(localStorage).filter(key => key.startsWith('notes_'));
      
      for (const key of keys) {
        const notes: Note[] = JSON.parse(localStorage.getItem(key) || '[]');
        const note = notes.find(n => n.id === id);
        if (note) {
          return {
            ...note,
            createdAt: new Date(note.createdAt),
            updatedAt: new Date(note.updatedAt),
          };
        }
      }
      
      return null;
    } catch {
      return null;
    }
  }
};