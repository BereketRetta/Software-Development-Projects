// src/contexts/EditorContext.tsx
import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { EditorState, ContentState, convertToRaw, convertFromRaw } from 'draft-js';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { useDocument, Document } from './DocumentContext';

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
  editorState: EditorState;
  activeUsers: string[];
  cursorPositions: CursorPosition[];
  isConnectedToDocument: boolean;
  joinDocument: (documentId: string) => void;
  leaveDocument: () => void;
  updateEditorState: (newState: EditorState) => void;
  applyOperation: (operation: TextOperation) => void;
  sendCursorPosition: (position: number) => void;
}

// Create context with default values
export const EditorContext = createContext<EditorContextType>({
  editorState: EditorState.createEmpty(),
  activeUsers: [],
  cursorPositions: [],
  isConnectedToDocument: false,
  joinDocument: () => {},
  leaveDocument: () => {},
  updateEditorState: () => {},
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
  
  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);
  const [activeUsers, setActiveUsers] = useState<string[]>([]);
  const [cursorPositions, setCursorPositions] = useState<CursorPosition[]>([]);
  const [isConnectedToDocument, setIsConnectedToDocument] = useState(false);

  // Initialize editor state when current document changes
  useEffect(() => {
    if (currentDocument && currentDocument.content) {
      try {
        // Try to parse the content as raw DraftJS content
        const contentState = convertFromRaw(JSON.parse(currentDocument.content));
        setEditorState(EditorState.createWithContent(contentState));
      } catch (error) {
        // If parsing fails, create editor with plain text content
        const contentState = ContentState.createFromText(currentDocument.content);
        setEditorState(EditorState.createWithContent(contentState));
      }
    } else {
      // If no document or no content, create empty editor
      setEditorState(EditorState.createEmpty());
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
  const joinDocument = useCallback((documentId: string) => {
    if (!socket || !user) return;
  
    setCurrentDocumentId(documentId);
    socket.emit('join-document', { documentId, userId: user.id });
    setIsConnectedToDocument(true);
  }, [socket, user]);
  
  // Leave a document
  const leaveDocument = useCallback(() => {
    if (!socket || !user || !currentDocumentId) return;
    
    socket.emit('leave-document', {
      documentId: currentDocumentId,
      userId: user.id
    });
  
    setCurrentDocumentId(null);
    setIsConnectedToDocument(false);
    setActiveUsers([]);
    setCursorPositions([]);
  }, [socket, user, currentDocumentId]);

  // Update editor state and emit changes
  const updateEditorState = (newState: EditorState) => {
    const prevContent = editorState.getCurrentContent();
    const newContent = newState.getCurrentContent();

    // Only process if content actually changed
    if (prevContent !== newContent && user && currentDocumentId && socket) {
      // Get selection state for cursor position
      const selection = newState.getSelection();
      const cursorPosition = selection.getAnchorOffset();

      // Send cursor position
      sendCursorPosition(cursorPosition);

      // Generate and send operation
      // This is a simplified approach - a real OT implementation would be more complex
      // We would need to calculate the exact changes between the two content states
      const rawPrev = convertToRaw(prevContent);
      const rawNew = convertToRaw(newContent);
      
      // For this demo, we'll just send the entire content as an insert operation
      // In a real app, you would calculate the actual diffs and send minimal operations
      const operation: TextOperation = {
        type: 'insert',
        position: 0,
        text: JSON.stringify(rawNew),
        userId: user.id,
        documentId: currentDocumentId,
        timestamp: Date.now()
      };

      socket.emit('document-operation', operation);
    }

    setEditorState(newState);
  };

  // Apply an operation to the editor state
  const applyOperation = (operation: TextOperation) => {
    // Skip operations from the current user
    if (user && operation.userId === user.id) return;

    // Apply the operation to the editor state
    if (operation.type === 'insert' && operation.text) {
      try {
        // For our simplified approach, replace the entire content
        const contentState = convertFromRaw(JSON.parse(operation.text));
        setEditorState(EditorState.createWithContent(contentState));
      } catch (error) {
        console.error('Error applying insert operation:', error);
      }
    }
    
    // In a real implementation, we would handle delete operations
    // and more precise insert operations here
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
    editorState,
    activeUsers,
    cursorPositions,
    isConnectedToDocument,
    joinDocument,
    leaveDocument,
    updateEditorState,
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