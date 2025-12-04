/**
 * AI Matching Service
 * 
 * AI matching sử dụng backend API với transformers.js
 * - Chạy mỗi 1 tiếng để quét các bài đăng
 * - Backend quét bài đăng trong vòng 30 ngày sau khi đăng tin
 * - Tạo thông báo khi tìm thấy bài đăng có điểm tương đồng
 */

import httpClient from './httpClient.js';

class AIMatchingService {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
    this.oneHourInMs = 60 * 60 * 1000; // 1 tiếng = 3600000 ms
  }

  /**
   * Bắt đầu quét AI matching tự động (mỗi 1 tiếng)
   */
  startScanning() {
    if (this.isRunning) {
      console.log("⚠️ AI Matching đang chạy rồi");
      return;
    }

    console.log("✅ Bắt đầu AI Matching Service (quét mỗi 1 tiếng)");
    this.isRunning = true;

    // Quét ngay lần đầu
    this.scanForMatches();

    // Sau đó quét mỗi 1 tiếng
    this.intervalId = setInterval(() => {
      this.scanForMatches();
    }, this.oneHourInMs);
  }

  /**
   * Dừng quét AI matching
   */
  stopScanning() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      console.log("⏹️ Đã dừng AI Matching Service");
    }
  }

  /**
   * Quét các bài đăng để tìm match (gọi backend API)
   */
  async scanForMatches() {
    try {
      console.log("🔍 Bắt đầu quét AI matching...");

      // Gọi backend API để quét matches
      const response = await httpClient.post('/matches/scan', {}, {}, { preferUser: true });

      if (response.success) {
        const data = response.data?.data || response.data;
        console.log(`✅ AI Matching completed:`, data);
        console.log(`📊 Scanned: ${data.scannedPosts} posts`);
        console.log(`🔍 Found: ${data.matchesFound} potential matches`);
        console.log(`💾 Created: ${data.matchesCreated} new matches`);
        console.log(`📨 Sent: ${data.notificationsSent} notifications`);

        // Dispatch event để UI cập nhật
        if (data.notificationsSent > 0) {
          window.dispatchEvent(new CustomEvent('notificationAdded', { 
            detail: { count: data.notificationsSent, type: 'ai_matching' }
          }));
        }
      } else {
        console.error("❌ AI Matching failed:", response.error);
      }
    } catch (error) {
      console.error("❌ Lỗi khi quét AI matching:", error);
    }
  }

}

// Export singleton instance
const aiMatchingService = new AIMatchingService();
export default aiMatchingService;

