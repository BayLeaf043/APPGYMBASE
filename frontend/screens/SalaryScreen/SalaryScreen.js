import { View, Text, TouchableOpacity, FlatList, Modal, TextInput } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { TouchableWithoutFeedback, Keyboard } from 'react-native';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import Svg, { Path } from 'react-native-svg';
import { useState, useContext, useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { BASE_URL } from '../../config';
import { AuthContext } from '../../AuthContext';
import { Alert } from 'react-native';
import styles from './Salary.style';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { fetchCategories, fetchEmployees, fetchSalaryRecords, fetchSalaryReportRecords} from './SalaryApi';


export default function SalaryScreen() {

  const { t } = useTranslation();

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };


  const formatDateToLocal = (date) => {
    if (!date) return ""; 
    const d = new Date(date);
    if (isNaN(d.getTime())) return ""; 
    const localDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    const day = String(localDate.getDate()).padStart(2, '0');
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const year = localDate.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const formatTimeToLocal = (time) => {
    if (!time || typeof time !== 'string') return '';
  const [hours, minutes] = time.split(':');
  return `${hours}:${minutes}`;
  };

  const formatDateToDisplay = (date) => {
    if (!date) return "";
    const [year, month, day] = date.split("-");
    return `${day}.${month}.${year}`;
  };

  const { user } = useContext(AuthContext);
  const [editModalVisiblePayment, setEditModalVisiblePayment] = useState(false);
  const [categories, setCategories] = useState([]);
  const [editedCategories, setEditedCategories] = useState([]);

  const [employees, setEmployees] = useState([]);
  const [salaryRecords, setSalaryRecords] = useState([]);
  const [showSalaries, setShowSalaries] = useState(false);
  const [employeeSalaries, setEmployeeSalaries] = useState([]);

  // Дати фільтрації
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useFocusEffect(
      useCallback(() => {
        fetchCategories(user?.system_id, setCategories);
        fetchEmployees(user?.system_id, setEmployees);
      }, [user])
  );

  const handleShowSalaries = async () => {
  if (!startDate || !endDate) {
    Alert.alert(t('error'), t('select_both_dates'));
    return;
  }
  if (startDate > endDate) {
    Alert.alert(t('error'), t('start_date_must_be_before_end_date'));
    return;
  }
  try {
    setShowSalaries(false);
    setEmployeeSalaries([]);
    // 1. Завантажуємо записи зарплат і отримуємо їх напряму
    const response = await fetch(
      `${BASE_URL}/salary?system_id=${user.system_id}&startDate=${startDate}&endDate=${endDate}`
    );
    if (!response.ok) throw new Error();
    const salaryData = await response.json();
    setSalaryRecords(salaryData);

    // 2. Завантажуємо працівників
    fetchEmployees(user.system_id, (empList) => {
      // 3. Групуємо суми по user_id
      const salarySumByUser = {};
      salaryData.forEach(rec => {
        if (!salarySumByUser[rec.user_id]) salarySumByUser[rec.user_id] = 0;
        salarySumByUser[rec.user_id] += Number(rec.payment_amount);
      });
      // 4. Формуємо масив для відображення
      const result = empList.map(emp => ({
        ...emp,
        totalSalary: salarySumByUser[emp.user_id] || 0
      })).filter(emp => emp.totalSalary > 0);
      setEmployeeSalaries(result);
      setShowSalaries(true);
    });
  } catch (e) {
    Alert.alert(t('error'), t('failed_to_load_data'));
  }
};

  const resetFilter = () => {
    setStartDate(null);
    setEndDate(null);
    setSalaryRecords([]);
    setEmployeeSalaries([]);
    setShowSalaries(false);
  };

  const openEditModal = () => {
    fetchCategories(user?.system_id, setCategories);
    setEditedCategories(categories.map(cat => ({ ...cat })));
    setEditModalVisiblePayment(true);
  };

  const handleInputChange = (value, category_id) => {
    setEditedCategories(prev =>
      prev.map(cat =>
        cat.category_id === category_id
          ? { ...cat, payment_percentage: value.replace(',', '.') }
          : cat
      )
    );
  };

  const handleSave = async () => {
  // Масив промісів для всіх оновлень
  const updatePromises = editedCategories.map(cat => {
    const percent = Math.max(0, Math.min(1, parseFloat(cat.payment_percentage) || 0));
    return fetch(`${BASE_URL}/categories/${cat.category_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Accept-Language': i18n.language },
      body: JSON.stringify({ ...cat, payment_percentage: percent })
    })
    .then(res => res.json());
  });

  try {
    const results = await Promise.all(updatePromises);
    // Оновлюємо категорії у стані
    fetchCategories(user?.system_id, setCategories);
    setEditModalVisiblePayment(false);

    // Перевіряємо чи були помилки
    const hasError = results.some(r => r.error);
    if (hasError) {
      Alert.alert(t('error'), t('failed_to_update_categories'));
    } else {
      Alert.alert(t('success'), t('all_categories_updated_successfully'));
    }
  } catch (e) {
    Alert.alert(t('error'), t('failed_to_update_categories'));
  }
};

const pad = (str, len) => String(str).padEnd(len, ' ');
const padNum = (num, len) => String(Number(num).toFixed(2)).padStart(len, ' ');

const handleDownloadReport = async (employee) => {

  try {
    // 1. Завантажити всі записи для цього тренера за період
    const records = await fetchSalaryReportRecords(employee.user_id, startDate, endDate);

    let content = `************ Розрахунок заробітної плати ************\n`;
    content += `Період: ${formatDateToLocal(startDate)} - ${formatDateToLocal(endDate)}\n`;
    content += `Тренер: ${employee.fullName}\n\n`;

    // Визначаємо ширину стовпців
    const colWidths = {
      event: 8,
      eventName: 18,
      date: 10,
      time: 11,
      client: 20,
      cert: 10,
      service: 35, // більше місця для послуги
      sum: 10,
    };

    // Шапка таблиці
    content += '-'.repeat(120) + '\n';
    content += `|${pad('Подія #', colWidths.event)}|${pad('Назва події', colWidths.eventName)}|${pad('Дата', colWidths.date)}|${pad('Час', colWidths.time)}|${pad('Клієнт', colWidths.client)}|${pad('Сертифікат', colWidths.cert)}|${pad('Послуга', colWidths.service)}|${pad('Сума, грн', colWidths.sum)}|\n`;
    content += '-'.repeat(140) + '\n';

    let total = 0;
    let lastEventId = null;

    for (const rec of records) {
      if (rec.event_id !== lastEventId) {
        content += `\n${'*'.repeat(5)} Подія #${rec.event_id} - ${rec.event_name} ${'*'.repeat(5)}\n\n`;
        lastEventId = rec.event_id;
      }
      content += `|${pad(rec.event_id, colWidths.event)}`
  + `|${pad(rec.event_name, colWidths.eventName)}`
  + `|${pad(formatDateToLocal(rec.event_date), colWidths.date)}`
  + `|${pad(formatTimeToLocal(rec.start_time) + '-' + formatTimeToLocal(rec.end_time), colWidths.time)}`
  + `|${pad(rec.client_surname + ' ' + rec.client_name, colWidths.client)}`
  + `|${pad('#' + rec.certificate_id, colWidths.cert)}`
  + `|${pad(rec.service_name, colWidths.service)}`
  + `|${padNum(rec.payment_amount, colWidths.sum)}|\n`;
      total += Number(rec.payment_amount);
    }
    content += '-'.repeat(120) + '\n';
    content += `Загальна сума: ${total.toFixed(2)} грн\n`;

    const fileName = `Звіт_${employee.fullName.replace(/\s/g, '_')}.txt`;
    const fileUri = FileSystem.cacheDirectory + fileName;

    await FileSystem.writeAsStringAsync(fileUri, content, { encoding: FileSystem.EncodingType.UTF8 });

    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/plain',
      dialogTitle: 'Поділитися звітом',
      UTI: 'public.text',
    });
  } catch (e) {
    Alert.alert(t('error'), t('failed_to_generate_or_share_report'));
  }
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

        <TouchableOpacity style={styles.addButton} onPress={openEditModal}>
          <Text style={styles.addButtonText}>{t('edit_payment_allocations')}</Text>
        </TouchableOpacity>

       

        <View style={styles.datePicker}>
        <TouchableOpacity onPress={() => setShowStartPicker(true)} style={[styles.datePickerButton, { flex: 1, marginRight: 10 }]}>
            <Text style={styles.datePickerButtonText}>
              {formatDateToLocal(startDate) ? `${t('from')}: ${formatDateToLocal(startDate)}` : `${t('date_from')}:`}
            </Text>
          </TouchableOpacity>
          <DateTimePickerModal
            isVisible={showStartPicker}
            mode="date"
            display="spinner"
            date={startDate ? new Date(startDate) : new Date()} 
            onConfirm={date => {
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                const formattedDate = `${year}-${month}-${day}`;
                setStartDate(formattedDate);
                setShowStartPicker(false);
              
            }} 
            onCancel={() => setShowStartPicker(false)}
           
          />

          <TouchableOpacity onPress={() => setShowEndPicker(true)} style={[styles.datePickerButton, { flex: 1 }]}>
            <Text style={styles.datePickerButtonText}>
              {formatDateToLocal(endDate) ? `${t('to')}: ${formatDateToLocal(endDate)}` : `${t('date_to')}:`}
            </Text>
          </TouchableOpacity>
          <DateTimePickerModal
            isVisible={showEndPicker}
            mode="date"
            display="spinner"
            date={endDate ? new Date(endDate) : new Date()} 
            onConfirm={date => {
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                const formattedDate = `${year}-${month}-${day}`;
                setEndDate(formattedDate);
                setShowEndPicker(false);
              }}
              onCancel={() => setShowEndPicker(false)}

          />
         </View>

          <TouchableOpacity
              style={[styles.saveButton, {marginHorizontal: 20}]}
              onPress={handleShowSalaries}
              disabled={!startDate || !endDate}
            >
              <Text style={styles.saveButtonText}>{t('show')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.resetButton, {marginHorizontal: 20}]}
              onPress={resetFilter}
            >
              <Text style={styles.resetButtonText}>{t('reset')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.headerRow}>
              <Text style={[styles.headerText, { flex: 3, marginRight: 5 }]}>{t('employee')}</Text>
              <Text style={[styles.headerText, { flex: 5,  }]}>{t('salary')}</Text>

            </TouchableOpacity>
          
      
{showSalaries && (
  <View style>
    <FlatList
      data={employeeSalaries}
      keyExtractor={item => item.user_id.toString()}
      renderItem={({ item }) => (
        <View style={styles.financesItem}>
          <Text style={[styles.financesText, { flex: 4,  }]}>{item.fullName}</Text>
          <Text style={[styles.financesText, { flex: 3, marginRight: 30 }]}>{item.totalSalary.toFixed(2)} {t('currency')}</Text>
          <TouchableOpacity style={[styles.editButton]}>
            <Text style={[styles.financesText, {flex: 2, fontSize:14}]} onPress={() => handleDownloadReport(item)}>📄</Text>
          </TouchableOpacity>
        </View>
      )}

      ListEmptyComponent= {
      <View style={{ alignItems: 'center', marginTop: 20 }}>
            <Text style={{ fontSize: 14, color: 'gray' }}>{t('no_data_available')}</Text>
          </View>
    }
      
    />
  </View>
)}
</View>

      <Modal visible={editModalVisiblePayment} transparent animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>{t('payment_allocations_percentage')}</Text>
              <FlatList
                data={editedCategories}
                keyExtractor={item => item.category_id.toString()}
                renderItem={({ item }) => (
                  <View style={styles.categoryItem}>
                    <View style={styles.categoryTextContainer}>
                      <Text style={styles.categoryText}>{item.name}</Text>
                      <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={item.payment_percentage !== undefined ? String(item.payment_percentage) : '0'}
                        onChangeText={value => handleInputChange(value, item.category_id)}
                        placeholder="0.0"
                      />
                    </View>
                  </View>
                )}
              />
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>{t('save')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditModalVisiblePayment(false)}
              >
                <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

           
    </View>
  </TouchableWithoutFeedback>

  );
}
