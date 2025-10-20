import { supabase } from '../../config/db.js';

class PostModel {
  /**
   * Get all posts with filtering, sorting, and pagination
   * @param {Object} filters - { category, location, status, search, post_type, page, limit, sortBy, sortOrder }
   * @returns {Promise<Object>}
   */
  async getAllPosts(filters = {}) {
    try {
      const {
        category,
        location,
        status,
        search,
        post_type,
        page = 1,
        limit = 10,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = filters;

      let query = supabase
        .from('Post')
        .select('*', { count: 'exact' });

      // Apply filters
      if (category) {
        query = query.eq('category', category);
      }
      if (location) {
        query = query.ilike('location', `%${location}%`);
      }
      if (status) {
        query = query.eq('status', status);
      }
      if (post_type) {
        query = query.eq('post_type', post_type);
      }
      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }

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
      console.error('Error getting all posts:', err.message);
      return {
        success: false,
        data: null,
        error: err.message
      };
    }
  }

  /**
   * Get post by ID
   * @param {string} postId
   * @returns {Promise<Object>}
   */
  async getPostById(postId) {
    try {
      const { data, error } = await supabase
        .from('Post')
        .select('*')
        .eq('post_id', postId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return {
        success: true,
        data: data || null,
        error: null
      };
    } catch (err) {
      console.error('Error getting post by ID:', err.message);
      return {
        success: false,
        data: null,
        error: err.message
      };
    }
  }

  /**
   * Create new post
   * @param {Object} postData - { account_id, title, description, category, location, images, found_date }
   * @returns {Promise<Object>}
   */
  async createPost(postData) {
    try {
      const {
        account_id,
        title,
        description,
        category,
        location,
        images = [],
        found_date = null,
        status = 'active'
      } = postData;

      const { data, error } = await supabase
        .from('Post')
        .insert([{
          account_id,
          title,
          description,
          category,
          location,
          image_url: images.length > 0 ? images[0] : null, // Use first image as primary
          status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select(`
          *,
          Account!account_id (
            account_id,
            user_name,
            email,
            avatar
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
      console.error('Error creating post:', err.message);
      return {
        success: false,
        data: null,
        error: err.message
      };
    }
  }

  /**
   * Update post
   * @param {string} postId
   * @param {Object} updateData
   * @returns {Promise<Object>}
   */
  async updatePost(postId, updateData) {
    try {
      const allowedFields = ['title', 'description', 'category', 'location', 'image_url', 'status'];
      const filteredData = {};

      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key) && updateData[key] !== undefined) {
          filteredData[key] = updateData[key];
        }
      });

      filteredData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('Post')
        .update(filteredData)
        .eq('post_id', postId)
        .select(`
          *,
          Account!account_id (
            account_id,
            user_name,
            email,
            avatar
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
      console.error('Error updating post:', err.message);
      return {
        success: false,
        data: null,
        error: err.message
      };
    }
  }

  /**
   * Delete post
   * @param {string} postId
   * @returns {Promise<Object>}
   */
  async deletePost(postId) {
    try {
      const { error } = await supabase
        .from('Post')
        .delete()
        .eq('post_id', postId);

      if (error) throw error;

      return {
        success: true,
        error: null
      };
    } catch (err) {
      console.error('Error deleting post:', err.message);
      return {
        success: false,
        error: err.message
      };
    }
  }

  /**
   * Get posts by account ID
   * @param {number} accountId
   * @returns {Promise<Object>}
   */
  async getPostsByAccountId(accountId) {
    try {
      const { data, error } = await supabase
        .from('Post')
        .select(`
          *,
          Account!account_id (
            account_id,
            user_name,
            email,
            avatar
          )
        `)
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: data || [],
        error: null
      };
    } catch (err) {
      console.error('Error getting posts by account ID:', err.message);
      return {
        success: false,
        data: null,
        error: err.message
      };
    }
  }

  /**
   * Check if user owns the post
   * @param {string} postId
   * @param {number} accountId
   * @returns {Promise<boolean>}
   */
  async isPostOwner(postId, accountId) {
    try {
      const { data, error } = await supabase
        .from('Post')
        .select('account_id')
        .eq('post_id', postId)
        .single();

      if (error) return false;

      return data && data.account_id === accountId;
    } catch (err) {
      console.error('Error checking post ownership:', err.message);
      return false;
    }
  }

  /**
   * Get image by post ID
   * @param {string} postId
   * @returns {Promise<Object>}
   */
  async getImageByPostId(postId) {
    try {
      const { data, error } = await supabase
        .from('Post')
        .select('post_id, image_url, title')
        .eq('post_id', postId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return {
        success: true,
        data: data || null,
        error: null
      };
    } catch (err) {
      console.error('Error getting image by post ID:', err.message);
      return {
        success: false,
        data: null,
        error: err.message
      };
    }
  }

  /**
   * Get all images for a post
   * @param {string} postId
   * @returns {Promise<Object>}
   */
  async getPostImages(postId) {
    try {
      const { data, error } = await supabase
        .from('Post')
        .select('post_id, image_url, title, description')
        .eq('post_id', postId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // If no image_url, return empty array
      const images = data?.image_url ? [data.image_url] : [];

      return {
        success: true,
        data: {
          post_id: data?.post_id,
          title: data?.title,
          description: data?.description,
          images: images
        },
        error: null
      };
    } catch (err) {
      console.error('Error getting post images:', err.message);
      return {
        success: false,
        data: null,
        error: err.message
      };
    }
  }

  /**
   * Get posts by post_type
   * @param {string} postType - The type of post to filter by
   * @param {Object} options - { page, limit, sortBy, sortOrder }
   * @returns {Promise<Object>}
   */
  async getPostsByType(postType, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = options;

      let query = supabase
        .from('Post')
        .select('*', { count: 'exact' })
        .eq('post_type', postType);

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
      console.error('Error getting posts by type:', err.message);
      return {
        success: false,
        data: null,
        error: err.message
      };
    }
  }

  /**
   * Get all available post types
   * @returns {Promise<Object>}
   */
  async getPostTypes() {
    try {
      const { data, error } = await supabase
        .from('Post')
        .select('post_type')
        .not('post_type', 'is', null);

      if (error) throw error;

      // Get unique post types
      const uniqueTypes = [...new Set(data.map(item => item.post_type))];

      return {
        success: true,
        data: uniqueTypes,
        error: null
      };
    } catch (err) {
      console.error('Error getting post types:', err.message);
      return {
        success: false,
        data: null,
        error: err.message
      };
    }
  }
}

export default new PostModel();
