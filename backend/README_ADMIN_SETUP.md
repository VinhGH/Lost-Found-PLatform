# 🔐 Hướng dẫn tạo tài khoản Admin

## Tài khoản Admin mặc định

Dự án đã có sẵn **script tự động tạo tài khoản admin mặc định**.

### Thông tin đăng nhập mặc định:
- **Email:** `admin@dtu.edu.vn`
- **Password:** `Admin@123`
- **Role:** `Admin`
- **User Name:** `Admin DTU`
- **Phone:** `0900000000`

## Cách tạo tài khoản Admin

### Bước 1: Chạy script seed admin

```bash
cd backend
npm run seed:admin
```

### Bước 2: Kiểm tra kết quả

Script sẽ:
- ✅ Kiểm tra xem tài khoản admin đã tồn tại chưa
- ✅ Nếu chưa có, tự động tạo tài khoản mới
- ✅ Nếu đã có, bỏ qua (không tạo trùng)

### Output mẫu:

```
🌱 Starting admin seed script...
✅ Connected to Supabase
✅ Password hashed successfully
✅ Admin account created successfully!
📧 Email: admin@dtu.edu.vn
🔑 Password: Admin@123
👤 Role: Admin
📱 Phone: 0900000000
🆔 Account ID: 1
🎉 Admin seed script completed successfully!
```

Hoặc nếu đã tồn tại:

```
🌱 Starting admin seed script...
✅ Connected to Supabase
✅ Password hashed successfully
ℹ️  Admin account already exists. Skipping insertion.
📧 Existing admin email: admin@dtu.edu.vn
🎉 Admin seed script completed successfully!
```

## Đăng nhập Admin

1. Mở frontend
2. Click "Đăng nhập Admin"
3. Nhập thông tin:
   - Email: `admin@dtu.edu.vn`
   - Password: `Admin@123`

## Lưu ý bảo mật

⚠️ **QUAN TRỌNG:** Sau khi setup lần đầu, bạn nên:
1. Đổi mật khẩu admin (nếu có chức năng đổi mật khẩu)
2. Hoặc tạo tài khoản admin mới với email/mật khẩu khác
3. Xóa hoặc thay đổi tài khoản mặc định này trong production

## Tạo Admin mới (nếu cần)

Hiện tại, chỉ có thể tạo admin bằng cách:
1. Chạy script seed (tạo admin mặc định)
2. Hoặc sửa trực tiếp trong database (đổi role từ 'Student' → 'Admin')

**Lưu ý:** API register hiện tại chỉ tạo tài khoản với role 'Student'. Để tạo admin mới, cần:
- Sửa database trực tiếp, hoặc
- Tạo script seed mới với email khác

