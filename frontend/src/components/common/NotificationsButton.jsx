import React, { useState, useEffect } from "react";
import { Notifications as NotificationsIcon } from "@mui/icons-material";
import { AutoAwesome as AIIcon } from "@mui/icons-material";
import "./NotificationsButton.css";

export default function NotificationsButton({ onNotificationClick }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  // ✅ Load notifications từ localStorage và filter thông báo quá 3 ngày
  const loadNotifications = () => {
    try {
      const saved = localStorage.getItem("notifications");
      if (saved) {
        const allNotifications = JSON.parse(saved);
        const now = Date.now();
        const threeDaysInMs = 3 * 24 * 60 * 60 * 1000; // 3 ngày tính bằng milliseconds
        
        // ✅ Filter thông báo quá 3 ngày và xóa khỏi localStorage
        const validNotifications = allNotifications.filter(notif => {
          const createdAt = notif.createdAt || new Date(notif.time).getTime();
          const age = now - createdAt;
          return age <= threeDaysInMs; // Chỉ giữ thông báo <= 3 ngày
        });
        
        // ✅ Cập nhật localStorage nếu có thông báo bị xóa
        if (validNotifications.length !== allNotifications.length) {
          localStorage.setItem("notifications", JSON.stringify(validNotifications));
        }
        
        // Lấy thông báo của user hiện tại (có thể filter theo userId nếu cần)
        setNotifications(validNotifications);
        setUnreadCount(validNotifications.filter(n => !n.read).length);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("❌ Lỗi khi load notifications:", error);
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  // ✅ Load notifications khi component mount
  useEffect(() => {
    loadNotifications();

    // ✅ Lắng nghe event khi có thông báo mới
    const handleNotificationAdded = (event) => {
      loadNotifications();
      // ✅ Nếu có detail (thông báo từ admin duyệt bài), trigger showToast event
      if (event.detail && event.detail.type === 'success') {
        window.dispatchEvent(new CustomEvent('showToast', { detail: event.detail }));
      }
    };

    // ✅ Polling để reload realtime (mỗi 2 giây)
    const interval = setInterval(() => {
      loadNotifications();
    }, 2000);

    window.addEventListener('notificationAdded', handleNotificationAdded);
    window.addEventListener('storage', handleNotificationAdded);

    return () => {
      clearInterval(interval);
      window.removeEventListener('notificationAdded', handleNotificationAdded);
      window.removeEventListener('storage', handleNotificationAdded);
    };
  }, []);

  // ✅ Đánh dấu đã đọc
  const handleMarkAsRead = (notificationId) => {
    try {
      const saved = localStorage.getItem("notifications");
      if (saved) {
        const allNotifications = JSON.parse(saved);
        const updated = allNotifications.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        );
        localStorage.setItem("notifications", JSON.stringify(updated));
        loadNotifications();
      }
    } catch (error) {
      console.error("❌ Lỗi khi đánh dấu đã đọc:", error);
    }
  };

  // ✅ Đánh dấu tất cả đã đọc
  const handleMarkAllAsRead = () => {
    try {
      const saved = localStorage.getItem("notifications");
      if (saved) {
        const allNotifications = JSON.parse(saved);
        const updated = allNotifications.map(n => ({ ...n, read: true }));
        localStorage.setItem("notifications", JSON.stringify(updated));
        loadNotifications();
      }
    } catch (error) {
      console.error("❌ Lỗi khi đánh dấu tất cả đã đọc:", error);
    }
  };

  return (
    <>
      <button
        aria-label="Thông báo"
        title="Thông báo"
        className="notifications-btn"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <NotificationsIcon style={{ width: 22, height: 22 }} />
        {unreadCount > 0 && (
          <span className="notification-badge-count">{unreadCount}</span>
        )}
      </button>

      {showDropdown && (
        <div className="notifications-dropdown">
          <div className="dropdown-header">
            <h4>Thông báo</h4>
            {unreadCount > 0 && (
              <button 
                className="mark-all-read-btn"
                onClick={handleMarkAllAsRead}
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
            <button 
              className="close-dropdown-btn"
              onClick={() => setShowDropdown(false)}
            >
              ×
            </button>
          </div>
          
          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                <p>Không có thông báo nào</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`notification-item ${!notification.read ? 'unread' : ''} ${notification.postId ? 'clickable' : ''}`}
                  onClick={() => {
                    handleMarkAsRead(notification.id);
                    // ✅ Nếu có postId, navigate đến bài đăng
                    if (notification.postId && onNotificationClick) {
                      onNotificationClick(notification.postId, notification.postType);
                      setShowDropdown(false);
                    }
                  }}
                >
                  <div className="notification-content">
                    <div className="notification-header-row">
                      {notification.type === "ai_matching" && (
                        <AIIcon className="ai-icon" style={{ fontSize: "18px", marginRight: "6px", color: "#667eea" }} />
                      )}
                      <h5>{notification.title}</h5>
                      {notification.similarity && (
                        <span className="similarity-badge">
                          {Math.round(notification.similarity * 100)}%
                        </span>
                      )}
                    </div>
                    <p>{notification.message}</p>
                    {notification.type === "ai_matching" && notification.matchedPost && (
                      <div className="ai-match-preview">
                        <div className="match-post-info">
                          <span className="match-post-type">
                            {notification.matchedPost.type === "found" ? "🔵 Nhặt được" : "🔴 Tìm đồ"}
                          </span>
                          <span className="match-post-title">{notification.matchedPost.title}</span>
                        </div>
                        {notification.matchedPost.images && notification.matchedPost.images.length > 0 && (
                          <img 
                            src={notification.matchedPost.images[0]} 
                            alt="Preview"
                            className="match-post-image"
                          />
                        )}
                      </div>
                    )}
                    <span className="notification-time">
                      {notification.time ? new Date(notification.time).toLocaleString('vi-VN') : 'Vừa xong'}
                    </span>
                  </div>
                  {!notification.read && <div className="unread-dot"></div>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
