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
        'date.base': 'Дата початку дії має бути коректною датою',
        'any.required': 'Дата початку дії є обов’язковою',
    }),
    valid_to: Joi.date().greater(Joi.ref('valid_from')).required().messages({
        'date.base': 'Дата закінчення дії має бути коректною датою',
        'date.greater': 'Дата закінчення дії має бути пізніше дати початку дії',
        'any.required': 'Дата закінчення дії є обов’язковою',
    }),
    total_sessions: Joi.number().integer().min(1).required().messages({
        'number.base': 'Кількість занять має бути числом',
        'number.integer': 'Кількість занять має бути цілим числом',
        'number.min': 'Кількість занять має бути не менше 1',
        'any.required': 'Кількість занять є обов’язковою',
    }),
    used_sessions: Joi.number().integer().min(0).default(0).messages({
        'number.base': 'Кількість використаних занять має бути числом',
        'number.integer': 'Кількість використаних занять має бути цілим числом',
        'number.min': 'Кількість використаних занять не може бути від’ємною',
    }),
    price: Joi.number().required().messages({
        'number.base': 'Ціна має бути числом',
        'any.required': 'Ціна є обов’язковою',
    }),
    status: Joi.string().valid('Активний', 'Неактивний').required().messages({
        'any.only': 'Статус має бути "Активний" або "Неактивний"',
        'any.required': 'Статус є обов’язковим',
    }),
    payment_method: Joi.string().required().messages({
        'string.base': 'Метод оплати має бути текстом',
        'any.required': 'Метод оплати є обов’язковим',
    }),
    comment: Joi.string().allow('').optional().messages({
        'string.base': 'Коментар має бути текстом',
    }),
});


const updateSchema = Joi.object({
  valid_to: Joi.date().greater('now').required().messages({
    'date.base': 'Дата закінчення дії має бути коректною датою',
    'date.greater': 'Дата закінчення дії має бути в майбутньому',
    'any.required': 'Дата закінчення дії є обов’язковою',
  }),
  comment: Joi.string().allow('').optional().messages({
    'string.base': 'Коментар має бути текстом',
  }),
}).unknown(true);


// Отримати всі сертифікати
router.get('/', async (req, res) => {
    try {
      const { system_id } = req.query;
  
      if (!system_id) {
        return res.status(400).json({ error: 'system_id є обов’язковим' });
      }

      // Оновлення статусів сертифікатів
      await updateCertificateStatuses();

      const result = await pool.query('SELECT * FROM certificates WHERE system_id = $1',[system_id]);
      res.json(result.rows);
    } catch (err) {
      console.error('Error fetching certificates:', err.message);
      res.status(500).json({ error: 'Failed to fetch certificates' });
    }
  });


// Додати новий сертифікат
router.post('/', async (req, res) => {
    try {
      const { client_id, service_id, valid_from, valid_to,
        total_sessions, used_sessions, price, status, payment_method, comment, system_id } = req.body;
  
      const { error } = certificateSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      if (!client_id) {
        return res.status(400).json({ error: 'client_id є обов’язковим' });
      }

      if (price < 0) {
        return res.status(400).json({ error: 'Ціна повинна бути додатнім числом' });
      }
  
      // Перевірка існування категорії
      const clientResult = await pool.query(
        'SELECT client_id FROM clients WHERE client_id = $1',
        [client_id]
      );
  
      if (clientResult.rows.length === 0) {
        return res.status(404).json({ error: 'клієнта не знайдена' });
      }

      if (!service_id) {
        return res.status(400).json({ error: 'service_id є обов’язковим' });
      }
  
      // Перевірка існування категорії
      const serviceResult = await pool.query(
        'SELECT service_id FROM services WHERE service_id = $1',
        [service_id]
      );
  
      if (serviceResult.rows.length === 0) {
        return res.status(404).json({ error: 'послугу не знайдена' });
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
            `INSERT INTO finances (certificate_id, client_id, price, payment_method, transaction_type, comment, system_id) 
            VALUES ($1, $2, $3, $4, 'Надходження', $5, $6::uuid)`,
            [newCertificate.certificate_id, client_id, price, payment_method,  comment, system_id || 'Сертифікат створено']
        );
      
      res.status(201).json(newCertificate);
    } catch (err) {
      console.error('Error adding certificate:', err.message);
      res.status(500).json({ error: 'Failed to add certificate' });
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
        return res.status(400).json({ error: error.details[0].message });
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
        return res.status(404).json({ error: 'Certificate not found' });
      }

      // Оновлення статусів сертифікатів
      await updateCertificateStatuses();
  
      res.json(result.rows[0]);
    } catch (err) {
      console.error('Error updating certificate:', err.message);
      res.status(500).json({ error: 'Failed to update certificate' });
    }
  });


// Видалити сертифікат
router.delete('/:certificate_id', async (req, res) => {
    try {
      const { certificate_id } = req.params;
  
      console.log('Видалення сертифіката з ID:', certificate_id);

      // Перевірка кількості використаних сеансів
    const certificateCheck = await pool.query(
      'SELECT used_sessions FROM certificates WHERE certificate_id = $1',
      [certificate_id]
    );

    if (certificateCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Сертифікат не знайдено' });
    }

    const { used_sessions } = certificateCheck.rows[0];
    if (used_sessions > 0) {
      return res.status(403).json({ error: 'Видалення сертифіката заборонено, оскільки вже використано сеанси' });
    }
  
      await pool.query('DELETE FROM finances WHERE certificate_id = $1', [certificate_id]);
    
      const result = await pool.query('DELETE FROM certificates WHERE certificate_id = $1 RETURNING *', [certificate_id]);
  
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Certificate not found' });
      }
  
      res.json({ message: 'Certificate deleted successfully' });
    } catch (err) {
      console.error('Error deleting certificate:', err.message);
      res.status(500).json({ error: `Failed to delete certificate: ${err.message}` });
    }
  });


  const updateCertificateStatuses = async () => {
    try {
      // Оновлення статусу на "Неактивний", якщо всі заняття використані
      await pool.query(`
      UPDATE certificates
      SET status = CASE
        WHEN used_sessions >= total_sessions OR DATE(valid_to) < CURRENT_DATE THEN 'Неактивний'
        WHEN used_sessions < total_sessions AND DATE(valid_to) >= CURRENT_DATE THEN 'Активний'
        ELSE status
      END
    `);
  
      console.log('Статуси сертифікатів оновлено');
    } catch (err) {
      console.error('Помилка оновлення статусів сертифікатів:', err.message);
    }
  };



module.exports = router;