import { BASE_URL } from '../../config';
import { Alert } from 'react-native';


export const fetchClients = (system_id, setClients) => {
    if (system_id) {
        fetch(`${BASE_URL}/clients?system_id=${system_id}`) 
        .then((response) => response.json())
        .then((data) => setClients(data))
        .catch((error) => {
            console.error('Помилка завантаження клієнтів:', error);
            Alert.alert('Помилка', 'Не вдалося завантажити клієнтів');
        });
    } else {
        console.error('system_id користувача не знайдено');
    }
};


export const fetchCertificates = (system_id, setCertificates) => {
      if (system_id) {
        fetch(`${BASE_URL}/certificates?system_id=${system_id}`) 
        .then((response) => response.json())
        .then((data) => setCertificates(data))
        .catch((error) => {
            console.error('Помилка завантаження сертифікатів:', error);
            Alert.alert('Помилка', 'Не вдалося завантажити сертифікати');
        });
    } else {
        console.error('system_id користувача не знайдено');
    }
};


export const fetchServices = (system_id, setServices) => {
    if (system_id) {
        fetch(`${BASE_URL}/services?system_id=${system_id}`)
        .then((response) => response.json())
        .then((data) => {
            setServices(data);
        })
        .catch((error) => {
            console.error('Помилка завантаження послуг:', error);
            Alert.alert('Помилка', 'Не вдалося завантажити послуги');
        });
    } else {
        console.error('system_id користувача не знайдено');
    }
};


export const addClient = (newClient, clients, setClients, resetNewClient, setAddModalVisibleClient) => {
    fetch(`${BASE_URL}/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient)
    })
    .then(response => response.json())
    .then(data => {
        if(data.error){
            console.log('data:', data);
            Alert.alert('Помилка', data.error || 'Не вдалося додати клієнта');
        } else {
            setClients([...clients, data]);
            resetNewClient();
            Alert.alert('Успіх', 'Клієнта успішно додано');
            setAddModalVisibleClient(false);
        }
    })
    .catch((error) => console.error('Помилка додавання клієнта:', error));
};


export const deleteClient = (client_id, clients, setClients) => {
    fetch(`${BASE_URL}/clients/${client_id}`, { method: 'DELETE' })
    .then((response) => response.json())
    .then((data) => {
        if(data.error){
            Alert.alert('Помилка', data.error);
        } else {
            setClients(clients.filter((client) => client.client_id !== client_id));
            Alert.alert('Успіх', 'Клієнта успішно видалено');
       }
    })
    .catch((error) => console.error('Помилка видалення клієнта:', error));
};


export const editClient = (updatedClient, clients, setClients, setEditModalVisibleClient) => {
    fetch(`${BASE_URL}/clients/${updatedClient.client_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedClient),
    })
    .then((response) => response.json())
    .then((data) => {
        if(data.error) {
            Alert.alert('Помилка', data.error || 'Не вдалося зберегти зміни');
        } else {
            setClients( clients.map((client) => client.client_id === updatedClient.client_id ? data : client ));
            setEditModalVisibleClient(false);
            Alert.alert('Успіх', 'Зміни успішно збережено');
        }    
    })
    .catch((error) => console.error('Помилка оновлення клієнта:', error));
};