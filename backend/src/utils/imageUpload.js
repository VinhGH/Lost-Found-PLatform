import { supabase } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Upload post image to Supabase Storage
 * @param {string} base64String - Base64 encoded image
 * @param {number} postId - Post ID
 * @param {string} type - 'lost' or 'found'
 * @returns {Promise<{success: boolean, url?: string, path?: string, error?: string}>}
 */
export async function uploadPostImage(base64String, postId, type) {
  try {
    if (!base64String || !base64String.startsWith('data:image')) {
      return { success: false, error: 'Invalid base64 image string' };
    }

    // Parse base64 string
    const matches = base64String.match(/^data:image\/([a-zA-Z]*);base64,(.*)$/);
    if (!matches || matches.length !== 3) {
      return { success: false, error: 'Invalid base64 format' };
    }

    const imageType = matches[1]; // e.g., 'jpeg', 'png'
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // Generate unique filename
    const fileName = `${type}_${postId}_${uuidv4()}.${imageType}`;
    const filePath = `posts/${type}/${fileName}`;

    console.log(`📤 Uploading image to Supabase Storage: ${filePath}`);

    // Upload to Supabase Storage bucket 'Images'
    const { data, error } = await supabase.storage
      .from('Images')
      .upload(filePath, buffer, {
        contentType: `image/${imageType}`,
        upsert: false,
      });

    if (error) {
      console.error('❌ Upload error:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('Images')
      .getPublicUrl(filePath);

    console.log('✅ Image uploaded:', urlData.publicUrl);
    return { success: true, url: urlData.publicUrl, path: filePath };
  } catch (err) {
    console.error('❌ Image upload error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Delete post image from Supabase Storage
 * @param {string} imageUrl - Image URL to delete
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deletePostImage(imageUrl) {
  try {
    if (!imageUrl || !imageUrl.includes('/storage/v1/object/public/Images/')) {
      return { success: false, error: 'Invalid image URL' };
    }

    const urlParts = imageUrl.split('/storage/v1/object/public/Images/');
    const filePath = urlParts[1];

    console.log('🗑️ Deleting image:', filePath);

    const { error } = await supabase.storage
      .from('Images')
      .remove([filePath]);

    if (error) {
      console.error('❌ Delete error:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Image deleted:', filePath);
    return { success: true };
  } catch (err) {
    console.error('❌ Image delete error:', err);
    return { success: false, error: err.message };
  }
}


