const express = require('express');
const pool = require('../db'); // Підключаємо пул з'єднань
const Joi = require('joi');

const router = express.Router();

const eventSchema = Joi.object({
  system_id: Joi.string().guid({ version: 'uuidv4' }).required(),
  title: Joi.string().required().messages({
    'string.base': 'Назва має бути текстом',
    'any.required': 'Назва є обов’язковою',
}),
  category_id: Joi.number().integer().positive().required(),
  hall_id: Joi.number().integer().positive().required(),
  user_id: Joi.number().integer().positive().required(),
  event_date: Joi.date().required().messages({
    'date.base': 'Дата події має бути коректною датою',
    'any.required': 'Дата події є обов’язковою',
  }),
  start_time: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/) // Формат HH:mm
    .required()
    .messages({
      'string.pattern.base': 'Час початку має бути у форматі HH:mm:ss',
      'any.required': 'Час початку є обов’язковим',
    }),
  end_time: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/) // Формат HH:mm:ss
    .required()
    .custom((value, helpers) => {
      const { start_time } = helpers.state.ancestors[0];
      if (start_time && value <= start_time) {
        return helpers.error('any.invalid', { message: 'Час закінчення має бути пізніше часу початку' });
      }
      return value;
    })
    .messages({
      'string.pattern.base': 'Час закінчення має бути у форматі HH:mm:ss',
      'any.required': 'Час закінчення є обов’язковим',
      'any.invalid': 'Час закінчення має бути пізніше часу початку',
    }),
   color: Joi.string().optional(),
  comment: Joi.string().allow('').optional(),
}).unknown(true);

