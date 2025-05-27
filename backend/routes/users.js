const express = require('express');
const pool = require('../db'); 
const Joi = require('joi'); 
const bcrypt = require('bcrypt');

const router = express.Router();

// Схема валідації для користувачів
const userSchema = Joi.object({
  user_id: Joi.number().integer().positive().optional(),
  name: Joi.string().min(3).max(50).required().messages({
    'string.empty': 'error_user_name_required',
    'string.min': 'error_user_name_min',
    'string.max': 'error_user_name_max',
  }),
  surname: Joi.string().min(3).max(50).required().messages({
    'string.empty': 'error_user_surname_required',
    'string.min': 'error_user_surname_min',
    'string.max': 'error_user_surname_max',
  }),
  email: Joi.string().pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/).required().messages({
    'string.pattern.base': 'error_user_email_invalid',
    'string.empty': 'error_user_email_required',
  }),
  phone: Joi.string().pattern(/^\d{10,15}$/).required().messages({
      'string.empty': 'error_user_phone_required',
      'string.pattern.base': 'error_user_phone_invalid',
    }),
  password: Joi.string().min(6).optional().messages({
    'string.min': 'error_user_password_min',
  }),
  role: Joi.string().valid('admin', 'employee').required(),
  status: Joi.string().valid('active', 'inactive').required().messages({
    'any.only': 'error_user_status_invalid',
    'string.empty': 'error_user_status_required',
  }),
  system_id: Joi.string().guid({ version: 'uuidv4' }).required(),
  created_at: Joi.date().optional(),
});

// Отримати всіх користувачів
router.get('/', async (req, res) => {
  try {
    const { system_id } = req.query;

    if (!system_id) {
      return res.status(400).json({ error: req.t('error_system_id_required') });
    }
    const result = await pool.query('SELECT * FROM users WHERE system_id = $1',[system_id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err.message);
    res.status(500).json({ error: req.t('error_fetch_users_failed')});
  }
});

// Додати нового користувача
router.post('/', async (req, res) => {
  try {
    const { name, surname, email, phone, password, role, status, system_id } = req.body;

    const { error } = userSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: req.t(error.details[0].message) });
    }

    // Перевірка наявності користувача з таким email або телефоном
    const userCheck = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR phone = $2',
      [email, phone]
    );
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: req.t('error_user_exists') });
    }

    if(!password){
        return res.status(400).json({ error: req.t('error_user_password_required') });
    }

    // Хешування пароля
    const hashedPassword = await bcrypt.hash(password, 10);

    // Додавання нового користувача до бази даних
    const result = await pool.query(
      'INSERT INTO users (name, surname, email, phone, password, role, status, system_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::uuid) RETURNING *',
      [name, surname, email, phone, hashedPassword, role, status, system_id]
    );
    console.log('Use these credentials to log in:', {email, password});

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding user:', err.message);
    res.status(500).json({ error: req.t('error_add_user_failed') });
  }
});


// Оновити користувача
router.put('/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const { name, surname, email, phone, password, role, status } = req.body;

    const { error } = userSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: req.t(error.details[0].message) });
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
      console.log('Use these credentials to log in:', {email, password});
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
      return res.status(404).json({ error: req.t('error_user_not_found') });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating user:', err.message);
    res.status(500).json({ error: req.t('error_update_user_failed') });
  }
});

// Видалити працівника
router.delete('/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;

    const userCheck = await pool.query('SELECT role FROM users WHERE user_id = $1', [user_id]);

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: req.t('error_user_not_found') });
    }

    const { role } = userCheck.rows[0];
    if (role === 'admin') {
      return res.status(403).json({ error: req.t('error_delete_admin_forbidden') });
    }

    // Перевірка, чи використовується користувач у таблиці events
    const eventCheck = await pool.query(
      'SELECT COUNT(*) FROM events WHERE user_id = $1',
      [user_id]
    );

    if (parseInt(eventCheck.rows[0].count, 10) > 0) {
      return res.status(400).json({
        error: req.t('error_user_in_use_events'),
      });
    }

    const result = await pool.query('DELETE FROM users WHERE user_id = $1 RETURNING *', [user_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: req.t('error_user_not_found') });
    }

    res.json({ message: req.t('success_user_deleted') });
  } catch (err) {
    console.error('Error deleting user:', err.message);
    res.status(500).json({ error: req.t('error_delete_user_failed') });
  }
});

module.exports = router;