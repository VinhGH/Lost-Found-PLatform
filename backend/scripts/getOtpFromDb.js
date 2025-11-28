/**
 * Script to get OTP from database for testing
 * Usage: node scripts/getOtpFromDb.js <email>
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide email as argument');
  console.log('Usage: node scripts/getOtpFromDb.js <email>');
  process.exit(1);
}

async function getOtp() {
  try {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('email', email)
      .eq('is_used', false)
      .gt('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) {
      console.log('❌ No valid OTP found for:', email);
      console.log('💡 Check if:');
      console.log('   - OTP has expired');
      console.log('   - OTP has been used');
      console.log('   - Email is correct');
      return;
    }

    console.log('\n✅ Found OTP for:', email);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔑 OTP Code:', data.otp_code);
    console.log('📧 Email:', data.email);
    console.log('⏰ Expires at:', new Date(data.expires_at).toLocaleString());
    console.log('📅 Created at:', new Date(data.created_at).toLocaleString());
    console.log('🆔 OTP ID:', data.id);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

getOtp();

