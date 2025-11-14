# Mobile API Documentation for Google Notes Extension

This document outlines the API endpoints that can be used for mobile app integration with the Google Notes Extension backend.

## Base Configuration

### Appwrite Setup
```javascript
// Mobile app Appwrite configuration
const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('your-project-id');
```

## Authentication Endpoints

### 1. User Registration
```javascript
// POST /auth/register
const user = await account.create(
    ID.unique(),
    email,
    password,
    name
);
```

### 2. User Login
```javascript
// POST /auth/login
const session = await account.createEmailPasswordSession(
    email,
    password
);
```

### 3. Google OAuth Login
```javascript
// GET /auth/google
const session = await account.createOAuth2Session(
    'google',
    'success-url',
    'failure-url'
);
```

### 4. Get Current User
```javascript
// GET /auth/user
const user = await account.get();
```

### 5. Logout
```javascript
// DELETE /auth/logout
await account.deleteSession('current');
```

## Notes API Endpoints

### 1. Get All Notes
```javascript
// GET /api/notes
const notes = await databases.listDocuments(
    DATABASE_ID,
    NOTES_COLLECTION_ID,
    [
        Query.equal('userId', userId),
        Query.orderDesc('updatedAt'),
        Query.limit(100)
    ]
);
```

**Response Format:**
```json
{
    "documents": [
        {
            "$id": "note-id",
            "title": "Note Title",
            "description": "Note content",
            "color": "yellow",
            "isPinned": false,
            "userId": "user-id",
            "createdAt": "2023-11-13T10:00:00.000Z",
            "updatedAt": "2023-11-13T10:00:00.000Z"
        }
    ],
    "total": 1
}
```

### 2. Create Note
```javascript
// POST /api/notes
const note = await databases.createDocument(
    DATABASE_ID,
    NOTES_COLLECTION_ID,
    ID.unique(),
    {
        title: "New Note",
        description: "Note content",
        color: "yellow",
        isPinned: false,
        userId: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
);
```

### 3. Update Note
```javascript
// PUT /api/notes/:id
const note = await databases.updateDocument(
    DATABASE_ID,
    NOTES_COLLECTION_ID,
    noteId,
    {
        title: "Updated Title",
        description: "Updated content",
        color: "blue",
        isPinned: true,
        updatedAt: new Date().toISOString()
    }
);
```

### 4. Delete Note
```javascript
// DELETE /api/notes/:id
await databases.deleteDocument(
    DATABASE_ID,
    NOTES_COLLECTION_ID,
    noteId
);
```

### 5. Search Notes
```javascript
// GET /api/notes/search?q=query
const notes = await databases.listDocuments(
    DATABASE_ID,
    NOTES_COLLECTION_ID,
    [
        Query.equal('userId', userId),
        Query.search('title', searchQuery),
        Query.orderDesc('updatedAt')
    ]
);
```

### 6. Filter Notes by Color
```javascript
// GET /api/notes/filter?color=yellow
const notes = await databases.listDocuments(
    DATABASE_ID,
    NOTES_COLLECTION_ID,
    [
        Query.equal('userId', userId),
        Query.equal('color', color),
        Query.orderDesc('updatedAt')
    ]
);
```

### 7. Get Pinned Notes
```javascript
// GET /api/notes/pinned
const notes = await databases.listDocuments(
    DATABASE_ID,
    NOTES_COLLECTION_ID,
    [
        Query.equal('userId', userId),
        Query.equal('isPinned', true),
        Query.orderDesc('updatedAt')
    ]
);
```

## Data Models

### User Model
```typescript
interface User {
    $id: string;
    name: string;
    email: string;
    emailVerification: boolean;
    $createdAt: string;
    $updatedAt: string;
}
```

### Note Model
```typescript
interface Note {
    $id: string;
    title: string;
    description: string;
    color: 'yellow' | 'blue' | 'green' | 'pink' | 'purple' | 'orange';
    isPinned: boolean;
    userId: string;
    createdAt: string;
    updatedAt: string;
    $createdAt: string;
    $updatedAt: string;
}
```

