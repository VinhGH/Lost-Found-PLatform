/**
 * Gemini Image Service
 * 
 * Sử dụng Google Gemini API để so sánh hình ảnh giữa các bài đăng
 * - So sánh 2 ảnh và trả về similarity score (0-1)
 * - Có caching để tránh gọi API nhiều lần
 * - Rate limiting để tuân thủ Gemini free tier
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

// Rate limiting: Gemini free tier = 60 requests/minute
const RATE_LIMIT_PER_MINUTE = 60;
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

class GeminiImageService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.genAI = null;
    this.model = null;
    this.isInitialized = false;
    
    // Rate limiting
    this.requestQueue = [];
    this.requestCount = 0;
    this.lastResetTime = Date.now();
    
    // Cache for image comparisons
    this.cache = new Map();
    
    // Initialize if API key exists
    if (this.apiKey) {
      this.initialize();
    } else {
      console.warn('⚠️ GEMINI_API_KEY not found in environment variables');
    }
  }

  /**
   * Initialize Gemini API client
   */
  initialize() {
    try {
      if (!this.apiKey) {
        throw new Error('GEMINI_API_KEY is required');
      }

      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      this.isInitialized = true;
      console.log('✅ Gemini Image Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Gemini:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Check rate limit
   */
  async checkRateLimit() {
    const now = Date.now();
    const timeSinceReset = now - this.lastResetTime;

    // Reset counter every minute
    if (timeSinceReset >= 60000) {
      this.requestCount = 0;
      this.lastResetTime = now;
    }

    // If at limit, wait
    if (this.requestCount >= RATE_LIMIT_PER_MINUTE) {
      const waitTime = 60000 - timeSinceReset;
      console.log(`⏳ Rate limit reached. Waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.requestCount = 0;
      this.lastResetTime = Date.now();
    }

    this.requestCount++;
  }

  /**
   * Generate cache key for two images
   */
  getCacheKey(url1, url2) {
    // Sort URLs to ensure same key regardless of order
    const sorted = [url1, url2].sort();
    return `${sorted[0]}_${sorted[1]}`;
  }

  /**
   * Load image from URL and convert to base64
   */
  async loadImageAsBase64(imageUrl) {
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000, // 10 seconds timeout
      });

      const buffer = Buffer.from(response.data);
      const base64 = buffer.toString('base64');
      const mimeType = response.headers['content-type'] || 'image/jpeg';

      return {
        data: base64,
        mimeType: mimeType,
      };
    } catch (error) {
      console.error(`❌ Failed to load image ${imageUrl}:`, error.message);
      throw new Error(`Failed to load image: ${error.message}`);
    }
  }

  /**
   * Compare two images using Gemini API
   * @param {string} imageUrl1 - URL of first image
   * @param {string} imageUrl2 - URL of second image
   * @returns {Promise<number>} Similarity score (0-1)
   */
  async compareImages(imageUrl1, imageUrl2) {
    // Check cache first
    const cacheKey = this.getCacheKey(imageUrl1, imageUrl2);
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION_MS) {
      console.log(`💾 Using cached result for image comparison`);
      return cached.score;
    }

    if (!this.isInitialized) {
      console.warn('⚠️ Gemini not initialized, returning 0 similarity');
      return 0;
    }

    try {
      // Check rate limit
      await this.checkRateLimit();

      console.log(`🖼️ Comparing images: ${imageUrl1.substring(0, 50)}... vs ${imageUrl2.substring(0, 50)}...`);

      // Load both images
      const [img1, img2] = await Promise.all([
        this.loadImageAsBase64(imageUrl1),
        this.loadImageAsBase64(imageUrl2),
      ]);

      // Create prompt for Gemini
      const prompt = `Compare these two images and rate their similarity on a scale of 0 to 1, where:
- 1.0 = Identical or nearly identical items
- 0.8-0.9 = Very similar items (same type, color, brand)
- 0.6-0.7 = Similar items (same category, different details)
- 0.4-0.5 = Somewhat similar (related items)
- 0.0-0.3 = Different or unrelated items

Respond with ONLY a number between 0 and 1 (e.g., 0.85), no explanation.`;

      // Call Gemini API
      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            data: img1.data,
            mimeType: img1.mimeType,
          },
        },
        {
          inlineData: {
            data: img2.data,
            mimeType: img2.mimeType,
          },
        },
      ]);

      const response = await result.response;
      const text = response.text().trim();

      // Parse similarity score
      let similarity = parseFloat(text);

      // Validate score
      if (isNaN(similarity) || similarity < 0 || similarity > 1) {
        console.warn(`⚠️ Invalid similarity score from Gemini: ${text}, using 0`);
        similarity = 0;
      }

      // Cache result
      this.cache.set(cacheKey, {
        score: similarity,
        timestamp: Date.now(),
      });

      console.log(`✅ Image similarity: ${(similarity * 100).toFixed(2)}%`);

      return similarity;
    } catch (error) {
      console.error('❌ Error comparing images with Gemini:', error);
      
      // If rate limit error, return 0 and log
      if (error.message?.includes('429') || error.message?.includes('quota')) {
        console.error('⚠️ Gemini API rate limit exceeded');
      }
      
      return 0; // Return 0 on error to not break matching flow
    }
  }

  /**
   * Analyze image similarity for two posts
   * @param {Object} post1 - Post object with images
   * @param {Object} post2 - Post object with images
   * @returns {Promise<number>} Average similarity score
   */
  async analyzeImageSimilarity(post1, post2) {
    const images1 = post1.Image_urls || [];
    const images2 = post2.Image_urls || [];

    // If either post has no images, return 0
    if (images1.length === 0 || images2.length === 0) {
      return 0;
    }

    // Compare all combinations and take the best match
    const comparisons = [];

    for (const img1 of images1) {
      for (const img2 of images2) {
        if (img1 && img2) {
          try {
            const similarity = await this.compareImages(img1, img2);
            comparisons.push(similarity);
          } catch (error) {
            console.error('Error comparing images:', error);
            // Continue with other comparisons
          }
        }
      }
    }

    if (comparisons.length === 0) {
      return 0;
    }

    // Return maximum similarity (best match)
    const maxSimilarity = Math.max(...comparisons);
    
    // Also calculate average for reference
    const avgSimilarity = comparisons.reduce((a, b) => a + b, 0) / comparisons.length;

    console.log(`📊 Image comparison stats: max=${(maxSimilarity * 100).toFixed(2)}%, avg=${(avgSimilarity * 100).toFixed(2)}%, comparisons=${comparisons.length}`);

    return maxSimilarity; // Use max for better matching
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Gemini cache cleared');
  }

  /**
   * Get cache stats
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      maxAge: CACHE_DURATION_MS,
    };
  }
}

// Export singleton instance
export default new GeminiImageService();


