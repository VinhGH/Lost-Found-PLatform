import React, { useState, useEffect } from "react";
import "./PostDetailModal.css";
import Breadcrumb from "../common/Breadcrumb";
import {
  X as CloseIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Label as LabelIcon,
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
  const [currentTime, setCurrentTime] = useState(Date.now());
  
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
      setCurrentTime(Date.now());
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
          {/* Image */}
          <div className="detail-image">
            <img src={post.image} alt={post.title} />
          </div>

          {/* Content */}
          <div className="detail-body">
            <p className="detail-description">{post.description}</p>

            <div className="detail-info">
              <div>
                <LocationIcon /> <strong>Địa điểm:</strong> {post.location}
              </div>
              <div>
                <LabelIcon /> <strong>Danh mục:</strong> {post.category}
              </div>
              <div>
                <PersonIcon /> <strong>Người đăng:</strong> {post.author}
              </div>
              <div>
                <TimeIcon /> <strong>Thời gian:</strong> {getTimeAgo(post.createdAt || post.id)}
              </div>
              {post.contact && (
                <div>
                  <PhoneIcon /> <strong>Liên hệ:</strong> {post.contact}
                </div>
              )}
            </div>

            <div className="detail-tags">
              <strong>Tags:</strong>
              <span className="tag">#{post.category}</span>
              <span className="tag">#{post.author.split(" ")[0]}</span>
            </div>
          </div>
        </div>

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
