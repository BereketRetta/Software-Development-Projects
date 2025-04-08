// src/components/CollaboratorsList.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useDocument } from '../contexts/DocumentContext';
import { useAuth } from '../contexts/AuthContext';

interface CollaboratorsListProps {
  documentId: string;
  activeUsers: string[];
  onClose: () => void;
}

interface Collaborator {
  id: string;
  username: string;
  email: string;
  isActive: boolean;
  isOwner: boolean;
}

const CollaboratorsList: React.FC<CollaboratorsListProps> = ({ documentId, activeUsers, onClose }) => {
  const { user } = useAuth();
  const { currentDocument, addCollaborator, removeCollaborator, loading } = useDocument();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState('');
  const [error, setError] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  
  // Prepare collaborators list
  useEffect(() => {
    if (currentDocument) {
      // This is a simplified approach. In a real app, you'd fetch collaborator details from the API
      // For demo purposes, we'll create mock collaborators
      const collaboratorsList: Collaborator[] = [];
      
      // Add owner
      collaboratorsList.push({
        id: currentDocument.owner,
        username: currentDocument.owner === user?.id ? user.username : 'Document Owner',
        email: currentDocument.owner === user?.id ? user.email : 'owner@example.com',
        isActive: activeUsers.includes(currentDocument.owner),
        isOwner: true
      });
      
      // Add other collaborators
      currentDocument.collaborators.forEach(collaboratorId => {
        if (collaboratorId !== currentDocument.owner) {
          collaboratorsList.push({
            id: collaboratorId,
            username: collaboratorId === user?.id ? user.username : `User ${collaboratorId.substring(0, 4)}`,
            email: collaboratorId === user?.id ? user.email : `user-${collaboratorId.substring(0, 4)}@example.com`,
            isActive: activeUsers.includes(collaboratorId),
            isOwner: false
          });
        }
      });
      
      setCollaborators(collaboratorsList);
    }
  }, [currentDocument, user, activeUsers]);
  
  // Handle add collaborator
  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!newCollaboratorEmail.trim()) {
      setError('Email is required');
      return;
    }
    
    try {
      await addCollaborator(documentId, newCollaboratorEmail);
      setNewCollaboratorEmail('');
    } catch (err: any) {
      setError(err.message || 'Failed to add collaborator');
    }
  };
  
  // Handle remove collaborator
  const handleRemoveCollaborator = async (collaboratorId: string) => {
    try {
      await removeCollaborator(documentId, collaboratorId);
    } catch (err: any) {
      setError(err.message || 'Failed to remove collaborator');
    }
  };
  
  // Check if current user is the owner
  const isOwner = currentDocument?.owner === user?.id;
  
  return (
    <div
      ref={menuRef}
      className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg z-10"
    >
      <div className="py-2 px-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Collaborators</h3>
      </div>
      
      <div className="max-h-60 overflow-y-auto p-2">
        {collaborators.map(collaborator => (
          <div key={collaborator.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md">
            <div className="flex items-center">
              <div className="mr-2 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700">
                {collaborator.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900 flex items-center">
                  {collaborator.username}
                  {collaborator.isActive && (
                    <span className="ml-2 h-2 w-2 rounded-full bg-green-500" title="Online"></span>
                  )}
                  {collaborator.isOwner && (
                    <span className="ml-1 text-xs bg-gray-100 text-gray-700 px-1 rounded">Owner</span>
                  )}
                </div>
                <div className="text-xs text-gray-500">{collaborator.email}</div>
              </div>
            </div>
            
            {isOwner && !collaborator.isOwner && (
              <button
                onClick={() => handleRemoveCollaborator(collaborator.id)}
                className="text-red-500 hover:text-red-700 text-xs"
                disabled={loading}
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
      
      {isOwner && (
        <div className="p-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Add Collaborator</h4>
          
          <form onSubmit={handleAddCollaborator}>
            {error && (
              <div className="text-xs text-red-500 mb-2">{error}</div>
            )}
            
            <div className="flex">
              <input
                type="email"
                className="flex-1 input text-sm py-1"
                placeholder="Email address"
                value={newCollaboratorEmail}
                onChange={(e) => setNewCollaboratorEmail(e.target.value)}
              />
              <button
                type="submit"
                className="ml-2 btn btn-primary text-sm py-1"
                disabled={loading}
              >
                Add
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CollaboratorsList;