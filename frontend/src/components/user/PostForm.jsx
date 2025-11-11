import React, { useState } from 'react';
import './PostForm.css';
import {
  CameraAlt as CameraIcon
} from '@mui/icons-material';

const PostForm = ({ type, onBack }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    category: '',
    contact: '',
    images: []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    'Thiết bị điện tử',
    'Ví/Giấy tờ tùy thân',
    'Chìa khóa',
    'Thú cưng',
    'Phương tiện giao thông',
    'Đồ dùng gia đình',
    'Quần áo/Phụ kiện',
    'Khác'
  ];

  const handleInputChange = (field) => (e) => {
    setFormData({
      ...formData,
      [field]: e.target.value
    });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setFormData({
      ...formData,
      images: [...formData.images, ...files]
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      alert(`${type === 'lost' ? 'Tin tìm đồ' : 'Tin nhặt được'} đã được đăng thành công!`);
      setIsSubmitting(false);
      onBack();
    }, 2000);
  };

  return (
    <div className="post-form">
      <div className="form-container">
        <div className="form-header">
          <button className="back-btn" onClick={onBack}>
            ← Quay lại
          </button>
          <h1 className="form-title">
            {type === 'lost' ? 'Đăng tin tìm đồ' : 'Đăng tin nhặt được'}
          </h1>
          <p className="form-subtitle">
            {type === 'lost' 
              ? 'Mô tả chi tiết đồ vật bạn đã mất để tăng cơ hội tìm lại'
              : 'Mô tả đồ vật bạn đã nhặt được để giúp chủ nhân tìm lại'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="form-content">
          <div className="form-group">
            <label className="form-label">Tiêu đề *</label>
            <input
              type="text"
              className="form-input"
              placeholder={type === 'lost' ? 'Ví dụ: Mất ví da màu nâu tại quán cà phê' : 'Ví dụ: Nhặt được điện thoại iPhone tại công viên'}
              value={formData.title}
              onChange={handleInputChange('title')}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mô tả chi tiết *</label>
            <textarea
              className="form-textarea"
              placeholder="Mô tả đặc điểm, màu sắc, kích thước, dấu hiệu nhận biết..."
              value={formData.description}
              onChange={handleInputChange('description')}
              rows="4"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Địa điểm *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ví dụ: Quận 1, TP.HCM"
                value={formData.location}
                onChange={handleInputChange('location')}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Danh mục *</label>
              <select
                className="form-select"
                value={formData.category}
                onChange={handleInputChange('category')}
                required
              >
                <option value="">Chọn danh mục</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Thông tin liên hệ *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Số điện thoại hoặc email"
              value={formData.contact}
              onChange={handleInputChange('contact')}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Hình ảnh</label>
            <div className="image-upload">
              <input
                type="file"
                id="image-upload"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="image-input"
              />
              <label htmlFor="image-upload" className="image-upload-btn">
                <CameraIcon style={{ fontSize: '18px', marginRight: '8px', verticalAlign: 'middle' }} />
                Tải lên hình ảnh
              </label>
              <p className="image-hint">Tối đa 5 hình ảnh (JPG, PNG)</p>
            </div>
            
            {formData.images.length > 0 && (
              <div className="image-preview">
                {formData.images.map((file, index) => (
                  <div key={index} className="preview-item">
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt={`Preview ${index + 1}`}
                      className="preview-image"
                    />
                    <button 
                      type="button"
                      className="remove-image"
                      onClick={() => {
                        const newImages = formData.images.filter((_, i) => i !== index);
                        setFormData({ ...formData, images: newImages });
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onBack}>
              Hủy
            </button>
            <button 
              type="submit" 
              className="btn-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang đăng...' : 'Đăng tin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostForm;
