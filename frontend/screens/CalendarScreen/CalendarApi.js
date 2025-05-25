import { BASE_URL } from '../../config';
import { Alert } from 'react-native';

export const fetchEvents = (system_id, setEvents) => {

    console.log('system_id:', system_id);
    if (system_id) {
      fetch(`${BASE_URL}/calendar?system_id=${system_id}`)
      .then((response) => response.json())
      .then((data) => {
        const formattedEvents = data.map((event) => {
          const start = new Date(`${event.event_date}T${event.start_time}`);
          const end = new Date(`${event.event_date}T${event.end_time}`);
          return {...event, start, end, };
        });
        setEvents(formattedEvents);
      })
      .catch((error) => console.error('Помилка завантаження подій:', error));
  } else {
    console.error('system_id events користувача не знайдено');
  }
  };


export const fetchHalls = (system_id, setHalls) => {
          if (system_id) {
            fetch(`${BASE_URL}/halls?system_id=${system_id}`)
              .then((response) => response.json())
              .then((data) => setHalls(
                data.filter((hall) => hall.status === "Активний")
              ))
              .catch((error) => console.error('Помилка завантаження залів:', error));
          } else {
            console.error('system_id halls користувача не знайдено');
          }
    };


export const fetchCategories = (system_id, setCategories) => {
        if (system_id) {
          fetch(`${BASE_URL}/categories?system_id=${system_id}`)
            .then((response) => response.json())
            .then((data) => setCategories(
              data.filter((category) => category.status === "Активний")))
            .catch((error) => console.error('Помилка завантаження категорій:', error));
          } else {
            console.error('system_id categories користувача не знайдено');
          }
    };


export const fetchEmployees = (system_id, setEmployees) => {
        if (system_id) {
          fetch(`${BASE_URL}/users?system_id=${system_id}`)
            .then((response) => response.json())
            .then((data) => {
              setEmployees(
                data.map((employee) => ({
                  ...employee,
                  fullName: `${employee.surname} ${employee.name}`,
                })).filter((employee) => employee.status === "Активний")
              );
            })
            .catch((error) => console.error('Помилка завантаження співробітників:', error));
        } else {
          console.error('system_id employees користувача не знайдено');
        }
  };


export const fetchClients = (system_id, setClients) => {
        if (system_id) {
          fetch(`${BASE_URL}/clients?system_id=${system_id}`)
            .then((response) => response.json())
            .then((data) => {
              setClients(
                data.map((client) => ({
                  ...client,
                  fullName: `${client.surname} ${client.name}`, 
                  })).filter((client) => client.status === "Активний")
                );
            })
            .catch((error) => console.error('Помилка завантаження клієнтів:', error));
        } else {
          console.error('system_id clients користувача не знайдено');
        }
  };


  export const fetchClientCertificates = (system_id, client_id, setClientCertificates, selectedEvent) => {
    if (system_id && client_id && selectedEvent?.category_id) {
        fetch(`${BASE_URL}/calendar/clients/${client_id}/certificates?category_id=${selectedEvent.category_id}`)
        .then((response) => response.json())
        .then((data) => {
          setClientCertificates((prevCertificates) => ({
          ...prevCertificates,
          [client_id]: data, // Зберігаємо сертифікати для конкретного клієнта
        }));
    })
    .catch((error) => console.error('Помилка завантаження сертифікатів клієнта:', error));
    } else {
        console.error('system_id користувача не знайдено');
    }
};


  // Додавання події
 export const addEvent = (system_id, newEvent, events, setEvents, resetNewEvent, setAddModalVisibleEvent, fetchEvents) => {
    fetch(`${BASE_URL}/calendar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEvent)
    })
    .then(response => response.json())
    .then(data => {
      if(data.error){
        console.log('data:', data);
        Alert.alert('Помилка', data.error || 'Не вдалося додати подію');
      } else {
        setEvents([...events, {
            ...data,
            start: new Date(`${data.event_date}T${data.start_time}`),
            end: new Date(`${data.event_date}T${data.end_time}`),
          }]);
        resetNewEvent();
        setAddModalVisibleEvent(false);
        Alert.alert('Успіх', 'Подію успішно додано');
        fetchEvents(system_id, setEvents);
      }
    })
    .catch((error) => console.error('Помилка додавання події:', error));
  };


  // Збереження редагування події
  export const editEvent = (system_id, selectedEvent, events, setEvents, fetchEvents, setEditModalVisibleEvent) => {

      fetch(`${BASE_URL}/calendar/${selectedEvent.event_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedEvent),
      })
        .then((response) => response.json())
        .then((data) => {
          if(data.error) {
            Alert.alert('Помилка', data.error || 'Не вдалося зберегти зміни');
          } else {
        setEvents(events.map((event) =>
          event.event_id === selectedEvent.event_id
            ? {
                ...data,
                start: new Date(`${data.event_date}T${data.start_time}`),
                end: new Date(`${data.event_date}T${data.end_time}`),
              }
            : event
        ));
        fetchEvents(system_id, setEvents);
        setEditModalVisibleEvent(false);
        Alert.alert('Успіх', 'Подію успішно оновлено');
      }
    })
    .catch((error) => console.error('Помилка оновлення події:', error));
};


export const deleteEvent = (id, events, setEvents, setEditModalVisibleEvent) => {
        fetch(`${BASE_URL}/calendar/${id}`, { method: 'DELETE' })
        .then((response) => response.json())
        .then((data) => {
          if(data.error){
            Alert.alert('Помилка', data.error);
          } else {
            setEvents(events.filter((event) => event.event_id !== id));
            Alert.alert('Успіх', 'Подію успішно видалено');
            setEditModalVisibleEvent(false);
          }
          })
          .catch((error) => console.error('Помилка видалення події:', error));
      };