import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { pool } from './config/db.js';
import errorHandler from './middleware/errorHandler.js';
import accountRoutes from './routes/accountRoutes.js';
import postRoutes from './routes/postRoutes.js';

dotenv.config();

const app = express();

// ✅ CORS
app.use(cors({  
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// ⚙️ Helmet sau CORS
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false
}));

if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 🧠 Kiểm tra kết nối PostgreSQL
pool.query('SELECT NOW()')
  .then(res => console.log(`✅ Database connected at ${res.rows[0].now}`))
  .catch(err => console.error('❌ Database connection failed:', err.message));

// Health check
app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT 1 AS status');
    res.json({ status: 'OK', database: 'Connected', data: result.rows });
  } catch (err) {
    res.status(500).json({ status: 'Error', database: 'Disconnected', message: err.message });
  }
});

// API routes
app.use('/api/accounts', accountRoutes);
app.use('/api/posts', postRoutes);

// Root
app.get('/', (req, res) => {
  res.json({
    message: 'Lost & Found Platform API (PostgreSQL)',
    version: '1.0.0',
    status: 'Running'
  });
});

// 404
app.use('*', (req, res) =>
  res.status(404).json({ message: 'Route not found', path: req.originalUrl })
);

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('Server running on port 5000');
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
});
