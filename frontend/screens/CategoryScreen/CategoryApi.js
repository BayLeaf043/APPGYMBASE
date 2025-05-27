import { BASE_URL } from '../../config';
import { Alert } from 'react-native';
import i18n from '../../i18n';

export const fetchCategories = (system_id, setCategories) => {
    if (system_id) {
        fetch(`${BASE_URL}/categories?system_id=${system_id}`, {
            method: 'GET',
            headers: {
                'Accept-Language': i18n.language, // Передаємо мову
            },
        })
            .then((response) => response.json())
            .then((data) => setCategories(data))
            .catch((error) => {
                console.error('Error:', error);
            });
    } else {
        console.error('User system_id not found');
    }
};

export const addCategory = (newCategory, categories, setCategories, resetNewCategory, setAddModalVisibleCategory, t) => {
    fetch(`${BASE_URL}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept-Language': i18n.language },
        body: JSON.stringify(newCategory)
    })
    .then(response => response.json())
    .then(data => {
        if(data.error){
        Alert.alert(t('error'), data.error);
        } else {
            setCategories([...categories, data]);
            resetNewCategory();
            setAddModalVisibleCategory(false);
            Alert.alert(t('success'), t('category_added_successfully'));
        }
    })
    .catch(error => console.error('Error adding category:', error));
};


export const deleteCategory = (category_id, categories, setCategories, t) => {
    fetch(`${BASE_URL}/categories/${category_id}`, { method: 'DELETE', headers: { 'Accept-Language': i18n.language } })
    .then((response) => response.json())
    .then((data) => {
        if (data.error) {
            Alert.alert(t('error'), data.error);
        } else {
            setCategories(categories.filter((category) => category.category_id !== category_id));
            Alert.alert(t('success'), t('category_deleted_successfully'));
        }
    })
    .catch((error) => console.error('Error deleting category:', error));
};
  

export const editCategory = (updatedCategory, categories, setCategories, setEditModalVisibleCategory, t) => {
    fetch(`${BASE_URL}/categories/${updatedCategory.category_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept-Language': i18n.language },
        body: JSON.stringify(updatedCategory)
    })
    .then((response) => response.json())
    .then((data) => {
        if(data.error){
            Alert.alert(t('error'), data.error);
        } else {
            setCategories(categories.map((category) => (category.category_id === updatedCategory.category_id ? updatedCategory : category)));
            setEditModalVisibleCategory(false);
            Alert.alert(t('success'), t('category_updated_successfully'));
        }
    })
    .catch(error => console.error('Error editing category:', error));
};