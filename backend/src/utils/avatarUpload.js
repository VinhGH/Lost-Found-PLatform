import { supabase } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Upload avatar to Supabase Storage
 * @param {string} base64String - Base64 encoded image
 * @param {number} accountId - User account ID
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export async function uploadAvatar(base64String, accountId) {
  try {
    if (!base64String || !base64String.startsWith('data:image')) {
      return { success: false, error: 'Invalid image format' };
    }

    // Extract base64 data and mime type
    const matches = base64String.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return { success: false, error: 'Invalid base64 string' };
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    
    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');

    // Generate unique filename
    const fileExt = mimeType.split('/')[1];
    const fileName = `avatar_${accountId}_${uuidv4()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    console.log('📤 Uploading avatar to Supabase Storage:', filePath);
    console.log('📦 Bucket: Images');

    // Upload to Supabase Storage bucket 'Images' (case-sensitive!)
    const { error } = await supabase.storage
      .from('Images')
      .upload(filePath, buffer, {
        contentType: mimeType,
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

    console.log('✅ Avatar uploaded:', urlData.publicUrl);

    return {
      success: true,
      url: urlData.publicUrl,
      path: filePath,
    };
  } catch (err) {
    console.error('❌ Avatar upload error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Delete old avatar from Supabase Storage
 * @param {string} avatarUrl - Full URL of avatar to delete
 */
export async function deleteAvatar(avatarUrl) {
  try {
    if (!avatarUrl || !avatarUrl.includes('/storage/v1/object/public/Images/')) {
      return { success: false, error: 'Invalid avatar URL' };
    }

    // Extract file path from URL
    const urlParts = avatarUrl.split('/storage/v1/object/public/Images/');
    if (urlParts.length !== 2) {
      return { success: false, error: 'Cannot extract file path from URL' };
    }

    const filePath = urlParts[1];

    console.log('🗑️ Deleting old avatar:', filePath);

    const { error } = await supabase.storage
      .from('Images')
      .remove([filePath]);

    if (error) {
      console.error('❌ Delete error:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Old avatar deleted');
    return { success: true };
  } catch (err) {
    console.error('❌ Avatar deletion error:', err);
    return { success: false, error: err.message };
  }
}

