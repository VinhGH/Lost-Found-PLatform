import categoryModel from './categoryModel.js';

/**
 * GET /api/categories
 * Get all categories
 */
export const getAllCategories = async (req, res, next) => {
  try {
    const { type } = req.query;

    const filters = { type };
    const result = await categoryModel.getAllCategories(filters);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve categories',
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      message: 'Categories retrieved successfully',
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/categories/:id
 * Get category by ID
 */
export const getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Category ID is required'
      });
    }

    const result = await categoryModel.getCategoryById(id);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve category',
        error: result.error
      });
    }

    if (!result.data) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Category retrieved successfully',
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/categories
 * Create a new category (Admin only)
 */
export const createCategory = async (req, res, next) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Admin privileges required'
      });
    }

    const { name, type } = req.body;

    // Validation
    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: 'Category name and type are required'
      });
    }

    if (!['Lost', 'Found'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be either "Lost" or "Found"'
      });
    }

    const result = await categoryModel.createCategory(name, type);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create category',
        error: result.error
      });
    }

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/categories/:id
 * Update an existing category (Admin only)
 */
export const updateCategory = async (req, res, next) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Admin privileges required'
      });
    }

    const { id } = req.params;
    const { name, type } = req.body;

    // Validation
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Category ID is required'
      });
    }

    if (!name && !type) {
      return res.status(400).json({
        success: false,
        message: 'At least one field (name or type) is required'
      });
    }

    if (type && !['Lost', 'Found'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be either "Lost" or "Found"'
      });
    }

    const result = await categoryModel.updateCategory(id, name, type);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.error || 'Failed to update category'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/categories/:id
 * Soft delete a category (Admin only)
 */
export const deleteCategory = async (req, res, next) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Admin privileges required'
      });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Category ID is required'
      });
    }

    const result = await categoryModel.deleteCategory(id);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.error || 'Failed to delete category'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

