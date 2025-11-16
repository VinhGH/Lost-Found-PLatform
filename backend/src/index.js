import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { supabase, testConnection } from './config/db.js';
import errorHandler from './middleware/errorHandler.js';
import routes from './routes/index.js';
import adminRoutes from './modules/admin/adminRoutes.js';

dotenv.config();

const app = express();

// ✅ CORS - Allow both Vite (5173) and Create React App (3000)
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    process.env.CORS_ORIGIN
  ].filter(Boolean),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
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

// 🧠 Kiểm tra kết nối Supabase
testConnection();

// Health check
app.get('/health', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('Account')
      .select('account_id')
      .limit(1);
    
    if (error) {
      throw error;
    }
    
    res.json({ status: 'OK', database: 'Connected', data: { count: data?.length || 0 } });
  } catch (err) {
    res.status(500).json({ status: 'Error', database: 'Disconnected', message: err.message });
  }
});

// API routes
app.use('/api', routes);
app.use('/api/admin', adminRoutes);

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
