import React, { useState, useMemo, useEffect, useRef } from "react";
import "./RecentPosts.css";
import { LocationOn as LocationIcon, AccessTime as TimeIcon, Phone as PhoneIcon, Person as PersonIcon, ChevronLeft, ChevronRight, Close as CloseIcon, TrendingUp } from "@mui/icons-material";
import ImageCarousel from "./ImageCarousel";

const formatTime = (timestamp) => {
  if (!timestamp) return "Vừa đăng";
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (minutes < 1) return "Vừa đăng";
  if (minutes < 60) return `${minutes} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days < 7) return `${days} ngày trước`;
  const d = new Date(timestamp);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const ITEMS_PER_VIEW = 4; // Hiển thị tối đa 4 thẻ mỗi lần (carousel)
const ITEMS_PER_PAGE = 16; // Hiển thị 16 items mỗi trang (4 hàng x 4 cột) trong modal "Xem tất cả"

const RecentPosts = ({ title, posts = [], onOpenDetail, onContact }) => {
  const [currentIndex, setCurrentIndex] = useState(0); // Carousel index cho khu vực "gần đây"
  const [showAllModal, setShowAllModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1); // Pagination cho modal "Xem tất cả"
  const containerRef = useRef(null);

  // Tính toán số nhóm (mỗi nhóm 4 items) cho carousel
  const totalGroups = useMemo(() => {
    return Math.ceil(posts.length / ITEMS_PER_VIEW);
  }, [posts.length]);

  // Pagination cho modal "Xem tất cả"
  const totalPages = useMemo(() => {
    return Math.ceil(posts.length / ITEMS_PER_PAGE);
  }, [posts.length]);

  const currentPageItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return posts.slice(startIndex, endIndex);
  }, [posts, currentPage]);

  // Reset về index 0 khi posts thay đổi
  useEffect(() => {
    setCurrentIndex(0);
  }, [posts.length]);

  // Reset về trang 1 khi mở modal
  useEffect(() => {
    if (showAllModal) {
      setCurrentPage(1);
    }
  }, [showAllModal]);

  // Lock body scroll khi modal mở
  useEffect(() => {
    if (showAllModal) {
      // Lưu giá trị overflow ban đầu
      const originalOverflow = document.body.style.overflow;
      const originalOverflowHtml = document.documentElement.style.overflow;
      
      // Khóa scroll của body
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      
      // Cleanup: khôi phục scroll khi đóng modal
      return () => {
        document.body.style.overflow = originalOverflow;
        document.documentElement.style.overflow = originalOverflowHtml;
      };
    }
  }, [showAllModal]);

  // Early return sau khi tất cả hooks đã được gọi
  if (!posts.length) return null;

  const handleViewAll = () => {
    setShowAllModal(true);
  };

  const handleCloseModal = () => {
    setShowAllModal(false);
    setCurrentPage(1);
  };

  // Handlers cho carousel khu vực "gần đây"
  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(totalGroups - 1, prev + 1));
  };

  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < totalGroups - 1;

  // Tính toán transform: mỗi lần slide sẽ di chuyển 100% viewport width (4 items)
  const translateX = currentIndex * 100;

  // Handlers cho pagination modal "Xem tất cả"
  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const handlePageClick = (page) => {
    setCurrentPage(page);
  };

  // Tạo danh sách số trang để hiển thị (giống ảnh) - dùng chung cho cả 2 pagination
  const getPageNumbers = (totalPages, currentPage) => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <>
      <section className="recent-section">
        <div className="recent-header">
          <h2 className="recent-title">{title}</h2>
          <button className="recent-view-all" onClick={handleViewAll}>Xem tất cả</button>
        </div>
      
        {/* Carousel cho khu vực "gần đây" */}
        <div className="recent-carousel-wrapper">
          {/* Mũi tên trái */}
          {canGoPrevious && (
            <button
              className="carousel-arrow carousel-arrow-left"
              onClick={handlePrevious}
              aria-label="Trang trước"
            >
              <ChevronLeft />
            </button>
          )}

          {/* Container chứa các thẻ */}
          <div className="recent-list-container" ref={containerRef}>
            <div 
              className="recent-list"
              style={{
                transform: `translateX(-${translateX}%)`,
                transition: 'transform 0.3s ease-in-out'
              }}
            >
              {posts.map((post) => {
                const cardClass = post.type === "found" ? "found-post-card" : "lost-post-card";
                const badgeClass = post.type === "found" ? "found" : "lost";
                // Lấy danh sách ảnh: ưu tiên post.images, fallback về post.image
                const postImages = post.images && Array.isArray(post.images) && post.images.length > 0
                  ? post.images
                  : (post.image ? [post.image] : []);
                
                return (
                  <div key={post.id} id={`post-${post.id}`} className={`${cardClass} recent-card-item`}>
                    <div className="post-image-wrapper">
                      <ImageCarousel images={postImages} postId={post.id} />
                      <div className={`post-badge ${badgeClass}`}>{post.type === "found" ? "Nhặt được" : "Tìm đồ"}</div>
                    </div>
                    <div className="post-content">
                      <h3 className="post-title">{post.title}</h3>
                      <div className="post-meta">
                        <div>
                          <LocationIcon style={{ fontSize: 14, marginRight: 4 }} />
                          {post.location}
                        </div>
                        <div>
                          <TimeIcon style={{ fontSize: 14, marginRight: 4 }} />
                          {formatTime(post.displayTime || post.approvedAt || post.createdAt || post.id)}
                        </div>
                        <div>
                          <PersonIcon style={{ fontSize: 14, marginRight: 4 }} />
                          {post.author}
                        </div>
                        {post.contact && (
                          <div>
                            <PhoneIcon style={{ fontSize: 14, marginRight: 4 }} />
                            {post.contact}
                          </div>
                        )}
                      </div>
                      <div className="post-actions">
                        <button className="btn-contact" onClick={() => onContact?.(post)}>
                          <PhoneIcon style={{ fontSize: 14, marginRight: 4 }} />
                          Liên hệ ngay
                        </button>
                        <button className="btn-detail" onClick={() => onOpenDetail?.(post)}>
                          Xem chi tiết
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mũi tên phải */}
          {canGoNext && (
            <button
              className="carousel-arrow carousel-arrow-right"
              onClick={handleNext}
              aria-label="Trang sau"
            >
              <ChevronRight />
            </button>
          )}
        </div>
      </section>

    {/* Modal "Xem tất cả" */}
    {showAllModal && (
      <div className="view-all-modal-overlay" onClick={handleCloseModal}>
        <div className="view-all-modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="view-all-modal-header">
            <h2 className="view-all-modal-title">{title}</h2>
            <button className="view-all-modal-close" onClick={handleCloseModal}>
              <CloseIcon />
            </button>
          </div>

          {/* Thông tin số lượng kết quả */}
          <div className="view-all-results-info">
            <div className="results-count">
              Hiển thị <span className="results-number">{currentPageItems.length}</span> trong tổng số <span className="results-number">{posts.length}</span> kết quả
            </div>
            <div className="results-update-status">
              <TrendingUp style={{ fontSize: 16, marginRight: 4 }} />
              <span>Cập nhật liên tục</span>
            </div>
          </div>

          <div className="view-all-grid">
            {currentPageItems.map((post) => {
              const cardClass = post.type === "found" ? "found-post-card" : "lost-post-card";
              const badgeClass = post.type === "found" ? "found" : "lost";
              // Lấy danh sách ảnh: ưu tiên post.images, fallback về post.image
              const postImages = post.images && Array.isArray(post.images) && post.images.length > 0
                ? post.images
                : (post.image ? [post.image] : []);
              
              return (
                <div key={post.id} className={cardClass}>
                  <div className="post-image-wrapper">
                    <ImageCarousel images={postImages} postId={post.id} />
                    <div className={`post-badge ${badgeClass}`}>{post.type === "found" ? "Nhặt được" : "Tìm đồ"}</div>
                  </div>
                  <div className="post-content">
                    <h3 className="post-title">{post.title}</h3>
                    <div className="post-meta">
                      <div>
                        <LocationIcon style={{ fontSize: 14, marginRight: 4 }} />
                        {post.location}
                      </div>
                      <div>
                        <TimeIcon style={{ fontSize: 14, marginRight: 4 }} />
                        {formatTime(post.displayTime || post.approvedAt || post.createdAt || post.id)}
                      </div>
                      <div>
                        <PersonIcon style={{ fontSize: 14, marginRight: 4 }} />
                        {post.author}
                      </div>
                      {post.contact && (
                        <div>
                          <PhoneIcon style={{ fontSize: 14, marginRight: 4 }} />
                          {post.contact}
                        </div>
                      )}
                    </div>
                    <div className="post-actions">
                      <button className="btn-contact" onClick={() => onContact?.(post)}>
                        <PhoneIcon style={{ fontSize: 14, marginRight: 4 }} />
                        Liên hệ ngay
                      </button>
                      <button className="btn-detail" onClick={() => onOpenDetail?.(post)}>
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination - luôn hiển thị dù chỉ có 1 trang */}
          <div className="view-all-pagination">
            <button
              className="pagination-btn pagination-arrow"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              aria-label="Trang trước"
            >
              <ChevronLeft />
            </button>
            
            <div className="pagination-numbers">
              {getPageNumbers(totalPages, currentPage).map((page, index) => {
                if (page === 'ellipsis') {
                  return (
                    <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                      ...
                    </span>
                  );
                }
                return (
                  <button
                    key={page}
                    className={`pagination-btn pagination-number ${currentPage === page ? 'active' : ''}`}
                    onClick={() => handlePageClick(page)}
                    aria-label={`Trang ${page}`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            
            <button
              className="pagination-btn pagination-arrow"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              aria-label="Trang sau"
            >
              <ChevronRight />
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default RecentPosts;


