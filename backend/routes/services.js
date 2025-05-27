const express = require('express');
const pool = require('../db'); // Підключаємо пул з'єднань
const Joi = require('joi'); // Підключаємо Joi для валідації


const router = express.Router();

// Схема валідації для послуг
const serviceSchema = Joi.object({
  service_id: Joi.number().integer().positive().optional(),
  name: Joi.string().min(3).max(100).required().messages({
    'string.empty': 'error_service_name_required',
    'string.min': 'error_service_name_min',
    'string.max': 'error_service_name_max',
  }),
  price: Joi.number().positive().required().messages({
    'number.base': 'error_service_price_number',
    'number.positive': 'error_service_price_positive',
  }),
  status: Joi.string().valid('active', 'inactive').required().messages({
    'any.only': 'error_service_status_invalid',
    'string.empty': 'error_service_status_required',
  }),
  system_id: Joi.string().guid({ version: 'uuidv4' }).required(),
  category_id: Joi.number().integer().positive().required().messages({
    'number.base': 'error_service_category_required',
    'number.integer': 'error_service_category_required',
    'number.positive': 'error_service_category_required',
    'any.required': 'error_service_category_required',
  }),
  total_sessions: Joi.number().integer().min(1).required().messages({
    'number.base': 'error_service_sessions_number',
    'number.integer': 'error_service_sessions_integer',
    'number.min': 'error_service_sessions_min',
    'any.required': 'error_service_sessions_required',
  }),
  created_at: Joi.date().optional(),
});

// Отримати всі послуги
router.get('/', async (req, res) => {
  try {
    const { system_id } = req.query;

    if (!system_id) {
      return res.status(400).json({ error: req.t('error_system_id_required') });
    }
    const result = await pool.query('SELECT * FROM services WHERE system_id = $1',[system_id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching services:', err.message);
    res.status(500).json({ error: req.t('error_fetch_services_failed') });
  }
});


// Додати нову послугу
router.post('/', async (req, res) => {
  try {
    const { name, status, price, category_id, total_sessions, system_id } = req.body

    const { error } = serviceSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: req.t(error.details[0].message) });
    }

    // Перевірка існування категорії
    const categoryResult = await pool.query(
      'SELECT category_id FROM categories WHERE category_id = $1',
      [category_id]
    );

    if (categoryResult.rows.length === 0) {
      return res.status(404).json({ error: req.t('error_category_not_found') });
    }

    // Додати послугу
    const result = await pool.query(
      'INSERT INTO services (name, status, price, category_id, total_sessions, system_id) VALUES ($1, $2, $3, $4, $5, $6::uuid) RETURNING *',
      [name, status, price, category_id, total_sessions, system_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding service:', err.message);
    res.status(500).json({ error: req.t('error_add_service_failed') });
  }
});  


// Оновити послугу
router.put('/:service_id', async (req, res) => {
  try {
    const { service_id } = req.params;
    const { name, status, price, category_id, total_sessions } = req.body;

    // Валідація вхідних даних
    const { error } = serviceSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: req.t(error.details[0].message) });
    }

  
    // Перевірка існування категорії
    const categoryResult = await pool.query(
      'SELECT category_id FROM categories WHERE category_id = $1',
      [category_id]
    );

    if (categoryResult.rows.length === 0) {
      return res.status(404).json({ error: req.t('error_category_not_found') });
    }

    // Оновити послугу
    const result = await pool.query(
      'UPDATE services SET name = $1, status = $2, price = $3, category_id = $4, total_sessions = $5 WHERE service_id = $6 RETURNING *',
      [name, status, price, category_id, total_sessions, service_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: req.t('error_service_not_found') });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating service:', err.message);
    res.status(500).json({ error: req.t('error_update_service_failed') });
  }
});

// Видалити послугу
router.delete('/:service_id', async (req, res) => {
  try {
    const { service_id } = req.params;

     const certificateCheck = await pool.query(
      'SELECT COUNT(*) FROM certificates WHERE service_id = $1',
      [service_id]
    );

    if (parseInt(certificateCheck.rows[0].count, 10) > 0) {
      return res.status(400).json({
        error: req.t('error_service_in_use'),
      });
    }

    const result = await pool.query('DELETE FROM services WHERE service_id = $1 RETURNING *', [service_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: req.t('error_service_not_found') });
    }

    res.json({ message: req.t('success_service_deleted') });
  } catch (err) {
    console.error('Error deleting service:', err.message);
    res.status(500).json({ error: req.t('error_delete_service_failed') });
  }
});


  module.exports = router;