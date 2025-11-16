/**
 * Category Parser Utility
 * Since the DB doesn't have a Category table, we'll just return the string as-is
 * In the future, if a Category table is added, this can be extended
 */

/**
 * Valid categories
 */
export const VALID_CATEGORIES = [
  'Điện thoại',
  'Ví/Túi',
  'Chìa khóa',
  'Giấy tờ',
  'Balo/Cặp',
  'Đồ điện tử',
  'Khác'
];

/**
 * Validate category string
 * @param {string} category
 * @returns {boolean}
 */
export function isValidCategory(category) {
  return VALID_CATEGORIES.includes(category);
}

/**
 * Get category string (pass-through for now)
 * @param {string} category
 * @returns {string}
 */
export function getCategoryString(category) {
  return category || 'Khác';
}

/**
 * Parse category from request
 * For now, just validate and return the string
 * In the future, this could map to category IDs if a Category table exists
 * @param {string} categoryString
 * @returns {Promise<string>}
 */
export async function parseCategory(categoryString) {
  if (!categoryString) return 'Khác';
  
  // If valid, return as-is
  if (isValidCategory(categoryString)) {
    return categoryString;
  }
  
  // Otherwise return default
  return 'Khác';
}

