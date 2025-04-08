// src/pages/DocumentEditor.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Editor as DraftEditor } from 'react-draft-wysiwyg';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import { EditorState, convertToRaw } from 'draft-js';
import { useDocument } from '../contexts/DocumentContext';
import { useEditor } from '../contexts/EditorContext';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import UserCursor from '../components/UserCursor';
import CollaboratorsList from '../components/CollaboratorsList';

const DocumentEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentDocument, fetchDocument, updateDocumentTitle, loading, error } = useDocument();
  const { 
    editorState, 
    updateEditorState, 
    joinDocument, 
    leaveDocument, 
    activeUsers, 
    cursorPositions,
    isConnectedToDocument
  } = useEditor();
  
  const [title, setTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showCollaborators, setShowCollaborators] = useState(false);
  
  // Fetch document on mount and handle cleanup
  useEffect(() => {
    if (id) {
      fetchDocument(id);
    }
    
    return () => {
      leaveDocument();
    };
  }, [id, fetchDocument, leaveDocument]);
  
  // Set title when document is loaded
  useEffect(() => {
    if (currentDocument) {
      setTitle(currentDocument.title);
    }
  }, [currentDocument]);
  
  // Join document for real-time collaboration
  useEffect(() => {
    if (id && !isConnectedToDocument) {
      joinDocument(id);
    }
  }, [id, joinDocument, isConnectedToDocument]);
  
  // Handle title update
  const handleTitleUpdate = async () => {
    if (id && title !== currentDocument?.title) {
      await updateDocumentTitle(id, title);
    }
    setIsEditingTitle(false);
  };
  
  // Save document content when it changes
  useEffect(() => {
    let saveTimer: NodeJS.Timeout;
    
    if (currentDocument && editorState) {
      saveTimer = setTimeout(async () => {
        try {
          const contentState = editorState.getCurrentContent();
          const raw = convertToRaw(contentState);
          const content = JSON.stringify(raw);
          
          // In a real app, you would save the content to the server here
          console.log('Saving document content:', content);
          
          // This would be an API call in a real app
          // await saveDocumentContent(id, content);
        } catch (error) {
          console.error('Error saving document content:', error);
        }
      }, 2000); // Save after 2 seconds of inactivity
    }
    
    return () => {
      clearTimeout(saveTimer);
    };
  }, [currentDocument, editorState]);
  
  // If document not found or loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !currentDocument) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {error || 'Document not found'}
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="mt-4 btn btn-outline"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-between items-center">
          <div className="flex-1">
            {isEditingTitle ? (
              <div className="flex items-center">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-3xl font-bold text-gray-900 bg-white border-b-2 border-primary-500 focus:outline-none"
                  autoFocus
                  onBlur={handleTitleUpdate}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleTitleUpdate();
                    }
                  }}
                />
                <button
                  onClick={handleTitleUpdate}
                  className="ml-2 p-1 rounded-full hover:bg-gray-200"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-primary-600"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            ) : (
              <h1
                className="text-3xl font-bold text-gray-900 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                onClick={() => setIsEditingTitle(true)}
              >
                {title}
                <span className="ml-2 text-sm text-gray-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 inline"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </span>
              </h1>
            )}
          </div>
          
          <div className="flex items-center">
            <div className="relative">
              <button
                onClick={() => setShowCollaborators(!showCollaborators)}
                className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                <span>Collaborators ({activeUsers.length})</span>
              </button>
              
              {showCollaborators && (
                <CollaboratorsList 
                  documentId={id || ''} 
                  activeUsers={activeUsers} 
                  onClose={() => setShowCollaborators(false)} 
                />
              )}
            </div>
            
            <button
              onClick={() => navigate('/')}
              className="ml-4 btn btn-outline"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
        
        <div className="bg-white shadow-md rounded-lg overflow-hidden relative">
          {/* Editor */}
          <DraftEditor
            editorState={editorState}
            onEditorStateChange={updateEditorState}
            toolbar={{
              options: ['inline', 'blockType', 'fontSize', 'list', 'textAlign', 'colorPicker', 'link', 'history'],
              inline: {
                options: ['bold', 'italic', 'underline', 'strikethrough'],
              },
            }}
            editorClassName="min-h-[500px] px-4"
          />
          
          {/* Cursors for other users */}
          {cursorPositions
            .filter(cursor => cursor.userId !== user?.id)
            .map(cursor => (
              <UserCursor 
                key={cursor.userId} 
                userId={cursor.userId} 
                position={cursor.position}
                username={cursor.username}
              />
            ))}
        </div>
        
        {/* Active users indicator */}
        <div className="mt-4 flex items-center text-sm text-gray-500">
          <span>
            {activeUsers.length} {activeUsers.length === 1 ? 'user' : 'users'} active
          </span>
        </div>
      </div>
    </div>
  );
};

export default DocumentEditor;