# API Documentation

This document provides a comprehensive list of all APIs available in the Google Notes Chrome Extension project.

## Table of Contents

1. [Notes Service](#notes-service)
2. [Sharing Service](#sharing-service)
3. [Notification Service](#notification-service)
4. [Analytics Service](#analytics-service)
5. [Auth Context](#auth-context)
6. [Notes Context](#notes-context)
7. [Theme Context](#theme-context)

---

## Notes Service

**Location:** `src/services/notesService.ts`

The Notes Service handles all CRUD operations for notes, with Firebase Firestore as the primary storage and localStorage as fallback.

### Methods

#### `getAllNotes(userId: string): Promise<Note[]>`
Retrieves all notes for a specific user.

**Parameters:**
- `userId` (string): The user ID to fetch notes for

**Returns:** `Promise<Note[]>` - Array of notes sorted by updatedAt (descending)

**Example:**
```typescript
const notes = await notesService.getAllNotes('user123');
```

---

#### `createNote(noteData: CreateNoteData & { userId: string }): Promise<Note>`
Creates a new note.

**Parameters:**
- `noteData` (object): Note data including:
  - `title` (string): Note title
  - `description` (string, optional): Note description
  - `color` (NoteColor): Note color
  - `isPinned` (boolean, optional): Whether note is pinned
  - `userId` (string): Owner user ID

**Returns:** `Promise<Note>` - The created note with generated ID

**Example:**
```typescript
const note = await notesService.createNote({
  title: 'My Note',
  description: 'Note content',
  color: 'yellow',
  userId: 'user123'
});
```

---

#### `updateNote(id: string, updates: UpdateNoteData): Promise<Note>`
Updates an existing note.

**Parameters:**
- `id` (string): Note ID to update
- `updates` (UpdateNoteData): Partial note data to update

**Returns:** `Promise<Note>` - The updated note

**Example:**
```typescript
const updatedNote = await notesService.updateNote('note123', {
  title: 'Updated Title',
  isPinned: true
});
```

---

#### `deleteNote(id: string): Promise<void>`
Deletes a note.

**Parameters:**
- `id` (string): Note ID to delete

**Returns:** `Promise<void>`

**Example:**
```typescript
await notesService.deleteNote('note123');
```

---

#### `migrateGuestNotes(fromGuestId: string, toUserId: string): Promise<void>`
Migrates guest notes to an authenticated user account.

**Parameters:**
- `fromGuestId` (string): Guest user ID
- `toUserId` (string): Authenticated user ID

**Returns:** `Promise<void>`

**Example:**
```typescript
await notesService.migrateGuestNotes('guest_123', 'user123');
```

---

#### Local Storage Methods (Internal)

- `getLocalNotes(userId: string): Note[]` - Get notes from localStorage
- `createLocalNote(noteData: Omit<Note, 'id'>): Note` - Create note in localStorage
- `updateLocalNote(id: string, updates: UpdateNoteData): Note` - Update note in localStorage
- `deleteLocalNote(id: string): void` - Delete note from localStorage
- `getLocalNote(id: string): Note | null` - Get single note from localStorage

---

## Sharing Service

**Location:** `src/services/sharingService.ts`

The Sharing Service handles all note sharing functionality, including public/private sharing, community notes, and collaborator management.

### Methods

#### `shareNote(note: Note, options: ShareOptions, ownerName: string, ownerEmail: string): Promise<string>`
Shares a note with specified options.

**Parameters:**
- `note` (Note): The note to share
- `options` (ShareOptions): Sharing options:
  - `type` ('public' | 'private'): Share type
  - `expiresAt` (Date, optional): Expiration date
- `ownerName` (string): Owner's display name
- `ownerEmail` (string): Owner's email

**Returns:** `Promise<string>` - The generated shareId

**Example:**
```typescript
const shareId = await SharingService.shareNote(
  note,
  { type: 'private' },
  'John Doe',
  'john@example.com'
);
```

---

#### `getSharedNote(shareId: string): Promise<SharedNote | null>`
Retrieves a shared note by share ID.

**Parameters:**
- `shareId` (string): The share ID

**Returns:** `Promise<SharedNote | null>` - The shared note or null if not found/expired

**Example:**
```typescript
const sharedNote = await SharingService.getSharedNote('abc123');
```

---

#### `unshareNote(shareId: string): Promise<void>`
Unshares a note (deletes the shared note document).

**Parameters:**
- `shareId` (string): The share ID to unshare

**Returns:** `Promise<void>`

**Example:**
```typescript
await SharingService.unshareNote('abc123');
```

---

#### `getUserSharedNotes(userEmail: string): Promise<SharedNote[]>`
Gets all notes shared by a user.

**Parameters:**
- `userEmail` (string): User's email

**Returns:** `Promise<SharedNote[]>` - Array of shared notes

**Example:**
```typescript
const sharedNotes = await SharingService.getUserSharedNotes('user@example.com');
```

---

#### `getNotesSharedWithUser(userEmail: string): Promise<SharedNote[]>`
Gets all notes shared with a specific user (as collaborator).

**Parameters:**
- `userEmail` (string): User's email

**Returns:** `Promise<SharedNote[]>` - Array of notes shared with the user

**Example:**
```typescript
const sharedWithMe = await SharingService.getNotesSharedWithUser('user@example.com');
```

---

#### `generateShareUrl(shareId: string): string`
Generates a shareable URL for a shared note.

**Parameters:**
- `shareId` (string): The share ID

**Returns:** `string` - The shareable URL

**Example:**
```typescript
const url = SharingService.generateShareUrl('abc123');
// Returns: http://localhost:5174/share/abc123
```

---

#### `updateShareType(shareId: string, shareType: 'public' | 'private'): Promise<void>`
Updates the share type of a shared note.

**Parameters:**
- `shareId` (string): The share ID
- `shareType` ('public' | 'private'): New share type

**Returns:** `Promise<void>`

**Example:**
```typescript
await SharingService.updateShareType('abc123', 'public');
```

---

#### `updateEditPermission(shareId: string, allowEditing: boolean): Promise<void>`
Updates the edit permission for a private shared note.

**Parameters:**
- `shareId` (string): The share ID
- `allowEditing` (boolean): Whether editing is allowed

**Returns:** `Promise<void>`

**Example:**
```typescript
await SharingService.updateEditPermission('abc123', true);
```

---

#### `addCollaborator(shareId: string, collaboratorEmail: string, permission: 'view' | 'edit'): Promise<void>`
Adds a collaborator to a private shared note.

**Parameters:**
- `shareId` (string): The share ID
- `collaboratorEmail` (string): Collaborator's email
- `permission` ('view' | 'edit', default: 'edit'): Collaborator permission level

**Returns:** `Promise<void>`

**Example:**
```typescript
await SharingService.addCollaborator('abc123', 'collaborator@example.com', 'edit');
```

---

#### `removeCollaborator(shareId: string, collaboratorEmail: string): Promise<void>`
Removes a collaborator from a shared note.

**Parameters:**
- `shareId` (string): The share ID
- `collaboratorEmail` (string): Collaborator's email to remove

**Returns:** `Promise<void>`

**Example:**
```typescript
await SharingService.removeCollaborator('abc123', 'collaborator@example.com');
```

---

#### `updateCollaboratorPermission(shareId: string, collaboratorEmail: string, permission: 'view' | 'edit'): Promise<void>`
Updates a collaborator's permission level.

**Parameters:**
- `shareId` (string): The share ID
- `collaboratorEmail` (string): Collaborator's email
- `permission` ('view' | 'edit'): New permission level

**Returns:** `Promise<void>`

**Example:**
```typescript
await SharingService.updateCollaboratorPermission('abc123', 'collaborator@example.com', 'view');
```

---

#### `leaveSharedNote(shareId: string, userEmail: string): Promise<void>`
Allows a collaborator to leave a shared note.

**Parameters:**
- `shareId` (string): The share ID
- `userEmail` (string): User's email leaving the note

**Returns:** `Promise<void>`

**Example:**
```typescript
await SharingService.leaveSharedNote('abc123', 'user@example.com');
```

---

#### `canEditSharedNote(sharedNote: SharedNote, userEmail?: string, userId?: string): boolean`
Checks if a user can edit a shared note.

**Parameters:**
- `sharedNote` (SharedNote): The shared note
- `userEmail` (string, optional): User's email
- `userId` (string, optional): User's ID

**Returns:** `boolean` - Whether the user can edit

**Example:**
```typescript
const canEdit = SharingService.canEditSharedNote(sharedNote, 'user@example.com', 'user123');
```

---

#### `canAccessPrivateNote(sharedNote: SharedNote, currentUserEmail?: string): boolean`
Checks if a user can access a private note.

**Parameters:**
- `sharedNote` (SharedNote): The shared note
- `currentUserEmail` (string, optional): User's email

**Returns:** `boolean` - Whether the user can access

**Example:**
```typescript
const canAccess = SharingService.canAccessPrivateNote(sharedNote, 'user@example.com');
```

---

#### `joinCommunity(shareId: string, user: CommunityMember): Promise<void>`
Joins a community note.

**Parameters:**
- `shareId` (string): The share ID
- `user` (CommunityMember): User information to add as member

**Returns:** `Promise<void>`

**Example:**
```typescript
await SharingService.joinCommunity('abc123', {
  id: 'user123',
  email: 'user@example.com',
  displayName: 'John Doe',
  role: 'member',
  joinedAt: new Date()
});
```

---

#### `leaveCommunity(shareId: string, userEmail: string): Promise<void>`
Leaves a community note.

**Parameters:**
- `shareId` (string): The share ID
- `userEmail` (string): User's email leaving the community

**Returns:** `Promise<void>`

**Example:**
```typescript
await SharingService.leaveCommunity('abc123', 'user@example.com');
```

---

#### `getCommunityNote(shareId: string): Promise<CommunityNote | null>`
Retrieves a community note with member information.

**Parameters:**
- `shareId` (string): The share ID

**Returns:** `Promise<CommunityNote | null>` - The community note or null if not found

**Example:**
```typescript
const communityNote = await SharingService.getCommunityNote('abc123');
```

---

#### `syncNoteToShared(noteId: string, noteData: { title?: string; description?: string; color?: NoteColor }): Promise<void>`
Synchronizes changes from the original note to all its shared versions.

**Parameters:**
- `noteId` (string): The original note ID
- `noteData` (object): Note data to sync

**Returns:** `Promise<void>`

**Example:**
```typescript
await SharingService.syncNoteToShared('note123', {
  title: 'Updated Title',
  description: 'Updated content'
});
```

---

#### `updateSharedNoteContent(shareId: string, updates: { title?: string; description?: string; lastEditedBy?: string; lastEditedByEmail?: string; lastEditedAt?: Date }): Promise<void>`
Updates shared note content and syncs back to the original note.

**Parameters:**
- `shareId` (string): The share ID
- `updates` (object): Content updates

**Returns:** `Promise<void>`

**Example:**
```typescript
await SharingService.updateSharedNoteContent('abc123', {
  title: 'New Title',
  description: 'New Description',
  lastEditedBy: 'John Doe',
  lastEditedByEmail: 'john@example.com',
  lastEditedAt: new Date()
});
```

---

#### `getShareIdsForNote(noteId: string): Promise<string[]>`
Gets all share IDs associated with a note.

**Parameters:**
- `noteId` (string): The note ID

**Returns:** `Promise<string[]>` - Array of share IDs

**Example:**
```typescript
const shareIds = await SharingService.getShareIdsForNote('note123');
```

---

#### `deleteAllSharedNotesForNote(noteId: string): Promise<void>`
Deletes all shared note records for a specific note.

**Parameters:**
- `noteId` (string): The note ID

**Returns:** `Promise<void>`

**Example:**
```typescript
await SharingService.deleteAllSharedNotesForNote('note123');
```

---

## Notification Service

**Location:** `src/services/notificationService.ts`

The Notification Service handles community activity notifications for collaborator actions.

### Methods

#### `createNotification(notification: Omit<CommunityNotification, 'id' | 'timestamp' | 'read'>): Promise<void>`
Creates a new notification.

**Parameters:**
- `notification` (object): Notification data:
  - `type` ('note_added' | 'note_edited' | 'member_joined' | 'member_left'): Notification type
  - `communityId` (string): Share ID or community ID
  - `communityTitle` (string): Note/community title
  - `message` (string): Notification message
  - `actionBy` (object): Actor information:
    - `name` (string): Actor's name
    - `email` (string): Actor's email

**Returns:** `Promise<void>`

**Example:**
```typescript
await NotificationService.createNotification({
  type: 'member_joined',
  communityId: 'abc123',
  communityTitle: 'Team Notes',
  message: 'Alice joined the community',
  actionBy: {
    name: 'Alice',
    email: 'alice@example.com'
  }
});
```

---

#### `getNotifications(userEmail: string, limitCount?: number): Promise<CommunityNotification[]>`
Gets notifications for a user.

**Parameters:**
- `userEmail` (string): User's email
- `limitCount` (number, optional, default: 50): Maximum number of notifications

**Returns:** `Promise<CommunityNotification[]>` - Array of notifications

**Example:**
```typescript
const notifications = await NotificationService.getNotifications('user@example.com', 20);
```

---

#### `getNotificationsForShare(shareId: string, limitCount?: number): Promise<CommunityNotification[]>`
Gets notifications for a specific shared note/community.

**Parameters:**
- `shareId` (string): The share ID
- `limitCount` (number, optional, default: 50): Maximum number of notifications

**Returns:** `Promise<CommunityNotification[]>` - Array of notifications

**Example:**
```typescript
const notifications = await NotificationService.getNotificationsForShare('abc123', 10);
```

---

#### `subscribeToNotifications(userEmail: string, callback: (notifications: CommunityNotification[]) => void): () => void`
Subscribes to real-time notifications for a user.

**Parameters:**
- `userEmail` (string): User's email
- `callback` (function): Callback function that receives notifications array

**Returns:** `() => void` - Unsubscribe function

**Example:**
```typescript
const unsubscribe = NotificationService.subscribeToNotifications(
  'user@example.com',
  (notifications) => {
    console.log('New notifications:', notifications);
  }
);

// Later, to unsubscribe:
unsubscribe();
```

---

#### `markAsRead(notificationId: string): Promise<void>`
Marks a notification as read.

**Parameters:**
- `notificationId` (string): Notification ID

**Returns:** `Promise<void>`

**Example:**
```typescript
await NotificationService.markAsRead('notif123');
```

---

#### `markAllAsRead(userEmail: string): Promise<void>`
Marks all notifications as read for a user.

**Parameters:**
- `userEmail` (string): User's email

**Returns:** `Promise<void>`

**Example:**
```typescript
await NotificationService.markAllAsRead('user@example.com');
```

---

#### `deleteNotification(notificationId: string): Promise<void>`
Deletes a notification.

**Parameters:**
- `notificationId` (string): Notification ID

**Returns:** `Promise<void>`

**Example:**
```typescript
await NotificationService.deleteNotification('notif123');
```

---

## Analytics Service

**Location:** `src/services/analyticsService.ts`

The Analytics Service tracks user events and behaviors.

### Methods

#### `trackLogin(method?: string): void`
Tracks user login events.

**Parameters:**
- `method` (string, optional, default: 'google'): Login method ('google', 'email', 'guest')

**Example:**
```typescript
analyticsService.trackLogin('email');
```

---

#### `trackSignUp(method?: string): void`
Tracks user signup events.

**Parameters:**
- `method` (string, optional, default: 'email'): Signup method

**Example:**
```typescript
analyticsService.trackSignUp('email');
```

---

#### `trackNoteCreated(): void`
Tracks note creation events.

**Example:**
```typescript
analyticsService.trackNoteCreated();
```

---

#### `trackNoteUpdated(): void`
Tracks note update events.

**Example:**
```typescript
analyticsService.trackNoteUpdated();
```

---

#### `trackNoteDeleted(): void`
Tracks note deletion events.

**Example:**
```typescript
analyticsService.trackNoteDeleted();
```

---

#### `trackSearch(query: string): void`
Tracks search usage.

**Parameters:**
- `query` (string): Search query

**Example:**
```typescript
analyticsService.trackSearch('my search term');
```

---

#### `trackColorChange(color: string): void`
Tracks note color change events.

**Parameters:**
- `color` (string): New color

**Example:**
```typescript
analyticsService.trackColorChange('blue');
```

---

#### `trackNotePinned(isPinned: boolean): void`
Tracks note pin/unpin events.

**Parameters:**
- `isPinned` (boolean): Whether note is pinned

**Example:**
```typescript
analyticsService.trackNotePinned(true);
```

---

#### `setUserProperties(properties: { [key: string]: string }): void`
Sets user properties for analytics.

**Parameters:**
- `properties` (object): User properties object

**Example:**
```typescript
analyticsService.setUserProperties({
  user_type: 'premium',
  plan: 'pro'
});
```

---

#### `trackCustomEvent(eventName: string, parameters?: { [key: string]: any }): void`
Tracks custom events.

**Parameters:**
- `eventName` (string): Event name
- `parameters` (object, optional): Event parameters

**Example:**
```typescript
analyticsService.trackCustomEvent('feature_used', {
  feature: 'collaboration',
  action: 'invite_sent'
});
```

---

## Auth Context

**Location:** `src/contexts/AuthContext.tsx`

The Auth Context provides authentication state and methods throughout the application.

### Hook

#### `useAuth(): AuthContextType`
Returns the authentication context.

**Returns:**
- `user` (AppUser | null): Current user object
- `isLoading` (boolean): Loading state
- `signInWithGoogle()`: Sign in with Google
- `signInWithEmail(email, password)`: Sign in with email/password
- `signUpWithEmail(email, password, displayName)`: Sign up with email/password
- `signInAsGuest()`: Sign in as guest
- `signOut()`: Sign out

**Example:**
```typescript
const { user, signInWithGoogle, signOut } = useAuth();
```

---

## Notes Context

**Location:** `src/contexts/NotesContext.tsx`

The Notes Context provides note management state and methods.

### Hook

#### `useNotes(): NotesContextType`
Returns the notes context.

**Returns:**
- `notes` (Note[]): Array of user's notes
- `sharedWithMeNotes` (SharedNote[]): Notes shared with the user
- `searchQuery` (string): Current search query
- `filterColor` (NoteColor | 'all'): Current color filter
- `isLoading` (boolean): Loading state
- `error` (string | null): Error message
- `createNote(noteData)`: Create a new note
- `updateNote(id, updates)`: Update a note
- `deleteNote(id)`: Delete a note
- `refreshSharedNotes()`: Refresh shared notes
- `refreshCommunityData()`: Refresh community data
- `leaveCommunity(shareId, noteId?)`: Leave a community note
- `updateSharingSettings(noteId, shareType)`: Update sharing settings

**Example:**
```typescript
const { notes, createNote, updateNote, deleteNote } = useNotes();
```

---

## Theme Context

**Location:** `src/contexts/ThemeContext.tsx`

The Theme Context provides theme management (dark/light mode).

### Hook

#### `useTheme(): ThemeContextType`
Returns the theme context.

**Returns:**
- `isDarkMode` (boolean): Whether dark mode is enabled
- `toggleTheme()`: Toggle between dark and light mode

**Example:**
```typescript
const { isDarkMode, toggleTheme } = useTheme();
```

---

## Type Definitions

### Note
```typescript
interface Note {
  id: string;
  title: string;
  description?: string;
  color: NoteColor;
  isPinned: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  isShared?: boolean;
  shareId?: string;
  shareType?: 'public' | 'private';
  isCommunity?: boolean;
  visibility?: 'private' | 'public' | 'community';
  memberCount?: number;
  communityMembers?: CommunityMember[];
}
```

### SharedNote
```typescript
interface SharedNote {
  id: string;
  noteId: string;
  shareId: string;
  shareType: 'public' | 'private';
  ownerId: string;
  createdAt: Date;
  expiresAt?: Date;
  title: string;
  description: string;
  color: NoteColor;
  ownerName: string;
  ownerEmail: string;
  collaborators?: Collaborator[];
  allowEditing?: boolean;
  lastEditedBy?: string;
  lastEditedAt?: Date;
}
```

### CommunityNotification
```typescript
interface CommunityNotification {
  id: string;
  type: 'note_added' | 'note_edited' | 'member_joined' | 'member_left';
  communityId: string;
  communityTitle: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionBy: {
    name: string;
    email: string;
  };
}
```

---

## Error Handling

All service methods throw errors that should be caught and handled appropriately:

```typescript
try {
  await notesService.createNote(noteData);
} catch (error) {
  console.error('Failed to create note:', error);
  // Handle error
}
```

---

## Notes

- All Firebase operations fall back to localStorage if Firebase is unavailable
- Real-time subscriptions should be unsubscribed when components unmount
- Guest users are stored in localStorage and can be migrated to authenticated accounts
- All timestamps are converted between Firestore Timestamp and JavaScript Date objects automatically

---

## Last Updated

This documentation was last updated on: **2025-01-14**

