import React, { useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import RegScreen from '../screens/RegScreen';
import MainDrawer from '../navigation/MainDrawer';
import { AuthContext } from '../AuthContext';

const Stack = createStackNavigator();

export default function AuthStack() {
  const { user } = useContext(AuthContext);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        // Користувач залогінений — показуємо тільки Main
        <Stack.Screen name="Main" component={MainDrawer} />
      ) : (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Register" component={RegScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}