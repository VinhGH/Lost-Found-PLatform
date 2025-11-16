# 🚀 HƯỚNG DẪN TÍCH HỢP API - LOST & FOUND PLATFORM

## 📋 MỤC LỤC
1. [Giới thiệu](#giới-thiệu)
2. [Cài đặt và Setup](#cài-đặt-và-setup)
3. [Kiểm tra Backend](#kiểm-tra-backend)
4. [Test API với HTML Test Page](#test-api-với-html-test-page)
5. [Tích hợp vào Frontend](#tích-hợp-vào-frontend)
6. [Verify trên Supabase](#verify-trên-supabase)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 GIỚI THIỆU

Hệ thống Lost & Found Platform bao gồm:
- **Backend API**: Node.js + Express + Supabase (Port 5000)
- **Frontend**: React (Port 3000)
- **Database**: Supabase PostgreSQL

Tài liệu này hướng dẫn chi tiết cách:
1. ✅ Kiểm tra backend hoạt động
2. ✅ Test tất cả APIs
3. ✅ Tích hợp vào Frontend
4. ✅ Verify data trên Supabase

---

## 🔧 CÀI ĐẶT VÀ SETUP

### **Bước 1: Kiểm tra Backend đang chạy**

```bash
cd backend
npm start
```

✅ **Expected output:**
```
🚀 Server running on http://localhost:5000
✅ Supabase client initialized
```

### **Bước 2: Kiểm tra Frontend**

```bash
cd frontend
npm start
```

✅ **Expected:** Browser mở http://localhost:3000

### **Bước 3: Kiểm tra .env file**

File `backend/.env` phải có:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret
PORT=5000
```

⚠️ **LƯU Ý:** Không commit file `.env` lên Git!

---

## 🧪 KIỂM TRA BACKEND

### **Test 1: Health Check**

```bash
curl http://localhost:5000/health
```

**Expected:**
```json
{
  "status": "OK",
  "timestamp": "2025-11-16T..."
}
```

### **Test 2: Supabase Connection**

Nếu backend chạy mà không có lỗi Supabase → ✅ Connection OK

### **Test 3: API Endpoints**

Danh sách APIs đã implement:

```
Authentication:
✅ POST   /api/accounts/register
✅ POST   /api/accounts/login
✅ GET    /api/accounts/profile

Posts:
✅ GET    /api/posts
✅ GET    /api/posts/:id?type=lost/found
✅ POST   /api/posts
✅ PUT    /api/posts/:id?type=lost/found
✅ DELETE /api/posts/:id?type=lost/found
✅ GET    /api/posts/my

Metadata:
✅ GET    /api/categories
✅ GET    /api/locations
```

---

## 🌐 TEST API VỚI HTML TEST PAGE

### **Bước 1: Mở Test Page**

```bash
# Trong thư mục frontend
open TEST_API_INTEGRATION.html
# Hoặc double click file để mở trong browser
```

### **Bước 2: Test Authentication**

1. **Register Account**
   - Email: `test@dtu.edu.vn`
   - Password: `Test@123456`
   - Click **"📝 Register"**
   - ✅ Expected: Status 201, nhận được token

2. **Login**
   - Dùng email/password vừa tạo
   - Click **"🔐 Login"**
   - ✅ Expected: Status 200, nhận được token

3. **Get Profile**
   - Click **"👤 Get Profile"**
   - ✅ Expected: Thông tin user vừa tạo

### **Bước 3: Test Posts**

1. **Get All Posts**
   - Click **"📋 Get All Posts"**
   - ✅ Expected: Array of posts (có thể rỗng nếu chưa có data)

2. **Create Post**
   - Điền thông tin:
     - Type: Lost/Found
     - Title: "Test Post"
     - Description: "Test description"
     - Category: "Ví/Túi"
     - Location: "Tòa A - Phòng 101"
   - Click **"➕ Create Post"**
   - ✅ Expected: Post được tạo thành công

3. **Get My Posts**
   - Click **"📄 My Posts"**
   - ✅ Expected: Thấy post vừa tạo

### **Bước 4: Test Complete Flow**

Click **"🚀 Run Complete Flow Test"**

Test này sẽ:
1. ✅ Register user mới
2. ✅ Login
3. ✅ Create Lost Post
4. ✅ Create Found Post
5. ✅ Get All Posts

⏱️ **Thời gian:** ~10 giây

✅ **Expected:** "ALL TESTS PASSED"

---

## 🔗 VERIFY TRÊN SUPABASE

### **Bước 1: Mở Supabase Dashboard**

1. Vào: https://supabase.com/dashboard
2. Chọn project của bạn
3. Click **"Table Editor"**

### **Bước 2: Kiểm tra Tables**

#### **Table: Account**
```sql
SELECT * FROM "Account" ORDER BY created_at DESC LIMIT 10;
```

✅ **Expected:** Thấy users vừa đăng ký

#### **Table: Lost_Post**
```sql
SELECT * FROM "Lost_Post" 
WHERE deleted_at IS NULL 
ORDER BY created_at DESC 
LIMIT 10;
```

✅ **Expected:** Thấy lost posts vừa tạo

#### **Table: Found_Post**
```sql
SELECT * FROM "Found_Post" 
WHERE deleted_at IS NULL 
ORDER BY created_at DESC 
LIMIT 10;
```

✅ **Expected:** Thấy found posts vừa tạo

#### **Table: Category**
```sql
SELECT * FROM "Category";
```

✅ **Expected:** Danh sách categories

#### **Table: Location**
```sql
SELECT * FROM "Location";
```

✅ **Expected:** Danh sách locations

### **Bước 3: Verify Data**

**Check Post Detail:**
```sql
SELECT 
  lp.lost_post_id,
  lp.post_title,
  lp.description,
  lp.status,
  a.email as author_email,
  c.name as category_name,
  l.address || ' - ' || l.building || ' - ' || l.room as location
FROM "Lost_Post" lp
LEFT JOIN "Account" a ON lp.account_id = a.account_id
LEFT JOIN "Category" c ON lp.category_id = c.category_id
LEFT JOIN "Location" l ON lp.location_id = l.location_id
ORDER BY lp.created_at DESC
LIMIT 5;
```

✅ **Expected:** Thấy đầy đủ thông tin posts với relations

---

## 🎨 TÍCH HỢP VÀO FRONTEND

### **Files đã tạo:**

```
frontend/src/services/
├── apiConfig.js          ← Cấu hình API endpoints
├── httpClient.js         ← HTTP client với error handling
├── api.js                ← Main API service
└── realApi.js            ← Drop-in replacement cho userApi.js
```

### **Cách sử dụng trong Components:**

#### **Option 1: Dùng api.js (Recommended)**

```javascript
import apiService from '../services/api';

// Login
const handleLogin = async (credentials) => {
  const response = await apiService.login(credentials);
  if (response.success) {
    console.log('User:', response.data);
    // Redirect to dashboard
  } else {
    console.error('Error:', response.error);
  }
};

// Get posts
const loadPosts = async () => {
  const response = await apiService.getPosts({ type: 'lost', page: 1, limit: 10 });
  if (response.success) {
    setPosts(response.data.posts);
  }
};

// Create post
const createPost = async (postData) => {
  const response = await apiService.createPost(postData);
  if (response.success) {
    console.log('Post created:', response.data);
  }
};
```

#### **Option 2: Dùng realApi.js (Drop-in replacement)**

```javascript
// Thay vì:
// import userApi from '../services/userApi';

// Dùng:
import userApi from '../services/realApi';

// Tất cả code giữ nguyên, không cần sửa!
const response = await userApi.loginUser(credentials);
```

### **Migrate từ Mock API sang Real API:**

**Bước 1:** Trong file component, tìm dòng:
```javascript
import userApi from '../services/userApi';
```

**Bước 2:** Thay bằng:
```javascript
import userApi from '../services/realApi';
```

**Bước 3:** Không cần sửa code khác!

✅ **realApi.js** có tất cả methods giống **userApi.js**:
- `loginUser()`
- `registerUser()`
- `getUserProfile()`
- `getPosts()`
- `createPost()`
- `getCategories()`
- `getLocations()`

---

## 📝 VÍ DỤ TÍCH HỢP

### **AuthForm.jsx - Login**

```javascript
import userApi from '../services/realApi'; // ← Chỉ thay dòng này

const handleSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    // Code giữ nguyên 100%
    const response = await userApi.loginUser({
      email: formData.email,
      password: formData.password
    });

    if (response.success) {
      // Success handling
      onUserLoginSuccess(response.data);
    } else {
      setError(response.error);
    }
  } catch (error) {
    setError('Đăng nhập thất bại');
  } finally {
    setIsLoading(false);
  }
};
```

### **LostPage.jsx - Get Posts**

```javascript
import userApi from '../services/realApi'; // ← Chỉ thay dòng này

useEffect(() => {
  const fetchPosts = async () => {
    setLoading(true);
    
    // Code giữ nguyên 100%
    const response = await userApi.getPosts({
      type: 'lost',
      category: filters.category,
      location: filters.location,
      page: currentPage,
      limit: 10
    });

    if (response.success) {
      setPosts(response.data);
    }
    
    setLoading(false);
  };

  fetchPosts();
}, [filters, currentPage]);
```

### **CreatePostModal.jsx - Create Post**

```javascript
import userApi from '../services/realApi'; // ← Chỉ thay dòng này

const handleSubmit = async (postData) => {
  // Code giữ nguyên 100%
  const response = await userApi.createPost({
    type: postData.type,
    title: postData.title,
    description: postData.description,
    category: postData.category,
    location: postData.location
  });

  if (response.success) {
    onSuccess(response.data);
  } else {
    setError(response.error);
  }
};
```

---

## 🐛 TROUBLESHOOTING

### **Lỗi 1: "Failed to fetch"**

**Nguyên nhân:** Backend không chạy

**Cách sửa:**
```bash
cd backend
npm start
```

### **Lỗi 2: "CORS Error"**

**Nguyên nhân:** Backend chưa config CORS

**Cách sửa:** Đã fix trong `backend/src/index.js`

### **Lỗi 3: "Permission denied for table Account"**

**Nguyên nhân:** Supabase RLS chặn query

**Cách sửa:**
1. Vào Supabase SQL Editor
2. Chạy file `backend/database/setup_permissions.sql`
3. Restart backend

### **Lỗi 4: "Token is invalid or expired"**

**Nguyên nhân:** JWT_SECRET không khớp

**Cách sửa:**
1. Check `backend/.env` có `JWT_SECRET`
2. Logout và login lại

### **Lỗi 5: "Email must end with @dtu.edu.vn"**

**Nguyên nhân:** Backend yêu cầu email DTU

**Cách sửa:** Dùng email format: `xxx@dtu.edu.vn`

### **Lỗi 6: "Type is required (lost or found)"**

**Nguyên nhân:** API GET/UPDATE/DELETE post cần query param `type`

**Cách sửa:**
```javascript
// GET post by ID
await apiService.getPostById(id, 'lost'); // ← Thêm type

// UPDATE post
await apiService.updatePost(id, 'lost', updateData); // ← Thêm type

// DELETE post
await apiService.deletePost(id, 'found'); // ← Thêm type
```

---

## ✅ CHECKLIST HOÀN THÀNH

### **Backend:**
- [ ] Backend đang chạy (http://localhost:5000)
- [ ] Health check OK
- [ ] Supabase connection OK
- [ ] Permissions đã setup

### **Testing:**
- [ ] Mở TEST_API_INTEGRATION.html
- [ ] Test Register thành công
- [ ] Test Login thành công
- [ ] Test Create Post thành công
- [ ] Test Get Posts thành công
- [ ] Complete Flow Test PASSED

### **Supabase Verification:**
- [ ] Vào Supabase Dashboard
- [ ] Thấy users trong table Account
- [ ] Thấy posts trong Lost_Post/Found_Post
- [ ] Categories có data
- [ ] Locations có data

### **Frontend Integration:**
- [ ] Thay `userApi` → `realApi` trong AuthForm
- [ ] Test Login trên frontend
- [ ] Test Register trên frontend
- [ ] Test Create Post trên frontend
- [ ] Test View Posts trên frontend

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề:

1. **Check Backend Logs:**
   ```bash
   cd backend
   npm start
   # Xem console output
   ```

2. **Check Browser Console:**
   - F12 → Console tab
   - Xem network requests

3. **Check Supabase Logs:**
   - Supabase Dashboard → Logs

4. **Test với Postman:**
   - Xem `docs/POSTMAN_TESTING_GUIDE.md`

---

## 🎉 KẾT LUẬN

Sau khi hoàn thành hướng dẫn này, bạn đã:

✅ Backend kết nối với Supabase  
✅ Tất cả APIs hoạt động đúng  
✅ Frontend tích hợp với Backend  
✅ Data được lưu trên Supabase  
✅ Test toàn bộ flow thành công  

**🚀 Dự án sẵn sàng demo và nộp!**

---

**Cập nhật lần cuối:** 16/11/2025  
**Version:** 1.0.0  
**Tác giả:** Lost & Found Platform Team

