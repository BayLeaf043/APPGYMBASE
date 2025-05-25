const express = require('express');
const pool = require('../db'); 
const Joi = require('joi');

const router = express.Router();

const clientSchema = Joi.object({
  client_id: Joi.number().integer().positive().optional(),
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
  phone: Joi.string().pattern(/^\d{10}$/).required().messages({
      'string.empty': 'Телефон є обов’язковим',
      'string.pattern.base': 'Телефон має містити 10 цифр',
 }),
 status: Joi.string().valid('Активний', 'Неактивний').required().messages({
         'any.only': 'Статус має бути "Активний" або "Неактивний"',
         'any.required': 'Статус є обов’язковим',
     }),
 birthday: Joi.date()
    .less('now') 
    .greater('1900-01-01') 
    .required()
    .messages({
      'date.base': 'Дата народження має бути коректною датою',
      'date.less': 'Дата народження не може бути в майбутньому',
      'date.greater': 'Дата народження має бути після 1 січня 1900 року',
      'any.required': 'Дата народження є обов’язковою',
    }),
  system_id: Joi.string().guid({ version: 'uuidv4' }).required(),
  created_at: Joi.date().optional(),
}).unknown(true);

// Отримати всіх клієнтів
router.get('/', async (req, res) => {
  try {
    const { system_id } = req.query;

    if (!system_id) {
      return res.status(400).json({ error: 'system_id є обов’язковим' });
    }
    const result = await pool.query('SELECT * FROM clients WHERE system_id = $1',[system_id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching clients:', err.message);
    res.status(500).json({ error: 'Failed to fetch clients'});
  }
});


// Додати нового клієнта
router.post('/', async (req, res) => {
  try {
    const { name, surname, phone, birthday, system_id, status } = req.body;
    console.log('Отримані дані:', { name, surname, phone, birthday, system_id, status });

    const { error } = clientSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Додавання нового клієнта до бази даних
    const result = await pool.query(
      'INSERT INTO clients (name, surname, phone, birthday, system_id, status) VALUES ($1, $2, $3, $4::date, $5::uuid, $6) RETURNING *',
      [name, surname, phone, birthday, system_id, status]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding client:', err.message);
    res.status(500).json({ error: 'Failed to add client' });
  }
});


// Оновити клієнта
router.put('/:client_id', async (req, res) => {
  try {
    const { client_id } = req.params;
    const { count_of_visits, last_visit, client_revenue, ...validatedData } = req.body;

    const { error } = clientSchema.validate(validatedData);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { name, surname, phone, birthday, status } = validatedData;

    // Оновити клієнта
    const result = await pool.query(
      'UPDATE clients SET name = $1, surname = $2, phone = $3, birthday = $4::date, status = $5 WHERE client_id = $6 RETURNING *',
      [name, surname, phone, birthday, status, client_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating client:', err.message);
    res.status(500).json({ error: 'Failed to update client' });
  }
});


// Видалити клієнта
router.delete('/:client_id', async (req, res) => {
    try {
      const { client_id } = req.params;
  
      // Перевірити, чи є у клієнта сертифікати
    const certificateCheck = await pool.query(
      'SELECT COUNT(*) FROM certificates WHERE client_id = $1',
      [client_id]
    );

    if (parseInt(certificateCheck.rows[0].count, 10) > 0) {
      return res.status(400).json({
        error: 'Клієнт користується послугами. Видалення заборонено. Можете змінити статус клієнта на "Неактивний".',
      });
    }
  
      const result = await pool.query('DELETE FROM clients WHERE client_id = $1 RETURNING *', [client_id]);
  
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Client not found' });
      }
  
      res.json({ message: 'Client deleted successfully' });
    } catch (err) {
      console.error('Error deleting client:', err.message);
      res.status(500).json({ error: `Failed to delete client: ${err.message}` });
    }
  });


module.exports = router;