// =======================================
// 📂 backend/src/config/db.js
// PostgreSQL Connection (Supabase + Local fallback)
// =======================================
import dotenv from 'dotenv';
import pkg from 'pg';

dotenv.config();
const { Pool } = pkg;

let pool;

// 🧠 Ưu tiên dùng Supabase (DATABASE_URL)
console.log('🔍 DATABASE_URL =', process.env.DATABASE_URL);

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }); 
  console.log('🌐 Using Supabase cloud database...');
} else {
  // 💻 Nếu không có DATABASE_URL thì dùng PostgreSQL local
  pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'Admin123',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'lostandfound',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });
  console.log('💻 Using local PostgreSQL database...');
}

// ✅ Kiểm tra kết nối khi khởi động
pool
  .connect()
  .then(() => console.log('✅ Database connected successfully!'))
  .catch((err) => {
    console.error('❌ Database connection failed:', err.message);
    console.warn('⚠️ Server will continue running without DB connection...');
  });

export { pool };
