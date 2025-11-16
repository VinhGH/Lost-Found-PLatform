// backend/scripts/seedAdmin.js
import dotenv from 'dotenv';
import { supabase } from '../src/config/db.js';
import { hashPassword } from '../src/utils/hash.js';

// Load environment variables
dotenv.config();

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
    console.log('✅ Connected to Supabase');

    // Hash the default password
    const plainPassword = 'Admin@123';
    const hashedPassword = await hashPassword(plainPassword);
    console.log('✅ Password hashed successfully');

    // Check if admin already exists
    const { data: existingAdmin, error: checkError } = await supabase
      .from('Account')
      .select('account_id, email')
      .eq('email', 'admin@dtu.edu.vn')
      .single();

    if (existingAdmin && !checkError) {
      console.log('ℹ️  Admin account already exists. Skipping insertion.');
      console.log('📧 Existing admin email:', existingAdmin.email);
      return;
    }

    // Insert new admin account
    const { data: newAdmin, error: insertError } = await supabase
      .from('Account')
      .insert({
        email: 'admin@dtu.edu.vn',
        password: hashedPassword,
        role: 'Admin',
        user_name: 'Admin DTU',
        phone_number: '0900000000',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to insert admin: ${insertError.message}`);
    }

    console.log('✅ Admin account created successfully!');
    console.log('📧 Email: admin@dtu.edu.vn');
    console.log('🔑 Password: Admin@123');
    console.log('👤 Role: Admin');
    console.log('📱 Phone: 0900000000');
    console.log('🆔 Account ID:', newAdmin.account_id);
  } catch (error) {
    console.error('❌ Error seeding admin account:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the seed function
seedAdmin()
  .then(() => {
    console.log('🎉 Admin seed script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Admin seed script failed:', error.message);
    process.exit(1);
  });

export { seedAdmin };
