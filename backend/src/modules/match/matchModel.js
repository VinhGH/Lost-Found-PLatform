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
}

export default new MatchModel();
