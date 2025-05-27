const express = require('express');
const pool = require('../db'); // Підключаємо пул з'єднань
const Joi = require('joi');

const router = express.Router();

const hallSchema = Joi.object({
  hall_id: Joi.number().integer().positive().optional(),
  name: Joi.string().min(3).max(50).required().messages({
      'string.empty': 'error_hall_name_required',
      'string.min': 'error_hall_name_min',
      'string.max': 'error_hall_name_max',
    }),
  status: Joi.string().valid('active', 'inactive').required().messages({
      'any.only': 'error_hall_status_invalid',
      'string.empty': 'error_hall_status_required',
    }),
  system_id: Joi.string().guid({ version: 'uuidv4' }).required(),
  created_at: Joi.date().optional(),
});

// Отримати всі зали
router.get('/', async (req, res) => {
  try {
    const { system_id } = req.query;

    if (!system_id) {
      return res.status(400).json({ error: req.t('error_system_id_required') });
    }

    const result = await pool.query('SELECT * FROM halls WHERE system_id = $1', [system_id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching halls:', err.message);
    res.status(500).json({ error: req.t('error_fetch_halls_failed') });
  }
});

// Додати новий зал
router.post('/', async (req, res) => {
  try {
    const { name, status, system_id } = req.body;

    const { error } = hallSchema.validate( req.body );
    if (error) {
      return res.status(400).json({ error: req.t(error.details[0].message) });
    }

    const result = await pool.query(
      'INSERT INTO halls (name, status, system_id) VALUES ($1, $2, $3::uuid) RETURNING *',
      [name, status, system_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding hall:', err.message);
    res.status(500).json({ error: req.t('error_add_hall_failed') });
  }
});

// Оновити зал
router.put('/:hall_id', async (req, res) => {
  try {
    const { hall_id } = req.params;
    const { name, status } = req.body;

    const { error } = hallSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: req.t(error.details[0].message) });
    }

    if (!hall_id) {
      return res.status(400).json({ error: req.t('error_hall_id_required') });
    }

    const result = await pool.query(
      'UPDATE halls SET name = $1, status = $2 WHERE hall_id = $3 RETURNING *',
      [name, status, hall_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: req.t('error_hall_not_found') });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating hall:', err.message);
    res.status(500).json({ error: req.t('error_update_hall_failed') });
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
        error: req.t('error_hall_in_use'),
      });
    }

    const result = await pool.query('DELETE FROM halls WHERE hall_id = $1 RETURNING *', [hall_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: req.t('error_hall_not_found') });
    }

    res.json({ message: req.t('success_hall_deleted') });
  } catch (err) {
    console.error('Error deleting hall:', err.message);
    res.status(500).json({ error: req.t('error_delete_hall_failed') });
  }
});

module.exports = router;