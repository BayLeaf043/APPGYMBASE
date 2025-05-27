import { StyleSheet, Text, TextInput, View, TouchableOpacity} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Dimensions } from 'react-native';
import { Platform, KeyboardAvoidingView, ScrollView, TouchableWithoutFeedback, Keyboard} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import React, { useContext, useState } from 'react';
import Svg, { Path } from 'react-native-svg';
import { AuthContext } from '../AuthContext';
import { BASE_URL } from '../config';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import i18n from '../i18n'; // Імпортуємо i18n для використання мови

const { height, width } = Dimensions.get('window');

export default function RegScreen() {
  const navigation = useNavigation();
  const { login } = useContext(AuthContext);
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('register');
  const [formData, setFormData] = useState({
    surname: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });

  const handleRegister = () => {
    if (formData.password !== formData.confirmPassword) {
      Alert.alert(t('passwords_do_not_match'));
      return;
    }
  
    fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept-Language': i18n.language,
      },
      body: JSON.stringify({
        surname: formData.surname,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      }),
    })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        Alert.alert(t('registration_successful'));
        setActiveTab('login'); // Перехід на авторизацію
      } else {
        Alert.alert(t('registration_error'), data.error);
      }
    })
    .catch((error) => console.error('registration_error', error));
  };


  const handleLogin = () => {
    fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json',
        'Accept-Language': i18n.language  // Додаємо заголовок для мови
      },
      body: JSON.stringify({
        email: loginData.email,
        password: loginData.password,
      }),
    })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        login({
          token: data.token,
          user: data.user,
        });
        Alert.alert(`${t('welcome')}, ${data.user.surname} ${data.user.name}!`);
      } else {
        Alert.alert(t('login_error'), data.error || t('invalid_email_or_password'));
      }
    })
    .catch((error) => console.error('login_error', error));
  };
  
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
  <TouchableWithoutFeedback onPress={dismissKeyboard}>
    <View style={styles.container}>
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.formWrapper}>
    <View style={{ position: 'absolute', bottom: 0, width: '120%', height: '50%', left: '-10%' }}>
      <Svg width="100%" height="100%" viewBox="0 0 100 120" preserveAspectRatio="none">
          <Path d="M 0 0 L 120 120 L 0 120 Z" fill="orange" />
      </Svg>
    </View>
    <ScrollView contentContainerStyle={styles.scrollContainer}>
    
    {/* Кнопки для перемикання між реєстрацією та авторизацією */}
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'register' && styles.activeTab]}
        onPress={() => setActiveTab('register')}>
        <Text style={[styles.tabText, activeTab === 'register' && styles.activeText]}>{t('sign_up')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'login' && styles.activeTab]}
        onPress={() => setActiveTab('login')}>
        <Text style={[styles.tabText, activeTab === 'login' && styles.activeText]}>{t('sign_in')}</Text>
      </TouchableOpacity>
    </View>

    <View style={styles.formContainer}>
      {activeTab === 'register' ? (
      <>
      <TextInput
        placeholder={t('surname')}
        style={styles.input}
        value={formData.surname}
        onChangeText={(text) => setFormData({ ...formData, surname: text })}
      />
      <TextInput
        placeholder={t('name')}
        style={styles.input}
        value={formData.name}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
      />
      <TextInput
        placeholder={t('email')}
        style={styles.input}
        keyboardType="email-address"
        value={formData.email}
        onChangeText={(text) => setFormData({ ...formData, email: text })}
      />
      <TextInput
        placeholder={t('phone')}
        style={styles.input}
        keyboardType="phone-pad"
        value={formData.phone}
        onChangeText={(text) => setFormData({ ...formData, phone: text })}
      />
      <TextInput
        placeholder={t('password')}
        style={styles.input}
        secureTextEntry={true}
        value={formData.password}
        onChangeText={(text) => setFormData({ ...formData, password: text })}
      />
      <TextInput
        placeholder={t('confirm_password')}
        style={styles.input}
        secureTextEntry={true}
        value={formData.confirmPassword}
        onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
      />
      </>  ) : ( <>
      <TextInput
        placeholder={t('email')}
        style={styles.input}
        keyboardType="email-address"
        value={loginData.email}
        onChangeText={(text) => setLoginData({ ...loginData, email: text })}
      />
      <TextInput
        placeholder={t('password')}
        style={styles.input}
        secureTextEntry={true}
        value={loginData.password}
        onChangeText={(text) => setLoginData({ ...loginData, password: text })}
      />
      </>
      )}
      </View>
      </ScrollView>
      

      <TouchableOpacity 
        style={styles.button} 
        onPress={activeTab === 'register' ? handleRegister : handleLogin}>
        <Ionicons name="arrow-forward" size={28} color="white" />
      </TouchableOpacity>
      
    </KeyboardAvoidingView>
    </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  formWrapper: {
    flex: 1,
    zIndex: 1,
  },
  scrollContainer: {
    alignItems: 'center',
    paddingTop: height * 0.2,
  },
  button: {
    alignSelf: 'center',
    position: 'relative',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    zIndex: 2,
    marginBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '80%',
    marginBottom: 20,
  },
  tabButton: {
    padding: 10,
    backgroundColor: '#ddd',
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
  },
  activeTab: {
    backgroundColor: 'orange',
  },
  tabText: {
    textAlign: 'center',
    fontSize: 14,
  },
  activeText: {
    color: 'white',
  },
  formContainer: {
    width: '80%',
    alignItems: 'center',
  },
  formText: {
    fontSize: 18,
    color: 'gray',
  },
  input: {
    backgroundColor: '#ffffff',
    padding: 12,
    marginBottom: 10,
    width: '100%',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    fontSize: 14,
  },
});