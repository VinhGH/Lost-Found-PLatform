import React, { useState, useEffect } from "react";
import { Close as CloseIcon } from "@mui/icons-material";
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
  const [images, setImages] = useState([]); // Mảng để lưu nhiều ảnh (tối đa 3)
  const [errors, setErrors] = useState({});
  const [zoomedImage, setZoomedImage] = useState(null); // Ảnh đang được phóng to

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

  // 🔹 Xử lý ESC key để đóng modal phóng to ảnh
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && zoomedImage) {
        setZoomedImage(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [zoomedImage]);

  // ✅ Load dữ liệu bài viết
  useEffect(() => {
    if (postData) {
      // Load tất cả ảnh từ postData.images hoặc fallback về postData.image
      const existingImages = postData.images && Array.isArray(postData.images) && postData.images.length > 0
        ? postData.images
        : (postData.imageUrl || postData.image ? [postData.imageUrl || postData.image] : []);

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

      // Load tất cả ảnh vào images array
      if (existingImages.length > 0) {
        setImages(existingImages.map((img, index) => ({
          file: null, // Ảnh cũ không có file object
          preview: img,
          id: Date.now() + index
        })));
      } else {
        setImages([]);
      }
    }
  }, [postData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Xóa lỗi khi người dùng bắt đầu nhập
    if (errors[name]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Lọc chỉ lấy file ảnh
    const imageFiles = files.filter(file => file.type.startsWith("image/"));

    if (imageFiles.length === 0) {
      setErrors(prev => ({
        ...prev,
        image: "Vui lòng chọn file ảnh hợp lệ."
      }));
      return;
    }

    // Kiểm tra số lượng ảnh (tối đa 3)
    if (images.length + imageFiles.length > 3) {
      setErrors(prev => ({
        ...prev,
        image: `Bạn chỉ có thể tải tối đa 3 ảnh. Hiện tại bạn đã có ${images.length} ảnh.`
      }));
      return;
    }

    // Đọc tất cả ảnh
    let loadedCount = 0;
    const newImages = [];

    imageFiles.forEach((file, index) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newImages.push({
          file: file,
          preview: reader.result,
          id: Date.now() + index
        });

        loadedCount++;
        // Khi đã đọc xong tất cả ảnh
        if (loadedCount === imageFiles.length) {
          setImages(prev => [...prev, ...newImages]);
          // Xóa lỗi nếu có
          setErrors(prev => {
            const updated = { ...prev };
            delete updated.image;
            return updated;
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleClearImage = (imageId) => {
    if (imageId) {
      // Xóa ảnh cụ thể
      setImages(prev => prev.filter(img => img.id !== imageId));
    } else {
      // Xóa tất cả
      setImages([]);
      setFormData({ ...formData, image: null });
    }
    // Xóa lỗi nếu có
    if (errors.image) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated.image;
        return updated;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validation cho tiêu đề
    if (!formData.title || formData.title.trim().length < 5) {
      newErrors.title = "Tiêu đề phải có ít nhất 5 ký tự.";
    }

    // Validation cho mô tả (tối thiểu 8 ký tự)
    if (!formData.description || formData.description.trim().length < 8) {
      newErrors.description = "Mô tả phải có ít nhất 8 ký tự.";
    }

    // Validation cho danh mục
    if (!formData.category) {
      newErrors.category = "Vui lòng chọn danh mục.";
    }

    // Validation cho tòa
    if (!formData.building) {
      newErrors.building = "Vui lòng chọn tòa.";
    }

    // ✅ KHÔNG validation cho ngày xảy ra vì field đã bị disabled (không thể thay đổi)

    // Validation cho số điện thoại
    const phone = formData.contact.trim();
    const normalizedPhone = phone.replace(/\s+/g, "");
    if (!phone) {
      newErrors.contact = "Vui lòng nhập số điện thoại liên hệ.";
    } else if (!/^(0|\+84)\d{8,9}$|^\d{9,11}$/.test(normalizedPhone)) {
      newErrors.contact = "Số điện thoại không hợp lệ. Vui lòng nhập 9-11 số (bắt đầu bằng 0 hoặc +84).";
    }

    // Validation cho hình ảnh (tối đa 3 ảnh, nhưng không bắt buộc vì có thể giữ ảnh cũ)
    if (images.length > 3) {
      newErrors.image = "Bạn chỉ có thể tải tối đa 3 ảnh.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Xử lý ảnh: nếu có ảnh mới thì dùng ảnh mới, nếu không thì giữ ảnh cũ
    let finalImage = postData.image || postData.imageUrl; // Giữ ảnh cũ mặc định
    let finalImages = postData.images && Array.isArray(postData.images) && postData.images.length > 0
      ? postData.images
      : (postData.image || postData.imageUrl ? [postData.image || postData.imageUrl] : []);

    // Nếu có ảnh mới (có file hoặc preview), dùng ảnh mới
    if (images.length > 0) {
      // Kiểm tra xem có ảnh mới (có file) hay chỉ là ảnh cũ (chỉ có preview)
      const hasNewImages = images.some(img => img.file instanceof File);

      if (hasNewImages) {
        // Có ảnh mới - dùng preview của tất cả ảnh (bao gồm cả ảnh mới và ảnh cũ chưa thay đổi)
        finalImages = images.map(img => img.preview);
      } else {
        // Chỉ có ảnh cũ - giữ nguyên
        finalImages = images.map(img => img.preview);
      }

      // Lấy ảnh đầu tiên làm ảnh chính (để backward compatibility)
      finalImage = finalImages[0];
    }
    // Nếu images.length === 0, giữ nguyên finalImage và finalImages (ảnh cũ)

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
      image: finalImage, // Ảnh chính (để backward compatibility)
      images: finalImages, // ✅ Lưu tất cả ảnh
      time: postData.time || "Vừa đăng", // Giữ time cũ
      status: postData.status || "active", // Giữ status cũ
      views: postData.views || 0, // Giữ views cũ
      createdAt: postData.createdAt || postData.id, // Giữ createdAt
      updatedAt: Date.now(), // Cập nhật thời gian chỉnh sửa
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
            <CloseIcon style={{ fontSize: "22px" }} />
          </button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          {/* Loại bài đăng */}
          <div className="form-section">
            <label>Chọn loại bài đăng</label>
            <div className="post-type-group">
              <button
                type="button"
                className={`type-btn ${formData.postType === "lost" ? "active" : ""
                  }`}
                onClick={() => {
                  if (formData.postType !== "lost") {
                    const confirmChange = window.confirm(
                      "Bạn có muốn chuyển từ 'Nhặt được đồ' sang 'Tìm đồ thất lạc' không?"
                    );
                    if (confirmChange) {
                      setFormData({ ...formData, postType: "lost" });
                    }
                  }
                }}
              >
                Tìm đồ thất lạc
              </button>
              <button
                type="button"
                className={`type-btn ${formData.postType === "found" ? "active" : ""}`}
                onClick={() => {
                  if (formData.postType !== "found") {
                    const confirmChange = window.confirm(
                      "Bạn có muốn chuyển từ 'Tìm đồ thất lạc' sang 'Nhặt được đồ' không?"
                    );
                    if (confirmChange) {
                      setFormData({ ...formData, postType: "found" });
                    }
                  }
                }}
              >
                Nhặt được đồ
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Tiêu đề <span className="required-star">*</span></label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={errors.title ? "input-error" : ""}
              required
            />
            {errors.title && <p className="field-error">{errors.title}</p>}
          </div>

          <div className="form-group">
            <label>Mô tả chi tiết <span className="required-star">*</span></label>
            <textarea
              name="description"
              rows="4"
              value={formData.description}
              onChange={handleChange}
              className={errors.description ? "input-error" : ""}
              required
            />
            {errors.description && <p className="field-error">{errors.description}</p>}
          </div>

          <div className="upload-section">
            <label>Tải ảnh của bạn <span style={{ fontSize: "12px", color: "#666", fontWeight: "normal" }}>(Tối đa 3 ảnh, để trống sẽ giữ ảnh cũ)</span></label>
            <div className={`upload-container ${errors.image ? "input-error" : ""}`}>
              {images.length === 0 ? (
                <label className="upload-label">
                  Kéo thả hoặc chọn ảnh để tải lên (tối đa 3 ảnh)
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                </label>
              ) : (
                <div className="upload-preview-grid">
                  {images.map((img) => (
                    <div key={img.id} className="upload-preview-item">
                      <img
                        src={img.preview}
                        alt="preview"
                        className="preview-image"
                        onClick={() => setZoomedImage(img.preview)}
                        style={{ cursor: "pointer" }}
                      />
                      <span
                        className="remove-image-text"
                        onClick={() => handleClearImage(img.id)}
                      >
                        Remove
                      </span>
                    </div>
                  ))}
                  {images.length < 3 && (
                    <label className="upload-add-item">
                      <span className="upload-add-icon">+</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                        style={{ display: "none" }}
                      />
                    </label>
                  )}
                </div>
              )}
            </div>
            {errors.image && <p className="field-error">{errors.image}</p>}
          </div>


          <div className="form-row">
            <div className="form-group">
              <label>Danh mục <span className="required-star">*</span></label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={errors.category ? "input-error" : ""}
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
              {errors.category && <p className="field-error">{errors.category}</p>}
            </div>

            <div className="form-group">
              <label>Tòa <span className="required-star">*</span></label>
              <select
                name="building"
                value={formData.building}
                onChange={handleChange}
                className={errors.building ? "input-error" : ""}
                required
              >
                <option value="">Chọn tòa</option>
                <option value="A">Tòa A</option>
                <option value="B">Tòa B</option>
                <option value="C">Tòa C</option>
                <option value="D">Tòa D</option>
                <option value="E">Tòa E</option>
                <option value="F">Tòa F</option>
                <option value="G">Tòa G</option>
                <option value="NULL">Không xác định</option>
              </select>
              {errors.building && <p className="field-error">{errors.building}</p>}
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
              <label>Ngày xảy ra <span style={{ fontSize: "12px", color: "#666", fontWeight: "normal" }}>(Không thể thay đổi)</span></label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className={errors.date ? "input-error" : ""}
                disabled
                style={{ backgroundColor: "#f5f5f5", cursor: "not-allowed" }}
              />
              {errors.date && <p className="field-error">{errors.date}</p>}
            </div>
            <div className="form-group">
              <label>Số điện thoại liên hệ <span className="required-star">*</span></label>
              <input
                type="text"
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                className={errors.contact ? "input-error" : ""}
                required
              />
              {errors.contact && <p className="field-error">{errors.contact}</p>}
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

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div className="image-zoom-overlay" onClick={() => setZoomedImage(null)}>
          <div className="image-zoom-container" onClick={(e) => e.stopPropagation()}>
            <button className="image-zoom-close" onClick={() => setZoomedImage(null)}>
              <CloseIcon style={{ fontSize: "24px" }} />
            </button>
            <img src={zoomedImage} alt="zoomed preview" className="zoomed-image" />
          </div>
        </div>
      )}
    </div>
  );
};

export default EditPostModal;
