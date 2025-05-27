import { BASE_URL } from '../../config';
import { Alert } from 'react-native';
import i18n from '../../i18n';

export const fetchServices = (system_id, setServices) => {
    if (system_id) {
        fetch(`${BASE_URL}/services?system_id=${system_id}`, {
            method: 'GET',
            headers: {
                'Accept-Language': i18n.language,
            },
        }) 
        .then((response) => response.json())
        .then((data) => setServices(data))
        .catch((error) => {
            console.error('Error fetching services:', error);
        });
    } else {
        console.error('User system_id not found');
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
        .then((data) => {
            setCategories(
                data.filter((category) => category.status === "active")
            );
        })
        .catch((error) => {
            console.error('Error fetching categories:', error);
        });
    } else {
        console.error('User system_id not found');
    }
};


export const addService = (newService, services, setServices, resetNewService, setAddModalVisibleService, t) => {
    fetch(`${BASE_URL}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept-Language': i18n.language },
        body: JSON.stringify(newService)
    })
    .then(response => response.json())
    .then(data => {
        if(data.error){
            Alert.alert(t('error'), data.error);
        } else {
            setServices([...services, data]);
            resetNewService();
            setAddModalVisibleService(false);
            Alert.alert(t('success'), t('service_added_successfully'));
        }
    })
    .catch((error) => console.error('Error adding service:', error));
};


export const deleteService = (service_id, services, setServices, t) => {
    fetch(`${BASE_URL}/services/${service_id}`, { method: 'DELETE', headers: { 'Accept-Language': i18n.language } })
    .then((response) => response.json())
    .then((data) => {
        if(data.error){
            Alert.alert(t('error'), data.error);
        } else {
            setServices(services.filter((service) => service.service_id !== service_id));
            Alert.alert(t('success'), t('service_deleted_successfully'));
       }
    })
    .catch((error) => console.error('Error deleting service:', error));
};


export const editService = (updatedService, services, setServices, setEditModalVisibleService, t) => {
    fetch(`${BASE_URL}/services/${updatedService.service_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept-Language': i18n.language },
        body: JSON.stringify(updatedService),
    })
    .then((response) => response.json())
    .then((data) => {
        if(data.error) {
            Alert.alert(t('error'), data.error);
        } else {
            setServices( services.map((service) => service.service_id === updatedService.service_id ? data : service ));
            setEditModalVisibleService(false);
            Alert.alert(t('success'), t('service_updated_successfully'));
        }
    })
    .catch((error) => console.error('Error updating service:', error));
};
