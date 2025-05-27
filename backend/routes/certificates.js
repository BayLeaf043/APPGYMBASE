const express = require('express');
const pool = require('../db'); // Підключаємо пул з'єднань
const Joi = require('joi');

const router = express.Router();

const certificateSchema = Joi.object({
    certificate_id: Joi.number().integer().positive().optional(),
    system_id: Joi.string().guid({ version: 'uuidv4' }).required(),
    created_at: Joi.date().optional(),
    client_id: Joi.number().integer().positive().required(),
    service_id: Joi.number().integer().positive().required(),
    valid_from: Joi.date().required().messages({
        'date.base': 'error_valid_from_date_invalid',
        'any.required': 'error_valid_from_date_required',
    }),
    valid_to: Joi.date().greater(Joi.ref('valid_from')).required().messages({
        'date.base': 'error_valid_to_date_invalid',
        'date.greater': 'error_valid_to_date_greater',
        'any.required': 'error_valid_to_date_required',
    }),
    total_sessions: Joi.number().integer().min(1).required().messages({
        'number.base': 'error_total_sessions_number',
        'number.integer': 'error_total_sessions_integer',
        'number.min': 'error_total_sessions_min',
        'any.required': 'error_total_sessions_required',
    }),
    used_sessions: Joi.number().integer().min(0).default(0).messages({
        'number.base': 'error_used_sessions_number',
        'number.integer': 'error_used_sessions_integer',
        'number.min': 'error_used_sessions_min',
    }),
    price: Joi.number().required().messages({
        'number.base': 'error_finances_price_number',
        'any.required': 'error_finances_price_required',
    }),
    status: Joi.string().valid('active', 'inactive').required().messages({
        'any.only': 'error_status_invalid',
        'any.required': 'error_status_required',
    }),
    payment_method: Joi.string().required().messages({
        'string.base': 'error_payment_method_text',
        'any.required': 'error_payment_method_required',
    }),
    comment: Joi.string().allow('').optional().messages({
        'string.base': 'error_comment_text',
    }),
});


const updateSchema = Joi.object({
  valid_to: Joi.date().greater('now').required().messages({
    'date.base': 'error_valid_to_date_invalid',
    'date.greater': 'error_valid_to_date_future',
    'any.required': 'error_valid_to_date_required',
  }),
  comment: Joi.string().allow('').optional().messages({
    'string.base': 'error_comment_text',
  }),
}).unknown(true);


// Отримати всі сертифікати
router.get('/', async (req, res) => {
    try {
      const { system_id } = req.query;
  
      if (!system_id) {
        return res.status(400).json({ error: req.t('error_system_id_required') });
      }

      // Оновлення статусів сертифікатів
      await updateCertificateStatuses();

      const result = await pool.query('SELECT * FROM certificates WHERE system_id = $1',[system_id]);
      res.json(result.rows);
    } catch (err) {
      console.error('Error fetching certificates:', err.message);
      res.status(500).json({ error: req.t('error_fetch_certificates_failed') });
    }
  });


// Додати новий сертифікат
router.post('/', async (req, res) => {
    try {
      const { client_id, service_id, valid_from, valid_to,
        total_sessions, used_sessions, price, status, payment_method, comment, system_id } = req.body;
  
        if(!client_id){
        return res.status(400).json({ error: req.t('error_client_not_found') });
      }

      if(!service_id){
        return res.status(400).json({ error: req.t('error_service_not_found') });
      }

      if (price < 0) {
        return res.status(400).json({ error: req.t('error_must_be_positive') });
      }

      const { error } = certificateSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: req.t(error.details[0].message) });
      }

      // Перевірка існування категорії
      const clientResult = await pool.query(
        'SELECT client_id FROM clients WHERE client_id = $1',
        [client_id]
      );
  
      if (clientResult.rows.length === 0) {
        return res.status(404).json({ error: req.t('error_client_not_found') });
      }

      // Перевірка існування категорії
      const serviceResult = await pool.query(
        'SELECT service_id FROM services WHERE service_id = $1',
        [service_id]
      );
  
      if (serviceResult.rows.length === 0) {
        return res.status(404).json({ error: req.t('error_service_not_found') });
      }


  
      // Додавання нового сертифікату до бази даних
      const result = await pool.query(
        `INSERT INTO certificates (client_id, service_id, 
        valid_from, valid_to, total_sessions, used_sessions, price, 
        status, payment_method, comment, system_id) 
        VALUES ($1, $2, $3::date, $4::date, $5, $6, $7, $8, $9, $10, $11::uuid) RETURNING *`,
        [client_id, service_id, valid_from, valid_to,
            total_sessions, used_sessions, price, status, payment_method, comment, system_id]
      );

      const newCertificate = result.rows[0];

      // Додавання запису у таблицю finances
        await pool.query(
            `INSERT INTO finances (certificate_id, price, payment_method, transaction_type, comment, system_id) 
            VALUES ($1, $2, $3, 'income', $4, $5::uuid)`,
            [newCertificate.certificate_id, price, payment_method,  comment, system_id]
        );
      
      res.status(201).json(newCertificate);
    } catch (err) {
      console.error('Error adding certificate:', err.message);
      res.status(500).json({ error: req.t('error_add_certificate_failed') });
    }
  });


