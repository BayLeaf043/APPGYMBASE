import { View, Text, TouchableOpacity, FlatList, Modal, TextInput} from 'react-native';
import { TouchableWithoutFeedback, Keyboard} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useState, useContext, useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../../AuthContext';
import styles from './HallsScreen.styles';
import { fetchHalls, addHall, deleteHall, editHall } from './HallsApi';


export default function HallsScreen() {

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };
  const [halls, setHalls] = useState([]);
  const { user } = useContext(AuthContext);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newHall, setNewHall] = useState({ name: "", status: "Активний", system_id: user?.system_id });
  const [selectedHall, setSelectedHall] = useState(null);

  useFocusEffect(
    useCallback(() => {
      fetchHalls(user?.system_id, setHalls);
    }, [user])
  );

  const resetNewHall = () => {
    setNewHall({
      name: "", status: "Активний", system_id: user?.system_id
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
    addHall(newHall, halls, setHalls, resetNewHall, setAddModalVisible);
  };

  const handleDeleteHall = (hall_id) => {
    deleteHall(hall_id, halls, setHalls);
  };

  const handleEditHall = () => {
    editHall(selectedHall, halls, setHalls, setEditModalVisible);
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
          <Text style={styles.addButtonText}>+ Додати</Text>
        </TouchableOpacity>

        <View style={styles.headerRow}>
          <Text style={[styles.headerText, { flex: 2 }]}>Назва</Text>
          <Text style={[styles.headerText, { flex: 4, marginLeft:10 }]}>Статус</Text>
        </View>

         {/* Список залів */}
        {halls.length === 0 ? (
         <View style={{ alignItems: 'center', marginTop: 20 }}>
          <Text style={{ fontSize: 16, color: 'gray' }}>Немає доступних залів</Text>
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

              <Text style={[styles.hallText, {flex: 2, marginRight: 10, color: item.status === "Активний" ? "green" : "red" }]}>{item.status}</Text>
              
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
            <Text style={styles.modalTitle}>Додати зал</Text>
            <TextInput
              style={styles.input}
              placeholder="Назва залу"
              value={newHall.name}
              onChangeText={(text) => setNewHall({ ...newHall, name: text })}
            />
            <TouchableOpacity style={styles.saveButton} onPress={handleAddHall}>
              <Text style={styles.saveButtonText}>Додати</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={closeAddModal}>
              <Text style={styles.cancelButtonText}>Скасувати</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>


      {/* Модальне вікно редагування */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Редагувати зал</Text>
            <TextInput
              style={styles.input}
              placeholder="Назва залу"
              value={selectedHall?.name}
              onChangeText={(text) => setSelectedHall({ ...selectedHall, name: text })}
            />
            <TouchableOpacity
                style={[styles.toggleButton, {backgroundColor: selectedHall?.status === "Активний" ? "green" : "red"}]}
                onPress={() =>
                  setSelectedHall({
                    ...selectedHall,
                    status: selectedHall.status === "Активний" ? "Неактивний" : "Активний",
                  })
                }
              >
              <Text style={styles.toggleButtonText}>{selectedHall?.status}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleEditHall}>
              <Text style={styles.saveButtonText}>Зберегти</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setEditModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Скасувати</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
   
    </View>
  </TouchableWithoutFeedback>

  );
}

