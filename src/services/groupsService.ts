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
  arrayUnion,
  arrayRemove,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Group, CreateGroupData, UpdateGroupData } from '../types';

const GROUPS_COLLECTION = 'groups';
const SHARED_GROUPS_COLLECTION = 'sharedGroups';

export class GroupsService {
  private static readonly COLLECTION = GROUPS_COLLECTION;
  private static readonly SHARED_COLLECTION = SHARED_GROUPS_COLLECTION;

  /**
   * Create a new group
   */
  static async createGroup(
    groupData: CreateGroupData,
    userId: string,
    userEmail: string,
    userName: string
  ): Promise<Group> {
    if (!db) throw new Error('Firebase not initialized');

    const now = new Date();
    const newGroup = {
      name: groupData.name,
      description: groupData.description || '',
      ownerId: userId,
      ownerEmail: userEmail,
      ownerName: userName,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
      noteIds: [],
      noteCount: 0,
      isPinned: false,
      isShared: false,
      allowEditing: false,
    };

    const docRef = await addDoc(collection(db, this.COLLECTION), newGroup);
    
    return {
      id: docRef.id,
      ...newGroup,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Get all groups for a user
   */
  static async getUserGroups(userId: string): Promise<Group[]> {
    if (!db) return [];

    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('ownerId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const groups: Group[] = [];
      
      for (const docRef of querySnapshot.docs) {
        const data = docRef.data();
        const noteIds = data.noteIds || [];
        const actualNoteCount = noteIds.length;
        
        // Always recalculate noteCount based on actual noteIds length
        // Update in database if there's a mismatch
        if (data.noteCount !== actualNoteCount) {
          try {
            await updateDoc(docRef.ref, {
              noteCount: actualNoteCount,
            });
            console.log(`✅ Fixed noteCount for group "${data.name || docRef.id}": ${data.noteCount} -> ${actualNoteCount} (noteIds: ${noteIds.length})`);
          } catch (updateError) {
            console.error('Error updating noteCount:', updateError);
          }
        }
        
        const groupData: any = {
          id: docRef.id,
          ...data,
          noteIds: noteIds, // Ensure noteIds array is included
          noteCount: actualNoteCount, // Always use actual count from array length
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        };
        
        // If group is shared, load collaborators from shared group document
        if (groupData.isShared && groupData.shareId) {
          try {
            const sharedQ = query(
              collection(db, this.SHARED_COLLECTION),
              where('shareId', '==', groupData.shareId)
            );
            const sharedSnapshot = await getDocs(sharedQ);
            
            if (!sharedSnapshot.empty) {
              const sharedData = sharedSnapshot.docs[0].data();
              groupData.collaborators = sharedData.collaborators || [];
              groupData.allowEditing = sharedData.allowEditing;
            }
          } catch (error) {
            console.warn('⚠️ Failed to load group collaborators:', error);
          }
        }
        
        groups.push(groupData as Group);
      }
      
      return groups;
    } catch (error) {
      console.error('Error fetching groups:', error);
      return [];
    }
  }

  /**
   * Get a group by ID
   */
  static async getGroupById(groupId: string): Promise<Group | null> {
    if (!db) return null;

    try {
      const docRef = doc(db, this.COLLECTION, groupId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) return null;
      
      const data = docSnap.data();
      const noteIds = data.noteIds || [];
      const actualNoteCount = noteIds.length;
      
      // Recalculate noteCount based on actual noteIds length
      if (data.noteCount !== actualNoteCount) {
        try {
          await updateDoc(docRef, {
            noteCount: actualNoteCount,
          });
          console.log(`✅ Fixed noteCount for group ${groupId}: ${data.noteCount} -> ${actualNoteCount}`);
        } catch (updateError) {
          console.error('Error updating noteCount:', updateError);
        }
      }
      
      const groupData: any = {
        id: docSnap.id,
        ...data,
        noteIds: noteIds, // Ensure noteIds array is included
        noteCount: actualNoteCount, // Always use actual count from array length
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
      
      // If group is shared, load collaborators from shared group document
      if (groupData.isShared && groupData.shareId) {
        try {
          const sharedQ = query(
            collection(db, this.SHARED_COLLECTION),
            where('shareId', '==', groupData.shareId)
          );
          const sharedSnapshot = await getDocs(sharedQ);
          
          if (!sharedSnapshot.empty) {
            const sharedData = sharedSnapshot.docs[0].data();
            groupData.collaborators = sharedData.collaborators || [];
            groupData.allowEditing = sharedData.allowEditing;
          }
        } catch (error) {
          console.warn('⚠️ Failed to load group collaborators:', error);
        }
      }
      
      return groupData as Group;
    } catch (error) {
      console.error('Error fetching group:', error);
      return null;
    }
  }

  /**
   * Update a group
   */
  static async updateGroup(
    groupId: string,
    updates: UpdateGroupData
  ): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');

    const docRef = doc(db, this.COLLECTION, groupId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  }

  /**
   * Delete a group
   */
  static async deleteGroup(groupId: string): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');

    // Get the group to check noteIds
    const group = await this.getGroupById(groupId);
    if (!group) throw new Error('Group not found');

    // Remove groupId from all notes in this group
    if (group.noteIds && group.noteIds.length > 0) {
      const batch = writeBatch(db);
      const notesCollection = collection(db, 'notes');
      
      for (const noteId of group.noteIds) {
        const noteRef = doc(notesCollection, noteId);
        batch.update(noteRef, {
          groupId: null,
        });
      }
      
      await batch.commit();
    }

    // Delete the group
    const docRef = doc(db, this.COLLECTION, groupId);
    await deleteDoc(docRef);

    // Delete shared group if exists
    if (group.shareId) {
      try {
        const sharedQ = query(
          collection(db, this.SHARED_COLLECTION),
          where('shareId', '==', group.shareId)
        );
        const sharedSnapshot = await getDocs(sharedQ);
        sharedSnapshot.docs.forEach(async (sharedDoc) => {
          await deleteDoc(sharedDoc.ref);
        });
      } catch (error) {
        console.error('Error deleting shared group:', error);
      }
    }
  }

  /**
   * Add a note to a group
   */
  static async addNoteToGroup(groupId: string, noteId: string): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');

    const batch = writeBatch(db);
    
    // Add noteId to group
    const groupRef = doc(db, this.COLLECTION, groupId);
    const group = await this.getGroupById(groupId);
    if (!group) throw new Error('Group not found');
    
    if (!group.noteIds.includes(noteId)) {
      // Calculate new noteIds array and count from actual length
      const newNoteIds = [...group.noteIds, noteId];
      const newNoteCount = newNoteIds.length;
      
      batch.update(groupRef, {
        noteIds: arrayUnion(noteId),
        noteCount: newNoteCount, // Use actual count from array length
        updatedAt: Timestamp.fromDate(new Date()),
      });
      
      console.log(`✅ Adding note ${noteId} to group ${groupId}. New count: ${newNoteCount}`);
    } else {
      console.log(`ℹ️ Note ${noteId} already in group ${groupId}`);
    }

    // Update note with groupId
    const noteRef = doc(db, 'notes', noteId);
    batch.update(noteRef, {
      groupId: groupId,
    });

    await batch.commit();
  }

  /**
   * Remove a note from a group
   */
  static async removeNoteFromGroup(groupId: string, noteId: string): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');

    const batch = writeBatch(db);
    
    // Remove noteId from group
    const groupRef = doc(db, this.COLLECTION, groupId);
    const group = await this.getGroupById(groupId);
    if (!group) throw new Error('Group not found');
    
    if (group.noteIds.includes(noteId)) {
      // Calculate new noteIds array and count from actual length
      const newNoteIds = group.noteIds.filter(id => id !== noteId);
      const newNoteCount = newNoteIds.length;
      
      batch.update(groupRef, {
        noteIds: arrayRemove(noteId),
        noteCount: newNoteCount, // Use actual count from array length
        updatedAt: Timestamp.fromDate(new Date()),
      });
      
      console.log(`✅ Removing note ${noteId} from group ${groupId}. New count: ${newNoteCount}`);
    } else {
      console.log(`ℹ️ Note ${noteId} not in group ${groupId}`);
    }

    // Remove groupId from note
    const noteRef = doc(db, 'notes', noteId);
    batch.update(noteRef, {
      groupId: null,
    });

    await batch.commit();
  }

