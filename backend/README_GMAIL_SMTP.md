# Gmail SMTP Configuration

## Cấu hình Gmail SMTP cho OTP Email

### Biến môi trường cần thiết trong `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password-16-chars
OTP_EXPIRE_MINUTES=5
EMAIL_FROM=your-email@gmail.com
```

### Cách lấy Gmail App Password:

1. Đăng nhập vào Google Account: https://myaccount.google.com/
2. Vào **Security** → **2-Step Verification** (bật nếu chưa bật)
3. Vào **Security** → **App passwords**
4. Chọn app: **Mail**
5. Chọn device: **Other (Custom name)** → Nhập "Lost & Found Platform"
6. Click **Generate**
7. Copy **App Password** (16 ký tự, không có khoảng trắng)
8. Thêm vào `.env` như `SMTP_PASS=xxxx xxxx xxxx xxxx` (bỏ khoảng trắng)

### Lưu ý:

- **SMTP_USER**: Gmail của bạn (ví dụ: `your-email@gmail.com`)
- **SMTP_PASS**: App Password 16 ký tự (KHÔNG phải mật khẩu Gmail thường)
- **EMAIL_FROM**: Cùng với SMTP_USER hoặc có thể khác nếu dùng alias
- **SMTP_SECURE**: `true` cho port 465, `false` cho port 587

### Test:

1. Đảm bảo `.env` có đầy đủ các biến trên
2. Restart backend server
3. Test gửi OTP qua frontend hoặc Postman
4. Kiểm tra email inbox (có thể vào spam folder)

### Troubleshooting:

- Nếu lỗi "Invalid login": Kiểm tra App Password đúng chưa
- Nếu lỗi "Less secure app": Đã bật 2-Step Verification và dùng App Password chưa?
- Nếu email không đến: Kiểm tra spam folder

