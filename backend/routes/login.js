const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Перевірка, чи існує користувач із таким email
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Невірний email або пароль' });
    }

    const user = userResult.rows[0];

    // Перевірка пароля
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Невірний email або пароль' });
    }

    res.json({
      success: true,
      user: {
        surname: user.surname,
        name: user.name,
        role: user.role,
        system_id: user.system_id,
      },
    });
  } catch (err) {
    console.error('Error during login:', err.message);
    res.status(500).json({ error: 'Помилка авторизації' });
  }
});

module.exports = router;