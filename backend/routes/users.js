const express = require('express');
const pool = require('../db'); 
const Joi = require('joi'); 
const bcrypt = require('bcrypt');

const router = express.Router();

// Схема валідації для користувачів
const userSchema = Joi.object({
  user_id: Joi.number().integer().positive().optional(),
  name: Joi.string().min(3).max(50).required().messages({
    'string.empty': 'Ім’я є обов’язковим',
    'string.min': 'Ім’я має містити щонайменше 3 символи',
    'string.max': 'Ім’я не може перевищувати 50 символів',
  }),
  surname: Joi.string().min(3).max(50).required().messages({
    'string.empty': 'Прізвище є обов’язковим',
    'string.min': 'Прівище має містити щонайменше 3 символи',
    'string.max': 'Прізвище не може перевищувати 50 символів',
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Невірний формат електронної пошти',
    'string.empty': 'Електронна пошта є обов’язковою',
  }),
  phone: Joi.string().pattern(/^\d{10,15}$/).required().messages({
      'string.empty': 'Телефон є обов’язковим',
      'string.pattern.base': 'Телефон має містити від 10 до 15 цифр',
    }),
  password: Joi.string().min(6).optional().messages({
    'string.min': 'Пароль має містити щонайменше 6 символів',
  }),
  role: Joi.string().valid('Адміністратор', 'Працівник').required(),
  status: Joi.string().valid('Активний', 'Неактивний').required().messages({
    'any.only': 'Статус повинен бути "Активний" або "Неактивний"',
    'string.empty': 'Статус є обов’язковим',
  }),
  system_id: Joi.string().guid({ version: 'uuidv4' }).required(),
  created_at: Joi.date().optional(),
});

// Отримати всіх користувачів
router.get('/', async (req, res) => {
  try {
    const { system_id } = req.query;

    if (!system_id) {
      return res.status(400).json({ error: 'system_id є обов’язковим' });
    }
    const result = await pool.query('SELECT * FROM users WHERE system_id = $1',[system_id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err.message);
    res.status(500).json({ error: 'Failed to fetch users'});
  }
});

// Додати нового користувача
router.post('/', async (req, res) => {
  try {
    const { name, surname, email, phone, password, role, status, system_id } = req.body;
    console.log('Отримані дані:', { name, surname, email, phone, password, role, status, system_id });

    const { error } = userSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Перевірка наявності користувача з таким email або телефоном
    const userCheck = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR phone = $2',
      [email, phone]
    );
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Користувач з таким email або телефоном вже існує' });
    }

    if(!password){
        return res.status(400).json({ error: 'Пароль є обов’язковим' });
    }

    // Хешування пароля
    const hashedPassword = await bcrypt.hash(password, 10);

    // Додавання нового користувача до бази даних
    const result = await pool.query(
      'INSERT INTO users (name, surname, email, phone, password, role, status, system_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::uuid) RETURNING *',
      [name, surname, email, phone, hashedPassword, role, status, system_id]
    );
    console.log('Використвовуйте дані для входу:', {email, password});
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding user:', err.message);
    res.status(500).json({ error: 'Failed to add user' });
  }
});


// Оновити користувача
router.put('/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const { name, surname, email, phone, password, role, status } = req.body;

    const { error } = userSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    if (password) {
      // Хешування пароля
      const hashedPassword = await bcrypt.hash(password, 10);

      // Оновити користувача з новим паролем
      result = await pool.query(
        `UPDATE users 
         SET 
           name = $1, 
           surname = $2, 
           email = $3, 
           phone = $4, 
           password = $5, 
           role = $6, 
           status = $7 
         WHERE user_id = $8 
         RETURNING *`,
        [name, surname, email, phone, hashedPassword, role, status, user_id]
      );
      console.log('Використвовуйте нові дані для входу:', {email, password});
    } else {
      // Оновити користувача без зміни пароля
      result = await pool.query(
        `UPDATE users 
         SET 
           name = $1, 
           surname = $2, 
           email = $3, 
           phone = $4, 
           role = $5, 
           status = $6 
         WHERE user_id = $7 
         RETURNING *`,
        [name, surname, email, phone, role, status, user_id]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating user:', err.message);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Видалити працівника
router.delete('/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;

    console.log('Видалення користувача з ID:', user_id);

    const userCheck = await pool.query('SELECT role FROM users WHERE user_id = $1', [user_id]);

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Користувача не знайдено' });
    }

    const { role } = userCheck.rows[0];
    if (role === 'Адміністратор') {
      return res.status(403).json({ error: 'Видалення адміністратора заборонено' });
    }

    const result = await pool.query('DELETE FROM users WHERE user_id = $1 RETURNING *', [user_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err.message);
    res.status(500).json({ error: `Failed to delete user: ${err.message}` });
  }
});

module.exports = router;