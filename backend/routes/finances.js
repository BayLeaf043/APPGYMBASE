const express = require('express');
const pool = require('../db'); // Підключаємо пул з'єднань
const Joi = require('joi');

const router = express.Router();

const financesSchema = Joi.object({
    finances_id: Joi.number().integer().positive().optional(),
    system_id: Joi.string().guid({ version: 'uuidv4' }).required(),
    created_at: Joi.date().optional(),
    client_id: Joi.number().integer().positive().optional(),
    price: Joi.number().required().messages({
        'number.base': 'Ціна має бути числом',
        'any.required': 'Ціна є обов’язковою',
    }),
    comment: Joi.string().required().messages({
            'string.base': 'Коментар має бути текстом',
        }),
}).unknown(true);

// Отримати всі транзакції
router.get('/', async (req, res) => {
    try {
      const { system_id } = req.query;
  
      if (!system_id) {
        return res.status(400).json({ error: 'system_id є обов’язковим' });
      }

      const result = await pool.query('SELECT * FROM finances WHERE system_id = $1', [system_id]);
      res.json(result.rows);
    } catch (err) {
      console.error('Error fetching finances:', err.message);
      res.status(500).json({ error: 'Failed to fetch finances' });
    }
});

// Отримати залишок по рахунках
router.get('/balance', async (req, res) => {
  try {
    const { system_id } = req.query;
    if (!system_id) {
      return res.status(400).json({ error: 'system_id є обов’язковим' });
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
    res.status(500).json({ error: 'Failed to fetch balances' });
  }
});


// Додати нову транзакцію
router.post('/', async (req, res) => {
  try {
    const { price, payment_method, comment, system_id } = req.body

    const { error } = financesSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Додати транзакцію
    const result = await pool.query(
      `INSERT INTO finances (price, transaction_type, payment_method, comment, system_id) VALUES ($1, 'Списання', $2, $3, $4::uuid) RETURNING *`,
      [price, payment_method, comment, system_id ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding finances:', err.message);
    res.status(500).json({ error: 'Failed to add finances' });
  }
});  



module.exports = router;