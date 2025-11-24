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
}

export default new CategoryModel();

