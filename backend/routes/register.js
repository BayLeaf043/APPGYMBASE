const express = require('express');
const { v4: uuidv4 } = require('uuid'); // Для генерації system_id
const bcrypt = require('bcrypt'); // Для хешування паролів
const pool = require('../db'); // Підключення до бази даних
const Joi = require('joi'); // Для валідації полів

const router = express.Router();

// Схема валідації для реєстрації
const registrationSchema = Joi.object({
  surname: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'error_surname_required',
    'string.min': 'error_surname_min',
    'string.max': 'error_surname_max',
  }),
  name: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'error_name_required',
    'string.min': 'error_name_min',
    'string.max': 'error_name_max',
  }),
  email: Joi.string().email().required().messages({
    'string.empty': 'error_email_required',
    'string.email': 'error_email_invalid',
  }),
  phone: Joi.string().pattern(/^\d{10,15}$/).required().messages({
    'string.empty': 'error_phone_required',
    'string.pattern.base': 'error_phone_invalid',
  }),
  password: Joi.string().min(6).max(50).required().messages({
    'string.empty': 'error_password_required',
    'string.min': 'error_password_min',
    'string.max': 'error_password_max',
  }),
});

// Маршрут для реєстрації адміністратора
router.post('/', async (req, res) => {
  try {
    const { surname, name, email, phone, password } = req.body;

    // Валідація вхідних даних
    const { error } = registrationSchema.validate(req.body, { errors: { wrap: { label: '' } } });
    if (error) {
      return res.status(400).json({ error: req.t(error.details[0].message) });
    }

    // Перевірка, чи існує користувач із таким email або телефоном
    const userCheck = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR phone = $2',
      [email, phone]
    );
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: req.t('error_user_exists') });
    }

    // Генерація нового system_id
    const system_id = uuidv4();

    // Хешування пароля
    const hashedPassword = await bcrypt.hash(password, 10);

    // Додавання адміністратора до бази даних
    const result = await pool.query(
      'INSERT INTO users (system_id, surname, name, email, phone, password, role) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [system_id, surname, name, email, phone, hashedPassword, 'admin']
    );

    res.status(201).json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error('Error registering admin:', err.message);
    res.status(500).json({ error: req.t('error_register_failed') });
  }
});

module.exports = router;