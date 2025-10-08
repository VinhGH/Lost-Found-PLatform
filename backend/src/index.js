require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const { poolConnect } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');

const app = express();

// ✅ CORS cấu hình trước các middleware khác
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// ⚠️ Helmet để SAU CORS để tránh ghi đè header
app.use(helmet({
  crossOriginResourcePolicy: false, // tránh xung đột với cors
  crossOriginEmbedderPolicy: false
}));

if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Kiểm tra kết nối DB
poolConnect
  .then(() => console.log('✅ Database is ready to use'))
  .catch(err => {
    console.error('❌ Database connection failed:', err);
    console.log('⚠️  Server will continue running without database connection');
  });

// Health check
app.get('/health', async (req, res) => {
  try {
    const { pool } = require('./config/db');
    const result = await pool.request().query('SELECT 1 AS status');
    res.json({ status: 'OK', database: 'Connected', data: result.recordset });
  } catch (err) {
    res.status(500).json({ status: 'Error', database: 'Disconnected', message: err.message });
  }
});

// API routes
app.use('/api', routes);

// Root
app.get('/', (req, res) => {
  res.json({
    message: 'Lost & Found Platform API',
    version: '1.0.0',
    status: 'Running'
  });
});

// 404
app.use('*', (req, res) => res.status(404).json({ message: 'Route not found', path: req.originalUrl }));

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
});
