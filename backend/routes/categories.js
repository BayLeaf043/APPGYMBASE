const express = require('express');
const pool = require('../db'); 
const Joi = require('joi');

const router = express.Router();

const categorySchema = Joi.object({
  category_id: Joi.number().integer().positive().optional(),
  name: Joi.string().min(3).max(50).required().messages({
      'string.empty': 'error_category_name_required',
      'string.min': 'error_category_name_min',
      'string.max': 'error_category_name_max',
    }),
  payment_percentage: Joi.number().min(0).max(1).optional(),
  status: Joi.string().valid('active', 'inactive').required().messages({
      'any.only': 'error_category_status_invalid',
      'string.empty': 'error_category_status_required',
    }),
  system_id: Joi.string().guid({ version: 'uuidv4' }).required(),
  created_at: Joi.date().optional(),
}).unknown(true);

// Отримати всі категорії
router.get('/', async (req, res) => {
  try {
    const { system_id } = req.query;

    if (!system_id) {
      return res.status(400).json({ error: req.t('error_system_id_required') });
    }
    const result = await pool.query('SELECT * FROM categories WHERE system_id = $1', [system_id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching categories:', err.message);
    res.status(500).json({ error: req.t('error_fetch_categories_failed') });
  }
});

// Додати нову категорію
router.post('/', async (req, res) => {
  try {
    const { name, status, system_id } = req.body;

    const { error } = categorySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: req.t(error.details[0].message) });
    }

    const result = await pool.query(
      'INSERT INTO categories (name, status, system_id) VALUES ($1, $2, $3::uuid) RETURNING *',
      [name, status, system_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding category:', err.message);
    res.status(500).json({ error: req.t('error_add_category_failed') });
  }
});

// Оновити категорію
router.put('/:category_id', async (req, res) => {
  try {
    const { category_id } = req.params;
    const { name, status, payment_percentage } = req.body;

    const { error } = categorySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: req.t(error.details[0].message) });
    }

    if (!category_id) {
      return res.status(400).json({ error: req.t('error_category_id_required') });
    }

    const result = await pool.query(
      'UPDATE categories SET name = $1, status = $2, payment_percentage = $3 WHERE category_id = $4 RETURNING *',
      [name, status, payment_percentage, category_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: req.t('error_category_not_found') });
    }

    // Якщо статус категорії змінюється на "inactive", оновлюємо статус послуг
    if (status === 'inactive') {
      await pool.query(
        'UPDATE services SET status = $1 WHERE category_id = $2',
        ['inactive', category_id]
      );
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating category:', err.message);
    res.status(500).json({ error: req.t('error_update_category_failed') });
  }
});

// Видалити категорію
router.delete('/:category_id', async (req, res) => {
  try {
    const { category_id } = req.params;

    const serviceCheck = await pool.query(
      'SELECT 1 FROM services WHERE category_id = $1 LIMIT 1',
      [category_id]
    );

    if (serviceCheck.rows.length > 0) {
      return res.status(400).json({ error: req.t('error_category_in_use') });
    }

    const result = await pool.query('DELETE FROM categories WHERE category_id = $1 RETURNING *', [category_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: req.t('error_category_not_found') });
    }

    res.json({ message: req.t('success_category_deleted') });
  } catch (err) {
    console.error('Error deleting category:', err.message);
    res.status(500).json({ error: req.t('error_delete_category_failed') });
  }
});

module.exports = router;