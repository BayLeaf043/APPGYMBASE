import { BASE_URL } from '../../config';
import { Alert } from 'react-native';
import i18n from '../../i18n';

export const fetchFinances = (system_id, setFinances) => {
    if (system_id) {
        fetch(`${BASE_URL}/finances?system_id=${system_id}`, {
            method: 'GET',
            headers: {
                'Accept-Language': i18n.language,
            },
        })  
        .then((response) => response.json())
        .then((data) => setFinances(data))
        .catch((error) => {
            console.error('Error loading transactions:', error);
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
            console.error('Error loading clients:', error);
        });
    } else {
        console.error('User system_id not found');
    }
};


export const fetchBalances = (system_id, setBalances) => {
    if (system_id) {
        fetch(`${BASE_URL}/finances/balance?system_id=${system_id}`, {
            method: 'GET',
            headers: {
                'Accept-Language': i18n.language,
            },
        }) 
        .then((response) => response.json())
        .then((data) => {
            const obj = {};
            data.forEach((item) => {
                obj[item.payment_method] = parseFloat(item.balance) || 0;
            });
            setBalances(obj);
        })
        .catch((error) => {
            console.error('Error loading balance:', error);
      });
  }
};


 export const addFinances = (newFinances, balances, finances, setFinances, fetchBalances, resetNewFinances, setAddModalVisibleFinances, t) => {

    if (newFinances.payment_method && newFinances.price < 0) {
        const method = newFinances.payment_method;
        const absAmount = Math.abs(newFinances.price);
        const currentBalance = balances[method] || 0;
        if (absAmount > currentBalance) {
            Alert.alert(
                t('Not_enough_funds'),
                t(`in "${t(method)}" insufficient_funds`)
            );
        return;
        }
    }
    fetch(`${BASE_URL}/finances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept-Language': i18n.language },
        body: JSON.stringify(newFinances)
    })
    .then(response => response.json())
    .then(data => {
        if(data.error){
            Alert.alert(t('error'), data.error);
        } else {
            setFinances([...finances, data]);
            fetchBalances();
            resetNewFinances();
            setAddModalVisibleFinances(false);
            Alert.alert(t('success'), t('transaction_added_successfully'));
          }
        })
    .catch((error) => console.error('Error adding transaction:', error));
};

