import { View, Text, TouchableOpacity, FlatList, Modal, TextInput} from 'react-native';
import { TouchableWithoutFeedback, Keyboard} from 'react-native';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Dropdown } from 'react-native-element-dropdown';
import Svg, { Path } from 'react-native-svg';
import { useState, useContext,  useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../../AuthContext';
import styles from './Certificate.style';
import { useTranslation } from 'react-i18next';
import { fetchCertificates, fetchServices, fetchClients, addCertificate, deleteCertificate, editCertificate } from './CertificateApi';


export default function CertificatesScreen() {

  const { t } = useTranslation();

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // Функція для форматування дати у локальний формат
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

  const formatDateTimeToLocal = (date) => {
    if (!date) return ""; 
    const d = new Date(date);
    if (isNaN(d.getTime())) return ""; 
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  };

  const showStartDatePicker = () => {
    setStartDatePickerVisibility(true);
  };

  const hideStartDatePicker = () => {
    setStartDatePickerVisibility(false);
  };

  const showEndDatePicker = () => {
    setEndDatePickerVisibility(true);
  };

  const hideEndDatePicker = () => {
    setEndDatePickerVisibility(false);
  };

  const [isStartDatePickerVisible, setStartDatePickerVisibility] = useState(false);
  const [isEndDatePickerVisible, setEndDatePickerVisibility] = useState(false); 
  const { user } = useContext(AuthContext);

  const [services, setServices] = useState([]);
  const [clients, setClients] = useState([]);
  const [certificates, setCertificates] = useState([]);

  const [modalVisibleCertificate, setModalVisibleCertificate] = useState(false);
  const [addModalVisibleCertificate, setAddModalVisibleCertificate] = useState(false);
  const [editModalVisibleCertificate, setEditModalVisibleCertificate] = useState(false);
  const [newCertificate, setNewCertificate] = useState({ client_id: null, service_id: null, valid_from: "", valid_to: "",
    total_sessions: "", used_sessions: "", price: "", status: "active", payment_method: "cash", comment: "", 
      system_id: user?.system_id });
  const [selectedCertificate, setSelectedCertificate] = useState(null);

  useFocusEffect(
    useCallback(() => {
      fetchServices(user?.system_id, setServices);
      fetchCertificates(user?.system_id, setCertificates);
      fetchClients(user?.system_id, setClients);
    }, [user])
  );


  const openModalCertificate = (certificate) => {
    setSelectedCertificate(certificate);
    setModalVisibleCertificate(true);
  };

  const resetNewCertificate = () => {
    setNewCertificate({
      client_id: null,
      service_id: null,
      valid_from: "",
      valid_to: "",
      total_sessions: "",
      used_sessions: "",
      price: "",
      status: "active",
      payment_method: "cash",
      comment: "",
      system_id: user?.system_id,
    });
  };

  const closeAddModal = () => {
    resetNewCertificate(); 
    setAddModalVisibleCertificate(false); 
  };

  const openEditModalCertificate = (certificate) => {
    setSelectedCertificate(certificate);
    setEditModalVisibleCertificate(true);
  };

  const handleAddCertificate = () => {
    addCertificate(newCertificate, certificates, setCertificates, resetNewCertificate, setAddModalVisibleCertificate, t);
  };

  const handleDeleteCertificate = (certificate_id) => {
    deleteCertificate(certificate_id, certificates, setCertificates, t);
  };

  const handleEditCertificate = () => {
    editCertificate(selectedCertificate, certificates, setCertificates, setEditModalVisibleCertificate, t);
  };

  const sortCertificates = (certificates) => {
    return [...certificates].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
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

        <TouchableOpacity style={styles.addButton} onPress={() => setAddModalVisibleCertificate(true)}>
          <Text style={styles.addButtonText}>+ {t('add')}</Text>
        </TouchableOpacity>

        <View style={styles.headerRow}>
          <Text style={[styles.headerText, { flex: 2 }]}>{t('date')}</Text>
          <Text style={[styles.headerText, { flex: 4, paddingRight:48 }]}>{t('client')}</Text>
        </View>

        {certificates.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 20 }}>
            <Text style={{ fontSize: 16, color: 'gray' }}>{t('no_certificates_available')}</Text>
          </View>
          ) : (
          <FlatList
            data={sortCertificates(certificates)}
            keyExtractor={(item) => item.certificate_id.toString()}
            renderItem={({ item }) => (
              
            <View style={styles.certificateItem}>

              <TouchableOpacity style={[styles.certificateTextContainer, { flex: 2, marginRight: 10 }]} onPress={() => openModalCertificate(item)}>
                <Text style={[styles.certificateText, { color: item.status === 'active' ? 'green' : 'red' }]}>{formatDateTimeToLocal(item.created_at)}</Text>
              </TouchableOpacity>

              <Text style={[styles.certificateText, {flex:3, marginRight: 10}]}>
                {clients.find((client) => client.client_id === item.client_id)?.fullName || ""}
              </Text>
              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity style={[styles.editButton, { marginRight: 10 }]} onPress={() => openEditModalCertificate(item)}>
                  <Text>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteCertificate(item.certificate_id)}>
                  <Text>🗑</Text>
                </TouchableOpacity>
              </View>
            </View>
            )}
          />
           )}
      </View>


      {/* Модальне вікно перегляду */}
      <Modal visible={modalVisibleCertificate} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
          {selectedCertificate && (
          <>
          <Text style={styles.modalTitle}>{t('certificate')} {formatDateTimeToLocal(selectedCertificate.created_at)}</Text>
          <Text style={styles.modalText}>{t('client')}: {clients.find((client) => client.client_id === selectedCertificate.client_id)?.fullName || ""}</Text>
          <Text style={styles.modalText}>
            {t('status')}:{" "}
            <Text style={{ color: selectedCertificate.status === "active" ? "green" : "red" }}>
              {t(selectedCertificate.status)}
            </Text>
          </Text>
          <Text style={styles.modalText}>{t('service')}: {services.find((service) => service.service_id === selectedCertificate.service_id)?.name || ""}</Text>
          <Text style={styles.modalText}>{t('total_sessions')}: {selectedCertificate.total_sessions}</Text>
          <Text style={styles.modalText}>{t('used_sessions')}: {selectedCertificate.used_sessions}</Text>
          <Text style={styles.modalText}>{t('price')}: {selectedCertificate.price} {t('currency')}</Text>
          <Text style={styles.modalText}>{t('payment_method')}: {t(selectedCertificate.payment_method)}</Text>
          <Text style={styles.modalText}>{t('valid_from')}: {formatDateToLocal(selectedCertificate.valid_from)}</Text>
          <Text style={styles.modalText}>
            {t('valid_to')}:{" "}
            <Text style={{ color: new Date(selectedCertificate.valid_to) < new Date() ? 'red' : 'black' }}>
              {formatDateToLocal(selectedCertificate.valid_to)}
            </Text>
          </Text>
          <Text style={styles.modalText}>{t('comment')}: {selectedCertificate.comment}</Text>

          </>
          )}
          <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisibleCertificate(false)}>
            <Text style={styles.cancelButtonText}>{t('close')}</Text>
          </TouchableOpacity>
          </View>
        </View>
      </Modal>



      {/* Модальне вікно для додавання сертифіката */}
      <Modal visible={addModalVisibleCertificate} transparent animationType="slide" >
      
        <View style={[styles.modalContainer, { justifyContent: "flex-start", paddingTop: 20, }]}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{t('add_certificate')}</Text>

            {/* Вибір клієнта */}
            <Dropdown
              style={styles.dropdown}
              containerStyle={styles.dropdownContainer}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              itemTextStyle={styles.itemTextStyle}
              inputSearchStyle={styles.inputSearchStyle}
              data={clients.map((client) => ({
                label: client.fullName, 
                value: client.client_id, 
                }))}
                labelField="label"
                valueField="value"
                placeholder={t('select_client')}
                value={newCertificate.client_id}
                onChange={(item) => {
                  setNewCertificate({
                    ...newCertificate,
                    client_id: item.value,
                  });
                }}
                search
                searchPlaceholder={t('search_client')}
                maxHeight={200} 
                
            />
      <View style={{ flexDirection: "row", alignItems: "center" }}>
            {/* Вибір Послуги */}
            <Dropdown
              style={[styles.dropdown, { flex: 5, marginRight: 10 }]}
              data={services.map((service) => ({
                label: service.name, 
                value: service.service_id, 
                }))}
                labelField="label"
                valueField="value"
                placeholder={t('select_service')}
                value={newCertificate.service_id}
                onChange={(item) => {
                  const service = services.find((s) => s.service_id === item.value);
                  setNewCertificate({
                    ...newCertificate,
                    service_id: item.value,
                    total_sessions: service?.total_sessions || "",
                    price: service?.price || "",
                  });
                }}
                search
                searchPlaceholder={t('search_service')}
                maxHeight={200} 
               
                containerStyle={styles.dropdownContainer}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                itemTextStyle={styles.itemTextStyle}
                inputSearchStyle={styles.inputSearchStyle}
            />

            <TextInput
            style={[styles.input, { flex: 1, }]} 
            placeholder={t('total')}
            value={newCertificate.total_sessions?.toString() || ""}
            keyboardType="numeric"
            onChangeText={(text) =>
              setNewCertificate({ ...newCertificate, total_sessions: parseInt(text) || "" })
            }
            />
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", }}>
          <TextInput
            style={[styles.input, { flex: 1, marginRight: 10 }]}
            placeholder={t('price')}
            value={newCertificate.price?.toString() || ""}  
            keyboardType="numeric"
            onChangeText={(text) => {
                        
            if (!isNaN(text) || text === '') {
              setNewCertificate({ ...newCertificate, price: parseInt(text) || "" });
                          
              }
            }}
          />

          <TouchableOpacity
            style={[styles.toggleButton, {flex: 1, backgroundColor: newCertificate?.payment_method === "cash" ? "green" : "blue"}]}
            onPress={() =>
              setNewCertificate({
                ...newCertificate,
                payment_method: newCertificate.payment_method === "cash" ? "card" : "cash",
              })
            }
          >
            <Text style={styles.toggleButtonText}>
              {t(newCertificate.payment_method)}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity onPress={showStartDatePicker} style={[styles.datePickerButton, { flex: 1, marginRight: 10 }]}>
            <Text style={styles.datePickerButtonText}>
              {formatDateToLocal(newCertificate.valid_from) || t('valid_from')}
            </Text>
          </TouchableOpacity>
          <DateTimePickerModal
            isVisible={isStartDatePickerVisible}
            mode="date"
            display="spinner"
            date={newCertificate?.valid_from
              ? new Date(newCertificate.valid_from.split('.').reverse().join('-')) 
              : new Date()} 
            onConfirm={(selectedDate) => {
              if (newCertificate) {
                const day = String(selectedDate.getDate()).padStart(2, '0');
                const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                const year = selectedDate.getFullYear();
                const formattedDate = `${year}-${month}-${day}`;
                setNewCertificate((prevCertificate) => ({
                  ...prevCertificate,
                  valid_from: formattedDate,
                }));
              } else {
                console.error('newCertificate is null');
              }
              hideStartDatePicker();
            }} 
            onCancel={hideStartDatePicker} 
            maximumDate={new Date()} 
            minimumDate={new Date(2025, 1, 1)} 
          />

          <TouchableOpacity onPress={showEndDatePicker} style={[styles.datePickerButton, { flex: 1 }]}>
            <Text style={styles.datePickerButtonText}>
              {formatDateToLocal(newCertificate.valid_to) || t('valid_to')}
            </Text>
          </TouchableOpacity>
          <DateTimePickerModal
            isVisible={isEndDatePickerVisible}
            mode="date"
            display="spinner"
            date={newCertificate?.valid_to
              ? new Date(newCertificate.valid_to.split('.').reverse().join('-')) 
              : new Date()} 
            onConfirm={(selectedDate) => {
              if (newCertificate) {
                const day = String(selectedDate.getDate()).padStart(2, '0');
                const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                const year = selectedDate.getFullYear();
                const formattedDate = `${year}-${month}-${day}`;
                setNewCertificate((prevCertificate) => ({
                  ...prevCertificate,
                  valid_to: formattedDate,
                }));
              } else {
                console.error('newCertificate is null');
              }
              hideEndDatePicker();
            }} 
            onCancel={hideEndDatePicker} 
            minimumDate={new Date(2025, 1, 1)} 
          />
        </View>

        <TextInput
        style={styles.input}
        placeholder={t('comment')}
        value={newCertificate.comment || ""}
        onChangeText={(text) =>
          setNewCertificate({ ...newCertificate, comment: text })
        }
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleAddCertificate}>
        <Text style={styles.saveButtonText}>{t('save')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.cancelButton} onPress={closeAddModal}>
        <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
      </TouchableOpacity>
          </View>
        </View>
        
      </Modal>



      {/* Модальне вікно редагування послуг */}
      <Modal visible={editModalVisibleCertificate} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{t('edit_certificate')}</Text>
            <Text style={styles.modalText}>{t('certificate')} {formatDateTimeToLocal(selectedCertificate?.created_at)}</Text>
            <Text style={styles.modalText}>{t('client')} {clients.find((client) => client.client_id === selectedCertificate?.client_id)?.fullName || ""}</Text>
            <Text style={styles.modalText}>{t('service')} {services.find((service) => service.service_id === selectedCertificate?.service_id)?.name || ""}</Text>
            <Text style={styles.modalText}>{t('used_sessions')} {selectedCertificate?.used_sessions} / {selectedCertificate?.total_sessions} </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={[styles.modalText, { flex: 1, marginRight: 10 }]}>{t('from')}: {formatDateToLocal(selectedCertificate?.valid_from)}</Text>
              <Text style={[styles.modalText, { flex: 1 }]}>{t('to')}:{" "}
                <Text style={{ color: new Date(selectedCertificate?.valid_to) < new Date() ? "red" : "black" }}>
                  {formatDateToLocal(selectedCertificate?.valid_to)}
                </Text>
              </Text>
            </View>
            <Text style={styles.modalText}>{t('extend_certificate')}</Text>
            <TouchableOpacity onPress={showEndDatePicker} style={styles.datePickerButton}>
            <Text style={styles.datePickerButtonText}>
              {formatDateToLocal(selectedCertificate?.valid_to) || t('valid_to')}
            </Text>
          </TouchableOpacity>
          <DateTimePickerModal
            isVisible={isEndDatePickerVisible}
            mode="date"
            display="spinner"
            date={selectedCertificate?.valid_to ? new Date(selectedCertificate.valid_to) : new Date()} 
            onConfirm={(selectedDate) => {
              if (selectedCertificate) {
                const isoDate = selectedDate.toISOString().split('T')[0];
                setSelectedCertificate((prevCertificate) => ({
                  ...prevCertificate,
                  valid_to: isoDate,
                }));
              } else {
                console.error('newCertificate is null');
              }
              hideEndDatePicker();
            }} 
            onCancel={hideEndDatePicker} 
            minimumDate={new Date(2025, 1, 1)} 
          />
                  <TextInput
                    style={styles.input}
                    placeholder={t('comment')}
                    value={selectedCertificate?.comment || ""}
                    onChangeText={(text) =>
                    setSelectedCertificate({ ...selectedCertificate, comment: text })
                 }
                  />
          
            <TouchableOpacity style={styles.saveButton} onPress={handleEditCertificate}>
              <Text style={styles.saveButtonText}>{t('save')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setEditModalVisibleCertificate(false)}>
              <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  </TouchableWithoutFeedback>

  );
}
