import React, { useState, useEffect } from "react";
import "./PostDetailModal.css";
import Breadcrumb from "../common/Breadcrumb";
import {
  Close as CloseIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
} from "@mui/icons-material";

// 🔹 Hàm tính toán thời gian real-time
const getTimeAgo = (timestamp, currentTime = Date.now()) => {
  if (!timestamp) return "Vừa đăng";
  
  const now = currentTime;
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) return "Vừa đăng";
  if (minutes < 60) return `${minutes} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days < 7) return `${days} ngày trước`;
  
  // Nếu quá 7 ngày, hiển thị ngày tháng
  const date = new Date(timestamp);
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const PostDetailModal = ({ post, onClose, onNavigate, currentTab, categoryPath }) => {
  
  // Default props for backward compatibility
  const handleNavigate = onNavigate || (() => {});
  const tabName = currentTab || (post.type === "lost" ? "Đồ mất" : "Đồ nhặt được");
  const category = categoryPath || post.category;
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  
  // 🔹 Lock body scroll when modal is open
  useEffect(() => {
    if (post) {
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
    }
  }, [post]);
  
  // 🔹 Cập nhật thời gian mỗi phút để real-time
  useEffect(() => {
    if (!post) return;
    
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // Cập nhật mỗi 60 giây
    
    return () => clearInterval(interval);
  }, [post]);

  // 🔹 Xử lý ESC key để đóng modal phóng to ảnh
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isImageZoomed) {
        setIsImageZoomed(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isImageZoomed]);
  
  if (!post) return null;

  // Tạo breadcrumb items
  const breadcrumbItems = [
    {
      label: tabName,
      onClick: () => handleNavigate(tabName),
      disabled: false
    },
    {
      label: category,
      onClick: () => handleNavigate(tabName, category),
      disabled: false
    },
    {
      label: post.title,
      active: true
    }
  ];

  return (
    <div className="detail-overlay">
      <div className="detail-modal">
        {/* Breadcrumb Navigation */}
        <div className="detail-breadcrumb">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Header */}
        <div className="detail-header">
          <h2>{post.title}</h2>
          <button className="close-btn" onClick={onClose}>
            <CloseIcon style={{ fontSize: "22px" }} />
          </button>
        </div>

        {/* Scrollable Content Wrapper */}
        <div className="detail-content-wrapper">
          {/* Info Section - Above Image */}
          <div className="detail-info-section">
            <div className="detail-info">
              <div className="detail-info-left">
                <div>
                  <LocationIcon /> <strong>Địa điểm:</strong> {post.location}
                </div>
                <div>
                  <PersonIcon /> <strong>Người đăng:</strong> {post.author}
                </div>
              </div>
              <div className="detail-info-right">
                <div>
                  <TimeIcon /> <strong>Thời gian:</strong> {getTimeAgo(post.createdAt || post.id, currentTime)}
                </div>
                {post.contact && (
                  <div>
                    <PhoneIcon /> <strong>Liên hệ:</strong> {post.contact}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="detail-image" onClick={() => setIsImageZoomed(true)}>
            <img src={post.image} alt={post.title} />
            <div className="image-zoom-hint">Click để phóng to</div>
          </div>

          {/* Content */}
          <div className="detail-body">
            <p className="detail-description">{post.description}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="detail-footer">
          <button className="btn-close" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>

      {/* Image Zoom Modal */}
      {isImageZoomed && (
        <div className="image-zoom-overlay" onClick={() => setIsImageZoomed(false)}>
          <div className="image-zoom-container" onClick={(e) => e.stopPropagation()}>
            <button className="image-zoom-close" onClick={() => setIsImageZoomed(false)}>
              <CloseIcon style={{ fontSize: "24px" }} />
            </button>
            <img src={post.image} alt={post.title} className="zoomed-image" />
          </div>
        </div>
      )}
    </div>
  );
};

export default PostDetailModal;
