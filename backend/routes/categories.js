const express = require('express');
const pool = require('../db'); // Підключаємо пул з'єднань
const Joi = require('joi');

const router = express.Router();

const categorySchema = Joi.object({
  category_id: Joi.number().integer().positive().optional(),
  name: Joi.string().min(3).max(50).required().messages({
      'string.empty': 'Назва є обов’язковою',
      'string.min': 'Назва має містити щонайменше 3 символи',
      'string.max': 'Назва не може перевищувати 50 символів',
    }), 
    payment_percentage: Joi.number().min(0).max(1).optional(),
  status: Joi.string().valid('Активний', 'Неактивний').required().messages({
      'any.only': 'Статус повинен бути "Активний" або "Неактивний"',
      'string.empty': 'Статус є обов’язковим',
    }),
  system_id: Joi.string().guid({ version: 'uuidv4' }).required(),
  created_at: Joi.date().optional(),
}).unknown(true);

// Отримати всі категорії
router.get('/', async (req, res) => {
  try {
    const { system_id } = req.query;

    if (!system_id) {
      return res.status(400).json({ error: 'system_id є обов’язковим' });
    }
    const result = await pool.query('SELECT * FROM categories WHERE system_id = $1', [system_id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching categories:', err.message);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Додати нову категорію
router.post('/', async (req, res) => {
  try {
    const { name, status, system_id } = req.body;

    const { error } = categorySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const result = await pool.query(
      'INSERT INTO categories (name, status, system_id) VALUES ($1, $2, $3::uuid) RETURNING *',
      [name, status, system_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding category:', err.message);
    res.status(500).json({ error: 'Failed to add category' });
  }
});

// Оновити категорію
router.put('/:category_id', async (req, res) => {
  try {
    const { category_id } = req.params;
    const { name, status, payment_percentage } = req.body;

    const { error } = categorySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    if (!category_id) {
      return res.status(400).json({ error: 'category_id є обов’язковим' });
    }

    const result = await pool.query(
      'UPDATE categories SET name = $1, status = $2, payment_percentage = $3 WHERE category_id = $4 RETURNING *',
      [name, status, payment_percentage, category_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Категорія не знайдена' });
    }

    // Якщо статус категорії змінюється на "Неактивний", оновлюємо статус послуг
    if (status === 'Неактивний') {
      await pool.query(
        'UPDATE services SET status = $1 WHERE category_id = $2',
        ['Неактивний', category_id]
      );
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating category:', err.message);
    res.status(500).json({ error: 'Failed to update category' });
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
      return res.status(400).json({ error: 'Категорію не можна видалити, оскільки вона використовується в послугах' });
    }

    const result = await pool.query('DELETE FROM categories WHERE category_id = $1 RETURNING *', [category_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    console.error('Error deleting category:', err.message);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;