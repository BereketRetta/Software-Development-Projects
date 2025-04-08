# Real-time Collaboration Tool

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue.svg)
![React](https://img.shields.io/badge/React-19.1-61DAFB.svg)
![Node.js](https://img.shields.io/badge/Node.js-18.x-339933.svg)

A modern, full-stack, cross-platform collaboration tool built with TypeScript that enables real-time document editing across web and mobile platforms.

![Dashboard Screenshot](<client/screenshots/dashboard.svg>)
![Editor Screenshot](<client/screenshots/editor.svg>)

## Architecture

The application is built as a full-stack solution with three primary components:

### Backend

- Node.js with Express for RESTful API endpoints
- Socket.IO for WebSocket-based real-time communication
- MongoDB for document storage and user management
- JWT for secure authentication

### Web Client

- React with TypeScript for a type-safe frontend
- Draft.js for rich text editing capabilities
- Tailwind CSS for responsive, utility-first design
- Socket.IO-client for real-time connections

### Mobile Client

- React Native with Expo for cross-platform support
- React Navigation for native-feeling navigation
- React Native Paper for material design components
- Socket.IO-client for real-time capabilities

## Technical Implementation

### Real-time Synchronization

The application uses Operational Transformation (OT) via WebSockets for real-time synchronization.

```typescript
// Simplified operational transformation
export const transformOperation = (
  operation: TextOperation,
  against: TextOperation
): TextOperation => {
  if (operation.userId === against.userId || operation.documentId !== against.documentId) {
    return operation;
  }

  if (against.type === 'insert' && against.text && against.position <= operation.position) {
    return { ...operation, position: operation.position + against.text.length };
  }

  // Additional transformation logic...

  return operation;
};
```

### Document Conflict Resolution

Concurrent edits use version-based conflict resolution:

- Each document maintains a version counter
- Operations include the document version upon creation
- Server transforms operations against concurrent ones
- Clients apply transformed operations locally

### Socket-based Presence Tracking

User presence and cursor tracking:

```typescript
// Server-side user tracking
const activeDocuments: Record<string, Set<string>> = {};

socket.on('join-document', ({ documentId, userId }) => {
  activeDocuments[documentId] ||= new Set();
  activeDocuments[documentId].add(userId);

  socket.to(documentId).emit('user-joined', {
    userId,
    users: Array.from(activeDocuments[documentId]),
  });
});
```

### Cross-platform State Management

Shared context-based state management for web and mobile:

```typescript
const fetchDocument = async (id: string) => {
  try {
    setLoading(true);
    setError(null);
    setupAxiosHeaders();

    const response = await axios.get(`${API_URL}/api/documents/${id}`);
    setCurrentDocument(response.data.document);
  } catch (err: any) {
    const errorMessage = err.response?.data?.message || 'Failed to fetch document';
    setError(errorMessage);
  } finally {
    setLoading(false);
  }
};
```

## Installation & Setup

### Prerequisites

- Node.js >=18.x
- MongoDB >=6.0
- npm or yarn

### Backend Setup

```bash
cd collab-tool/server
npm install
touch .env
# Edit .env with your MongoDB URI and JWT secret
npm run dev
```

### Web Client Setup

```bash
cd collab-tool/client
npm install
npm start
```

### Mobile Client Setup

```bash
cd collab-tool/mobile
npm install
npm start
```

## API Documentation

### Authentication

- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Authenticate user

### Documents

- `GET /api/documents` - Retrieve user's documents
- `GET /api/documents/:id` - Get specific document
- `POST /api/documents` - Create document
- `PUT /api/documents/:id/title` - Update document title
- `POST /api/documents/:id/collaborators` - Add collaborator
- `DELETE /api/documents/:id/collaborators/:collaboratorId` - Remove collaborator
- `DELETE /api/documents/:id` - Delete document

### WebSocket Events

- `join-document`
- `leave-document`
- `document-operation`
- `cursor-position`
- `user-joined`
- `user-left`

## Performance Considerations

- Debounced Updates
- Selective Re-rendering
- Optimistic UI Updates
- Incremental Operations

## Security Considerations

- JWT Authentication
- Authorization checks
- Input validation
- Proper CORS setup

## Future Enhancements

- Operational Transformation/CRDT enhancements
- Document versioning/history
- Advanced formatting/media support
- Offline synchronization
- End-to-end encryption
