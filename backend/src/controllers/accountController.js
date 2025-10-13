import { supabase } from '../config/db.js';

export const getAccounts = async (req, res) => {
  try {
    // Query Supabase to get account data with specified fields
    const { data, error } = await supabase
      .from('Account')
      .select('account_id, email, user_name, role, phone_number, created_at');

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch accounts',
        error: error.message
      });
    }

    // Return successful response with account data
    res.status(200).json({
      success: true,
      message: 'Accounts retrieved successfully',
      data: data
    });

  } catch (error) {
    console.error('Controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
