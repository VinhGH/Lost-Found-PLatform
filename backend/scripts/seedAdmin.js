// backend/scripts/seedAdmin.js
require('dotenv').config();
const { sql, pool } = require('../src/config/db');
const { hashPassword } = require('../src/utils/hash');

/**
 * Seed script to insert a default Admin account
 * Creates an admin user with the following details:
 * - Email: admin@dtu.edu.vn
 * - Password: Admin@123 (hashed with bcrypt)
 * - Role: Admin
 * - User_name: Admin DTU
 * - Phone_number: 0900000000
 */
async function seedAdmin() {
  try {
    console.log('🌱 Starting admin seed script...');

    // Connect to database
    await pool.connect();
    console.log('✅ Connected to database');

    // Hash the default password
    const plainPassword = 'Admin@123';
    const hashedPassword = await hashPassword(plainPassword);
    console.log('✅ Password hashed successfully');

    // Check if admin already exists
    const checkQuery = `
      SELECT Account_id, Email 
      FROM Account 
      WHERE Email = @email
    `;

    const checkRequest = pool.request();
    checkRequest.input('email', sql.NVarChar(255), 'admin@dtu.edu.vn');

    const existingAdmin = await checkRequest.query(checkQuery);

    if (existingAdmin.recordset.length > 0) {
      console.log('ℹ️  Admin account already exists. Skipping insertion.');
      console.log('📧 Existing admin email:', existingAdmin.recordset[0].Email);
      return;
    }

    // Insert new admin account
    const insertQuery = `
      INSERT INTO Account (
        Account_id, 
        Email, 
        Password, 
        Role, 
        User_name, 
        Phone_number, 
        Created_at
      ) VALUES (
        @accountId,
        @email,
        @password,
        @role,
        @userName,
        @phoneNumber,
        @createdAt
      )
    `;

    const insertRequest = pool.request();
    insertRequest.input('accountId', sql.Int, 1);
    insertRequest.input('email', sql.NVarChar(255), 'admin@dtu.edu.vn');
    insertRequest.input('password', sql.NVarChar(255), hashedPassword);
    insertRequest.input('role', sql.NVarChar(50), 'Admin');
    insertRequest.input('userName', sql.NVarChar(255), 'Admin DTU');
    insertRequest.input('phoneNumber', sql.NVarChar(20), '0900000000');
    insertRequest.input('createdAt', sql.DateTime, new Date());

    await insertRequest.query(insertQuery);

    console.log('✅ Admin account created successfully!');
    console.log('📧 Email: admin@dtu.edu.vn');
    console.log('🔑 Password: Admin@123');
    console.log('👤 Role: Admin');
    console.log('📱 Phone: 0900000000');
    console.log('🆔 Account ID: 1');
  } catch (error) {
    console.error('❌ Error seeding admin account:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    // Close database connection
    try {
      await pool.close();
      console.log('🔌 Database connection closed');
    } catch (closeError) {
      console.error('⚠️  Error closing database connection:', closeError.message);
    }
  }
}

// Run the seed function
if (require.main === module) {
  seedAdmin()
    .then(() => {
      console.log('🎉 Admin seed script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Admin seed script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { seedAdmin };
