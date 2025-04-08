// src/contexts/DocumentContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

// Document types
export interface Document {
  _id: string;
  title: string;
  content: string;
  owner: string;
  collaborators: string[];
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface Collaborator {
  id: string;
  username: string;
  email: string;
}

// Document context type
interface DocumentContextType {
  documents: Document[];
  currentDocument: Document | null;
  loading: boolean;
  error: string | null;
  fetchDocuments: () => Promise<void>;
  fetchDocument: (id: string) => Promise<void>;
  createDocument: (title: string) => Promise<string | null>;
  updateDocumentTitle: (id: string, title: string) => Promise<void>;
  addCollaborator: (documentId: string, email: string) => Promise<void>;
  removeCollaborator: (documentId: string, collaboratorId: string) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  clearCurrentDocument: () => void;
  clearError: () => void;
}

// Create context with default values
export const DocumentContext = createContext<DocumentContextType>({
  documents: [],
  currentDocument: null,
  loading: false,
  error: null,
  fetchDocuments: async () => {},
  fetchDocument: async () => {},
  createDocument: async () => null,
  updateDocumentTitle: async () => {},
  addCollaborator: async () => {},
  removeCollaborator: async () => {},
  deleteDocument: async () => {},
  clearCurrentDocument: () => {},
  clearError: () => {},
});

// Document provider component
interface DocumentProviderProps {
  children: ReactNode;
}

export const DocumentProvider: React.FC<DocumentProviderProps> = ({ children }) => {
  const { token } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // API URL
  const API_URL = 'http://10.0.2.2:5000';

  // Set up axios headers
  const setupAxiosHeaders = () => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  };

  // Fetch all documents
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      setupAxiosHeaders();
      
      const response = await axios.get(`${API_URL}/api/documents`);
      setDocuments(response.data.documents);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch documents';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fetch a single document
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

  // Create a new document
  const createDocument = async (title: string): Promise<string | null> => {
    try {
      setLoading(true);
      setError(null);
      setupAxiosHeaders();
      
      const response = await axios.post(`${API_URL}/api/documents`, { title });
      
      // Add new document to local state
      const newDocument = response.data.document;
      setDocuments([...documents, newDocument]);
      
      // Return the new document ID
      return newDocument.id;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create document';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update document title
  const updateDocumentTitle = async (id: string, title: string) => {
    try {
      setLoading(true);
      setError(null);
      setupAxiosHeaders();
      
      await axios.put(`${API_URL}/api/documents/${id}/title`, { title });
      
      // Update local state
      setDocuments(
        documents.map(doc => 
          doc._id === id ? { ...doc, title } : doc
        )
      );
      
      if (currentDocument && currentDocument._id === id) {
        setCurrentDocument({ ...currentDocument, title });
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update document title';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Add a collaborator
  const addCollaborator = async (documentId: string, email: string) => {
    try {
      setLoading(true);
      setError(null);
      setupAxiosHeaders();
      
      await axios.post(`${API_URL}/api/documents/${documentId}/collaborators`, { email });
      
      // Refresh document data
      if (currentDocument && currentDocument._id === documentId) {
        fetchDocument(documentId);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to add collaborator';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Remove a collaborator
  const removeCollaborator = async (documentId: string, collaboratorId: string) => {
    try {
      setLoading(true);
      setError(null);
      setupAxiosHeaders();
      
      await axios.delete(`${API_URL}/api/documents/${documentId}/collaborators/${collaboratorId}`);
      
      // Refresh document data
      if (currentDocument && currentDocument._id === documentId) {
        fetchDocument(documentId);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to remove collaborator';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Delete a document
  const deleteDocument = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      setupAxiosHeaders();
      
      await axios.delete(`${API_URL}/api/documents/${id}`);
      
      // Update local state
      setDocuments(documents.filter(doc => doc._id !== id));
      
      // Clear current document if it's the one being deleted
      if (currentDocument && currentDocument._id === id) {
        setCurrentDocument(null);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete document';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Clear current document
  const clearCurrentDocument = () => {
    setCurrentDocument(null);
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Context value
  const value = {
    documents,
    currentDocument,
    loading,
    error,
    fetchDocuments,
    fetchDocument,
    createDocument,
    updateDocumentTitle,
    addCollaborator,
    removeCollaborator,
    deleteDocument,
    clearCurrentDocument,
    clearError
  };

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
};

// Custom hook for using document context
export const useDocument = () => {
  const context = useContext(DocumentContext);
  if (context === undefined) {
    throw new Error('useDocument must be used within a DocumentProvider');
  }
  return context;
};