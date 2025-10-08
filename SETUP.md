# Hướng dẫn Setup và Chạy Lost & Found Platform

## Yêu cầu hệ thống
- Node.js >= 16.0.0
- npm >= 8.0.0
- SQL Server (hoặc SQL Server Express)

## Cài đặt

### 1. Cài đặt dependencies cho toàn bộ project
```bash
npm run setup
```

### 2. Cấu hình Database
1. Copy file `backend/env.example` thành `backend/.env`
2. Cập nhật thông tin database trong file `.env`:
   ```
   DB_SERVER=localhost
   DB_NAME=LostFoundDB
   DB_USER=sa
   DB_PASSWORD=YourPassword123
   ```

### 3. Chạy ứng dụng

#### Chạy cả Frontend và Backend cùng lúc:
```bash
npm run dev
```

#### Hoặc chạy riêng lẻ:

**Backend (Port 5000):**
```bash
npm run dev:backend
```

**Frontend (Port 3000):**
```bash
npm run dev:frontend
```

## Truy cập ứng dụng
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Health Check: http://localhost:5000/health

## Cấu trúc project
```
lost-found-platform/
├── backend/          # Express.js API server
├── frontend/         # React + Vite frontend
├── docs/            # Documentation
└── package.json     # Root package.json với scripts
```

## Troubleshooting

### Lỗi CORS
- Đảm bảo backend chạy trên port 5000
- Đảm bảo frontend chạy trên port 3000
- Kiểm tra CORS_ORIGIN trong backend/.env

### Lỗi Database
- Kiểm tra SQL Server đang chạy
- Kiểm tra thông tin kết nối trong backend/.env
- Chạy health check: http://localhost:5000/health

### Lỗi Port đã được sử dụng
- Thay đổi PORT trong backend/.env
- Thay đổi port trong frontend/vite.config.js
- Cập nhật CORS_ORIGIN tương ứng
