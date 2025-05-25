import { View, Text, TouchableOpacity, FlatList, Modal, TextInput } from 'react-native';
import { Dimensions } from 'react-native';
import { TouchableWithoutFeedback, Keyboard } from 'react-native';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Dropdown } from 'react-native-element-dropdown';
import Svg, { Path } from 'react-native-svg';
import { useState, useContext, useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { BASE_URL } from '../../config';
import { AuthContext } from '../../AuthContext';
import { Calendar } from 'react-native-big-calendar';
import { Alert } from 'react-native';
import styles from './Calendar.style';
import { fetchHalls, fetchCategories, fetchClients, fetchEmployees, fetchEvents, fetchClientCertificates, addEvent, deleteEvent, editEvent } from './CalendarApi';

const { height } = Dimensions.get('window');


export default function CalendarScreen() {

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const formatTimeToLocal = (time) => {
    if (!time || typeof time !== 'string') return '';
  const [hours, minutes] = time.split(':');
  return `${hours}:${minutes}`;
  };

  const formatDateToDisplay = (date) => {
    if (!date) return "";
    const [year, month, day] = date.split("-");
    return `${day}.${month}.${year}`;
  };

  
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedClients, setSelectedClients] = useState([]);
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [halls, setHalls] = useState([]);
  const [ClientCertificates, setClientCertificates] = useState([]);

  const [startTimePickerVisible, setStartTimePickerVisible] = useState(false);
  const [endTimePickerVisible, setEndTimePickerVisible] = useState(false);
  const [eventDatePickerVisible, setEventDatePickerVisible] = useState(false);

  const [selectedHall, setSelectedHall] = useState("Всі"); // Фільтр за залом
  const [selectedEmployee, setSelectedEmployee] = useState("Всі"); // Фільтр за працівником

  const [certificatesModalVisible, setCertificatesModalVisible] = useState(false);
  const [selectedClientForCertificates, setSelectedClientForCertificates] = useState(null);

  // Стан для модального вікна
  const [addModalVisibleEvent, setAddModalVisibleEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    category_id: null,
    hall_id: null,
    user_id: null,
    event_date: "",
    start_time: "",
    end_time:"",
    color:"#FFA500",
    comment:"",
    system_id: user?.system_id,
    is_active: true,
  });

  const [editModalVisibleEvent, setEditModalVisibleEvent] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState({
    title: "",
    category_id: null,
    hall_id: null,
    user_id: null,
    event_date: "",
    start_time: "",
    end_time: "",
    color: "#FFA500",
    comment: "",
    is_active: true,
    clients: [],
  });

  useFocusEffect(
    useCallback(() => {
      fetchEvents(user?.system_id, setEvents);
      fetchClients(user?.system_id, setClients);
      fetchCategories(user?.system_id, setCategories);
      fetchEmployees(user?.system_id, setEmployees);
      fetchHalls(user?.system_id, setHalls);
      
    }, [user])
  );

  const fetchEventClients = useCallback((event_id, category_id) => {
  fetch(`${BASE_URL}/calendar/${event_id}/clients`)
    .then((response) => response.json())
    .then((data) => {
        const clientsWithCertificates = data.map((client) => ({
        client_id: client.client_id,
        fullName: `${client.surname} ${client.name}`,
        certificates: [], // Ініціалізуємо порожній масив для сертифікатів
      }));

      setSelectedClients(clientsWithCertificates);

      // Завантажуємо сертифікати для кожного клієнта
      clientsWithCertificates.forEach((client) => {
        fetchClientCertificates(user?.system_id, client.client_id, setClientCertificates, { category_id });
      });
    })
    .catch((error) => console.error('Помилка завантаження клієнтів події:', error));
}, []);

  const fetchDeductSessions = useCallback(() => {
    fetch(`${BASE_URL}/calendar/deduct-sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_id: selectedEvent.event_id,
        deductions: selectedClients.map((client) => ({
          certificate_id: client.certificate_id, // Ідентифікатор сертифіката клієнта
          client_id: client.client_id,          // Ідентифікатор клієнта
          user_id: selectedEvent.user_id,       // Ідентифікатор тренера
        })),
        system_id: user?.system_id,
      }),
    })
  .then((response) => response.json())
  .then((data) => {
    console.log('Списання успішно виконано:', data);

      setSelectedEvent((prevEvent) => ({
        ...prevEvent,
        color: "#808080", 
        is_active: false,
      }));

      setSelectedClients((prevClients) =>
        prevClients.map((client) => ({
          ...client,
          certificateInfo: client.certificateInfo, // Зберігаємо інформацію про сертифікат
        }))
      );

      // Оновлюємо список подій
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.event_id === selectedEvent.event_id
            ? { ...event, color: "#808080", is_active: false }
            : event
        )
      );
      fetchEventClients(selectedEvent.event_id, selectedEvent.category_id);

      Alert.alert("Успіх", "Подію успішно оплачено.");
      setEditModalVisibleEvent(false);
  })
  .catch((error) => console.error('Помилка списання занять:', error));
}, [selectedEvent, selectedClients, user]);

const handlePayment = () => {

  const clientsWithoutCertificates = selectedClients.filter(
    (client) => !client.certificate_id
  );

  if (clientsWithoutCertificates.length > 0) {
    Alert.alert(
      "Помилка",
      "У всіх клієнтів мають бути обрані сертифікати перед оплатою."
    );
    return;
  }
  handleEditEvent();
  fetchDeductSessions();
  fetchEventClients(selectedEvent.event_id, selectedEvent.category_id);
  fetchEvents(user?.system_id, setEvents);
};

  
  const handleAddEvent = () => {
    addEvent(user?.system_id, newEvent, events, setEvents, resetNewEvent, setAddModalVisibleEvent, fetchEvents);
  };

  const handleDeleteEvent = (event_id) => {
    deleteEvent(event_id, events, setEvents, setEditModalVisibleEvent);
  };

  const handleEditEvent = () => {
    
    editEvent(user?.system_id, selectedEvent, events, setEvents, fetchEvents, setEditModalVisibleEvent);
    if (selectedClients.length === 0) {
    console.log('Список клієнтів порожній. Запит не буде виконано.');
    return;
  }
    fetch(`${BASE_URL}/calendar/${selectedEvent.event_id}/clients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clients: selectedClients.map((client) => client.client_id),
      system_id: user?.system_id,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log('Клієнти успішно збережені:', data);
    })
    .catch((error) => console.error('Помилка збереження клієнтів:', error));
};

  const resetNewEvent = () => {
    setNewEvent({
      title: "",
      category_id: null,
      hall_id: null,
      user_id: null,
      event_date: "",
      start_time: "",
      end_time:"",
      color:"#FFA500",
      comment:"",
      system_id: user?.system_id
    });
  };

  const closeAddModal = () => {
    resetNewEvent(); 
    setAddModalVisibleEvent(false); 
  };


  const openEditModalEvent = (event) => {
    setSelectedEvent(event);
    fetchEventClients(event.event_id, event.category_id);
    setEditModalVisibleEvent(true);
  };

  const filteredEvents = events.filter((event) => {
  // Фільтр за залом
    if (selectedHall !== "Всі" && event.hall_id !== selectedHall) {
      return false;
    }
  // Фільтр за працівником
    if (selectedEmployee !== "Всі" && event.user_id !== selectedEmployee) {
      return false;
    }
    return true;
  });

  const selectCertificateForClient = (client_id, certificate) => {
  setSelectedClients((prevClients) =>
    prevClients.map((client) =>
      client.client_id === client_id
        ? { ...client, certificate_id: certificate.certificate_id, certificateInfo: certificate }
        : client
    )
  );
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

        <TouchableOpacity style={styles.addButton} onPress={() => setAddModalVisibleEvent(true)}>
          <Text style={styles.addButtonText}>+ Додати подію</Text>
        </TouchableOpacity>
        
        <Calendar
          events={filteredEvents}
          height={height * 0.8}
          mode="week"
          locale="uk"
          weekStartsOn={1}
          date={new Date()}
          eventCellStyle={(event) => ({ backgroundColor: event.color || '#FFA500' })}
          swipeEnabled
          showTime
          onPressEvent={(event) => openEditModalEvent(event)}  
        />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          {/* Вибір залу */}
          <Dropdown
            style={[styles.dropdown, { flex: 1, marginRight: 10, margin: 20, borderRadius: 5, }]}
            data={[
              { label: "Всі", value: "Всі" },
              ...halls.map((hall) => ({ label: hall.name, value: hall.hall_id })),
            ]}
            labelField="label"
            valueField="value"
            placeholder="Обрати зал"
            value={selectedHall}
            onChange={(item) => setSelectedHall(item.value)}
            placeholderStyle={styles.dropdownPlaceholder}
            selectedTextStyle={styles.dropdownText}
            itemTextStyle={styles.dropdownItemText}
          />

          {/* Вибір працівника */}
          <Dropdown
            style={[styles.dropdown, { flex: 1, marginLeft: 10, margin: 20, borderRadius: 5, }]}
            data={[
              { label: "Всі", value: "Всі" },
              ...employees.map((employee) => ({ label: employee.fullName, value: employee.user_id })),
            ]}
            labelField="label"
            valueField="value"
            placeholder="Обрати працівника"
            value={selectedEmployee}
            onChange={(item) => setSelectedEmployee(item.value)}
            placeholderStyle={styles.dropdownPlaceholder}
            selectedTextStyle={styles.dropdownText}
            itemTextStyle={styles.dropdownItemText}
          />
        </View>
      </View>

{/* Модальне вікно для додавання події */}
      <Modal visible={addModalVisibleEvent} transparent animationType="slide">
        <View style={[styles.modalContainer, { justifyContent: "flex-start", paddingTop: 20, }]}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Додати подію</Text>

            {/* Вибір кольору події */}
            <View style={styles.colorPickerContainer}>
              {['#FFA500', '#00BFFF', '#FF6347', '#32CD32', '#8A2BE2', '#FFD700', '#40E0D0'].map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  newEvent.color === color && styles.selectedColorOption,
              ]}
                onPress={() => setNewEvent((prevEvent) => ({ ...prevEvent, color }))}
               />
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Назва події"
              value={newEvent.title}
              onChangeText={(text) => setNewEvent({ ...newEvent, title: text })}
            />

            <Dropdown
              style={styles.dropdown}
              data={categories.map((category) => ({
                label: category.name, 
                value: category.category_id, 
              }))}
              labelField="label"
              valueField="value"
              placeholder="Оберіть категорію"
              value={newEvent.category_id}
              onChange={(item) => {
                setNewEvent({
                  ...newEvent,
                  category_id: item.value,
                });
              }}
              containerStyle={styles.dropdownContainer}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              itemTextStyle={styles.itemTextStyle}
            />   

            <Dropdown
              style={styles.dropdown}
              data={halls.map((hall) => ({
                label: hall.name,
                value: hall.hall_id,
              }))}
              labelField="label"
              valueField="value"
              placeholder="Оберіть зал"
              value={newEvent.hall_id}
              onChange={(item) => {
                setNewEvent({
                  ...newEvent,
                  hall_id: item.value,
                });
              }}
              containerStyle={styles.dropdownContainer}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              itemTextStyle={styles.itemTextStyle}
            />

            <Dropdown
              style={styles.dropdown}
              data={employees.map((employee) => ({
                label: employee.fullName,
                value: employee.user_id,
              }))}
              labelField="label"
              valueField="value"
              placeholder="Оберіть працівника"
              value={newEvent.user_id}
              onChange={(item) => {
                setNewEvent({
                  ...newEvent,
                  user_id: item.value,
                });
              }}
              containerStyle={styles.dropdownContainer}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              itemTextStyle={styles.itemTextStyle}
            />              

            {/* Вибір дати події */}
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setEventDatePickerVisible(true)}
            >
              <Text style={styles.datePickerButtonText}>
                Дата події: {formatDateToDisplay(newEvent.event_date) || "Не обрано"}
              </Text>
            </TouchableOpacity>
            <DateTimePickerModal
              isVisible={eventDatePickerVisible}
              mode="date"
              display="spinner"
              date={newEvent.event_date ? new Date(newEvent.event_date) : new Date()}
              onConfirm={(selectedDate) => {
                const day = String(selectedDate.getDate()).padStart(2, '0');
                const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                const year = selectedDate.getFullYear();
                setNewEvent((prevEvent) => ({
                  ...prevEvent,
                  event_date: `${year}-${month}-${day}`,
                }));
                setEventDatePickerVisible(false);
              }}
              onCancel={() => setEventDatePickerVisible(false)}
            />
                
            {/* Вибір часу початку */}
            <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setStartTimePickerVisible(true)}
            >
              <Text style={styles.datePickerButtonText}>
                Час початку: {formatTimeToLocal(newEvent.start_time) || "Не обрано"}
              </Text>
            </TouchableOpacity>
            <DateTimePickerModal
              isVisible={startTimePickerVisible}
              mode="time"
              display="spinner"
              date={new Date()} 
              onConfirm={(selectedTime) => {
                const hours = String(selectedTime.getHours()).padStart(2, '0'); 
                const minutes = String(selectedTime.getMinutes()).padStart(2, '0'); 
                const formattedTime = `${hours}:${minutes}:00`;
                setNewEvent((prevEvent) => ({
                  ...prevEvent,
                  start_time: formattedTime,
                }));
                setStartTimePickerVisible(false);
              }}
              onCancel={() => setStartTimePickerVisible(false)}
            />


            {/* Вибір часу закінчення */}
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setEndTimePickerVisible(true)}
            >
              <Text style={styles.datePickerButtonText}>
                Час закінчення: {formatTimeToLocal(newEvent.end_time) || "Не обрано"}
              </Text>
            </TouchableOpacity>
            <DateTimePickerModal
              isVisible={endTimePickerVisible}
              mode="time"
              display="spinner"
              date={new Date()} 
              onConfirm={(selectedTime) => {
                const hours = String(selectedTime.getHours()).padStart(2, '0'); 
                const minutes = String(selectedTime.getMinutes()).padStart(2, '0'); 
                const formattedTime = `${hours}:${minutes}:00`;
                setNewEvent((prevEvent) => ({
                  ...prevEvent,
                  end_time: formattedTime,
                }));
                setEndTimePickerVisible(false);
              }}
              onCancel={() => setEndTimePickerVisible(false)}
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleAddEvent}>
              <Text style={styles.saveButtonText}>Зберегти</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={closeAddModal}>
              <Text style={styles.cancelButtonText}>Скасувати</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>




