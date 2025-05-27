import { View, Text, TouchableOpacity, FlatList, Modal, TextInput} from 'react-native';
import { TouchableWithoutFeedback, Keyboard} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import Svg, { Path } from 'react-native-svg';
import { useState, useContext,  useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../../AuthContext';
import styles from './Services.style';
import { useTranslation } from 'react-i18next';
import { fetchCategories, fetchServices, addService, deleteService, editService } from './ServicesApi';

export default function ServicesScreen() {

  const { t } = useTranslation();

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const { user } = useContext(AuthContext);
  const [modalVisibleService, setModalVisibleService] = useState(false);
  const [addModalVisibleService, setAddModalVisibleService] = useState(false);
  const [editModalVisibleService, setEditModalVisibleService] = useState(false);
  const [newService, setNewService] = useState({ name: "", status: "active", price: "", category_id: null, total_sessions:"", system_id: user?.system_id });
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
      name: "", status: "active", price: "", category_id: null, total_sessions:"", system_id: user?.system_id
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
    addService(newService, services, setServices, resetNewService, setAddModalVisibleService, t);
  };

  const handleDeleteService = (service_id) => {
    deleteService(service_id, services, setServices, t);
  };

  const handleEditService = () => {
    editService(selectedService, services, setServices, setEditModalVisibleService, t);
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
          <Text style={styles.addButtonText}>+ {t('add')}</Text>
        </TouchableOpacity> 

        <View style={styles.headerRow}>
          <Text style={[styles.headerText, { flex: 2 }]}>{t('title')}</Text>
          <Text style={[styles.headerText, { flex: 2, marginRight: 40 }]}>{t('status')}</Text>
        </View> 

      {/* Список послуг */}
        {services.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 20 }}>
            <Text style={{ fontSize: 16, color: 'gray' }}>{t('no_services_available')}</Text>
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
            <Text style={[styles.serviceText, { flex:2, marginRight: 10, color: item.status === "active" ? "green" : "red" }]}>{t(item.status)}</Text>
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
            <Text style={styles.modalTitle}>{t('service_info')}</Text>

            <Text style={styles.modalText}>{selectedService.name}</Text>
          
            <Text style={styles.modalText}>
              {t('status')}:{" "}
              <Text style={{ color: selectedService.status === "active" ? "green" : "red" }}>
                {t(selectedService.status)}
              </Text>
            </Text>
            <Text style={styles.modalText}>{t('price')}: {selectedService.price} {t('currency')}</Text>
            <Text style={styles.modalText}>
              {t('category')}:{" "}
              {categories.find(category => category.category_id === selectedService.category_id)?.name || t('unknown_category')}
            </Text>
            <Text style={styles.modalText}>{t('total_sessions')}: {selectedService.total_sessions}</Text>
            </>
            )}
          <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisibleService(false)}>
            <Text style={styles.cancelButtonText}>{t('close')}</Text>
          </TouchableOpacity>
          </View>
        </View>
      </Modal>


      {/* Модальне вікно додавання послуги */}
      <Modal visible={addModalVisibleService} transparent animationType="slide">
        <View style={[styles.modalContainer, { justifyContent: "flex-start", paddingTop: 20, }]}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{t('add_service')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('service_name')}
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
              placeholder={t('select_category')}
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
            placeholder={t('price')}
            value={newService.price}
            onChangeText={(text) => {
              if (!isNaN(text) || text === '') {
                setNewService({ ...newService, price: text });
              }
              }}
            />
            <TextInput
            style={styles.input}
            placeholder={t('total_sessions')}
            value={newService.total_sessions}
            onChangeText={(text) => {
              if (!isNaN(text) || text === '') {
                setNewService({ ...newService, total_sessions: text });
              }
              }}
            />
            <TouchableOpacity style={styles.saveButton} onPress={handleAddService}>
              <Text style={styles.saveButtonText}>{t('add')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={closeAddModal}>
              <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>



      {/* Модальне вікно редагування послуг */}
      <Modal visible={editModalVisibleService} transparent animationType="slide">
        <View style={[styles.modalContainer, { justifyContent: "flex-start", paddingTop: 20, }]}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{t('edit_service')}</Text>

            <TextInput
              style={styles.input}
              placeholder={t('service_name')}
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
              placeholder={t('select_category')}
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
            placeholder={t('price')}
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
            placeholder={t('total_sessions')}
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
              style={[styles.toggleButton, {backgroundColor: selectedService?.status === "active" ? "green" : "red"}]}
              onPress={() =>
                setSelectedService({
                  ...selectedService,
                  status: selectedService.status === "active" ? "inactive" : "active",
                })
              }
            >
              <Text style={styles.toggleButtonText}>{t(selectedService?.status)}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleEditService}>
              <Text style={styles.saveButtonText}>{t('save')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setEditModalVisibleService(false)}>
              <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
 
    </View>
  </TouchableWithoutFeedback>

  );
}

