import { BASE_URL } from '../../config';
import { Alert } from 'react-native';

export const fetchUsers = (system_id, setEmployees) => {
    if (system_id) {
        fetch(`${BASE_URL}/users?system_id=${system_id}`) 
        .then((response) => response.json())
        .then((data) => setEmployees(data))
        .catch((error) => {
            console.error('Помилка завантаження працівників:', error);
            Alert.alert('Помилка', 'Не вдалося завантажити працівників');
        });
    } else {
        console.error('system_id користувача не знайдено');
    }
};


export const addEmployee = (newEmployee, employees, setEmployees, resetNewEmployee, setAddModalVisibleEmployee) => {
    fetch(`${BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEmployee)
    })
    .then(response => response.json())
    .then(data => {
        if(data.error){
            console.log('data:', data);
            Alert.alert('Помилка', data.error || 'Не вдалося додати працівника');
        } else {
            setEmployees([...employees, data]);
            resetNewEmployee();
            setAddModalVisibleEmployee(false);
            Alert.alert('Успіх', 'Працівника успішно додано');
        }
    })
    .catch((error) => console.error('Помилка додавання працівника:', error));
};


export const deleteEmployee = (user_id, employees, setEmployees) => {
    fetch(`${BASE_URL}/users/${user_id}`, { method: 'DELETE' })
    .then((response) => response.json())
    .then((data) => {
        if(data.error){
            Alert.alert('Помилка', data.error);
        } else {
            setEmployees(employees.filter((employee) => employee.user_id !== user_id));
            Alert.alert('Успіх', 'Працівника успішно видалено');
        }
    })
    .catch((error) => console.error('Помилка видалення працівника:', error));
};


export const editEmployee = (updatedEmployee, employees, setEmployees, setEditModalVisibleEmployee) => {
    const { password, ...otherFields } = updatedEmployee;
    const payload = password ? { ...otherFields, password } : { ...otherFields };
    fetch(`${BASE_URL}/users/${updatedEmployee.user_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })
    .then((response) => response.json())
    .then((data) => {
        if(data.error) {
            Alert.alert('Помилка', data.error || 'Не вдалося зберегти зміни');
        } else {
            setEmployees( employees.map((employee) => employee.user_id === updatedEmployee.user_id ? data : employee ));
            setEditModalVisibleEmployee(false);
            Alert.alert('Успіх', 'Працівника успішно оновлено');
        }
    })
    .catch((error) => console.error('Помилка оновлення працівника:', error));
};