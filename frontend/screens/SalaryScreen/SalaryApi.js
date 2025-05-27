import { BASE_URL } from '../../config';
import i18n from '../../i18n';

export const fetchCategories = (system_id, setCategories) => {
        if (system_id) {
          fetch(`${BASE_URL}/categories?system_id=${system_id}`, {
            method: 'GET',
            headers: {
                'Accept-Language': i18n.language,
            },
        }) 
            .then((response) => response.json())
            .then((data) => setCategories(
              data.filter((category) => category.status === "active")))
            .catch((error) => console.error('Error fetching categories:', error));
          } else {
            console.error('system_id not found');
          }
    };

export const fetchEmployees = (system_id, setEmployees) => {
        if (system_id) {
          fetch(`${BASE_URL}/users?system_id=${system_id}`, {
            method: 'GET',
            headers: {
                'Accept-Language': i18n.language,
            },
        }) 
            .then((response) => response.json())
            .then((data) => {
              setEmployees(
                data.map((employee) => ({
                  ...employee,
                  fullName: `${employee.surname} ${employee.name}`,
                })).filter((employee) => employee.status === "active")
              );
            })
            .catch((error) => console.error('Error fetching employees:', error));
        } else {
          console.error('system_id not found');
        }
  };

export const fetchSalaryRecords = async (system_id, startDate, endDate, setSalaryRecords, setShowSalaries) => {
    if (!system_id || !startDate || !endDate) {
    console.error('Required parameters are missing');
    return;
  }
  try {
    const response = await fetch(
      `${BASE_URL}/salary?system_id=${system_id}&startDate=${startDate}&endDate=${endDate}`
    );
    if (!response.ok) {
      throw new Error('Error fetching salary records');
    }
    const data = await response.json();
    setSalaryRecords(data);
    setShowSalaries(true);
  } catch (error) {
    console.error('Error fetching salary records:', error);
    setShowSalaries(false);
  }
};

export const fetchSalaryReportRecords = async (user_id, startDate, endDate) => {
  const response = await fetch(
    `${BASE_URL}/salary/report?user_id=${user_id}&startDate=${startDate}&endDate=${endDate}`
  );
  if (!response.ok) throw new Error('Error fetching salary report');
  return await response.json();
};