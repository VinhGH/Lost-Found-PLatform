/**
 * Post Formatter Utility
 * Format post data from DB to Frontend-compatible structure
 */

/**
 * Map database status to frontend status
 * DB: 'Pending', 'Approved', 'Rejected', 'Resolved' (PascalCase)
 * Frontend: 'pending', 'active', 'rejected', 'resolved' (lowercase)
 */
export function mapStatus(dbStatus) {
  if (!dbStatus) return 'pending';
  
  const statusMap = {
    'Pending': 'pending',
    'Approved': 'active',    // Approved -> active
    'Rejected': 'rejected',
    'Resolved': 'resolved'
  };
  
  return statusMap[dbStatus] || dbStatus.toLowerCase();
}

/**
 * Map database post_type to frontend type
 * DB: 'Lost', 'Found' (PascalCase)
 * Frontend: 'lost', 'found' (lowercase)
 */
export function mapPostType(dbPostType) {
  if (!dbPostType) return 'lost';
  return dbPostType.toLowerCase();
}

/**
 * Format location string from Location object
 * Format: "Tòa {building} - Phòng {room} - {address}"
 */
export function formatLocation(location) {
  if (!location) return '';
  
  const parts = [];
  
  if (location.Building) {
    parts.push(`Tòa ${location.Building}`);
  }
  
  if (location.Room) {
    parts.push(`Phòng ${location.Room}`);
  }
  
  if (location.Address) {
    parts.push(location.Address);
  }
  
  return parts.join(' - ');
}

/**
 * Format a single post from DB to Frontend structure
 * @param {Object} post - Post object from DB
 * @param {Object} account - Account object (joined)
 * @param {Object} location - Location object (joined)
 * @param {Array} images - Array of image URLs
 * @returns {Object} Formatted post
 */
export function formatPost(post, account = null, location = null, images = []) {
  // Extract data
  const postId = post.Post_id || post.post_id;
  const postType = post.Post_type || post.post_type;
  const postTitle = post.Post_Title || post.Post_title || post.title;
  const itemName = post.Item_name || post.item_name;
  const status = post.Status || post.status;
  const createdAt = post.Created_at || post.created_at;
  const updatedAt = post.Updated_at || post.updated_at;
  
  // Format timestamps to milliseconds
  const createdAtMs = createdAt ? new Date(createdAt).getTime() : null;
  const updatedAtMs = updatedAt ? new Date(updatedAt).getTime() : null;
  
  // Format date (YYYY-MM-DD)
  const date = createdAt ? new Date(createdAt).toISOString().split('T')[0] : null;
  
  // Format location
  const locationStr = location ? formatLocation(location) : '';
  
  // Format images
  const imageArray = Array.isArray(images) ? images : [];
  const firstImage = imageArray.length > 0 ? imageArray[0] : null;
  
  // Format author and contact
  const author = account ? (account.User_name || account.user_name || account.Email || account.email) : '';
  const contact = account ? (account.Phone_number || account.phone_number || '') : '';
  
  return {
    id: postId,
    type: mapPostType(postType),
    title: postTitle || itemName || '',
    description: itemName || '',
    category: '', // Will be filled by caller
    location: locationStr,
    author: author,
    contact: contact,
    image: firstImage,
    images: imageArray,
    date: date,
    status: mapStatus(status),
    createdAt: createdAtMs,
    updatedAt: updatedAtMs
  };
}

/**
 * Format multiple posts
 * @param {Array} posts - Array of posts with joined data
 * @returns {Array} Array of formatted posts
 */
export function formatPosts(posts) {
  if (!Array.isArray(posts)) return [];
  
  return posts.map(post => {
    // Extract joined data if exists
    const account = post.Account || null;
    const location = post.Location || null;
    const images = post.images || [];
    
    return formatPost(post, account, location, images);
  });
}

/**
 * Convert milliseconds to ISO date string (YYYY-MM-DD)
 */
export function msToDateString(ms) {
  if (!ms) return null;
  return new Date(ms).toISOString().split('T')[0];
}

/**
 * Convert ISO date string to milliseconds
 */
export function dateStringToMs(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).getTime();
}

