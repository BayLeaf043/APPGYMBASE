import { BASE_URL } from '../../config';
import { Alert } from 'react-native';

export const fetchHalls = (system_id, setHalls) => {
    if (system_id) {
      fetch(`${BASE_URL}/halls?system_id=${system_id}`)
        .then((response) => response.json())
        .then((data) => setHalls(data))
        .catch((error) => {
          console.error('Помилка:', error);
          Alert.alert('Помилка', 'Не вдалося завантажити зали');
        });
    } else {
      console.error('system_id користувача не знайдено');
    }
  };


// Додавання залу
export const addHall = (newHall, halls, setHalls, resetNewHall, setAddModalVisible) => {
    fetch(`${BASE_URL}/halls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newHall)
    })
      .then(response => response.json())
      .then(data => {
        if(data.error){
          Alert.alert('Помилка', data.error || 'Не вдалося додати зал');
        }
        else{
          setHalls([...halls, data]);
          resetNewHall();
          setAddModalVisible(false);
          Alert.alert('Успіх', 'Зал успішно додано');
        }
    })
    .catch(error => console.error('Помилка додавання:', error));
};


// Видалення залу
export const deleteHall = (hall_id, halls, setHalls) => {
    fetch(`${BASE_URL}/halls/${hall_id}`, { method: 'DELETE' })
      .then(() => {
        setHalls(halls.filter((hall) => hall.hall_id !== hall_id));
        Alert.alert('Успіх', 'Зал успішно видалено');
      })
      .catch(error => console.error('Помилка видалення:', error));
};


// редагування
export const editHall = (updatedHall, halls, setHalls, setEditModalVisible) => {
      fetch(`${BASE_URL}/halls/${updatedHall.hall_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedHall)
      })
      .then((response) => response.json())
      .then((data) => {
        if(data.error){
          Alert.alert('Помилка', data.error || 'Не вдалося зберегти зміни');
        } else {
          setHalls(halls.map((hall) => (hall.hall_id === updatedHall.hall_id ? updatedHall : hall)));
          setEditModalVisible(false);
          Alert.alert('Успіх', 'Зал успішно оновлено');
        }
      })
      .catch(error => console.error('Помилка редагування:', error));
 };