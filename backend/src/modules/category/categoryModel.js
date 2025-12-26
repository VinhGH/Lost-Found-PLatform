import { supabase } from '../../config/db.js';

/**
 * Category Model
 */
class CategoryModel {
  /**
   * Get all categories
   * @param {Object} filters - { type }
   * @returns {Promise<Object>}
   */
  async getAllCategories(filters = {}) {
    try {
      let query = supabase
        .from('Category')
        .select('*')
        .is('deleted_at', null) // Only get non-deleted categories
        .order('category_id', { ascending: true });

      // Filter by type if provided
      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Format categories
      const formattedCategories = (data || []).map(category => ({
        id: category.category_id,
        name: category.name,
        type: category.type
      }));

      return {
        success: true,
        data: formattedCategories,
        error: null
      };
    } catch (err) {
      console.error('Error getting categories:', err.message);
      return {
        success: false,
        data: null,
        error: err.message
      };
    }
  }

  /**
   * Get category by ID
   * @param {number} categoryId
   * @returns {Promise<Object>}
   */
  async getCategoryById(categoryId) {
    try {
      const { data, error } = await supabase
        .from('Category')
        .select('*')
        .eq('category_id', categoryId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        return {
          success: true,
          data: null,
          error: 'Category not found'
        };
      }

      const formatted = {
        id: data.category_id,
        name: data.name,
        type: data.type
      };

      return {
        success: true,
        data: formatted,
        error: null
      };
    } catch (err) {
      console.error('Error getting category by ID:', err.message);
      return {
        success: false,
        data: null,
        error: err.message
      };
    }
  }

  /**
   * Create a new category (Admin only)
   * @param {string} name - Category name
   * @param {string} type - 'Lost' or 'Found'
   * @returns {Promise<Object>}
   */
  async createCategory(name, type) {
    try {
      const { data, error } = await supabase
        .from('Category')
        .insert({
          name: name,
          type: type
        })
        .select()
        .single();

      if (error) throw error;

      const formatted = {
        id: data.category_id,
        name: data.name,
        type: data.type,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      return {
        success: true,
        data: formatted,
        error: null
      };
    } catch (err) {
      console.error('Error creating category:', err.message);
      return {
        success: false,
        data: null,
        error: err.message
      };
    }
  }

  /**
   * Update an existing category (Admin only)
   * @param {number} categoryId
   * @param {string} name - New category name
   * @param {string} type - 'Lost' or 'Found'
   * @returns {Promise<Object>}
   */
  async updateCategory(categoryId, name, type) {
    try {
      const updateData = {
        updated_at: new Date().toISOString()
      };

      if (name) updateData.name = name;
      if (type) updateData.type = type;

      const { data, error } = await supabase
        .from('Category')
        .update(updateData)
        .eq('category_id', categoryId)
        .is('deleted_at', null) // Only update non-deleted categories
        .select()
        .single();

      if (error) throw error;

      if (!data) {
        return {
          success: false,
          data: null,
          error: 'Category not found or already deleted'
        };
      }

      const formatted = {
        id: data.category_id,
        name: data.name,
        type: data.type,
        updatedAt: data.updated_at
      };

      return {
        success: true,
        data: formatted,
        error: null
      };
    } catch (err) {
      console.error('Error updating category:', err.message);
      return {
        success: false,
        data: null,
        error: err.message
      };
    }
  }

  /**
   * Soft delete a category (Admin only)
   * @param {number} categoryId
   * @returns {Promise<Object>}
   */
  async deleteCategory(categoryId) {
    try {
      const { data, error } = await supabase
        .from('Category')
        .update({
          deleted_at: new Date().toISOString()
        })
        .eq('category_id', categoryId)
        .is('deleted_at', null) // Only delete non-deleted categories
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        return {
          success: false,
          data: null,
          error: 'Category not found or already deleted'
        };
      }

      return {
        success: true,
        data: { id: data[0].category_id },
        error: null
      };
    } catch (err) {
      console.error('Error deleting category:', err.message);
      return {
        success: false,
        data: null,
        error: err.message
      };
    }
  }
}

export default new CategoryModel();

