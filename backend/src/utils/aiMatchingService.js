/**
 * AI Matching Service
 * 
 * Sử dụng Transformers.js để tính độ tương đồng giữa các bài đăng
 * - So sánh text description giữa các bài đăng Lost và Found
 * - Tạo matches tự động khi độ tương đồng cao
 */

import { pipeline } from '@xenova/transformers';
import clipImageService from './clipImageService.js';

// Model tốt hơn cho semantic understanding và multilingual support
// Options:
// - "Xenova/all-mpnet-base-v2" - Best for English semantic similarity (384-dim)
// - "Xenova/paraphrase-multilingual-mpnet-base-v2" - Best for multilingual (768-dim, supports Vietnamese)
// - "Xenova/multilingual-e5-large" - Very good for multilingual but larger
const MODEL_NAME = "Xenova/paraphrase-multilingual-mpnet-base-v2"; // Upgraded for better semantic understanding
const SIMILARITY_THRESHOLD = 0.45; // 45% similarity threshold (increased for better accuracy)
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Weights for combining text and image similarity
const TEXT_WEIGHT = 0.6; // 60% weight for text (increased importance)
const IMAGE_WEIGHT = 0.4; // 40% weight for image

// Text component weights (for better semantic matching)
const TITLE_WEIGHT = 0.4; // Title is most important
const ITEM_NAME_WEIGHT = 0.3; // Item name is second most important
const DESCRIPTION_WEIGHT = 0.2; // Description adds context
const LOCATION_WEIGHT = 0.05; // Location is less important
const CATEGORY_WEIGHT = 0.05; // Category is least important

// Minimum text similarity required (to avoid false positives from image-only matches)
const MIN_TEXT_SIMILARITY = 0.35; // Minimum 35% text similarity required

class AIMatchingService {
  constructor() {
    this.extractor = null;
    this.isInitialized = false;
    this.initPromise = null;
  }

