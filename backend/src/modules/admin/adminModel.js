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

/**
 * Get all users (Students) with optional filters
 * @param {Object} filters - { search, isLocked }
 * @returns {Promise<Array>}
 */
export const getAllUsers = async (filters = {}) => {
  try {
    let query = supabase
      .from("Account")
      .select("account_id, email, user_name, avatar, phone_number, address, is_locked, created_at")
      .eq("role", "Student")
      .order("created_at", { ascending: false });

    // Apply search filter if provided
    if (filters.search) {
      query = query.or(`user_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    // Apply lock status filter if provided
    if (filters.isLocked !== undefined) {
      query = query.eq("is_locked", filters.isLocked);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);

    // Format data to match frontend expectations
    const formattedData = (data || []).map(user => ({
      id: user.account_id,
      name: user.user_name,
      username: user.email?.split('@')[0],
      email: user.email,
      avatar: user.avatar,
      phone: user.phone_number,
      address: user.address,
      isLocked: user.is_locked || false,
      createdDate: user.created_at
    }));

    return formattedData;
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 * Lock a user account
 * @param {number} userId
 * @returns {Promise<Object>}
 */
export const lockUser = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("Account")
      .update({ is_locked: true })
      .eq("account_id", userId)
      .eq("role", "Student") // Only allow locking Student accounts
      .select()
      .single();

    if (error) throw new Error(error.message);

    if (!data) {
      throw new Error("User not found or is not a Student");
    }

    return data;
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 * Unlock a user account
 * @param {number} userId
 * @returns {Promise<Object>}
 */
export const unlockUser = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("Account")
      .update({ is_locked: false })
      .eq("account_id", userId)
      .eq("role", "Student") // Only allow unlocking Student accounts
      .select()
      .single();

    if (error) throw new Error(error.message);

    if (!data) {
      throw new Error("User not found or is not a Student");
    }

    return data;
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 * Delete a user account with cascade delete of related posts
 * @param {number} userId
 * @returns {Promise<Object>}
 */
export const deleteUser = async (userId) => {
  try {
    // Step 1: Delete all Lost_Post by this user first (cascade delete)
    const { error: lostPostsError } = await supabase
      .from("Lost_Post")
      .delete()
      .eq("account_id", userId);

    if (lostPostsError) {
      console.warn("Warning deleting user lost posts:", lostPostsError.message);
      // Continue anyway - user might not have posts
    }

    // Step 2: Delete all Found_Post by this user
    const { error: foundPostsError } = await supabase
      .from("Found_Post")
      .delete()
      .eq("account_id", userId);

    if (foundPostsError) {
      console.warn("Warning deleting user found posts:", foundPostsError.message);
    }

    // Step 3: Now delete the user account
    const { data, error } = await supabase
      .from("Account")
      .delete()
      .eq("account_id", userId)
      .eq("role", "Student") // Only allow deleting Student accounts
      .select()
      .single();

    if (error) throw new Error(error.message);

    if (!data) {
      throw new Error("User not found or is not a Student");
    }

    return data;
  } catch (error) {
    throw new Error(error.message);
  }
};
