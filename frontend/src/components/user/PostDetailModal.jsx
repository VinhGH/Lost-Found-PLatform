import React, { useState, useEffect } from "react";
import "./PostDetailModal.css";
import Breadcrumb from "../common/Breadcrumb";
import {
  X as CloseIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
} from "@mui/icons-material";

// 🔹 Hàm tính toán thời gian real-time
const getTimeAgo = (timestamp) => {
  if (!timestamp) return "Vừa đăng";
  
  const now = Date.now();
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
  const [, forceTimeUpdate] = useState(Date.now());
  const [showImagePreview, setShowImagePreview] = useState(false);
  
  // 🔹 Lock body scroll when modal is open
  useEffect(() => {
    if (post) {
      // Save original body overflow style
      const originalOverflow = document.body.style.overflow;
      // Lock body scroll
      document.body.style.overflow = 'hidden';
      
      // Cleanup function to restore original overflow
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [post]);
  
  // 🔹 Cập nhật thời gian mỗi phút để real-time
  useEffect(() => {
    if (!post) return;
    
    const interval = setInterval(() => {
      forceTimeUpdate(Date.now());
    }, 60000); // Cập nhật mỗi 60 giây
    
    return () => clearInterval(interval);
  }, [post]);
  
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
                <TimeIcon /> <strong>Thời gian:</strong> {getTimeAgo(post.createdAt || post.id)}
              </div>
              {post.contact && (
                <div>
                  <PhoneIcon /> <strong>Liên hệ:</strong> {post.contact}
                </div>
              )}
            </div>
          </div>

          {/* Image */}
          <div
            className={`detail-image ${post.image ? "is-clickable" : ""}`}
            onClick={() => post.image && setShowImagePreview(true)}
            role={post.image ? "button" : undefined}
            tabIndex={post.image ? 0 : -1}
            onKeyDown={(e) => {
              if (post.image && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                setShowImagePreview(true);
              }
            }}
          >
            {post.image ? (
              <img src={post.image} alt={post.title} />
            ) : (
              <div className="no-image-placeholder">Không có hình ảnh</div>
            )}
          </div>

          {/* Content */}
          <div className="detail-body">
            <p className="detail-description">{post.description}</p>
          </div>

        </div>

        {showImagePreview && post.image && (
          <div className="detail-image-overlay" onClick={() => setShowImagePreview(false)}>
            <button
              className="overlay-close-btn"
              onClick={() => setShowImagePreview(false)}
              aria-label="Đóng ảnh phóng to"
            >
              <CloseIcon style={{ fontSize: 26 }} />
            </button>
            <div className="detail-image-overlay-content" onClick={(e) => e.stopPropagation()}>
              <img src={post.image} alt={post.title} />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="detail-footer">
          <button className="btn-close" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostDetailModal;
