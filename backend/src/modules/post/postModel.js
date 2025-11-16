import { supabase } from '../../config/db.js';

class PostModel {
  /**
   * Helper: Get images for a lost post
   * @private
   */
  async _getLostPostImages(lostPostId) {
    try {
      const { data, error } = await supabase
        .from('Lost_Post_Images')
        .select(`
          lost_img_id,
          Lost_Images!inner(link_picture)
        `)
        .eq('lost_post_id', lostPostId);

      if (error || !data) return [];
      
      return data.map(item => item.Lost_Images.link_picture);
    } catch (err) {
      console.error('Error getting lost post images:', err);
      return [];
    }
  }

  /**
   * Helper: Get images for a found post
   * @private
   */
  async _getFoundPostImages(foundPostId) {
    try {
      const { data, error } = await supabase
        .from('Found_Post_Images')
        .select(`
          found_img_id,
          Found_Images!inner(link_picture)
        `)
        .eq('found_post_id', foundPostId);

      if (error || !data) return [];
      
      return data.map(item => item.Found_Images.link_picture);
    } catch (err) {
      console.error('Error getting found post images:', err);
      return [];
    }
  }

  /**
   * Helper: Format a single post
   * @private
   */
  async _formatPost(post, type, account, location, images) {
    const postId = type === 'lost' ? post.lost_post_id : post.found_post_id;
    
    return {
      id: postId,
      type: type,
      title: post.post_title || '',
      description: post.description || post.item_name || '',
      category: post.category_name || 'Khác',
      location: location ? this._formatLocation(location) : '',
      author: account?.user_name || account?.email || '',
      contact: account?.phone_number || '',
      image: images.length > 0 ? images[0] : null,
      images: images,
      date: post.created_at ? new Date(post.created_at).toISOString().split('T')[0] : null,
      status: this._mapStatus(post.status),
      createdAt: post.created_at ? new Date(post.created_at).getTime() : null,
      updatedAt: post.updated_at ? new Date(post.updated_at).getTime() : null
    };
  }

  /**
   * Helper: Map status
   * @private
   */
  _mapStatus(dbStatus) {
    const statusMap = {
      'Pending': 'pending',
      'Approved': 'active',
      'Rejected': 'rejected',
      'Resolved': 'resolved'
    };
    return statusMap[dbStatus] || (dbStatus ? dbStatus.toLowerCase() : 'pending');
  }

  /**
   * Helper: Format location
   * @private
   */
  _formatLocation(location) {
    const parts = [];
    if (location.building) parts.push(`Tòa ${location.building}`);
    if (location.room) parts.push(`Phòng ${location.room}`);
    if (location.address) parts.push(location.address);
    return parts.join(' - ');
  }

