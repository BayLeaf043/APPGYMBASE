import { BASE_URL } from '../../config';
import { Alert } from 'react-native';
import i18n from '../../i18n';

export const fetchUsers = (system_id, setEmployees) => {
    if (system_id) {
        fetch(`${BASE_URL}/users?system_id=${system_id}`, {
            method: 'GET',
            headers: {
                'Accept-Language': i18n.language,
            },
        }) 
        .then((response) => response.json())
        .then((data) => setEmployees(data))
        .catch((error) => {
            console.error('error fetching employees:', error);
        });
    } else {
        console.error('system_id not found');
    }
};


export const addEmployee = (newEmployee, employees, setEmployees, resetNewEmployee, setAddModalVisibleEmployee, t) => {
    fetch(`${BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept-Language': i18n.language },
        body: JSON.stringify(newEmployee)
    })
    .then(response => response.json())
    .then(data => {
        if(data.error){
            Alert.alert(t('error'), data.error || t('failed_to_add_employee'));
        } else {
            setEmployees([...employees, data]);
            resetNewEmployee();
            setAddModalVisibleEmployee(false);
            Alert.alert(t('success'), t('employee_added_successfully'));
        }
    })
    .catch((error) => console.error('error adding employee:', error));
};


export const deleteEmployee = (user_id, employees, setEmployees, t) => {
    fetch(`${BASE_URL}/users/${user_id}`, { method: 'DELETE', headers: { 'Accept-Language': i18n.language } })
    .then((response) => response.json())
    .then((data) => {
        if(data.error){
            Alert.alert(t('error'), data.error);
        } else {
            setEmployees(employees.filter((employee) => employee.user_id !== user_id));
            Alert.alert(t('success'), t('employee_deleted_successfully'));
        }
    })
    .catch((error) => console.error('error deleting employee:', error));
};


export const editEmployee = (updatedEmployee, employees, setEmployees, setEditModalVisibleEmployee, t) => {
    const { password, ...otherFields } = updatedEmployee;
    const payload = password ? { ...otherFields, password } : { ...otherFields };
    fetch(`${BASE_URL}/users/${updatedEmployee.user_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept-Language': i18n.language },
        body: JSON.stringify(payload),
    })
    .then((response) => response.json())
    .then((data) => {
        if(data.error) {
            Alert.alert(t('error'), data.error);
        } else {
            setEmployees( employees.map((employee) => employee.user_id === updatedEmployee.user_id ? data : employee ));
            setEditModalVisibleEmployee(false);
            Alert.alert(t('success'), t('employee_updated_successfully'));
        }
    })
    .catch((error) => console.error('error updating employee:', error));
};