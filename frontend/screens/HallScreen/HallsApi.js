import { BASE_URL } from '../../config';
import { Alert } from 'react-native';
import i18n from '../../i18n';


export const fetchHalls = (system_id, setHalls) => {
    if (system_id) {
      fetch(`${BASE_URL}/halls?system_id=${system_id}`, {
      method: 'GET',
      headers: {
        'Accept-Language': i18n.language,
      },
    })
        .then((response) => response.json())
        .then((data) => setHalls(data))
        .catch((error) => {
          console.error('Error fetching halls:', error);
        });
    } else {
      console.error('User system_id not found');
    }
  };


// Додавання залу
export const addHall = (newHall, halls, setHalls, resetNewHall, setAddModalVisible, t) => {
    fetch(`${BASE_URL}/halls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept-Language': i18n.language },
        body: JSON.stringify(newHall)
    })
      .then(response => response.json())
      .then(data => {
        if(data.error){
          Alert.alert(t('error'), data.error);
        }
        else{
          setHalls([...halls, data]);
          resetNewHall();
          setAddModalVisible(false);
          Alert.alert(t('success'), t('hall_added_successfully'));
        }
    })
    .catch(error => console.error('Error adding hall:', error));
};


// Видалення залу
export const deleteHall = (hall_id, halls, setHalls, t) => {
    fetch(`${BASE_URL}/halls/${hall_id}`, { method: 'DELETE', headers: { 'Accept-Language': i18n.language } })
      .then(() => {
        setHalls(halls.filter((hall) => hall.hall_id !== hall_id));
        Alert.alert(t('success'), t('hall_deleted_successfully'));
      })
      .catch(error => console.error('Error deleting hall:', error));
};


// редагування
export const editHall = (updatedHall, halls, setHalls, setEditModalVisible, t) => {
      fetch(`${BASE_URL}/halls/${updatedHall.hall_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept-Language': i18n.language },
        body: JSON.stringify(updatedHall)
      })
      .then((response) => response.json())
      .then((data) => {
        if(data.error){
          Alert.alert(t('error'), data.error);
        } else {
          setHalls(halls.map((hall) => (hall.hall_id === updatedHall.hall_id ? updatedHall : hall)));
          setEditModalVisible(false);
          Alert.alert(t('success'), t('hall_updated_successfully'));
        }
      })
      .catch(error => console.error('Error editing hall:', error));
 };