## Database Collections Setup

### Notes Collection Schema
```json
{
    "name": "notes",
    "attributes": [
        {
            "key": "title",
            "type": "string",
            "size": 255,
            "required": true
        },
        {
            "key": "description",
            "type": "string",
            "size": 10000,
            "required": false
        },
        {
            "key": "color",
            "type": "string",
            "size": 20,
            "required": true,
            "default": "yellow"
        },
        {
            "key": "isPinned",
            "type": "boolean",
            "required": true,
            "default": false
        },
        {
            "key": "userId",
            "type": "string",
            "size": 36,
            "required": true
        },
        {
            "key": "createdAt",
            "type": "datetime",
            "required": true
        },
        {
            "key": "updatedAt",
            "type": "datetime",
            "required": true
        }
    ],
    "indexes": [
        {
            "key": "userId",
            "type": "key",
            "attributes": ["userId"]
        },
        {
            "key": "createdAt",
            "type": "key",
            "attributes": ["createdAt"]
        }
    ]
}
```

## Error Handling

### Standard Error Response
```json
{
    "message": "Error description",
    "code": 400,
    "type": "general_argument_invalid"
}
```

### Common Error Codes
- `401`: Unauthorized (invalid session)
- `403`: Forbidden (insufficient permissions)
- `404`: Document not found
- `409`: Conflict (duplicate data)
- `500`: Internal server error

## Rate Limiting

- Authentication endpoints: 10 requests per minute
- Notes API endpoints: 100 requests per minute per user
- Search endpoints: 20 requests per minute per user

## Mobile SDK Integration Example

### React Native Example
```typescript
import { Client, Account, Databases, Query, ID } from 'appwrite';

class NotesAPI {
    private client: Client;
    private account: Account;
    private databases: Databases;
    
    constructor() {
        this.client = new Client()
            .setEndpoint('https://cloud.appwrite.io/v1')
            .setProject('your-project-id');
        
        this.account = new Account(this.client);
        this.databases = new Databases(this.client);
    }
    
    async login(email: string, password: string) {
        return await this.account.createEmailPasswordSession(email, password);
    }
    
    async getNotes(userId: string) {
        return await this.databases.listDocuments(
            'notes-database',
            'notes-collection',
            [Query.equal('userId', userId)]
        );
    }
    
    async createNote(noteData: any) {
        return await this.databases.createDocument(
            'notes-database',
            'notes-collection',
            ID.unique(),
            noteData
        );
    }
}
```

### Flutter Example
```dart
import 'package:appwrite/appwrite.dart';

class NotesAPI {
  late Client client;
  late Account account;
  late Databases databases;
  
  NotesAPI() {
    client = Client()
      ..setEndpoint('https://cloud.appwrite.io/v1')
      ..setProject('your-project-id');
    
    account = Account(client);
    databases = Databases(client);
  }
  
  Future<Session> login(String email, String password) async {
    return await account.createEmailPasswordSession(
      email: email,
      password: password,
    );
  }
  
  Future<DocumentList> getNotes(String userId) async {
    return await databases.listDocuments(
      databaseId: 'notes-database',
      collectionId: 'notes-collection',
      queries: [Query.equal('userId', userId)],
    );
  }
}
```

## Offline Support

For mobile apps, implement local caching:

1. **SQLite/Realm**: Store notes locally
2. **Sync Strategy**: 
   - Upload local changes when online
   - Download server changes periodically
   - Handle conflicts with timestamp comparison
3. **Queue System**: Queue API calls when offline

## Push Notifications Setup

Using Appwrite Functions for real-time updates:

```javascript
// Appwrite Function for push notifications
const sdk = require('node-appwrite');

module.exports = async ({ req, res, log, error }) => {
    const client = new sdk.Client()
        .setEndpoint('https://cloud.appwrite.io/v1')
        .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);
    
    // Send push notification when note is shared
    // Implementation depends on your push notification service
};
```

This API documentation provides all the necessary endpoints and examples for building a mobile app that syncs with the Google Notes Chrome Extension.