import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load biến môi trường
dotenv.config();

// Lấy thông tin kết nối từ biến môi trường
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Kiểm tra xem các biến môi trường có tồn tại không
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Thiếu thông tin kết nối Supabase trong file .env');
  console.error('Vui lòng kiểm tra SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Tạo Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Hàm kiểm tra kết nối database
const testConnection = async () => {
  try {
    console.log('🔄 Đang kiểm tra kết nối Supabase...');
    
    // Thử thực hiện một query đơn giản để kiểm tra kết nối
    const { error } = await supabase
      .from('Account')
      .select('account_id')
      .limit(1);
    
    if (error) {
      console.error('❌ Lỗi kết nối Supabase:', error.message);
      return false;
    }
    
    console.log('✅ Kết nối Supabase thành công!');
    return true;
  } catch (err) {
    console.error('❌ Lỗi khi kiểm tra kết nối:', err.message);
    return false;
  }
};

// Hàm lấy Supabase client
const getSupabaseClient = () => {
  return supabase;
};

// Hàm thực hiện query với error handling
const executeQuery = async (queryFn) => {
  try {
    const result = await queryFn(supabase);
    return { success: true, data: result.data, error: result.error };
  } catch (err) {
    console.error('❌ Lỗi thực hiện query:', err.message);
    return { success: false, data: null, error: err.message };
  }
};

export {
  supabase,
  getSupabaseClient,
  testConnection,
  executeQuery
};
