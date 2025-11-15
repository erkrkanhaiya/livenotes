import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Note, CreateNoteData, UpdateNoteData, NotesContextType, NoteColor, SharedNote, Group, CreateGroupData, UpdateGroupData } from '../types';
import { useAuth } from './AuthContext';
import { notesService } from '../services/notesService';
import GroupsService from '../services/groupsService';

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
};

interface NotesProviderProps {
  children: ReactNode;
}

export const NotesProvider: React.FC<NotesProviderProps> = ({ children }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [sharedWithMeNotes, setSharedWithMeNotes] = useState<SharedNote[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterColor, setFilterColor] = useState<NoteColor | 'all'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Group Notes feature
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  
  // Safely get auth context - handle case where AuthProvider might not be available
  let user;
  try {
    const authContext = useAuth();
    user = authContext?.user || null;
  } catch (err) {
    // If useAuth throws, AuthProvider is not available
    console.warn('NotesProvider: AuthProvider not available, user will be null');
    user = null;
  }

  // Load notes and groups when user changes
  useEffect(() => {
    if (user) {
      handleUserChange(user);
      loadGroups();
    } else {
      setNotes([]);
      setGroups([]);
    }
  }, [user]);

  const handleUserChange = async (newUser: typeof user) => {
    if (!newUser) return;
    
    // Check if this is a new authenticated user (not guest) and there are guest notes to migrate
    if (!newUser.isGuest && newUser.id !== user?.id) {
      const guestUser = localStorage.getItem('guestUser');
      if (guestUser) {
        try {
          const guestData = JSON.parse(guestUser);
          console.log('🔄 Detected user login, checking for guest notes to migrate');
          
          await notesService.migrateGuestNotes(guestData.id, newUser.id);
          
          // Clear guest user data after migration
          localStorage.removeItem('guestUser');
          console.log('✅ Guest notes migrated and guest session cleared');
        } catch (error) {
          console.error('❌ Failed to migrate guest notes:', error);
        }
      }
    }
    
    await loadNotes();
  };

  // Load groups (both owned and shared)
  const loadGroups = async () => {
    if (!user || user.isGuest) return;
    
    try {
      // Load user's own groups
      const userGroups = await GroupsService.getUserGroups(user.id);
      
      // Load groups shared with user
      let sharedGroups: any[] = [];
      if (user.email) {
        try {
          sharedGroups = await GroupsService.getGroupsSharedWithUser(user.email);
          console.log('📁 Found shared groups:', sharedGroups.length);
        } catch (error) {
          console.error('Error loading shared groups:', error);
        }
      }
      
      // Convert shared groups to Group format and merge
      // For shared groups, we need to get the actual group to get noteIds
      const sharedGroupsAsGroups: Group[] = [];
      for (const sg of sharedGroups) {
        try {
          // Get the actual group to get noteIds and calculate noteCount
          const actualGroup = await GroupsService.getGroupById(sg.groupId || sg.id);
          if (actualGroup) {
            // Ensure noteCount is calculated from actual noteIds length
            const actualNoteCount = (actualGroup.noteIds || []).length;
            sharedGroupsAsGroups.push({
              ...actualGroup,
              noteCount: actualNoteCount, // Use actual count
              isShared: true,
              shareId: sg.shareId,
              shareType: sg.shareType,
              collaborators: sg.collaborators,
              allowEditing: sg.allowEditing,
            });
            console.log(`✅ Loaded shared group "${actualGroup.name}": ${actualNoteCount} notes`);
          } else {
            // Fallback if group not found
            sharedGroupsAsGroups.push({
              id: sg.groupId || sg.id,
              name: sg.name,
              description: sg.description,
              ownerId: sg.ownerId,
              ownerEmail: sg.ownerEmail,
              ownerName: sg.ownerName,
              createdAt: sg.createdAt,
              updatedAt: sg.createdAt,
              noteIds: [],
              noteCount: 0,
              isShared: true,
              shareId: sg.shareId,
              shareType: sg.shareType,
              collaborators: sg.collaborators,
              allowEditing: sg.allowEditing,
            } as Group);
          }
        } catch (error) {
          console.error('Error loading shared group details:', error);
        }
      }
      
      // Merge and deduplicate (in case user owns a group that's also shared)
      const allGroups = [...userGroups];
      sharedGroupsAsGroups.forEach((sharedGroup: Group) => {
        const existingIndex = allGroups.findIndex(g => g.id === sharedGroup.id);
        if (existingIndex >= 0) {
          // Update existing group with shared info - use the owned group's noteIds for count
          const ownedGroup = allGroups[existingIndex];
          const actualNoteCount = (ownedGroup.noteIds || []).length;
          allGroups[existingIndex] = {
            ...ownedGroup,
            noteCount: actualNoteCount, // Use count from owned group (most up-to-date)
            isShared: true,
            shareId: sharedGroup.shareId,
            shareType: sharedGroup.shareType,
            // Preserve collaborators from shared group if available, otherwise keep from owned group
            collaborators: sharedGroup.collaborators || ownedGroup.collaborators || [],
            allowEditing: sharedGroup.allowEditing,
          };
        } else {
          // Add new shared group
          allGroups.push(sharedGroup);
        }
      });
      
      // Final pass: ensure all groups have correct noteCount from noteIds.length
      const finalGroups = allGroups.map(group => {
        const actualCount = (group.noteIds || []).length;
        if (group.noteCount !== actualCount) {
          console.log(`🔧 Correcting count for "${group.name}": ${group.noteCount} -> ${actualCount}`);
          return { ...group, noteCount: actualCount };
        }
        return group;
      });
      
      // Log final counts for debugging
      console.log('📊 Groups loaded:', finalGroups.map(g => ({ 
        name: g.name, 
        count: g.noteCount, 
        noteIdsLength: g.noteIds?.length || 0,
        noteIds: g.noteIds 
      })));
      
      setGroups(finalGroups);
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const loadNotes = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Load user's own notes
      const userNotes = await notesService.getAllNotes(user.id);
      
      // Load notes from groups owned by user (including notes created by collaborators)
      let ownedGroupNotes: Note[] = [];
      try {
        // Get all groups owned by user
        const ownedGroups = await GroupsService.getUserGroups(user.id);
        console.log('📁 Found owned groups:', ownedGroups.length);
        
        // For each owned group, load ALL notes in that group (regardless of creator)
        for (const group of ownedGroups) {
          if (group.noteIds && group.noteIds.length > 0) {
            const { notesService } = await import('../services/notesService');
            const groupNotes = await Promise.all(
              group.noteIds.map(async (noteId: string) => {
                try {
                  // Get note by ID - this will get notes created by collaborators too
                  const note = await notesService.getNoteById(noteId);
                  if (note && note.groupId === group.id) {
                    return note;
                  }
                  return null;
                } catch (error) {
                  console.error('Error loading note from owned group:', noteId, error);
                  return null;
                }
              })
            );
            
            // Filter out nulls and add to owned group notes
            const validNotes = groupNotes.filter((note): note is Note => note !== null);
            ownedGroupNotes = [...ownedGroupNotes, ...validNotes];
            console.log(`✅ Loaded ${validNotes.length} notes from owned group: ${group.name}`);
          }
        }
      } catch (ownedGroupError) {
        console.error('Error loading notes from owned groups:', ownedGroupError);
      }
      
      // Load notes from shared groups (for collaborators - groups shared WITH user)
      let sharedGroupNotes: Note[] = [];
      if (!user.isGuest && user.email) {
        try {
          // Get groups shared with user
          const sharedGroups = await GroupsService.getGroupsSharedWithUser(user.email);
          console.log('📁 Found shared groups:', sharedGroups.length);
          
          // For each shared group, load the notes in that group
          for (const sharedGroup of sharedGroups) {
            try {
              const groupId = sharedGroup.groupId || sharedGroup.id;
              const actualGroup = await GroupsService.getGroupById(groupId);
              
              if (actualGroup && actualGroup.noteIds && actualGroup.noteIds.length > 0) {
                // Load notes from this group
                const { notesService } = await import('../services/notesService');
                const groupNotes = await Promise.all(
                  actualGroup.noteIds.map(async (noteId: string) => {
                    try {
                      // Get note by ID
                      const note = await notesService.getNoteById(noteId);
                      if (note && note.groupId === groupId) {
                        return note;
                      }
                      return null;
                    } catch (error) {
                      console.error('Error loading note from group:', noteId, error);
                      return null;
                    }
                  })
                );
                
                // Filter out nulls and add to shared group notes
                const validNotes = groupNotes.filter((note): note is Note => note !== null);
                sharedGroupNotes = [...sharedGroupNotes, ...validNotes];
                console.log(`✅ Loaded ${validNotes.length} notes from shared group: ${actualGroup.name}`);
              } else {
                console.log(`ℹ️ Shared group ${actualGroup?.name || groupId} has no notes yet`);
              }
            } catch (groupError) {
              console.error('Error loading notes from shared group:', groupError);
            }
          }
        } catch (sharedGroupError) {
          console.error('Error loading shared group notes:', sharedGroupError);
        }
      }
      
      // Combine user's notes, owned group notes, and shared group notes, removing duplicates
      const allNotes = [...userNotes];
      
      // Add notes from owned groups (these include notes created by collaborators)
      ownedGroupNotes.forEach(note => {
        if (!allNotes.find(n => n.id === note.id)) {
          allNotes.push(note);
        }
      });
      
      // Add notes from shared groups (groups shared WITH user)
      sharedGroupNotes.forEach(sharedNote => {
        if (!allNotes.find(n => n.id === sharedNote.id)) {
          allNotes.push(sharedNote);
        }
      });
      
      setNotes(allNotes);
      
      // Load individual shared notes (only for authenticated users, not guests)
      if (!user.isGuest && user.email) {
        try {
          console.log('🔍 Loading shared notes for user:', user.email);
          const { default: SharingService } = await import('../services/sharingService');
          const sharedNotes = await SharingService.getNotesSharedWithUser(user.email);
          console.log('📝 Found shared notes:', sharedNotes.length, sharedNotes);
          setSharedWithMeNotes(sharedNotes);
        } catch (sharedError) {
          console.error('❌ Error loading shared notes:', sharedError);
          // Don't fail the whole loading process if shared notes fail
          setSharedWithMeNotes([]);
        }
      } else {
        setSharedWithMeNotes([]);
      }
    } catch (err) {
      setError('Failed to load notes');
      console.error('Error loading notes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh only shared notes (faster than full reload)
  const refreshSharedNotes = async () => {
    if (!user || user.isGuest || !user.email) return;
    
    try {
      const { default: SharingService } = await import('../services/sharingService');
      const sharedNotes = await SharingService.getNotesSharedWithUser(user.email);
      console.log('🔄 Refreshed shared notes:', sharedNotes.length);
      setSharedWithMeNotes(sharedNotes);
    } catch (error) {
      console.error('Error refreshing shared notes:', error);
    }
  };

  // Refresh community member data for all community notes
  const refreshCommunityData = async () => {
    if (!user) return;
    
    try {
      const notesToKeep: Note[] = [];
      
      await Promise.all(
        notes.map(async (note) => {
          if (note.isCommunity && note.shareId) {
            try {
              const { default: SharingService } = await import('../services/sharingService');
              const communityNote = await SharingService.getCommunityNote(note.shareId);
              
              if (communityNote) {
                // Check if current user is still a member
                const isStillMember = communityNote.members.some(
                  member => member.email === user.email
                );
                
                if (isStillMember) {
                  // User is still a member, keep the note with updated data
                  notesToKeep.push({
                    ...note,
                    communityMembers: communityNote.members,
                    memberCount: communityNote.memberCount
                  });
                } else {
                  // User is no longer a member, remove the note
                  console.log('🚫 User no longer a member of community, removing note:', note.title);
                  try {
                    await notesService.deleteNote(note.id);
                  } catch (deleteError) {
                    console.warn('⚠️ Failed to delete note after leaving community:', deleteError);
                  }
                }
              } else {
                // Community note no longer exists, remove it
                console.log('🚫 Community note no longer exists, removing:', note.title);
                try {
                  await notesService.deleteNote(note.id);
                } catch (deleteError) {
                  console.warn('⚠️ Failed to delete note after community deletion:', deleteError);
                }
              }
            } catch (error) {
              console.error('Error refreshing community data for note:', note.id, error);
              // Keep the note if there's an error checking community status
              notesToKeep.push(note);
            }
          } else {
            // Regular note, keep it
            notesToKeep.push(note);
          }
        })
      );
      
      // Update the notes list, filtering out notes from communities the user left
      setNotes(prev => prev.filter(note => 
        !note.isCommunity || notesToKeep.some(kept => kept.id === note.id)
      ));
      
      console.log('🔄 Community member data refreshed and cleaned up');
    } catch (error) {
      console.error('Error refreshing community data:', error);
    }
  };

  const createNote = async (noteData: CreateNoteData) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setError(null);
      const newNote = await notesService.createNote({
        ...noteData,
        userId: user.id,
      });
      
      // Prepare the final note with groupId if provided
      let finalNote: Note = { ...newNote };
      if (noteData.groupId) {
        finalNote.groupId = noteData.groupId;
      }
      
      // If note is added to a group, add it to the group's noteIds
      if (noteData.groupId) {
        try {
          await GroupsService.addNoteToGroup(noteData.groupId, newNote.id);
          console.log('✅ Added note to group:', noteData.groupId);
          
          // Create notification for group owner if note was created by a collaborator
          try {
            const group = await GroupsService.getGroupById(noteData.groupId);
            if (group && group.isShared && group.shareId) {
              const creatorEmail = user.email || '';
              const ownerEmail = group.ownerEmail || '';
              const creatorName = user.displayName || user.email || 'Someone';
              
              // Only create notification if creator is not the owner
              if (creatorEmail && ownerEmail && 
                  creatorEmail.toLowerCase() !== ownerEmail.toLowerCase()) {
                const { default: NotificationService } = await import('../services/notificationService');
                await NotificationService.createNotification({
                  type: 'note_added',
                  communityId: group.shareId,
                  communityTitle: group.name || 'Group',
                  message: `${creatorName} created a new note in "${group.name || 'the group'}"`,
                  actionBy: {
                    name: creatorName,
                    email: creatorEmail
                  }
                });
                console.log('✅ Created notification for group note creation');
              }
            }
          } catch (notifError) {
            console.warn('⚠️ Failed to create group note creation notification:', notifError);
            // Don't fail the whole operation if notification fails
          }
          
          // Optimistically update the group count in state immediately
          setGroups(prevGroups => 
            prevGroups.map(group => {
              if (group.id === noteData.groupId) {
                const newNoteIds = [...(group.noteIds || []), newNote.id];
                const newCount = newNoteIds.length;
                console.log(`🔄 Optimistically updating group "${group.name}" count: ${group.noteCount} -> ${newCount}`);
                return {
                  ...group,
                  noteIds: newNoteIds,
                  noteCount: newCount,
                };
              }
              return group;
            })
          );
          
          // Then refresh groups to get the latest from database
          await loadGroups();
          console.log('✅ Groups refreshed after adding note');
        } catch (groupError) {
          console.error('⚠️ Failed to add note to group:', groupError);
          // Still try to refresh groups even if addition failed
          try {
            await loadGroups();
          } catch (refreshError) {
            console.error('⚠️ Failed to refresh groups:', refreshError);
          }
        }
      }
      
      // If the note has public/community visibility, automatically share it
      if (noteData.visibility === 'public' || noteData.visibility === 'community') {
        try {
          const { default: SharingService } = await import('../services/sharingService');
          const shareType = noteData.visibility === 'public' ? 'public' : 'private'; // Community notes are private by default
          const shareId = await SharingService.shareNote(
            finalNote,
            { type: shareType },
            user.displayName || user.email || 'Anonymous',
            user.email || ''
          );
          
          // Update the note with sharing information
          finalNote = {
            ...finalNote,
            isShared: true,
            shareId,
            shareType: shareType as 'public' | 'private',
            sharedAt: new Date(),
            isCommunity: noteData.visibility === 'community',
          };
          
          // Update the note in the service (we'll extend UpdateNoteData to include sharing fields)
          await notesService.updateNote(newNote.id, {
            isShared: true,
            shareId,
            shareType: shareType as 'public' | 'private',
            sharedAt: new Date(),
            isCommunity: noteData.visibility === 'community',
          } as any);
          
          setNotes(prev => [finalNote, ...prev]);
          console.log(`✅ Note created and shared as ${noteData.visibility}:`, shareId);
        } catch (sharingError) {
          console.warn('⚠️ Failed to automatically share note:', sharingError);
          // Still add the note even if sharing fails
          setNotes(prev => [finalNote, ...prev]);
        }
      } else {
        setNotes(prev => [finalNote, ...prev]);
      }
    } catch (err) {
      setError('Failed to create note');
      console.error('Error creating note:', err);
      throw err;
    }
  };

  const updateNote = async (id: string, updates: UpdateNoteData) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setError(null);
      
      // Find the existing note
      const existingNote = notes.find(note => note.id === id);
      if (!existingNote) {
        throw new Error('Note not found in current notes list');
      }
      
      // Check if note belongs to a group and verify edit permissions
      if (existingNote.groupId) {
        const canEdit = await GroupsService.canEditGroupNotes(
          existingNote.groupId,
          user.id,
          user.email || undefined
        );
        
        if (!canEdit) {
          const errorMsg = 'You do not have permission to edit notes in this group. Your permission is set to "view only".';
          setError(errorMsg);
          throw new Error(errorMsg);
        }
      }
      
      // Check if visibility changed and handle sharing
      let sharingUpdates = {};
      if (updates.visibility && updates.visibility !== existingNote.visibility) {
        if (updates.visibility === 'public' || updates.visibility === 'community') {
          try {
            const { default: SharingService } = await import('../services/sharingService');
            
            if (!existingNote.isShared) {
              // Create new share
              const shareType = updates.visibility === 'public' ? 'public' : 'private';
              const shareId = await SharingService.shareNote(
                existingNote,
                { type: shareType },
                user.displayName || user.email || 'Anonymous',
                user.email || ''
              );
              
              sharingUpdates = {
                isShared: true,
                shareId,
                shareType: shareType as 'public' | 'private',
                sharedAt: new Date(),
                isCommunity: updates.visibility === 'community',
              };
              console.log(`✅ Note shared as ${updates.visibility}:`, shareId);
            } else if (existingNote.shareId) {
              // Update existing share
              const newShareType = updates.visibility === 'public' ? 'public' : 'private';
              await SharingService.updateShareType(existingNote.shareId, newShareType);
              
              sharingUpdates = {
                shareType: newShareType as 'public' | 'private',
                isCommunity: updates.visibility === 'community',
              };
              console.log(`✅ Share type updated to ${newShareType}`);
            }
          } catch (sharingError) {
            console.warn('⚠️ Failed to update sharing:', sharingError);
          }
        } else if (updates.visibility === 'private' && existingNote.isShared) {
          // Remove sharing for private notes
          try {
            if (existingNote.shareId) {
              const { default: SharingService } = await import('../services/sharingService');
              await SharingService.unshareNote(existingNote.shareId);
              
              sharingUpdates = {
                isShared: false,
                shareId: undefined,
                shareType: undefined,
                sharedAt: undefined,
                isCommunity: false,
              };
              console.log('✅ Note unshared');
            }
          } catch (unsharingError) {
            console.warn('⚠️ Failed to unshare note:', unsharingError);
          }
        }
      }
      
      // Combine all updates
      const allUpdates = { ...updates, ...sharingUpdates };
      
      // Optimistically update the note in the UI first
      const optimisticUpdate: Note = {
        ...existingNote,
        ...allUpdates,
        updatedAt: new Date(),
        // Ensure groupId is never null (convert to undefined)
        groupId: allUpdates.groupId === null || allUpdates.groupId === '' ? undefined : (allUpdates.groupId ?? existingNote.groupId),
      };
      
      setNotes(prev => 
        prev.map(note => 
          note.id === id ? optimisticUpdate : note
        )
      );
      
      // Then update in the backend
      const updatedNote = await notesService.updateNote(id, allUpdates as any);
      
      // Sync to shared notes if this note is shared and create notifications
      if (existingNote.isShared && existingNote.shareId) {
        try {
          const { default: SharingService } = await import('../services/sharingService');
          const { default: NotificationService } = await import('../services/notificationService');
          
          // Sync content to shared notes
          await SharingService.syncNoteToShared(id, {
            title: updatedNote.title,
            description: updatedNote.description,
            color: updatedNote.color
          });
          
          // Create notification if edited by collaborator (not owner)
          try {
            const sharedNote = await SharingService.getSharedNote(existingNote.shareId);
            if (sharedNote) {
              const ownerEmail = sharedNote.ownerEmail || '';
              const editorEmail = user.email || '';
              const editorName = user.displayName || user.email || 'Someone';
              
              // Only create notification if editor is not the owner
              if (editorEmail && ownerEmail && 
                  editorEmail.toLowerCase() !== ownerEmail.toLowerCase()) {
                await NotificationService.createNotification({
                  type: 'note_edited',
                  communityId: existingNote.shareId,
                  communityTitle: sharedNote.title || 'Shared Note',
                  message: `${editorName} edited "${sharedNote.title || 'the note'}"`,
                  actionBy: {
                    name: editorName,
                    email: editorEmail
                  }
                });
                console.log('✅ Created notification for note edit');
              }
            }
          } catch (notifError) {
            console.warn('⚠️ Failed to create edit notification:', notifError);
            // Don't fail the whole operation if notification fails
          }
          
          console.log('✅ Synced note updates to shared notes');
        } catch (syncError) {
          console.warn('⚠️ Failed to sync note to shared notes:', syncError);
          // Don't fail the update if sync fails
        }
      }
      
      // If note belongs to a group, create notifications for admin/owner only
      if (existingNote.groupId) {
        try {
          const { default: GroupsService } = await import('../services/groupsService');
          const group = await GroupsService.getGroupById(existingNote.groupId);
          
          if (group && group.isShared && group.shareId) {
            const { default: NotificationService } = await import('../services/notificationService');
            const editorName = user.displayName || user.email || 'Someone';
            const editorEmail = user.email || '';
            const ownerEmail = group.ownerEmail || '';
            const ownerId = group.ownerId || '';
            
            // Only create notification if editor is not the owner (collaborator is editing)
            if (editorEmail && ownerEmail && 
                editorEmail.toLowerCase() !== ownerEmail.toLowerCase()) {
              await NotificationService.createNotification({
                type: 'note_edited',
                communityId: group.shareId,
                communityTitle: group.name || 'Group',
                message: `${editorName} edited a note in "${group.name || 'the group'}"`,
                actionBy: {
                  name: editorName,
                  email: editorEmail
                },
                userId: ownerId, // Target the owner/admin
                ownerEmail: ownerEmail // Target the owner/admin
              });
              console.log('✅ Created notification for group note edit (to admin only)');
            }
          }
        } catch (groupNotifError) {
          console.warn('⚠️ Failed to create group edit notification:', groupNotifError);
          // Don't fail the whole operation if notification fails
        }
      }
      
      // Update again with the actual response from backend
      setNotes(prev => 
        prev.map(note => 
          note.id === id ? updatedNote : note
        )
      );
    } catch (err) {
      setError('Failed to update note');
      console.error('Error updating note:', err);
      
      // Reload notes to get the correct state
      if (user) {
        await loadNotes();
      }
      
      throw err;
    }
  };

  const deleteNote = async (id: string) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setError(null);
      
      // Find the note to check if it's a community note or in a group
      const noteToDelete = notes.find(note => note.id === id);
      
      // If note is in a group, remove it from the group
      if (noteToDelete?.groupId) {
        try {
          await GroupsService.removeNoteFromGroup(noteToDelete.groupId, id);
          console.log('✅ Removed note from group:', noteToDelete.groupId);
          
          // Optimistically update the group count in state immediately
          setGroups(prevGroups => 
            prevGroups.map(group => {
              if (group.id === noteToDelete.groupId) {
                const newNoteIds = (group.noteIds || []).filter(noteId => noteId !== id);
                const newCount = newNoteIds.length;
                console.log(`🔄 Optimistically updating group "${group.name}" count: ${group.noteCount} -> ${newCount}`);
                return {
                  ...group,
                  noteIds: newNoteIds,
                  noteCount: newCount,
                };
              }
              return group;
            })
          );
          
          // Then refresh groups to get the latest from database
          await loadGroups();
        } catch (groupError) {
          console.error('Error removing note from group:', groupError);
          // Still try to refresh groups
          try {
            await loadGroups();
          } catch (refreshError) {
            console.error('⚠️ Failed to refresh groups:', refreshError);
          }
        }
      }
      
      let shareIdToRemove: string | undefined;
      let sharingService: typeof import('../services/sharingService').default | null = null;

      if (noteToDelete?.shareId) {
        shareIdToRemove = noteToDelete.shareId;
        try {
          const module = await import('../services/sharingService');
          sharingService = module.default;
        } catch (importError) {
          console.warn('⚠️ Failed to load sharing service, continuing with note deletion:', importError);
        }
      }

      // If it's a community note, leave the community first
      if (noteToDelete?.isCommunity && shareIdToRemove && sharingService && user.email) {
        try {
          console.log('👋 Leaving community before deleting note:', noteToDelete.title);
          await sharingService.leaveCommunity(shareIdToRemove, user.email);
          console.log('✅ Successfully left community');
        } catch (communityError) {
          console.warn('⚠️ Failed to leave community, but continuing with note deletion:', communityError);
          // Continue with deletion even if leaving community fails
        }
      }

      // If the note was shared, delete ALL shared notes for this note (removes from all users)
      if (noteToDelete?.isShared && sharingService) {
        try {
          console.log('🔗 Deleting all shared notes for note:', noteToDelete.title);
          await sharingService.deleteAllSharedNotesForNote(id);
          // Remove all shared notes from the list
          setSharedWithMeNotes(prev => prev.filter(shared => shared.noteId !== id));
          console.log('✅ All shared notes deleted - removed from all users');
        } catch (unshareError) {
          console.warn('⚠️ Failed to delete shared notes, continuing with note deletion:', unshareError);
        }
      }
      
      await notesService.deleteNote(id);
      setNotes(prev => prev.filter(note => note.id !== id));
      
      console.log('🗑️ Note deleted successfully');
    } catch (err) {
      setError('Failed to delete note');
      console.error('Error deleting note:', err);
      throw err;
    }
  };

  // Leave a community and remove the note from personal notes
  const leaveCommunity = async (shareId: string, noteId?: string) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setError(null);
      
      // Leave the community first
      const { default: SharingService } = await import('../services/sharingService');
      console.log('👋 Leaving community:', shareId);
      await SharingService.leaveCommunity(shareId, user.email);
      
      // If noteId is provided, remove the note from personal notes
      if (noteId) {
        console.log('🗑️ Removing community note from personal notes:', noteId);
        await notesService.deleteNote(noteId);
        setNotes(prev => prev.filter(note => note.id !== noteId));
      } else {
        // If no noteId provided, find and remove the note by shareId
        const communityNote = notes.find(note => note.shareId === shareId);
        if (communityNote) {
          console.log('🗑️ Removing community note from personal notes by shareId:', communityNote.id);
          await notesService.deleteNote(communityNote.id);
          setNotes(prev => prev.filter(note => note.id !== communityNote.id));
        }
      }
      
      console.log('✅ Successfully left community and removed note');
    } catch (err) {
      setError('Failed to leave community');
      console.error('Error leaving community:', err);
      throw err;
    }
  };

  // Set up periodic refresh of community data and shared notes
  useEffect(() => {
    if (!user) return;
    
    // Check if there are any community notes or shared notes
    const hasCommunityNotes = notes.some(note => note.isCommunity);
    const hasSharedNotes = sharedWithMeNotes.length > 0;
    
    if (!hasCommunityNotes && !hasSharedNotes) return;
    
    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      if (hasCommunityNotes) {
        refreshCommunityData();
      }
      if (hasSharedNotes || !user.isGuest) {
        refreshSharedNotes();
      }
    }, 30000);
    
    // Also refresh when page becomes visible (user returns to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (hasCommunityNotes) {
          refreshCommunityData();
        }
        if (hasSharedNotes || !user.isGuest) {
          refreshSharedNotes();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, notes.length]);

  // Update sharing settings for a note
  const updateSharingSettings = async (noteId: string, shareType: 'public' | 'private') => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setError(null);
      
      const existingNote = notes.find(note => note.id === noteId);
      if (!existingNote) {
        throw new Error('Note not found');
      }

      const { default: SharingService } = await import('../services/sharingService');
      
      let sharingUpdates = {};
      
      if (!existingNote.isShared) {
        // Create new share
        const shareId = await SharingService.shareNote(
          existingNote,
          { type: shareType },
          user.displayName || user.email || 'Anonymous',
          user.email || ''
        );
        
        sharingUpdates = {
          isShared: true,
          shareId,
          shareType,
          sharedAt: new Date(),
          visibility: shareType,
        };
        
        console.log(`✅ Note shared as ${shareType}:`, shareId);
      } else if (existingNote.shareId) {
        // Update existing share type
        await SharingService.updateShareType(existingNote.shareId, shareType);
        
        sharingUpdates = {
          shareType,
          visibility: shareType,
        };
        
        console.log(`✅ Share type updated to ${shareType}`);
      }
      
      // Update the note with new sharing settings
      const allUpdates = { ...sharingUpdates };
      
      // Optimistically update the UI
      setNotes(prev => 
        prev.map(note => 
          note.id === noteId ? { ...note, ...allUpdates, updatedAt: new Date() } : note
        )
      );
      
      // Update in the backend
      await notesService.updateNote(noteId, allUpdates as any);
      
      return { shareId: existingNote.shareId || (sharingUpdates as any).shareId, shareType };
      
    } catch (err) {
      setError('Failed to update sharing settings');
      console.error('Error updating sharing settings:', err);
      throw err;
    }
  };

  // Group Notes functions
  const createGroup = async (data: CreateGroupData) => {
    if (!user || user.isGuest) throw new Error('User not authenticated');
    
    try {
      setError(null);
      console.log('📁 Creating group with user:', { id: user.id, email: user.email, name: user.displayName });
      const newGroup = await GroupsService.createGroup(
        data,
        user.id,
        user.email || '',
        user.displayName || 'Anonymous'
      );
      console.log('✅ Group created:', { id: newGroup.id, name: newGroup.name, ownerId: newGroup.ownerId, ownerEmail: newGroup.ownerEmail });
      
      // Add to local state immediately
      setGroups(prev => [...prev, newGroup]);
      
      // Refresh groups from database to ensure consistency
      await loadGroups();
    } catch (err) {
      setError('Failed to create group');
      console.error('❌ Error creating group:', err);
      throw err;
    }
  };

  const updateGroup = async (id: string, data: UpdateGroupData) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setError(null);
      
      // Verify ownership before updating
      const group = groups.find(g => g.id === id);
      if (!group) throw new Error('Group not found');
      
      // Check ownership by ID or email
      const isOwner = (group.ownerId && user.id && String(group.ownerId) === String(user.id)) ||
                     (group.ownerEmail && user.email && group.ownerEmail.toLowerCase().trim() === user.email.toLowerCase().trim());
      
      if (!isOwner) {
        throw new Error('You do not have permission to update this group');
      }
      
      await GroupsService.updateGroup(id, data);
      await loadGroups();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update group');
      throw err;
    }
  };

  const deleteGroup = async (id: string) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setError(null);
      
      // Verify ownership before deleting
      const group = groups.find(g => g.id === id);
      if (!group) throw new Error('Group not found');
      
      // Check ownership by ID or email
      const isOwner = (group.ownerId && user.id && String(group.ownerId) === String(user.id)) ||
                     (group.ownerEmail && user.email && group.ownerEmail.toLowerCase().trim() === user.email.toLowerCase().trim());
      
      if (!isOwner) {
        throw new Error('You do not have permission to delete this group');
      }
      
      await GroupsService.deleteGroup(id);
      setGroups(prev => prev.filter(g => g.id !== id));
      if (selectedGroupId === id) {
        setSelectedGroupId(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete group');
      throw err;
    }
  };

  const addNoteToGroup = async (groupId: string, noteId: string) => {
    try {
      await GroupsService.addNoteToGroup(groupId, noteId);
      await loadGroups();
      await loadNotes();
    } catch (err) {
      setError('Failed to add note to group');
      throw err;
    }
  };

  const removeNoteFromGroup = async (groupId: string, noteId: string) => {
    try {
      await GroupsService.removeNoteFromGroup(groupId, noteId);
      await loadGroups();
      await loadNotes();
    } catch (err) {
      setError('Failed to remove note from group');
      throw err;
    }
  };

  const shareGroup = async (groupId: string, shareType: 'public' | 'private') => {
    if (!user || user.isGuest) throw new Error('User not authenticated');
    
    try {
      setError(null);
      const result = await GroupsService.shareGroup(
        groupId,
        shareType,
        user.email || ''
      );
      await loadGroups();
      return result;
    } catch (err) {
      setError('Failed to share group');
      throw err;
    }
  };

  const refreshGroups = async () => {
    await loadGroups();
    // Also reload notes to get any new notes from shared groups
    await loadNotes();
  };

  const toggleGroupPin = async (groupId: string) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setError(null);
      const group = groups.find(g => g.id === groupId);
      if (!group) throw new Error('Group not found');
      
      // Check ownership by ID or email (pin is available to all, but verify user can modify)
      const isOwner = (group.ownerId && user.id && String(group.ownerId) === String(user.id)) ||
                     (group.ownerEmail && user.email && group.ownerEmail.toLowerCase().trim() === user.email.toLowerCase().trim());
      
      // Allow pinning for owners and collaborators (if shared)
      const canPin = isOwner || (group.isShared && group.collaborators?.some((c: any) => 
        c.email?.toLowerCase().trim() === user.email?.toLowerCase().trim()
      ));
      
      if (!canPin) {
        throw new Error('You do not have permission to pin this group');
      }
      
      const newPinnedState = !group.isPinned;
      await GroupsService.updateGroup(groupId, { isPinned: newPinnedState });
      
      // Optimistically update the UI
      setGroups(prev => 
        prev.map(g => 
          g.id === groupId ? { ...g, isPinned: newPinnedState } : g
        )
      );
      
      // Refresh to get latest from database
      await loadGroups();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle group pin');
      throw err;
    }
  };

  const leaveGroup = async (groupId: string) => {
    if (!user || !user.email) throw new Error('User not authenticated');
    
    try {
      setError(null);
      const group = groups.find(g => g.id === groupId);
      if (!group || !group.shareId) throw new Error('Group not found or not shared');
      
      // Remove user from group collaborators
      await GroupsService.removeGroupCollaborator(group.shareId, user.email);
      
      // Remove group from local state
      setGroups(prev => prev.filter(g => g.id !== groupId));
      
      // Clear selection if this group was selected
      if (selectedGroupId === groupId) {
        setSelectedGroupId(null);
      }
      
      // Refresh groups and notes
      await loadGroups();
      await loadNotes();
      
      console.log('✅ Successfully left group');
    } catch (err) {
      setError('Failed to leave group');
      console.error('Error leaving group:', err);
      throw err;
    }
  };

  const value: NotesContextType = {
    notes,
    sharedWithMeNotes,
    createNote,
    updateNote,
    deleteNote,
    leaveCommunity,
    updateSharingSettings,
    refreshSharedNotes,
    searchQuery,
    setSearchQuery,
    filterColor,
    setFilterColor,
    isLoading,
    error,
    refreshCommunityData,
    // Group Notes feature
    groups,
    selectedGroupId,
    setSelectedGroupId,
    createGroup,
    updateGroup,
    deleteGroup,
    addNoteToGroup,
    removeNoteFromGroup,
    shareGroup,
    refreshGroups,
    toggleGroupPin,
    leaveGroup,
  };

  return (
    <NotesContext.Provider value={value}>
      {children}
    </NotesContext.Provider>
  );
};