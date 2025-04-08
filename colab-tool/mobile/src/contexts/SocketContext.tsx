// src/contexts/SocketContext.tsx
import React, { createContext, useState, useEffect, useRef, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

// Socket context type
interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectToSocket: () => void;
  disconnectSocket: () => void;
}

// Create context with default values
export const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  connectToSocket: () => {},
  disconnectSocket: () => {},
});

// Socket provider component
interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  
  // Socket server URL
  const SOCKET_URL = 'http://10.0.2.2:5000'; // Use 10.0.2.2 for Android emulator

  // Connect to socket
  const connectToSocket = () => {
    // If token doesn't exist or socket already connected, do nothing
    if (!token || socketRef.current) return;

    // Create socket connection
    const newSocket = io(SOCKET_URL, {
      auth: {
        token
      },
      transports: ['websocket'],
    });

    // Set up event listeners
    newSocket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    // Save socket to ref
    socketRef.current = newSocket;
  };

  // Disconnect socket
  const disconnectSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);

  // Connect automatically when token is available
  useEffect(() => {
    if (token && !socketRef.current) {
      connectToSocket();
    }
  }, [token]);

  // Context value
  const value = {
    socket: socketRef.current,
    isConnected,
    connectToSocket,
    disconnectSocket
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook for using socket context
export const useSocket = () => {
  const context = React.useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};