import { supabase } from "../../config/db.js";

export const getAllStudents = async () => {
  const { data, error } = await supabase
    .from("Account")
    .select("account_id, email, user_name, avatar, phone_number, created_at")
    .eq("role", "Student")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

export const getAllPosts = async () => {
  // Query with correct column names (PascalCase)
  const { data, error } = await supabase
    .from("Post")
    .select(`
      Post_id,
      Post_type,
      Post_Title,
      Item_name,
      Status,
      Created_at,
      Account_id,
      Location_id
    `)
    .order("Created_at", { ascending: false });

  if (error) throw new Error(error.message);
  
  return data;
};
