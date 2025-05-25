import { View, Text, TouchableOpacity, FlatList, Modal, TextInput} from 'react-native';
import { TouchableWithoutFeedback, Keyboard} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import Svg, { Path } from 'react-native-svg';
import { useState, useContext,  useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../../AuthContext';
import styles from './Services.style';
import { fetchCategories, fetchServices, addService, deleteService, editService } from './ServicesApi';

export default function ServicesScreen() {

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const { user } = useContext(AuthContext);
  const [modalVisibleService, setModalVisibleService] = useState(false);
  const [addModalVisibleService, setAddModalVisibleService] = useState(false);
  const [editModalVisibleService, setEditModalVisibleService] = useState(false);
  const [newService, setNewService] = useState({ name: "", status: "Активний", price: "", category_id: null, total_sessions:"", system_id: user?.system_id });
  const [selectedService, setSelectedService] = useState(null);

  useFocusEffect(
    useCallback(() => {
      fetchServices(user?.system_id, setServices);
      fetchCategories(user?.system_id, setCategories);
    }, [user])
  );

  const openModalService = (service) => {
    setSelectedService(service);
    setModalVisibleService(true);
  };

  const resetNewService = () => {
    setNewService({
      name: "", status: "Активний", price: "", category_id: null, total_sessions:"", system_id: user?.system_id
    });
  };

  const closeAddModal = () => {
    resetNewService(); 
    setAddModalVisibleService(false); 
  };

  const openEditModalService = (service) => {
    setSelectedService(service);
    setEditModalVisibleService(true);
  };

  const handleAddService = () => {
    addService(newService, services, setServices, resetNewService, setAddModalVisibleService);
  };

  const handleDeleteService = (service_id) => {
    deleteService(service_id, services, setServices);
  };

  const handleEditService = () => {
    editService(selectedService, services, setServices, setEditModalVisibleService);
  };

  const sortServicesAlphabetically = (services) => {
    return [...services].sort((a, b) => a.name.localeCompare(b.name));
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

        <TouchableOpacity style={styles.addButton} onPress={() => setAddModalVisibleService(true)}>
          <Text style={styles.addButtonText}>+ Додати</Text>
        </TouchableOpacity> 

        <View style={styles.headerRow}>
          <Text style={[styles.headerText, { flex: 2 }]}>Назва</Text>
          <Text style={[styles.headerText, { flex: 2, marginRight: 40 }]}>Статус</Text>
        </View> 

      {/* Список послуг */}
        {services.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 20 }}>
            <Text style={{ fontSize: 16, color: 'gray' }}>Немає доступних послуг</Text>
          </View>
          ) : (
        <FlatList
          data={sortServicesAlphabetically(services)}
          keyExtractor={(item) => item.service_id.toString()}
          renderItem={({ item }) => (
          <View style={styles.serviceItem}>
            <TouchableOpacity style={[styles.serviceTextContainer, { flex: 3, marginRight: 10 }]} onPress={() => openModalService(item)}>
              <Text style={styles.serviceText}>{item.name}</Text>
            </TouchableOpacity>
            <Text style={[styles.serviceText, { flex:2, marginRight: 10, color: item.status === "Активний" ? "green" : "red" }]}>{item.status}</Text>
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity style={[styles.editButton, {marginRight: 10}]} onPress={() => openEditModalService(item)}>
                <Text>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteService(item.service_id)}>
                <Text>🗑</Text>
              </TouchableOpacity>
            </View>
          </View>
          )}
        />
      )}
      </View>

      {/* Модальне вікно перегляду послуг*/}
      <Modal visible={modalVisibleService} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            {selectedService && (
            <>
            <Text style={styles.modalTitle}>Інформація про послугу</Text>
            
            <Text style={styles.modalText}>{selectedService.name}</Text>
          
            <Text style={styles.modalText}>
              Статус:{" "}
              <Text style={{ color: selectedService.status === "Активний" ? "green" : "red" }}>
                {selectedService.status}
              </Text>
            </Text>
            <Text style={styles.modalText}>Ціна: {selectedService.price} грн</Text>
            <Text style={styles.modalText}>
              Категорія:{" "}
              {categories.find(category => category.category_id === selectedService.category_id)?.name || "Невідома категорія"}
            </Text>
            <Text style={styles.modalText}>Кількість відвідувань: {selectedService.total_sessions}</Text>
            </>
            )}
          <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisibleService(false)}>
            <Text style={styles.cancelButtonText}>Закрити</Text>
          </TouchableOpacity>
          </View>
        </View>
      </Modal>


      {/* Модальне вікно додавання послуги */}
      <Modal visible={addModalVisibleService} transparent animationType="slide">
        <View style={[styles.modalContainer, { justifyContent: "flex-start", paddingTop: 20, }]}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Додати послугу</Text>
            <TextInput
              style={styles.input}
              placeholder="Назва послуги"
              value={newService.name}
              onChangeText={(text) => setNewService({ ...newService, name: text })}
            />
            <Dropdown
              style={styles.dropdown}
              containerStyle={styles.dropdownContainer}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              itemTextStyle={styles.itemTextStyle}
              data={categories.map((category) => ({
              label: category.name, 
              value: category.category_id, 
              }))}
              labelField="label"
              valueField="value"
              placeholder="Оберіть категорію"
              value={newService.category_id}
              onChange={(item) => {
                setNewService({
                  ...newService,
                  category_id: item.value,
                });
              }}
            />

            <TextInput
            style={styles.input}
            placeholder="Ціна"
            value={newService.price}
            onChangeText={(text) => {
              if (!isNaN(text) || text === '') {
                setNewService({ ...newService, price: text });
              }
              }}
            />
            <TextInput
            style={styles.input}
            placeholder="Кількість відвідувань"
            value={newService.total_sessions}
            onChangeText={(text) => {
              if (!isNaN(text) || text === '') {
                setNewService({ ...newService, total_sessions: text });
              }
              }}
            />
            <TouchableOpacity style={styles.saveButton} onPress={handleAddService}>
              <Text style={styles.saveButtonText}>Додати</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={closeAddModal}>
              <Text style={styles.cancelButtonText}>Скасувати</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>



      {/* Модальне вікно редагування послуг */}
      <Modal visible={editModalVisibleService} transparent animationType="slide">
        <View style={[styles.modalContainer, { justifyContent: "flex-start", paddingTop: 20, }]}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Редагувати послугу</Text>

            <TextInput
              style={styles.input}
              placeholder="Назва послуги"
              value={selectedService?.name}
              onChangeText={(text) => setSelectedService({ ...selectedService, name: text })}
            />
            <Dropdown
              style={styles.dropdown}
              containerStyle={styles.dropdownContainer}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              itemTextStyle={styles.itemTextStyle}
              data={categories.map((category) => ({
              label: category.name, 
              value: category.category_id, 
              }))}
              labelField="label"
              valueField="value"
              placeholder="Оберіть категорію"
              value={selectedService?.category_id}
              onChange={(item) => {
                setSelectedService({
                  ...selectedService,
                  category_id: item.value,
                });
              }}
            />
            <TextInput
            style={styles.input}
            placeholder="Ціна"
            value={selectedService?.price}
            
            keyboardType="numeric"
            onChangeText={(text) => {
              // Перевірка, чи є введене значення числом
              if (!isNaN(text) || text === '') {
                setSelectedService({ ...selectedService, price: text });
                
              }
            }}
          />
          <TextInput
            style={styles.input}
            placeholder="Кількість відвідувань"
            value={selectedService?.total_sessions?.toString() || ""}
           
            keyboardType="numeric"
            onChangeText={(text) => {
              // Перевірка, чи є введене значення числом
              if (!isNaN(text) || text === '') {
                setSelectedService({ ...selectedService, total_sessions: text });
              }
            }}
          />
            <TouchableOpacity
              style={[styles.toggleButton, {backgroundColor: selectedService?.status === "Активний" ? "green" : "red"}]}
              onPress={() =>
                setSelectedService({
                  ...selectedService,
                  status: selectedService.status === "Активний" ? "Неактивний" : "Активний",
                })
              }
            >
              <Text style={styles.toggleButtonText}>{selectedService?.status}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleEditService}>
              <Text style={styles.saveButtonText}>Зберегти</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setEditModalVisibleService(false)}>
              <Text style={styles.cancelButtonText}>Скасувати</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
 
    </View>
  </TouchableWithoutFeedback>

  );
}

