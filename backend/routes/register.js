const express = require('express');
const { v4: uuidv4 } = require('uuid'); // Для генерації system_id
const bcrypt = require('bcrypt'); // Для хешування паролів
const pool = require('../db'); // Підключення до бази даних
const Joi = require('joi'); // Для валідації полів

const router = express.Router();

// Схема валідації для реєстрації
const registrationSchema = Joi.object({
  surname: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Прізвище є обов’язковим',
    'string.min': 'Прізвище має містити щонайменше 2 символи',
    'string.max': 'Прізвище не може перевищувати 100 символів',
  }),
  name: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Ім’я є обов’язковим',
    'string.min': 'Ім’я має містити щонайменше 2 символи',
    'string.max': 'Ім’я не може перевищувати 100 символів',
  }),
  email: Joi.string().email().required().messages({
    'string.empty': 'Email є обов’язковим',
    'string.email': 'Email має бути валідним',
  }),
  phone: Joi.string().pattern(/^\d{10,15}$/).required().messages({
    'string.empty': 'Телефон є обов’язковим',
    'string.pattern.base': 'Телефон має містити від 10 до 15 цифр',
  }),
  password: Joi.string().min(6).max(50).required().messages({
    'string.empty': 'Пароль є обов’язковим',
    'string.min': 'Пароль має містити щонайменше 6 символів',
    'string.max': 'Пароль не може перевищувати 50 символів',
  }),
});

// Маршрут для реєстрації адміністратора
router.post('/', async (req, res) => {
  try {
    const { surname, name, email, phone, password } = req.body;

    // Валідація вхідних даних
    const { error } = registrationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Перевірка, чи існує користувач із таким email або телефоном
    const userCheck = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR phone = $2',
      [email, phone]
    );
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Користувач із таким email або телефоном вже існує' });
    }

    // Генерація нового system_id
    const system_id = uuidv4();

    // Хешування пароля
    const hashedPassword = await bcrypt.hash(password, 10);

    // Додавання адміністратора до бази даних
    const result = await pool.query(
      'INSERT INTO users (system_id, surname, name, email, phone, password, role) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [system_id, surname, name, email, phone, hashedPassword, 'Адміністратор']
    );

    res.status(201).json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error('Error registering admin:', err.message);
    res.status(500).json({ error: 'Не вдалося зареєструвати адміністратора' });
  }
});

module.exports = router;