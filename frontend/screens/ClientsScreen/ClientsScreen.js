import { View, Text, TouchableOpacity, FlatList, Modal, TextInput} from 'react-native';
import { Dimensions } from 'react-native';
import { TouchableWithoutFeedback, Keyboard} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useState, useContext,  useCallback, useEffect } from "react";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../../AuthContext';
import styles from './Clients.style';
import { useTranslation } from 'react-i18next';
import { fetchClients, fetchServices, fetchCertificates, addClient, deleteClient, editClient} from './ClientsApi';

const { height } = Dimensions.get('window');


export default function ClientsScreen() {

  const { t } = useTranslation();

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const [isDatePickerVisible, setDatePickerVisibility] = useState(false); // Стан для модального вибору дати
  const [clients, setClients] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [services, setServices] = useState([]);
  const { user } = useContext(AuthContext);

  const [modalVisibleClient, setModalVisibleClient] = useState(false);
  const [addModalVisibleClient, setAddModalVisibleClient] = useState(false);
  const [editModalVisibleClient, setEditModalVisibleClient] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", surname: "", phone: "", birthday: "", status: "active", system_id: user?.system_id });
  const [selectedClient, setSelectedClient] = useState(null);

  const [searchText, setSearchText] = useState(""); // Стан для тексту пошуку
  const [filteredClients, setFilteredClients] = useState([]); // Стан для відфільтрованих клієнтів
  useEffect(() => {
    // Фільтруємо клієнтів за введеним текстом
    if (searchText.trim() === "") {
      setFilteredClients(clients); // Якщо поле пошуку порожнє, показуємо всіх клієнтів
    } else {
      const lowercasedSearchText = searchText.toLowerCase();
      setFilteredClients(
        clients.filter(
          (client) =>
            client.name.toLowerCase().includes(lowercasedSearchText) ||
            client.surname.toLowerCase().includes(lowercasedSearchText)
        )
      );
    }
  }, [searchText, clients]);

  useFocusEffect(
    useCallback(() => {
      fetchClients(user?.system_id, setClients);
      fetchCertificates(user?.system_id, setCertificates);
      fetchServices(user?.system_id, setServices);
    }, [user])
  );

  const resetNewClient = () => {
    setNewClient({
      name: "", surname: "", phone: "", birthday: "", status: "active",
    system_id: user?.system_id
    });
  };

  const closeAddModal = () => {
    resetNewClient(); 
    setAddModalVisibleClient(false); 
  };

  const openModalClient = (client) => {
    setSelectedClient(client);
    setModalVisibleClient(true);
  };

  const openEditModalClient = (client) => {
    setSelectedClient(client);
    setEditModalVisibleClient(true);
  };

  const handleAddClient = () => {
    addClient(newClient, clients, setClients, resetNewClient, setAddModalVisibleClient, t);
  };

  const handleDeleteClient = (client_id) => {
    deleteClient(client_id, clients, setClients, t);
  };

  const handleEditClient = () => {
    editClient(selectedClient, clients, setClients, setEditModalVisibleClient, t);
  };

  const formatDateToLocal = (date) => {
    if (!date) return ""; 
    const d = new Date(date);
    if (isNaN(d.getTime())) return ""; 

    const localDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    const day = String(localDate.getDate()).padStart(2, '0');
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const year = localDate.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const formatDate = (date) => {
    if (!date) return ""; 
    const d = new Date(date);
    if (isNaN(d.getTime())) return ""; 

    const localDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    const day = String(localDate.getDate()).padStart(2, '0');
    const month = String(localDate.getMonth() + 1).padStart(2, '0')
    return `${day}.${month}`;
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return "";
    const cleaned = phone.replace(/\D/g, ""); 
    if (cleaned.length === 10) {
      const match = cleaned.match(/^(\d{1})(\d{2})(\d{3})(\d{2})(\d{2})$/);
      if (match) {
        return `+38${match[1]}(${match[2]}) ${match[3]} ${match[4]} ${match[5]}`;
      }
    }
    return phone; 
  };

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  // Обробка вибору дати
  const handleConfirm = (selectedDate) => {
    if (newClient) {
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const year = selectedDate.getFullYear();
      const formattedDate = `${year}-${month}-${day}`;
      setNewClient((prevClient) => ({
        ...prevClient,
        birthday: formattedDate,
      }));
    } else {
      console.error('newClient is null');
    }
    hideDatePicker();
  };

  const handleEditDateConfirm = (selectedDate) => { 
    if (selectedClient) {
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const year = selectedDate.getFullYear();
      const formattedDate = `${year}-${month}-${day}`;
      setSelectedClient((prevClient) => ({
        ...prevClient,
        birthday: formattedDate,
      }));
    } else {
      console.error('selectedClient is null');
    }
    hideDatePicker();
  };

  const sortCertificates = (certificates) => {
    return [...certificates].sort((a, b) => new Date(b.valid_from) - new Date(a.valid_from));
  };

  const calculateClientRevenue = (clientId) => {
    const clientCertificates = certificates.filter(cert => cert.client_id === clientId);
    const totalRevenue = clientCertificates.reduce((total, cert) => total + (parseFloat(cert.price) || 0), 0);
    return totalRevenue.toFixed(2);
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

     
      
        <TouchableOpacity style={styles.addButton} onPress={() => setAddModalVisibleClient(true)}>
          <Text style={styles.addButtonText}>+ {t('add')}</Text>
        </TouchableOpacity> 

        <TextInput
            style={styles.searchInput}
            placeholder={t('search_client')}
            value={searchText}
            onChangeText={(text) => setSearchText(text)}
          />

          
      
        <View style={styles.headerRow}>
          <Text style={[styles.headerText, { flex: 2 }]}>{t('client')}</Text>
          <Text style={[styles.headerText, { flex: 4, paddingRight:48 }]}>{t('contact')}</Text>
        </View> 

        {/* Список клієнтів */}
        {filteredClients.length === 0 ? (
        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <Text style={{ fontSize: 16, color: 'gray' }}>{t('no_clients_available')}</Text>
        </View>
        ) : (
        <FlatList
          data={filteredClients}
          keyExtractor={(item) => item.client_id.toString()}
          renderItem={({ item }) => (
          <View style={styles.clientItem}>
            <TouchableOpacity style={[styles.clientTextContainer, { flex: 2, marginRight: 10 }]} onPress={() => openModalClient(item)}>
              <Text style={styles.clientText}>{item.name} {item.surname}</Text>
            </TouchableOpacity>
            <Text style={[styles.clientText, {flex:3, marginRight: 10 }]}>{formatPhoneNumber(item.phone)}</Text>
            <View style={styles.actionButtonsContainer}>
              
              <TouchableOpacity style={[styles.editButton, { marginRight: 10 }]} onPress={() => openEditModalClient(item)}>
                <Text>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteClient(item.client_id)}>
                <Text>🗑</Text>
              </TouchableOpacity>
              
            </View>
          </View>
          )}
          />
          )}
      </View>


      {/* Модальне вікно перегляду клієнтів*/}
      <Modal visible={modalVisibleClient} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={[styles.modalBox, { height: height * 0.7 }]}>
            
            {selectedClient && (
              
            <>
            <Text style={styles.modalTitle}>{t('client_info')}</Text>
            <Text style={[styles.modalText, { fontWeight: "bold" }]}>{selectedClient.name} {selectedClient.surname}</Text>
            <Text style={styles.modalText}>{t('phone')}: {formatPhoneNumber(selectedClient.phone)} </Text>
            <Text style={styles.modalText}>
              {t('birthday')}: {formatDateToLocal(selectedClient?.birthday) || t('not_selected')}
            </Text>
            <Text style={styles.modalText}>{t('number_of_visits')}: {selectedClient.count_of_visits} </Text>
            <Text style={styles.modalText}>{t('last_visit')}: {formatDateToLocal(selectedClient.last_visit)} </Text>
            <Text style={styles.modalText}>{t('total_revenue')}: {calculateClientRevenue(selectedClient.client_id)} {t('currency')} </Text>
            <Text style={styles.modalText}>
              {t('status')}:{" "}
              <Text style={{ color: selectedClient.status === "active" ? "green" : "red" }}>
                {t(selectedClient.status)}
              </Text>
            </Text>
            <Text style={styles.modalText}>{t('purchased_services_list')}: </Text>

            <FlatList
            data={sortCertificates(certificates).filter((cert) => cert.client_id === selectedClient.client_id)} // Сортування за датою від найновішого до найстарішого
            keyExtractor={(item) => item.certificate_id.toString()}
            renderItem={({ item }) => {
              const serviceName = services.find((service) => service.service_id === item.service_id)?.name || t('not_selected');
              const isExpired = new Date(item.valid_to) < new Date();
            return(
              <View style={[styles.certificateItem, { flexDirection: "row", alignItems: "center" }]}>
                <Text style={[styles.certificateText, { flex: 2, marginRight: 3 }]}>
                  {formatDate(item.valid_from)} -{" "}
                  <Text style={{ color: isExpired ? "red" : "black" }}>
                    {formatDate(item.valid_to)}
                    </Text>
                </Text>
                <Text style={[styles.certificateText, { flex: 3, marginRight: 3 }]}>
                  {serviceName}
                </Text>
                <Text style={[styles.certificateText, { flex: 3, marginRight: 3 }]}>
                  {item.price} {t('currency')}
                </Text>
                <Text style={[styles.certificateText, { flex: 1 }]}>
                  {item.used_sessions}/{item.total_sessions}
                </Text>
              </View>
            );}}
          />
            </>
            )}
          <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisibleClient(false)}>
            <Text style={styles.cancelButtonText}>{t('close')}</Text>
          </TouchableOpacity>
          </View>
        </View>
      </Modal>


      {/* Модальне вікно додавання клієнта */}
      <Modal visible={addModalVisibleClient} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{t('add_client')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('name')}
              value={newClient.name}
              onChangeText={(text) => setNewClient({ ...newClient, name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder={t('surname')}
              value={newClient.surname}
              onChangeText={(text) => setNewClient({ ...newClient, surname: text })}
            />
            <TextInput
              style={styles.input}
              placeholder={t('phone')}
              value={newClient.phone}
              onChangeText={(text) => {
                if (!isNaN(text) || text === '') {
                  setNewClient({ ...newClient, phone: text });
                }
              }}
            />
            <TouchableOpacity onPress={showDatePicker} style={styles.datePickerButton}>
              <Text style={styles.datePickerButtonText}>
              {formatDateToLocal(newClient.birthday) || t('birthday')}
              </Text>
            </TouchableOpacity>

            {/* Модальне вікно вибору дати */}
            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode="date"
              display="spinner"
              date={newClient?.birthday
                ? new Date(newClient.birthday.split('.').reverse().join('-')) 
                : new Date()} 
              onConfirm={handleConfirm} 
              onCancel={hideDatePicker} 
              maximumDate={new Date()} 
              minimumDate={new Date(1900, 0, 1)} 
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleAddClient}>
              <Text style={styles.saveButtonText}>{t('add')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={closeAddModal}>
              <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>


      {/* Модальне вікно редагування клієнта */}
      <Modal visible={editModalVisibleClient} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{t('edit_client_data')}</Text>

            <TextInput
              style={styles.input}
              placeholder={t('name')}
              value={selectedClient?.name}
              onChangeText={(text) => setSelectedClient({ ...selectedClient, name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder={t('surname')}
              value={selectedClient?.surname}
              onChangeText={(text) => setSelectedClient({ ...selectedClient, surname: text })}
            />
            <TextInput
            style={styles.input}
            placeholder={t('phone')}
            value={selectedClient?.phone}
            keyboardType="numeric"
            onChangeText={(text) => {
              // Перевірка, чи є введене значення числом
              if (!isNaN(text) || text === '') {
                setSelectedService({ ...selectedClient, phone: text });
              }
            }}
            />

            <Text style={styles.modalText}>{t('birthday')}:</Text>

            <TouchableOpacity onPress={showDatePicker} style={styles.datePickerButton}>
              <Text style={styles.datePickerButtonText}>
              {formatDateToLocal(selectedClient?.birthday) || t('not_selected')}
              </Text>
            </TouchableOpacity>

            {/* Модальне вікно редагування дати */}
            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode="date"
              display="spinner"
              date={selectedClient?.birthday ? new Date(selectedClient.birthday) : new Date()} 
              onConfirm={handleEditDateConfirm}
              onCancel={hideDatePicker}
              maximumDate={new Date()} 
              minimumDate={new Date(1900, 0, 1)} 
            />
            <TouchableOpacity
              style={[styles.toggleButton, {backgroundColor: selectedClient?.status === "active" ? "green" : "red"}]}
              onPress={() =>
                setSelectedClient({
                  ...selectedClient,
                  status: selectedClient.status === "active" ? "inactive" : "active",
                })
              }
            ><Text style={styles.toggleButtonText}>{t(selectedClient?.status)}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveButton} onPress={handleEditClient}>
              <Text style={styles.saveButtonText}>{t('save')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setEditModalVisibleClient(false)}>
              <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
   
    </View>
  </TouchableWithoutFeedback>

  );
}
