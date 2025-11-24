import React from "react";
import "./ChatContextBox.css";
import { Visibility as ViewIcon } from "@mui/icons-material";

const ChatContextBox = ({ post, onViewPost, onBoxClick }) => {
  if (!post) return null;

  // Xác định loại bài đăng để áp dụng màu sắc phù hợp
  const postType = post.type === "found" ? "found" : "lost";

  // Xử lý click vào toàn bộ box (trừ button)
  const handleBoxClick = (e) => {
    // Chỉ xử lý nếu không click vào button
    if (!e.target.closest('.context-box-button') && onBoxClick) {
      onBoxClick(post.id, post.type);
    }
  };

  return (
    <div 
      className={`chat-context-box chat-context-box-${postType}`}
      onClick={handleBoxClick}
      style={{ cursor: 'pointer' }}
    >
      <div className="context-box-content">
        <div className="context-box-image">
          <img src={post.image || "/img/default-post.jpg"} alt={post.title} />
        </div>
        <div className="context-box-info">
          <p className="context-box-label">Bạn đang hỏi về món đồ này!</p>
          <h4 className="context-box-title">{post.title}</h4>
          <div className="context-box-badge">
            {post.type === "found" ? "Nhặt được" : "Tìm đồ"}
          </div>
        </div>
        {onViewPost && (
          <button 
            className="context-box-button" 
            onClick={(e) => onViewPost(post.id, post.type, e)}
          >
            <ViewIcon style={{ fontSize: "16px", marginRight: "4px" }} />
            Xem lại bài đăng
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatContextBox;

