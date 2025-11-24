/**
 * Migration Script: Add approved_at field to Lost_Post and Found_Post tables
 * 
 * This script adds the approved_at field to track when a post was approved by admin.
 * Run this script once to update your database schema.
 * 
 * Usage: node scripts/addApprovedAtField.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Thiếu thông tin kết nối Supabase trong file .env');
  console.error('Vui lòng kiểm tra SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🔄 Bắt đầu migration: Thêm field approved_at...\n');

  try {
    // 1. Add approved_at to Lost_Post
    console.log('📝 Đang thêm field approved_at vào bảng Lost_Post...');
    const { error: error1 } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE "Lost_Post" ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;'
    });

    // Nếu RPC không hoạt động, thử cách khác
    if (error1) {
      console.log('⚠️ RPC không khả dụng, thử cách khác...');
      // Thử query trực tiếp (có thể không hoạt động với Supabase client)
      // Trong trường hợp này, bạn cần chạy SQL qua Supabase Dashboard
      console.log('❌ Không thể chạy ALTER TABLE qua Supabase client.');
      console.log('📋 Vui lòng chạy SQL sau trong Supabase Dashboard > SQL Editor:\n');
      console.log('-- Add approved_at to Lost_Post');
      console.log('ALTER TABLE "Lost_Post" ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;');
      console.log('');
      console.log('-- Add approved_at to Found_Post');
      console.log('ALTER TABLE "Found_Post" ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;');
      console.log('');
      console.log('-- Update existing approved posts');
      console.log('UPDATE "Lost_Post" SET approved_at = updated_at WHERE status = \'Approved\' AND approved_at IS NULL;');
      console.log('UPDATE "Found_Post" SET approved_at = updated_at WHERE status = \'Approved\' AND approved_at IS NULL;');
      return;
    }

    // 2. Add approved_at to Found_Post
    console.log('📝 Đang thêm field approved_at vào bảng Found_Post...');
    const { error: error2 } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE "Found_Post" ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;'
    });

    if (error2) {
      console.error('❌ Lỗi khi thêm field vào Found_Post:', error2.message);
      return;
    }

    // 3. Update existing approved posts
    console.log('📝 Đang cập nhật các bài đăng đã duyệt...');
    const { error: error3 } = await supabase
      .from('Lost_Post')
      .update({ approved_at: supabase.raw('updated_at') })
      .eq('status', 'Approved')
      .is('approved_at', null);

    if (error3) {
      console.error('⚠️ Lỗi khi cập nhật Lost_Post:', error3.message);
    }

    const { error: error4 } = await supabase
      .from('Found_Post')
      .update({ approved_at: supabase.raw('updated_at') })
      .eq('status', 'Approved')
      .is('approved_at', null);

    if (error4) {
      console.error('⚠️ Lỗi khi cập nhật Found_Post:', error4.message);
    }

    console.log('\n✅ Migration hoàn tất!');
    console.log('✅ Field approved_at đã được thêm vào cả 2 bảng Lost_Post và Found_Post');
    console.log('✅ Các bài đăng đã duyệt đã được cập nhật với approved_at = updated_at');

  } catch (error) {
    console.error('❌ Lỗi khi chạy migration:', error.message);
    console.error('\n📋 Nếu script không hoạt động, vui lòng chạy SQL sau trong Supabase Dashboard > SQL Editor:');
    console.log('\n-- Copy và paste SQL sau vào Supabase Dashboard > SQL Editor:\n');
    console.log('ALTER TABLE "Lost_Post" ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;');
    console.log('ALTER TABLE "Found_Post" ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;');
    console.log('UPDATE "Lost_Post" SET approved_at = updated_at WHERE status = \'Approved\' AND approved_at IS NULL;');
    console.log('UPDATE "Found_Post" SET approved_at = updated_at WHERE status = \'Approved\' AND approved_at IS NULL;');
  }
}

// Run migration
runMigration();

