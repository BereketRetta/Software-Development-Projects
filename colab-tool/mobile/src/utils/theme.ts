// src/utils/theme.ts
import { DefaultTheme } from 'react-native-paper';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#0ea5e9', // primary-500 from Tailwind
    accent: '#8b5cf6',  // secondary-500 from Tailwind
    background: '#f9fafb',
    surface: '#ffffff',
    text: '#1f2937',
    error: '#ef4444',
    placeholder: '#9ca3af',
  },
  roundness: 8,
  fonts: {
    ...DefaultTheme.fonts,
  },
};

export default theme;