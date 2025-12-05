import React, { useState, useEffect, useMemo } from "react";
import "./FoundPage.css";
import {
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  CheckCircle as FoundIcon,
  AccessTime as TimeIcon,
} from "@mui/icons-material";
import PostDetailModal from "./PostDetailModal";
import RecentPosts from "./RecentPosts";
import FilterPanel from "./FilterPanel";
import { FilterList as FilterIcon } from "@mui/icons-material";
import ImageCarousel from "./ImageCarousel";

const ITEMS_PER_PAGE = 16; // 4 hàng × 4 cột

// 🔹 Cấu hình khoảng thời gian hiển thị trong mục "Gần đây"
// Mặc định: 24 giờ (1 ngày). Có thể điều chỉnh theo yêu cầu.
const RECENT_WINDOW_MS = 24 * 60 * 60 * 1000;

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

const FoundPage = ({ setActiveTab, setChatTarget, posts, searchQuery = "", onViewPost }) => {
  const [selectedPost, setSelectedPost] = useState(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ building: "", category: "", date: "any" });
  const [currentPage, setCurrentPage] = useState(1); // Pagination cho olderList

  // 🔹 Cập nhật thời gian mỗi phút để real-time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // Cập nhật mỗi 60 giây

    return () => clearInterval(interval);
  }, []);

  // 🔍 Filter posts dựa trên searchQuery và bộ lọc - chỉ hiển thị bài đã duyệt
  const foundPosts = posts.filter((p) => {
    if (p.type !== "found") return false;
    if (p.status !== "active") return false; // ✅ Chỉ hiển thị bài đã duyệt

    // Nếu không có searchQuery, hiển thị tất cả
    if (!searchQuery || searchQuery.trim() === "") return true;

    // Tìm kiếm trong title, description, location, author, category
    const keyword = searchQuery.toLowerCase().trim();
    const searchableText = [
      p.title || "",
      p.description || "",
      p.location || "",
      p.author || "",
      p.category || ""
    ].join(" ").toLowerCase();

    return searchableText.includes(keyword);
  });

  // áp dụng bộ lọc nâng cao
  const filteredByPanel = foundPosts.filter((p) => {
    const byLocation = !filters.building || (p.location || "").toLowerCase().includes(`tòa ${filters.building}`.toLowerCase());
    const byCategory = !filters.category || (p.category || "") === filters.category;
    const byDate = (() => {
      if (!filters.date || filters.date === "any") return true;
      // ✅ Dùng displayTime để filter theo ngày (nếu đã approve thì dùng approved_at)
      const timeToCheck = p.displayTime || p.approvedAt || p.createdAt || p.id;
      const now = Date.now();
      const diffDays = (now - timeToCheck) / (1000 * 60 * 60 * 24);
      if (filters.date === "1d") return diffDays <= 1;
      if (filters.date === "3d") return diffDays <= 3;
      if (filters.date === "7d") return diffDays <= 7;
      if (filters.date === "30d") return diffDays <= 30;
      return true;
    })();
    return byLocation && byCategory && byDate;
  });

  // danh sách gần đây (mới nhất) theo cửa sổ thời gian
  // ✅ Dùng displayTime để xác định bài đăng gần đây (nếu đã approve thì dùng approved_at)
  const nowTs = currentTime;
  const isRecent = (p) => {
    const timeToCheck = p.displayTime || p.approvedAt || p.createdAt || p.id;
    return nowTs - timeToCheck <= RECENT_WINDOW_MS;
  };
  const recent = [...filteredByPanel]
    .filter(isRecent)
    .sort((a, b) => {
      const aTime = b.displayTime || b.approvedAt || b.createdAt || b.id;
      const bTime = a.displayTime || a.approvedAt || a.createdAt || a.id;
      return aTime - bTime;
    });
  const olderList = filteredByPanel.filter((p) => !isRecent(p));

  // Pagination cho olderList (các thẻ quá 24 giờ)
  const totalPages = useMemo(() => {
    return Math.ceil(olderList.length / ITEMS_PER_PAGE);
  }, [olderList.length]);

  const currentPageItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return olderList.slice(startIndex, endIndex);
  }, [olderList, currentPage]);

  // Reset về trang 1 khi olderList thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [olderList.length]);

  // Tạo danh sách số trang để hiển thị
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

  const handlePageClick = (page) => {
    setCurrentPage(page);
  };

  console.log("🧭 FoundPage nhận được:", posts);
  console.log("🔍 Search query:", searchQuery);
  console.log("✅ Bài found hiển thị:", filteredByPanel);

  const handleContact = (post) => {
    // ✅ Truyền đầy đủ thông tin để ChatPage tạo conversation theo bài đăng
    setChatTarget({
      userName: post.author,
      postId: post.id,
      postType: post.type, // 'lost' or 'found'
      postAuthorId: post.accountId // account_id của người đăng bài
    });
    setActiveTab("chat");
  };

  const openDetail = (post) => {
    if (onViewPost) {
      onViewPost(post.id);
    }
    setSelectedPost(post);
  };

  return (
    <div className="found-page">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "0 1rem 12px 1rem" }}>
        <h1 className="page-title" style={{ margin: 0 }}>
          <FoundIcon style={{ fontSize: "22px", marginRight: "6px" }} />
          Đồ nhặt được
        </h1>
        <button className="recent-view-all" onClick={() => setShowFilters((s) => !s)} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <FilterIcon style={{ fontSize: 18 }} /> Bộ lọc
        </button>
      </div>

      <FilterPanel
        open={showFilters}
        onClose={() => setShowFilters(false)}
        initial={filters}
        onApply={(f) => setFilters(f)}
      />

      <RecentPosts
        title="Đồ nhặt được gần đây"
        posts={recent}
        onOpenDetail={(p) => openDetail(p)}
        onContact={(post) => handleContact(post)}
      />

      {searchQuery && filteredByPanel.length === 0 && (
        <div style={{
          textAlign: "center",
          padding: "40px 20px",
          color: "#666"
        }}>
          <p>Không tìm thấy kết quả cho từ khóa "<strong>{searchQuery}</strong>"</p>
        </div>
      )}

      <div className="found-posts-grid">
        {currentPageItems.map((post) => {
          // Lấy danh sách ảnh: ưu tiên post.images, fallback về post.image
          const postImages = post.images && Array.isArray(post.images) && post.images.length > 0
            ? post.images
            : (post.image ? [post.image] : []);

          return (
            <div key={post.id} id={`post-${post.id}`} className="found-post-card">
              <div className="post-image-wrapper">
                <ImageCarousel images={postImages} postId={post.id} />
                <div className="post-badge found">Nhặt được</div>
              </div>

              <div className="post-content">
                <h3 className="post-title">{post.title}</h3>
                <p className="post-description">{post.description}</p>
                <div className="post-meta">
                  <div>
                    <LocationIcon
                      style={{ fontSize: "14px", marginRight: "4px" }}
                    />
                    {post.location}
                  </div>
                  <div>
                    <PersonIcon
                      style={{ fontSize: "14px", marginRight: "4px" }}
                    />
                    {post.author}
                  </div>
                  <div>
                    <TimeIcon
                      style={{ fontSize: "14px", marginRight: "4px" }}
                    />
                    {getTimeAgo(post.displayTime || post.approvedAt || post.createdAt || post.id)}
                  </div>
                  {post.contact && (
                    <div>
                      <PhoneIcon
                        style={{ fontSize: "14px", marginRight: "4px" }}
                      />
                      {post.contact}
                    </div>
                  )}
                </div>

                <div className="post-actions">
                  <button
                    className="btn-contact"
                    onClick={() => handleContact(post)}
                  >
                    <PhoneIcon style={{ fontSize: "14px", marginRight: "4px" }} />
                    Liên hệ ngay
                  </button>
                  <button
                    className="btn-detail"
                    onClick={() => openDetail(post)}
                  >
                    Xem chi tiết
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination cho olderList - luôn hiển thị dù chỉ có 1 trang */}
      {olderList.length > 0 && (
        <div className="older-posts-pagination">
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
        </div>
      )}

      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          currentTab="Đồ nhặt được"
          categoryPath={selectedPost.category}
          onNavigate={(path) => {
            if (path === 'Đồ nhặt được') {
              setSelectedPost(null);
            }
          }}
          onContact={handleContact}
        />
      )}
    </div>
  );
};

export default FoundPage;
