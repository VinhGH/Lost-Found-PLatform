import React, { useState, useEffect } from "react";
import "./PostDetailModal.css";
import Breadcrumb from "../common/Breadcrumb";
import {
  Close as CloseIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  ChevronLeft,
  ChevronRight,
} from "@mui/icons-material";
import realApiService from "../../services/realApi"; // ✅ Import default export
import { getTimeAgo } from "../../utils/timeUtils";



const PostDetailModal = ({ post, onClose, onNavigate, currentTab, categoryPath }) => {

  // Default props for backward compatibility
  const handleNavigate = onNavigate || (() => { });
  const tabName = currentTab || (post.type === "lost" ? "Đồ mất" : "Đồ nhặt được");
  const category = categoryPath || post.category;
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [zoomedImageIndex, setZoomedImageIndex] = useState(0);

  // Lấy danh sách ảnh: ưu tiên post.images, fallback về post.image
  const postImages = post?.images && Array.isArray(post.images) && post.images.length > 0
    ? post.images
    : (post?.image ? [post.image] : []);

  // 🔹 Increment view count when modal opens
  useEffect(() => {
    if (post && post.id && post.type) {
      console.log(`📊 Incrementing view count for ${post.type} post ${post.id}`);
      realApiService.incrementPostView(post.id, post.type)
        .then(response => {
          if (response.success) {
            console.log(`✅ View count incremented: ${response.data?.views || 'N/A'}`);
          }
        })
        .catch(error => {
          console.error('❌ Failed to increment view count:', error);
        });
    }
  }, [post?.id, post?.type]); // Only run when post id or type changes

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

  // 🔹 Xử lý ESC key để đóng modal phóng to ảnh và mũi tên để chuyển ảnh
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isImageZoomed) return;

      if (e.key === "Escape") {
        setIsImageZoomed(false);
      } else if (e.key === "ArrowLeft" && postImages.length > 1) {
        e.preventDefault();
        setZoomedImageIndex((prev) => (prev - 1 + postImages.length) % postImages.length);
      } else if (e.key === "ArrowRight" && postImages.length > 1) {
        e.preventDefault();
        setZoomedImageIndex((prev) => (prev + 1) % postImages.length);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isImageZoomed, postImages.length]);

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
                  <TimeIcon /> <strong>Thời gian:</strong> {getTimeAgo(post.displayTime || post.approvedAt || post.createdAt || post.id, currentTime)}
                </div>
                {post.contact && (
                  <div>
                    <PhoneIcon /> <strong>Liên hệ:</strong> {post.contact}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Images Gallery */}
          {postImages.length > 0 && (
            <div className="detail-images-section">
              <div className="detail-images-grid">
                {postImages.map((img, index) => (
                  <div
                    key={index}
                    className="detail-image-item"
                    onClick={() => {
                      setZoomedImageIndex(index);
                      setIsImageZoomed(true);
                    }}
                  >
                    <img src={img} alt={`${post.title} - ${index + 1}`} />
                    <div className="image-zoom-hint">Click để phóng to</div>
                  </div>
                ))}
              </div>
              {postImages.length > 1 && (
                <div className="images-count-info">
                  Tổng cộng {postImages.length} ảnh
                </div>
              )}
            </div>
          )}

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
      {isImageZoomed && postImages.length > 0 && (
        <div className="image-zoom-overlay" onClick={() => setIsImageZoomed(false)}>
          <div className="image-zoom-container" onClick={(e) => e.stopPropagation()}>
            <button className="image-zoom-close" onClick={() => setIsImageZoomed(false)}>
              <CloseIcon style={{ fontSize: "24px" }} />
            </button>

            {/* Navigation buttons - chỉ hiển thị khi có nhiều hơn 1 ảnh */}
            {postImages.length > 1 && (
              <>
                <button
                  className="image-zoom-nav image-zoom-prev"
                  onClick={(e) => {
                    e.stopPropagation();
                    setZoomedImageIndex((prev) => (prev - 1 + postImages.length) % postImages.length);
                  }}
                >
                  <ChevronLeft style={{ fontSize: "32px" }} />
                </button>
                <button
                  className="image-zoom-nav image-zoom-next"
                  onClick={(e) => {
                    e.stopPropagation();
                    setZoomedImageIndex((prev) => (prev + 1) % postImages.length);
                  }}
                >
                  <ChevronRight style={{ fontSize: "32px" }} />
                </button>

                {/* Image counter */}
                <div className="image-zoom-counter">
                  {zoomedImageIndex + 1} / {postImages.length}
                </div>
              </>
            )}

            <img
              src={postImages[zoomedImageIndex]}
              alt={`${post.title} - ${zoomedImageIndex + 1}`}
              className="zoomed-image"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PostDetailModal;