  /**
   * Khởi tạo model transformers
   */
  async initializeModel() {
    // Nếu đang khởi tạo, chờ promise hiện tại
    if (this.initPromise) {
      return this.initPromise;
    }

    // Nếu đã khởi tạo rồi, return luôn
    if (this.isInitialized) {
      return;
    }

    // Tạo promise mới để khởi tạo
    this.initPromise = (async () => {
      try {
        console.log(`🤖 Đang tải AI model: ${MODEL_NAME}...`);
        console.log(`📊 Model này hỗ trợ semantic understanding tốt hơn và multilingual (bao gồm tiếng Việt)`);
        this.extractor = await pipeline('feature-extraction', MODEL_NAME, {
          quantized: true, // Sử dụng quantized version để nhanh hơn
        });
        this.isInitialized = true;
        console.log(`✅ AI model đã được tải thành công: ${MODEL_NAME}`);
        console.log(`🎯 Similarity threshold: ${(SIMILARITY_THRESHOLD * 100).toFixed(0)}%`);
      } catch (error) {
        console.error("❌ Lỗi khi tải AI model:", error);
        console.error("💡 Fallback: Đang thử model cũ...");
        // Fallback to smaller model if main model fails
        try {
          this.extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
            quantized: true,
          });
          this.isInitialized = true;
          console.log("✅ Fallback model loaded: Xenova/all-MiniLM-L6-v2");
        } catch (fallbackError) {
          console.error("❌ Fallback model cũng thất bại:", fallbackError);
          this.initPromise = null;
          throw error;
        }
      }
    })();

    return this.initPromise;
  }

  /**
   * Tạo embedding cho text với mean pooling
   * @param {string} text - Text cần tạo embedding
   * @returns {Promise<Array>} - Embedding vector
   */
  async embedding(text) {
    if (!this.isInitialized) {
      await this.initializeModel();
    }

    // Pipeline tự động xử lý tokenization và inference
    const output = await this.extractor(text, { pooling: 'mean', normalize: true });
    // Chuyển tensor thành array
    return Array.from(output.data);
  }

  /**
   * Tính cosine similarity giữa 2 vectors
   * @param {Array} vec1 - Vector 1
   * @param {Array} vec2 - Vector 2
   * @returns {number} - Cosine similarity score (0-1)
   */
  cosineSimilarity(vec1, vec2) {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Tính độ tương đồng giữa 2 đoạn text
   * @param {string} text1 - Text 1
   * @param {string} text2 - Text 2
   * @returns {Promise<number>} - Similarity score (0-1)
   */
  async calculateTextSimilarity(text1, text2) {
    try {
      const emb1 = await this.embedding(text1);
      const emb2 = await this.embedding(text2);
      const similarity = this.cosineSimilarity(emb1, emb2);
      return similarity;
    } catch (error) {
      console.error("❌ Lỗi khi tính similarity:", error);
      return 0;
    }
  }

  /**
   * Normalize text: remove special chars, normalize spaces, lowercase
   * @param {string} text - Text to normalize
   * @returns {string} - Normalized text
   */
  normalizeText(text) {
    if (!text) return '';
    return text
      .toLowerCase()
      .normalize('NFD') // Normalize Vietnamese diacritics
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics for better matching
      .replace(/[^\w\s]/g, ' ') // Replace special chars with space
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  }

  /**
   * Tạo text mô tả từ post để so sánh với weights khác nhau
   * @param {Object} post - Post object
   * @returns {string} - Combined text with weighted repetition
   */
  createPostText(post) {
    const parts = [];

    // Title is most important - repeat it more
    if (post.Post_Title) {
      const normalizedTitle = this.normalizeText(post.Post_Title);
      // Repeat title based on weight (more repetitions = more importance)
      const titleRepetitions = Math.ceil(TITLE_WEIGHT * 10);
      for (let i = 0; i < titleRepetitions; i++) {
        parts.push(normalizedTitle);
      }
    }

    // Item name is second most important
    if (post.Item_name) {
      const normalizedItem = this.normalizeText(post.Item_name);
      const itemRepetitions = Math.ceil(ITEM_NAME_WEIGHT * 10);
      for (let i = 0; i < itemRepetitions; i++) {
        parts.push(normalizedItem);
      }
    }

    // Description adds context
    if (post.Description) {
      const normalizedDesc = this.normalizeText(post.Description);
      const descRepetitions = Math.ceil(DESCRIPTION_WEIGHT * 10);
      for (let i = 0; i < descRepetitions; i++) {
        parts.push(normalizedDesc);
      }
    }

    // Location and category are less important
    if (post.Location_name) {
      parts.push(this.normalizeText(post.Location_name));
    }
    if (post.Category_name) {
      parts.push(this.normalizeText(post.Category_name));
    }

    return parts.join(' ');
  }

  /**
   * Tìm các bài đăng matching trong list posts
   * @param {Array} posts - Danh sách posts cần so sánh
   * @returns {Promise<Array>} - Danh sách matches với similarity score
   */
  async findMatchingPosts(posts) {
    try {
      console.log(`🔍 Bắt đầu quét ${posts.length} bài đăng...`);

      // Filter chỉ lấy bài đăng trong vòng 30 ngày
      const now = Date.now();
      const recentPosts = posts.filter(post => {
        const postTime = new Date(post.Created_at || post.Approved_at).getTime();
        const age = now - postTime;
        return age <= THIRTY_DAYS_MS;
      });

      console.log(`📊 Có ${recentPosts.length} bài đăng trong vòng 30 ngày`);

      const matches = [];

      // So sánh từng cặp post
      for (let i = 0; i < recentPosts.length; i++) {
        const post1 = recentPosts[i];

        // Chỉ xét các bài đăng approved (case-insensitive)
        if ((post1.Status || '').toLowerCase() !== 'approved') continue;

        for (let j = i + 1; j < recentPosts.length; j++) {
          const post2 = recentPosts[j];

          // Chỉ xét các bài đăng approved (case-insensitive)
          if ((post2.Status || '').toLowerCase() !== 'approved') continue;

          // Chỉ match giữa "lost" và "found"
          if (post1.Post_type === post2.Post_type) continue;

          // Skip nếu cùng account (không match với chính mình)
          if (post1.Account_id === post2.Account_id) continue;

          // Tạo text để so sánh
          const text1 = this.createPostText(post1);
          const text2 = this.createPostText(post2);

          // Tính text similarity
          const textSimilarity = await this.calculateTextSimilarity(text1, text2);

          // Tính image similarity (nếu có ảnh)
          let imageSimilarity = 0;
          const hasImages1 = post1.Image_urls && post1.Image_urls.length > 0;
          const hasImages2 = post2.Image_urls && post2.Image_urls.length > 0;

          if (hasImages1 && hasImages2) {
            try {
              console.log(`🖼️ Using CLIP for images (${post1.Image_urls.length} x ${post2.Image_urls.length})`);
              imageSimilarity = await clipImageService.analyzeImageSimilarity(post1, post2);
            } catch (error) {
              console.error('❌ Error calculating image similarity (CLIP):', error);
              // Continue with text similarity only
            }
          } else {
            console.log('ℹ️ Skipping image similarity (one or both posts have no images)');
          }

          // Kết hợp scores với weights
          let finalSimilarity;
          if (hasImages1 && hasImages2) {
            // Có cả text và image: weighted average
            finalSimilarity = (textSimilarity * TEXT_WEIGHT) + (imageSimilarity * IMAGE_WEIGHT);
            console.log(`📝 "${post1.Post_Title}" vs "${post2.Post_Title}" => Text: ${(textSimilarity * 100).toFixed(2)}%, Image: ${(imageSimilarity * 100).toFixed(2)}%, Final: ${(finalSimilarity * 100).toFixed(2)}%`);
          } else {
            // Chỉ có text: dùng text similarity trực tiếp
            finalSimilarity = textSimilarity;
            console.log(`📝 "${post1.Post_Title}" vs "${post2.Post_Title}" => Text: ${(textSimilarity * 100).toFixed(2)}% (no images)`);
          }

          // Additional filtering: Text similarity must be above a minimum threshold
          // even if combined score passes (to avoid false positives from image-only matches)
          const MIN_TEXT_SIMILARITY = 0.35; // Minimum 35% text similarity required
          if (textSimilarity < MIN_TEXT_SIMILARITY) {
            console.log(`⚠️ Skipping match: Text similarity ${(textSimilarity * 100).toFixed(2)}% below minimum ${(MIN_TEXT_SIMILARITY * 100).toFixed(0)}%`);
            continue;
          }

          // Nếu điểm tương đồng > threshold, thêm vào matches
          if (finalSimilarity > SIMILARITY_THRESHOLD) {
            matches.push({
              post1: post1,
              post2: post2,
              similarity: finalSimilarity,
              textSimilarity: textSimilarity,
              imageSimilarity: imageSimilarity,
              hasImages: hasImages1 && hasImages2,
              matchType: post1.Post_type === "lost" ? "lost_found" : "found_lost",
            });
          }
        }
      }

      console.log(`✅ Tìm thấy ${matches.length} cặp bài đăng có điểm tương đồng cao`);
      return matches;
    } catch (error) {
      console.error("❌ Lỗi khi tìm matches:", error);
      return [];
    }
  }

  /**
   * Lấy similarity threshold hiện tại
   * @returns {number}
   */
  getSimilarityThreshold() {
    return SIMILARITY_THRESHOLD;
  }

  /**
   * Quét một bài đăng mới với các bài đăng đối nghịch
   * (Event-driven: Chạy khi admin approve bài)
   * @param {Object} newPost - Bài đăng mới được approve
   * @param {Array} existingPosts - Danh sách bài đăng đối nghịch (Lost vs Found)
   * @returns {Promise<Array>} - Danh sách matches
   */
  async scanSinglePost(newPost, existingPosts) {
    try {
      console.log(`🔍 Scanning new ${newPost.Post_type} post: "${newPost.Post_Title}"`);
      console.log(`📊 Comparing against ${existingPosts.length} existing posts`);

      const matches = [];
      const newPostText = this.createPostText(newPost);

      // So sánh với từng bài đăng đối nghịch
      for (const existingPost of existingPosts) {
        // Skip nếu cùng loại (safety check)
        if (newPost.Post_type === existingPost.Post_type) continue;

        // Skip nếu cùng account (không match với chính mình)
        if (newPost.Account_id === existingPost.Account_id) continue;

        const existingPostText = this.createPostText(existingPost);

        // Tính text similarity
        const textSimilarity = await this.calculateTextSimilarity(newPostText, existingPostText);

        // Tính image similarity (nếu có ảnh)
        let imageSimilarity = 0;
        const hasImages1 = newPost.Image_urls && newPost.Image_urls.length > 0;
        const hasImages2 = existingPost.Image_urls && existingPost.Image_urls.length > 0;

        if (hasImages1 && hasImages2) {
          try {
            console.log(`🖼️ Using CLIP for images (${newPost.Image_urls.length} x ${existingPost.Image_urls.length})`);
            imageSimilarity = await clipImageService.analyzeImageSimilarity(newPost, existingPost);
          } catch (error) {
            console.error('❌ Error calculating image similarity (CLIP):', error);
          }
        } else {
          console.log('ℹ️ Skipping image similarity (one or both posts have no images)');
        }

        // Kết hợp scores với weights
        let finalSimilarity;
        if (hasImages1 && hasImages2) {
          // Có cả text và image: weighted average
          finalSimilarity = (textSimilarity * TEXT_WEIGHT) + (imageSimilarity * IMAGE_WEIGHT);
          console.log(`📝 "${newPost.Post_Title}" vs "${existingPost.Post_Title}" => Text: ${(textSimilarity * 100).toFixed(2)}%, Image: ${(imageSimilarity * 100).toFixed(2)}%, Final: ${(finalSimilarity * 100).toFixed(2)}%`);
        } else {
          // Chỉ có text: dùng text similarity trực tiếp
          finalSimilarity = textSimilarity;
          console.log(`📝 "${newPost.Post_Title}" vs "${existingPost.Post_Title}" => Text: ${(textSimilarity * 100).toFixed(2)}% (no images)`);
        }

        // Additional filtering: Text similarity must be above a minimum threshold
        // even if combined score passes (to avoid false positives from image-only matches)
        if (textSimilarity < MIN_TEXT_SIMILARITY) {
          console.log(`⚠️ Skipping match: Text similarity ${(textSimilarity * 100).toFixed(2)}% below minimum ${(MIN_TEXT_SIMILARITY * 100).toFixed(0)}%`);
          continue;
        }

        // Nếu điểm tương đồng > threshold, thêm vào matches
        if (finalSimilarity > SIMILARITY_THRESHOLD) {
          matches.push({
            post1: newPost,
            post2: existingPost,
            similarity: finalSimilarity,
            textSimilarity: textSimilarity,
            imageSimilarity: imageSimilarity,
            hasImages: hasImages1 && hasImages2,
            matchType: newPost.Post_type === "lost" ? "lost_found" : "found_lost",
          });
        }
      }

      console.log(`✅ Found ${matches.length} matches for new post`);
      return matches;
    } catch (error) {
      console.error("❌ Error in scanSinglePost:", error);
      return [];
    }
  }

  /**
   * Kiểm tra xem model đã được khởi tạo chưa
   * @returns {boolean}
   */
  isModelReady() {
    return this.isInitialized;
  }
}

// Export singleton instance
export default new AIMatchingService();

