import { BASE_URL } from '../../config';
import { Alert } from 'react-native';
import i18n from '../../i18n';



export const fetchEvents = (system_id, setEvents) => {
    if (system_id) {
      fetch(`${BASE_URL}/calendar?system_id=${system_id}`, {
            method: 'GET',
            headers: {
                'Accept-Language': i18n.language,
            },
        }) 
      .then((response) => response.json())
      .then((data) => {
        const formattedEvents = data.map((event) => {
          const start = new Date(`${event.event_date}T${event.start_time}`);
          const end = new Date(`${event.event_date}T${event.end_time}`);
          return {...event, start, end, };
        });
        setEvents(formattedEvents);
      })
      .catch((error) => console.error('Error fetching events:', error));
  } 
  };


export const fetchHalls = (system_id, setHalls) => {
          if (system_id) {
            fetch(`${BASE_URL}/halls?system_id=${system_id}`, {
            method: 'GET',
            headers: {
                'Accept-Language': i18n.language,
            },
        }) 
              .then((response) => response.json())
              .then((data) => setHalls(
                data.filter((hall) => hall.status === "active")
              ))
              .catch((error) => console.error('Error fetching halls:', error));
          } 
    };


export const fetchCategories = (system_id, setCategories) => {
        if (system_id) {
          fetch(`${BASE_URL}/categories?system_id=${system_id}`, {
            method: 'GET',
            headers: {
                'Accept-Language': i18n.language,
            },
        }) 
            .then((response) => response.json())
            .then((data) => setCategories(
              data.filter((category) => category.status === "active")))
            .catch((error) => console.error('Error fetching categories:', error));
          } 
    };


export const fetchEmployees = (system_id, setEmployees) => {
        if (system_id) {
          fetch(`${BASE_URL}/users?system_id=${system_id}`, {
            method: 'GET',
            headers: {
                'Accept-Language': i18n.language,
            },
        }) 
            .then((response) => response.json())
            .then((data) => {
              setEmployees(
                data.map((employee) => ({
                  ...employee,
                  fullName: `${employee.surname} ${employee.name}`,
                })).filter((employee) => employee.status === "active")
              );
            })
            .catch((error) => console.error('Error fetching employees:', error));
        }
  };


export const fetchClients = (system_id, setClients) => {
        if (system_id) {
          fetch(`${BASE_URL}/clients?system_id=${system_id}`, {
            method: 'GET',
            headers: {
                'Accept-Language': i18n.language,
            },
        }) 
            .then((response) => response.json())
            .then((data) => {
              setClients(
                data.map((client) => ({
                  ...client,
                  fullName: `${client.surname} ${client.name}`, 
                  })).filter((client) => client.status === "active")
                );
            })
            .catch((error) => console.error('Error fetching clients:', error));
        }
  };


  export const fetchClientCertificates = (system_id, client_id, setClientCertificates, selectedEvent) => {

  fetch(`${BASE_URL}/calendar/clients/${client_id}/certificates?category_id=${selectedEvent.category_id}`)
    .then((response) => response.json())
    .then((data) => {
      setClientCertificates((prevCertificates) => ({
        ...prevCertificates,
        [client_id]: data,
      }));
    })
    .catch((error) => console.error('Error fetching client certificates:', error));
};


  // Додавання події
 export const addEvent = (system_id, newEvent, events, setEvents, resetNewEvent, setAddModalVisibleEvent, fetchEvents, t) => {
  fetch(`${BASE_URL}/calendar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept-Language': i18n.language },
      body: JSON.stringify(newEvent)
    })
    .then(response => response.json())
    .then(data => {
      if(data.error){
        Alert.alert(t('error'), data.error);
      } else {
        setEvents([...events, {
            ...data,
            start: new Date(`${data.event_date}T${data.start_time}`),
            end: new Date(`${data.event_date}T${data.end_time}`),
          }]);
        resetNewEvent();
        setAddModalVisibleEvent(false);
        Alert.alert(t('success'), t('event_added_successfully'));
        fetchEvents(system_id, setEvents);
      }
    })
    .catch((error) => console.error('Error adding event:', error));
  };


  // Редагування події
  export const editEvent = (system_id, selectedEvent, events, setEvents, fetchEvents, setEditModalVisibleEvent, t) => {

      fetch(`${BASE_URL}/calendar/${selectedEvent.event_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept-Language': i18n.language },
        body: JSON.stringify(selectedEvent),
      })
        .then((response) => response.json())
        .then((data) => {
          if(data.error) {
            Alert.alert(t('error'), data.error);
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
        Alert.alert(t('success'), t('event_updated_successfully'));
      }
    })
    .catch((error) => console.error('Error updating event:', error));
};

// Видалення події
export const deleteEvent = (id, events, setEvents, setEditModalVisibleEvent, t) => {
  fetch(`${BASE_URL}/calendar/${id}`, { method: 'DELETE', headers: { 'Accept-Language': i18n.language } })
        .then((response) => response.json())
        .then((data) => {
          if(data.error){
            Alert.alert(t('error'), data.error);
          } else {
            setEvents(events.filter((event) => event.event_id !== id));
            Alert.alert(t('success'), t('event_deleted_successfully'));
            setEditModalVisibleEvent(false);
          }
          })
          .catch((error) => console.error('Error deleting event:', error));
      };