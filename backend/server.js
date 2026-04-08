
const express = require('express');
const cors = require('cors');
const connectDB = require('./models/db');
require('dotenv').config();

const pingRoutes = require('./routes/ping');
const attendanceRoutes = require('./routes/attendance');
const usersRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const employeesRoutes = require('./routes/employees');
const expensesRoutes = require('./routes/expenses');

const app = express();
const PORT = process.env.PORT || 8080;

// MongoDBga ulanish va serverni ishga tushirish
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`✅ Server started on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Server startup error:', error.message);
  }
};

app.use(cors());
app.use(express.json());

// routes
app.use('/api/ping', pingRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/expenses', expensesRoutes);

// Test route
app.get('/', (req, res) => {
  res.send('Server is running!');
});

startServer();