// Отримати всі події
router.get('/', async (req, res) => {
    try {
        const { system_id } = req.query;

        if (!system_id) {
            return res.status(400).json({ error: 'system_id є обов’язковим' });
        }

        const result = await pool.query(`
          SELECT 
                event_id,
                system_id,
                title,
                category_id,
                hall_id,
                user_id,
                TO_CHAR(event_date, 'YYYY-MM-DD') AS event_date, -- Форматуємо дату
                start_time,
                end_time,
                color,
                comment,
                is_active
             FROM events
             WHERE system_id = $1`, [system_id]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching events:', err.message);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// Додати нову подію
router.post('/', async (req, res) => {

    try {
        
        const {
            system_id,
            title,
            category_id,
            hall_id,
            user_id,
            event_date,
            start_time,
            end_time,
            color,
            comment
        } = req.body;

        const { error } = eventSchema.validate(req.body);
        
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
       }

        const result = await pool.query(
            `INSERT INTO events (system_id, title, category_id, hall_id, user_id, start_time, end_time, color, comment, event_date)
             VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING *`,
            [system_id, title, category_id, hall_id, user_id, start_time, end_time, color, comment, event_date]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error adding event:', err.message);
        res.status(500).json({ error: 'Failed to add event' });
    }
});

// Видалити подію
router.delete('/:event_id', async (req, res) => {
    try {
      const { event_id } = req.params;

      console.log('Видалення події з ID:', event_id);

      const result = await pool.query('DELETE FROM events WHERE event_id = $1 RETURNING *', [event_id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Event not found' });
      }

      res.json({ message: 'Event deleted successfully' });
    } catch (err) {
      console.error('Error deleting event:', err.message);
      res.status(500).json({ error: `Failed to delete event: ${err.message}` });
    }
  });

  // редагувати подію
  router.put('/:event_id', async (req, res) => {

    try {
      const { event_id } = req.params;
      const { title,
            category_id,
            hall_id,
            user_id,
            event_date,
            start_time,
            end_time,
            color,
            comment,
          } = req.body;

      // Валідація вхідних даних
      const { error } = eventSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      // Оновити подію
      const result = await pool.query(
        `UPDATE events SET
        title = $1,
        category_id = $2,
        hall_id = $3,
        user_id = $4,
        event_date = $5,
        start_time = $6,
        end_time = $7,
        color = $8,
        comment = $9
        WHERE event_id = $10 RETURNING *`,
        [title, category_id, hall_id, user_id, event_date, start_time, end_time, color, comment, event_id]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Event not found' });
      }

      res.json(result.rows[0]);
    } catch (err) {
      console.error('Error updating event:', err.message);
      res.status(500).json({ error: 'Failed to update event' });
    }
  });


  //Додати клієнтів до події
  router.post('/:event_id/clients', async (req, res) => {
  try {
    const { event_id } = req.params;
    const { clients, system_id } = req.body;

    console.log('Отримані дані:', { event_id, clients, system_id });

    if (!clients || !Array.isArray(clients) || !system_id) {
      return res.status(400).json({ error: 'clients (масив) та system_id є обов’язковими' });
    }

    // Формуємо параметри для запиту
    const values = clients.map((_, index) => `($1, $${index + 2}, $${clients.length + 2})`).join(',');
    const params = [event_id, ...clients, system_id];

    const query = `
      INSERT INTO event_clients (event_id, client_id, system_id)
      VALUES ${values}
      ON CONFLICT (event_id, client_id) DO NOTHING
    `;


    await pool.query(query, params);

    res.status(201).json({ message: 'Клієнти успішно додані до події' });
  } catch (err) {
    console.error('Error adding clients to event:', err.message);
    res.status(500).json({ error: 'Failed to add clients to event' });
  }
});

// Отримати клієнтів для події
router.get('/:event_id/clients', async (req, res) => {
    try {
    const { event_id } = req.params;

    const result = await pool.query(
      `SELECT ec.client_id, c.name, c.surname
       FROM event_clients ec
       JOIN clients c ON ec.client_id = c.client_id
       WHERE ec.event_id = $1`,
      [event_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching clients for event:', err.message);
    res.status(500).json({ error: 'Failed to fetch clients for event' });
  }
});

// Видалити клієнта з події
router.delete('/:event_id/clients/:client_id', async (req, res) => {
  try {
    const { event_id, client_id } = req.params;

    const result = await pool.query(
      `DELETE FROM event_clients
       WHERE event_id = $1 AND client_id = $2
       RETURNING *`,
      [event_id, client_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found for this event' });
    }

    res.json({ message: 'Client removed from event successfully' });
  } catch (err) {
    console.error('Error removing client from event:', err.message);
    res.status(500).json({ error: 'Failed to remove client from event' });
  }
});


// отримати сертифікати клієнта
router.get('/clients/:client_id/certificates', async (req, res) => {
  try {
    const { client_id } = req.params;
    const { category_id } = req.query; // Категорія події передається як параметр

    const result = await pool.query(
      `SELECT c.certificate_id, c.total_sessions, c.used_sessions, c.status, s.name AS service_name
       FROM certificates c
       JOIN services s ON c.service_id = s.service_id
       WHERE c.client_id = $1
         AND s.category_id = $2
         AND c.status = 'Активний'
         AND c.total_sessions > c.used_sessions`,
      [client_id, category_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching certificates for client:', err.message);
    res.status(500).json({ error: 'Failed to fetch certificates for client' });
  }
});


router.post('/deduct-sessions', async (req, res) => {
  try {
    const { event_id, deductions, system_id } = req.body;

    // deductions - масив об'єктів { certificate_id, client_id, user_id }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      for (const deduction of deductions) {
        const { certificate_id, client_id, user_id } = deduction;

        // Перевірка активності сертифіката
        const certificate = await client.query(
          `SELECT * FROM certificates
           WHERE certificate_id = $1
             AND status = 'Активний'
             AND total_sessions > used_sessions`,
          [certificate_id]
        );

        if (certificate.rows.length === 0) {
          throw new Error(`Сертифікат ${certificate_id} недоступний для списання`);
        }

        // Додавання запису до session_deductions
        await client.query(
          `INSERT INTO session_deductions (certificate_id, event_id, user_id, client_id, system_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [certificate_id, event_id, user_id, client_id, system_id]
        );

        // Оновлення використаних занять у сертифікаті
        await client.query(
          `UPDATE certificates
           SET used_sessions = used_sessions + 1
           WHERE certificate_id = $1`,
          [certificate_id]
        );

        // Оновлення інформації про клієнта
        await client.query(
          `UPDATE clients
           SET count_of_visits = count_of_visits + 1,
               last_visit = (SELECT event_date FROM events WHERE event_id = $1)
           WHERE client_id = $2`,
          [event_id, client_id]
        );

        // --- Додаємо salary_records для кожного списання ---
  // 1. Дізнаємося category_id, total_price, total_sessions для сертифіката
  const certInfoRes = await client.query(
    `SELECT c.certificate_id, c.total_sessions, c.price, s.category_id
     FROM certificates c
     JOIN services s ON c.service_id = s.service_id
     WHERE c.certificate_id = $1`,
    [certificate_id]
  );
  const certInfo = certInfoRes.rows[0];
  if (!certInfo) throw new Error(`Не знайдено сертифікат ${certificate_id}`);

  // 2. Дізнаємося payment_percentage для категорії
  const catRes = await client.query(
    `SELECT payment_percentage FROM categories WHERE category_id = $1`,
    [certInfo.category_id]
  );
  const payment_percentage = catRes.rows[0]?.payment_percentage || 0;

  // 3. Розрахунок суми
  const payment_amount =
    (Number(certInfo.price) / Number(certInfo.total_sessions)) * Number(payment_percentage);

  // 4. Додаємо запис у salary_records
  await client.query(
    `INSERT INTO salary_records 
      (deduction_id, user_id, system_id, payment_percentage, payment_amount, created_at)
     VALUES (
      (SELECT deduction_id FROM session_deductions 
       WHERE certificate_id = $1 AND event_id = $2 AND user_id = $3 AND client_id = $4 AND system_id = $5
       ORDER BY deduction_id DESC LIMIT 1),
      $3, $5, $6, $7, NOW()
     )`,
    [certificate_id, event_id, user_id, client_id, system_id, payment_percentage, payment_amount]
  );
      }

      // Змінюємо стан події на неактивний
      await client.query(
        `UPDATE events
         SET is_active = FALSE, color = '#808080'
         WHERE event_id = $1`,
        [event_id]
      );

      

      await client.query('COMMIT');
      res.status(200).json({ message: 'Заняття успішно списані' });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Помилка списання занять:', err.message);
      res.status(500).json({ error: 'Не вдалося списати заняття' });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Помилка підключення до бази даних:', err.message);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});





module.exports = router;