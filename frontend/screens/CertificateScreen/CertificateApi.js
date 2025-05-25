import { BASE_URL } from '../../config';
import { Alert } from 'react-native';

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
            setServices(
                data.filter((service) => service.status === "Активний"));
            })
            .catch((error) => {
                console.error('Помилка завантаження послуг:', error);
                Alert.alert('Помилка', 'Не вдалося завантажити послуги');
            });
    } else {
        console.error('system_id користувача не знайдено');
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
            }))
            );
        })
        .catch((error) => {
            console.error('Помилка завантаження клієнтів:', error);
            Alert.alert('Помилка', 'Не вдалося завантажити клієнтів');
        });
    } else {
        console.error('system_id користувача не знайдено');
    }
};


export const addCertificate = (newCertificate, certificates, setCertificates, resetNewCertificate, setAddModalVisibleCertificate) => {
    const certificateData = {
        ...newCertificate, 
        used_sessions: 0, 
        status: "Активний", 
        comment: newCertificate.comment?.trim() || "-",
    };
    fetch(`${BASE_URL}/certificates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(certificateData)
    })
    .then(response => response.json())
    .then(data => {
        if(data.error){
            console.log('data:', data);
            Alert.alert('Помилка', data.error || 'Не вдалося додати сертифікат');
        } else {
            setCertificates([...certificates, data]);
            resetNewCertificate();
            setAddModalVisibleCertificate(false);
            Alert.alert('Успіх', 'Сертифікат успішно додано');
       }
    })
    .catch((error) => console.error('Помилка додавання клієнта:', error));
};


export const deleteCertificate = (certificate_id, certificates, setCertificates) => {
    fetch(`${BASE_URL}/certificates/${certificate_id}`, { method: 'DELETE' })
    .then((response) => response.json())
    .then((data) => {
        if(data.error){
            Alert.alert('Помилка', data.error);
        } else {
            setCertificates(certificates.filter((certificate) => certificate.certificate_id !== certificate_id));
            Alert.alert('Успіх', 'Сертифікат успішно видалено');
       }
    })
    .catch((error) => console.error('Помилка видалення сертифіката:', error));
};


export const editCertificate = (updatedCertificate, certificates, setCertificates, setEditModalVisibleCertificate) => {
    fetch(`${BASE_URL}/certificates/${updatedCertificate.certificate_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCertificate),
    })
    .then((response) => response.json())
    .then((data) => {
        if(data.error) {
            Alert.alert('Помилка', data.error || 'Не вдалося зберегти зміни');
        } else {
            setCertificates( certificates.map((certificate) => certificate.certificate_id === updatedCertificate.certificate_id ? data : certificate ));
            setEditModalVisibleCertificate(false);
            Alert.alert('Успіх', 'Сертифікат успішно оновлено');
        }    
    })
    .catch((error) => console.error('Помилка оновлення сертифіката:', error));
};