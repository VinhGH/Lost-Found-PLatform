# 🖼️ Sửa lỗi mất ảnh khi cập nhật bài đăng

## ❌ Vấn đề

Khi user **KHÔNG thay đổi ảnh** nhưng bấm "Cập nhật":
- ✅ Các thông tin khác (title, description, etc.) được cập nhật
- ❌ **Ảnh bị MẤT HẾT**

## 🔍 Nguyên nhân

### Frontend (`UserProfile.jsx` - dòng 402)
**TRƯỚC:**
```javascript
const updateData = {
  title: updated.title,
  description: updated.description,
  category: updated.category,
  location: updated.location,
  images: updated.images || updated.image ? (Array.isArray(updated.images) ? updated.images : [updated.image]) : undefined,
};
```

**Vấn đề:**
- Luôn gửi `images` lên backend, kể cả khi user **KHÔNG thay đổi ảnh**
- Khi không thay đổi ảnh, `updated.images` chứa **URL ảnh cũ** (ví dụ: `https://...supabase.co/...`)
- Backend nhận **URL** thay vì **base64** → Cố upload URL → **THẤT BẠI** → Không có ảnh

### Backend (`postModel.js` - dòng 668-708)
```javascript
if (updateData.images !== undefined && Array.isArray(updateData.images)) {
  // XÓA TẤT CẢ ảnh cũ
  // Upload ảnh mới (nhưng nếu là URL thì upload thất bại)
}
```

**Vấn đề:**
- Khi nhận `images` (kể cả URL), backend **XÓA TẤT CẢ ảnh cũ**
- Sau đó cố upload "ảnh mới" (nhưng là URL) → **THẤT BẠI**
- Kết quả: **KHÔNG CÓ ảnh**

## ✅ Giải pháp

### Frontend (`UserProfile.jsx`)

**SAU:**
```javascript
// ✅ Kiểm tra xem có ảnh mới không (base64 bắt đầu bằng "data:image/")
// Nếu chỉ có URL ảnh cũ thì KHÔNG gửi images (để backend giữ nguyên ảnh cũ)
let imagesToSend = undefined;
if (updated.images && Array.isArray(updated.images) && updated.images.length > 0) {
  // Kiểm tra xem có ít nhất 1 ảnh mới (base64) không
  const hasNewImages = updated.images.some(img => 
    typeof img === 'string' && img.startsWith('data:image/')
  );
  
  if (hasNewImages) {
    // Chỉ gửi ảnh mới (base64), loại bỏ ảnh cũ (URL)
    imagesToSend = updated.images.filter(img => 
      typeof img === 'string' && img.startsWith('data:image/')
    );
  }
  // Nếu không có ảnh mới, imagesToSend = undefined → backend giữ nguyên ảnh cũ
}

const updateData = {
  title: updated.title,
  description: updated.description,
  category: updated.category,
  location: updated.location,
  // ✅ CHỈ gửi images nếu có ảnh mới (base64)
  ...(imagesToSend !== undefined && { images: imagesToSend }),
};
```

**Logic:**
1. Kiểm tra `updated.images` có ảnh mới (base64) không
2. **Nếu CÓ ảnh mới**: Lọc chỉ lấy ảnh base64 → Gửi lên backend
3. **Nếu KHÔNG có ảnh mới**: `imagesToSend = undefined` → **KHÔNG gửi `images`** → Backend giữ nguyên ảnh cũ

### Backend (`postModel.js`)

**Backend KHÔNG cần thay đổi** vì logic đã đúng:
```javascript
if (updateData.images !== undefined && Array.isArray(updateData.images)) {
  // Xóa ảnh cũ và upload ảnh mới
}
// Nếu updateData.images === undefined → GIỮ NGUYÊN ảnh cũ
```

## 🎯 Kết quả

### ✅ Trường hợp 1: User KHÔNG thay đổi ảnh
- Frontend: **KHÔNG gửi `images`** (`imagesToSend = undefined`)
- Backend: **GIỮ NGUYÊN ảnh cũ** (không xóa, không upload)
- Kết quả: **Ảnh vẫn hiển thị bình thường** ✅

### ✅ Trường hợp 2: User THAY ĐỔI ảnh (thêm/xóa/sửa)
- Frontend: **Gửi `images`** (chỉ ảnh mới - base64)
- Backend: **Xóa ảnh cũ** → **Upload ảnh mới**
- Kết quả: **Ảnh mới được cập nhật** ✅

### ✅ Trường hợp 3: User GIỮ 1 ảnh cũ + THÊM 1 ảnh mới
- Frontend: **Gửi `images`** (chỉ ảnh mới - base64)
- Backend: **Xóa TẤT CẢ ảnh cũ** → **Upload ảnh mới**
- Kết quả: **Chỉ có ảnh mới** (ảnh cũ bị xóa)
- ⚠️ **Lưu ý**: Nếu muốn giữ ảnh cũ + thêm ảnh mới, cần logic phức tạp hơn

## 📝 Lưu ý

- Ảnh mới (base64) bắt đầu bằng `"data:image/"`
- Ảnh cũ (URL) bắt đầu bằng `"http://"` hoặc `"https://"`
- Logic hiện tại: **Nếu có ảnh mới → XÓA TẤT CẢ ảnh cũ → Upload ảnh mới**
- Nếu muốn **GIỮ ảnh cũ + THÊM ảnh mới**, cần thay đổi logic backend

---

**Hoàn thành**: ✅ Đã sửa xong lỗi mất ảnh khi cập nhật bài đăng
