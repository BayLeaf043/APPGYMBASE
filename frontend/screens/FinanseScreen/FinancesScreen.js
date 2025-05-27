import { View, Text, TouchableOpacity, FlatList, Modal, TextInput} from 'react-native';
import { TouchableWithoutFeedback, Keyboard} from 'react-native';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Dropdown } from 'react-native-element-dropdown';
import Svg, { Path } from 'react-native-svg';
import { useState, useContext,  useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../../AuthContext';
import styles from './Finanse.style';
import { useTranslation } from 'react-i18next';
import { fetchFinances, fetchBalances, fetchClients, addFinances } from './FinanceApi';


export default function FinancesScreen() {

  const { t } = useTranslation();

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const formatDateTimeToLocal = (date) => {
    if (!date) return ""; 
    const d = new Date(date);
    if (isNaN(d.getTime())) return ""; 

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  };

  const { user } = useContext(AuthContext);
  const [clients, setClients] = useState([]);
  const [finances, setFinances] = useState([]);

  const [modalVisibleFinances, setModalVisibleFinances] = useState(false);
  const [addModalVisibleFinances, setAddModalVisibleFinances] = useState(false);
  const [newFinances, setNewFinances] = useState({ price: "", payment_method: "cash", comment: "", system_id: user?.system_id });
  const [selectedFinances, setSelectedFinances] = useState(null);

  const [selectedAccount, setSelectedAccount] = useState('All');
  const [selectedTransactionType, setSelectedTransactionType] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);

  const [balances, setBalances] = useState({});


  useFocusEffect(
    useCallback(() => {
      fetchFinances(user?.system_id, setFinances);
      fetchClients(user?.system_id, setClients);
      fetchBalances(user?.system_id, setBalances);
    }, [user])
  );

  const resetNewFinances = () => {
    setNewFinances({
      price: "",
      payment_method: "cash",
      comment: "",
      system_id: user?.system_id,
    });
  };

  const closeAddModal = () => {
    resetNewFinances(); 
    setAddModalVisibleFinances(false); 
  };

  const openModalFinances = (finance) => {
    setSelectedFinances(finance);
    setModalVisibleFinances(true);
  };

  const handleAddFinances = () => {
      addFinances(newFinances, balances, finances, setFinances, fetchBalances, resetNewFinances, setAddModalVisibleFinances,t);
    };

  const sortFinances = (finances) => {
    return [...finances].sort((a, b) => new Date(b.create_at) - new Date(a.create_at));
  };

  const filteredFinances = finances.filter((item) => {
    // Фільтр за рахунком
    if (selectedAccount !== 'All' && item.payment_method !== selectedAccount) {
      return false;
    }
    // Фільтр за типом транзакції
    if (selectedTransactionType !== 'All' && item.transaction_type !== selectedTransactionType) {
      return false;
    }
    // Фільтр за місяцем
    if (selectedMonth) {
      const itemDate = new Date(item.create_at);
      if (
        itemDate.getMonth() !== selectedMonth.getMonth() ||
        itemDate.getFullYear() !== selectedMonth.getFullYear()
      ) {
        return false;
      }
    }
    return true;
  });

  const calculateTotal = (transactions) => {
    return transactions.reduce((total, item) => total + (parseFloat(item.price) || 0), 0);
  };

 
  return (
  
  <TouchableWithoutFeedback onPress={dismissKeyboard}>
    
    <View style={styles.container}>
      
      <View style={{ position: 'absolute', bottom: 0, width: '100%', height: '100%'}}>
        <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <Path d="M 100 0 L 0 0 L 100 40 Z" fill="orange" />
        </Svg>
      </View>

      <View style={styles.box}>
      
        <TouchableOpacity style={styles.addButton} onPress={() => setAddModalVisibleFinances(true)}>
          <Text style={styles.addButtonText}>{t('expense')}</Text>
        </TouchableOpacity>

        <View style={styles.filtersContainer}>
  
          <Dropdown
            style={[styles.dropdown, {flex:1}, {marginRight: 10}]}
            data={[
              { label: t("all"), value: "All" },
              { label: t("cash"), value: "cash" },
              { label: t("card"), value: "card" },
           ]}
            labelField="label"
            valueField="value"
            placeholder={t("account")}
            value={selectedAccount}
            onChange={(item) => setSelectedAccount(item.value)}
            placeholderStyle={styles.dropdownPlaceholder}
            selectedTextStyle={styles.dropdownText}
            itemTextStyle={styles.dropdownItemText}
          />

          <Dropdown
            style={[styles.dropdown, {flex:1}]}
            data={[
              { label: t("all"), value: "All" },
              { label: t("income"), value: "income" },
              { label: t("expense"), value: "expense" },
            ]}
            labelField="label"
            valueField="value"
            placeholder={t("transaction_type")}
            value={selectedTransactionType}
            onChange={(item) => setSelectedTransactionType(item.value)}
            placeholderStyle={styles.dropdownPlaceholder}
            selectedTextStyle={styles.dropdownText}
            itemTextStyle={styles.dropdownItemText}
          />
          </View>

          <View style={styles.dateFilterContainer}>
            <TouchableOpacity style={[styles.datePickerButton, {flex: 1 }]} onPress={() => setDatePickerVisible(true)}>
              <Text style={styles.datePickerButtonText}>
                {selectedMonth
                  ? `${selectedMonth.getMonth() + 1}/${selectedMonth.getFullYear()}`
                  : t('select_month')}
              </Text>
            </TouchableOpacity>

            {selectedMonth && (
              <TouchableOpacity style={[styles.resetButton, {flex: 1, marginleft: 10}]} onPress={() => setSelectedMonth(null)}>
                <Text style={styles.resetButtonText}>{t('reset')}</Text>
              </TouchableOpacity>
            )}
 
          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="date"
            display="spinner"
            onConfirm={(date) => {
              setSelectedMonth(date);
              setDatePickerVisible(false);
           }}
            onCancel={() => setDatePickerVisible(false)}
           />
        </View>
      
        <TouchableOpacity style={styles.headerRow}>
          <Text style={[styles.headerText, { flex: 3, marginRight:10 }]}>{t('date')}</Text>
          <Text style={[styles.headerText, { flex: 2}]}>{t('amount')}</Text>
          <Text style={[styles.headerText, { flex: 2, marginRight:34}]}>{t('account')}</Text>
        </TouchableOpacity>
       
        {finances.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 20 }}>
            <Text style={{ fontSize: 16, color: 'gray' }}>{t('no_transactions')}</Text>
          </View>
          ) : (
          <FlatList
            data={sortFinances(filteredFinances)}
            keyExtractor={(item) => item.id_finances.toString()}
            renderItem={({ item }) => (
                    
            <View style={styles.financesItem}>
      
              <TouchableOpacity style={[styles.financesTextContainer, { flex: 3, marginRight: 20 }]} onPress={() => openModalFinances(item)}>
                <Text style={styles.financesText}>{formatDateTimeToLocal(item.create_at)}</Text>
              </TouchableOpacity>

              <Text style={[styles.financesText, { flex: 2, marginRight: 20, color:item.transaction_type === 'income' ? 'green' : 'red' }]}>{item.price} {t('currency')}</Text>
              <Text style={[styles.financesText, { flex: 2, marginRight: 10 }]}>{t(item.payment_method)}</Text>
    
            </View>
                  )}
                />
                 )}
                 <View style={styles.totalContainer}>
                    <Text style={styles.totalText}>
                      {t('total')}: {(calculateTotal(filteredFinances)).toFixed(2)} {t('currency')}
                    </Text>
                  </View>
        </View>

        


