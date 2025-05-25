
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db'); // Підключення БД

// Підключення маршрутів
const hallsRoutes = require('./routes/halls'); 
const categoriesRoutes = require('./routes/categories');
const servicesRoutes = require('./routes/services');
const registerRoutes = require('./routes/register');
const loginRoutes = require('./routes/login');
const usersRoutes = require('./routes/users');
const clientsRoutes = require('./routes/clients');
const certificatesRoutes = require('./routes/certificates');
const financesRoutes = require('./routes/finances');
const calendarRoutes = require('./routes/calendar');
const salaryRoutes = require('./routes/salary');
 

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Маршрути
app.use('/halls', hallsRoutes);
app.use('/categories', categoriesRoutes);
app.use('/services', servicesRoutes);
app.use('/register', registerRoutes);
app.use('/login', loginRoutes);
app.use('/users', usersRoutes);
app.use('/clients', clientsRoutes);
app.use('/certificates', certificatesRoutes);
app.use('/finances', financesRoutes);
app.use('/calendar', calendarRoutes);
app.use('/salary', salaryRoutes);

process.on('SIGINT', async () => {
  console.log('Closing database connection...');
  await pool.end();
  console.log('Database connection closed.');
  process.exit(0);
});

app.listen(port, () => {
  console.log(`Сервер працює на порту ${port}`);
});