import { StyleSheet, View, TouchableOpacity, Text} from 'react-native';
import { Dimensions } from 'react-native';
import { TouchableWithoutFeedback, Keyboard} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useState, useContext } from 'react';
import { BASE_URL } from '../config';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Dropdown } from 'react-native-element-dropdown';
import { useTranslation } from 'react-i18next';
import { generateFinancePDFReport, generateCertificatePDFReport } from '../utils/pdfUtils';
import { AuthContext } from '../AuthContext';
import { fetchFinanceReport } from '../screens/FinanseScreen/FinanceApi';
import { fetchCertificateReport } from '../screens/CertificateScreen/CertificateApi';

const { height, width } = Dimensions.get('window');


export default function ReportScreen() {

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const { t } = useTranslation();

  const { user } = useContext(AuthContext);
  const [isExpanded, setIsExpanded] = useState(false); 
  const [startDate, setStartDate] = useState(null); // Початкова дата
  const [endDate, setEndDate] = useState(null); // Кінцева дата
  const [showStartPicker, setShowStartPicker] = useState(false); // Відображення вибору початкової дати
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [payment_method, setPaymentMethod] = useState(null); 

  const [isExpanded1, setIsExpanded1] = useState(false);


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

  const toggleExpand = () => {
    if (isExpanded) {
    // Очищення значень при згортанні
    setStartDate(null);
    setEndDate(null);
    setPaymentMethod(null); // Повертаємо значення за замовчуванням
  }
  setIsExpanded(!isExpanded); // Перемикаємо стан
  };

  const toggleExpand1 = () => {
    if (isExpanded1) {
      // Очищення значень при згортанні
      setStartDate(null);
      setEndDate(null);
    }
    setIsExpanded1(!isExpanded1); // Перемикаємо стан
  };

  const handleDownloadReport = async () => {
    if (!payment_method) {
      Alert.alert(t('error'), t('select_payment_method'));
    return;
  }
    try {
      const records = await fetchFinanceReport(user.system_id, startDate, endDate, payment_method, t);
      if (!records || records.length === 0) {
      Alert.alert(t('info'), t('no_data_for_report'));
      return;
    }
      await generateFinancePDFReport(startDate, endDate, payment_method, records, t);
    } catch (e) {
      Alert.alert(t('error'), t('failed_to_generate_report'));
      console.error(e);
    }
  };

  const handleDownloadReport1 = async () => {
    try {
      const records = await fetchCertificateReport(user.system_id, startDate, endDate, t);
      if (!records || records.length === 0) {
        Alert.alert(t('info'), t('no_data_for_report'));
        return;
      }
      await generateCertificatePDFReport(startDate, endDate, records, t);
    } catch (e) {
      Alert.alert(t('error'), t('failed_to_generate_report'));
      console.error(e);
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
          {/* Заголовок */}
          <TouchableOpacity style={styles.header} onPress={toggleExpand}>
            <Text style={styles.headerText}>{t('financial_report')}</Text>
            <Text style={styles.triangle}>{isExpanded ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {/* Блок параметрів */}
          {isExpanded && (
            <View style={styles.parametersContainer}>
              <View style={styles.parametersContent}>
                <Text style={styles.parameterText}>{t('select_period')}:</Text>
                <View style={styles.datePicker}>
                  {/* Вибір початкової дати */}
                  <TouchableOpacity
                    onPress={() => setShowStartPicker(true)}
                    style={[styles.datePickerButton, { flex: 1, marginRight: 10 }]}
                  >
                    <Text style={styles.datePickerButtonText}>
                      {startDate ? `${t('from')}: ${formatDateToLocal(startDate)}` : `${t('date_from')}:`}
                    </Text>
                  </TouchableOpacity>
                  <DateTimePickerModal
                    isVisible={showStartPicker}
                    mode="date"
                    display="spinner"
                    date={startDate ? new Date(startDate) : new Date()}
                    onConfirm={(date) => {
                      const day = String(date.getDate()).padStart(2, '0');
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const year = date.getFullYear();
                      const formattedDate = `${year}-${month}-${day}`;
                      setStartDate(formattedDate);
                      setShowStartPicker(false);
                    }}
                    onCancel={() => setShowStartPicker(false)}
                  />

                  {/* Вибір кінцевої дати */}
                  <TouchableOpacity
                    onPress={() => setShowEndPicker(true)}
                    style={[styles.datePickerButton, { flex: 1 }]}
                  >
                    <Text style={styles.datePickerButtonText}>
                      {endDate ? `${t('to')}: ${formatDateToLocal(endDate)}` : `${t('date_to')}:`}
                    </Text>
                  </TouchableOpacity>
                  <DateTimePickerModal
                    isVisible={showEndPicker}
                    mode="date"
                    display="spinner"
                    date={endDate ? new Date(endDate) : new Date()}
                    onConfirm={(date) => {
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

                <Text style={styles.parameterText}>{t('select_account')}:</Text>

                <Dropdown
                  style={styles.dropdown}
                  data={[
                    { label: t("cash"), value: "cash" },
                    { label: t("card"), value: "card" },
                  ]}
                  labelField="label"
                  valueField="value"
                  placeholder={t("account")}
                  value={payment_method}
                  onChange={(item) => setPaymentMethod(item.value)}
                  placeholderStyle={styles.dropdownPlaceholder}
                  selectedTextStyle={styles.dropdownText}
                  itemTextStyle={styles.dropdownItemText}
                  />

                  <TouchableOpacity
                    style={[styles.saveButton, {marginHorizontal: 10}]}
                    onPress={handleDownloadReport}
                    disabled={!startDate || !endDate}
                  >
                    <Text style={styles.saveButtonText}>{t('get_report')}</Text>
                  </TouchableOpacity>
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.header} onPress={toggleExpand1}>
            <Text style={styles.headerText}>{t('certificates_report')}</Text>
            <Text style={styles.triangle}>{isExpanded1 ? '▲' : '▼'}</Text>
          </TouchableOpacity>

           {/* Блок параметрів */}
          {isExpanded1 && (
            <View style={styles.parametersContainer}>
              <View style={styles.parametersContent}>
                <Text style={styles.parameterText}>{t('select_period')}:</Text>
                <View style={styles.datePicker}>
                  {/* Вибір початкової дати */}
                  <TouchableOpacity
                    onPress={() => setShowStartPicker(true)}
                    style={[styles.datePickerButton, { flex: 1, marginRight: 10 }]}
                  >
                    <Text style={styles.datePickerButtonText}>
                      {startDate ? `${t('from')}: ${formatDateToLocal(startDate)}` : `${t('date_from')}:`}
                    </Text>
                  </TouchableOpacity>
                  <DateTimePickerModal
                    isVisible={showStartPicker}
                    mode="date"
                    display="spinner"
                    date={startDate ? new Date(startDate) : new Date()}
                    onConfirm={(date) => {
                      const day = String(date.getDate()).padStart(2, '0');
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const year = date.getFullYear();
                      const formattedDate = `${year}-${month}-${day}`;
                      setStartDate(formattedDate);
                      setShowStartPicker(false);
                    }}
                    onCancel={() => setShowStartPicker(false)}
                  />

                  {/* Вибір кінцевої дати */}
                  <TouchableOpacity
                    onPress={() => setShowEndPicker(true)}
                    style={[styles.datePickerButton, { flex: 1 }]}
                  >
                    <Text style={styles.datePickerButtonText}>
                      {endDate ? `${t('to')}: ${formatDateToLocal(endDate)}` : `${t('date_to')}:`}
                    </Text>
                  </TouchableOpacity>
                  <DateTimePickerModal
                    isVisible={showEndPicker}
                    mode="date"
                    display="spinner"
                    date={endDate ? new Date(endDate) : new Date()}
                    onConfirm={(date) => {
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
                    style={[styles.saveButton, {marginHorizontal: 10}]}
                    onPress={handleDownloadReport1}
                    disabled={!startDate || !endDate}
                  >
                    <Text style={styles.saveButtonText}>{t('get_report')}</Text>
                  </TouchableOpacity>
              </View>
            </View>
          )}

          

        </View>


        


           
    </View>
  </TouchableWithoutFeedback>

  );
}

const styles = StyleSheet.create({
  container: {
  flex: 1,
  backgroundColor: '#fff',
  alignItems: 'center',
  },
  box: {
    backgroundColor: "#fff",
    width: width * 0.9,
    height: height * 0.9, 
    borderRadius: 10,
    marginHorizontal: width * 0.03, 
    marginBottom: height * 0.03, 
    flex: 1, 
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10, 
    elevation: 30, 
  },
  header: {
    backgroundColor: 'orange',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 5,
    margin: 20,
  },
  headerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  triangle: {
    fontSize: 16,
    color: '#fff',
  },
  parametersContainer: {
    overflow: 'hidden',
    backgroundColor: '#f9f9f9',
    height: height * 0.3
  },
  parametersContent: {
    padding: 10,
  },
  parameterText: {
    fontSize: 14,
    marginVertical: 10,
    marginHorizontal: 10,
    color: '#333',
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 7,
    borderRadius: 0,
    backgroundColor: '#f9f9f9',
  },
  datePickerButtonText: {
    color: 'gray',
    fontSize: 12,
  },
  datePicker:{
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 0,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: 10,
    marginRight: 10,
    
  },
  dropdownPlaceholder: {
    fontSize: 12, // Зменшений шрифт для плейсхолдера
    color: "#999",
  },
  dropdownText: {
    fontSize: 12, // Зменшений шрифт для вибраного тексту
    color: "#333",
  },
  dropdownItemText: {
    fontSize: 12, // Зменшений шрифт для тексту елемента списку
    color: "#333",
  },
  saveButton: { 
      backgroundColor: "orange", 
      padding: 7, 
      borderRadius: 5, 
      alignItems: "center" ,
      marginTop:10,

    },
    saveButtonText: { 
      color: "#fff", 
      fontWeight: "bold",
      fontSize: 12,
    },

});