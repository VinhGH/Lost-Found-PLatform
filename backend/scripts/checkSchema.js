/**
 * Script to check current Supabase schema
 * Run: node backend/scripts/checkSchema.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('\n🔍 Checking Supabase Schema...\n');
  
  // Get all tables
  const { data: tables, error } = await supabase
    .rpc('get_tables_info', {});
  
  if (error) {
    // If RPC doesn't exist, use direct query
    const query = `
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position;
    `;
    
    const { data, error: queryError } = await supabase
      .from('_query')
      .select('*')
      .eq('query', query);
    
    if (queryError) {
      console.log('📋 Trying alternative method...\n');
      
      // Check individual tables
      const tableNames = [
        'Account',
        'Location', 
        'Post',
        'Images',
        'Post_Images',
        'Match_Post',
        'Notification'
      ];
      
      for (const tableName of tableNames) {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(0);
        
        if (error) {
          console.log(`❌ Table "${tableName}": ${error.message}`);
        } else {
          console.log(`✅ Table "${tableName}": EXISTS`);
        }
      }
      
      return;
    }
  }
  
  console.log('✅ Schema check complete!\n');
}

checkSchema().catch(console.error);

