const express = require('express');
const pool = require('../db'); // Підключаємо пул з'єднань
const Joi = require('joi');

const router = express.Router();

const financesSchema = Joi.object({
    finances_id: Joi.number().integer().positive().optional(),
    system_id: Joi.string().guid({ version: 'uuidv4' }).required(),
    created_at: Joi.date().optional(),
    price: Joi.number().required().messages({
        'number.base': 'error_finances_price_number',
        'any.required': 'error_finances_price_required',
    }),
    comment: Joi.string().min(1).required().messages({
            'string.empty': 'error_finances_comment_empty',
            'any.required': 'error_finances_comment_required',
        }),
}).unknown(true);

// Отримати всі транзакції
router.get('/', async (req, res) => {
    try {
      const { system_id } = req.query;
  
      if (!system_id) {
        return res.status(400).json({ error: req.t('error_system_id_required') });
      }

      const result = await pool.query(
            `SELECT f.*, c.client_id
             FROM finances f
             LEFT JOIN certificates c ON f.certificate_id = c.certificate_id
             WHERE f.system_id = $1`,
            [system_id]
        );

      res.json(result.rows);
    } catch (err) {
      console.error('Error fetching finances:', err.message);
      res.status(500).json({ error: req.t('error_fetch_finances_failed') });
    }
});

// Отримати залишок по рахунках
router.get('/balance', async (req, res) => {
  try {
    const { system_id } = req.query;
    if (!system_id) {
      return res.status(400).json({ error: req.t('error_system_id_required') });
    }
    // Підрахунок залишку по кожному payment_method
    const result = await pool.query(
      `SELECT payment_method, SUM(price) as balance
       FROM finances
       WHERE system_id = $1
       GROUP BY payment_method`,
      [system_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching balances:', err.message);
    res.status(500).json({ error: req.t('error_fetch_balances_failed') });
  }
});


// Додати нову транзакцію
router.post('/', async (req, res) => {
  try {
    const { price, payment_method, comment, system_id } = req.body

    const { error } = financesSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: req.t(error.details[0].message) });
    }

    // Додати транзакцію
    const result = await pool.query(
      `INSERT INTO finances (price, transaction_type, payment_method, comment, system_id) VALUES ($1, 'expense', $2, $3, $4::uuid) RETURNING *`,
      [price, payment_method, comment, system_id ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding finances:', err.message);
    res.status(500).json({ error: req.t('error_add_finances_failed') });
  }
});  


// Розширений звіт по фінансам
router.get('/report', async (req, res) => {
  try {
    const { system_id, startDate, endDate, payment_method } = req.query;

    if (!system_id) {
      return res.status(400).json({ error: req.t('error_system_id_required') });
    }
    if (!startDate || !endDate) {
      return res.status(400).json({ error: req.t('error_dates_required') });
    }
    if (!payment_method) {
      return res.status(400).json({ error: req.t('error_payment_method_required') });
    }

    // Базовий SQL-запит
    const query = `
      SELECT 
        f.create_at,
        f.transaction_type,
        f.payment_method,
        CASE 
          WHEN f.transaction_type = 'income' THEN 
            CONCAT(c.surname, ' ', c.name, ', ', 'оплата за послугу - ', s.name, 
              CASE WHEN f.comment IS NOT NULL AND f.comment != '' THEN CONCAT(', ', f.comment) ELSE '' END)
          ELSE f.comment
        END AS comment,
        f.price
      FROM finances f
      LEFT JOIN certificates cert ON f.certificate_id = cert.certificate_id
      LEFT JOIN clients c ON cert.client_id = c.client_id
      LEFT JOIN services s ON cert.service_id = s.service_id
      WHERE f.system_id = $1
        AND f.create_at >= $2
        AND f.create_at <= $3
        AND f.payment_method = $4
      ORDER BY f.create_at ASC
    `;

    const queryParams = [system_id, startDate, endDate, payment_method];

    const result = await pool.query(query, queryParams);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching finances report:', err.message);
    res.status(500).json({ error: req.t('error_fetch_finances_report_failed') });
  }
});



module.exports = router;