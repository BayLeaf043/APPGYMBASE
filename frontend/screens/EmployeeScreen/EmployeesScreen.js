import { View, Text, TouchableOpacity, FlatList, Modal, TextInput} from 'react-native';
import { TouchableWithoutFeedback, Keyboard} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import  { useState,  useContext,  useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../../AuthContext';
import styles from './Employee.style';
import { fetchUsers, addEmployee, deleteEmployee, editEmployee } from './EmployeeApi';


export default function EmployeesScreen() {

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const [employees, setEmployees] = useState([]);
  const { user } = useContext(AuthContext);
  const [modalVisibleEmployee, setModalVisibleEmployee] = useState(false);
  const [addModalVisibleEmployee, setAddModalVisibleEmployee] = useState(false);
  const [editModalVisibleEmployee, setEditModalVisibleEmployee] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ name: "", surname: "", status: "Активний", phone: "", email: "", password: "", role: "Працівник", system_id: user?.system_id });
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
      name: "", surname: "", status: "Активний", phone: "", email: "", password: "", role: "Працівник", system_id: user?.system_id
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
    addEmployee(newEmployee, employees, setEmployees, resetNewEmployee, setAddModalVisibleEmployee);
  };

  const handleDeleteEmployee = (user_id) => {
    deleteEmployee(user_id, employees, setEmployees);
  };

  const handleEditEmployee = () => {
    editEmployee(selectedEmployee, employees, setEmployees, setEditModalVisibleEmployee);
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
          <Text style={styles.addButtonText}>+ Додати</Text>
        </TouchableOpacity>
        
        <View style={styles.headerRow}>
          <Text style={[styles.headerText, { flex: 2 }]}>Працівник</Text>
          <Text style={[styles.headerText, { flex: 3, paddingRight:10 }]}>Статус</Text>
        </View>

        {/* Список співробітників */}
        {employees.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 20 }}>
            <Text style={{ fontSize: 16, color: 'gray' }}>Немає доступних працівників</Text>
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
            <Text style={[styles.employeeText, { flex:2, marginRight: 10, color: item.status === "Активний" ? "green" : "red" }]}>{item.status}</Text>
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
          <Text style={styles.modalTitle}>Інформація про працівника</Text>
          <Text style={styles.modalText}>{selectedEmployee.name} {selectedEmployee.surname}: {selectedEmployee.role}</Text>
          <Text style={styles.modalText}>
            Статус:{" "}
            <Text style={{ color: selectedEmployee.status === "Активний" ? "green" : "red" }}>
              {selectedEmployee.status}
            </Text>
          </Text>
          <Text style={styles.modalText}>Phone: {selectedEmployee.phone} </Text>
          <Text style={styles.modalText}>Email: {selectedEmployee.email} </Text>
          </>
          )}
          <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisibleEmployee(false)}>
            <Text style={styles.cancelButtonText}>Закрити</Text>
          </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Модальне вікно додавання Працівника */}
      <Modal visible={addModalVisibleEmployee} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Додати працівника</Text>
            <TextInput
              style={styles.input}
              placeholder="Ім'я"
              value={newEmployee.name}
              onChangeText={(text) => setNewEmployee({ ...newEmployee, name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Прізвище"
              value={newEmployee.surname}
              onChangeText={(text) => setNewEmployee({ ...newEmployee, surname: text })}
            />
            <TextInput
            style={styles.input}
            placeholder="Телефон"
            value={newEmployee.phone}
            onChangeText={(text) => {
              if (!isNaN(text) || text === '') {
                setNewEmployee({ ...newEmployee, phone: text });
              }
              }}
            />
            <TextInput
              style={styles.input}
              placeholder="Пошта"
              value={newEmployee.email}
              onChangeText={(text) => setNewEmployee({ ...newEmployee, email: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Пароль"
              value={newEmployee.password}
              onChangeText={(text) => setNewEmployee({ ...newEmployee, password: text })}
            />
            <TouchableOpacity style={styles.saveButton} onPress={handleAddEmployee}>
              <Text style={styles.saveButtonText}>Додати</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={closeAddModal}>
              <Text style={styles.cancelButtonText}>Скасувати</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>


      {/* Модальне вікно редагування */}
      <Modal visible={editModalVisibleEmployee} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Редагувати працівника</Text>
            <TextInput
              style={styles.input}
              placeholder="Ім'я"
              value={selectedEmployee?.name}
              onChangeText={(text) => setSelectedEmployee({ ...selectedEmployee, name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Прізвище"
              value={selectedEmployee?.surname}
              onChangeText={(text) => setSelectedEmployee({ ...selectedEmployee, surname: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Телефон"
              keyboardType="phone-pad"
              value={selectedEmployee?.phone}
              onChangeText={(text) => {
                if (!isNaN(text) || text === '') {
                  setSelectedEmployee({ ...selectedEmployee, phone: text })}
              }} 
            />
            <TextInput
              style={styles.input}
              placeholder="Пошта"
              keyboardType="email-address"
              value={selectedEmployee?.email}
              onChangeText={(text) => setSelectedEmployee({ ...selectedEmployee, email: text })}
            />
            <TouchableOpacity
              style={[styles.toggleButton, {backgroundColor: selectedEmployee?.status === "Активний" ? "green" : "red"}]}
              onPress={() =>
                setSelectedEmployee({
                ...selectedEmployee,
                status: selectedEmployee.status === "Активний" ? "Неактивний" : "Активний",
                })
              }
              >
              <Text style={styles.toggleButtonText}>{selectedEmployee?.status}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, {backgroundColor: selectedEmployee?.role === "Працівник" ? "green" : "blue"}]}
              onPress={() =>
                setSelectedEmployee({
                ...selectedEmployee,
                role: selectedEmployee.role === "Працівник" ? "Адміністратор" : "Працівник",
                })
              }
              >
              <Text style={styles.toggleButtonText}>{selectedEmployee?.role}</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="Новий пароль"
              value={selectedEmployee?.password || ''} // Якщо пароль не передано, поле буде порожнім
              onChangeText={(text) => {
                setSelectedEmployee((prev) => ({
                  ...prev,
                  password: text || null, // Якщо текст порожній, встановлюємо null
                }));
           }}
            />


            <TouchableOpacity style={styles.saveButton} onPress={handleEditEmployee}>
              <Text style={styles.saveButtonText}>Зберегти</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setEditModalVisibleEmployee(false)}>
              <Text style={styles.cancelButtonText}>Скасувати</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>


           
    </View>
  </TouchableWithoutFeedback>

  );
}
