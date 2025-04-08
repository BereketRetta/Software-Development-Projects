// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { DocumentProvider } from './contexts/DocumentContext';
import { EditorProvider } from './contexts/EditorContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DocumentEditor from './pages/DocumentEditor';
import NotFound from './pages/NotFound';

// Protected route component
const ProtectedRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  return user ? element : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <DocumentProvider>
          <EditorProvider>
            <Router>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected routes */}
                <Route path="/" element={<ProtectedRoute element={<Dashboard />} />} />
                <Route path="/documents/:id" element={<ProtectedRoute element={<DocumentEditor />} />} />
                
                {/* 404 route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Router>
          </EditorProvider>
        </DocumentProvider>
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;