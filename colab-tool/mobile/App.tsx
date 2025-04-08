// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider } from './src/contexts/AuthContext';
import { SocketProvider } from './src/contexts/SocketContext';
import { DocumentProvider } from './src/contexts/DocumentContext';
import { EditorProvider } from './src/contexts/EditorContext';
import { StatusBar } from 'expo-status-bar';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import DocumentScreen from './src/screens/DocumentScreen';

// Theme
import theme from './src/utils/theme';

// Navigation types
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Dashboard: undefined;
  Document: { id: string; title: string };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <SocketProvider>
          <DocumentProvider>
            <EditorProvider>
              <NavigationContainer>
                <StatusBar style="auto" />
                <Stack.Navigator
                  initialRouteName="Login"
                  screenOptions={{
                    headerStyle: {
                      backgroundColor: theme.colors.primary,
                    },
                    headerTintColor: '#fff',
                    headerTitleStyle: {
                      fontWeight: 'bold',
                    },
                  }}
                >
                  <Stack.Screen 
                    name="Login" 
                    component={LoginScreen} 
                    options={{ title: 'Sign In', headerShown: false }} 
                  />
                  <Stack.Screen 
                    name="Register" 
                    component={RegisterScreen} 
                    options={{ title: 'Create Account', headerShown: false }} 
                  />
                  <Stack.Screen 
                    name="Dashboard" 
                    component={DashboardScreen} 
                    options={{ title: 'My Documents', headerLeft: () => null }} 
                  />
                  <Stack.Screen 
                    name="Document" 
                    component={DocumentScreen} 
                    options={({ route }: any) => ({ title: route.params.title })} 
                  />
                </Stack.Navigator>
              </NavigationContainer>
            </EditorProvider>
          </DocumentProvider>
        </SocketProvider>
      </AuthProvider>
    </PaperProvider>
  );
}