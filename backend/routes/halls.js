const express = require('express');
const pool = require('../db'); // Підключаємо пул з'єднань
const Joi = require('joi');

const router = express.Router();

const hallSchema = Joi.object({
  hall_id: Joi.number().integer().positive().optional(),
  name: Joi.string().min(3).max(50).required().messages({
      'string.empty': 'Назва є обов’язковою',
      'string.min': 'Назва має містити щонайменше 3 символи',
      'string.max': 'Назва не може перевищувати 50 символів',
    }), 
  status: Joi.string().valid('Активний', 'Неактивний').required().messages({
      'any.only': 'Статус повинен бути "Активний" або "Неактивний"',
      'string.empty': 'Статус є обов’язковим',
    }),
  system_id: Joi.string().guid({ version: 'uuidv4' }).required(),
  created_at: Joi.date().optional(),
});

// Отримати всі зали
router.get('/', async (req, res) => {
  try {
    const { system_id } = req.query;

    if (!system_id) {
      return res.status(400).json({ error: 'system_id є обов’язковим' });
    }

    const result = await pool.query('SELECT * FROM halls WHERE system_id = $1', [system_id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching halls:', err.message);
    res.status(500).json({ error: 'Failed to fetch halls' });
  }
});

// Додати новий зал
router.post('/', async (req, res) => {
  try {
    const { name, status, system_id } = req.body;

    const { error } = hallSchema.validate( req.body );
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const result = await pool.query(
      'INSERT INTO halls (name, status, system_id) VALUES ($1, $2, $3::uuid) RETURNING *',
      [name, status, system_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding hall:', err.message);
    res.status(500).json({ error: 'Failed to add hall' });
  }
});

// Оновити зал
router.put('/:hall_id', async (req, res) => {
  try {
    const { hall_id } = req.params;
    const { name, status } = req.body;

    const { error } = hallSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    if (!hall_id) {
      return res.status(400).json({ error: 'hall_id є обов’язковим' });
    }

    const result = await pool.query(
      'UPDATE halls SET name = $1, status = $2 WHERE hall_id = $3 RETURNING *',
      [name, status, hall_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Hall not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating hall:', err.message);
    res.status(500).json({ error: 'Failed to update hall' });
  }
});

// Видалити зал
router.delete('/:hall_id', async (req, res) => {
  try {
    const { hall_id } = req.params;

    const eventCheck = await pool.query(
      'SELECT COUNT(*) FROM events WHERE hall_id = $1',
      [hall_id]
    );

    if (parseInt(eventCheck.rows[0].count, 10) > 0) {
      return res.status(400).json({
        error: 'Зал використовується в подіях. Видалення заборонено. Ви можете змінити статус залу на "Неактивний".',
      });
    }

    const result = await pool.query('DELETE FROM halls WHERE hall_id = $1 RETURNING *', [hall_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Hall not found' });
    }

    res.json({ message: 'Hall deleted successfully' });
  } catch (err) {
    console.error('Error deleting hall:', err.message);
    res.status(500).json({ error: 'Failed to delete hall' });
  }
});

module.exports = router;