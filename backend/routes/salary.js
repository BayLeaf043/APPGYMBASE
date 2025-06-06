const express = require('express');
const pool = require('../db');  
const router = express.Router();
// Отримати всі записи 
router.get('/', async (req, res) => {
  try {
    const { system_id, startDate, endDate } = req.query;

    if (!system_id) {
      return res.status(400).json({ error: req.t('error_system_id_required') });
    }
    if (!startDate || !endDate) {
      return res.status(400).json({ error: req.t('error_dates_required') });
    }
    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ error: req.t('error_invalid_date_range') });
    }

    const result = await pool.query(
      `SELECT * FROM salary_records 
       WHERE system_id = $1 
         AND created_at >= $2 
         AND created_at <= $3
       ORDER BY record_id ASC`,
      [system_id, startDate, endDate]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching salary records:', err.message);
    res.status(500).json({ error: req.t('error_fetch_salary_records_failed') });
  }
});

// Розширений звіт зарплати
router.get('/report', async (req, res) => {
  try {
    const { user_id, startDate, endDate } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: req.t('error_user_id_required') });
    }
    if (!startDate || !endDate) {
      return res.status(400).json({ error: req.t('error_dates_required') });
    }
    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ error: req.t('error_invalid_date_range') });
    }

    const result = await pool.query(
      `SELECT
        sr.record_id,
        sr.payment_amount,
        e.event_id,
        e.event_date,
        e.title AS event_name,
        e.start_time,
        e.end_time,
        c.client_id,
        c.surname AS client_surname,
        c.name AS client_name,
        cert.certificate_id,
        s.name AS service_name
      FROM salary_records sr
      JOIN session_deductions sd ON sr.deduction_id = sd.deduction_id
      JOIN events e ON sd.event_id = e.event_id
      JOIN event_clients ec ON e.event_id = ec.event_id AND sd.client_id = ec.client_id
      JOIN clients c ON sd.client_id = c.client_id
      JOIN certificates cert ON sd.certificate_id = cert.certificate_id
      JOIN services s ON cert.service_id = s.service_id
      WHERE sr.user_id = $1
        AND sr.created_at >= $2
        AND sr.created_at <= $3
      ORDER BY e.event_id, e.start_time`,
      [user_id, startDate, endDate]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching salary report:', err.message);
    res.status(500).json({ error: req.t('error_fetch_salary_report_failed') });
  }
});

module.exports = router;