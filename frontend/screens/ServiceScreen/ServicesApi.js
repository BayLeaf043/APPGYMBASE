import { BASE_URL } from '../../config';
import { Alert } from 'react-native';

export const fetchServices = (system_id, setServices) => {
    if (system_id) {
        fetch(`${BASE_URL}/services?system_id=${system_id}`) 
        .then((response) => response.json())
        .then((data) => setServices(data))
        .catch((error) => {
            console.error('Помилка завантаження послуг:', error);
            Alert.alert('Помилка', 'Не вдалося завантажити послуги');
        });
    } else {
        console.error('system_id користувача не знайдено');
    }
};


export const fetchCategories = (system_id, setCategories) => {
    if (system_id) {
        fetch(`${BASE_URL}/categories?system_id=${system_id}`)
        .then((response) => response.json())
        .then((data) => {
            setCategories(
                data.filter((category) => category.status === "Активний")
            );
        })
        .catch((error) => {
            console.error('Помилка завантаження категорій:', error);
            Alert.alert('Помилка', 'Не вдалося завантажити категорії');
        });
    } else {
        console.error('system_id користувача не знайдено');
    }
};


export const addService = (newService, services, setServices, resetNewService, setAddModalVisibleService) => {
    fetch(`${BASE_URL}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newService)
    })
    .then(response => response.json())
    .then(data => {
        if(data.error){
            console.log('data:', data);
            Alert.alert('Помилка', data.error || 'Не вдалося додати послугу');
        } else {
            setServices([...services, data]);
            resetNewService();
            setAddModalVisibleService(false);
            Alert.alert('Успіх', 'Послугу успішно додано');
        }
    })
    .catch((error) => console.error('Помилка додавання послуги:', error));
};


export const deleteService = (service_id, services, setServices) => {
    fetch(`${BASE_URL}/services/${service_id}`, { method: 'DELETE' })
    .then((response) => response.json())
    .then((data) => {
        if(data.error){
            Alert.alert('Помилка', data.error);
        } else {
            setServices(services.filter((service) => service.service_id !== service_id));
            Alert.alert('Успіх', 'Послугу успішно видалено');
       }
    })
    .catch((error) => console.error('Помилка видалення послуги:', error));
};


export const editService = (updatedService, services, setServices, setEditModalVisibleService) => {
    fetch(`${BASE_URL}/services/${updatedService.service_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedService),
    })
    .then((response) => response.json())
    .then((data) => {
        if(data.error) {
            Alert.alert('Помилка', data.error || 'Не вдалося зберегти зміни');
        } else {
            setServices( services.map((service) => service.service_id === updatedService.service_id ? data : service ));
            setEditModalVisibleService(false);
            Alert.alert('Успіх', 'Послугу успішно оновлено');
        }
    })
    .catch((error) => console.error('Помилка оновлення послуги:', error));
};
