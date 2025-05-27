import { View, Text, TouchableOpacity, FlatList, Modal, TextInput} from 'react-native';
import { TouchableWithoutFeedback, Keyboard} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useState, useContext, useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../../AuthContext';
import styles from './Categories.styles';
import { fetchCategories, addCategory, deleteCategory, editCategory } from './CategoryApi';
import { useTranslation } from 'react-i18next';

export default function CategoriesScreen() {

  const { t } = useTranslation();

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const [categories, setCategories] = useState([]);
  const { user } = useContext(AuthContext);
  const [addModalVisibleCategory, setAddModalVisibleCategory] = useState(false);
  const [editModalVisibleCategory, setEditModalVisibleCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", status: "active", system_id: user?.system_id });
  const [selectedCategory, setSelectedCategory] = useState(null);

  useFocusEffect(
    useCallback(() => {
      fetchCategories(user?.system_id, setCategories);
    }, [user])
  );

  const resetNewCategory = () => {
    setNewCategory({
      name: "", status: "active", system_id: user?.system_id
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
    addCategory(newCategory, categories, setCategories, resetNewCategory, setAddModalVisibleCategory, t);
  };
  
  const handleDeleteCategory = (category_id) => {
    deleteCategory(category_id, categories, setCategories, t);
  };

  const handleEditCategory = () => {
    editCategory(selectedCategory, categories, setCategories, setEditModalVisibleCategory, t);
  };

  return (

    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      
      <View style={styles.container}>
        
        <View style={{ position: 'absolute', bottom: 0, width: '100%', height: '100%' }}>
          <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <Path d="M 100 0 L 0 0 L 100 40 Z" fill="orange" />
          </Svg>
        </View>
  
        <View style={styles.box}>
  
          {/* Кнопка "Додати" */}
          
          <TouchableOpacity style={styles.addButton} onPress={() => setAddModalVisibleCategory(true)}>
            <Text style={styles.addButtonText}>+ {t('add')}</Text>
          </TouchableOpacity> 
          
          <TouchableOpacity style={styles.headerRow}>
            <Text style={[styles.headerText, { flex: 2 }]}>{t('title')}</Text>
            <Text style={[styles.headerText, { flex: 3, marginRight: 0 }]}>{t('status')}</Text>
          </TouchableOpacity>
  
          {/* Список категорій */}
          {categories.length === 0 ? (
                   <View style={{ alignItems: 'center', marginTop: 20 }}>
                    <Text style={{ fontSize: 16, color: 'gray' }}>{t('no_categories_available')}</Text>
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
              <Text style={[styles.categoryText, { flex:2, marginRight: 30, color: item.status === "active" ? "green" : "red" }]}>{t(item.status)}</Text>
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
              <Text style={styles.modalTitle}>{t('add_category')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('name_category')}
                value={newCategory.name}
                onChangeText={(text) => setNewCategory({ ...newCategory, name: text })}
              />
              <TouchableOpacity style={styles.saveButton} onPress={handleAddCategory}>
                <Text style={styles.saveButtonText}>{t('add')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={closeAddModal}>
                <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
  
  
        {/* Модальне вікно редагування категорій */}
        <Modal visible={editModalVisibleCategory} transparent animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>{t('edit_category')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('name_category')}
                value={selectedCategory?.name}
                onChangeText={(text) => setSelectedCategory({ ...selectedCategory, name: text })}
              />
              <TouchableOpacity
                style={[styles.toggleButton, {backgroundColor: selectedCategory?.status === "active" ? "green" : "red"}]}
                onPress={() =>
                  setSelectedCategory({
                    ...selectedCategory,
                    status: selectedCategory.status === "active" ? "inactive" : "active",
                  })
                }
              >
                <Text style={styles.toggleButtonText}>{t(selectedCategory?.status)}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleEditCategory}>
                <Text style={styles.saveButtonText}>{t('save')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setEditModalVisibleCategory(false)}>
                <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

    </View>
    </TouchableWithoutFeedback>
    );
  }
 