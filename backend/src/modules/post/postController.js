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
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const filters = {
      category,
      location,
      status,
      search,
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
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
 */
export const getPostById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Post ID is required'
      });
    }

    const result = await postModel.getPostById(id);

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
    const { title, description, category, location, images, found_date } = req.body;
    const accountId = req.user?.accountId;

    // Validation
    if (!title || !description || !category || !location) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, description, category, location'
      });
    }

    if (!accountId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Validate category
    const validCategories = ['lost', 'found', 'Lost', 'Found'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category. Must be "lost" or "found"'
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
      title: title.trim(),
      description: description.trim(),
      category,
      location: location.trim(),
      images: images || [],
      found_date,
      status: 'active'
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
      post: result.data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/posts/:id
 * Update post (requires authentication and ownership)
 */
export const updatePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, category, location, image_url, status } = req.body;
    const accountId = req.user?.accountId;
    const userRole = req.user?.role;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Post ID is required'
      });
    }

    // Check ownership (unless admin)
    if (userRole !== 'Admin') {
      const isOwner = await postModel.isPostOwner(id, accountId);
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

    if (category) {
      const validCategories = ['lost', 'found', 'Lost', 'Found'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category. Must be "lost" or "found"'
        });
      }
    }

    if (status) {
      const validStatuses = ['active', 'matched', 'closed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be "active", "matched", or "closed"'
        });
      }
    }

    const updateData = {};
    if (title) updateData.title = title.trim();
    if (description) updateData.description = description.trim();
    if (category) updateData.category = category;
    if (location) updateData.location = location.trim();
    if (image_url) updateData.image_url = image_url;
    if (status) updateData.status = status;

    const result = await postModel.updatePost(id, updateData);

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
      post: result.data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/posts/:id
 * Delete post (requires authentication and ownership or admin)
 */
export const deletePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const accountId = req.user?.accountId;
    const userRole = req.user?.role;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Post ID is required'
      });
    }

    // Check ownership (unless admin)
    if (userRole !== 'Admin') {
      const isOwner = await postModel.isPostOwner(id, accountId);
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to delete this post'
        });
      }
    }

    const result = await postModel.deletePost(id);

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
 * GET /api/posts/:id/image
 * Get image by post ID
 */
export const getImageByPostId = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Post ID is required'
      });
    }

    const result = await postModel.getImageByPostId(id);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve image',
        error: result.error
      });
    }

    if (!result.data) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (!result.data.image_url) {
      return res.status(404).json({
        success: false,
        message: 'No image found for this post'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Image retrieved successfully',
      data: {
        post_id: result.data.post_id,
        title: result.data.title,
        image_url: result.data.image_url
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/posts/:id/images
 * Get all images for a post
 */
export const getPostImages = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Post ID is required'
      });
    }

    const result = await postModel.getPostImages(id);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve images',
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
      message: 'Images retrieved successfully',
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/posts/type/:postType
 * Get posts by post type
 */
export const getPostsByType = async (req, res, next) => {
  try {
    const { postType } = req.params;
    const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc' } = req.query;

    if (!postType) {
      return res.status(400).json({
        success: false,
        message: 'Post type is required'
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

    const result = await postModel.getPostsByType(postType, {
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
      message: `Posts of type '${postType}' retrieved successfully`,
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

