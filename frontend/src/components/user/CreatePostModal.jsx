import React, { useState, useEffect, useRef } from "react";
import { Close as CloseIcon, Upload } from "@mui/icons-material";
import "./CreatePostModal.css";

const CreatePostModal = ({
  onClose,
  onSubmit,
  mode = "create",
  existingData = null,
  lockPostType = false,
  initialPostType = "lost",
  user = null
}) => {
  const [formData, setFormData] = useState({
    postType: initialPostType,
    author: user?.name || "",
    title: "",
    description: "",
    category: "Ví/Túi",
    location: "",
    building: "",
    room: "",
    address: "",
    date: new Date().toISOString().split("T")[0],
    contact: user?.phone || user?.contact || "",
    image: null,
  });

  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState({});
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
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  // Lock postType if lockPostType is true
  useEffect(() => {
    if (mode === "edit" && existingData) {
      setFormData({
        postType: existingData.type || "lost",
        author: existingData.author || "",
        title: existingData.title || "",
        description: existingData.description || "",
        category: existingData.category || "Ví/Túi",
        location: existingData.location || "",
        // cố gắng parse từ location cũ nếu có định dạng "Tòa X - Phòng Y - Địa chỉ"
        building: (() => {
          const loc = existingData.location || "";
          const match = loc.match(/Tòa\s*([A-G]|NULL)/i);
          return match ? match[1].toUpperCase() : "";
        })(),
        room: (() => {
          const loc = existingData.location || "";
          const match = loc.match(/Phòng\s*([^\-–,|]*)/i);
          return match ? match[1].trim() : "";
        })(),
        address: (() => {
          const loc = existingData.location || "";
          if (!loc) return "";
          const parts = loc.split(" - ");
          return parts.length >= 3 ? parts.slice(2).join(" - ").trim() : "";
        })(),
        date: existingData.date || new Date().toISOString().split("T")[0],
        contact: existingData.contact || "",
        image: null,
      });
      setPreview(existingData.imageUrl || existingData.image || null);
      setErrors({});
    }
  }, [mode, existingData]);

  useEffect(() => {
    if (mode !== "edit" && user) {
      setFormData((prev) => ({
        ...prev,
        author: user.name || prev.author,
        contact: user.phone || user.contact || prev.contact,
        date: prev.date || new Date().toISOString().split("T")[0],
        category: prev.category || "Ví/Túi",
      }));
    }
  }, [user, mode]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
      if (errors.image) {
        setErrors((prev) => {
          const updated = { ...prev };
          delete updated.image;
          return updated;
        });
      }
    }
  };

  const handleClearImage = () => {
    setFormData({ ...formData, image: null });
    setPreview(null);
    setErrors((prev) => ({
      ...prev,
      image: "Vui lòng tải lên ít nhất một hình ảnh."
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    const trimmedAuthor = formData.author.trim();
    if (!trimmedAuthor) {
      newErrors.author = "Vui lòng nhập tên người đăng.";
    } else if (trimmedAuthor.length < 3) {
      newErrors.author = "Tên người đăng phải có ít nhất 3 ký tự.";
    }

    const trimmedTitle = formData.title.trim();
    if (!trimmedTitle) {
      newErrors.title = "Vui lòng nhập tiêu đề.";
    } else if (trimmedTitle.length < 5) {
      newErrors.title = "Tiêu đề phải có ít nhất 5 ký tự.";
    }

    const trimmedDescription = formData.description.trim();
    if (!trimmedDescription) {
      newErrors.description = "Vui lòng nhập mô tả chi tiết.";
    } else if (trimmedDescription.length < 88) {
      newErrors.description = "Mô tả cần ít nhất 8 ký tự để cung cấp đủ thông tin.";
    }

    if (!formData.category) {
      newErrors.category = "Vui lòng chọn danh mục.";
    }

    if (!formData.building) {
      newErrors.building = "Vui lòng chọn tòa.";
    }

    if (!formData.date) {
      newErrors.date = "Vui lòng chọn ngày xảy ra.";
    }

    const phone = formData.contact.trim();
    const normalizedPhone = phone.replace(/\s+/g, "");
    if (!phone) {
      newErrors.contact = "Vui lòng nhập số điện thoại liên hệ.";
    } else if (!/^(0|\+84)\d{8,9}$|^\d{9,11}$/.test(normalizedPhone)) {
      newErrors.contact = "Số điện thoại không hợp lệ. Vui lòng nhập 9-11 số.";
    }

    if (!preview && !formData.image) {
      newErrors.image = "Vui lòng tải lên ít nhất một hình ảnh.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
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
    onSubmit({ ...formData, location: composedLocation });
  };

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
            <label>
              Tên người đăng
              <span className="required-marker">*</span>
            </label>
            <input
              type="text"
              name="author"
              placeholder="Nhập tên người đăng..."
              value={formData.author}
              onChange={handleChange}
              readOnly={!!user}
              className={errors.author ? "input-error" : ""}
            />
            {errors.author && <p className="field-error">{errors.author}</p>}
          </div>

          {/* Tiêu đề */}
          <div className="form-group">
            <label>
              Tiêu đề
              <span className="required-marker">*</span>
            </label>
            <input
              type="text"
              name="title"
              placeholder="Nhập tiêu đề bài viết"
              value={formData.title}
              onChange={handleChange}
              className={errors.title ? "input-error" : ""}
            />
            {errors.title && <p className="field-error">{errors.title}</p>}
          </div>

          {/* Upload ảnh */}
          <div className="upload-section">
            <label>
              Tải ảnh của bạn
              <span className="required-marker">*</span>
            </label>
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
            {errors.image && <p className="field-error">{errors.image}</p>}
          </div>

          {/* Mô tả chi tiết */}
          <div className="form-group">
            <label>
              Mô tả chi tiết
              <span className="required-marker">*</span>
            </label>
            <textarea
              name="description"
              placeholder="Mô tả chi tiết về đồ vật, địa điểm, thời gian..."
              rows="4"
              value={formData.description}
              onChange={handleChange}
              className={errors.description ? "input-error" : ""}
            />
            {errors.description && <p className="field-error">{errors.description}</p>}
          </div>

          {/* Danh mục & địa điểm */}
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
                className={errors.category ? "input-error" : ""}
              >
                <option value="">Chọn danh mục</option>
                <option value="Ví/Túi">Ví/Túi</option>
                <option value="Điện thoại">Điện thoại</option>
                <option value="Laptop">Laptop</option>
                <option value="Chìa khóa">Chìa khóa</option>
                <option value="Phụ kiện">Phụ kiện</option>
                <option value="Khác">Khác</option>
              </select>
              {errors.category && <p className="field-error">{errors.category}</p>}
            </div>
            <div className="form-group">
              <label>
                Tòa
                <span className="required-marker">*</span>
              </label>
              <select
                name="building"
                value={formData.building}
                onChange={handleChange}
                className={errors.building ? "input-error" : ""}
              >
                <option value="">Chọn tòa</option>
                <option value="A">Tòa A</option>
                <option value="B">Tòa B</option>
                <option value="C">Tòa C</option>
                <option value="D">Tòa D</option>
                <option value="E">Tòa E</option>
                <option value="F">Tòa F</option>
                <option value="G">Tòa G</option>
              </select>
              {errors.building && <p className="field-error">{errors.building}</p>}
            </div>
          </div>

          {/* Phòng & Địa chỉ */}
          <div className="form-row">
            <div className="form-group">
              <label>Phòng</label>
              <input
                type="text"
                name="room"
                placeholder="Ví dụ: 101, B2-204..."
                value={formData.room}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Địa chỉ</label>
              <input
                type="text"
                name="address"
                placeholder="Ví dụ: Cổng số 3, Khu A..."
                value={formData.address}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Ngày & Liên hệ */}
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
                className={errors.date ? "input-error" : ""}
              />
              {errors.date && <p className="field-error">{errors.date}</p>}
            </div>
            <div className="form-group">
              <label>
                Số điện thoại liên hệ
                <span className="required-marker">*</span>
              </label>
              <input
                type="text"
                name="contact"
                placeholder="Nhập số điện thoại của bạn"
                value={formData.contact}
                onChange={handleChange}
                className={errors.contact ? "input-error" : ""}
              />
              {errors.contact && <p className="field-error">{errors.contact}</p>}
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" className="cancel-btn" onClick={onClose}>
              <span>Hủy</span>
            </button>
            <button type="submit" className="submit-btn"> 
              <span>{mode === "edit" ? "Lưu thay đổi" : "Đăng bài"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;
