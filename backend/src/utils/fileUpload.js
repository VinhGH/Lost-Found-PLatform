import { supabase } from '../config/db.js';
import crypto from 'crypto';

/**
 * Upload a single file to Supabase Storage
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - Original file name
 * @param {string} bucket - Storage bucket name (default: 'post-images')
 * @returns {Promise<Object>}
 */
export const uploadFile = async (fileBuffer, fileName, bucket = 'post-images') => {
  try {
    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (fileBuffer.length > maxSize) {
      return {
        success: false,
        error: 'File size exceeds 5MB limit',
        url: null
      };
    }

    // Generate unique file name
    const fileExt = fileName.split('.').pop();
    const uniqueName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `uploads/${uniqueName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        contentType: `image/${fileExt}`,
        upsert: false
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      success: true,
      url: publicUrl,
      path: filePath,
      error: null
    };
  } catch (err) {
    console.error('Error uploading file:', err.message);
    return {
      success: false,
      url: null,
      error: err.message
    };
  }
};

/**
 * Upload multiple files to Supabase Storage
 * @param {Array<Object>} files - Array of { buffer, name }
 * @param {string} bucket - Storage bucket name
 * @returns {Promise<Object>}
 */
export const uploadMultipleFiles = async (files, bucket = 'post-images') => {
  try {
    const uploadPromises = files.map(file => 
      uploadFile(file.buffer, file.name, bucket)
    );

    const results = await Promise.all(uploadPromises);

    const successfulUploads = results.filter(r => r.success);
    const failedUploads = results.filter(r => !r.success);

    return {
      success: failedUploads.length === 0,
      urls: successfulUploads.map(r => r.url),
      paths: successfulUploads.map(r => r.path),
      failed: failedUploads.length,
      error: failedUploads.length > 0 ? 'Some files failed to upload' : null
    };
  } catch (err) {
    console.error('Error uploading multiple files:', err.message);
    return {
      success: false,
      urls: [],
      error: err.message
    };
  }
};

/**
 * Delete a file from Supabase Storage
 * @param {string} filePath - Path to file in storage
 * @param {string} bucket - Storage bucket name
 * @returns {Promise<Object>}
 */
export const deleteFile = async (filePath, bucket = 'post-images') => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) throw error;

    return {
      success: true,
      error: null
    };
  } catch (err) {
    console.error('Error deleting file:', err.message);
    return {
      success: false,
      error: err.message
    };
  }
};

/**
 * Delete multiple files from Supabase Storage
 * @param {Array<string>} filePaths - Array of file paths
 * @param {string} bucket - Storage bucket name
 * @returns {Promise<Object>}
 */
export const deleteMultipleFiles = async (filePaths, bucket = 'post-images') => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove(filePaths);

    if (error) throw error;

    return {
      success: true,
      error: null
    };
  } catch (err) {
    console.error('Error deleting multiple files:', err.message);
    return {
      success: false,
      error: err.message
    };
  }
};

/**
 * Validate image file
 * @param {string} fileName
 * @param {number} fileSize
 * @returns {Object}
 */
export const validateImageFile = (fileName, fileSize) => {
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  const fileExt = fileName.split('.').pop().toLowerCase();

  if (!allowedExtensions.includes(fileExt)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowedExtensions.join(', ')}`
    };
  }

  if (fileSize > maxSize) {
    return {
      valid: false,
      error: 'File size exceeds 5MB limit'
    };
  }

  return {
    valid: true,
    error: null
  };
};

/**
 * Get file URL from path
 * @param {string} filePath
 * @param {string} bucket
 * @returns {string}
 */
export const getFileUrl = (filePath, bucket = 'post-images') => {
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return publicUrl;
};

