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