// Оновити сертифікат
router.put('/:certificate_id', async (req, res) => {
    try {
      const { certificate_id } = req.params;
      const { valid_to, comment } = req.body;
  
      // Валідація вхідних даних
      const { error } = updateSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: req.t(error.details[0].message) });
      }
  
  
      // Оновити послугу
      const result = await pool.query(
        `UPDATE certificates SET 
        valid_to = $1, 
        comment = $2
        WHERE certificate_id = $3 RETURNING *`,
        [valid_to, comment, certificate_id]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({ error: req.t('error_certificate_not_found') });
      }

      // Оновлення статусів сертифікатів
      await updateCertificateStatuses();
  
      res.json(result.rows[0]);
    } catch (err) {
      console.error('Error updating certificate:', err.message);
      res.status(500).json({ error: req.t('error_update_certificate_failed') });
    }
  });


// Видалити сертифікат
router.delete('/:certificate_id', async (req, res) => {
    try {
      const { certificate_id } = req.params;

      // Перевірка кількості використаних сеансів
    const certificateCheck = await pool.query(
      'SELECT used_sessions FROM certificates WHERE certificate_id = $1',
      [certificate_id]
    );

    if (certificateCheck.rows.length === 0) {
      return res.status(404).json({ error: req.t('error_certificate_not_found') });
    }

    const { used_sessions } = certificateCheck.rows[0];
    if (used_sessions > 0) {
      return res.status(403).json({ error: req.t('error_certificate_in_use') });
    }

      await pool.query('DELETE FROM finances WHERE certificate_id = $1', [certificate_id]);
    
      const result = await pool.query('DELETE FROM certificates WHERE certificate_id = $1 RETURNING *', [certificate_id]);
  
      if (result.rows.length === 0) {
        return res.status(404).json({ error: req.t('error_certificate_not_found') });
      }

      res.json({ message: req.t('success_certificate_deleted') });
    } catch (err) {
      console.error('Error deleting certificate:', err.message);
      res.status(500).json({ error: req.t('error_delete_certificate_failed') });
    }
  });


  const updateCertificateStatuses = async () => {
    try {
      // Оновлення статусу на "Неактивний", якщо всі заняття використані
      await pool.query(`
      UPDATE certificates
      SET status = CASE
        WHEN used_sessions >= total_sessions OR DATE(valid_to) < CURRENT_DATE THEN 'inactive'
        WHEN used_sessions < total_sessions AND DATE(valid_to) >= CURRENT_DATE THEN 'active'
        ELSE status
      END
    `);
  
      console.log('Statuses of certificates updated successfully');
    } catch (err) {
      console.error('Error updating certificate statuses:', err.message);
    }
  };


  // Отримати сертифікати для звіту
router.get('/report', async (req, res) => {
  try {
    const { system_id, startDate, endDate } = req.query;

    // Перевірка обов'язкових параметрів
    if (!system_id) {
      return res.status(400).json({ error: req.t('error_system_id_required') });
    }
    if (!startDate || !endDate) {
      return res.status(400).json({ error: req.t('error_dates_required') });
    }

    // SQL-запит для отримання сертифікатів
    const query = `
      SELECT 
        c.certificate_id,
        c.created_at AS date_time,
        s.name AS service_name,
        CONCAT(cl.surname, ' ', cl.name) AS client_name,
        c.valid_from,
        c.valid_to,
        c.payment_method,
        c.price
      FROM certificates c
      JOIN clients cl ON c.client_id = cl.client_id
      JOIN services s ON c.service_id = s.service_id
      WHERE c.system_id = $1
        AND c.created_at >= $2
        AND c.created_at <= $3
      ORDER BY c.created_at ASC
    `;

    const queryParams = [system_id, startDate, endDate];

    const result = await pool.query(query, queryParams);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching certificates report:', err.message);
    res.status(500).json({ error: req.t('error_fetch_certificates_report_failed') });
  }
});



module.exports = router;