import { BASE_URL } from '../../config';
import { Alert } from 'react-native';
import i18n from '../../i18n';

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
        console.error('User system_id not found');
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
            setServices(
                data.filter((service) => service.status === "active"));
            })
            .catch((error) => {
                console.error('Error fetching services:', error);
            });
    } else {
        console.error('User system_id not found');
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
            }))
            );
        })
        .catch((error) => {
            console.error('Error fetching clients:', error);
        });
    } else {
        console.error('User system_id not found');
    }
};


export const addCertificate = (newCertificate, certificates, setCertificates, resetNewCertificate, setAddModalVisibleCertificate, t) => {
    const certificateData = {
        ...newCertificate, 
        used_sessions: 0, 
        status: "active", 
        comment: newCertificate.comment?.trim() || "-",
    };
    fetch(`${BASE_URL}/certificates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept-Language': i18n.language },
        body: JSON.stringify(certificateData)
    })
    .then(response => response.json())
    .then(data => {
        if(data.error){
            console.log('Error adding certificate:', data.error);
            Alert.alert(t('error'), data.error);
        } else {
            setCertificates([...certificates, data]);
            resetNewCertificate();
            setAddModalVisibleCertificate(false);
            Alert.alert(t('success'), t('certificate_added_successfully'));
        }
    })
    .catch((error) => console.error('Error adding certificate:', error));
};


export const deleteCertificate = (certificate_id, certificates, setCertificates, t) => {
    fetch(`${BASE_URL}/certificates/${certificate_id}`, { method: 'DELETE', headers: { 'Accept-Language': i18n.language } })
    .then((response) => response.json())
    .then((data) => {
        if(data.error){
            Alert.alert(t('error'), data.error);
        } else {
            setCertificates(certificates.filter((certificate) => certificate.certificate_id !== certificate_id));
            Alert.alert(t('success'), t('certificate_deleted_successfully'));
       }
    })
    .catch((error) => console.error('Error deleting certificate:', error));
};


export const editCertificate = (updatedCertificate, certificates, setCertificates, setEditModalVisibleCertificate, t) => {
    fetch(`${BASE_URL}/certificates/${updatedCertificate.certificate_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept-Language': i18n.language },
        body: JSON.stringify(updatedCertificate),
    })
    .then((response) => response.json())
    .then((data) => {
        if(data.error) {
            Alert.alert(t('error'), data.error);
        } else {
            setCertificates( certificates.map((certificate) => certificate.certificate_id === updatedCertificate.certificate_id ? data : certificate ));
            setEditModalVisibleCertificate(false);
            Alert.alert(t('success'), t('certificate_updated_successfully'));
        }    
    })
    .catch((error) => console.error('Error updating certificate:', error));
};

export const fetchCertificateReport = async (system_id, startDate, endDate, t) => {
    if (!system_id || !startDate || !endDate) {
        console.error('Missing required parameters for fetching certificate report');
        Alert.alert(t('error'), t('error_missing_parameters'));
        return [];
    }

    try {
        const response = await fetch(
            `${BASE_URL}/certificates/report?system_id=${system_id}&startDate=${startDate}&endDate=${endDate}`,
            {
                method: 'GET',
                headers: {
                    'Accept-Language': i18n.language,
                },
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            Alert.alert(t('error'), errorData.error || t('error_fetch_certificates_report_failed'));
            return [];
        }

        const data = await response.json();
        return data || [];
    } catch (error) {
        console.error('Error fetching certificate report:', error);
        Alert.alert(t('error'), t('error_fetch_certificates_report_failed'));
    }
};