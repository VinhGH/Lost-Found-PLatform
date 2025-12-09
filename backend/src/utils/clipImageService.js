/**
 * CLIP Image Service (offline, no API key)
 * Model: Xenova/clip-vit-base-patch32
 * 
 * Note: Using zero-shot-image-classification pipeline as it handles
 * image preprocessing correctly and we can extract similarity scores.
 */
import { pipeline, env } from '@xenova/transformers';

// Use remote models
env.allowLocalModels = false;

class ClipImageService {
  constructor() {
    this.classifier = null;
    this.isInitialized = false;
    this.initPromise = null;
    // Simple in-memory cache: URL -> embedding vector
    this.embeddingCache = new Map();
    this.imageCache = new Map(); // Cache for image data
  }

  async initializeModel() {
    if (this.initPromise) return this.initPromise;
    if (this.isInitialized) return;

    this.initPromise = (async () => {
      console.log('⏳ Loading CLIP model (Xenova/clip-vit-base-patch32)...');
      try {
        // Use zero-shot-image-classification pipeline
        // This pipeline handles image preprocessing correctly
        this.classifier = await pipeline('zero-shot-image-classification', 'Xenova/clip-vit-base-patch32', {
          quantized: true,
        });
        this.isInitialized = true;
        console.log('✅ CLIP model loaded: Xenova/clip-vit-base-patch32');
      } catch (error) {
        console.error('❌ Error loading CLIP model:', error.message);
        console.error('Full error:', error);
        throw error;
      }
    })();

    return this.initPromise;
  }

  cosineSimilarity(vec1, vec2) {
    let dot = 0, n1 = 0, n2 = 0;
    for (let i = 0; i < vec1.length; i++) {
      dot += vec1[i] * vec2[i];
      n1 += vec1[i] * vec1[i];
      n2 += vec2[i] * vec2[i];
    }
    return dot / (Math.sqrt(n1) * Math.sqrt(n2));
  }

  /**
   * Get classification scores for an image using a common set of labels
   * This creates a feature vector that can be compared between images
   */
  async getImageFeatures(imageUrl) {
    if (!this.isInitialized) {
      await this.initializeModel();
    }
    if (this.embeddingCache.has(imageUrl)) {
      console.log(`💾 CLIP cache hit for ${imageUrl}`);
      return this.embeddingCache.get(imageUrl);
    }

    try {
      console.log(`⬇️  CLIP processing image: ${imageUrl}`);
      
      // Use a comprehensive set of labels to create a feature vector
      // These labels cover common object categories
      const labels = [
        'jewelry', 'ring', 'watch', 'necklace', 'earring',
        'electronic device', 'phone', 'laptop', 'tablet',
        'clothing', 'shirt', 'pants', 'shoes', 'bag',
        'book', 'document', 'paper',
        'key', 'wallet', 'card', 'money',
        'pet', 'dog', 'cat', 'animal',
        'vehicle', 'bicycle', 'motorcycle', 'car',
        'food', 'bottle', 'container',
        'tool', 'equipment', 'accessory'
      ];
      
      const result = await this.classifier(imageUrl, labels);
      
      // Extract scores as feature vector
      // Sort by label order to ensure consistency
      const scoreMap = new Map(result.map(r => [r.label, r.score]));
      const scores = labels.map(label => scoreMap.get(label) || 0);
      
      // Normalize vector
      const norm = Math.sqrt(scores.reduce((sum, val) => sum + val * val, 0));
      const normalizedScores = norm > 0 ? scores.map(v => v / norm) : scores;

      // Cache embedding
      this.embeddingCache.set(imageUrl, normalizedScores);
      return normalizedScores;
    } catch (err) {
      console.error(`❌ CLIP getImageFeatures error for ${imageUrl}:`, err.message);
      console.error('Error stack:', err.stack);
      // Return zero vector on error (will result in 0 similarity)
      const zeroVec = new Array(35).fill(0); // Match label count
      this.embeddingCache.set(imageUrl, zeroVec);
      return zeroVec;
    }
  }

  /**
   * So sánh 2 ảnh, trả similarity 0-1
   * Uses cosine similarity on classification score vectors
   */
  async compareImagesCLIP(url1, url2) {
    if (!url1 || !url2) return 0;
    try {
      const [features1, features2] = await Promise.all([
        this.getImageFeatures(url1),
        this.getImageFeatures(url2)
      ]);
      return this.cosineSimilarity(features1, features2);
    } catch (err) {
      console.error('❌ CLIP image compare error:', err.message || err);
      return 0;
    }
  }

  /**
   * So sánh nhiều ảnh giữa 2 post, lấy max similarity
   */
  async analyzeImageSimilarity(post1, post2) {
    const images1 = post1.Image_urls || [];
    const images2 = post2.Image_urls || [];
    if (images1.length === 0 || images2.length === 0) return 0;

    let maxSim = 0;
    for (const img1 of images1) {
      for (const img2 of images2) {
        if (!img1 || !img2) continue;
        const sim = await this.compareImagesCLIP(img1, img2);
        if (sim > maxSim) maxSim = sim;
      }
    }
    console.log(`📊 CLIP image similarity max=${(maxSim * 100).toFixed(2)}% (pairs=${images1.length * images2.length})`);
    return maxSim;
  }
}

export default new ClipImageService();