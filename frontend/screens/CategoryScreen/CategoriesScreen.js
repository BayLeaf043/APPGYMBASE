import { View, Text, TouchableOpacity, FlatList, Modal, TextInput} from 'react-native';
import { TouchableWithoutFeedback, Keyboard} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useState, useContext, useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../../AuthContext';
import styles from './Categories.styles';
import { fetchCategories, addCategory, deleteCategory, editCategory } from './CategoryApi';

export default function CategoriesScreen() {

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const [categories, setCategories] = useState([]);
  const { user } = useContext(AuthContext);
  const [addModalVisibleCategory, setAddModalVisibleCategory] = useState(false);
  const [editModalVisibleCategory, setEditModalVisibleCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", status: "Активний", system_id: user?.system_id });
  const [selectedCategory, setSelectedCategory] = useState(null);

  useFocusEffect(
    useCallback(() => {
      fetchCategories(user?.system_id, setCategories);
    }, [user])
  );

  const resetNewCategory = () => {
    setNewCategory({
      name: "", status: "Активний", system_id: user?.system_id
    });
  };
  
  const closeAddModal = () => {
    resetNewCategory(); 
    setAddModalVisibleCategory(false); 
  };
   
  const openEditModalCategory = (category) => {
    setSelectedCategory(category);
    setEditModalVisibleCategory(true);
  };

  const handleAddCategory = () => {
    addCategory(newCategory, categories, setCategories, resetNewCategory, setAddModalVisibleCategory);
  };
  
  const handleDeleteCategory = (category_id) => {
    deleteCategory(category_id, categories, setCategories);
  };

  const handleEditCategory = () => {
    editCategory(selectedCategory, categories, setCategories, setEditModalVisibleCategory);
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
          
          <TouchableOpacity style={styles.addButton} onPress={() => setAddModalVisibleCategory(true)}>
            <Text style={styles.addButtonText}>+ Додати</Text>
          </TouchableOpacity> 
          
          <TouchableOpacity style={styles.headerRow}>
            <Text style={[styles.headerText, { flex: 2 }]}>Назва</Text>
            <Text style={[styles.headerText, { flex: 3, marginRight: 0 }]}>Статус</Text>
          </TouchableOpacity> 
  
          {/* Список категорій */}
          {categories.length === 0 ? (
                   <View style={{ alignItems: 'center', marginTop: 20 }}>
                    <Text style={{ fontSize: 16, color: 'gray' }}>Немає доступних категорій</Text>
                   </View>
                  ) : (
          <FlatList
            data={categories}
            keyExtractor={(item) => item.category_id}
            renderItem={({ item }) => (
            <View style={styles.categoryItem}>
              <View style={[styles.categoryTextContainer, { flex: 3, marginRight: 10 }]}>
                <Text style={styles.categoryText}>{item.name}</Text>
              </View>
              <Text style={[styles.categoryText, { flex:2, marginRight: 30, color: item.status === "Активний" ? "green" : "red" }]}>{item.status}</Text>
              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity style={[styles.editButton, {marginRight: 10}]} onPress={() => openEditModalCategory(item)}>
                  <Text>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteCategory(item.category_id)}>
                  <Text>🗑</Text>
                </TouchableOpacity>
              </View>
            </View>
            )}
          />
                  )}
        </View>
  
  
        {/* Модальне вікно додавання категорії */}
        <Modal visible={addModalVisibleCategory} transparent animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Додати категорію</Text>
              <TextInput
                style={styles.input}
                placeholder="Назва категорії"
                value={newCategory.name}
                onChangeText={(text) => setNewCategory({ ...newCategory, name: text })}
              />
              <TouchableOpacity style={styles.saveButton} onPress={handleAddCategory}>
                <Text style={styles.saveButtonText}>Додати</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={closeAddModal}>
                <Text style={styles.cancelButtonText}>Скасувати</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
  
  
        {/* Модальне вікно редагування категорій */}
        <Modal visible={editModalVisibleCategory} transparent animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Редагувати категорію</Text>
              <TextInput
                style={styles.input}
                placeholder="Назва категорії"
                value={selectedCategory?.name}
                onChangeText={(text) => setSelectedCategory({ ...selectedCategory, name: text })}
              />
              <TouchableOpacity
                style={[styles.toggleButton, {backgroundColor: selectedCategory?.status === "Активний" ? "green" : "red"}]}
                onPress={() =>
                  setSelectedCategory({
                    ...selectedCategory,
                    status: selectedCategory.status === "Активний" ? "Неактивний" : "Активний",
                  })
                }
              >
                <Text style={styles.toggleButtonText}>{selectedCategory?.status}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleEditCategory}>
                <Text style={styles.saveButtonText}>Зберегти</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setEditModalVisibleCategory(false)}>
                <Text style={styles.cancelButtonText}>Скасувати</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

    </View>
    </TouchableWithoutFeedback>
    );
  }
 