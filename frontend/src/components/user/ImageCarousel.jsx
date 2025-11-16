import React, { useState, useEffect, useRef } from 'react';
import './ImageCarousel.css';

const ImageCarousel = ({ images, postId }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef(null);

  // Nếu không có images hoặc chỉ có 1 ảnh, hiển thị ảnh đơn
  const displayImages = images && Array.isArray(images) && images.length > 0 
    ? images 
    : (images ? [images] : []);

  const hasMultipleImages = displayImages.length > 1;

  // Auto-slide cho nhiều ảnh
  useEffect(() => {
    if (hasMultipleImages) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % displayImages.length);
      }, 5000); // Đổi ảnh mỗi 5 giây (chậm hơn)

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [hasMultipleImages, displayImages.length]);

  // Pause auto-slide khi hover
  const handleMouseEnter = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handleMouseLeave = () => {
    if (hasMultipleImages) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % displayImages.length);
      }, 5000); // Đổi ảnh mỗi 5 giây (chậm hơn)
    }
  };

  if (displayImages.length === 0) {
    return (
      <div className="post-image">
        <div className="post-image-placeholder">Không có ảnh</div>
      </div>
    );
  }

  const currentImage = displayImages[currentIndex] || displayImages[0];

  return (
    <div 
      className="post-image-container"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="post-image">
        <img 
          src={currentImage} 
          alt={`Post ${postId} - Image ${currentIndex + 1}`}
          className="post-image-img"
        />
        
        {/* Tag số lượng ảnh */}
        {hasMultipleImages && (
          <div className="image-count-badge">
            <span className="image-count-icon">📷</span>
            <span className="image-count-text">{displayImages.length}</span>
          </div>
        )}

        {/* Dots indicator */}
        {hasMultipleImages && (
          <div className="carousel-dots">
            {displayImages.map((_, index) => (
              <button
                key={index}
                className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
                onClick={() => {
                  setCurrentIndex(index);
                  // Reset interval khi click
                  if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                  }
                  intervalRef.current = setInterval(() => {
                    setCurrentIndex((prevIndex) => (prevIndex + 1) % displayImages.length);
                  }, 5000); // Đổi ảnh mỗi 5 giây (chậm hơn)
                }}
                aria-label={`Chuyển đến ảnh ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageCarousel;

