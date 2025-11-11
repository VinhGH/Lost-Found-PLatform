import React, { useState, useEffect } from "react";
import "./LostPage.css";
import {
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  SentimentVeryDissatisfied as SadIcon,
  AccessTime as TimeIcon,
} from "@mui/icons-material";
import PostDetailModal from "./PostDetailModal";
import RecentPosts from "./RecentPosts";
import FilterPanel from "./FilterPanel";
import { FilterList as FilterIcon } from "@mui/icons-material";

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

const LostPage = ({ setActiveTab, setChatTarget, posts, searchQuery = "", onViewPost }) => {
  const [selectedPost, setSelectedPost] = useState(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ building: "", category: "", date: "any" });
  
  // 🔹 Cập nhật thời gian mỗi phút để real-time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // Cập nhật mỗi 60 giây
    
    return () => clearInterval(interval);
  }, []);
  
  // 🔍 Filter posts dựa trên searchQuery + panel filters
  const lostPosts = posts.filter((p) => {
    if (p.type !== "lost") return false;
    
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
  
  const filteredByPanel = lostPosts.filter((p) => {
    const byLocation = !filters.building || (p.location || "").toLowerCase().includes(`tòa ${filters.building}`.toLowerCase());
    const byCategory = !filters.category || (p.category || "") === filters.category;
    const byDate = (() => {
      if (!filters.date || filters.date === "any") return true;
      const created = p.createdAt || p.id;
      const now = Date.now();
      const diffDays = (now - created) / (1000 * 60 * 60 * 24);
      if (filters.date === "1d") return diffDays <= 1;
      if (filters.date === "3d") return diffDays <= 3;
      if (filters.date === "7d") return diffDays <= 7;
      if (filters.date === "30d") return diffDays <= 30;
      return true;
    })();
    return byLocation && byCategory && byDate;
  });

  // 🔹 Tách danh sách "Gần đây" theo cửa sổ thời gian
  const nowTs = currentTime;
  const isRecent = (p) => nowTs - (p.createdAt || p.id) <= RECENT_WINDOW_MS;
  const recent = [...filteredByPanel]
    .filter(isRecent)
    .sort((a, b) => (b.createdAt || b.id) - (a.createdAt || a.id))
    .slice(0, 6);
  const olderList = filteredByPanel.filter((p) => !isRecent(p));

  console.log("🧭 LostPage nhận được:", posts);
  console.log("🔍 Search query:", searchQuery);
  console.log("✅ Bài lost hiển thị:", filteredByPanel);

  const handleContact = (authorName) => {
    setChatTarget(authorName);
    setActiveTab("chat");
  };

  const openDetail = (post) => {
    if (onViewPost) {
      onViewPost(post.id);
    }
    setSelectedPost(post);
  };

  return (
    <div className="lost-page">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "0 1rem 12px 1rem" }}>
        <h1 style={{ margin: 0 }}>
          <SadIcon style={{ fontSize: "22px", marginRight: "6px" }} />
          Đồ mất
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
        title="Đồ mất gần đây"
        posts={recent}
        onOpenDetail={(p) => openDetail(p)}
        onContact={(name) => handleContact(name)}
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

      <div className="lost-posts-grid">
        {olderList.map((post) => (
          <div key={post.id} id={`post-${post.id}`} className="lost-post-card">
            <div className="post-image">
              <img src={post.image} alt={post.title} />
              <div className="post-badge lost">Tìm đồ</div>
              {post.reward && <div className="reward-badge">{post.reward}</div>}
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
                  {getTimeAgo(post.createdAt || post.id)}
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
                  onClick={() => handleContact(post.author)}
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
        ))}
      </div>

      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          currentTab="Đồ mất"
          categoryPath={selectedPost.category}
          onNavigate={(path) => {
            if (path === 'Đồ mất') {
              setSelectedPost(null);
            }
          }}
        />
      )}
    </div>
  );
};

export default LostPage;
