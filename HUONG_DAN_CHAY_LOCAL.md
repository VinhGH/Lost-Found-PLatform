# Hướng dẫn chạy dự án Local

## ✅ Đã cấu hình xong

Dự án đã được cấu hình để chạy local thay vì Vercel + Render:

### Thay đổi đã thực hiện:

1. **Frontend (`apiConfig.js`)**: 
   - ✅ Đổi URL mặc định từ `https://lost-found-platform.onrender.com/api` → `http://localhost:5000/api`

2. **Backend (`.env`)**:
   - ✅ Cập nhật `CORS_ORIGIN` từ `http://localhost:5173` → `http://localhost:3000`

---

## 🚀 Cách chạy dự án

### Bước 1: Chạy Backend

Mở terminal trong thư mục `backend`:

```bash
cd backend
npm install
npm run dev
```

Backend sẽ chạy tại: **http://localhost:5000**

### Bước 2: Chạy Frontend

Mở terminal MỚI trong thư mục `frontend`:

```bash
cd frontend
npm install
npm start
```

Frontend sẽ tự động mở tại: **http://localhost:3000**

---

## 📝 Lưu ý quan trọng

### Tạo file `.env` cho Frontend (Tùy chọn)

Nếu bạn muốn tùy chỉnh cấu hình, hãy tạo file `.env` trong thư mục `frontend` với nội dung:

```env
# API Configuration for Local Development
REACT_APP_API_URL=http://localhost:5000/api

# Browser will automatically open at this port
PORT=3000
```

**Lưu ý**: File `.env` bị gitignore nên không được commit lên Git (đây là điều tốt để bảo mật).

### Kiểm tra Backend đang chạy

Truy cập: http://localhost:5000/api/health (nếu có endpoint health check)

### Nếu gặp lỗi CORS

Đảm bảo:
- Backend đang chạy ở port 5000
- Frontend đang chạy ở port 3000
- File `backend/.env` có `CORS_ORIGIN=http://localhost:3000`

### Nếu muốn đổi port Frontend

Trong file `frontend/.env`, thay đổi:
```env
PORT=<port_bạn_muốn>
```

Và cập nhật `backend/.env`:
```env
CORS_ORIGIN=http://localhost:<port_bạn_muốn>
```

---

## 🔄 Quay lại chạy Production (Vercel + Render)

Nếu muốn deploy lại lên Vercel/Render:

1. **Frontend**: Đổi lại trong `apiConfig.js`:
   ```javascript
   export const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://lost-found-platform.onrender.com/api';
   ```

2. **Backend**: Cập nhật `CORS_ORIGIN` trong `.env` về URL Vercel của bạn

---

## ✨ Tóm tắt

- **Backend**: `npm run dev` trong thư mục `backend` → http://localhost:5000
- **Frontend**: `npm start` trong thư mục `frontend` → http://localhost:3000
- **Database**: Vẫn dùng Supabase (không cần thay đổi)

Chúc bạn code vui vẻ! 🎉
