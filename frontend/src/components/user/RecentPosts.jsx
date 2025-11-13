import React from "react";
import "./RecentPosts.css";
import { LocationOn as LocationIcon, AccessTime as TimeIcon, Phone as PhoneIcon, Person as PersonIcon } from "@mui/icons-material";

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

const RecentPosts = ({ title, posts = [], onOpenDetail, onContact }) => {
  if (!posts.length) return null;
  return (
    <section className="recent-section">
      <div className="recent-header">
        <h2 className="recent-title">{title}</h2>
        <button className="recent-view-all">Xem tất cả</button>
      </div>
      <div className="recent-list">
        {posts.map((post) => {
          const cardClass = post.type === "found" ? "found-post-card" : "lost-post-card";
          const badgeClass = post.type === "found" ? "found" : "lost";
          return (
            <div key={post.id} id={`post-${post.id}`} className={cardClass}>
              <div className="post-image">
                {post.image ? (
                  <img src={post.image} alt={post.title} />
                ) : (
                  <div className="no-image-placeholder">Không có hình ảnh</div>
                )}
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
                    {formatTime(post.createdAt || post.id)}
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
                  <button className="btn-contact" onClick={() => onContact?.(post.author)}>
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
    </section>
  );
};

export default RecentPosts;


