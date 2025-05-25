import React, { createContext, useState } from 'react';

export const AuthContext = createContext();

// Провайдер для обгортання додатку
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Стан для зберігання даних користувача

  const login = (userData) => {
    console.log('Авторизація успішна:', userData); 
    setUser(userData); // Зберігаємо дані користувача після авторизації
  };

  const logout = (navigation) => {
    setUser(null);
    if (navigation) {
      navigation.navigate('Home'); 
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};