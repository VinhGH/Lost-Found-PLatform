import { supabase } from '../../config/db.js';

class MatchModel {
  /**
   * Create a new match between lost and found posts
   * @param {string} postId
   * @param {number} confidenceScore
   * @returns {Promise<Object>}
   */
  async createMatch(postId, confidenceScore = 0.8) {
    try {
      const { data, error } = await supabase
        .from('Match_Post')
        .insert([{
          Post_id: postId,
          Confidence_score: confidenceScore,
          Matched_at: new Date().toISOString()
        }])
        .select(`
          Match_id,
          Post_id,
          Confidence_score,
          Matched_at,
          Post:Post_id (
            Post_id,
            Post_Title,
            Post_type,
            Item_name,
            Status,
            Account_id
          )
        `)
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data,
        error: null
      };
    } catch (err) {
      console.error('Error creating match:', err.message);
      return {
        success: false,
        data: null,
        error: err.message
      };
    }
  }

  /**
   * Get matches by post ID
   * @param {string} postId
   * @returns {Promise<Object>}
   */
  async getMatchesByPostId(postId) {
    try {
      const { data, error } = await supabase
        .from('Match_Post')
        .select(`
          Match_id,
          Post_id,
          Confidence_score,
          Matched_at,
          Post:Post_id (
            Post_id,
            Post_Title,
            Post_type,
            Item_name,
            Status,
            Account_id
          )
        `)
        .eq('Post_id', postId)
        .order('Matched_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: data || [],
        error: null
      };
    } catch (err) {
      console.error('Error getting matches by post ID:', err.message);
      return {
        success: false,
        data: null,
        error: err.message
      };
    }
  }

  /**
   * Get matches by account ID
   * @param {number} accountId
   * @returns {Promise<Object>}
   */
  async getMatchesByAccountId(accountId) {
    try {
      const { data, error } = await supabase
        .from('Match_Post')
        .select(`
          Match_id,
          Post_id,
          Confidence_score,
          Matched_at,
          Post:Post_id (
            Post_id,
            Post_Title,
            Post_type,
            Item_name,
            Status,
            Account_id
          )
        `)
        .order('Matched_at', { ascending: false });

      if (error) throw error;

      // Filter matches where the post belongs to the account
      const filteredMatches = data.filter(match => 
        match.Post && match.Post.Account_id === accountId
      );

      return {
        success: true,
        data: filteredMatches,
        error: null
      };
    } catch (err) {
      console.error('Error getting matches by account ID:', err.message);
      return {
        success: false,
        data: null,
        error: err.message
      };
    }
  }

  /**
   * Update match status
   * @param {string} matchId
   * @param {string} status
   * @returns {Promise<Object>}
   */
  async updateMatchStatus(matchId, status) {
    try {
      const { data, error } = await supabase
        .from('Match_Post')
        .update({
          Confidence_score: status === 'approved' ? 1.0 : 0.0
        })
        .eq('Match_id', matchId)
        .select(`
          Match_id,
          Post_id,
          Confidence_score,
          Matched_at
        `)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return {
        success: true,
        data: data,
        error: null
      };
    } catch (err) {
      console.error('Error updating match status:', err.message);
      return {
        success: false,
        data: null,
        error: err.message
      };
    }
  }

  /**
   * Delete match
   * @param {string} matchId
   * @returns {Promise<Object>}
   */
  async deleteMatch(matchId) {
    try {
      const { error } = await supabase
        .from('Match_Post')
        .delete()
        .eq('Match_id', matchId);

      if (error) throw error;

      return {
        success: true,
        data: null,
        error: null
      };
    } catch (err) {
      console.error('Error deleting match:', err.message);
      return {
        success: false,
        data: null,
        error: err.message
      };
    }
  }

  /**
   * Get all matches
   * @param {Object} filters
   * @returns {Promise<Object>}
   */
  async getAllMatches(filters = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'Matched_at',
        sortOrder = 'desc'
      } = filters;

      let query = supabase
        .from('Match_Post')
        .select(`
          Match_id,
          Post_id,
          Confidence_score,
          Matched_at,
          Post:Post_id (
            Post_id,
            Post_Title,
            Post_type,
            Item_name,
            Status,
            Account_id
          )
        `, { count: 'exact' });

      // Apply sorting
      const ascending = sortOrder === 'asc';
      query = query.order(sortBy, { ascending });

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        success: true,
        data: data || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        },
        error: null
      };
    } catch (err) {
      console.error('Error getting all matches:', err.message);
      return {
        success: false,
        data: null,
        error: err.message
      };
    }
  }

  /**
   * Helper: Get images for a post
   * @private
   */
  async _getPostImages(postId, postType) {
    try {
      if (postType === 'lost') {
        const { data, error } = await supabase
          .from('Lost_Post_Images')
          .select(`
            Lost_Images!inner(link_picture)
          `)
          .eq('lost_post_id', postId);

        if (error || !data) return [];
        return data.map(item => item.Lost_Images.link_picture).filter(Boolean);
      } else {
        const { data, error } = await supabase
          .from('Found_Post_Images')
          .select(`
            Found_Images!inner(link_picture)
          `)
          .eq('found_post_id', postId);

        if (error || !data) return [];
        return data.map(item => item.Found_Images.link_picture).filter(Boolean);
      }
    } catch (err) {
      console.error(`Error getting ${postType} post images:`, err);
      return [];
    }
  }

  /**
   * Get recent approved posts for AI matching (last 30 days)
   * @returns {Promise<Object>}
   */
  async getRecentApprovedPosts() {
    try {
      // Calculate date 30 days ago
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

      const { data, error } = await supabase
        .from('Post')
        .select(`
          Post_id,
          Post_Title,
          Post_type,
          Item_name,
          Description,
          Status,
          Created_at,
          Approved_at,
          Account_id,
          Location:Location_id (
            Location_id,
            Location_name
          ),
          Category:Category_id (
            Category_id,
            Category_name
          )
        `)
        .eq('Status', 'approved')
        .gte('Approved_at', thirtyDaysAgoISO)
        .order('Approved_at', { ascending: false });

      if (error) throw error;

      // Flatten location and category data, and add images
      const posts = await Promise.all((data || []).map(async (post) => {
        const imageUrls = await this._getPostImages(post.Post_id, post.Post_type);
        
        return {
          Post_id: post.Post_id,
          Post_Title: post.Post_Title,
          Post_type: post.Post_type,
          Item_name: post.Item_name,
          Description: post.Description,
          Status: post.Status,
          Created_at: post.Created_at,
          Approved_at: post.Approved_at,
          Account_id: post.Account_id,
          Location_id: post.Location?.Location_id,
          Location_name: post.Location?.Location_name,
          Category_id: post.Category?.Category_id,
          Category_name: post.Category?.Category_name,
          Image_urls: imageUrls, // Array of image URLs
        };
      }));

      return {
        success: true,
        data: posts,
        error: null
      };
    } catch (err) {
      console.error('Error getting recent approved posts:', err.message);
      return {
        success: false,
        data: null,
        error: err.message
      };
    }
  }

  /**
   * Create multiple matches at once (batch creation)
   * @param {Array} matches - Array of match objects with post1, post2, similarity
   * @returns {Promise<Object>}
   */
  async createBatchMatches(matches) {
    try {
      if (!matches || matches.length === 0) {
        return {
          success: true,
          data: [],
          error: null
        };
      }

      // Prepare batch insert data
      const insertData = [];
      
      for (const match of matches) {
        const { post1, post2, similarity } = match;
        
        // Create match for post1
        insertData.push({
          Post_id: post1.Post_id,
          Confidence_score: similarity,
          Matched_at: new Date().toISOString()
        });

        // Create match for post2
        insertData.push({
          Post_id: post2.Post_id,
          Confidence_score: similarity,
          Matched_at: new Date().toISOString()
        });
      }

      // Check for existing matches to avoid duplicates
      const postIds = insertData.map(m => m.Post_id);
      const { data: existingMatches } = await supabase
        .from('Match_Post')
        .select('Post_id, Matched_at')
        .in('Post_id', postIds);

      // Filter out matches that already exist (created in last 24 hours)
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      const existingPostIds = new Set(
        (existingMatches || [])
          .filter(m => new Date(m.Matched_at) > oneDayAgo)
          .map(m => m.Post_id)
      );

      const newMatches = insertData.filter(m => !existingPostIds.has(m.Post_id));

      if (newMatches.length === 0) {
        console.log('ℹ️ No new matches to create (all already exist)');
        return {
          success: true,
          data: [],
          count: 0,
          error: null
        };
      }

      // Insert new matches
      const { data, error } = await supabase
        .from('Match_Post')
        .insert(newMatches)
        .select(`
          Match_id,
          Post_id,
          Confidence_score,
          Matched_at,
          Post:Post_id (
            Post_id,
            Post_Title,
            Post_type,
            Item_name,
            Status,
            Account_id
          )
        `);

      if (error) throw error;

      console.log(`✅ Created ${data?.length || 0} new matches`);

      return {
        success: true,
        data: data || [],
        count: data?.length || 0,
        error: null
      };
    } catch (err) {
      console.error('Error creating batch matches:', err.message);
      return {
        success: false,
        data: null,
        error: err.message
      };
    }
  }

  /**
   * Check if a match already exists for a post
   * @param {string} postId
   * @returns {Promise<boolean>}
   */
  async matchExists(postId) {
    try {
      const { data, error } = await supabase
        .from('Match_Post')
        .select('Match_id')
        .eq('Post_id', postId)
        .limit(1);

      if (error) throw error;

      return (data && data.length > 0);
    } catch (err) {
      console.error('Error checking match existence:', err.message);
      return false;
    }
  }
}

export default new MatchModel();
