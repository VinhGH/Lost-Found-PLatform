import { supabase } from '../../config/db.js';

class MatchModel {
  /**
   * Create a new match between lost and found posts
   * @param {number} lostPostId - Integer ID of lost post
   * @param {number} foundPostId - Integer ID of found post
   * @param {number} confidenceScore
   * @returns {Promise<Object>}
   */
  async createMatch(lostPostId, foundPostId, confidenceScore = 0.8) {
    try {
      const { data, error } = await supabase
        .from('Match_Post')
        .insert([{
          lost_post_id: lostPostId,
          found_post_id: foundPostId,
          confidence_score: confidenceScore,
          matched_at: new Date().toISOString()
        }])
        .select(`
          match_id,
          lost_post_id,
          found_post_id,
          confidence_score,
          matched_at,
          Lost_Post:lost_post_id (
            lost_post_id,
            post_title,
            post_type,
            item_name,
            status,
            account_id
          ),
          Found_Post:found_post_id (
            found_post_id,
            post_title,
            post_type,
            item_name,
            status,
            account_id
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
   * @param {string} postId - Format: "L55" or "F43"
   * @returns {Promise<Object>}
   */
  async getMatchesByPostId(postId) {
    try {
      // Parse postId to determine type and numeric ID
      const isLost = postId.startsWith('L');
      const numericId = parseInt(postId.substring(1));

      if (isNaN(numericId)) {
        return {
          success: false,
          data: null,
          error: 'Invalid post ID format'
        };
      }

      const { data, error } = await supabase
        .from('Match_Post')
        .select(`
          match_id,
          lost_post_id,
          found_post_id,
          confidence_score,
          matched_at,
          Lost_Post:lost_post_id (
            lost_post_id,
            post_title,
            item_name,
            status,
            account_id
          ),
          Found_Post:found_post_id (
            found_post_id,
            post_title,
            item_name,
            status,
            account_id
          )
        `)
        .eq(isLost ? 'lost_post_id' : 'found_post_id', numericId)
        .order('matched_at', { ascending: false });

      if (error) throw error;

      // Format response to match expected structure
      const formattedData = (data || []).map(match => ({
        Match_id: match.match_id,
        Post_id: isLost ? `F${match.found_post_id}` : `L${match.lost_post_id}`,
        Confidence_score: match.confidence_score,
        Matched_at: match.matched_at,
        Post: isLost ? {
          Post_id: `F${match.found_post_id}`,
          Post_Title: match.Found_Post?.post_title,
          Post_type: 'found',
          Item_name: match.Found_Post?.item_name,
          Status: match.Found_Post?.status,
          Account_id: match.Found_Post?.account_id
        } : {
          Post_id: `L${match.lost_post_id}`,
          Post_Title: match.Lost_Post?.post_title,
          Post_type: 'lost',
          Item_name: match.Lost_Post?.item_name,
          Status: match.Lost_Post?.status,
          Account_id: match.Lost_Post?.account_id
        }
      }));

      return {
        success: true,
        data: formattedData,
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
      // Get all matches with both Lost_Post and Found_Post information
      const { data, error } = await supabase
        .from('Match_Post')
        .select(`
          match_id,
          confidence_score,
          matched_at,
          lost_post_id,
          found_post_id,
          Lost_Post:lost_post_id (
            lost_post_id,
            post_title,
            item_name,
            description,
            status,
            account_id,
            location_id,
            category_id
          ),
          Found_Post:found_post_id (
            found_post_id,
            post_title,
            item_name,
            description,
            status,
            account_id,
            location_id,
            category_id
          )
        `)
        .order('matched_at', { ascending: false });

      if (error) {
        console.error('Supabase error in getMatchesByAccountId:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log('No matches found in database');
        return {
          success: true,
          data: [],
          error: null
        };
      }

      // Filter and format results
      const allMatches = [];

      for (const match of data) {
        // Check if user's Lost_Post matched with someone's Found_Post
        if (match.Lost_Post && match.Lost_Post.account_id === accountId && match.Found_Post) {
          // Fetch images for the matched Found_Post
          const imageUrls = await this._getPostImages(match.found_post_id, 'found');

          allMatches.push({
            Match_id: match.match_id,
            Post_id: `F${match.found_post_id}`,
            Confidence_score: match.confidence_score,
            Matched_at: match.matched_at,
            // Matched post (from other user)
            Post: {
              Post_id: `F${match.found_post_id}`,
              Post_Title: match.Found_Post.post_title,
              Post_type: 'found',
              Item_name: match.Found_Post.item_name,
              Description: match.Found_Post.description,
              Status: match.Found_Post.status,
              Account_id: match.Found_Post.account_id,
              Image_urls: imageUrls
            },
            // User's original post (for reference)
            Your_Post: {
              Post_id: `L${match.lost_post_id}`,
              Post_Title: match.Lost_Post.post_title,
              Post_type: 'lost',
              Item_name: match.Lost_Post.item_name,
              Description: match.Lost_Post.description
            }
          });
        }
        // Check if user's Found_Post matched with someone's Lost_Post  
        else if (match.Found_Post && match.Found_Post.account_id === accountId && match.Lost_Post) {
          // Fetch images for the matched Lost_Post
          const imageUrls = await this._getPostImages(match.lost_post_id, 'lost');

          allMatches.push({
            Match_id: match.match_id,
            Post_id: `L${match.lost_post_id}`,
            Confidence_score: match.confidence_score,
            Matched_at: match.matched_at,
            // Matched post (from other user)
            Post: {
              Post_id: `L${match.lost_post_id}`,
              Post_Title: match.Lost_Post.post_title,
              Post_type: 'lost',
              Item_name: match.Lost_Post.item_name,
              Description: match.Lost_Post.description,
              Status: match.Lost_Post.status,
              Account_id: match.Lost_Post.account_id,
              Image_urls: imageUrls
            },
            // User's original post (for reference)
            Your_Post: {
              Post_id: `F${match.found_post_id}`,
              Post_Title: match.Found_Post.post_title,
              Post_type: 'found',
              Item_name: match.Found_Post.item_name,
              Description: match.Found_Post.description
            }
          });
        }
      }

      console.log(`✅ Found ${allMatches.length} matches for account ${accountId}`);

      return {
        success: true,
        data: allMatches,
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
   * Get match by ID
   * @param {string} matchId
   * @returns {Promise<Object>}
   */
  async getMatchById(matchId) {
    try {
      const { data, error } = await supabase
        .from('Match_Post')
        .select(`
          match_id,
          lost_post_id,
          found_post_id,
          confidence_score,
          matched_at,
          Lost_Post:lost_post_id (
            lost_post_id,
            post_title,
            item_name,
            description,
            status,
            account_id
          ),
          Found_Post:found_post_id (
            found_post_id,
            post_title,
            item_name,
            description,
            status,
            account_id
          )
        `)
        .eq('match_id', matchId)
        .single();

      if (error) throw error;

      if (!data) {
        return {
          success: true,
          data: null,
          error: null
        };
      }

      // Format response to match expected structure
      const formattedData = {
        Match_id: data.match_id,
        lost_post_id: data.lost_post_id,
        found_post_id: data.found_post_id,
        Confidence_score: data.confidence_score,
        Matched_at: data.matched_at,
        Lost_Post: data.Lost_Post ? {
          Post_id: `L${data.lost_post_id}`,
          Post_Title: data.Lost_Post.post_title,
          Post_type: 'lost',
          Item_name: data.Lost_Post.item_name,
          Description: data.Lost_Post.description,
          Status: data.Lost_Post.status,
          Account_id: data.Lost_Post.account_id
        } : null,
        Found_Post: data.Found_Post ? {
          Post_id: `F${data.found_post_id}`,
          Post_Title: data.Found_Post.post_title,
          Post_type: 'found',
          Item_name: data.Found_Post.item_name,
          Description: data.Found_Post.description,
          Status: data.Found_Post.status,
          Account_id: data.Found_Post.account_id
        } : null
      };

      return {
        success: true,
        data: formattedData,
        error: null
      };
    } catch (err) {
      console.error('Error getting match by ID:', err.message);
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
          confidence_score: status === 'approved' ? 1.0 : 0.0
        })
        .eq('match_id', matchId)
        .select(`
          match_id,
          lost_post_id,
          found_post_id,
          confidence_score,
          matched_at
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
        .eq('match_id', matchId);

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
   * Check if user is a participant in a match (owns either lost_post or found_post)
   * @param {number} matchId
   * @param {number} accountId
   * @returns {Promise<boolean>}
   */
  async isMatchParticipant(matchId, accountId) {
    try {
      // Get match with both post info
      const { data, error } = await supabase
        .from('Match_Post')
        .select(`
          match_id,
          lost_post_id,
          found_post_id,
          Lost_Post:lost_post_id (account_id),
          Found_Post:found_post_id (account_id)
        `)
        .eq('match_id', matchId)
        .single();

      if (error || !data) {
        console.error('Error checking match participant:', error);
        return false;
      }

      // Check if user owns either post
      const ownsLostPost = data.Lost_Post && data.Lost_Post.account_id === accountId;
      const ownsFoundPost = data.Found_Post && data.Found_Post.account_id === accountId;

      return ownsLostPost || ownsFoundPost;
    } catch (err) {
      console.error('Error in isMatchParticipant:', err.message);
      return false;
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
        sortBy = 'matched_at',
        sortOrder = 'desc'
      } = filters;

      let query = supabase
        .from('Match_Post')
        .select(`
          match_id,
          lost_post_id,
          found_post_id,
          confidence_score,
          matched_at,
          Lost_Post:lost_post_id (
            lost_post_id,
            post_title,
            item_name,
            status,
            account_id
          ),
          Found_Post:found_post_id (
            found_post_id,
            post_title,
            item_name,
            status,
            account_id
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

      // Format response to match expected structure
      const formattedData = (data || []).map(match => ({
        Match_id: match.match_id,
        lost_post_id: match.lost_post_id,
        found_post_id: match.found_post_id,
        Confidence_score: match.confidence_score,
        Matched_at: match.matched_at,
        Lost_Post: match.Lost_Post ? {
          Post_id: `L${match.lost_post_id}`,
          Post_Title: match.Lost_Post.post_title,
          Post_type: 'lost',
          Item_name: match.Lost_Post.item_name,
          Status: match.Lost_Post.status,
          Account_id: match.Lost_Post.account_id
        } : null,
        Found_Post: match.Found_Post ? {
          Post_id: `F${match.found_post_id}`,
          Post_Title: match.Found_Post.post_title,
          Post_type: 'found',
          Item_name: match.Found_Post.item_name,
          Status: match.Found_Post.status,
          Account_id: match.Found_Post.account_id
        } : null
      }));

      return {
        success: true,
        data: formattedData,
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
   * Get posts of opposite type for matching
   * (Used for event-driven AI matching)
   * @param {string} postType - 'lost' or 'found'
   * @param {string} postId - ID of the new post to exclude from results
   * @returns {Promise<Object>}
   */
  async getOppositeTypePosts(postType, postId) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

      // Determine which table to query (opposite type)
      const isLostPost = postType === 'lost';
      const tableName = isLostPost ? 'Found_Post' : 'Lost_Post';
      const idColumn = isLostPost ? 'found_post_id' : 'lost_post_id';
      const oppositeType = isLostPost ? 'found' : 'lost';

      // Query opposite type posts
      const { data: posts, error } = await supabase
        .from(tableName)
        .select(`
          ${idColumn},
          post_title,
          item_name,
          description,
          status,
          created_at,
          approved_at,
          account_id,
          location_id,
          category_id
        `)
        .eq('status', 'Approved')
        .gte('approved_at', thirtyDaysAgoISO)
        .is('deleted_at', null)
        .order('approved_at', { ascending: false });

      if (error) {
        console.error(`Error getting ${oppositeType} posts:`, error);
        return { success: false, data: null, error: error.message };
      }

      // Format posts with images
      const formattedPosts = [];
      if (posts && posts.length > 0) {
        for (const post of posts) {
          const imageUrls = await this._getPostImages(post[idColumn], oppositeType);

          formattedPosts.push({
            Post_id: `${isLostPost ? 'F' : 'L'}${post[idColumn]}`,
            Post_Title: post.post_title,
            Post_type: oppositeType,
            Item_name: post.item_name,
            Description: post.description,
            Status: post.status,
            Created_at: post.created_at,
            Approved_at: post.approved_at,
            Account_id: post.account_id,
            Location_id: post.location_id,
            Category_id: post.category_id,
            Image_urls: imageUrls
          });
        }
      }

      console.log(`✅ Retrieved ${formattedPosts.length} ${oppositeType} posts for matching`);

      return {
        success: true,
        data: formattedPosts,
        error: null
      };
    } catch (err) {
      console.error('Error getting opposite type posts:', err.message);
      return {
        success: false,
        data: null,
        error: err.message
      };
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

      // Query Lost_Post
      const { data: lostPosts, error: lostError } = await supabase
        .from('Lost_Post')
        .select(`
          lost_post_id,
          post_title,
          item_name,
          description,
          status,
          created_at,
          approved_at,
          account_id,
          location_id,
          category_id
        `)
        .eq('status', 'Approved')
        .gte('approved_at', thirtyDaysAgoISO)
        .is('deleted_at', null)
        .order('approved_at', { ascending: false });

      if (lostError) {
        console.error('Error getting lost posts:', lostError);
      }

      // Query Found_Post
      const { data: foundPosts, error: foundError } = await supabase
        .from('Found_Post')
        .select(`
          found_post_id,
          post_title,
          item_name,
          description,
          status,
          created_at,
          approved_at,
          account_id,
          location_id,
          category_id
        `)
        .eq('status', 'Approved')
        .gte('approved_at', thirtyDaysAgoISO)
        .is('deleted_at', null)
        .order('approved_at', { ascending: false });

      if (foundError) {
        console.error('Error getting found posts:', foundError);
      }

      // Format and combine results
      const allPosts = [];

      // Format lost posts
      if (lostPosts && lostPosts.length > 0) {
        for (const post of lostPosts) {
          // Get images for this post
          const imageUrls = await this._getPostImages(post.lost_post_id, 'lost');

          allPosts.push({
            Post_id: `L${post.lost_post_id}`,
            Post_Title: post.post_title,
            Post_type: 'lost',
            Item_name: post.item_name,
            Description: post.description,
            Status: post.status,
            Created_at: post.created_at,
            Approved_at: post.approved_at,
            Account_id: post.account_id,
            Location_id: post.location_id,
            Category_id: post.category_id,
            Image_urls: imageUrls
          });
        }
      }

      // Format found posts
      if (foundPosts && foundPosts.length > 0) {
        for (const post of foundPosts) {
          // Get images for this post
          const imageUrls = await this._getPostImages(post.found_post_id, 'found');

          allPosts.push({
            Post_id: `F${post.found_post_id}`,
            Post_Title: post.post_title,
            Post_type: 'found',
            Item_name: post.item_name,
            Description: post.description,
            Status: post.status,
            Created_at: post.created_at,
            Approved_at: post.approved_at,
            Account_id: post.account_id,
            Location_id: post.location_id,
            Category_id: post.category_id,
            Image_urls: imageUrls
          });
        }
      }

      console.log(`✅ Retrieved ${allPosts.length} approved posts for AI matching (${lostPosts?.length || 0} lost, ${foundPosts?.length || 0} found)`);

      return {
        success: true,
        data: allPosts,
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

        // Extract numeric IDs from Post_id format (L55 -> 55, F43 -> 43)
        const post1Id = parseInt(post1.Post_id.replace(/^[LF]/, ''));
        const post2Id = parseInt(post2.Post_id.replace(/^[LF]/, ''));

        // Determine which is lost and which is found
        const isPost1Lost = post1.Post_type === 'lost';
        const lostPostId = isPost1Lost ? post1Id : post2Id;
        const foundPostId = isPost1Lost ? post2Id : post1Id;

        // Create ONE match record linking both posts
        insertData.push({
          lost_post_id: lostPostId,
          found_post_id: foundPostId,
          confidence_score: similarity,
          matched_at: new Date().toISOString()
        });
      }

      // Check for existing matches to avoid duplicates
      const lostIds = insertData.map(m => m.lost_post_id);
      const foundIds = insertData.map(m => m.found_post_id);
      const { data: existingMatches } = await supabase
        .from('Match_Post')
        .select('lost_post_id, found_post_id, matched_at')
        .in('lost_post_id', lostIds)
        .in('found_post_id', foundIds);

      // Filter out matches that already exist (created in last 24 hours)
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const existingMatchKeys = new Set(
        (existingMatches || [])
          .filter(m => new Date(m.matched_at) > oneDayAgo)
          .map(m => `${m.lost_post_id}_${m.found_post_id}`)
      );

      const newMatches = insertData.filter(m =>
        !existingMatchKeys.has(`${m.lost_post_id}_${m.found_post_id}`)
      );

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
          match_id,
          lost_post_id,
          found_post_id,
          confidence_score,
          matched_at,
          Lost_Post:lost_post_id (
            lost_post_id,
            post_title,
            item_name,
            description,
            status,
            account_id
          ),
          Found_Post:found_post_id (
            found_post_id,
            post_title,
            item_name,
            description,
            status,
            account_id
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
   * @param {string} postId - Format: "L55" or "F43"
   * @returns {Promise<boolean>}
   */
  async matchExists(postId) {
    try {
      // Parse postId to determine type and numeric ID
      const isLost = postId.startsWith('L');
      const numericId = parseInt(postId.substring(1));

      if (isNaN(numericId)) {
        return false;
      }

      const { data, error } = await supabase
        .from('Match_Post')
        .select('match_id')
        .eq(isLost ? 'lost_post_id' : 'found_post_id', numericId)
        .limit(1);

      if (error) throw error;

      return (data && data.length > 0);
    } catch (err) {
      console.error('Error checking match existence:', err.message);
      return false;
    }
  }

  /**
   * Get Post IDs that already have matches (in last 24 hours)
   * Used for optimization: skip these posts in AI scanning to avoid redundant calculations
   * @returns {Promise<Set<string>>} Set of Post IDs with existing matches (format: "L55", "F43")
   */
  async getPostIdsWithRecentMatches() {
    try {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const { data, error } = await supabase
        .from('Match_Post')
        .select('lost_post_id, found_post_id')
        .gte('matched_at', oneDayAgo.toISOString());

      if (error) throw error;

      // Format to Post_id strings and return as Set for O(1) lookup performance
      const postIds = new Set();
      (data || []).forEach(match => {
        if (match.lost_post_id) postIds.add(`L${match.lost_post_id}`);
        if (match.found_post_id) postIds.add(`F${match.found_post_id}`);
      });

      return postIds;
    } catch (err) {
      console.error('Error getting post IDs with recent matches:', err.message);
      // Return empty Set on error - fail gracefully (will scan all posts)
      return new Set();
    }
  }
}

export default new MatchModel();

