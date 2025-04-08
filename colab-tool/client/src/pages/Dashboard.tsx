// src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDocument } from '../contexts/DocumentContext';
import Navbar from '../components/Navbar';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { documents, loading, error, fetchDocuments, createDocument, deleteDocument } = useDocument();
  const [newDocumentTitle, setNewDocumentTitle] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch documents on mount
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Handle document creation
  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newDocumentTitle.trim()) return;
    
    const documentId = await createDocument(newDocumentTitle);
    setNewDocumentTitle('');
    setIsCreateModalOpen(false);
    
    // Navigate to the new document if creation was successful
    if (documentId) {
      navigate(`/documents/${documentId}`);
    }
  };

  // Handle document deletion
  const handleDeleteDocument = async (documentId: string) => {
    await deleteDocument(documentId);
    setDeleteConfirmId(null);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">My Documents</h1>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn btn-primary flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              New Document
            </button>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Documents list */}
          {!loading && !error && (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              {documents.length === 0 ? (
                <div className="py-12 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by creating a new document.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="btn btn-primary"
                    >
                      Create a new document
                    </button>
                  </div>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {documents.map((document) => (
                    <li key={document._id}>
                      <div className="px-6 py-4 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <button
                            onClick={() => navigate(`/documents/${document._id}`)}
                            className="text-left block w-full"
                          >
                            <div className="flex items-center">
                              <div className="text-lg font-medium text-primary-600 truncate">
                                {document.title}
                              </div>
                            </div>
                            <div className="mt-1 flex items-center text-sm text-gray-500">
                              <span>Updated {formatDate(document.updatedAt)}</span>
                            </div>
                          </button>
                        </div>
                        <div className="ml-4 flex-shrink-0 flex">
                          {deleteConfirmId === document._id ? (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleDeleteDocument(document._id)}
                                className="text-sm text-red-500 hover:text-red-700"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="text-sm text-gray-500 hover:text-gray-700"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(document._id)}
                              className="text-sm text-gray-500 hover:text-gray-700"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Create document modal */}
          {isCreateModalOpen && (
            <div className="fixed z-10 inset-0 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
                <div
                  className="fixed inset-0 transition-opacity"
                  aria-hidden="true"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                  <form onSubmit={handleCreateDocument}>
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                      <div className="sm:flex sm:items-start">
                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                          <h3
                            className="text-lg leading-6 font-medium text-gray-900"
                            id="modal-title"
                          >
                            Create a new document
                          </h3>
                          <div className="mt-4">
                            <input
                              type="text"
                              className="input"
                              placeholder="Document title"
                              value={newDocumentTitle}
                              onChange={(e) => setNewDocumentTitle(e.target.value)}
                              autoFocus
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                      <button
                        type="submit"
                        className="btn btn-primary sm:ml-3"
                        disabled={!newDocumentTitle.trim()}
                      >
                        Create
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline mt-3 sm:mt-0"
                        onClick={() => setIsCreateModalOpen(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;