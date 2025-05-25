import { BASE_URL } from '../../config';
import { Alert } from 'react-native';

export const fetchCategories = (system_id, setCategories) => {
        if (system_id) {
          fetch(`${BASE_URL}/categories?system_id=${system_id}`)
            .then((response) => response.json())
            .then((data) => setCategories(
              data.filter((category) => category.status === "Активний")))
            .catch((error) => console.error('Помилка завантаження категорій:', error));
          } else {
            console.error('system_id categories користувача не знайдено');
          }
    };

export const fetchEmployees = (system_id, setEmployees) => {
        if (system_id) {
          fetch(`${BASE_URL}/users?system_id=${system_id}`)
            .then((response) => response.json())
            .then((data) => {
              setEmployees(
                data.map((employee) => ({
                  ...employee,
                  fullName: `${employee.surname} ${employee.name}`,
                })).filter((employee) => employee.status === "Активний")
              );
            })
            .catch((error) => console.error('Помилка завантаження співробітників:', error));
        } else {
          console.error('system_id employees користувача не знайдено');
        }
  };

export const fetchSalaryRecords = async (system_id, startDate, endDate, setSalaryRecords, setShowSalaries) => {
    if (!system_id || !startDate || !endDate) {
    console.error('Необхідні параметри відсутні');
    return;
  }
  try {
    const response = await fetch(
      `${BASE_URL}/salary?system_id=${system_id}&startDate=${startDate}&endDate=${endDate}`
    );
    if (!response.ok) {
      throw new Error('Помилка завантаження зарплатних записів');
    }
    const data = await response.json();
    setSalaryRecords(data);
    setShowSalaries(true);
  } catch (error) {
    console.error('Помилка завантаження зарплатних записів:', error);
    setShowSalaries(false);
    Alert.alert('Помилка', 'Не вдалося завантажити зарплатні записи');
  }
};

export const fetchSalaryReportRecords = async (user_id, startDate, endDate) => {
  const response = await fetch(
    `${BASE_URL}/salary/report?user_id=${user_id}&startDate=${startDate}&endDate=${endDate}`
  );
  if (!response.ok) throw new Error('Помилка завантаження звіту');
  return await response.json();
};