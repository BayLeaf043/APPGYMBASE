import { View, Text, TouchableOpacity, FlatList, Modal, TextInput} from 'react-native';
import { TouchableWithoutFeedback, Keyboard} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useState, useContext, useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../../AuthContext';
import styles from './HallsScreen.styles';
import { useTranslation } from 'react-i18next';
import { fetchHalls, addHall, deleteHall, editHall } from './HallsApi';


export default function HallsScreen() {

  const { t } = useTranslation();

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };
  const [halls, setHalls] = useState([]);
  const { user } = useContext(AuthContext);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newHall, setNewHall] = useState({ name: "", status: "active", system_id: user?.system_id });
  const [selectedHall, setSelectedHall] = useState(null);

  useFocusEffect(
    useCallback(() => {
      fetchHalls(user?.system_id, setHalls, t);
    }, [user])
  );

  const resetNewHall = () => {
    setNewHall({
      name: "", status: "active", system_id: user?.system_id
    });
  };

  const closeAddModal = () => {
    resetNewHall(); 
    setAddModalVisible(false); 
  };

  const openEditModal = (hall) => {
    setSelectedHall(hall);
    setEditModalVisible(true);
  };

  const handleAddHall = () => {
    addHall(newHall, halls, setHalls, resetNewHall, setAddModalVisible, t);
  };

  const handleDeleteHall = (hall_id) => {
    deleteHall(hall_id, halls, setHalls, t);
  };

  const handleEditHall = () => {
    editHall(selectedHall, halls, setHalls, setEditModalVisible, t);
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
        
        {/* Кнопка "Додати" */}
        <TouchableOpacity style={styles.addButton} onPress={() => setAddModalVisible(true)}>
          <Text style={styles.addButtonText}>+ {t('add')}</Text>
        </TouchableOpacity>

        <View style={styles.headerRow}>
          <Text style={[styles.headerText, { flex: 2 }]}>{t('title')}</Text>
          <Text style={[styles.headerText, { flex: 4, marginLeft:10 }]}>{t('status')}</Text>
        </View>

         {/* Список залів */}
        {halls.length === 0 ? (
         <View style={{ alignItems: 'center', marginTop: 20 }}>
          <Text style={{ fontSize: 16, color: 'gray' }}>{t('no_available_halls')}</Text>
         </View>
        ) : (
         <FlatList
          data={halls}
          keyExtractor={(item, index) => item.hall_id?.toString() || index.toString()}
          renderItem={({ item }) => (
            <View style={styles.hallItem}>
              <View style={[styles.hallTextContainer, { flex: 2, marginRight: 20 }]}>
                <Text style={styles.hallText}>{item.name}</Text>
              </View>

              <Text style={[styles.hallText, {flex: 2, marginRight: 10, color: item.status === "active" ? "green" : "red" }]}>{t(item.status)}</Text>
              
              <View style={styles.actionButtonsContainer}>
              <TouchableOpacity style={[styles.editButton, {marginRight: 10}]} onPress={() => openEditModal(item)}>
                <Text>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteHall(item.hall_id)}>
                <Text>🗑</Text>
              </TouchableOpacity>
            </View>
            </View>
          )}
        />
        )}
      
      </View>


      {/* Модальне вікно додавання */}
      <Modal visible={addModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{t('add_hall')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('hall_name')}
              value={newHall.name}
              onChangeText={(text) => setNewHall({ ...newHall, name: text })}
            />
            <TouchableOpacity style={styles.saveButton} onPress={handleAddHall}>
              <Text style={styles.saveButtonText}>{t('add')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={closeAddModal}>
              <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>


      {/* Модальне вікно редагування */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{t('edit_hall')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('hall_name')}
              value={selectedHall?.name}
              onChangeText={(text) => setSelectedHall({ ...selectedHall, name: text })}
            />
            <TouchableOpacity
                style={[styles.toggleButton, {backgroundColor: selectedHall?.status === "active" ? "green" : "red"}]}
                onPress={() =>
                  setSelectedHall({
                    ...selectedHall,
                    status: selectedHall.status === "active" ? "inactive" : "active",
                  })
                }
              >
              <Text style={styles.toggleButtonText}>{t(selectedHall?.status)}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleEditHall}>
              <Text style={styles.saveButtonText}>{t('save')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setEditModalVisible(false)}>
              <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
   
    </View>
  </TouchableWithoutFeedback>

  );
}

