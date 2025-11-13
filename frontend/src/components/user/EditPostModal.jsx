import React, { useState, useEffect } from "react";
import { Close as CloseIcon, CloudUpload as CloudUploadIcon } from "@mui/icons-material";
import "./CreatePostModal.css"; // dùng chung style

const EditPostModal = ({ postData, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    postType: "lost",
    author: "",
    title: "",
    description: "",
    category: "",
    location: "",
    building: "",
    room: "",
    address: "",
    date: "",
    contact: "",
    image: null,
  });
  const [preview, setPreview] = useState(null);

  // ✅ Lock body scroll when modal is open
  useEffect(() => {
    // Save original body overflow style
    const originalOverflow = document.body.style.overflow;
    // Lock body scroll
    document.body.style.overflow = 'hidden';
    
    // Cleanup function to restore original overflow
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // ✅ Load dữ liệu bài viết
  useEffect(() => {
    if (postData) {
      const existingImage = postData.imageUrl || postData.image || null;
      setFormData({
        postType: postData.type || "lost",
        author: postData.author || "",
        title: postData.title || "",
        description: postData.description || "",
        category: postData.category || "",
        location: postData.location || "",
        building: (() => {
          const loc = postData.location || "";
          const match = loc.match(/Tòa\s*([A-G]|NULL)/i);
          return match ? match[1].toUpperCase() : "";
        })(),
        room: (() => {
          const loc = postData.location || "";
          const match = loc.match(/Phòng\s*([^\-–,|]*)/i);
          return match ? match[1].trim() : "";
        })(),
        address: (() => {
          const loc = postData.location || "";
          if (!loc) return "";
          const parts = loc.split(" - ");
          return parts.length >= 3 ? parts.slice(2).join(" - ").trim() : "";
        })(),
        date: postData.date || "",
        contact: postData.contact || "",
        image: null,
      });
      // Set preview với ảnh cũ nếu có
      setPreview(existingImage);
    }
  }, [postData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleClearImage = () => {
    setFormData({ ...formData, image: null });
    setPreview(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Xử lý ảnh: ưu tiên preview (ảnh mới hoặc ảnh cũ), nếu không sẽ giữ ảnh cũ
    let finalImage = postData.image || postData.imageUrl; // Giữ ảnh cũ mặc định
    if (preview) {
      // Nếu có preview (ảnh mới upload hoặc ảnh cũ)
      finalImage = preview;
    }
    // Nếu không có preview, giữ ảnh cũ (đã set ở trên)
    
    const parts = [];
    if (formData.building) {
      parts.push(`Tòa ${formData.building}`);
    }
    if (formData.room) {
      parts.push(`Phòng ${formData.room}`);
    }
    if (formData.address) {
      parts.push(formData.address.trim());
    }
    const composedLocation = parts.join(" - ");

    const updatedPost = {
      ...postData, // Giữ tất cả dữ liệu cũ trước
      // Sau đó override với dữ liệu mới từ form
      id: postData.id, // Đảm bảo giữ nguyên ID
      type: formData.postType, // Đảm bảo type được set đúng
      title: formData.title,
      description: formData.description,
      category: formData.category,
      location: composedLocation || formData.location,
      date: formData.date,
      contact: formData.contact,
      author: formData.author || postData.author, // Giữ author nếu không có
      image: finalImage, // Dùng ảnh đã xử lý ở trên
      time: postData.time || "Vừa đăng", // Giữ time cũ
      status: postData.status || "active", // Giữ status cũ
      views: postData.views || 0, // Giữ views cũ
      updatedAt: new Date().toISOString(),
    };
    
    onUpdate(updatedPost);
    onClose();
    alert("✅ Bài đăng đã được cập nhật thành công!");
  };

  return (
    <div className="overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Chỉnh sửa bài đăng</h2>
          <button className="close-btn" onClick={onClose}>
            <CloseIcon style={{ fontSize: 22 }} />
          </button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          {/* Loại bài đăng */}
          <div className="form-section">
            <label>Chọn loại bài đăng</label>
            <div className="post-type-group">
              <button
                type="button"
                className={`type-btn ${
                  formData.postType === "lost" ? "active" : ""
                }`}
                onClick={() => setFormData({ ...formData, postType: "lost" })}
              >
                Tìm đồ thất lạc
              </button>
              <button
                type="button"
                className={`type-btn ${formData.postType === "found" ? "active" : ""}`}
                onClick={() => setFormData({ ...formData, postType: "found" })}
              >
                Nhặt được đồ
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>
              Tiêu đề
              <span className="required-marker">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>
              Mô tả chi tiết
              <span className="required-marker">*</span>
            </label>
            <textarea
              name="description"
              rows="4"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>

          <div className="upload-section">
            <label>Hình ảnh</label>
            <div className="upload-container">
              {!preview ? (
                <label className="upload-label">
                  <CloudUploadIcon style={{ fontSize: 18, marginRight: "8px" }} />
                  Kéo thả hoặc chọn ảnh để tải lên
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                </label>
              ) : (
                <div className="upload-preview">
                  <img src={preview} alt="preview" className="preview-image" />
                  <button
                    type="button"
                    className="clear-image-btn"
                    onClick={handleClearImage}
                  >
                    <CloseIcon style={{ fontSize: 14 }} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                Danh mục
                <span className="required-marker">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Chọn danh mục</option>
                <option value="Ví/Túi tiền">Ví/Túi tiền</option>
                <option value="Điện thoại">Điện thoại</option>
                <option value="Laptop">Laptop</option>
                <option value="Chìa khóa">Chìa khóa</option>
                <option value="Thú cưng">Thú cưng</option>
                <option value="Khác">Khác</option>
              </select>
            </div>

            <div className="form-group">
              <label>
                Tòa
                <span className="required-marker">*</span>
              </label>
              <select name="building" value={formData.building} onChange={handleChange} required>
                <option value="">Chọn tòa</option>
                <option value="A">Tòa A</option>
                <option value="B">Tòa B</option>
                <option value="C">Tòa C</option>
                <option value="D">Tòa D</option>
                <option value="E">Tòa E</option>
                <option value="F">Tòa F</option>
                <option value="G">Tòa G</option>
                <option value="NULL">NULL</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Phòng</label>
              <input
                type="text"
                name="room"
                value={formData.room}
                onChange={handleChange}
                placeholder="Ví dụ: 101, B2-204..."
              />
            </div>
            <div className="form-group">
              <label>Địa chỉ</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Ví dụ: Cổng số 3, Khu A..."
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                Ngày xảy ra
                <span className="required-marker">*</span>
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>
                Số điện thoại liên hệ
                <span className="required-marker">*</span>
              </label>
              <input
                type="text"
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="submit-btn">
              Cập nhật
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPostModal;
