import { BASE_URL } from '../../config';
import { Alert } from 'react-native';

export const fetchCategories = (system_id, setCategories) => {
    if (system_id) {
        fetch(`${BASE_URL}/categories?system_id=${system_id}`) 
        .then((response) => response.json())
        .then((data) => setCategories(data))
        .catch((error) => {
            console.error('Помилка:', error);
            Alert.alert('Помилка', 'Не вдалося завантажити категорії');
        });
    } else {
        console.error('system_id користувача не знайдено');
    }
};

export const addCategory = (newCategory, categories, setCategories, setNewCategory, setAddModalVisibleCategory) => {
    fetch(`${BASE_URL}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory)
    })
    .then(response => response.json())
    .then(data => {
        if(data.error){
        Alert.alert('Помилка', data.error || 'Не вдалося додати категорію');
        } else {
            console.log('data:', data);
            setCategories([...categories, data]);
            setNewCategory({ name: "", status: "Активний", system_id: newCategory.system_id });
            setAddModalVisibleCategory(false);
            Alert.alert('Успіх', 'Категорію успішно додано');
        }
    })
    .catch(error => console.error('Помилка додавання:', error));
};


export const deleteCategory = (category_id, categories, setCategories) => {
    fetch(`${BASE_URL}/categories/${category_id}`, { method: 'DELETE' })
    .then((response) => response.json())
    .then((data) => {
        if (data.error) {
            Alert.alert('Помилка', data.error);
        } else {
            setCategories(categories.filter((category) => category.category_id !== category_id));
            Alert.alert('Успіх', 'Категорію успішно видалено');
        }
    })
    .catch((error) => console.error('Помилка видалення категорії:', error));
};
  

export const editCategory = (updatedCategory, categories, setCategories, setEditModalVisibleCategory) => {
    fetch(`${BASE_URL}/categories/${updatedCategory.category_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCategory)
    })
    .then((response) => response.json())
    .then((data) => {
        if(data.error){
            Alert.alert('Помилка', data.error || 'Не вдалося зберегти зміни');
        } else {
            setCategories(categories.map((category) => (category.category_id === updatedCategory.category_id ? updatedCategory : category)));
            setEditModalVisibleCategory(false);
            Alert.alert('Успіх', 'Категорію успішно оновлено');
        }
    })
    .catch(error => console.error('Помилка редагування:', error));
};