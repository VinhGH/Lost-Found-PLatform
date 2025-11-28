import React, { useState, useEffect } from "react";
import { Notifications as NotificationsIcon } from "@mui/icons-material";
import { AutoAwesome as AIIcon } from "@mui/icons-material";
import realApi from "../../services/realApi";
import "./NotificationsButton.css";

export default function NotificationsButton({ onNotificationClick }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ Load notifications from backend API
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await realApi.getNotifications();

      if (response.success && response.data) {
        const backendNotifications = response.data;

        // Map backend format to frontend format
        const mappedNotifications = backendNotifications.map(notif => ({
          id: notif.notification_id,
          title: notif.title,
          message: notif.message,
          type: notif.type,
          read: notif.is_read,
          time: notif.created_at,
          createdAt: notif.created_at,
          postId: notif.post_id,
          postType: notif.post_type,
          // Keep other fields if they exist
          similarity: notif.similarity,
          matchedPost: notif.matched_post
        }));

        setNotifications(mappedNotifications);
        setUnreadCount(mappedNotifications.filter(n => !n.read).length);
      } else {
        console.error("❌ Failed to load notifications:", response.error);
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("❌ Error loading notifications:", error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Load notifications when component mounts
  useEffect(() => {
    loadNotifications();

    // ✅ Polling to reload realtime (every 5 seconds)
    const interval = setInterval(() => {
      loadNotifications();
    }, 5000);

    // ✅ Listen for custom events (if needed for immediate updates)
    const handleNotificationAdded = () => {
      loadNotifications();
    };

    window.addEventListener('notificationAdded', handleNotificationAdded);

    return () => {
      clearInterval(interval);
      window.removeEventListener('notificationAdded', handleNotificationAdded);
    };
  }, []);

  // ✅ Mark notification as read via API
  const handleMarkAsRead = async (notificationId) => {
    try {
      const response = await realApi.markNotificationAsRead(notificationId);

      if (response.success) {
        // Reload notifications to get updated state
        await loadNotifications();
      } else {
        console.error("❌ Failed to mark as read:", response.error);
      }
    } catch (error) {
      console.error("❌ Error marking notification as read:", error);
    }
  };

  // ✅ Mark all notifications as read via API
  const handleMarkAllAsRead = async () => {
    try {
      const response = await realApi.markAllNotificationsAsRead();

      if (response.success) {
        // Reload notifications to get updated state
        await loadNotifications();
      } else {
        console.error("❌ Failed to mark all as read:", response.error);
      }
    } catch (error) {
      console.error("❌ Error marking all notifications as read:", error);
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
            {loading ? (
              <div className="no-notifications">
                <p>Đang tải...</p>
              </div>
            ) : notifications.length === 0 ? (
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
                    // ✅ If has postId, navigate to post
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
