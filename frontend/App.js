import React from 'react';
import './i18n';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './AuthContext';
import AuthStack from './navigation/AuthStack'; // Імпортуємо наш Stack

export default function App() {
  return (
    <AuthProvider>
    <NavigationContainer>
      <AuthStack />
      <StatusBar style="auto" />
    </NavigationContainer>
    </AuthProvider>
  );
}