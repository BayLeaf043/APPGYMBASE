import React, { useContext } from 'react';
import { TouchableOpacity, View } from 'react-native';
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
import { useTranslation } from 'react-i18next';



const Drawer = createDrawerNavigator();

export default function MainDrawer({ navigation }) {
  const { user, logout } = useContext(AuthContext); // Отримуємо дані користувача та функцію logout
  const { t } = useTranslation();

  const showUserAlert = () => {
    Alert.alert(
      t('user'), // Заголовок
      `${user?.surname} ${user?.name}\n\n${t('role')}: ${t(user?.role)}\n`, 
      [
        { text: 'OK' },
        {
          text: t('logout'),
          onPress: () => logout(navigation), 
          style: 'destructive', 
        },
      ],
      { cancelable: true } 
    );
  };

  const { i18n } = useTranslation();

const toggleLanguage = () => {
  const newLang = i18n.language === 'uk' ? 'en' : 'uk';
  i18n.changeLanguage(newLang);

  Alert.alert(
    t('language_changed'), // Заголовок
    `${t('app_language_set_to')} ${newLang === 'uk' ? t('ukrainian') : t('english')}`, // Повідомлення
    [{ text: 'OK' }] // Кнопка OK
  );
};

  return (
    <Drawer.Navigator 
    initialRouteName={t('calendar')}
    screenOptions={{
      headerStyle: {
        backgroundColor: 'orange', 
        elevation: 0, 
        shadowOpacity: 0,
      },
      headerRight: () => (
  <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 15 }}>
            {/* Кнопка перемикання мови */}
            <TouchableOpacity onPress={toggleLanguage} style={{ marginRight: 15 }}>
              <Ionicons name="language-outline" size={24} color="white" />
            </TouchableOpacity>

            {/* Кнопка користувача */}
            <TouchableOpacity onPress={showUserAlert}>
              <Ionicons name="person-circle-outline" size={28} color="white" />
            </TouchableOpacity>
          </View>
)
    }}>
      <Drawer.Screen name={t('calendar')} component={CalendarScreen} />
      <Drawer.Screen name={t('clients')} component={ClientsScreen} />
      <Drawer.Screen name={t('certificates')} component={CertificatesScreen} />
      { (user?.role === 'admin') && (
        <>
        <Drawer.Screen name={t('employees')} component={EmployeesScreen} />
        <Drawer.Screen name={t('halls')} component={HallsScreen} />
        <Drawer.Screen name={t('services')} component={ServicesScreen} />
        <Drawer.Screen name={t('categories')} component={CategoriesScreen} />
        <Drawer.Screen name={t('finances')} component={FinancesScreen} />
        <Drawer.Screen name={t('salary')} component={SalaryScreen} />
        <Drawer.Screen name={t('report')} component={ReportScreen} />
      </>
      )}


    </Drawer.Navigator>
);}

