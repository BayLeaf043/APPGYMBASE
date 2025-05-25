import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import RegScreen from '../screens/RegScreen';
import MainDrawer from '../navigation/MainDrawer';

const Stack = createStackNavigator();

export default function AuthStack() {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Main" component={MainDrawer} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}