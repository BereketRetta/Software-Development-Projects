// src/contexts/EditorContext.tsx
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { useDocument } from './DocumentContext';

// Types
interface TextOperation {
  type: 'insert' | 'delete';
  position: number;
  text?: string;
  length?: number;
  userId: string;
  documentId: string;
  timestamp: number;
}

interface CursorPosition {
  userId: string;
  position: number;
  username?: string;
}

interface EditorContextType {
  documentContent: string;
  activeUsers: string[];
  cursorPositions: CursorPosition[];
  isConnectedToDocument: boolean;
  joinDocument: (documentId: string) => void;
  leaveDocument: () => void;
  updateContent: (newContent: string) => void;
  applyOperation: (operation: TextOperation) => void;
  sendCursorPosition: (position: number) => void;
}

// Create context with default values
export const EditorContext = createContext<EditorContextType>({
  documentContent: '',
  activeUsers: [],
  cursorPositions: [],
  isConnectedToDocument: false,
  joinDocument: () => {},
  leaveDocument: () => {},
  updateContent: () => {},
  applyOperation: () => {},
  sendCursorPosition: () => {},
});

// Editor provider component
interface EditorProviderProps {
  children: ReactNode;
}

export const EditorProvider: React.FC<EditorProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { currentDocument } = useDocument();
  
  const [documentContent, setDocumentContent] = useState('');
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);
  const [activeUsers, setActiveUsers] = useState<string[]>([]);
  const [cursorPositions, setCursorPositions] = useState<CursorPosition[]>([]);
  const [isConnectedToDocument, setIsConnectedToDocument] = useState(false);

  // Initialize document content when current document changes
  useEffect(() => {
    if (currentDocument) {
      // For mobile, we'll use plain text content for simplicity
      setDocumentContent(currentDocument.content || '');
    } else {
      setDocumentContent('');
    }
  }, [currentDocument]);

  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Handle user joined event
    const handleUserJoined = ({ userId, users }: { userId: string; users: string[] }) => {
      setActiveUsers(users);
    };

    // Handle user left event
    const handleUserLeft = ({ userId, users }: { userId: string; users: string[] }) => {
      setActiveUsers(users);
      // Remove cursor position for user who left
      setCursorPositions(prev => prev.filter(cursor => cursor.userId !== userId));
    };

    // Handle active users event
    const handleActiveUsers = ({ users }: { users: string[] }) => {
      setActiveUsers(users);
    };

    // Handle document operation event
    const handleDocumentOperation = (operation: TextOperation) => {
      applyOperation(operation);
    };

    // Handle cursor position event
    const handleCursorPosition = ({ userId, position }: { userId: string; position: number }) => {
      setCursorPositions(prev => {
        // Update existing cursor position or add new one
        const existingIndex = prev.findIndex(cursor => cursor.userId === userId);
        if (existingIndex !== -1) {
          const updated = [...prev];
          updated[existingIndex] = { ...updated[existingIndex], position };
          return updated;
        } else {
          return [...prev, { userId, position }];
        }
      });
    };

    // Register event listeners
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    socket.on('active-users', handleActiveUsers);
    socket.on('document-operation', handleDocumentOperation);
    socket.on('cursor-position', handleCursorPosition);

    // Cleanup
    return () => {
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
      socket.off('active-users', handleActiveUsers);
      socket.off('document-operation', handleDocumentOperation);
      socket.off('cursor-position', handleCursorPosition);
    };
  }, [socket]);

  // Join a document
  const joinDocument = (documentId: string) => {
    if (!socket || !user) return;

    setCurrentDocumentId(documentId);
    socket.emit('join-document', { documentId, userId: user.id });
    setIsConnectedToDocument(true);
  };

  // Leave a document
  const leaveDocument = () => {
    if (!socket || !user || !currentDocumentId) return;

    socket.emit('leave-document', {
      documentId: currentDocumentId,
      userId: user.id
    });

    setCurrentDocumentId(null);
    setIsConnectedToDocument(false);
    setActiveUsers([]);
    setCursorPositions([]);
  };

  // Update content and emit changes
  const updateContent = (newContent: string) => {
    if (user && currentDocumentId && socket) {
      // Send operation
      const operation: TextOperation = {
        type: 'insert',
        position: 0,
        text: newContent,
        userId: user.id,
        documentId: currentDocumentId,
        timestamp: Date.now()
      };

      socket.emit('document-operation', operation);
    }

    setDocumentContent(newContent);
  };

  // Apply an operation to the content
  const applyOperation = (operation: TextOperation) => {
    // Skip operations from the current user
    if (user && operation.userId === user.id) return;

    // Apply the operation to the content
    if (operation.type === 'insert' && operation.text) {
      setDocumentContent(operation.text);
    }
    // In a real implementation, we would handle more complex operations
  };

  // Send cursor position
  const sendCursorPosition = (position: number) => {
    if (!socket || !user || !currentDocumentId) return;

    socket.emit('cursor-position', {
      documentId: currentDocumentId,
      userId: user.id,
      position
    });
  };

  // Context value
  const value = {
    documentContent,
    activeUsers,
    cursorPositions,
    isConnectedToDocument,
    joinDocument,
    leaveDocument,
    updateContent,
    applyOperation,
    sendCursorPosition
  };

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
};

// Custom hook for using editor context
export const useEditor = () => {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
};