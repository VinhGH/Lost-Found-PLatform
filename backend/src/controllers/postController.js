import supabase from '../supabaseClient.js';

export const getPosts = async (req, res) => {
  try {
    // Query Supabase with JOIN between Post and Account tables
    const { data, error } = await supabase
      .from('post')
      .select(`
        post_id,
        post_type,
        post_title,
        item_name,
        status,
        created_at,
        account:account_id (
          user_name,
          email
        )
      `);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch posts',
        error: error.message
      });
    }

    // Return successful response with post data
    res.status(200).json({
      success: true,
      message: 'Posts retrieved successfully',
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
