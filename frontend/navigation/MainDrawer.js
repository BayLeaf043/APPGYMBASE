import React, { useContext } from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { AuthContext } from '../AuthContext';
import CalendarScreen from '../screens/CalendarScreen/CalendarScreen';
import EmployeesScreen from '../screens/EmployeeScreen/EmployeesScreen';
import HallsScreen from '../screens/HallScreen/HallsScreen';
import ClientsScreen from '../screens/ClientsScreen/ClientsScreen';
import CertificatesScreen from '../screens/CertificateScreen/CertificatesScreen';
import ServicesScreen from '../screens/ServiceScreen/ServicesScreen';
import FinancesScreen from '../screens/FinanseScreen/FinancesScreen';
import SalaryScreen from '../screens/SalaryScreen/SalaryScreen';
import ReportScreen from '../screens/ReportScreen';
import CategoriesScreen from '../screens/CategoryScreen/CategoriesScreen';
import { Alert } from 'react-native';

const Drawer = createDrawerNavigator();

export default function MainDrawer({ navigation }) {
  const { user, logout } = useContext(AuthContext); // Отримуємо дані користувача та функцію logout

  const showUserAlert = () => {
    Alert.alert(
      'Користувач', // Заголовок
      `${user?.surname} ${user?.name}\nРоль: ${user?.role}`, 
      [
        { text: 'OK' },
        {
          text: 'Завершити сесію',
          onPress: () => logout(navigation), 
          style: 'destructive', 
        },
      ],
      { cancelable: true } 
    );
  };

  return (
    <Drawer.Navigator 
    initialRouteName="Календар"
    screenOptions={{
      headerStyle: {
        backgroundColor: 'orange', 
        elevation: 0, 
        shadowOpacity: 0,
      },
      headerRight: () => (
        <TouchableOpacity onPress={showUserAlert} style={{ marginRight: 15 }}>
          <Ionicons name="person-circle-outline" size={28} color="white" />
        </TouchableOpacity>
      ),
    }}>
      <Drawer.Screen name="Календар" component={CalendarScreen} />
      <Drawer.Screen name="Працівники" component={EmployeesScreen} />
      <Drawer.Screen name="Зали" component={HallsScreen} />
      <Drawer.Screen name="Клієнти" component={ClientsScreen} />
      <Drawer.Screen name="Сертифікати" component={CertificatesScreen} />
      <Drawer.Screen name="Послуги" component={ServicesScreen} />
      <Drawer.Screen name="Категорії" component={CategoriesScreen} />
      <Drawer.Screen name="Фінанси" component={FinancesScreen} />
      <Drawer.Screen name="Заробітня плата" component={SalaryScreen} />
      <Drawer.Screen name="Звіт" component={ReportScreen} />
    </Drawer.Navigator>
);}

