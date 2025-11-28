/**
 * AI Matching Service
 * 
 * Mô phỏng AI matching text vs text, hình ảnh vs hình ảnh
 * - Chạy mỗi 1 tiếng để quét các bài đăng
 * - Chỉ quét bài đăng trong vòng 30 ngày sau khi đăng tin
 * - Tạo thông báo khi tìm thấy bài đăng có điểm tương đồng
 * 
 * TODO: Thay thế bằng BE API khi backend AI matching được implement
 */

class AIMatchingService {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
    this.oneHourInMs = 60 * 60 * 1000; // 1 tiếng = 3600000 ms
    this.thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000; // 30 ngày
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
   * Quét các bài đăng để tìm match
   */
  async scanForMatches() {
    try {
      console.log("🔍 Bắt đầu quét AI matching...");

      const posts = await this.getAllPosts();
      const now = Date.now();

      // Filter chỉ lấy bài đăng trong vòng 30 ngày
      const recentPosts = posts.filter(post => {
        const postTime = post.createdAt || post.id || now;
        const age = now - postTime;
        return age <= this.thirtyDaysInMs;
      });

      console.log(`📊 Tìm thấy ${recentPosts.length} bài đăng trong vòng 30 ngày`);

      // Tìm matches (mock logic - sẽ thay bằng BE API)
      const matches = this.findMatches(recentPosts);

      if (matches.length > 0) {
        console.log(`✅ Tìm thấy ${matches.length} bài đăng có điểm tương đồng`);
        this.createNotifications(matches);
      } else {
        console.log("ℹ️ Không tìm thấy bài đăng nào có điểm tương đồng");
      }
    } catch (error) {
      console.error("❌ Lỗi khi quét AI matching:", error);
    }
  }

  /**
   * Lấy tất cả bài đăng từ API (thay vì localStorage)
   * TODO: Implement API call khi backend có endpoint
   */
  async getAllPosts() {
    try {
      // TODO: Gọi API để lấy posts
      // const response = await httpClient.get('/posts');
      // if (response.success) {
      //   return response.data.posts || response.data || [];
      // }
      // Tạm thời return empty array vì không còn dùng localStorage
      console.warn('⚠️ AI Matching Service: getAllPosts() chưa được implement với API');
      return [];
    } catch (error) {
      console.error("❌ Lỗi khi load posts:", error);
      return [];
    }
  }

  /**
   * Tìm các bài đăng có điểm tương đồng (mock logic)
   * TODO: Thay bằng API call đến backend AI matching
   */
  findMatches(posts) {
    const matches = [];

    // Logic mock: Tìm bài đăng "lost" và "found" có mô tả/tên tương tự
    // Trong thực tế, sẽ gọi BE API để so sánh text và hình ảnh
    for (let i = 0; i < posts.length; i++) {
      const post1 = posts[i];
      
      for (let j = i + 1; j < posts.length; j++) {
        const post2 = posts[j];

        // Chỉ match giữa "lost" và "found"
        if (post1.type === post2.type) continue;

        // Mock: Tính điểm tương đồng dựa trên title và description
        // TODO: Thay bằng BE AI matching (text vs text, image vs image)
        const similarity = this.calculateMockSimilarity(post1, post2);

        // Nếu điểm tương đồng > 0.3 (30%), coi như match (để dễ test)
        // TODO: Điều chỉnh threshold này khi có BE thật
        if (similarity > 0.3) {
          matches.push({
            post1: post1,
            post2: post2,
            similarity: similarity,
            matchType: post1.type === "lost" ? "lost_found" : "found_lost",
          });
        }
      }
    }

    return matches;
  }

  /**
   * Tính điểm tương đồng mock (dựa trên title và description)
   * TODO: Thay bằng BE AI matching thật
   */
  calculateMockSimilarity(post1, post2) {
    // Mock: So sánh title và description
    const title1 = (post1.title || "").toLowerCase();
    const title2 = (post2.title || "").toLowerCase();
    const desc1 = (post1.description || "").toLowerCase();
    const desc2 = (post2.description || "").toLowerCase();

    // Tính điểm tương đồng đơn giản (có thể có keyword chung)
    let score = 0;
    const keywords1 = [...title1.split(" "), ...desc1.split(" ")].filter(w => w.length > 2);
    const keywords2 = [...title2.split(" "), ...desc2.split(" ")].filter(w => w.length > 2);

    const commonKeywords = keywords1.filter(k => keywords2.includes(k));
    if (commonKeywords.length > 0) {
      score = Math.min(commonKeywords.length / Math.max(keywords1.length, keywords2.length), 0.8);
    }

    // TODO: Thêm logic so sánh hình ảnh ở đây khi có BE

    return score;
  }

