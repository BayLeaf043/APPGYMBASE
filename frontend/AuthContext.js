import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

// Провайдер для обгортання додатку
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Дані користувача
  const [token, setToken] = useState(null); // JWT токен

  // Вхід 
  const login = async (userData) => {
    console.log('Authorization successful:', userData);
    setUser(userData.user);
    setToken(userData.token);

    try {
      await AsyncStorage.setItem('userToken', userData.token);
      await AsyncStorage.setItem('userData', JSON.stringify(userData.user));
    } catch (e) {
      console.error('Error saving token', e);
    }
  };

  // Вихід 
  const logout = async (navigation) => {
    setUser(null);
    setToken(null);
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
    } catch (e) {
      console.error('Error removing token', e);
    }

    if (navigation) {
      navigation.replace('Home');
    }
  };

  // Відновлення сесії при запуску
  const loadSession = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('userToken');
      const storedUser = await AsyncStorage.getItem('userData');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        console.log('Session restored');
      }
    } catch (e) {
      console.error('Error loading session', e);
    }
  };

  useEffect(() => {
    loadSession();
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};