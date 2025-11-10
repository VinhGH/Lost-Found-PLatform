import React, { useState, useEffect } from "react";
import { X, Upload } from "lucide-react";
import "./CreatePostModal.css"; // dùng chung style

const EditPostModal = ({ postData, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    postType: "lost",
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

  // ✅ Khóa cuộn nền khi mở modal
  useEffect(() => {
    document.body.classList.add("modal-open");
    return () => document.body.classList.remove("modal-open");
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
        date: postData.date || "",
        contact: postData.contact || "",
        sampleImage: postData.sampleImage || "",
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
    
    // Xử lý ảnh: ưu tiên preview (ảnh mới hoặc ảnh cũ), sau đó sampleImage, cuối cùng là ảnh cũ
    let finalImage = postData.image || postData.imageUrl; // Giữ ảnh cũ mặc định
    if (preview) {
      // Nếu có preview (có thể là ảnh mới upload, sample mới chọn, hoặc ảnh cũ)
      finalImage = preview;
    } else if (formData.sampleImage) {
      // Nếu chọn sample image mới
      finalImage = formData.sampleImage;
    }
    // Nếu không có preview và không có sampleImage mới, giữ ảnh cũ (đã set ở trên)
    
    const updatedPost = {
      ...postData, // Giữ tất cả dữ liệu cũ trước
      // Sau đó override với dữ liệu mới từ form
      id: postData.id, // Đảm bảo giữ nguyên ID
      type: formData.postType, // Đảm bảo type được set đúng
      title: formData.title,
      description: formData.description,
      category: formData.category,
      location: formData.location,
      date: formData.date,
      contact: formData.contact,
      author: formData.author || postData.author, // Giữ author nếu không có
      image: finalImage, // Dùng ảnh đã xử lý ở trên
      sampleImage: formData.sampleImage || postData.sampleImage, // Giữ sampleImage nếu có
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
            <X size={22} />
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
            <label>Tiêu đề *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Mô tả chi tiết *</label>
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
                  <button
                    type="button"
                    className="clear-image-btn"
                    onClick={handleClearImage}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Ảnh mẫu */}
          <div className="sample-section">
            <label>Hoặc chọn hình ảnh mẫu:</label>
            <div className="sample-grid">
              {[
                { id: 1, label: "Thẻ căn cước/CMND", img: "/img/sample-idcard.png" },
                { id: 2, label: "Ví/Túi tiền", img: "/img/sample-wallet.jpg" },
                { id: 3, label: "Chìa khóa", img: "/img/sample-key.jpg" },
                { id: 4, label: "Điện thoại/Thiết bị điện tử", img: "/img/sample-phone.jpg" },
                { id: 5, label: "Balo/Túi xách", img: "/img/sample-bag.jpg" },
                { id: 6, label: "Khác", img: "/img/sample-different.jpg" },
              ].map((sample) => (
                <div
                  key={sample.id}
                  className={`sample-card ${
                    formData.sampleImage === sample.img ? "active" : ""
                  }`}
                  onClick={() => {
                    setFormData({ ...formData, sampleImage: sample.img });
                    setPreview(sample.img);
                  }}
                >
                  <img src={sample.img} alt={sample.label} />
                  <p>{sample.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Danh mục *</label>
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
              <label>Địa điểm *</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Ngày xảy ra *</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Số điện thoại liên hệ *</label>
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