  /**
   * Get all notes in a group
   */
  static async getGroupNotes(groupId: string): Promise<string[]> {
    const group = await this.getGroupById(groupId);
    return group?.noteIds || [];
  }

  /**
   * Share a group
   */
  static async shareGroup(
    groupId: string,
    shareType: 'public' | 'private',
    ownerEmail: string
  ): Promise<{ shareId: string; shareType: 'public' | 'private' }> {
    if (!db) throw new Error('Firebase not initialized');

    const group = await this.getGroupById(groupId);
    if (!group) throw new Error('Group not found');

    let shareId = group.shareId;

    // If group is already shared, update existing shared group document
    if (group.shareId) {
      const q = query(
        collection(db, this.SHARED_COLLECTION),
        where('shareId', '==', group.shareId)
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const sharedGroupRef = querySnapshot.docs[0].ref;
        const existingData = querySnapshot.docs[0].data();
        
        // Update existing shared group
        await updateDoc(sharedGroupRef, {
          shareType: shareType,
          allowEditing: shareType === 'private',
          // Preserve existing collaborators if switching from private to private
          collaborators: shareType === 'private' && existingData.collaborators 
            ? existingData.collaborators 
            : (shareType === 'private' ? [] : undefined),
        });
      } else {
        // ShareId exists but no shared document found, create new one
        shareId = this.generateShareId();
        const sharedGroupData = {
          groupId: groupId,
          shareId: shareId,
          shareType: shareType,
          ownerId: group.ownerId,
          ownerEmail: group.ownerEmail,
          ownerName: group.ownerName,
          name: group.name,
          description: group.description || '',
          createdAt: Timestamp.fromDate(new Date()),
          collaborators: shareType === 'private' ? [] : undefined,
          allowEditing: shareType === 'private',
        };
        await addDoc(collection(db, this.SHARED_COLLECTION), sharedGroupData);
      }
    } else {
      // First time sharing - create new shared group
      shareId = this.generateShareId();
      const sharedGroupData = {
        groupId: groupId,
        shareId: shareId,
        shareType: shareType,
        ownerId: group.ownerId,
        ownerEmail: group.ownerEmail,
        ownerName: group.ownerName,
        name: group.name,
        description: group.description || '',
        createdAt: Timestamp.fromDate(new Date()),
        collaborators: shareType === 'private' ? [] : undefined,
        allowEditing: shareType === 'private',
      };
      await addDoc(collection(db, this.SHARED_COLLECTION), sharedGroupData);
    }

    // Update group with share info
    const groupRef = doc(db, this.COLLECTION, groupId);
    await updateDoc(groupRef, {
      isShared: true,
      shareId: shareId,
      shareType: shareType,
      updatedAt: Timestamp.fromDate(new Date()),
    });

    return { shareId, shareType };
  }

