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
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());

  // ✅ Load notifications from backend API
  const loadNotifications = async (silent = false) => {
    try {
      // Only show loading indicator on initial load, not during polling
      if (!silent) {
        setLoading(true);
      }
      const response = await realApi.getNotifications();

      if (response.success && response.data) {
        const backendNotifications = response.data;

        // Map backend format to frontend format
        const mappedNotifications = backendNotifications.map(notif => {
          // ✅ Extract postId and postType from link field
          // Link format: /posts/{type}/{id} or /matches/{id}
          let postId = notif.post_id;
          let postType = notif.post_type;

          // Parse link if postId/postType not available
          if (notif.link && !postId) {
            const linkMatch = notif.link.match(/\/posts\/(lost|found)\/(\d+)/);
            if (linkMatch) {
              postType = linkMatch[1]; // 'lost' or 'found'
              postId = parseInt(linkMatch[2]);
            }
          }

          // ✅ For post_approved notifications, use the type field
          if (notif.type === 'post_approved') {
            postType = 'post_approved';
          }

          return {
            id: notif.notification_id,
            title: notif.title,
            message: notif.message,
            type: notif.type,
            read: notif.is_read,
            time: notif.created_at,
            createdAt: notif.created_at,
            postId: postId,
            postType: postType,
            // Keep other fields if they exist
            similarity: notif.similarity,
            matchedPost: notif.matched_post
          };
        });

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
      if (!silent) {
        setLoading(false);
      }
    }
  };

  // ✅ Load notifications when component mounts
  useEffect(() => {
    loadNotifications(); // Initial load with loading indicator

    // ✅ Polling to reload realtime (every 5 seconds) - silent updates
    const interval = setInterval(() => {
      loadNotifications(true); // Silent polling - no loading indicator
    }, 5000);

    // ✅ Listen for custom events (if needed for immediate updates)
    const handleNotificationAdded = () => {
      loadNotifications(true); // Silent update
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
        // Reload notifications silently to get updated state
        await loadNotifications(true);
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
        // Reload notifications silently to get updated state
        await loadNotifications(true);
      } else {
        console.error("❌ Failed to mark all as read:", response.error);
      }
    } catch (error) {
      console.error("❌ Error marking all notifications as read:", error);
    }
  };

  // ✅ Toggle selection mode
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedNotifications(new Set()); // Clear selections when toggling
  };

  // ✅ Toggle single notification selection
  const toggleNotificationSelection = (notificationId) => {
    setSelectedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId);
      } else {
        newSet.add(notificationId);
      }
      return newSet;
    });
  };

  // ✅ Select all notifications
  const selectAll = () => {
    setSelectedNotifications(new Set(notifications.map(n => n.id)));
  };

  // ✅ Clear all selections
  const clearAll = () => {
    setSelectedNotifications(new Set());
  };

  // ✅ Bulk delete selected notifications
  const handleBulkDelete = async () => {
    const count = selectedNotifications.size;
    if (!window.confirm(`Bạn có chắc muốn xóa ${count} thông báo đã chọn?`)) return;

    try {
      // Delete all selected notifications in parallel
      const deletePromises = Array.from(selectedNotifications).map(notificationId =>
        realApi.deleteNotification(notificationId)
      );

      await Promise.all(deletePromises);

      // Reload notifications silently
      await loadNotifications(true);
      setSelectedNotifications(new Set());
      setIsSelectionMode(false);

      console.log(`✅ Deleted ${count} notifications`);
    } catch (err) {
      console.error('❌ Error deleting notifications:', err);
      alert('Lỗi: ' + err.message);
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
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {notifications.length > 0 && (
                <button
                  onClick={toggleSelectionMode}
                  className={`selection-toggle-btn ${isSelectionMode ? 'cancel' : ''}`}
                  style={{ fontSize: '13px', padding: '6px 12px' }}
                >
                  {isSelectionMode ? 'Hủy' : 'Chọn nhiều'}
                </button>
              )}
              {!isSelectionMode && unreadCount > 0 && (
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
          </div>

          {/* Bulk Action Bar */}
          {isSelectionMode && selectedNotifications.size > 0 && (
            <div className="bulk-action-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontWeight: '600', color: '#1E293B' }}>
                  {selectedNotifications.size} mục đã chọn
                </span>
                <button
                  onClick={selectedNotifications.size === notifications.length ? clearAll : selectAll}
                  className="btn-select-toggle"
                >
                  {selectedNotifications.size === notifications.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </button>
              </div>
              <button onClick={handleBulkDelete} className="btn-bulk-delete">
                Xóa đã chọn
              </button>
            </div>
          )}

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
              notifications.map(notification => {
                const isSelected = selectedNotifications.has(notification.id);

                return (
                  <div
                    key={notification.id}
                    className={`notification-item ${!notification.read ? 'unread' : ''} ${notification.postId ? 'clickable' : ''} ${isSelectionMode ? 'selectable' : ''} ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      if (isSelectionMode) {
                        toggleNotificationSelection(notification.id);
                      } else {
                        handleMarkAsRead(notification.id);
                        // ✅ If has postId, navigate to post
                        if (notification.postId && onNotificationClick) {
                          onNotificationClick(notification.postId, notification.postType);
                          setShowDropdown(false);
                        }
                      }
                    }}
                  >
                    {/* Checkbox in selection mode */}
                    {isSelectionMode && (
                      <input
                        type="checkbox"
                        className="notification-checkbox"
                        checked={isSelected}
                        onChange={() => toggleNotificationSelection(notification.id)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ marginRight: '12px', cursor: 'pointer' }}
                      />
                    )}
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
                );
              })
            )}
          </div>
        </div>
      )}
    </>
  );
}
