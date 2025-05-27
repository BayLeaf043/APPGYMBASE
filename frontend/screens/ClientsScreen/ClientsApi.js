import { BASE_URL } from '../../config';
import { Alert } from 'react-native';
import i18n from '../../i18n';


export const fetchClients = (system_id, setClients) => {
    if (system_id) {
        fetch(`${BASE_URL}/clients?system_id=${system_id}`, {
            method: 'GET',
            headers: {
                'Accept-Language': i18n.language,
            },
        })
        .then((response) => response.json())
        .then((data) => setClients(data))
        .catch((error) => {
            console.error('Error fetching clients:', error);
        });
    } else {
        console.error('system_id not found');
    }
};


export const fetchCertificates = (system_id, setCertificates) => {
      if (system_id) {
        fetch(`${BASE_URL}/certificates?system_id=${system_id}`, {
            method: 'GET',
            headers: {
                'Accept-Language': i18n.language, 
            },
        }) 
        .then((response) => response.json())
        .then((data) => setCertificates(data))
        .catch((error) => {
            console.error('Error fetching certificates:', error);
        });
    } else {
        console.error('system_id not found');
    }
};


export const fetchServices = (system_id, setServices) => {
    if (system_id) {
        fetch(`${BASE_URL}/services?system_id=${system_id}`, {
            method: 'GET',
            headers: {
                'Accept-Language': i18n.language, 
            },
        })
        .then((response) => response.json())
        .then((data) => {
            setServices(data);
        })
        .catch((error) => {
            console.error('Error fetching services:', error);
        });
    } else {
        console.error('system_id not found');
    }
};


export const addClient = (newClient, clients, setClients, resetNewClient, setAddModalVisibleClient, t) => {
    fetch(`${BASE_URL}/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept-Language': i18n.language },
        body: JSON.stringify(newClient)
    })
    .then(response => response.json())
    .then(data => {
        if(data.error){
            Alert.alert(t('error'), data.error);
        } else {
            setClients([...clients, data]);
            resetNewClient();
            Alert.alert(t('success'), t('client_added_successfully'));
            setAddModalVisibleClient(false);
        }
    })
    .catch((error) => console.error('Error adding client:', error));
};


export const deleteClient = (client_id, clients, setClients, t) => {
    fetch(`${BASE_URL}/clients/${client_id}`, { method: 'DELETE', headers: { 'Accept-Language': i18n.language } })
    .then((response) => response.json())
    .then((data) => {
        if(data.error){
            Alert.alert(t('error'), data.error);
        } else {
            setClients(clients.filter((client) => client.client_id !== client_id));
            Alert.alert(t('success'), t('client_deleted_successfully'));
       }
    })
    .catch((error) => console.error('Error deleting client:', error));
};


export const editClient = (updatedClient, clients, setClients, setEditModalVisibleClient, t) => {
    fetch(`${BASE_URL}/clients/${updatedClient.client_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept-Language': i18n.language },
        body: JSON.stringify(updatedClient),
    })
    .then((response) => response.json())
    .then((data) => {
        if(data.error) {
            Alert.alert(t('error'), data.error );
        } else {
            setClients( clients.map((client) => client.client_id === updatedClient.client_id ? data : client ));
            setEditModalVisibleClient(false);
            Alert.alert(t('success'), t('client_updated_successfully'));
        }    
    })
    .catch((error) => console.error('Error updating client:', error));
};