{/* Модальне вікно редагування послуг */}
      <Modal visible={editModalVisibleEvent} transparent animationType="slide">
        <View style={[styles.modalContainer, { justifyContent: "flex-start", paddingTop: 20, }]}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Редагувати подію</Text>

            <View style={styles.colorPickerContainer}>
              {['#FFA500', '#00BFFF', '#FF6347', '#32CD32', '#8A2BE2', '#FFD700', '#40E0D0'].map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  selectedEvent.color === color && styles.selectedColorOption,
              ]}
                onPress={() => {
                  if (selectedEvent.is_active) {
                    setSelectedEvent((prevEvent) => ({ ...prevEvent, color }));
                  }
                }}
                disabled={!selectedEvent.is_active}
               />
              ))}
            </View>


            <TextInput
              style={[styles.input, { backgroundColor: selectedEvent.is_active ? "#fff" : "#f0f0f0" }]}
              placeholder="Назва події"
              value={selectedEvent?.title}
              onChangeText={(text) => setSelectedEvent({ ...selectedEvent, title: text })}
              editable={selectedEvent.is_active}
            />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Dropdown
              style={[styles.dropdown, { flex: 1, marginRight: 5, backgroundColor: selectedEvent.is_active ? "#fff" : "#f0f0f0" }]}
              data={categories.map((category) => ({
              label: category.name, 
              value: category.category_id, 
              }))}
              labelField="label"
              valueField="value"
              placeholder="Оберіть категорію"
              value={selectedEvent?.category_id}
              onChange={(item) => {
                if (selectedEvent.is_active) {
                  setSelectedEvent({ ...selectedEvent, category_id: item.value });
                }
              }}
              disabled={!selectedEvent.is_active}
              containerStyle={styles.dropdownContainer}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              itemTextStyle={styles.itemTextStyle}
            />  
            

            <Dropdown
              style={[styles.dropdown, { flex: 1, marginLeft: 5, backgroundColor: selectedEvent.is_active ? "#fff" : "#f0f0f0" }]}
              data={halls.map((hall) => ({
                label: hall.name,
                value: hall.hall_id,
              }))}
              labelField="label"
              valueField="value"
              placeholder="Оберіть зал"
              value={selectedEvent?.hall_id}
              onChange={(item) => {
                if (selectedEvent.is_active) {
                  setSelectedEvent({
                    ...selectedEvent,
                    hall_id: item.value,
                  });
                }
              }}
              disabled={!selectedEvent.is_active}
              containerStyle={styles.dropdownContainer}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              itemTextStyle={styles.itemTextStyle}
            />
            </View>

            <Dropdown
              style={[styles.dropdown, { backgroundColor: selectedEvent.is_active ? "#fff" : "#f0f0f0" }]}
              data={employees.map((employee) => ({
                label: employee.fullName,
                value: employee.user_id,
              }))}
              labelField="label"
              valueField="value"
              placeholder="Оберіть працівника"
              value={selectedEvent?.user_id}
              onChange={(item) => {
                if (selectedEvent.is_active) {
                  setSelectedEvent({
                    ...selectedEvent,
                    user_id: item.value,
                  });
                }
              }}
              disabled={!selectedEvent.is_active}
              containerStyle={styles.dropdownContainer}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              itemTextStyle={styles.itemTextStyle}
            /> 

            {/* Вибір дати події */}
            <TouchableOpacity
              style={[styles.datePickerButton, { backgroundColor: selectedEvent.is_active ? "#fff" : "#f0f0f0" }]}
              onPress={() => {
                if (selectedEvent.is_active) {
                  setEventDatePickerVisible(true);
                }
              }}
              disabled={!selectedEvent.is_active}
            >
              <Text style={styles.datePickerButtonText}>
                Дата події: {formatDateToDisplay(selectedEvent?.event_date) || "Не обрано"}
              </Text>
            </TouchableOpacity>
            <DateTimePickerModal
              isVisible={eventDatePickerVisible}
              mode="date"
              display="spinner"
              date={selectedEvent?.event_date ? new Date(selectedEvent.event_date) : new Date()}
              onConfirm={(selectedDate) => {
                const day = String(selectedDate.getDate()).padStart(2, '0');
                const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                const year = selectedDate.getFullYear();
                setSelectedEvent((prevEvent) => ({
                  ...prevEvent,
                  event_date: `${year}-${month}-${day}`,
                }));
                setEventDatePickerVisible(false);
              }}
              onCancel={() => setEventDatePickerVisible(false)}
            /> 

            {/* Вибір часу початку */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <TouchableOpacity
              style={[styles.datePickerButton, { flex: 1, marginRight: 5, backgroundColor: selectedEvent.is_active ? "#fff" : "#f0f0f0" }]}
              onPress={() => {
                if (selectedEvent.is_active) {
                  setStartTimePickerVisible(true);
                }
              }}
              disabled={!selectedEvent.is_active}
            >
              <Text style={styles.datePickerButtonText}>
                Початок: {formatTimeToLocal(selectedEvent?.start_time) || "Не обрано"}
              </Text>
            </TouchableOpacity>
            <DateTimePickerModal
              isVisible={startTimePickerVisible}
              mode="time"
              display="spinner"
              date={new Date()} 
              onConfirm={(selectedTime) => {
                const hours = String(selectedTime.getHours()).padStart(2, '0'); 
                const minutes = String(selectedTime.getMinutes()).padStart(2, '0'); 
                const formattedTime = `${hours}:${minutes}:00`;
                setSelectedEvent((prevEvent) => ({
                  ...prevEvent,
                  start_time: formattedTime,
                }));
                setStartTimePickerVisible(false);
              }}
              onCancel={() => setStartTimePickerVisible(false)}
            />


            {/* Вибір часу закінчення */}
            <TouchableOpacity
              style={[styles.datePickerButton, { flex: 1, marginLeft: 5, backgroundColor: selectedEvent.is_active ? "#fff" : "#f0f0f0" }]}
              onPress={() => {
                if (selectedEvent.is_active) {
                  setEndTimePickerVisible(true);
                }
              }}
              disabled={!selectedEvent.is_active}
            >
              <Text style={styles.datePickerButtonText}>
                Кінець: {formatTimeToLocal(selectedEvent?.end_time) || "Не обрано"}
              </Text>
            </TouchableOpacity>
            <DateTimePickerModal
              isVisible={endTimePickerVisible}
              mode="time"
              display="spinner"
              date={new Date()} 
              onConfirm={(selectedTime) => {
                const hours = String(selectedTime.getHours()).padStart(2, '0'); 
                const minutes = String(selectedTime.getMinutes()).padStart(2, '0'); 
                const formattedTime = `${hours}:${minutes}:00`;
                setSelectedEvent((prevEvent) => ({
                  ...prevEvent,
                  end_time: formattedTime,
                }));
                setEndTimePickerVisible(false);
              }}
              onCancel={() => setEndTimePickerVisible(false)}
            />
            </View>

            <Dropdown
              style={styles.dropdown}
              data={clients.map((client) => ({
                label: client.fullName,
                value: client.client_id,
              }))}
              labelField="label"
              valueField="value"
              placeholder="Оберіть клієнта"
              onChange={(item) => {
              setSelectedClients((prevClients) => {
                if (prevClients.some((client) => client.client_id === item.value)) {
                  return prevClients;
                }
                return [...prevClients, { client_id: item.value, fullName: item.label }];
              });
              }}
              search
              searchPlaceholder="Пошук клієнта..."
              disabled={!selectedEvent.is_active}
              containerStyle={styles.dropdownContainer}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              itemTextStyle={styles.itemTextStyle}
            />
               
            <FlatList
              data={selectedClients}
              keyExtractor={(item) => item.client_id.toString()}
              renderItem={({ item }) => (
              <View style={styles.selectedClientItem}>
                <Text style={styles.selectedClientText}>{item.fullName}</Text>
              
              <TouchableOpacity
                style={[
                  styles.showCertificatesButton,
                  item.certificateInfo ? styles.selectedCertificateButton : null, // Застосовуємо зелений стиль, якщо сертифікат вибрано
                ]}
                onPress={() => {
                  if (selectedEvent?.category_id && selectedEvent.is_active) {
                    fetchClientCertificates(user?.system_id, item.client_id, setClientCertificates, selectedEvent);
                    setSelectedClientForCertificates(item); // Зберігаємо вибраного клієнта
                    setCertificatesModalVisible(true); // Відкриваємо модальне вікно
                  } else {
                  console.error("Категорія події не вибрана");
                   }
                }}
                disabled={!selectedEvent.is_active} // Вимкнути кнопку, якщо подія оплачена
              >
              
                {item.certificateInfo ? (
    <Text style={styles.certificateText}>
      {`${item.certificateInfo.used_sessions}/${item.certificateInfo.total_sessions}`}
    </Text>
  ) : (
    <Text>📜</Text> // Відображати іконку, якщо сертифікат не вибрано і подія активна
  ) }
              </TouchableOpacity>


                <TouchableOpacity
                  style={styles.removeClientButton}
        onPress={() => {
          setSelectedClients((prevClients) =>
            prevClients.filter((client) => client.client_id !== item.client_id)
          );
          
        
        // Видалення клієнта з бази даних
          fetch(`${BASE_URL}/calendar/${selectedEvent.event_id}/clients/${item.client_id}`, {
            method: 'DELETE',
          })
            .then((response) => {
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              return response.json();
            })
            .then((data) => {
              console.log('Клієнт успішно видалений:', data);
            })
            .catch((error) => console.error('Помилка видалення клієнта:', error));
        }}
                disabled={!selectedEvent.is_active} // Вимкнути кнопку, якщо подія оплачена
              >
                <Text>🗑</Text>
                </TouchableOpacity>
                </View>
              )}
              style={styles.clientList}
              />
 {selectedEvent.is_active && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: "orange", marginRight: 10 }]} onPress={handleEditEvent}>
              <Text style={styles.actionButtonText}>Зберегти</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, { backgroundColor: "blue", marginRight: 10 }]} onPress={handlePayment}>
              <Text style={styles.actionButtonText}>Оплатити</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, { backgroundColor: "red" }]} onPress={() => handleDeleteEvent(selectedEvent.event_id)}>
              <Text style={styles.actionButtonText}>Видалити</Text>
            </TouchableOpacity>

          </View>
 )}
            <TouchableOpacity style={styles.cancelButton} onPress={() => setEditModalVisibleEvent(false)}>
              <Text style={styles.cancelButtonText}>Закрити</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>



      <Modal visible={certificatesModalVisible} transparent animationType="slide">
  <View style={styles.modalContainer}>
    <View style={styles.modalBox}>
      <Text style={styles.modalTitle}>Сертифікати клієнта</Text>
      {ClientCertificates[selectedClientForCertificates?.client_id]?.length > 0 ? (
        <FlatList
          data={ClientCertificates[selectedClientForCertificates?.client_id]}
          keyExtractor={(cert) => cert.certificate_id.toString()}
          renderItem={({ item: cert }) => (
            <TouchableOpacity
              style={styles.certificateItem}
              onPress={() => {
                selectCertificateForClient(selectedClientForCertificates.client_id, cert);
                setCertificatesModalVisible(false); 
              }}
            >
              <Text>{cert.service_name}</Text>
              <Text>{`${cert.used_sessions}/${cert.total_sessions}`}</Text>
            </TouchableOpacity>
          )}
        />
      ) : (
        <Text>Сертифікати відсутні</Text>
      )}
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => setCertificatesModalVisible(false)}
      >
        <Text style={styles.cancelButtonText}>Закрити</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

           
    </View>
  </TouchableWithoutFeedback>

  );
}
