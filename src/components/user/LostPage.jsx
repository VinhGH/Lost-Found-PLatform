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

const LostPage = ({ setActiveTab, setChatTarget, posts, searchQuery = "" }) => {
  const [selectedPost, setSelectedPost] = useState(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  // 🔹 Cập nhật thời gian mỗi phút để real-time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // Cập nhật mỗi 60 giây
    
    return () => clearInterval(interval);
  }, []);
  
  // 🔍 Filter posts dựa trên searchQuery
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
  
  console.log("🧭 LostPage nhận được:", posts);
  console.log("🔍 Search query:", searchQuery);
  console.log("✅ Bài lost hiển thị:", lostPosts);

  const handleContact = (authorName) => {
    setChatTarget(authorName);
    setActiveTab("chat");
  };

  return (
    <div className="lost-page">
      <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
        <SadIcon style={{ fontSize: "22px", marginRight: "6px" }} />
        Đồ mất
      </h1>

      {searchQuery && lostPosts.length === 0 && (
        <div style={{ 
          textAlign: "center", 
          padding: "40px 20px",
          color: "#666"
        }}>
          <p>Không tìm thấy kết quả cho từ khóa "<strong>{searchQuery}</strong>"</p>
        </div>
      )}

      <div className="lost-posts-grid">
        {lostPosts.map((post) => (
          <div key={post.id} className="lost-post-card">
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
                  onClick={() => setSelectedPost(post)}
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
        />
      )}
    </div>
  );
};

export default LostPage;