  /**
   * Tạo notifications cho các matches
   */
  createNotifications(matches) {
    try {
      const existingNotifications = this.getNotifications();
      const newNotifications = [];

      matches.forEach(match => {
        const { post1, post2, similarity, matchType } = match;

        // Tạo notification cho người đăng bài 1
        const notification1 = {
          id: `ai_match_${post1.id}_${post2.id}_${Date.now()}`,
          type: "ai_matching",
          title: "🤖 Tìm thấy bài đăng tương đồng",
          message: `Đã tìm thấy bài đăng có điểm tương đồng ${Math.round(similarity * 100)}% với bài đăng của bạn`,
          time: new Date().toISOString(),
          createdAt: Date.now(),
          read: false,
          postId: post2.id,
          postType: post2.type,
          matchedPostId: post1.id,
          matchedPostType: post1.type,
          similarity: similarity,
          matchType: matchType,
          // Thông tin bài đăng match để hiển thị
          matchedPost: {
            id: post2.id,
            title: post2.title,
            description: post2.description,
            images: post2.images || (post2.image ? [post2.image] : []),
            type: post2.type,
            author: post2.author,
            location: post2.location,
          },
        };

        // Tạo notification cho người đăng bài 2
        const notification2 = {
          id: `ai_match_${post2.id}_${post1.id}_${Date.now()}`,
          type: "ai_matching",
          title: "🤖 Tìm thấy bài đăng tương đồng",
          message: `Đã tìm thấy bài đăng có điểm tương đồng ${Math.round(similarity * 100)}% với bài đăng của bạn`,
          time: new Date().toISOString(),
          createdAt: Date.now(),
          read: false,
          postId: post1.id,
          postType: post1.type,
          matchedPostId: post2.id,
          matchedPostType: post2.type,
          similarity: similarity,
          matchType: matchType === "lost_found" ? "found_lost" : "lost_found",
          // Thông tin bài đăng match để hiển thị
          matchedPost: {
            id: post1.id,
            title: post1.title,
            description: post1.description,
            images: post1.images || (post1.image ? [post1.image] : []),
            type: post1.type,
            author: post1.author,
            location: post1.location,
          },
        };

        // Kiểm tra xem notification đã tồn tại chưa (tránh duplicate)
        const exists1 = existingNotifications.some(
          n => n.type === "ai_matching" && 
               n.postId === notification1.postId && 
               n.matchedPostId === notification1.matchedPostId
        );
        
        const exists2 = existingNotifications.some(
          n => n.type === "ai_matching" && 
               n.postId === notification2.postId && 
               n.matchedPostId === notification2.matchedPostId
        );

        if (!exists1) {
          newNotifications.push(notification1);
        }

        if (!exists2) {
          newNotifications.push(notification2);
        }
      });

      // Lưu notifications mới
      if (newNotifications.length > 0) {
        const allNotifications = [...existingNotifications, ...newNotifications];
        localStorage.setItem("notifications", JSON.stringify(allNotifications));
        
        // Dispatch event để NotificationsButton cập nhật
        window.dispatchEvent(new CustomEvent('notificationAdded', { 
          detail: { count: newNotifications.length, type: 'ai_matching' }
        }));

        console.log(`✅ Đã tạo ${newNotifications.length} thông báo AI matching`);
      }
    } catch (error) {
      console.error("❌ Lỗi khi tạo notifications:", error);
    }
  }

  /**
   * Lấy notifications hiện có
   */
  getNotifications() {
    try {
      const saved = localStorage.getItem("notifications");
      if (saved) {
        return JSON.parse(saved);
      }
      return [];
    } catch (error) {
      console.error("❌ Lỗi khi load notifications:", error);
      return [];
    }
  }
}

// Export singleton instance
const aiMatchingService = new AIMatchingService();
export default aiMatchingService;

