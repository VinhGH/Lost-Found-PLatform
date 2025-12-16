# Hướng Dẫn Kiểm Tra Backend Email (Render)

## ⚠️ Vấn Đề: OTP Timeout

Khi gửi mã OTP (Đăng ký, Quên mật khẩu, Đổi mật khẩu), request bị timeout sau 60 giây.

### Nguyên nhân:
Backend đang cố gửi email qua **Gmail SMTP** nhưng:
1. Thiếu biến môi trường email
2. Gmail đang chặn/throttle requests
3. SMTP credentials không đúng

---

## 🔍 Cách Kiểm Tra

### Bước 1: Kiểm Tra Logs Trên Render

1. Vào **Render Dashboard**: https://dashboard.render.com
2. Chọn service backend của bạn
3. Vào tab **Logs**
4. Thử gửi OTP từ frontend
5. Tìm các dòng log:

```
📧 Attempting to send OTP email to: thaivinh2@dtu.edu.vn
📮 SMTP_USER: NOT SET  ← ❌ LỖI NÀY
📮 EMAIL_FROM: NOT SET  ← ❌ LỖI NÀY
```

Hoặc:

```
❌ SMTP_USER not configured in .env file
❌ Failed to send OTP email: ...
```

### Bước 2: Kiểm Tra Environment Variables

Trong Render Dashboard → Service → **Environment** tab, kiểm tra các biến:

**Cần có:**
- `SMTP_USER` - Email Gmail của bạn (vd: `yourname@gmail.com`)
- `SMTP_PASS` - **App Password** từ Google (KHÔNG phải mật khẩu Gmail thường)
- `EMAIL_FROM` - Email hiển thị khi gửi (thường giống `SMTP_USER`)
- `SMTP_HOST` - `smtp.gmail.com` (optional, có default)
- `SMTP_PORT` - `465` (optional, có default)
- `SMTP_SECURE` - `true` (optional, có default)

---

## 🔧 Cách Tạo Gmail App Password

### Bước 1: Bật 2-Step Verification
1. Vào https://myaccount.google.com/security
2. Tìm "2-Step Verification"
3. Bật nó lên (nếu chưa bật)

### Bước 2: Tạo App Password
1. Vào https://myaccount.google.com/apppasswords
2. Chọn "Mail" và "Other (Custom name)"
3. Nhập tên: `Lost and Found Backend`
4. Click **Generate**
5. Copy mật khẩu 16 ký tự (vd: `abcd efgh ijkl mnop`)

### Bước 3: Thêm Vào Render
1. Vào Render Dashboard → Service → Environment
2. Thêm biến mới:
   ```
   SMTP_USER=yourname@gmail.com
   SMTP_PASS=abcdefghijklmnop  (không có dấu cách)
   EMAIL_FROM=yourname@gmail.com
   ```
3. Click **Save Changes**
4. **Render sẽ tự động redeploy backend**

---

## ✅ Kiểm Tra Sau Khi Cấu Hình

### Test 1: Xem Logs
Sau khi redeploy xong, xem logs sẽ thấy:
```
📮 SMTP_USER: yourname@gmail.com  ← ✅ OK
📮 EMAIL_FROM: yourname@gmail.com  ← ✅ OK
```

### Test 2: Thử Gửi OTP
1. Vào frontend (Vercel)
2. Thử chức năng "Quên mật khẩu"
3. Nhập email và click "Gửi mã"
4. Đợi 10-30 giây
5. Kiểm tra email inbox

### Test 3: Xem Logs Backend
Nếu thành công, logs sẽ hiển thị:
```
📤 Sending email via Gmail SMTP...
✅ OTP email sent successfully to: thaivinh2@dtu.edu.vn
📧 Message ID: <...>
```

---

## 🚨 Troubleshooting

### Lỗi: "Invalid login: 535-5.7.8 Username and Password not accepted"
- **Nguyên nhân**: Sai App Password hoặc chưa bật 2-Step Verification
- **Giải pháp**: Tạo lại App Password theo hướng dẫn trên

### Lỗi: "Connection timeout"
- **Nguyên nhân**: Gmail đang chặn IP của Render
- **Giải pháp**: 
  1. Vào https://accounts.google.com/DisplayUnlockCaptcha
  2. Click "Continue"
  3. Thử lại

### Lỗi: "Daily sending quota exceeded"
- **Nguyên nhân**: Gmail free có giới hạn 500 emails/ngày
- **Giải pháp**: Đợi 24h hoặc dùng email khác

---

## 💡 Giải Pháp Tạm Thời (Nếu Không Muốn Dùng Gmail)

### Option 1: Lấy OTP Từ Database
Chạy script này trên local để lấy OTP:

```bash
cd backend
node scripts/getOtpFromDb.js thaivinh2@dtu.edu.vn
```

### Option 2: Xem Logs Backend
Khi gửi OTP, backend sẽ log ra console:
```
🔑 OTP Code: 123456
```

Tìm dòng này trong Render Logs.

---

## 📊 Frontend Changes (Đã Fix)

Tôi đã tăng timeout cho OTP endpoints:
- **Trước**: 30 giây
- **Sau**: 60 giây

Các endpoint được tăng timeout:
- `/auth/request-otp`
- `/auth/request-password-reset`
- `/auth/verify-otp`
- `/auth/reset-password`

Bây giờ frontend sẽ đợi đủ lâu cho backend gửi email.