  /**
   * Get all posts (both lost and found)
   * @param {Object} filters - { status, search, type, page, limit, isAdmin }
   * @param {boolean} filters.isAdmin - If true, return all posts (including Pending)
   */
  async getAllPosts(filters = {}) {
    try {
      const {
        category,
        location,
        status,
        search,
        type,
        page = 1,
        limit = 10,
        sortBy = 'created_at',
        sortOrder = 'desc',
        isAdmin = false // NEW: Admin flag
      } = filters;

      const allPosts = [];

      // Query Lost_Post if type is 'lost' or not specified
      if (!type || type === 'lost') {
        let lostQuery = supabase
          .from('Lost_Post')
          .select(`
            *,
            Account!inner(account_id, user_name, email, phone_number),
            Location(location_id, address, building, room),
            Category(category_id, name)
          `)
          .is('deleted_at', null);

        // 🔹 NEW: If not admin, only show Approved posts
        if (!isAdmin && !status) {
          lostQuery = lostQuery.eq('status', 'Approved');
        } else if (status) {
          lostQuery = lostQuery.eq('status', status);
        }
        if (search) lostQuery = lostQuery.or(`post_title.ilike.%${search}%,item_name.ilike.%${search}%,description.ilike.%${search}%`);

        const { data: lostPosts } = await lostQuery;

        if (lostPosts) {
          for (const post of lostPosts) {
            const images = await this._getLostPostImages(post.lost_post_id);
            const formatted = await this._formatPost(
              { ...post, category_name: post.Category?.name },
              'lost',
              post.Account,
              post.Location,
              images
            );
            allPosts.push(formatted);
          }
        }
      }

      // Query Found_Post if type is 'found' or not specified
      if (!type || type === 'found') {
        let foundQuery = supabase
          .from('Found_Post')
          .select(`
            *,
            Account!inner(account_id, user_name, email, phone_number),
            Location(location_id, address, building, room),
            Category(category_id, name)
          `)
          .is('deleted_at', null);

        // 🔹 NEW: If not admin, only show Approved posts
        if (!isAdmin && !status) {
          foundQuery = foundQuery.eq('status', 'Approved');
        } else if (status) {
          foundQuery = foundQuery.eq('status', status);
        }
        if (search) foundQuery = foundQuery.or(`post_title.ilike.%${search}%,item_name.ilike.%${search}%,description.ilike.%${search}%`);

        const { data: foundPosts } = await foundQuery;

        if (foundPosts) {
          for (const post of foundPosts) {
            const images = await this._getFoundPostImages(post.found_post_id);
            const formatted = await this._formatPost(
              { ...post, category_name: post.Category?.name },
              'found',
              post.Account,
              post.Location,
              images
            );
            allPosts.push(formatted);
          }
        }
      }

      // Apply filters
      let filtered = allPosts;
      if (category) {
        filtered = filtered.filter(p => p.category && p.category.toLowerCase().includes(category.toLowerCase()));
      }
      if (location) {
        filtered = filtered.filter(p => p.location && p.location.toLowerCase().includes(location.toLowerCase()));
      }

      // Sort
      filtered.sort((a, b) => {
        const aVal = a[sortBy] || 0;
        const bVal = b[sortBy] || 0;
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      });

      // Paginate
      const total = filtered.length;
      const start = (page - 1) * limit;
      const paginated = filtered.slice(start, start + limit);

      return {
        success: true,
        data: paginated,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          totalPages: Math.ceil(total / limit)
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
   * Get post by ID and type
   */
  async getPostById(postId, type) {
    try {
      const tableName = type === 'found' ? 'Found_Post' : 'Lost_Post';
      const idColumn = type === 'found' ? 'found_post_id' : 'lost_post_id';

      const { data, error } = await supabase
        .from(tableName)
        .select(`
          *,
          Account(account_id, user_name, email, phone_number),
          Location(location_id, address, building, room),
          Category(category_id, name)
        `)
        .eq(idColumn, postId)
        .is('deleted_at', null)
        .single();

      if (error || !data) {
        return { success: true, data: null, error: null };
      }

      const images = type === 'found' 
        ? await this._getFoundPostImages(postId)
        : await this._getLostPostImages(postId);

      const formatted = await this._formatPost(
        { ...data, category_name: data.Category?.name },
        type,
        data.Account,
        data.Location,
        images
      );

      return {
        success: true,
        data: formatted,
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
   */
  async createPost(postData) {
    try {
      const { account_id, type, title, description, category, location, images = [] } = postData;

      // Find or create location
      let locationId = null;
      if (location) {
        locationId = await this._findOrCreateLocation(location);
      }

      // Find or create category
      let categoryId = null;
      if (category) {
        categoryId = await this._findOrCreateCategory(category, type);
      }

      const tableName = type === 'found' ? 'Found_Post' : 'Lost_Post';
      const insertData = {
        account_id,
        post_title: title,
        description: description,
        item_name: description,
        location_id: locationId,
        category_id: categoryId,
        status: 'Pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: post, error } = await supabase
        .from(tableName)
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;

      // Handle images
      if (images && images.length > 0) {
        await this._saveImages(post, type, images);
      }

      return await this.getPostById(
        type === 'found' ? post.found_post_id : post.lost_post_id,
        type
      );
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
   * Helper: Find or create location
   * @private
   */
  async _findOrCreateLocation(locationString) {
    // Parse location string
    const parts = locationString.split(' - ');
    let building = null, room = null, address = null;

    parts.forEach(part => {
      if (part.startsWith('Tòa ')) building = part.replace('Tòa ', '').trim();
      else if (part.startsWith('Phòng ')) room = part.replace('Phòng ', '').trim();
      else address = part.trim();
    });

    // Try to find existing
    let query = supabase.from('Location').select('location_id');
    if (building) query = query.eq('building', building);
    if (room) query = query.eq('room', room);
    if (address) query = query.eq('address', address);

    const { data: existing } = await query.limit(1).single();
    if (existing) return existing.location_id;

    // Create new
    const { data: newLoc } = await supabase
      .from('Location')
      .insert([{ building, room, address: address || 'N/A' }])
      .select('location_id')
      .single();

    return newLoc?.location_id;
  }

  /**
   * Helper: Find or create category
   * @private
   */
  async _findOrCreateCategory(categoryName, type) {
    const { data: existing } = await supabase
      .from('Category')
      .select('category_id')
      .eq('name', categoryName)
      .limit(1)
      .single();

    if (existing) return existing.category_id;

    const { data: newCat } = await supabase
      .from('Category')
      .insert([{ name: categoryName, type: type }])
      .select('category_id')
      .single();

    return newCat?.category_id;
  }

  /**
   * Helper: Save images (upload to Supabase Storage)
   * @private
   */
  async _saveImages(post, type, images) {
    const { uploadPostImage } = await import('../../utils/imageUpload.js');
    const imageTable = type === 'found' ? 'Found_Images' : 'Lost_Images';
    const junctionTable = type === 'found' ? 'Found_Post_Images' : 'Lost_Post_Images';
    const postIdColumn = type === 'found' ? 'found_post_id' : 'lost_post_id';
    const imgIdColumn = type === 'found' ? 'found_img_id' : 'lost_img_id';
    const postId = type === 'found' ? post.found_post_id : post.lost_post_id;

    console.log(`📸 Uploading ${images.length} images for ${type} post ${postId}...`);

    for (const imageBase64 of images) {
      // Upload image to Supabase Storage
      const uploadResult = await uploadPostImage(imageBase64, postId, type);
      
      if (!uploadResult.success) {
        console.error('❌ Failed to upload image:', uploadResult.error);
        continue; // Skip this image
      }

      console.log('✅ Image uploaded:', uploadResult.url);

      // Save image URL to database
      const { data: imgRecord } = await supabase
        .from(imageTable)
        .insert([{ 
          link_picture: uploadResult.url, 
          created_at: new Date().toISOString() 
        }])
        .select()
        .single();

      if (imgRecord) {
        // Link image to post
        await supabase
          .from(junctionTable)
          .insert([{
            [postIdColumn]: postId,
            [imgIdColumn]: imgRecord[imgIdColumn]
          }]);
        
        console.log(`✅ Image ${imgRecord[imgIdColumn]} linked to post ${postId}`);
      }
    }
  }

  /**
   * Update post
   */
  async updatePost(postId, type, updateData) {
    try {
      const tableName = type === 'found' ? 'Found_Post' : 'Lost_Post';
      const idColumn = type === 'found' ? 'found_post_id' : 'lost_post_id';

      const updates = { updated_at: new Date().toISOString() };
      
      if (updateData.title) updates.post_title = updateData.title;
      if (updateData.description) {
        updates.description = updateData.description;
        updates.item_name = updateData.description;
      }
      if (updateData.status) {
        const statusMap = {
          'pending': 'Pending',
          'active': 'Approved',
          'approved': 'Approved',
          'rejected': 'Rejected',
          'resolved': 'Resolved'
        };
        updates.status = statusMap[updateData.status.toLowerCase()] || 'Pending';
      }
      if (updateData.location) {
        updates.location_id = await this._findOrCreateLocation(updateData.location);
      }
      if (updateData.category) {
        updates.category_id = await this._findOrCreateCategory(updateData.category, type);
      }

      const { error } = await supabase
        .from(tableName)
        .update(updates)
        .eq(idColumn, postId);

      if (error) throw error;

      return await this.getPostById(postId, type);
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
   * Delete post (soft delete)
   */
  async deletePost(postId, type) {
    try {
      const tableName = type === 'found' ? 'Found_Post' : 'Lost_Post';
      const idColumn = type === 'found' ? 'found_post_id' : 'lost_post_id';

      const { error } = await supabase
        .from(tableName)
        .update({ deleted_at: new Date().toISOString() })
        .eq(idColumn, postId);

      if (error) throw error;

      return { success: true, error: null };
    } catch (err) {
      console.error('Error deleting post:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Get posts by account ID
   */
  async getPostsByAccountId(accountId) {
    try {
      const posts = [];

      // Get lost posts
      const { data: lostPosts } = await supabase
        .from('Lost_Post')
        .select(`
          *,
          Account(account_id, user_name, email, phone_number),
          Location(location_id, address, building, room),
          Category(category_id, name)
        `)
        .eq('account_id', accountId)
        .is('deleted_at', null);

      if (lostPosts) {
        for (const post of lostPosts) {
          const images = await this._getLostPostImages(post.lost_post_id);
          const formatted = await this._formatPost(
            { ...post, category_name: post.Category?.name },
            'lost',
            post.Account,
            post.Location,
            images
          );
          posts.push(formatted);
        }
      }

      // Get found posts
      const { data: foundPosts } = await supabase
        .from('Found_Post')
        .select(`
          *,
          Account(account_id, user_name, email, phone_number),
          Location(location_id, address, building, room),
          Category(category_id, name)
        `)
        .eq('account_id', accountId)
        .is('deleted_at', null);

      if (foundPosts) {
        for (const post of foundPosts) {
          const images = await this._getFoundPostImages(post.found_post_id);
          const formatted = await this._formatPost(
            { ...post, category_name: post.Category?.name },
            'found',
            post.Account,
            post.Location,
            images
          );
          posts.push(formatted);
        }
      }

      // Sort by created_at desc
      posts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      return {
        success: true,
        data: posts,
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
   * Get posts by type
   */
  async getPostsByType(postType, options = {}) {
    return this.getAllPosts({ ...options, type: postType });
  }

  /**
   * Check if user owns the post
   */
  async isPostOwner(postId, type, accountId) {
    try {
      const tableName = type === 'found' ? 'Found_Post' : 'Lost_Post';
      const idColumn = type === 'found' ? 'found_post_id' : 'lost_post_id';

      const { data, error } = await supabase
        .from(tableName)
        .select('account_id')
        .eq(idColumn, postId)
        .single();

      if (error || !data) return false;
      return data.account_id === accountId;
    } catch (err) {
      console.error('Error checking post ownership:', err.message);
      return false;
    }
  }

  /**
   * Get post types
   */
  async getPostTypes() {
    return {
      success: true,
      data: ['lost', 'found'],
      error: null
    };
  }
}

export default new PostModel();
