const express = require('express');
const pool = require('../db'); // Підключаємо пул з'єднань
const Joi = require('joi'); // Підключаємо Joi для валідації


const router = express.Router();

// Схема валідації для послуг
const serviceSchema = Joi.object({
  service_id: Joi.number().integer().positive().optional(),
  name: Joi.string().min(3).max(100).required().messages({
    'string.empty': 'Назва є обов’язковою',
    'string.min': 'Назва має містити щонайменше 3 символи',
    'string.max': 'Назва не може перевищувати 50 символів',
  }),
  price: Joi.number().positive().required().messages({
    'number.base': 'Ціна повнна бути числом',
    'number.positive': 'Ціна повинна бути додатнім числом',
  }),
  status: Joi.string().valid('Активний', 'Неактивний').required().messages({
    'any.only': 'Статус повинен бути "Активний" або "Неактивний"',
    'string.empty': 'Статус є обов’язковим',
  }),
  system_id: Joi.string().guid({ version: 'uuidv4' }).required(),
  category_id: Joi.number().integer().positive().required().messages({
    'number.base': 'Оберіть категорію',
    'number.integer': 'Оберіть категорію',
    'number.positive': 'Оберіть категорію',
    'any.required': 'Оберіть категорію',
  }),
  total_sessions: Joi.number().integer().min(1).required().messages({
    'number.base': 'Кількість занять повинна бути числом',
    'number.integer': 'Кількість занять повинна бути цілим числом',
    'number.min': 'Кількість занять повинна бути не менше 1',
    'any.required': 'Кількість занять є обов’язковою',
  }),
  created_at: Joi.date().optional(),
});

// Отримати всі послуги
router.get('/', async (req, res) => {
  try {
    const { system_id } = req.query;

    if (!system_id) {
      return res.status(400).json({ error: 'system_id є обов’язковим' });
    }
    const result = await pool.query('SELECT * FROM services WHERE system_id = $1',[system_id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching services:', err.message);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});


// Додати нову послугу
router.post('/', async (req, res) => {
  try {
    const { name, status, price, category_id, total_sessions, system_id } = req.body

    const { error } = serviceSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    if (!category_id) {
      return res.status(400).json({ error: 'category_id є обов’язковим' });
    }

    // Перевірка існування категорії
    const categoryResult = await pool.query(
      'SELECT category_id FROM categories WHERE category_id = $1',
      [category_id]
    );

    if (categoryResult.rows.length === 0) {
      return res.status(404).json({ error: 'Категорія не знайдена' });
    }

    // Додати послугу
    const result = await pool.query(
      'INSERT INTO services (name, status, price, category_id, total_sessions, system_id) VALUES ($1, $2, $3, $4, $5, $6::uuid) RETURNING *',
      [name, status, price, category_id, total_sessions, system_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding service:', err.message);
    res.status(500).json({ error: 'Failed to add service' });
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
      return res.status(400).json({ error: error.details[0].message });
    }

  
    // Перевірка існування категорії
    const categoryResult = await pool.query(
      'SELECT category_id FROM categories WHERE category_id = $1',
      [category_id]
    );

    if (categoryResult.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Оновити послугу
    const result = await pool.query(
      'UPDATE services SET name = $1, status = $2, price = $3, category_id = $4, total_sessions = $5 WHERE service_id = $6 RETURNING *',
      [name, status, price, category_id, total_sessions, service_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating service:', err.message);
    res.status(500).json({ error: 'Failed to update service' });
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
        error: 'Послуга використовується в сертифікатах. Видалення заборонено. Ви можете змінити статус послуги на "Неактивний".',
      });
    }

    const result = await pool.query('DELETE FROM services WHERE service_id = $1 RETURNING *', [service_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json({ message: 'Service deleted successfully' });
  } catch (err) {
    console.error('Error deleting service:', err.message);
    res.status(500).json({ error: `Failed to delete service: ${err.message}` });
  }
});


  module.exports = router;