# Frontend Integration Guide - Lost & Found Platform

## 📋 Mục lục
1. [Tổng quan](#tổng-quan)
2. [API Endpoints](#api-endpoints)
3. [AI Matching Integration](#ai-matching-integration)
4. [Authentication](#authentication)
5. [Code Examples](#code-examples)
6. [Testing Checklist](#testing-checklist)

---

## Tổng quan

Backend đã sẵn sàng với các tính năng:
- ✅ Authentication (OTP-based)
- ✅ Posts Management (Lost/Found)
- ✅ AI Matching (Text + Image)
- ✅ Notifications
- ✅ Chat
- ✅ Categories & Locations

**Base URL:** `http://localhost:5000/api` (hoặc production URL)

---

## API Endpoints

### 🔐 Authentication (`/api/auth`)

#### 1. Request OTP
```
POST /api/auth/request-otp
Body: {
  "email": "user@example.com"
}
Response: {
  "success": true,
  "message": "OTP sent to email"
}
```

#### 2. Verify OTP & Login
```
POST /api/auth/verify-otp
Body: {
  "email": "user@example.com",
  "otp": "123456"
}
Response: {
  "success": true,
  "token": "jwt_token_here",
  "data": {
    "account_id": 123,
    "username": "user",
    "role": "User"
  }
}
```

#### 3. Request Password Reset OTP
```
POST /api/auth/request-password-reset
Body: {
  "email": "user@example.com"
}
```

#### 4. Reset Password
```
POST /api/auth/reset-password
Body: {
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "newpassword123"
}
```

---

### 👤 Account Management (`/api/accounts`)

#### 1. Register
```
POST /api/accounts/register
Body: {
  "username": "newuser",
  "email": "user@example.com",
  "password": "password123",
  "full_name": "Full Name"
}
```

#### 2. Login
```
POST /api/accounts/login
Body: {
  "email": "user@example.com",
  "password": "password123"
}
Response: {
  "success": true,
  "token": "jwt_token",
  "data": {...}
}
```

#### 3. Get Profile
```
GET /api/accounts/profile
Headers: {
  "Authorization": "Bearer token"
}
```

#### 4. Update Profile
```
PUT /api/accounts/profile
Headers: {
  "Authorization": "Bearer token"
}
Body: {
  "full_name": "New Name",
  "phone": "0123456789"
}
```

#### 5. Change Password
```
POST /api/accounts/change-password
Headers: {
  "Authorization": "Bearer token"
}
Body: {
  "oldPassword": "old123",
  "newPassword": "new123"
}
```

---

### 📝 Posts (`/api/posts`)

#### 1. Get All Posts
```
GET /api/posts?page=1&limit=10&type=lost&status=approved
Query Params:
  - page: số trang (default: 1)
  - limit: số items/trang (default: 10)
  - type: 'lost' | 'found'
  - status: 'pending' | 'approved' | 'rejected'
  - category: category name
  - location: location name
  - search: search keyword
```

#### 2. Get Post by ID
```
GET /api/posts/:id?type=lost
Query Params:
  - type: 'lost' | 'found' (required)
```

#### 3. Create Post
```
POST /api/posts
Headers: {
  "Authorization": "Bearer token"
}
Body: {
  "type": "lost",
  "title": "Mất điện thoại iPhone",
  "description": "Mất ở khu vực thư viện...",
  "category": "Điện tử",
  "location": "Thư viện",
  "images": ["base64_image1", "base64_image2"]
}
```

#### 4. Update Post
```
PUT /api/posts/:id
Headers: {
  "Authorization": "Bearer token"
}
Body: {
  "title": "Updated title",
  "description": "Updated description"
}
```

#### 5. Delete Post
```
DELETE /api/posts/:id
Headers: {
  "Authorization": "Bearer token"
}
```

#### 6. Get My Posts
```
GET /api/posts/my?page=1&limit=10
Headers: {
  "Authorization": "Bearer token"
}
```

#### 7. Get Posts by Type
```
GET /api/posts/type/:type?page=1&limit=10
Params:
  - type: 'lost' | 'found'
```

#### 8. Admin: Approve Post
```
PATCH /api/posts/:id/approve
Headers: {
  "Authorization": "Bearer admin_token"
}
```

#### 9. Admin: Reject Post
```
PATCH /api/posts/:id/reject
Headers: {
  "Authorization": "Bearer admin_token"
}
```

---

### 🤖 AI Matching (`/api/matches`)

#### 1. Scan for Matches (QUAN TRỌNG!)
```
POST /api/matches/scan
Headers: {
  "Authorization": "Bearer token"
}
Body: {} (empty)

Response: {
  "success": true,
  "message": "AI matching scan completed successfully",
  "data": {
    "scannedPosts": 50,
    "matchesFound": 10,
    "matchesCreated": 8,
    "notificationsSent": 16,
    "imageMatches": 6,
    "textOnlyMatches": 4,
    "matches": [...]
  }
}
```

**Chức năng:**
- Quét tất cả bài đăng approved trong 30 ngày
- So sánh text + image (nếu có)
- Tạo matches tự động
- Gửi notifications cho users

#### 2. Get My Matches
```
GET /api/matches/my
Headers: {
  "Authorization": "Bearer token"
}
```

#### 3. Get Matches by Post
```
GET /api/matches/post/:postId
```

#### 4. Get Match by ID
```
GET /api/matches/:id
```

#### 5. Create Match (Manual)
```
POST /api/matches
Headers: {
  "Authorization": "Bearer token"
}
Body: {
  "postId": "post_id_here",
  "confidenceScore": 0.85
}
```

#### 6. Update Match Status
```
PUT /api/matches/:id/status
Headers: {
  "Authorization": "Bearer token"
}
Body: {
  "status": "accepted" | "rejected" | "pending"
}
```

#### 7. Delete Match
```
DELETE /api/matches/:id
Headers: {
  "Authorization": "Bearer token"
}
```

---

### 🔔 Notifications (`/api/notifications`)

#### 1. Get All Notifications
```
GET /api/notifications?page=1&limit=20
Headers: {
  "Authorization": "Bearer token"
}
```

#### 2. Get Unread Count
```
GET /api/notifications/unread-count
Headers: {
  "Authorization": "Bearer token"
}
Response: {
  "success": true,
  "data": {
    "count": 5
  }
}
```

#### 3. Mark as Read
```
PUT /api/notifications/:id/read
Headers: {
  "Authorization": "Bearer token"
}
```

#### 4. Mark All as Read
```
PUT /api/notifications/mark-all-read
Headers: {
  "Authorization": "Bearer token"
}
```

#### 5. Delete Notification
```
DELETE /api/notifications/:id
Headers: {
  "Authorization": "Bearer token"
}
```

---

### 💬 Chat (`/api/chat`)

#### 1. Get Conversations
```
GET /api/chat/conversations
Headers: {
  "Authorization": "Bearer token"
}
```

#### 2. Get Messages
```
GET /api/chat/conversations/:conversationId/messages
Headers: {
  "Authorization": "Bearer token"
}
```

#### 3. Send Message
```
POST /api/chat/conversations/:conversationId/messages
Headers: {
  "Authorization": "Bearer token"
}
Body: {
  "content": "Hello!"
}
```

---

### 📂 Categories (`/api/categories`)

#### 1. Get All Categories
```
GET /api/categories
```

#### 2. Get Categories by Type
```
GET /api/categories?type=lost
```

---

### 📍 Locations (`/api/locations`)

#### 1. Get All Locations
```
GET /api/locations
```

#### 2. Search Locations
```
GET /api/locations?search=thư viện
```

---

## AI Matching Integration

### Cách hoạt động

1. **Text Matching:** Sử dụng Transformers.js (model: Xenova/all-MiniLM-L6-v2)
2. **Image Matching:** Sử dụng Google Gemini API (gemini-1.5-flash)
3. **Combined Score:** `finalScore = (textScore × 50%) + (imageScore × 50%)`
4. **Threshold:** 30% similarity để tạo match

### Tích hợp vào Frontend

#### Bước 1: Import Service

```javascript
import httpClient from './services/httpClient.js';
```

#### Bước 2: Tạo AI Matching Service (nếu chưa có)

File: `frontend/src/services/aiMatchingService.js`

```javascript
import httpClient from './httpClient.js';

class AIMatchingService {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
    this.oneHourInMs = 60 * 60 * 1000; // 1 tiếng
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
```

#### Bước 3: Khởi động trong App Component

File: `frontend/src/App.jsx` hoặc component chính

```javascript
import { useEffect } from 'react';
import aiMatchingService from './services/aiMatchingService.js';

function App() {
  useEffect(() => {
    // Lấy token từ localStorage
    const token = localStorage.getItem('userToken');
    
    if (token) {
      // User đã login, bắt đầu AI matching
      aiMatchingService.startScanning();
    }

    // Cleanup khi unmount
    return () => {
      aiMatchingService.stopScanning();
    };
  }, []);

  return (
    // Your app JSX
  );
}
```

#### Bước 4: Hiển thị Notifications

```javascript
import { useState, useEffect } from 'react';
import httpClient from './services/httpClient.js';

function NotificationsButton() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadNotifications();
    
    // Listen for new notifications
    window.addEventListener('notificationAdded', handleNewNotification);
    
    return () => {
      window.removeEventListener('notificationAdded', handleNewNotification);
    };
  }, []);

  const loadNotifications = async () => {
    const response = await httpClient.get('/notifications', {}, {}, { preferUser: true });
    if (response.success) {
      setNotifications(response.data);
      const unread = response.data.filter(n => !n.Is_read).length;
      setUnreadCount(unread);
    }
  };

  const handleNewNotification = (event) => {
    setUnreadCount(prev => prev + event.detail.count);
    loadNotifications(); // Reload notifications
  };

  return (
    <div className="notifications-button">
      <button onClick={loadNotifications}>
        🔔 Notifications
        {unreadCount > 0 && (
          <span className="badge">{unreadCount}</span>
        )}
      </button>
    </div>
  );
}
```

---

## Authentication

### Lưu Token

Sau khi login thành công:

```javascript
// Lưu token
localStorage.setItem('userToken', response.token);
localStorage.setItem('userData', JSON.stringify(response.data));
```

### Sử dụng Token trong Requests

File: `frontend/src/services/httpClient.js` (đã có sẵn)

```javascript
// Token tự động được thêm vào headers
const response = await httpClient.get('/accounts/profile', {}, {}, { preferUser: true });
```

### Logout

```javascript
localStorage.removeItem('userToken');
localStorage.removeItem('userData');
// Stop AI matching
aiMatchingService.stopScanning();
```

---

## Code Examples

### Example 1: Tạo Post với Images

```javascript
import httpClient from './services/httpClient.js';

async function createPost(postData) {
  // Convert images to base64
  const images = await Promise.all(
    postData.imageFiles.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    })
  );

  const response = await httpClient.post('/posts', {
    type: postData.type,
    title: postData.title,
    description: postData.description,
    category: postData.category,
    location: postData.location,
    images: images
  }, {}, { preferUser: true });

  if (response.success) {
    console.log('Post created:', response.data);
    return response.data;
  } else {
    console.error('Error:', response.error);
    throw new Error(response.error);
  }
}
```

### Example 2: Load Posts với Filters

```javascript
async function loadPosts(filters = {}) {
  const queryParams = {
    page: filters.page || 1,
    limit: filters.limit || 10,
    ...(filters.type && { type: filters.type }),
    ...(filters.status && { status: filters.status }),
    ...(filters.search && { search: filters.search }),
  };

  const response = await httpClient.get('/posts', queryParams);
  
  if (response.success) {
    return {
      posts: response.data.posts || response.data,
      pagination: response.data.pagination
    };
  }
  
  return { posts: [], pagination: null };
}
```

### Example 3: Manual Trigger AI Scan

```javascript
import httpClient from './services/httpClient.js';

async function triggerAIScan() {
  try {
    const response = await httpClient.post('/matches/scan', {}, {}, { preferUser: true });
    
    if (response.success) {
      const data = response.data?.data || response.data;
      alert(`✅ Scan completed!\nFound: ${data.matchesFound} matches\nCreated: ${data.matchesCreated} matches`);
      return data;
    } else {
      alert(`❌ Error: ${response.error}`);
    }
  } catch (error) {
    console.error('Scan error:', error);
    alert('❌ Failed to scan');
  }
}
```

### Example 4: Hiển thị Match Details

```javascript
function MatchCard({ match }) {
  const { post1, post2, similarity, textSimilarity, imageSimilarity, hasImages } = match;

  return (
    <div className="match-card">
      <h3>Match Found!</h3>
      <div className="similarity-score">
        <span className="overall">Overall: {Math.round(similarity * 100)}%</span>
        <div className="breakdown">
          <span>Text: {Math.round(textSimilarity * 100)}%</span>
          {hasImages && (
            <span>Image: {Math.round(imageSimilarity * 100)}%</span>
          )}
        </div>
      </div>
      
      <div className="posts">
        <div className="post">
          <h4>{post1.Post_Title}</h4>
          <p>{post1.Description}</p>
        </div>
        <div className="vs">VS</div>
        <div className="post">
          <h4>{post2.Post_Title}</h4>
          <p>{post2.Description}</p>
        </div>
      </div>
      
      <button onClick={() => viewMatch(match.Match_id)}>
        View Details
      </button>
    </div>
  );
}
```

---

## Testing Checklist

### ✅ Backend APIs

- [ ] Backend đang chạy ở `http://localhost:5000`
- [ ] Health check: `GET /health` trả về OK
- [ ] Authentication: Login/Register hoạt động
- [ ] Posts: CRUD operations hoạt động
- [ ] AI Matching: `/api/matches/scan` hoạt động
- [ ] Notifications: Load và mark as read hoạt động

### ✅ Frontend Integration

- [ ] httpClient đã được setup đúng
- [ ] Token được lưu sau khi login
- [ ] Token được gửi trong headers tự động
- [ ] AI Matching service đã được import
- [ ] AI Matching tự động start sau khi login
- [ ] Notifications được load và hiển thị
- [ ] Posts được load và hiển thị đúng

### ✅ AI Matching Flow

- [ ] Service tự động quét mỗi 1 tiếng
- [ ] Manual trigger hoạt động
- [ ] Notifications được tạo khi có matches
- [ ] Match details hiển thị đúng (text + image scores)
- [ ] Users nhận được notifications

### ✅ UI Components

- [ ] Notifications button hiển thị unread count
- [ ] Match cards hiển thị similarity scores
- [ ] Post creation form hoạt động với images
- [ ] Post list với filters hoạt động

---

## Troubleshooting

### Lỗi: "Route not found"
- Kiểm tra URL có đúng không (`/api/matches/scan`)
- Kiểm tra backend có đang chạy không
- Kiểm tra port (5000, không phải 3000)

### Lỗi: "Unauthorized"
- Kiểm tra token có hợp lệ không
- Kiểm tra token có được gửi trong headers không
- Thử login lại để lấy token mới

### AI Matching không chạy
- Kiểm tra service có được start không
- Kiểm tra console logs
- Kiểm tra có posts approved trong 30 ngày không

### Notifications không hiển thị
- Kiểm tra API `/api/notifications` có hoạt động không
- Kiểm tra event listener có được setup không
- Kiểm tra token có hợp lệ không

---

## Next Steps

1. **Tích hợp AI Matching Service** vào App component
2. **Tạo UI cho Matches** - hiển thị matches với similarity scores
3. **Tạo Notifications Component** - hiển thị và quản lý notifications
4. **Test với real data** - tạo posts và test matching
5. **Optimize performance** - cache, pagination, lazy loading

---

**Happy Coding!** 🚀

Nếu có vấn đề, check:
- Backend logs trong terminal
- Browser console logs
- Network tab trong DevTools

