import postModel from './postModel.js';

/**
 * GET /api/posts
 * Get all posts with filtering and pagination
 */
export const getAllPosts = async (req, res, next) => {
  try {
    const {
      category,
      location,
      status,
      search,
      type,  // 'lost' or 'found'
      page = 1,
      limit = 10,
      sortBy = 'Created_at',
      sortOrder = 'desc'
    } = req.query;

    // 🔹 Check if user is admin
    const isAdmin = req.user?.role === 'Admin';

    const filters = {
      category,
      location,
      status,
      search,
      type,
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder,
      isAdmin // Pass admin flag to model
    };

    const result = await postModel.getAllPosts(filters);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve posts',
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      message: 'Posts retrieved successfully',
      data: {
        posts: result.data,
        pagination: result.pagination
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/posts/:id
 * Get post by ID
 * Query params: ?type=lost|found (required)
 */
export const getPostById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Post ID is required'
      });
    }

    if (!type || !['lost', 'found'].includes(type.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Type is required (lost or found)'
      });
    }

    const result = await postModel.getPostById(id, type.toLowerCase());

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve post',
        error: result.error
      });
    }

    if (!result.data) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Post retrieved successfully',
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/posts
 * Create new post (requires authentication)
 */
export const createPost = async (req, res, next) => {
  try {
    const { type, title, description, category, location, images, date } = req.body;
    const accountId = req.user?.accountId;

    // Validation
    if (!title || !description || !type) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: type, title, description'
      });
    }

    if (!accountId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Validate type
    if (!['lost', 'found'].includes(type.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid type. Must be "lost" or "found"'
      });
    }

    // Validate title and description length
    if (title.length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Title must be less than 200 characters'
      });
    }

    if (description.length > 5000) {
      return res.status(400).json({
        success: false,
        message: 'Description must be less than 5000 characters'
      });
    }

    const postData = {
      account_id: accountId,
      type: type.toLowerCase(),
      title: title.trim(),
      description: description.trim(),
      category: category || 'Khác',
      location: location || '',
      images: images || []
      // Note: 'date' field is ignored, we use created_at instead
    };

    const result = await postModel.createPost(postData);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create post',
        error: result.error
      });
    }

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/posts/:id
 * Update post (requires authentication and ownership)
 * Query params: ?type=lost|found (required)
 */
export const updatePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type: typeFromQuery } = req.query;
    const { title, description, category, location, status } = req.body;
    const accountId = req.user?.accountId;
    const userRole = req.user?.role;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Post ID is required'
      });
    }

    const type = (typeFromQuery || '').toLowerCase();
    if (!['lost', 'found'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type is required in query params (lost or found)'
      });
    }

    // Check ownership (unless admin)
    if (userRole !== 'Admin') {
      const isOwner = await postModel.isPostOwner(id, type, accountId);
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update this post'
        });
      }
    }

    // Validate data if provided
    if (title && title.length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Title must be less than 200 characters'
      });
    }

    if (description && description.length > 5000) {
      return res.status(400).json({
        success: false,
        message: 'Description must be less than 5000 characters'
      });
    }

    if (type && !['lost', 'found'].includes(type.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid type. Must be "lost" or "found"'
      });
    }

    if (status) {
      const validStatuses = ['pending', 'active', 'approved', 'rejected', 'resolved'];
      if (!validStatuses.includes(status.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be "pending", "active", "approved", "rejected", or "resolved"'
        });
      }
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (category !== undefined) updateData.category = category;
    if (location !== undefined) updateData.location = location;
    if (status !== undefined) updateData.status = status.toLowerCase();

    const result = await postModel.updatePost(id, type, updateData);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update post',
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/posts/:id
 * Delete post (requires authentication and ownership or admin)
 * Query params: ?type=lost|found (required)
 */
export const deletePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type: typeFromQuery } = req.query;
    const accountId = req.user?.accountId;
    const userRole = req.user?.role;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Post ID is required'
      });
    }

    const type = (typeFromQuery || '').toLowerCase();
    if (!['lost', 'found'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type is required in query params (lost or found)'
      });
    }

    // Check ownership (unless admin)
    // ✅ So sánh case-insensitive để đảm bảo Admin role được nhận diện
    const normalizedRole = userRole ? String(userRole).trim() : '';
    const isAdmin = normalizedRole.toLowerCase() === 'admin';
    
    console.log('🔍 Delete post - Raw userRole:', userRole, 'Type:', typeof userRole);
    console.log('🔍 Delete post - Normalized role:', normalizedRole);
    console.log('🔍 Delete post - Is Admin:', isAdmin);
    console.log('🔍 Delete post - Account ID:', accountId, 'Post ID:', id, 'Type:', type);
    console.log('🔍 Delete post - Full req.user:', JSON.stringify(req.user, null, 2));
    
    if (!isAdmin) {
      console.log('⚠️ Not admin, checking ownership...');
      const isOwner = await postModel.isPostOwner(id, type, accountId);
      console.log('🔍 Delete post - Is Owner:', isOwner);
      if (!isOwner) {
        console.log('❌ Not owner and not admin - denying delete');
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to delete this post'
        });
      }
      console.log('✅ Owner confirmed - allowing delete');
    } else {
      console.log('✅ Admin detected - skipping ownership check');
    }

    const result = await postModel.deletePost(id, type);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete post',
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/posts/my
 * Get current user's posts (requires authentication)
 */
export const getMyPosts = async (req, res, next) => {
  try {
    const accountId = req.user?.accountId;

    if (!accountId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const result = await postModel.getPostsByAccountId(accountId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve your posts',
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      message: 'Your posts retrieved successfully',
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/posts/type/:type
 * Get posts by post type
 */
export const getPostsByType = async (req, res, next) => {
  try {
    const { type } = req.params;
    const { page = 1, limit = 10, sortBy = 'Created_at', sortOrder = 'desc' } = req.query;

    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'Post type is required'
      });
    }

    // Validate type
    if (!['lost', 'found'].includes(type.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid type. Must be "lost" or "found"'
      });
    }

    // Validate pagination parameters
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters'
      });
    }

    const result = await postModel.getPostsByType(type.toLowerCase(), {
      page: pageNum,
      limit: limitNum,
      sortBy,
      sortOrder
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve posts by type',
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      message: `Posts of type '${type}' retrieved successfully`,
      data: {
        posts: result.data,
        pagination: result.pagination
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/posts/types
 * Get all available post types
 */
export const getPostTypes = async (req, res, next) => {
  try {
    const result = await postModel.getPostTypes();

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve post types',
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      message: 'Post types retrieved successfully',
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/posts/:id/approve
 * Approve a post (Admin only)
 * Query params: ?type=lost|found (required)
 */
export const approvePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type } = req.query;

    if (!type || !['lost', 'found'].includes(type.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Type is required (lost or found)'
      });
    }

    const result = await postModel.updatePost(id, type.toLowerCase(), { status: 'Approved' });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to approve post',
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      message: 'Post approved successfully',
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/posts/:id/reject
 * Reject a post (Admin only)
 * Query params: ?type=lost|found (required)
 */
export const rejectPost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type } = req.query;
    const { reason } = req.body;

    if (!type || !['lost', 'found'].includes(type.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Type is required (lost or found)'
      });
    }

    const result = await postModel.updatePost(id, type.toLowerCase(), { status: 'Rejected' });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to reject post',
        error: result.error
      });
    }

    // TODO: Send notification to user about rejection (with reason)

    res.status(200).json({
      success: true,
      message: 'Post rejected successfully',
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};
