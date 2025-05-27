const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');
const jwt = require('jsonwebtoken');

const router = express.Router();

const JWT_SECRET = 'your-secret-key';

router.post('/', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Перевірка, чи існує користувач із таким email
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: req.t('error_invalid_credentials') });
    }

    const user = userResult.rows[0];

    // Перевірка пароля
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: req.t('error_invalid_credentials') });
    }

    const token = jwt.sign(
      { userId: user.system_id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        surname: user.surname,
        name: user.name,
        role: user.role,
        system_id: user.system_id,
      },
    });
  } catch (err) {
    console.error('Error during login:', err.message);
    res.status(500).json({ error: req.t('error_login_failed') });
  }
});

module.exports = router;