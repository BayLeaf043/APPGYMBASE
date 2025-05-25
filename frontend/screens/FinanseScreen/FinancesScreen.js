import { View, Text, TouchableOpacity, FlatList, Modal, TextInput} from 'react-native';
import { TouchableWithoutFeedback, Keyboard} from 'react-native';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Dropdown } from 'react-native-element-dropdown';
import Svg, { Path } from 'react-native-svg';
import { useState, useContext,  useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../../AuthContext';
import styles from './Finanse.style';
import { fetchFinances, fetchBalances, fetchClients, addFinances } from './FinanceApi';


export default function FinancesScreen() {

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
  const [newFinances, setNewFinances] = useState({ price: "", payment_method: "Готівка", comment: "", system_id: user?.system_id });
  const [selectedFinances, setSelectedFinances] = useState(null);

  const [selectedAccount, setSelectedAccount] = useState("Всі"); 
  const [selectedTransactionType, setSelectedTransactionType] = useState("Всі"); 
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
      payment_method: "Готівка",
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
      addFinances(newFinances, balances, finances, setFinances, fetchBalances, resetNewFinances, setAddModalVisibleFinances);
    };

  const sortFinances = (finances) => {
    return [...finances].sort((a, b) => new Date(b.create_at) - new Date(a.create_at));
  };

  const filteredFinances = finances.filter((item) => {
    // Фільтр за рахунком
    if (selectedAccount !== "Всі" && item.payment_method !== selectedAccount) {
      return false;
    }
    // Фільтр за типом транзакції
    if (selectedTransactionType !== "Всі" && item.transaction_type !== selectedTransactionType) {
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
          <Text style={styles.addButtonText}>Списання</Text>
        </TouchableOpacity>

        <View style={styles.filtersContainer}>
  
          <Dropdown
            style={[styles.dropdown, {flex:1}, {marginRight: 10}]}
            data={[
              { label: "Всі", value: "Всі" },
              { label: "Готівка", value: "Готівка" },
              { label: "Картка", value: "Картка" },
           ]}
            labelField="label"
            valueField="value"
            placeholder="Рахунок"
            value={selectedAccount}
            onChange={(item) => setSelectedAccount(item.value)}
            placeholderStyle={styles.dropdownPlaceholder}
            selectedTextStyle={styles.dropdownText}
            itemTextStyle={styles.dropdownItemText}
          />

          <Dropdown
            style={[styles.dropdown, {flex:1}]}
            data={[
              { label: "Всі", value: "Всі" },
              { label: "Надходження", value: "Надходження" },
              { label: "Списання", value: "Списання" },
            ]}
            labelField="label"
            valueField="value"
            placeholder="Тип транзакції"
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
                  : "Обрати місяць"}
              </Text>
            </TouchableOpacity>

            {selectedMonth && (
              <TouchableOpacity style={[styles.resetButton, {flex: 1, marginleft: 10}]} onPress={() => setSelectedMonth(null)}>
                <Text style={styles.resetButtonText}>Скинути</Text>
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
          <Text style={[styles.headerText, { flex: 3, marginRight:10 }]}>Дата</Text>
          <Text style={[styles.headerText, { flex: 2}]}>Сума</Text>
          <Text style={[styles.headerText, { flex: 2, marginRight:34}]}>Рахунок</Text>
        </TouchableOpacity>
       
        {finances.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 20 }}>
            <Text style={{ fontSize: 16, color: 'gray' }}>Немає доступних сертифікатів</Text>
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

              <Text style={[styles.financesText, { flex: 2, marginRight: 20, color:item.transaction_type === 'Надходження' ? 'green' : 'red' }]}>{item.price} грн</Text>
              <Text style={[styles.financesText, { flex: 2, marginRight: 10 }]}>{item.payment_method}</Text>
    
            </View>
                  )}
                />
                 )}
                 <View style={styles.totalContainer}>
                    <Text style={styles.totalText}>
                      Загальна сума: {(calculateTotal(filteredFinances)).toFixed(2)} грн
                    </Text>
                  </View>
        </View>

        


{/* Модальне вікно перегляду */}
      <Modal visible={modalVisibleFinances} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
          {selectedFinances && (
          <>
          <Text style={styles.modalTitle}>{selectedFinances.transaction_type} від {formatDateTimeToLocal(selectedFinances.create_at)}</Text>

          {selectedFinances.transaction_type === 'Надходження' ? (
            <>
              <Text style={styles.modalText}>
                Клієнт: {clients.find((client) => client.client_id === selectedFinances.client_id)?.fullName || "Невідомий клієнт"}
              </Text>
              <Text style={styles.modalText}>
                Сума: {" "}
                <Text style={{ color: "green" }}>{selectedFinances.price} грн</Text>
              </Text>
              <Text style={styles.modalText}>
                Рахунок: {selectedFinances.payment_method}
              </Text>
              <Text style={styles.modalText}>
                Коментар: {selectedFinances.comment || "Немає коментаря"}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.modalText}>
                Сума списання: {" "}
                <Text style={{ color: "red" }}>{selectedFinances.price} грн</Text>
              </Text>
              <Text style={styles.modalText}>
                Рахунок: {selectedFinances.payment_method}
              </Text>
              <Text style={styles.modalText}>
                Причина списання: {selectedFinances.comment || "Не вказано"}
              </Text>
            </>
          )}
        </>
      )}
          <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisibleFinances(false)}>
            <Text style={styles.cancelButtonText}>Закрити</Text>
          </TouchableOpacity>
          </View>
        </View>
      </Modal>        


      {/* Модальне вікно для додавання сертифіката */}
      <Modal visible={addModalVisibleFinances} transparent animationType="slide" >
      
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Списання коштів</Text>

            <TextInput
              style={styles.input}
              placeholder="Сума списання"
              value={newFinances.price}  
              keyboardType="numeric"
              onChangeText={(text) => {
                        
              if (!isNaN(text) || text === '') {
                setNewFinances({ ...newFinances, price: -parseInt(text) || "" })           
              }
             }}
            />

            <TouchableOpacity
              style={[styles.toggleButton, {backgroundColor: newFinances?.payment_method === "Готівка" ? "green" : "blue"}]}
              onPress={() =>
                setNewFinances({
                  ...newFinances,
                  payment_method: newFinances.payment_method === "Готівка" ? "Картка" : "Готівка",
              })
            }
            >
              <Text style={styles.toggleButtonText}>
                {newFinances.payment_method === "Готівка" ? "Готівка" : "Картка"}
              </Text>
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Коментар"
              value={newFinances.comment || ""}
              onChangeText={(text) =>
              setNewFinances({ ...newFinances, comment: text })
              }
            />
          
            <TouchableOpacity style={styles.saveButton} onPress={handleAddFinances}>
              <Text style={styles.saveButtonText}>Зберегти</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={closeAddModal}>
              <Text style={styles.cancelButtonText}>Скасувати</Text>
            </TouchableOpacity>
          </View>
        </View>
        
      </Modal>

           
    </View>
  </TouchableWithoutFeedback>

  );
}
