/**
 * Image Compressor Utility
 * Nén ảnh để giảm kích thước trước khi upload
 */

/**
 * Compress ảnh về kích thước nhỏ hơn
 * @param {File} file - File ảnh gốc
 * @param {Object} options - Tùy chọn nén
 * @returns {Promise<string>} - Base64 string của ảnh đã nén
 */
export const compressImage = (file, options = {}) => {
  return new Promise((resolve, reject) => {
    const {
      maxWidth = 1200,        // Chiều rộng tối đa
      maxHeight = 1200,       // Chiều cao tối đa
      quality = 0.8,          // Chất lượng ảnh (0-1)
      outputFormat = 'image/jpeg'  // Format output
    } = options;

    // Kiểm tra file có phải là ảnh không
    if (!file.type.startsWith('image/')) {
      reject(new Error('File không phải là ảnh'));
      return;
    }

    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('Không thể đọc file'));
    };

    reader.onload = (e) => {
      const img = new Image();

      img.onerror = () => {
        reject(new Error('Không thể load ảnh'));
      };

      img.onload = () => {
        try {
          // Tính toán kích thước mới giữ nguyên tỉ lệ
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);
          }

          // Tạo canvas để vẽ ảnh đã resize
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          
          // Vẽ ảnh lên canvas với kích thước mới
          ctx.drawImage(img, 0, 0, width, height);

          // Convert canvas thành base64
          const compressedBase64 = canvas.toDataURL(outputFormat, quality);

          // Log để debug
          const originalSize = (file.size / 1024).toFixed(2);
          const compressedSize = ((compressedBase64.length * 3) / 4 / 1024).toFixed(2);
          console.log(`📦 Image compressed: ${originalSize}KB → ${compressedSize}KB (${((compressedSize / originalSize) * 100).toFixed(1)}%)`);

          resolve(compressedBase64);
        } catch (error) {
          reject(new Error('Không thể nén ảnh: ' + error.message));
        }
      };

      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Compress nhiều ảnh cùng lúc
 * @param {File[]} files - Mảng các file ảnh
 * @param {Object} options - Tùy chọn nén
 * @returns {Promise<string[]>} - Mảng base64 strings của các ảnh đã nén
 */
export const compressImages = async (files, options = {}) => {
  if (!Array.isArray(files)) {
    throw new Error('files phải là một mảng');
  }

  console.log(`🖼️ Compressing ${files.length} image(s)...`);

  const promises = files.map(file => compressImage(file, options));
  
  try {
    const results = await Promise.all(promises);
    console.log(`✅ Successfully compressed ${results.length} image(s)`);
    return results;
  } catch (error) {
    console.error('❌ Error compressing images:', error);
    throw error;
  }
};

/**
 * Validate ảnh trước khi upload
 * @param {File} file - File cần validate
 * @param {Object} options - Tùy chọn validate
 * @returns {Object} - { valid: boolean, error: string }
 */
export const validateImage = (file, options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024,  // 10MB mặc định
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  } = options;

  // Kiểm tra có phải là file không
  if (!file || !(file instanceof File)) {
    return { valid: false, error: 'File không hợp lệ' };
  }

  // Kiểm tra loại file
  if (!allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: `Chỉ chấp nhận các định dạng: ${allowedTypes.map(t => t.split('/')[1]).join(', ')}`
    };
  }

  // Kiểm tra kích thước
  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: `Kích thước file không được vượt quá ${(maxSize / 1024 / 1024).toFixed(0)}MB`
    };
  }

  return { valid: true, error: null };
};

export default {
  compressImage,
  compressImages,
  validateImage
};

