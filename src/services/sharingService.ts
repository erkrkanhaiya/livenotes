import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Note, SharedNote, ShareOptions, CommunityMember, CommunityNote } from '../types';

export class SharingService {
  private static readonly SHARED_NOTES_COLLECTION = 'sharedNotes';

  /**
   * Generate a unique share ID
   */
  private static generateShareId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Share a note with specified options
   */
  static async shareNote(
    note: Note,
    options: ShareOptions,
    ownerName: string,
    ownerEmail: string
  ): Promise<string> {
    try {
      const shareId = this.generateShareId();
      
      const sharedNote: Omit<SharedNote, 'id'> = {
        noteId: note.id,
        shareId,
        shareType: options.type,
        ownerId: note.userId,
        createdAt: new Date(),
        expiresAt: options.expiresAt,
        title: note.title,
        description: note.description,
        color: note.color,
        ownerName,
        ownerEmail,
        allowEditing: options.type === 'private'
      };

      const docRef = doc(db, this.SHARED_NOTES_COLLECTION, shareId);
      await setDoc(docRef, {
        ...sharedNote,
        createdAt: serverTimestamp(),
        expiresAt: options.expiresAt ? new Date(options.expiresAt) : null
      });

      return shareId;
    } catch (error) {
      console.error('Error sharing note:', error);
      
      // More detailed error information
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        throw error; // Throw the original error with more details
      }
      
      throw new Error('Failed to share note: Unknown error');
    }
  }

  /**
   * Get a shared note by share ID
   */
  static async getSharedNote(shareId: string): Promise<SharedNote | null> {
    try {
      const docRef = doc(db, this.SHARED_NOTES_COLLECTION, shareId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      
      // Check if note has expired
      if (data.expiresAt && new Date(data.expiresAt.toDate()) < new Date()) {
        await this.unshareNote(shareId);
        return null;
      }

      return {
        id: docSnap.id,
        ...data,
        ownerId: data.ownerId || data.ownerEmail || '',
        allowEditing: data.allowEditing ?? (data.shareType === 'private'),
        createdAt: data.createdAt.toDate(),
        expiresAt: data.expiresAt ? data.expiresAt.toDate() : undefined
      } as SharedNote;
    } catch (error) {
      console.error('Error getting shared note:', error);
      throw new Error('Failed to get shared note');
    }
  }

  /**
   * Remove sharing for a note
   */
  static async unshareNote(shareId: string): Promise<void> {
    try {
      const docRef = doc(db, this.SHARED_NOTES_COLLECTION, shareId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error unsharing note:', error);
      throw new Error('Failed to unshare note');
    }
  }

  /**
   * Get all shared notes by a user
   */
  static async getUserSharedNotes(userEmail: string): Promise<SharedNote[]> {
    try {
      const q = query(
        collection(db, this.SHARED_NOTES_COLLECTION),
        where('ownerEmail', '==', userEmail)
      );
      
      const querySnapshot = await getDocs(q);
      const sharedNotes: SharedNote[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Skip expired notes
        if (data.expiresAt && new Date(data.expiresAt.toDate()) < new Date()) {
          this.unshareNote(doc.id); // Clean up expired notes
          return;
        }

        sharedNotes.push({
          id: doc.id,
          ...data,
          ownerId: data.ownerId || data.ownerEmail || '',
          allowEditing: data.allowEditing ?? (data.shareType === 'private'),
          createdAt: data.createdAt.toDate(),
          expiresAt: data.expiresAt ? data.expiresAt.toDate() : undefined
        } as SharedNote);
      });

      return sharedNotes;
    } catch (error) {
      console.error('Error getting user shared notes:', error);
      throw new Error('Failed to get shared notes');
    }
  }

  /**
   * Get notes shared with a specific user (notes they can access but didn't create)
   */
  static async getNotesSharedWithUser(userEmail: string): Promise<SharedNote[]> {
    try {
      console.log('🔍 Searching for notes shared with:', userEmail);
      
      // Get all private shared notes and filter on client side
      // because we can't query array of objects with Firestore array-contains
      const allPrivateNotesQuery = query(
        collection(db, this.SHARED_NOTES_COLLECTION),
        where('shareType', '==', 'private')
      );
      
      const querySnapshot = await getDocs(allPrivateNotesQuery);
      console.log('📄 Found', querySnapshot.docs.length, 'private shared notes to check');
      const sharedNotes: SharedNote[] = [];

      querySnapshot.forEach((docRef) => {
        const data = docRef.data();
        console.log('📝 Checking note:', docRef.id, 'owned by:', data.ownerEmail, 'collaborators:', data.collaborators);
        
        // Skip expired notes
        if (data.expiresAt && new Date(data.expiresAt.toDate()) < new Date()) {
          console.log('⏰ Skipping expired note:', docRef.id);
          this.unshareNote(docRef.id); // Clean up expired notes
          return;
        }

        // Skip notes owned by the requesting user (they'll see these in their "My Notes" section)
        if (data.ownerEmail === userEmail || data.ownerId === userEmail) {
          console.log('👤 Skipping own note:', docRef.id);
          return;
        }

        // Check if user is in collaborators array
        const collaborators = data.collaborators || [];
        const isCollaborator = collaborators.some((collaborator: any) => 
          collaborator.email === userEmail || collaborator.email?.toLowerCase() === userEmail.toLowerCase()
        );

        console.log('🤝 Is', userEmail, 'a collaborator?', isCollaborator);

        // Include note if user is a collaborator
        if (isCollaborator) {
          const collaborator = collaborators.find((c: any) => 
            c.email === userEmail || c.email?.toLowerCase() === userEmail.toLowerCase()
          );
          
          console.log('✅ Adding shared note for collaborator:', docRef.id);
          sharedNotes.push({
            id: docRef.id,
            ...data,
            ownerId: data.ownerId || data.ownerEmail || '',
            allowEditing: data.allowEditing ?? (data.shareType === 'private'),
            collaborators: collaborators, // Include full collaborators list
            createdAt: data.createdAt.toDate(),
            expiresAt: data.expiresAt ? data.expiresAt.toDate() : undefined
          } as SharedNote);
        }
      });

      console.log('🎯 Returning', sharedNotes.length, 'shared notes for', userEmail);
      return sharedNotes;
    } catch (error) {
      console.error('Error getting notes shared with user:', error);
      throw new Error('Failed to get shared notes');
    }
  }

  /**
   * Generate share URL
   */
  static generateShareUrl(shareId: string): string {
    const baseUrl = import.meta.env.VITE_WEB_APP_URL || window.location.origin;
    return `${baseUrl}/share/${shareId}`;
  }

  /**
   * Update share type (private/public) for existing shared note
   */
  static async updateShareType(shareId: string, shareType: 'public' | 'private'): Promise<void> {
    try {
      const docRef = doc(db, this.SHARED_NOTES_COLLECTION, shareId);
      await updateDoc(docRef, {
        shareType: shareType,
        allowEditing: shareType === 'private'
      });
    } catch (error) {
      console.error('Error updating share type:', error);
      throw new Error('Failed to update share type');
    }
  }

  /**
   * Update edit permission for a shared note (admin control)
   */
  static async updateEditPermission(shareId: string, allowEditing: boolean): Promise<void> {
    try {
      const docRef = doc(db, this.SHARED_NOTES_COLLECTION, shareId);
      await updateDoc(docRef, {
        allowEditing: allowEditing
      });
      console.log(`✅ Edit permission updated to ${allowEditing ? 'allowed' : 'disabled'}`);
    } catch (error) {
      console.error('Error updating edit permission:', error);
      throw new Error('Failed to update edit permission');
    }
  }

  /**
   * Join a community note
   */
  static async joinCommunity(shareId: string, user: CommunityMember): Promise<void> {
    try {
      // Validate input data
      if (!shareId || !user || !user.email) {
        throw new Error('Invalid share ID or user data');
      }

      console.log('🏘️ Joining community:', { shareId, userEmail: user.email, role: user.role });

      const docRef = doc(db, this.SHARED_NOTES_COLLECTION, shareId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Shared note not found');
      }

      const data = docSnap.data();
      const currentMembers = data.members || [];
      
      // Check if user is already a member
      const isAlreadyMember = currentMembers.some((member: CommunityMember) => member.email === user.email);
      if (isAlreadyMember) {
        return; // Already a member
      }

      // Prepare the member data with proper timestamp
      const memberData = {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL || null,
        joinedAt: user.joinedAt || new Date(),
        role: user.role
      };

      // Try arrayUnion first, fallback to manual array update
      try {
        await updateDoc(docRef, {
          members: arrayUnion(memberData),
          memberCount: (data.memberCount || 0) + 1,
          isCommunity: true
        });
        console.log('✅ Successfully joined community using arrayUnion');
      } catch (arrayUnionError) {
        console.warn('⚠️ arrayUnion failed, trying manual array update:', arrayUnionError);
        
        // Fallback: manual array update
        const updatedMembers = [...currentMembers, memberData];
        await updateDoc(docRef, {
          members: updatedMembers,
          memberCount: updatedMembers.length,
          isCommunity: true
        });
        console.log('✅ Successfully joined community using manual array update');
      }
    } catch (error) {
      console.error('Error joining community:', error);
      
      // Provide more detailed error information
      if (error instanceof Error) {
        console.error('Community join error details:', {
          name: error.name,
          message: error.message,
          shareId,
          userEmail: user.email
        });
        
        if (error.message.includes('permission')) {
          throw new Error('Permission denied: Cannot join community note');
        } else if (error.message.includes('not-found')) {
          throw new Error('Community note not found');
        } else {
          throw new Error(`Failed to join community: ${error.message}`);
        }
      }
      
      throw new Error('Failed to join community note: Unknown error');
    }
  }

  /**
   * Leave a community note
   */
  static async leaveCommunity(shareId: string, userEmail: string): Promise<void> {
    try {
      const docRef = doc(db, this.SHARED_NOTES_COLLECTION, shareId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Shared note not found');
      }

      const data = docSnap.data();
      const currentMembers = data.members || [];
      
      // Find and remove the user
      const memberToRemove = currentMembers.find((member: CommunityMember) => member.email === userEmail);
      if (memberToRemove) {
        await updateDoc(docRef, {
          members: arrayRemove(memberToRemove),
          memberCount: Math.max(0, (data.memberCount || 1) - 1)
        });
      }
    } catch (error) {
      console.error('Error leaving community:', error);
      
      // Provide more detailed error information
      if (error instanceof Error) {
        console.error('Leave community error details:', {
          name: error.name,
          message: error.message,
          shareId,
          userEmail
        });
        
        if (error.message.includes('permission')) {
          throw new Error('Permission denied: Cannot leave community note');
        } else if (error.message.includes('not-found')) {
          throw new Error('Community note not found');
        } else {
          throw new Error(`Failed to leave community: ${error.message}`);
        }
      }
      
      throw new Error('Failed to leave community note: Unknown error');
    }
  }

  /**
   * Get community note with members
   */
  static async getCommunityNote(shareId: string): Promise<CommunityNote | null> {
    try {
      const sharedNote = await this.getSharedNote(shareId);
      if (!sharedNote) return null;

      const docRef = doc(db, this.SHARED_NOTES_COLLECTION, shareId);
      const docSnap = await getDoc(docRef);
      const data = docSnap.data();

      return {
        ...sharedNote,
        isCommunity: data?.isCommunity || false,
        members: data?.members || [],
        memberCount: data?.memberCount || 0
      } as CommunityNote;
    } catch (error) {
      console.error('Error getting community note:', error);
      throw new Error('Failed to get community note');
    }
  }

  /**
   * Check if current user can access a private shared note
   */
  static canAccessPrivateNote(sharedNote: SharedNote, currentUserEmail?: string): boolean {
    if (sharedNote.shareType === 'public') {
      return true;
    }
    
    return !!currentUserEmail; // For private notes, user just needs to be logged in
  }

  /**
   * Add a collaborator to a private shared note
   */
  static async addCollaborator(shareId: string, collaboratorEmail: string, permission: 'view' | 'edit' = 'edit'): Promise<void> {
    try {
      // Normalize email to lowercase for consistent matching
      const normalizedEmail = collaboratorEmail.trim().toLowerCase();
      
      const docRef = doc(db, this.SHARED_NOTES_COLLECTION, shareId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Shared note not found');
      }

      const data = docSnap.data();
      const existingCollaborators = data.collaborators || [];

      // Check if collaborator already exists (case-insensitive)
      const existingIndex = existingCollaborators.findIndex((c: any) => 
        c.email?.toLowerCase() === normalizedEmail
      );
      
      if (existingIndex >= 0) {
        // Update existing collaborator permission
        existingCollaborators[existingIndex].permission = permission;
        console.log('✅ Updated existing collaborator permission:', normalizedEmail);
      } else {
        // Add new collaborator
        existingCollaborators.push({
          id: normalizedEmail, // Using normalized email as ID
          email: collaboratorEmail.trim(), // Store original email format
          displayName: collaboratorEmail.split('@')[0], // Default display name
          permission,
          joinedAt: new Date(),
        });
        console.log('✅ Added new collaborator:', normalizedEmail);
      }

      await updateDoc(docRef, {
        collaborators: existingCollaborators,
        allowEditing: true // Enable editing for private notes when collaborators are added
      });

      // Create notification for collaborator joining (only if new collaborator)
      if (existingIndex < 0) {
        try {
          const { default: NotificationService } = await import('./notificationService');
          const collaboratorName = collaboratorEmail.split('@')[0];
          await NotificationService.createNotification({
            type: 'member_joined',
            communityId: shareId,
            communityTitle: data.title || 'Shared Note',
            message: `${collaboratorName} joined the community`,
            actionBy: {
              name: collaboratorName,
              email: collaboratorEmail.trim()
            }
          });
        } catch (notifError) {
          console.warn('Failed to create notification:', notifError);
          // Don't fail the whole operation if notification fails
        }
      }

      console.log('✅ Collaborator added/updated successfully - note will appear in their "Shared with Me"');
    } catch (error) {
      console.error('Error adding collaborator:', error);
      throw new Error('Failed to add collaborator');
    }
  }

  /**
   * Remove a collaborator from a shared note
   */
  static async removeCollaborator(shareId: string, collaboratorEmail: string): Promise<void> {
    try {
      const normalizedEmail = collaboratorEmail.toLowerCase();
      
      const docRef = doc(db, this.SHARED_NOTES_COLLECTION, shareId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Shared note not found');
      }

      const data = docSnap.data();
      const existingCollaborators = data.collaborators || [];
      const updatedCollaborators = existingCollaborators.filter((c: any) => 
        c.email?.toLowerCase() !== normalizedEmail
      );

      await updateDoc(docRef, {
        collaborators: updatedCollaborators
      });

      console.log('✅ Collaborator removed successfully');
    } catch (error) {
      console.error('Error removing collaborator:', error);
      throw new Error('Failed to remove collaborator');
    }
  }

  /**
   * Allow a collaborator to leave/quit a shared note
   */
  static async leaveSharedNote(shareId: string, userEmail: string): Promise<void> {
    try {
      console.log('👋 User leaving shared note:', { shareId, userEmail });
      
      // Remove the user from collaborators list
      await this.removeCollaborator(shareId, userEmail);
      
      console.log('✅ Successfully left shared note');
    } catch (error) {
      console.error('Error leaving shared note:', error);
      throw new Error('Failed to leave shared note');
    }
  }

  /**
   * Update collaborator permission
   */
  static async updateCollaboratorPermission(shareId: string, collaboratorEmail: string, permission: 'view' | 'edit'): Promise<void> {
    try {
      const docRef = doc(db, this.SHARED_NOTES_COLLECTION, shareId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Shared note not found');
      }

      const data = docSnap.data();
      const existingCollaborators = data.collaborators || [];
      const collaboratorIndex = existingCollaborators.findIndex((c: any) => c.email === collaboratorEmail);

      if (collaboratorIndex >= 0) {
        existingCollaborators[collaboratorIndex].permission = permission;
        
        await updateDoc(docRef, {
          collaborators: existingCollaborators
        });

        console.log('✅ Collaborator permission updated successfully');
      } else {
        throw new Error('Collaborator not found');
      }
    } catch (error) {
      console.error('Error updating collaborator permission:', error);
      throw new Error('Failed to update collaborator permission');
    }
  }

  /**
   * Check if user can edit a shared note
   */
  static canEditSharedNote(
    sharedNote: SharedNote,
    currentUserEmail?: string,
    currentUserId?: string
  ): boolean {
    if (!currentUserEmail && !currentUserId) return false;
    
    // Owner can always edit
    if (
      (currentUserEmail && (sharedNote.ownerEmail === currentUserEmail || sharedNote.ownerEmail?.toLowerCase() === currentUserEmail.toLowerCase())) ||
      (currentUserId && sharedNote.ownerId === currentUserId)
    ) {
      return true;
    }
    
    // For private notes, check if editing is allowed
    if (sharedNote.shareType === 'private') {
      // Editing must be explicitly allowed
      if (sharedNote.allowEditing !== true) {
        return false;
      }
      
      // Check if user is a collaborator with edit permission
      if (currentUserEmail && sharedNote.collaborators && sharedNote.collaborators.length > 0) {
        const collaborator = sharedNote.collaborators.find(c => 
          c.email === currentUserEmail || c.email?.toLowerCase() === currentUserEmail.toLowerCase()
        );
        // If user is a collaborator, check their permission
        if (collaborator) {
          return collaborator.permission === 'edit' || collaborator.permission === 'admin';
        }
        // If user is not in collaborators list, they can't edit (even if allowEditing is true)
        return false;
      }
      
      // If no collaborators list exists yet, any logged-in user can edit if allowEditing is true
      // (for backward compatibility with notes shared before collaborator system)
      return true;
    }
    
    // Public notes are read-only for non-owners
    return false;
  }

  /**
   * Get all shareIds for a given noteId
   */
  static async getShareIdsForNote(noteId: string): Promise<string[]> {
    try {
      const q = query(
        collection(db, this.SHARED_NOTES_COLLECTION),
        where('noteId', '==', noteId)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.id);
    } catch (error) {
      console.error('Error getting shareIds for note:', error);
      return [];
    }
  }

  /**
   * Sync original note content to all shared notes
   */
  static async syncNoteToShared(noteId: string, noteData: {
    title: string;
    description: string;
    color?: string;
  }): Promise<void> {
    try {
      const shareIds = await this.getShareIdsForNote(noteId);
      
      if (shareIds.length === 0) {
        return; // No shared notes to sync
      }

      // Update all shared notes with the new content
      await Promise.all(
        shareIds.map(async (shareId) => {
          const docRef = doc(db, this.SHARED_NOTES_COLLECTION, shareId);
          await updateDoc(docRef, {
            title: noteData.title,
            description: noteData.description,
            color: noteData.color,
            lastEditedAt: serverTimestamp()
          });
        })
      );

      console.log(`✅ Synced note content to ${shareIds.length} shared note(s)`);
    } catch (error) {
      console.error('Error syncing note to shared:', error);
      throw new Error('Failed to sync note to shared notes');
    }
  }

  /**
   * Delete all shared notes for a given noteId
   */
  static async deleteAllSharedNotesForNote(noteId: string): Promise<void> {
    try {
      const shareIds = await this.getShareIdsForNote(noteId);
      
      if (shareIds.length === 0) {
        return; // No shared notes to delete
      }

      // Delete all shared notes
      await Promise.all(
        shareIds.map(async (shareId) => {
          await this.unshareNote(shareId);
        })
      );

      console.log(`✅ Deleted ${shareIds.length} shared note(s) for note ${noteId}`);
    } catch (error) {
      console.error('Error deleting shared notes for note:', error);
      throw new Error('Failed to delete shared notes');
    }
  }

  /**
   * Update shared note content and sync back to original note
   */
  static async updateSharedNoteContent(shareId: string, updates: {
    title?: string;
    description?: string;
    lastEditedBy?: string;
    lastEditedByEmail?: string;
    lastEditedAt?: Date;
  }): Promise<void> {
    try {
      const docRef = doc(db, this.SHARED_NOTES_COLLECTION, shareId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Shared note not found');
      }

      const sharedNoteData = docSnap.data();
      const noteId = sharedNoteData.noteId;

      // Update the shared note
      await updateDoc(docRef, {
        ...updates,
        lastEditedAt: serverTimestamp()
      });

      // Create notification for note edit (only if edited by someone other than owner)
      const editorEmail = updates.lastEditedByEmail || '';
      const ownerEmail = sharedNoteData.ownerEmail || '';
      
      if (updates.lastEditedBy && ownerEmail && 
          editorEmail && editorEmail.toLowerCase() !== ownerEmail.toLowerCase() &&
          updates.lastEditedBy !== sharedNoteData.ownerName) {
        try {
          const { default: NotificationService } = await import('./notificationService');
          await NotificationService.createNotification({
            type: 'note_edited',
            communityId: shareId,
            communityTitle: sharedNoteData.title || 'Shared Note',
            message: `${updates.lastEditedBy} edited "${sharedNoteData.title || 'the note'}"`,
            actionBy: {
              name: updates.lastEditedBy,
              email: editorEmail
            }
          });
        } catch (notifError) {
          console.warn('Failed to create edit notification:', notifError);
          // Don't fail the whole operation if notification fails
        }
      }

      console.log('✅ Shared note content updated successfully');

      // Sync back to the original note if noteId exists
      if (noteId) {
        try {
          const { notesService } = await import('./notesService');
          const noteRef = doc(db, 'notes', noteId);
          const noteDocSnap = await getDoc(noteRef);

          if (noteDocSnap.exists()) {
            // Update the original note with the same changes
            const noteUpdates: any = {};
            if (updates.title !== undefined) {
              noteUpdates.title = updates.title;
            }
            if (updates.description !== undefined) {
              noteUpdates.description = updates.description;
            }
            // Update the updatedAt timestamp
            noteUpdates.updatedAt = serverTimestamp();

            await updateDoc(noteRef, noteUpdates);
            console.log('✅ Original note synced with shared note updates');
          } else {
            console.warn('⚠️ Original note not found for sync:', noteId);
          }
        } catch (syncError) {
          console.error('⚠️ Failed to sync to original note (shared note still updated):', syncError);
          // Don't throw - shared note update succeeded, sync is secondary
        }
      }
    } catch (error) {
      console.error('Error updating shared note content:', error);
      throw new Error('Failed to update shared note content');
    }
  }
}

export default SharingService;