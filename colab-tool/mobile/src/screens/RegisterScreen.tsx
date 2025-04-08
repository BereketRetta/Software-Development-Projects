// src/screens/RegisterScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { TextInput, Button, Title, Text, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { RootStackParamList } from '../../App';

type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;

const RegisterScreen = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [confirmSecureTextEntry, setConfirmSecureTextEntry] = useState(true);
  const { register, user, loading, error, clearError } = useAuth();
  const navigation = useNavigation<RegisterScreenNavigationProp>();

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
    // Form validation
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    try {
      await register(username, email, password);
    } catch (err: any) {
      // Error is handled in auth context
      console.log('Registration error:', err.message);
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
          <Title style={styles.title}>Create Account</Title>
          <Text style={styles.subtitle}>Sign up for CollabTool</Text>

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          <TextInput
            label="Username"
            value={username}
            onChangeText={setUsername}
            mode="outlined"
            style={styles.input}
            autoCapitalize="none"
          />

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

          <TextInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={confirmSecureTextEntry}
            mode="outlined"
            style={styles.input}
            right={
              <TextInput.Icon
                icon={confirmSecureTextEntry ? 'eye' : 'eye-off'}
                onPress={() => setConfirmSecureTextEntry(!confirmSecureTextEntry)}
              />
            }
          />

          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.button}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : 'Create Account'}
          </Button>

          <View style={styles.login}>
            <Text>Already have an account? </Text>
            <Button
              mode="text"
              onPress={() => navigation.navigate('Login')}
              compact
            >
              Sign In
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
  login: {
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

export default RegisterScreen;