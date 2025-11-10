import React, { useState, useEffect, useRef } from "react";
import { Close as CloseIcon, Upload } from "@mui/icons-material";
import "./CreatePostModal.css";

const CreatePostModal = ({ onClose, onSubmit, mode = "create", existingData = null, lockPostType = false, initialPostType = "lost" }) => {
  const [formData, setFormData] = useState({
    postType: initialPostType,
    author: "",
    title: "",
    description: "",
    category: "",
    location: "",
    date: "",
    contact: "",
    image: null,
    sampleImage: "",
  });

  const [preview, setPreview] = useState(null);
  const modalRef = useRef(null);

  // 🔹 Lock body scroll khi modal mở
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // 🔹 Xử lý ESC key để đóng modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Lock postType if lockPostType is true
  useEffect(() => {
    if (mode === "edit" && existingData) {
      setFormData({
        postType: existingData.type || "lost",
        author: existingData.author || "",
        title: existingData.title || "",
        description: existingData.description || "",
        category: existingData.category || "",
        location: existingData.location || "",
        date: existingData.date || "",
        contact: existingData.contact || "",
        sampleImage: existingData.sampleImage || "",
        image: null,
      });
      setPreview(existingData.imageUrl || existingData.image || null);
    }
  }, [mode, existingData]);

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

  const handleSampleSelect = (sample) => {
    setFormData({ ...formData, sampleImage: sample });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const sampleImages = [
    { id: 1, label: "Thẻ căn cước/CMND", img: "/img/sample-idcard.png" },
    { id: 2, label: "Ví/Túi tiền", img: "/img/sample-wallet.jpg" },
    { id: 3, label: "Chìa khóa", img: "/img/sample-key.jpg" },
    { id: 4, label: "Điện thoại/Thiết bị điện tử", img: "/img/sample-phone.jpg" },
    { id: 5, label: "Balo/Túi xách", img: "/img/sample-bag.jpg" },
    { id: 6, label: "Khác", img: "/img/sample-different.jpg" },
  ];

  return (
    <div 
      className="overlay" 
      onClick={(e) => {
        // Chỉ đóng khi click vào overlay (không phải modal)
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="modal" ref={modalRef} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>{mode === "edit" ? "Chỉnh sửa bài đăng" : "Tạo bài đăng mới"}</h2>
          <button type="button" className="close-modal-btn" onClick={onClose} aria-label="Đóng">
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <form className="modal-body" onSubmit={handleSubmit}>
          {/* Loại bài đăng - chỉ hiển thị khi không khóa */}
          {!lockPostType && (
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
          )}

          {/* Tên người đăng */}
          <div className="form-group">
            <label>Tên người đăng *</label>
            <input
              type="text"
              name="author"
              placeholder="Nhập tên người đăng..."
              value={formData.author}
              onChange={handleChange}
              required
            />
          </div>

          {/* Tiêu đề */}
          <div className="form-group">
            <label>Tiêu đề</label>
            <input
              type="text"
              name="title"
              placeholder="Nhập tiêu đề bài viết"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          {/* Mô tả chi tiết */}
          <div className="form-group">
            <label>Mô tả chi tiết</label>
            <textarea
              name="description"
              placeholder="Mô tả chi tiết về đồ vật, địa điểm, thời gian..."
              rows="4"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>

          {/* Upload ảnh */}
          <div className="upload-section">
            <label>Tải ảnh của bạn</label>
            <div className="upload-container">
              {!preview ? (
                <label className="upload-label">
                  <Upload size={18} style={{ marginRight: "8px" }} />
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
                  <button type="button" className="clear-image-btn" onClick={handleClearImage}>
                    <CloseIcon style={{ fontSize: "14px" }} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Ảnh mẫu */}
          <div className="sample-section">
            <label>Hoặc chọn hình ảnh mẫu:</label>
            <div className="sample-grid">
              {sampleImages.map((sample) => (
                <div
                  key={sample.id}
                  className={`sample-card ${
                    formData.sampleImage === sample.img ? "active" : ""
                  }`}
                  onClick={() => {
                    handleSampleSelect(sample.img);
                    setPreview(sample.img);
                  }}
                >
                  <img src={sample.img} alt={sample.label} />
                  <p>{sample.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Danh mục & địa điểm */}
          <div className="form-row">
            <div className="form-group">
              <label>Danh mục</label>
              <select name="category" value={formData.category} onChange={handleChange} required>
                <option value="">Chọn danh mục</option>
                <option value="Ví/Túi">Ví/Túi</option>
                <option value="Điện thoại">Điện thoại</option>
                <option value="Laptop">Laptop</option>
                <option value="Chìa khóa">Chìa khóa</option>
                <option value="Phụ kiện">Phụ kiện</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
            <div className="form-group">
              <label>Địa điểm</label>
              <input
                type="text"
                name="location"
                placeholder="Ví dụ: Thư viện DTU"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Ngày & Liên hệ */}
          <div className="form-row">
            <div className="form-group">
              <label>Ngày xảy ra</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Số điện thoại liên hệ</label>
              <input
                type="text"
                name="contact"
                placeholder="Nhập số điện thoại của bạn"
                value={formData.contact}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="submit-btn"> 
              {mode === "edit" ? "Lưu thay đổi" : "Đăng bài"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;
