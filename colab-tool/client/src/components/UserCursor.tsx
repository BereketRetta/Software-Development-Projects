// src/components/UserCursor.tsx
import React, { useState, useEffect } from 'react';

interface UserCursorProps {
  userId: string;
  position: number;
  username?: string;
}

const UserCursor: React.FC<UserCursorProps> = ({ userId, position, username }) => {
  const [cursorPosition, setCursorPosition] = useState({ top: 0, left: 0 });
  
  // Generate a random color based on userId
  const getUserColor = (id: string) => {
    // Simple hash function for consistent color per user
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Convert to hex color
    const color = Math.floor(Math.abs(Math.sin(hash) * 16777215) % 16777215).toString(16);
    return '#' + ('000000' + color).slice(-6);
  };
  
  // Update cursor position based on editor content
  useEffect(() => {
    // This is a simplified approach. In a real app, you'd need to:
    // 1. Map position (character index) to DOM position
    // 2. Handle line breaks, formatting, etc.
    
    // For demo purposes, we'll place cursors at random positions
    const editorElement = document.querySelector('.public-DraftEditor-content');
    
    if (editorElement) {
      const editorRect = editorElement.getBoundingClientRect();
      const editorHeight = editorRect.height;
      const editorWidth = editorRect.width;
      
      // Somewhat randomize position for demo
      const pseudoRandom = Math.abs(userId.charCodeAt(0) * position) % 100;
      
      setCursorPosition({
        top: (pseudoRandom * editorHeight / 100) + 50, // Add some offset
        left: ((position % 80) * editorWidth / 80) + 20, // Limit to reasonable width
      });
    }
  }, [userId, position]);
  
  const cursorColor = getUserColor(userId);
  
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        top: cursorPosition.top + 'px',
        left: cursorPosition.left + 'px',
        transition: 'top 0.3s ease, left 0.3s ease',
      }}
    >
      {/* Cursor */}
      <div style={{ position: 'relative' }}>
        <div
          style={{
            width: '2px',
            height: '20px',
            backgroundColor: cursorColor,
            position: 'absolute',
            transform: 'translateX(-50%)',
          }}
        ></div>
        
        {/* Username label */}
        <div
          style={{
            position: 'absolute',
            top: '-18px',
            left: '2px',
            backgroundColor: cursorColor,
            color: '#fff',
            fontSize: '10px',
            padding: '2px 4px',
            borderRadius: '2px',
            whiteSpace: 'nowrap',
          }}
        >
          {username || `User ${userId.substring(0, 4)}`}
        </div>
      </div>
    </div>
  );
};

export default UserCursor;