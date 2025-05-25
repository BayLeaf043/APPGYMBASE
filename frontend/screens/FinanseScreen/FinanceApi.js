import { BASE_URL } from '../../config';
import { Alert } from 'react-native';

export const fetchFinances = (system_id, setFinances) => {
    if (system_id) {
        fetch(`${BASE_URL}/finances?system_id=${system_id}`) 
        .then((response) => response.json())
        .then((data) => setFinances(data))
        .catch((error) => {
            console.error('Помилка завантаження транзакцій:', error);
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


export const fetchBalances = (system_id, setBalances) => {
    if (system_id) {
        fetch(`${BASE_URL}/finances/balance?system_id=${system_id}`)
        .then((response) => response.json())
        .then((data) => {
            const obj = {};
            data.forEach((item) => {
                obj[item.payment_method] = parseFloat(item.balance) || 0;
            });
            setBalances(obj);
        })
        .catch((error) => {
            console.error('Помилка завантаження балансу:', error);
            Alert.alert('Помилка', 'Не вдалося завантажити баланс');
      });
  }
};


 export const addFinances = (newFinances, balances, finances, setFinances, fetchBalances, resetNewFinances, setAddModalVisibleFinances) => {

    if (newFinances.payment_method && newFinances.price < 0) {
        const method = newFinances.payment_method;
        const absAmount = Math.abs(newFinances.price);
        const currentBalance = balances[method] || 0;
        if (absAmount > currentBalance) {
            Alert.alert(
                'Недостатньо коштів',
                `На рахунку "${method}" недостатньо коштів для списання!`
            );
        return;
        }
    }
    fetch(`${BASE_URL}/finances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFinances)
    })
    .then(response => response.json())
    .then(data => {
        if(data.error){
            console.log('data:', data);
            Alert.alert('Помилка', data.error || 'Не вдалося додати транзакцію');
        } else {
            setFinances([...finances, data]);
            fetchBalances();
            resetNewFinances();
            setAddModalVisibleFinances(false);
            Alert.alert('Успіх', 'Транзакцію успішно додано');
          }
        })
    .catch((error) => console.error('Помилка додавання транзакції:', error));
};

