// src/contexts/AuthContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Types
interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

// Create context with default values
export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: false,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  clearError: () => {},
});

// Auth provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // API URL
  const API_URL = 'http://10.0.2.2:5000'; // Use 10.0.2.2 for Android emulator to connect to localhost

  // Initialize auth state from AsyncStorage
  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const storedUser = await AsyncStorage.getItem('user');
        
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          
          // Set authorization header for all requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        }
      } catch (err) {
        console.error('Error loading auth from storage:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadStoredAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password
      });
      
      const { token: newToken, user: userData } = response.data;
      
      // Save to state
      setToken(newToken);
      setUser(userData);
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('token', newToken);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      // Set authorization header for all requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (username: string, email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        username,
        email,
        password
      });
      
      const { token: newToken, user: userData } = response.data;
      
      // Save to state
      setToken(newToken);
      setUser(userData);
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('token', newToken);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      // Set authorization header for all requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Clear state
      setToken(null);
      setUser(null);
      
      // Clear AsyncStorage
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      
      // Clear authorization header
      delete axios.defaults.headers.common['Authorization'];
    } catch (err) {
      console.error('Error during logout:', err);
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Context value
  const value = {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using auth context
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};