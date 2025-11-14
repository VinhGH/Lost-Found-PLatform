import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Lấy thông tin kết nối Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Kiểm tra biến môi trường
if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Thiếu thông tin Supabase trong file .env");
  console.error("Cần SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Tạo Supabase client (quyền Service Role)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test kết nối
const testConnection = async () => {
  try {
    console.log("🔄 Đang kiểm tra kết nối Supabase...");

    const { error } = await supabase
      .from("Account")
      .select("account_id")
      .limit(1);

    if (error) {
      console.error("❌ Lỗi kết nối Supabase:", error.message);
      return false;
    }

    console.log("✅ Kết nối Supabase thành công!");
    return true;
  } catch (err) {
    console.error("❌ Lỗi khi kiểm tra kết nối:", err.message);
    return false;
  }
};

// Hàm trả về supabase client
const getSupabaseClient = () => supabase;

// Wrapper chạy query kèm error handling
const executeQuery = async (queryFn) => {
  try {
    const { data, error } = await queryFn(supabase);
    return { success: !error, data, error };
  } catch (err) {
    return { success: false, data: null, error: err.message };
  }
};

export { supabase, getSupabaseClient, testConnection, executeQuery };
