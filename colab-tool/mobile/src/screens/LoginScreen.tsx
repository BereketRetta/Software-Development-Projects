// src/screens/LoginScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { TextInput, Button, Title, Text, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { RootStackParamList } from '../../App';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const { login, user, loading, error, clearError } = useAuth();
  const navigation = useNavigation<LoginScreenNavigationProp>();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Dashboard' }],
      });
    }
  }, [user, navigation]);

  // Clear auth error when unmounting
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  // Handle form submission
  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await login(email, password);
    } catch (err: any) {
      // Error is handled in auth context
      console.log('Login error:', err.message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <Title style={styles.title}>CollabTool</Title>
          <Text style={styles.subtitle}>Sign in to your account</Text>

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={secureTextEntry}
            mode="outlined"
            style={styles.input}
            right={
              <TextInput.Icon
                icon={secureTextEntry ? 'eye' : 'eye-off'}
                onPress={() => setSecureTextEntry(!secureTextEntry)}
              />
            }
          />

          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.button}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : 'Sign In'}
          </Button>

          <View style={styles.register}>
            <Text>Don't have an account? </Text>
            <Button
              mode="text"
              onPress={() => navigation.navigate('Register')}
              compact
            >
              Create Account
            </Button>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#0ea5e9',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#6b7280',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
    paddingVertical: 8,
  },
  register: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  errorText: {
    color: '#ef4444',
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default LoginScreen;