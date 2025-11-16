/**
 * Server Startup Script with Error Handling
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

// Check if .env file exists
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting Lost & Found Platform Backend...');
console.log('📁 Working directory:', __dirname);

// Check required environment variables
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(envVar => {
    console.error(`   - ${envVar}`);
  });
  console.error('\n📋 Please create a .env file with the following variables:');
  console.error('SUPABASE_URL=your_supabase_url');
  console.error('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  console.error('JWT_SECRET=your_jwt_secret');
  console.error('\n📖 See ENV_SETUP_GUIDE.md for detailed instructions.');
  process.exit(1);
}

console.log('✅ Environment variables loaded successfully');

// Import and start the main application
try {
  console.log('🔄 Loading application...');
  await import('./src/index.js');
} catch (error) {
  console.error('❌ Failed to start application:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}
