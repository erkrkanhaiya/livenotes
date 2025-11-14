// TypeScript interfaces and types for the Notes application

export interface Note {
  id: string;
  title: string;
  description: string;
  color: NoteColor;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  tags?: string[];
  visibility?: 'private' | 'public' | 'community';
  isShared?: boolean;
  shareId?: string;
  shareType?: 'public' | 'private';
  sharedAt?: Date;
  isCommunity?: boolean;
  communityMembers?: CommunityMember[];
  memberCount?: number;
  groupId?: string; // Group notes feature
}

export interface CreateNoteData {
  title: string;
  description: string;
  color: NoteColor;
  isPinned?: boolean;
  tags?: string[];
  visibility?: 'private' | 'public' | 'community';
  groupId?: string; // Group notes feature
}

export interface UpdateNoteData {
  title?: string;
  description?: string;
  tags?: string[];
  visibility?: 'private' | 'public' | 'community';
  color?: NoteColor;
  isPinned?: boolean;
}

export type NoteColor = 
  | 'yellow'
  | 'blue' 
  | 'green'
  | 'pink'
  | 'purple'
  | 'orange';

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  isGuest?: boolean;
}

export interface AppState {
  user: User | null;
  notes: Note[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  filterColor: NoteColor | 'all';
  isDarkMode: boolean;
}

export interface AuthContextType {
  user: User | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
}

export interface NotesContextType {
  notes: Note[];
  sharedWithMeNotes: SharedNote[];
  createNote: (noteData: CreateNoteData) => Promise<void>;
  updateNote: (id: string, updates: UpdateNoteData) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  leaveCommunity: (shareId: string, noteId?: string) => Promise<void>;
  updateSharingSettings: (noteId: string, shareType: 'public' | 'private') => Promise<{ shareId: string; shareType: 'public' | 'private' }>;
  refreshSharedNotes: () => Promise<void>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterColor: NoteColor | 'all';
  setFilterColor: (color: NoteColor | 'all') => void;
  isLoading: boolean;
  error: string | null;
  refreshCommunityData: () => Promise<void>;
  // Group Notes feature
  groups: Group[];
  selectedGroupId: string | null;
  setSelectedGroupId: (groupId: string | null) => void;
  createGroup: (data: CreateGroupData) => Promise<void>;
  updateGroup: (id: string, data: UpdateGroupData) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  addNoteToGroup: (groupId: string, noteId: string) => Promise<void>;
  removeNoteFromGroup: (groupId: string, noteId: string) => Promise<void>;
  shareGroup: (groupId: string, shareType: 'public' | 'private') => Promise<{ shareId: string; shareType: 'public' | 'private' }>;
  refreshGroups: () => Promise<void>;
  toggleGroupPin: (groupId: string) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
}

export interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

// Chrome Extension specific types
export interface ChromeMessage {
  type: 'INIT_AUTH' | 'SYNC_NOTES' | 'THEME_CHANGE';
  payload?: any;
}

// API Response types for mobile compatibility
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Sharing related types
export interface SharedNote {
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

export interface Collaborator {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  permission: 'view' | 'edit' | 'admin';
  joinedAt: Date;
}

export interface ShareOptions {
  type: 'public' | 'private';
  expiresAt?: Date;
}

// Community related types
export interface CommunityMember {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  joinedAt: Date;
  role: 'owner' | 'member';
}

export interface CommunityNote extends SharedNote {
  isCommunity: boolean;
  members: CommunityMember[];
  memberCount: number;
}

export interface NotesApiResponse extends ApiResponse<Note[]> {}
export interface NoteApiResponse extends ApiResponse<Note> {}
export interface UserApiResponse extends ApiResponse<User> {}

// Group Notes feature types
export interface Group {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  ownerEmail: string;
  ownerName: string;
  createdAt: Date;
  updatedAt: Date;
  noteIds: string[]; // Array of note IDs in this group
  noteCount: number;
  isPinned?: boolean;
  isShared?: boolean;
  shareId?: string;
  shareType?: 'public' | 'private';
  collaborators?: GroupCollaborator[];
  allowEditing?: boolean;
}

export interface CreateGroupData {
  name: string;
  description?: string;
}

export interface UpdateGroupData {
  name?: string;
  description?: string;
  isPinned?: boolean;
}

export interface GroupCollaborator {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  permission: 'view' | 'edit' | 'admin';
  joinedAt: Date;
  allowEditing?: boolean;
}

export interface SharedGroup {
  id: string;
  groupId: string;
  shareId: string;
  shareType: 'public' | 'private';
  ownerId: string;
  createdAt: Date;
  expiresAt?: Date;
  name: string;
  description?: string;
  ownerName: string;
  ownerEmail: string;
  collaborators?: GroupCollaborator[];
  allowEditing?: boolean;
  lastEditedBy?: string;
  lastEditedAt?: Date;
}