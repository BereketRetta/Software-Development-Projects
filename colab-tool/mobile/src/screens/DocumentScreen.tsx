// src/screens/DocumentScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Appbar, TextInput, ActivityIndicator, Text, Button, Chip, Portal, Dialog, List } from 'react-native-paper';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDocument } from '../contexts/DocumentContext';
import { useEditor } from '../contexts/EditorContext';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../../App';

type DocumentScreenRouteProp = RouteProp<RootStackParamList, 'Document'>;
type DocumentScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Document'>;

const DocumentScreen = () => {
  const route = useRoute<DocumentScreenRouteProp>();
  const navigation = useNavigation<DocumentScreenNavigationProp>();
  const { id, title: initialTitle } = route.params;
  const { user } = useAuth();
  const { currentDocument, fetchDocument, updateDocumentTitle, loading, error } = useDocument();
  const {
    documentContent,
    updateContent,
    joinDocument,
    leaveDocument,
    activeUsers,
    isConnectedToDocument,
  } = useEditor();
  
  const [title, setTitle] = useState(initialTitle);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [content, setContent] = useState('');
  const [isUsersDialogVisible, setIsUsersDialogVisible] = useState(false);
  
  // Fetch document on mount and handle cleanup
  useEffect(() => {
    fetchDocument(id);
    
    return () => {
      leaveDocument();
    };
  }, [id, fetchDocument, leaveDocument]);
  
  // Join document for real-time collaboration
  useEffect(() => {
    if (id && !isConnectedToDocument) {
      joinDocument(id);
    }
  }, [id, joinDocument, isConnectedToDocument]);
  
  // Update local content when document content changes
  useEffect(() => {
    setContent(documentContent);
  }, [documentContent]);
  
  // Update title in header when it changes
  useEffect(() => {
    navigation.setOptions({
      title: title,
    });
  }, [title, navigation]);
  
  // Handle title update
  const handleTitleUpdate = async () => {
    if (title !== currentDocument?.title) {
      await updateDocumentTitle(id, title);
      navigation.setParams({ title });
    }
    setIsEditingTitle(false);
  };
  
  // Handle content change
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    updateContent(newContent);
  };
  
  // Format active users for display
  const getActiveUsersList = () => {
    if (activeUsers.length === 0) {
      return 'No active users';
    }
    
    return `${activeUsers.length} active user${activeUsers.length > 1 ? 's' : ''}`;
  };
  
  // If document loading
  if (loading && !currentDocument) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  
  // If error
  if (error || !currentDocument) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error || 'Document not found'}</Text>
        <Button
          mode="contained"
          onPress={() => navigation.goBack()}
          style={styles.button}
        >
          Back to Dashboard
        </Button>
      </View>
    );
  }
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={90}
    >
      <Appbar.Header>
        {isEditingTitle ? (
          <TextInput
            value={title}
            onChangeText={setTitle}
            style={styles.titleInput}
            onBlur={handleTitleUpdate}
            onSubmitEditing={handleTitleUpdate}
            autoFocus
          />
        ) : (
          <Appbar.Content
            title={title}
            onPress={() => setIsEditingTitle(true)}
          />
        )}
        <Appbar.Action
          icon="account-group"
          onPress={() => setIsUsersDialogVisible(true)}
        />
        <Appbar.Action icon="keyboard-backspace" onPress={() => navigation.goBack()} />
      </Appbar.Header>
      
      <View style={styles.content}>
        <TextInput
          value={content}
          onChangeText={handleContentChange}
          multiline
          style={styles.editor}
          placeholder="Start typing here..."
        />
      </View>
      
      <View style={styles.footer}>
        <Chip icon="account-group" onPress={() => setIsUsersDialogVisible(true)}>
          {getActiveUsersList()}
        </Chip>
      </View>
      
      {/* Active users dialog */}
      <Portal>
        <Dialog visible={isUsersDialogVisible} onDismiss={() => setIsUsersDialogVisible(false)}>
          <Dialog.Title>Active Users</Dialog.Title>
          <Dialog.Content>
            {activeUsers.length === 0 ? (
              <Text>No active users</Text>
            ) : (
              <List.Section>
                {activeUsers.map(userId => (
                  <List.Item
                    key={userId}
                    title={userId === user?.id ? `${user.username} (You)` : `User ${userId.substring(0, 4)}`}
                    left={props => <List.Icon {...props} icon="account" />}
                  />
                ))}
              </List.Section>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setIsUsersDialogVisible(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  titleInput: {
    flex: 1,
    height: 40,
    backgroundColor: 'transparent',
    color: '#fff',
  },
  editor: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    fontSize: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    flexDirection: 'row',
  },
  error: {
    color: '#ef4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    marginTop: 16,
  },
});

export default DocumentScreen;