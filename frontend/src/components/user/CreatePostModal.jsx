import React, { useState, useEffect, useRef } from "react";
import { Close as CloseIcon } from "@mui/icons-material";
import "./CreatePostModal.css";

const CreatePostModal = ({ onClose, onSubmit, mode = "create", existingData = null, lockPostType = false, initialPostType = "lost", user = null }) => {
  const [formData, setFormData] = useState({
    postType: initialPostType,
    author: user?.name || "",
    title: "",
    description: "",
    category: "",
    location: "",
    building: "",
    room: "",
    address: "",
    date: "",
    contact: user?.phone || "",
    image: null,
  });

  const [images, setImages] = useState([]); // Mảng để lưu nhiều ảnh (tối đa 3)
  const [errors, setErrors] = useState({});
  const [zoomedImage, setZoomedImage] = useState(null); // Ảnh đang được phóng to
  const modalRef = useRef(null);

  // 🔹 Refs cho các trường input để focus khi có lỗi
  const titleRef = useRef(null);
  const imageRef = useRef(null);
  const descriptionRef = useRef(null);
  const categoryRef = useRef(null);
  const buildingRef = useRef(null);
  const dateRef = useRef(null);
  const contactRef = useRef(null);

  // 🔹 Lock body scroll khi modal mở
  useEffect(() => {
    // Save current scroll position
    const scrollY = window.scrollY;
    // Save original body styles
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalTop = document.body.style.top;
    const originalWidth = document.body.style.width;
    
    // Lock body scroll by setting position fixed
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    
    // Cleanup function to restore original styles and scroll position
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.width = originalWidth;
      // Restore scroll position
      window.scrollTo(0, scrollY);
    };
  }, []);

  // 🔹 Kiểm tra xem người dùng đã nhập dữ liệu chưa
  const hasUserEnteredData = () => {
    // Kiểm tra các trường text
    const hasTextData = 
      (formData.title && formData.title.trim().length > 0) ||
      (formData.description && formData.description.trim().length > 0) ||
      (formData.room && formData.room.trim().length > 0) ||
      (formData.address && formData.address.trim().length > 0);
    
    // Kiểm tra xem có ảnh được upload chưa
    const hasImages = images.length > 0;
    
    // Kiểm tra xem building có khác giá trị mặc định không (nếu user đã chọn)
    const hasSelectedBuilding = formData.building && formData.building.trim().length > 0;
    
    return hasTextData || hasImages || hasSelectedBuilding;
  };

  // 🔹 Xử lý khi người dùng nhấn nút Hủy
  const handleCancel = () => {
    if (mode === "create" && hasUserEnteredData()) {
      const confirmCancel = window.confirm(
        "Bạn đã nhập một số thông tin. Bạn có chắc chắn muốn hủy bài đăng này không? Tất cả dữ liệu sẽ bị mất."
      );
      if (confirmCancel) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  // 🔹 Xử lý ESC key để đóng modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (zoomedImage) {
          setZoomedImage(null);
        } else {
          handleCancel();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, zoomedImage, mode, formData, images]);

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

  // 🔹 Tự động fill author, contact, date và category từ user khi component mount
  useEffect(() => {
    if (mode === "create") {
      const today = new Date();
      const dateString = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      
      setFormData(prev => {
        // Set category mặc định dựa trên postType
        const defaultCategory = prev.postType === "lost" ? "Ví/Túi" : "Điện thoại";
        
        return {
          ...prev,
          author: user?.name || prev.author,
          contact: user?.phone || prev.contact,
          date: prev.date || dateString, // Tự động set ngày hiện tại nếu chưa có
          category: prev.category || defaultCategory, // Set mặc định nếu chưa có
        };
      });
    }
  }, [user, mode]);

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
        date: existingData.date || "",
        contact: existingData.contact || "",
        image: null,
      });
      // Load ảnh cũ vào images array nếu có
      if (existingData.imageUrl || existingData.image) {
        setImages([{
          file: null,
          preview: existingData.imageUrl || existingData.image,
          id: Date.now()
        }]);
      }
    }
  }, [mode, existingData]);

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
    
    // Tên người đăng tự động lấy từ user prop, không cần validate

    // Validation cho tiêu đề
    if (!formData.title || formData.title.trim().length < 5) {
      newErrors.title = "Tiêu đề phải có ít nhất 5 ký tự.";
    }

    // Validation cho hình ảnh (bắt buộc, tối đa 3 ảnh)
    if (images.length === 0) {
      newErrors.image = "Vui lòng tải lên ít nhất 1 ảnh cho bài đăng.";
    } else if (images.length > 3) {
      newErrors.image = "Bạn chỉ có thể tải tối đa 3 ảnh.";
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

    // Validation cho ngày xảy ra
    if (!formData.date) {
      newErrors.date = "Vui lòng chọn ngày xảy ra.";
    } else {
      // Kiểm tra ngày không được là tương lai
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (selectedDate > today) {
        newErrors.date = "Ngày xảy ra không được là ngày tương lai.";
      }
    }

    // Validation cho số điện thoại
    const phone = formData.contact.trim();
    const normalizedPhone = phone.replace(/\s+/g, "");
    if (!phone) {
      newErrors.contact = "Vui lòng nhập số điện thoại liên hệ.";
    } else if (!/^(0|\+84)\d{8,9}$|^\d{9,11}$/.test(normalizedPhone)) {
      newErrors.contact = "Số điện thoại không hợp lệ. Vui lòng nhập 9-11 số (bắt đầu bằng 0 hoặc +84).";
    }

    setErrors(newErrors);
    
    // 🔹 Trả về object chứa validation status và tên field lỗi đầu tiên
    const fieldOrder = ['title', 'image', 'description', 'category', 'building', 'date', 'contact'];
    const firstErrorField = fieldOrder.find(field => newErrors[field]);
    
    return {
      isValid: Object.keys(newErrors).length === 0,
      firstErrorField: firstErrorField || null
    };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validation = validateForm();
    
    if (!validation.isValid) {
      // 🔹 Focus vào field đầu tiên có lỗi
      const fieldRefMap = {
        title: titleRef,
        image: imageRef,
        description: descriptionRef,
        category: categoryRef,
        building: buildingRef,
        date: dateRef,
        contact: contactRef
      };
      
      const errorRef = fieldRefMap[validation.firstErrorField];
      if (errorRef && errorRef.current) {
        // Scroll đến element với smooth behavior
        errorRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        
        // Focus vào element sau khi scroll (delay nhỏ để đảm bảo scroll hoàn tất)
        setTimeout(() => {
          errorRef.current.focus();
        }, 300);
      }
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
    
    // Gửi images thay vì image đơn lẻ
    onSubmit({ 
      ...formData, 
      location: composedLocation,
      images: images.map(img => img.file),
      imagePreviews: images.map(img => img.preview)
    });
  };

  return (
    <div 
      className="overlay" 
      onClick={(e) => {
        // Chỉ đóng khi click vào overlay (không phải modal)
        if (e.target === e.currentTarget) {
          handleCancel();
        }
      }}
    >
      <div className="modal" ref={modalRef} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>{mode === "edit" ? "Chỉnh sửa bài đăng" : "Tạo bài đăng mới"}</h2>
          <button type="button" className="close-modal-btn" onClick={handleCancel} aria-label="Đóng">
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
                  onClick={() => {
                    setFormData({ 
                      ...formData, 
                      postType: "lost",
                      category: "Ví/Túi" // Set category mặc định khi chọn "lost"
                    });
                  }}
                >
                  Tìm đồ thất lạc
                </button>
                <button
                  type="button"
                  className={`type-btn ${formData.postType === "found" ? "active" : ""}`}
                  onClick={() => {
                    setFormData({ 
                      ...formData, 
                      postType: "found",
                      category: "Điện thoại" // Set category mặc định khi chọn "found"
                    });
                  }}
                >
                  Nhặt được đồ
                </button>
              </div>
            </div>
          )}

          {/* Tên người đăng - Hidden (auto từ user) */}
          <input type="hidden" name="author" value={formData.author} />

          {/* Tiêu đề */}
          <div className="form-group">
            <label>Tiêu đề <span className="required-star">*</span></label>
            <input
              ref={titleRef}
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
            <label>Tải ảnh của bạn <span className="required-star">*</span> <span style={{ fontSize: "12px", color: "#666", fontWeight: "normal" }}>(Tối đa 3 ảnh)</span></label>
            <div ref={imageRef} tabIndex="-1" className={`upload-container ${errors.image ? "input-error" : ""}`}>
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

          {/* Mô tả chi tiết */}
          <div className="form-group">
            <label>Mô tả chi tiết <span className="required-star">*</span></label>
            <textarea
              ref={descriptionRef}
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
              <label>Danh mục <span className="required-star">*</span></label>
              <select 
                ref={categoryRef}
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
              <label>Tòa <span className="required-star">*</span></label>
              <select 
                ref={buildingRef}
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
                <option value="NULL">Không xác định</option>
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
              <label>Ngày xảy ra <span className="required-star">*</span></label>
              <input
                ref={dateRef}
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className={errors.date ? "input-error" : ""}
              />
              {errors.date && <p className="field-error">{errors.date}</p>}
            </div>
            <div className="form-group">
              <label>Số điện thoại liên hệ <span className="required-star">*</span></label>
              <input
                ref={contactRef}
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
            <button type="button" className="cancel-btn" onClick={handleCancel}>
              <span>Hủy</span>
            </button>
            <button type="submit" className="submit-btn"> 
              <span>{mode === "edit" ? "Lưu thay đổi" : "Đăng bài"}</span>
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

export default CreatePostModal;
