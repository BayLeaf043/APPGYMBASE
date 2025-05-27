const express = require('express');
const pool = require('../db'); 
const Joi = require('joi');

const router = express.Router();

const clientSchema = Joi.object({
  client_id: Joi.number().integer().positive().optional(),
  name: Joi.string().min(3).max(50).required().messages({
    'string.empty': 'error_client_name_required',
    'string.min': 'error_client_name_min',
    'string.max': 'error_client_name_max',
  }),
  surname: Joi.string().min(3).max(50).required().messages({
    'string.empty': 'error_client_surname_required',
    'string.min': 'error_client_surname_min',
    'string.max': 'error_client_surname_max',
  }),
  phone: Joi.string().pattern(/^\d{10}$/).required().messages({
      'string.empty': 'error_client_phone_required',
      'string.pattern.base': 'error_client_phone_invalid',
 }),
 status: Joi.string().valid('active', 'inactive').required().messages({
         'any.only': 'error_client_status_invalid',
         'any.required': 'error_client_status_required',
     }),
 birthday: Joi.date()
    .less('now') 
    .greater('1900-01-01') 
    .required()
    .messages({
      'date.base': 'error_client_birthday_invalid',
      'date.less': 'error_client_birthday_future',
      'date.greater': 'error_client_birthday_past',
      'any.required': 'error_client_birthday_required',
    }),
  system_id: Joi.string().guid({ version: 'uuidv4' }).required(),
  created_at: Joi.date().optional(),
}).unknown(true);

// Отримати всіх клієнтів
router.get('/', async (req, res) => {
  try {
    const { system_id } = req.query;

    if (!system_id) {
      return res.status(400).json({ error: req.t('error_system_id_required') });
    }
    const result = await pool.query('SELECT * FROM clients WHERE system_id = $1',[system_id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching clients:', err.message);
    res.status(500).json({ error: req.t('error_fetch_clients_failed') });
  }
});


// Додати нового клієнта
router.post('/', async (req, res) => {
  try {
    const { name, surname, phone, birthday, system_id, status } = req.body;

    const { error } = clientSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: req.t(error.details[0].message) });
    }

    // Додавання нового клієнта до бази даних
    const result = await pool.query(
      'INSERT INTO clients (name, surname, phone, birthday, system_id, status) VALUES ($1, $2, $3, $4::date, $5::uuid, $6) RETURNING *',
      [name, surname, phone, birthday, system_id, status]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding client:', err.message);
    res.status(500).json({ error: req.t('error_add_client_failed') });
  }
});


// Оновити клієнта
router.put('/:client_id', async (req, res) => {
  try {
    const { client_id } = req.params;
    const { count_of_visits, last_visit, client_revenue, ...validatedData } = req.body;

    const { error } = clientSchema.validate(validatedData);
    if (error) {
      return res.status(400).json({ error: req.t(error.details[0].message) });
    }

    const { name, surname, phone, birthday, status } = validatedData;

    // Оновити клієнта
    const result = await pool.query(
      'UPDATE clients SET name = $1, surname = $2, phone = $3, birthday = $4::date, status = $5 WHERE client_id = $6 RETURNING *',
      [name, surname, phone, birthday, status, client_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: req.t('error_client_not_found') });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating client:', err.message);
    res.status(500).json({ error: req.t('error_update_client_failed') });
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
        error: req.t('error_client_in_use'),
      });
    }
  
      const result = await pool.query('DELETE FROM clients WHERE client_id = $1 RETURNING *', [client_id]);
  
      if (result.rows.length === 0) {
        return res.status(404).json({ error: req.t('error_client_not_found') });
      }
  
      res.json({ message: 'Client deleted successfully' });
    } catch (err) {
      console.error('Error deleting client:', err.message);
      res.status(500).json({ error: req.t('error_delete_client_failed') });
    }
  });


module.exports = router;