{/* Модальне вікно перегляду */}
      <Modal visible={modalVisibleFinances} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
          {selectedFinances && (
          <>
          <Text style={styles.modalTitle}>{t(selectedFinances.transaction_type)} {t('fromm')} {formatDateTimeToLocal(selectedFinances.create_at)}</Text>

          {selectedFinances.transaction_type === 'income' ? (
            <>
              <Text style={styles.modalText}>
                {t('client')}: {clients.find((client) => client.client_id === selectedFinances.client_id)?.fullName || "Невідомий клієнт"}
              </Text>
              <Text style={styles.modalText}>
                {t('amount')}: {" "}
                <Text style={{ color: "green" }}>{selectedFinances.price} {t('currency')}</Text>
              </Text>
              <Text style={styles.modalText}>
                {t('account')}: {t(selectedFinances.payment_method)}
              </Text>
              <Text style={styles.modalText}>
                {t('comment')}: {selectedFinances.comment || "-"}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.modalText}>
                {t('amount_expense')}: {" "}
                <Text style={{ color: "red" }}>{selectedFinances.price} {t('currency')}</Text>
              </Text>
              <Text style={styles.modalText}>
                {t('account')}: {t(selectedFinances.payment_method)}
              </Text>
              <Text style={styles.modalText}>
                {t('reason_expense')}: {selectedFinances.comment || "-"}
              </Text>
            </>
          )}
        </>
      )}
          <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisibleFinances(false)}>
            <Text style={styles.cancelButtonText}>{t('close')}</Text>
          </TouchableOpacity>
          </View>
        </View>
      </Modal>        


      {/* Модальне вікно для додавання сертифіката */}
      <Modal visible={addModalVisibleFinances} transparent animationType="slide" >
      
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{t('expense_funds')}</Text>

            <TextInput
              style={styles.input}
              placeholder={t('amount_expense')}
              value={newFinances.price}
              keyboardType="numeric"
              onChangeText={(text) => {
              const sanitizedText = text.replace(/-/g, '');
              if (!isNaN(sanitizedText) || sanitizedText === '') {
                setNewFinances({ ...newFinances, price: -parseInt(sanitizedText) || "" })
              }
             }}
            />

            <TouchableOpacity
              style={[styles.toggleButton, {backgroundColor: newFinances?.payment_method === "cash" ? "green" : "blue"}]}
              onPress={() =>
                setNewFinances({
                  ...newFinances,
                  payment_method: newFinances.payment_method === "cash" ? "card" : "cash",
              })
            }
            >
              <Text style={styles.toggleButtonText}>
                {t(newFinances.payment_method)}
              </Text>
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder={t('comment')}
              value={newFinances.comment || ""}
              onChangeText={(text) =>
              setNewFinances({ ...newFinances, comment: text })
              }
            />
          
            <TouchableOpacity style={styles.saveButton} onPress={handleAddFinances}>
              <Text style={styles.saveButtonText}>{t('save')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={closeAddModal}>
              <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
        
      </Modal>

           
    </View>
  </TouchableWithoutFeedback>

  );
}
