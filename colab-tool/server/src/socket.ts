// src/socket.ts
import { Server, Socket } from 'socket.io';

// Define types for our operations
interface TextOperation {
  type: 'insert' | 'delete';
  position: number;
  text?: string;
  length?: number;
  userId: string;
  documentId: string;
  timestamp: number;
}

// Track active users per document
const activeDocuments: Record<string, Set<string>> = {};

export function setupSocketHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    console.log('New client connected:', socket.id);
    
    // Handle joining a document
    socket.on('join-document', ({ documentId, userId }) => {
      console.log(`User ${userId} joined document ${documentId}`);
      
      // Join the document room
      socket.join(documentId);
      
      // Track active users
      if (!activeDocuments[documentId]) {
        activeDocuments[documentId] = new Set();
      }
      activeDocuments[documentId].add(userId);
      
      // Notify others that a new user joined
      socket.to(documentId).emit('user-joined', { 
        userId, 
        users: Array.from(activeDocuments[documentId])
      });
      
      // Send active users to the new user
      socket.emit('active-users', {
        users: Array.from(activeDocuments[documentId])
      });
    });
    
    // Handle document operations
    socket.on('document-operation', (operation: TextOperation) => {
      console.log('Received operation:', operation);
      
      // Broadcast to all clients in the document room except sender
      socket.to(operation.documentId).emit('document-operation', operation);
      
      // Here you would also persist the operation to the database
      // This is simplified for now
    });
    
    // Handle cursor position updates
    socket.on('cursor-position', ({ documentId, userId, position }) => {
      // Broadcast cursor position to all clients in the document
      socket.to(documentId).emit('cursor-position', { userId, position });
    });
    
    // Handle leaving a document
    socket.on('leave-document', ({ documentId, userId }) => {
      handleUserLeaveDocument(socket, documentId, userId);
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      // Clean up any documents the user was in
      // This requires mapping socket.id to userId and documentIds
      // We're simplifying here but in production would need proper tracking
    });
  });
}

// Helper function to handle a user leaving a document
function handleUserLeaveDocument(socket: Socket, documentId: string, userId: string): void {
  console.log(`User ${userId} left document ${documentId}`);
  
  socket.leave(documentId);
  
  if (activeDocuments[documentId]) {
    activeDocuments[documentId].delete(userId);
    
    // Notify others that user left
    socket.to(documentId).emit('user-left', {
      userId,
      users: Array.from(activeDocuments[documentId])
    });
    
    // Clean up if no users left
    if (activeDocuments[documentId].size === 0) {
      delete activeDocuments[documentId];
    }
  }
}