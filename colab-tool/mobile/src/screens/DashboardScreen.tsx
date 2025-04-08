// src/screens/DashboardScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Appbar, FAB, Card, Title, Paragraph, ActivityIndicator, Text, Portal, Dialog, TextInput, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { useDocument } from '../contexts/DocumentContext';
import { RootStackParamList } from '../../App';

type DashboardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Dashboard'>;

const DashboardScreen = () => {
  const { user, logout } = useAuth();
  const { documents, loading, error, fetchDocuments, createDocument, deleteDocument } = useDocument();
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [newDocumentTitle, setNewDocumentTitle] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<DashboardScreenNavigationProp>();

  // Fetch documents on mount
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDocuments();
    setRefreshing(false);
  };

  // Handle document creation
  const handleCreateDocument = async () => {
    if (!newDocumentTitle.trim()) {
      Alert.alert('Error', 'Please enter a document title');
      return;
    }

    const documentId = await createDocument(newDocumentTitle);
    setNewDocumentTitle('');
    setIsCreateModalVisible(false);

    // Navigate to the new document if creation was successful
    if (documentId) {
      navigation.navigate('Document', { id: documentId, title: newDocumentTitle });
    }
  };

  // Handle document deletion
  const handleDeleteDocument = (documentId: string, title: string) => {
    Alert.alert(
      'Confirm Deletion',
      `Are you sure you want to delete "${title}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            await deleteDocument(documentId);
          },
          style: 'destructive',
        },
      ]
    );
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

  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            await logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="My Documents" />
        <Appbar.Action icon="logout" onPress={handleLogout} />
      </Appbar.Header>

      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.error}>{error}</Text>
          <Button mode="contained" onPress={handleRefresh} style={styles.retryButton}>
            Retry
          </Button>
        </View>
      ) : (
        <FlatList
          data={documents}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <Card style={styles.card} onPress={() => navigation.navigate('Document', { id: item._id, title: item.title })}>
              <Card.Content>
                <Title>{item.title}</Title>
                <Paragraph>Last updated: {formatDate(item.updatedAt)}</Paragraph>
              </Card.Content>
              <Card.Actions>
                <Button
                  onPress={() => handleDeleteDocument(item._id, item.title)}
                  color="#ef4444"
                >
                  Delete
                </Button>
              </Card.Actions>
            </Card>
          )}
          contentContainerStyle={documents.length === 0 ? styles.emptyList : styles.list}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No documents yet</Text>
              <Text style={styles.emptySubtext}>Tap the + button to create a new document</Text>
            </View>
          }
        />
      )}

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => setIsCreateModalVisible(true)}
      />

      {/* Create document dialog */}
      <Portal>
        <Dialog visible={isCreateModalVisible} onDismiss={() => setIsCreateModalVisible(false)}>
          <Dialog.Title>Create a new document</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Document title"
              value={newDocumentTitle}
              onChangeText={setNewDocumentTitle}
              mode="outlined"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setIsCreateModalVisible(false)}>Cancel</Button>
            <Button onPress={handleCreateDocument}>Create</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
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
  list: {
    padding: 16,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    marginBottom: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  error: {
    color: '#ef4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
  },
  emptyContainer: {
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default DashboardScreen;