  /**
   * Get shared group by shareId
   */
  static async getSharedGroup(shareId: string): Promise<any | null> {
    if (!db) return null;

    try {
      const q = query(
        collection(db, this.SHARED_COLLECTION),
        where('shareId', '==', shareId)
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return null;

      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      };
    } catch (error) {
      console.error('Error fetching shared group:', error);
      return null;
    }
  }

  /**
   * Get groups shared with user
   */
  static async getGroupsSharedWithUser(userEmail: string): Promise<any[]> {
    if (!db) return [];

    try {
      const normalizedUserEmail = userEmail.trim().toLowerCase();
      console.log('🔍 Searching for groups shared with:', normalizedUserEmail);
      
      const q = query(
        collection(db, this.SHARED_COLLECTION),
        where('shareType', '==', 'private')
      );
      
      const querySnapshot = await getDocs(q);
      console.log('📁 Found', querySnapshot.docs.length, 'private shared groups to check');
      const sharedGroups: any[] = [];

      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        const collaborators = data.collaborators || [];
        
        console.log('👥 Checking group:', data.name, 'collaborators:', collaborators.map((c: any) => c.email));
        
        // Check if user is a collaborator - normalize both emails for comparison
        const isCollaborator = collaborators.some((c: any) => {
          const collaboratorEmail = (c.email || '').trim().toLowerCase();
          const matches = collaboratorEmail === normalizedUserEmail;
          console.log('  Comparing:', collaboratorEmail, '===', normalizedUserEmail, '?', matches);
          return matches;
        });
        
        if (isCollaborator) {
          console.log('✅ User is a collaborator of group:', data.name);
          sharedGroups.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
          });
        }
      });

      console.log('📦 Returning', sharedGroups.length, 'shared groups');
      return sharedGroups;
    } catch (error) {
      console.error('Error fetching shared groups:', error);
      return [];
    }
  }

  /**
   * Add collaborator to group
   */
  static async addGroupCollaborator(
    shareId: string,
    collaboratorEmail: string,
    permission: 'view' | 'edit' = 'edit'
  ): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');

    const q = query(
      collection(db, this.SHARED_COLLECTION),
      where('shareId', '==', shareId)
    );
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) throw new Error('Shared group not found');

    const docRef = querySnapshot.docs[0].ref;
    const data = querySnapshot.docs[0].data();
    const collaborators = data.collaborators || [];

    // Check if collaborator already exists - normalize email for comparison
    const normalizedEmail = collaboratorEmail.trim().toLowerCase();
    const existingIndex = collaborators.findIndex((c: any) => {
      const existingEmail = (c.email || '').trim().toLowerCase();
      return existingEmail === normalizedEmail;
    });

    if (existingIndex >= 0) {
      // Update existing collaborator
      collaborators[existingIndex].permission = permission;
      console.log('✅ Updated existing collaborator:', collaboratorEmail);
    } else {
      // Add new collaborator - store email as provided (trimmed) but compare normalized
      const trimmedEmail = collaboratorEmail.trim();
      collaborators.push({
        id: normalizedEmail,
        email: trimmedEmail, // Store original format
        displayName: trimmedEmail.split('@')[0],
        permission,
        joinedAt: Timestamp.fromDate(new Date()),
        allowEditing: true,
      });
      console.log('✅ Added new collaborator:', trimmedEmail);
    }

    await updateDoc(docRef, {
      collaborators: collaborators,
      allowEditing: true,
    });
  }

  /**
   * Remove collaborator from group
   */
  static async removeGroupCollaborator(
    shareId: string,
    collaboratorEmail: string
  ): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');

    const q = query(
      collection(db, this.SHARED_COLLECTION),
      where('shareId', '==', shareId)
    );
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) throw new Error('Shared group not found');

    const docRef = querySnapshot.docs[0].ref;
    const data = querySnapshot.docs[0].data();
    const collaborators = (data.collaborators || []).filter((c: any) =>
      c.email?.toLowerCase() !== collaboratorEmail.toLowerCase()
    );

    await updateDoc(docRef, {
      collaborators: collaborators,
    });
  }

  /**
   * Update group collaborator permission
   */
  static async updateGroupCollaboratorPermission(
    shareId: string,
    collaboratorEmail: string,
    newPermission: 'view' | 'edit'
  ): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');

    const q = query(
      collection(db, this.SHARED_COLLECTION),
      where('shareId', '==', shareId)
    );
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) throw new Error('Shared group not found');

    const docRef = querySnapshot.docs[0].ref;
    const data = querySnapshot.docs[0].data();
    const collaborators = data.collaborators || [];

    const normalizedEmail = collaboratorEmail.toLowerCase();
    const collaboratorIndex = collaborators.findIndex((c: any) =>
      c.email?.toLowerCase() === normalizedEmail
    );

    if (collaboratorIndex >= 0) {
      collaborators[collaboratorIndex].permission = newPermission;
      await updateDoc(docRef, {
        collaborators: collaborators,
      });
    } else {
      throw new Error('Collaborator not found');
    }
  }

  /**
   * Check if user can edit notes in a group
   */
  static async canEditGroupNotes(
    groupId: string,
    userId?: string,
    userEmail?: string
  ): Promise<boolean> {
    if (!db) throw new Error('Firebase not initialized');
    if (!userId && !userEmail) return false;

    try {
      // Get the group
      const group = await this.getGroupById(groupId);
      if (!group) return false;

      // Owner can always edit
      if (group.ownerId === userId) return true;

      // If group is not shared, only owner can edit
      if (!group.isShared || !group.shareId) return false;

      // Get shared group data
      const q = query(
        collection(db, this.SHARED_COLLECTION),
        where('shareId', '==', group.shareId)
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return false;

      const sharedGroupData = querySnapshot.docs[0].data();
      const collaborators = sharedGroupData.collaborators || [];

      // Check if user is a collaborator with edit permission
      if (userEmail) {
        const normalizedEmail = userEmail.toLowerCase().trim();
        const collaborator = collaborators.find((c: any) =>
          c.email?.toLowerCase().trim() === normalizedEmail
        );
        
        if (collaborator) {
          // Check permission - only 'edit' or 'admin' can edit
          return collaborator.permission === 'edit' || collaborator.permission === 'admin';
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking group edit permission:', error);
      return false;
    }
  }

  /**
   * Unshare a group
   */
  static async unshareGroup(groupId: string): Promise<void> {
    if (!db) throw new Error('Firebase not initialized');

    const group = await this.getGroupById(groupId);
    if (!group || !group.shareId) return;

    // Delete shared group documents
    const q = query(
      collection(db, this.SHARED_COLLECTION),
      where('shareId', '==', group.shareId)
    );
    
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);
    querySnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    // Update group
    const groupRef = doc(db, this.COLLECTION, groupId);
    await updateDoc(groupRef, {
      isShared: false,
      shareId: null,
      shareType: null,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  }

  /**
   * Generate unique share ID
   */
  private static generateShareId(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length: 20 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  }

  /**
   * Generate share URL
   */
  static generateShareUrl(shareId: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/share-group/${shareId}`;
  }
}

export default GroupsService;

