import { View, Text, TouchableOpacity, FlatList, Modal, TextInput} from 'react-native';
import { TouchableWithoutFeedback, Keyboard} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import  { useState,  useContext,  useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../../AuthContext';
import styles from './Employee.style';
import { useTranslation } from 'react-i18next';
import { fetchUsers, addEmployee, deleteEmployee, editEmployee } from './EmployeeApi';


export default function EmployeesScreen() {

  const { t } = useTranslation();

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const [employees, setEmployees] = useState([]);
  const { user } = useContext(AuthContext);
  const [modalVisibleEmployee, setModalVisibleEmployee] = useState(false);
  const [addModalVisibleEmployee, setAddModalVisibleEmployee] = useState(false);
  const [editModalVisibleEmployee, setEditModalVisibleEmployee] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ name: "", surname: "", status: "active", phone: "", email: "", password: "", role: "employee", system_id: user?.system_id });
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useFocusEffect(
    useCallback(() => {
      fetchUsers(user?.system_id, setEmployees);
  }, [user])
  );

  const openModalEmployee = (employee) => {
    setSelectedEmployee(employee);
    setModalVisibleEmployee(true);
  };

  const resetNewEmployee = () => {
    setNewEmployee({
      name: "", surname: "", status: "active", phone: "", email: "", password: "", role: "employee", system_id: user?.system_id
    });
  };

  const closeAddModal = () => {
    resetNewEmployee(); 
    setAddModalVisibleEmployee(false); 
  };

  const openEditModalEmployee = (employee) => {
    const { password, ...rest } = employee;
    setSelectedEmployee(rest);
    setEditModalVisibleEmployee(true);
  };

  const handleAddEmployee = () => {
    addEmployee(newEmployee, employees, setEmployees, resetNewEmployee, setAddModalVisibleEmployee, t);
  };

  const handleDeleteEmployee = (user_id) => {
    deleteEmployee(user_id, employees, setEmployees, t);
  };

  const handleEditEmployee = () => {
    editEmployee(selectedEmployee, employees, setEmployees, setEditModalVisibleEmployee, t);
  };

  return (
  
  <TouchableWithoutFeedback onPress={dismissKeyboard}>
    
    <View style={styles.container}>
      
      <View style={{ position: 'absolute', bottom: 0, width: '100%', height: '100%'}}>
        <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <Path d="M 100 0 L 0 0 L 100 40 Z" fill="orange" />
        </Svg>
      </View>

      <View style={styles.box}>

        {/* Кнопка "Додати" */}
        <TouchableOpacity style={styles.addButton} onPress={() => setAddModalVisibleEmployee(true)}>
          <Text style={styles.addButtonText}>+ {t('add')}</Text>
        </TouchableOpacity>
        
        <View style={styles.headerRow}>
          <Text style={[styles.headerText, { flex: 2 }]}>{t('employee')}</Text>
          <Text style={[styles.headerText, { flex: 3, paddingRight:10 }]}>{t('status')}</Text>
        </View>

        {/* Список співробітників */}
        {employees.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 20 }}>
            <Text style={{ fontSize: 16, color: 'gray' }}>{t('no_employees_available')}</Text>
          </View>
        ) : (     
        <FlatList
        data={employees}
        keyExtractor={(item) => item.user_id.toString()}
        renderItem={({ item }) => (
          <View style={styles.employeeItem}>
            <TouchableOpacity style={[styles.employeeTextContainer, { flex: 2, marginRight: 30 }]} onPress={() => openModalEmployee(item)}>
              <Text style={styles.employeeText}>{item.name} {item.surname}</Text>
            </TouchableOpacity>
            <Text style={[styles.employeeText, { flex:2, marginRight: 10, color: item.status === "active" ? "green" : "red" }]}>{t(item.status)}</Text>
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity style={[styles.editButton, {marginRight: 10}]} onPress={() => openEditModalEmployee(item)}>
                <Text>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteEmployee(item.user_id)}>
                <Text>🗑</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        />
      )}
      </View>

      {/* Модальне вікно перегляду */}
      <Modal visible={modalVisibleEmployee} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
          {selectedEmployee && (
          <>
          <Text style={styles.modalTitle}>{t('employee_information')}</Text>
          <Text style={styles.modalText}>{selectedEmployee.name} {selectedEmployee.surname}: {t(selectedEmployee.role)}</Text>
          <Text style={styles.modalText}>
            {t('status')}:{" "}
            <Text style={{ color: selectedEmployee.status === "active" ? "green" : "red" }}>
              {t(selectedEmployee.status)}
            </Text>
          </Text>
          <Text style={styles.modalText}>{t('phone')}: {selectedEmployee.phone} </Text>
          <Text style={styles.modalText}>{t('email')}: {selectedEmployee.email} </Text>
          </>
          )}
          <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisibleEmployee(false)}>
            <Text style={styles.cancelButtonText}>{t('close')}</Text>
          </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Модальне вікно додавання Працівника */}
      <Modal visible={addModalVisibleEmployee} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{t('add_employee')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('name')}
              value={newEmployee.name}
              onChangeText={(text) => setNewEmployee({ ...newEmployee, name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder={t('surname')}
              value={newEmployee.surname}
              onChangeText={(text) => setNewEmployee({ ...newEmployee, surname: text })}
            />
            <TextInput
            style={styles.input}
            placeholder={t('phone')}
            value={newEmployee.phone}
            onChangeText={(text) => {
              if (!isNaN(text) || text === '') {
                setNewEmployee({ ...newEmployee, phone: text });
              }
              }}
            />
            <TextInput
              style={styles.input}
              placeholder={t('email')}
              value={newEmployee.email}
              onChangeText={(text) => setNewEmployee({ ...newEmployee, email: text })}
            />
            <TextInput
              style={styles.input}
              placeholder={t('password')}
              value={newEmployee.password}
              onChangeText={(text) => setNewEmployee({ ...newEmployee, password: text })}
            />
            <TouchableOpacity style={styles.saveButton} onPress={handleAddEmployee}>
              <Text style={styles.saveButtonText}>{t('add')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={closeAddModal}>
              <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>


      {/* Модальне вікно редагування */}
      <Modal visible={editModalVisibleEmployee} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{t('edit_employee')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('name')}
              value={selectedEmployee?.name}
              onChangeText={(text) => setSelectedEmployee({ ...selectedEmployee, name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder={t('surname')}
              value={selectedEmployee?.surname}
              onChangeText={(text) => setSelectedEmployee({ ...selectedEmployee, surname: text })}
            />
            <TextInput
              style={styles.input}
              placeholder={t('phone')}
              keyboardType="phone-pad"
              value={selectedEmployee?.phone}
              onChangeText={(text) => {
                if (!isNaN(text) || text === '') {
                  setSelectedEmployee({ ...selectedEmployee, phone: text })}
              }} 
            />
            <TextInput
              style={styles.input}
              placeholder={t('email')}
              keyboardType="email-address"
              value={selectedEmployee?.email}
              onChangeText={(text) => setSelectedEmployee({ ...selectedEmployee, email: text })}
            />
            <TouchableOpacity
              style={[styles.toggleButton, {backgroundColor: selectedEmployee?.status === "active" ? "green" : "red"}]}
              onPress={() =>
                setSelectedEmployee({
                ...selectedEmployee,
                status: selectedEmployee.status === "active" ? "inactive" : "active",
                })
              }
              >
              <Text style={styles.toggleButtonText}>{t(selectedEmployee?.status)}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, {backgroundColor: selectedEmployee?.role === "employee" ? "green" : "blue"}]}
              onPress={() =>
                setSelectedEmployee({
                ...selectedEmployee,
                role: selectedEmployee.role === "employee" ? "admin" : "employee",
                })
              }
              >
              <Text style={styles.toggleButtonText}>{t(selectedEmployee?.role)}</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder={t('new_password')}
              value={selectedEmployee?.password || ''} // Якщо пароль не передано, поле буде порожнім
              onChangeText={(text) => {
                setSelectedEmployee((prev) => ({
                  ...prev,
                  password: text || null, // Якщо текст порожній, встановлюємо null
                }));
           }}
            />


            <TouchableOpacity style={styles.saveButton} onPress={handleEditEmployee}>
              <Text style={styles.saveButtonText}>{t('save')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setEditModalVisibleEmployee(false)}>
              <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>


           
    </View>
  </TouchableWithoutFeedback>

  );
}
