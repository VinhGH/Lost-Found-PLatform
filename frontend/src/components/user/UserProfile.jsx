import React, { useState, useEffect, useCallback } from "react";
import "./UserProfile.css";
import EditPostModal from "./EditPostModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import ConfirmLogoutModal from "./ConfirmLogoutModal";
import ChangePasswordModal from "./ChangePasswordModal";
import ImageCarousel from "./ImageCarousel";
import userApi from "../../services/realApi"; // REAL API – Supabase

import {
  Article as ArticleIcon,
  Search as SearchIcon,
  CheckCircle as FoundIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  ExitToApp as LogoutIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  VpnKey as VpnKeyIcon,
} from "@mui/icons-material";

// 🔹 Đồng bộ cách hiển thị thời gian
const getTimeAgo = (timestamp) => {
  if (!timestamp) return "Vừa xong";

  // ✅ Convert timestamp to number if it's a string
  let ts = timestamp;
  if (typeof ts === "string") {
    // Try parsing as ISO string first (handles UTC strings like "2025-11-16T14:23:06.238Z")
    const parsed = Date.parse(ts);
    if (!isNaN(parsed)) {
      ts = parsed;
    } else {
      // Try as number string
      ts = parseInt(ts, 10);
      if (isNaN(ts)) {
        console.warn("⚠️ Invalid timestamp:", timestamp);
        return "Vừa xong";
      }
    }
  }

  // ✅ Ensure timestamp is in milliseconds (not seconds)
  // If timestamp is less than 1e12, it's likely in seconds, convert to milliseconds
  if (ts < 1e12) {
    ts = ts * 1000;
  }

  // ✅ Date.now() returns milliseconds in local time
  // Timestamp từ backend đã là milliseconds (từ new Date(UTC_string).getTime())
  // JavaScript Date.getTime() tự động convert UTC string sang milliseconds (UTC-based)
  // Khi so sánh với Date.now(), cả hai đều là milliseconds, nên diff sẽ đúng
  const now = Date.now();
  const diff = now - ts;

  // ✅ If diff is negative, timestamp is in the future (likely wrong timezone or clock skew)
  if (diff < 0) {
    console.warn("⚠️ Timestamp is in the future:", {
      timestamp: ts,
      timestampDate: new Date(ts).toISOString(),
      timestampLocal: new Date(ts).toLocaleString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
      }),
      now: now,
      nowDate: new Date(now).toISOString(),
      nowLocal: new Date(now).toLocaleString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
      }),
      diff: diff,
      diffHours: (diff / (1000 * 60 * 60)).toFixed(2),
    });
    // ✅ Nếu timestamp trong tương lai nhưng chỉ chênh lệch < 1 giờ, có thể do timezone, return "Vừa xong"
    if (Math.abs(diff) < 3600000) {
      return "Vừa xong";
    }
    return "Vừa xong";
  }

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days < 7) return `${days} ngày trước`;
  return new Date(ts).toLocaleDateString("vi-VN");
};

const UserProfile = ({
  user,
  onLogout,
  posts,
  setPosts,
  defaultTab = "profile",
  onProfileUpdate,
  onNavigateToPost,
  onShowToast,
  viewUser = null, // Prop mới: user cần xem (nếu có)
}) => {
  // 🔹 Tab hiện tại
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem("userProfileActiveTab");
    return ["profile", "posts", "settings"].includes(saved)
      ? saved
      : defaultTab;
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [deletingPost, setDeletingPost] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  // Xác định user data cần hiển thị (viewUser hoặc user hiện tại)
  const displayUser = viewUser || user;
  const isOwnProfile = !viewUser || (user && viewUser.account_id === user.account_id);

  // 🔹 Khởi tạo profile - CHỈ dùng user data hiện tại, KHÔNG load cache cũ
  const [profileData, setProfileData] = useState(() => {
    // ✅ Luôn dùng userData từ prop, không dùng cache để tránh hiển thị data cũ
    const initialData = {
      name: displayUser?.name || displayUser?.user_name || "Người dùng",
      email: displayUser?.email,
      phone: displayUser?.phone || displayUser?.phone_number || "",
      address: displayUser?.address || "",
      avatar: displayUser?.avatar || null,
    };

    console.log(
      "👤 UserProfile init with:",
      initialData.name,
      initialData.email
    );

    return initialData;
  });

  // 🔹 Force update profileData khi displayUser thay đổi
  useEffect(() => {
    if (displayUser?.email) {
      console.log(
        "🔄 User/ViewUser changed, force updating profileData:",
        displayUser.email
      );
      setProfileData({
        name: displayUser?.name || displayUser?.user_name || "Người dùng",
        email: displayUser?.email,
        phone: displayUser?.phone || displayUser?.phone_number || "",
        address: displayUser?.address || "",
        avatar: displayUser?.avatar || null,
      });
    }
  }, [displayUser]);

  // 🔹 Load profile từ Supabase
  useEffect(() => {
    const load = async () => {
      // Nếu đang xem profile người khác, không load từ API (dùng data từ props)
      if (!isOwnProfile) return;

      if (!user?.email) return;

      // 🔹 QUAN TRỌNG: Clear tất cả profile cache cũ trước
      // Tránh trường hợp tài khoản cũ bị xóa nhưng cache vẫn còn
      const profileKey = `userProfile_${user.email}`;
      localStorage.removeItem(profileKey);
      console.log("🗑️ Cleared old profile cache for:", user.email);

      try {
        const response = await userApi.getProfile();
        if (response.success) {
          const u = response.data.user || response.data;
          const newProfileData = {
            name: u.user_name,
            email: u.email,
            phone: u.phone_number || "",
            address: u.address || "",
            avatar: u.avatar || null,
          };

          setProfileData(newProfileData);

          // ✅ Save cache mới ĐÚNG
          localStorage.setItem(profileKey, JSON.stringify(newProfileData));
          console.log("✅ Profile loaded from API:", u.user_name, u.email);
        }
      } catch (err) {
        console.error("Lỗi load profile:", err);
      }
    };
    load();
  }, [user?.email]);

  // 🔹 Bài đăng của user (load từ API)
  const [userPosts, setUserPosts] = useState([]);
  const [isLoadingMyPosts, setIsLoadingMyPosts] = useState(false);

  // Load "My Posts" từ API khi mở tab "posts"
  const loadMyPosts = useCallback(async () => {
    if (!user?.email) return;

    setIsLoadingMyPosts(true);
    try {
      const response = await userApi.getMyPosts();
      if (response.success && response.data) {
        const postsArray = Array.isArray(response.data) ? response.data : [];
        console.log("✅ Loaded my posts from API:", postsArray.length);
        console.log("📋 My posts status breakdown:", {
          total: postsArray.length,
          pending: postsArray.filter(
            (p) => (p.status || "").toLowerCase() === "pending"
          ).length,
          approved: postsArray.filter(
            (p) =>
              (p.status || "").toLowerCase() === "approved" ||
              (p.status || "").toLowerCase() === "active"
          ).length,
          rejected: postsArray.filter(
            (p) => (p.status || "").toLowerCase() === "rejected"
          ).length,
          resolved: postsArray.filter(
            (p) => (p.status || "").toLowerCase() === "resolved"
          ).length,
        });
        console.log(
          "📋 My posts details:",
          postsArray.map((p) => ({
            id: p.id,
            title: p.title,
            status: p.status,
            type: p.type,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
            approvedAt: p.approvedAt,
            displayTime: p.displayTime,
            displayTimeFormatted: p.displayTime
              ? new Date(p.displayTime).toLocaleString("vi-VN")
              : "N/A",
          }))
        );
        setUserPosts(postsArray);
      } else {
        console.error("❌ Failed to load my posts:", response.error);
        setUserPosts([]);
      }
    } catch (error) {
      console.error("❌ Error loading my posts:", error);
      setUserPosts([]);
    } finally {
      setIsLoadingMyPosts(false);
    }
  }, [user?.email]);

  useEffect(() => {
    if (activeTab === "posts") {
      loadMyPosts();
    }
  }, [activeTab, loadMyPosts]);

  // ✅ Reload "My Posts" khi có event postsUpdated (khi admin duyệt/xóa bài hoặc user tạo bài mới)
  useEffect(() => {
    const handlePostsUpdated = (event) => {
      const detail = event.detail || {};
      console.log("🔄 Posts updated event received in UserProfile:", detail);
      console.log("🔄 Reloading my posts...");

      // ✅ Xác định delay dựa trên action
      // Tăng delay cho delete để đảm bảo backend đã xóa xong
      let delay = 500; // Default delay
      if (detail.action === "delete") {
        delay = 800; // ✅ Tăng delay lên 800ms để đảm bảo backend đã xóa xong
        console.log(
          "🗑️ Post deleted by admin, waiting 800ms for backend to complete deletion..."
        );
      } else if (detail.action === "approve") {
        delay = 500; // Approve cần thời gian để backend update status
      } else if (detail.action === "create") {
        delay = 600; // ✅ Tăng delay cho create để đảm bảo backend đã lưu xong (từ 500ms -> 600ms)
        console.log(
          "📝 New post created, waiting 600ms for backend to save..."
        );
      } else if (detail.action === "profileUpdate") {
        // ✅ Khi profile được update, reload "My Posts" để hiển thị tên mới
        delay = 500; // Profile update delay bình thường
        console.log(
          "👤 Profile updated, reloading my posts to show new name..."
        );
      } else if (detail.action === "update") {
        // ✅ Khi post được update, reload "My Posts"
        delay = 200; // Update delay ngắn hơn
        console.log("✏️ Post updated, reloading my posts...");
      }

      console.log(
        `⏱️ Reloading my posts in ${delay}ms for action: ${detail.action}`
      );
      // ✅ Reload ngay cả khi tab chưa mở để khi user mở tab thì đã có data mới
      setTimeout(() => {
        console.log("🔄 Executing reload my posts now...");
        loadMyPosts();
      }, delay);
    };

    window.addEventListener("postsUpdated", handlePostsUpdated);
    return () => {
      window.removeEventListener("postsUpdated", handlePostsUpdated);
    };
  }, [loadMyPosts]); // ✅ Bỏ activeTab khỏi dependency để reload ngay cả khi tab chưa mở

  // 🔹 Lưu tab
  useEffect(() => {
    localStorage.setItem("userProfileActiveTab", activeTab);
  }, [activeTab]);

  // 🔹 Chỉnh sửa input
  const handleInputChange = (field) => (e) => {
    if (field === "email") return;
    setProfileData({ ...profileData, [field]: e.target.value });
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () =>
      setProfileData({ ...profileData, avatar: reader.result });
    reader.readAsDataURL(file);
  };

  // 🔹 Lưu profile
  const handleSave = async () => {
    try {
      const res = await userApi.updateProfile({
        user_name: profileData.name,
        phone_number: profileData.phone,
        address: profileData.address,
        avatar: profileData.avatar,
      });

      if (!res.success) {
        alert("Không thể cập nhật");
        return;
      }

      const updatedUser = res.data.user;

      // Lưu cache profile
      const profileKey = `userProfile_${updatedUser.email}`;
      localStorage.setItem(
        profileKey,
        JSON.stringify({
          name: updatedUser.user_name,
          email: updatedUser.email,
          phone: updatedUser.phone_number,
          address: updatedUser.address,
          avatar: updatedUser.avatar,
        })
      );

      // Cập nhật FE (App.js)
      onProfileUpdate?.(updatedUser);

      setIsEditing(false);
      alert("Cập nhật thành công!");

      // Reload bài đăng cho tên mới
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("postsUpdated", {
            detail: {
              action: "profileUpdate",
              userId: updatedUser.account_id || updatedUser.id,
            },
          })
        );
      }, 300);
    } catch (e) {
      alert("Lỗi khi lưu profile.");
      console.error(e);
    }
  };

  // 🔹 Update / Delete post
  const handleUpdatePost = async (updated) => {
    try {
      // ✅ Tìm post hiện tại để lấy status và type
      const currentPost = userPosts.find((p) => p.id === updated.id);
      if (!currentPost) {
        if (onShowToast) {
          onShowToast({
            type: "error",
            title: "Lỗi",
            message: "Không tìm thấy bài đăng",
          });
        }
        setEditingPost(null);
        return;
      }

      const postType = updated.type || currentPost.type;
      const currentStatus = currentPost.status || "pending";

      // ✅ Kiểm tra xem có ảnh mới không (base64 bắt đầu bằng "data:image/")
      // Nếu chỉ có URL ảnh cũ thì KHÔNG gửi images (để backend giữ nguyên ảnh cũ)
      let imagesToSend = undefined;
      if (updated.images && Array.isArray(updated.images) && updated.images.length > 0) {
        // Kiểm tra xem có ít nhất 1 ảnh mới (base64) không
        const hasNewImages = updated.images.some(img =>
          typeof img === 'string' && img.startsWith('data:image/')
        );

        if (hasNewImages) {
          // Chỉ gửi ảnh mới (base64), loại bỏ ảnh cũ (URL)
          imagesToSend = updated.images.filter(img =>
            typeof img === 'string' && img.startsWith('data:image/')
          );
        }
        // Nếu không có ảnh mới, imagesToSend = undefined → backend giữ nguyên ảnh cũ
      }

      // ✅ Format data cho backend (chỉ gửi các field backend cần)
      const updateData = {
        title: updated.title,
        description: updated.description,
        category: updated.category,
        location: updated.location,
        // ✅ CHỈ gửi images nếu có ảnh mới (base64)
        ...(imagesToSend !== undefined && { images: imagesToSend }),
        // ✅ KHÔNG gửi status - user không được thay đổi status khi update
      };

      console.log("✏️ Updating post:", {
        id: updated.id,
        type: postType,
        currentStatus: currentStatus,
        updateData: updateData,
      });

      // ✅ Gọi API update
      const response = await userApi.updatePost(
        updated.id,
        postType,
        updateData
      );

      if (response.success) {
        // ✅ Reload my posts từ API
        const reloadResponse = await userApi.getMyPosts();
        if (reloadResponse.success && reloadResponse.data) {
          setUserPosts(
            Array.isArray(reloadResponse.data) ? reloadResponse.data : []
          );
        }

        if (onShowToast) {
          onShowToast({
            type: "success",
            title: "Thành công",
            message: "Đã cập nhật bài đăng thành công",
          });
        }

        // ✅ Dispatch event với action 'update' và status hiện tại
        // Để các component khác (admin tabs, user tabs) reload
        setTimeout(() => {
          console.log("📢 Dispatching postsUpdated event for update action...");
          window.dispatchEvent(
            new CustomEvent("postsUpdated", {
              detail: {
                action: "update",
                postId: updated.id,
                type: postType,
                status: currentStatus, // ✅ Giữ nguyên status hiện tại
              },
            })
          );
        }, 200); // Đợi 200ms để backend commit transaction
      } else {
        if (onShowToast) {
          onShowToast({
            type: "error",
            title: "Lỗi",
            message: response.error || "Không thể cập nhật bài đăng",
          });
        }
      }
    } catch (error) {
      console.error("❌ Error updating post:", error);
      if (onShowToast) {
        onShowToast({
          type: "error",
          title: "Lỗi",
          message: "Không thể cập nhật bài đăng",
        });
      }
    }
    setEditingPost(null);
  };

  const handleDeletePost = async (id) => {
    // Call API to delete post
    try {
      // ✅ Tìm post để lấy type
      const postToDelete = userPosts.find((p) => p.id === id);
      if (!postToDelete) {
        if (onShowToast) {
          onShowToast({
            type: "error",
            title: "Lỗi",
            message: "Không tìm thấy bài đăng",
          });
        }
        setDeletingPost(null);
        return;
      }

      // ✅ Gọi API với type
      const response = await userApi.deletePost(id, postToDelete.type);
      if (response.success) {
        // Reload my posts from API after delete
        const reloadResponse = await userApi.getMyPosts();
        if (reloadResponse.success && reloadResponse.data) {
          setUserPosts(
            Array.isArray(reloadResponse.data) ? reloadResponse.data : []
          );
        }
        if (onShowToast) {
          onShowToast({
            type: "success",
            title: "Thành công",
            message: "Đã xóa bài đăng thành công",
          });
        }

        // ✅ Dispatch event với action 'delete' để các component khác reload
        setTimeout(() => {
          console.log(
            "📢 Dispatching postsUpdated event for delete action (user delete)..."
          );
          window.dispatchEvent(
            new CustomEvent("postsUpdated", {
              detail: {
                action: "delete",
                postId: id,
                type: postToDelete.type,
              },
            })
          );
        }, 200); // Đợi 200ms để backend commit transaction
      } else {
        if (onShowToast) {
          onShowToast({
            type: "error",
            title: "Lỗi",
            message: response.error || "Không thể xóa bài đăng",
          });
        }
      }
    } catch (error) {
      console.error("❌ Error deleting post:", error);
      if (onShowToast) {
        onShowToast({
          type: "error",
          title: "Lỗi",
          message: "Không thể xóa bài đăng",
        });
      }
    }
    setDeletingPost(null);
  };

  // ======================= TAB PROFILE =======================
  const renderProfileTab = () => (
    <div className="profile-tab">
      <div className="profile-header">
        <div className="avatar-section">
          <div className="avatar-container">
            <img
              src={profileData.avatar || "/img/default-avatar.png"}
              alt="Avatar"
              className="profile-avatar"
            />
            {isEditing && isOwnProfile && (
              <label className="avatar-upload">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                />
                <EditIcon style={{ fontSize: 14 }} />
              </label>
            )}
          </div>
          <h2 className="profile-name">{profileData.name}</h2>
          <p className="profile-email">{profileData.email}</p>
        </div>

        <div className="profile-actions">
          {isOwnProfile && (
            <>
              {isEditing ? (
                <div className="edit-actions">
                  <button
                    className="btn-cancel"
                    onClick={() => setIsEditing(false)}
                  >
                    Hủy
                  </button>
                  <button className="btn-save" onClick={handleSave}>
                    Lưu thay đổi
                  </button>
                </div>
              ) : (
                <button className="btn-edit" onClick={() => setIsEditing(true)}>
                  <EditIcon style={{ fontSize: 18, marginRight: 8 }} />
                  Chỉnh sửa hồ sơ
                </button>
              )}

              <button
                className="btn-change-password"
                onClick={() => setShowChangePasswordModal(true)}
              >
                <VpnKeyIcon style={{ fontSize: 18, marginRight: 8 }} />
                Đổi mật khẩu
              </button>
            </>
          )}
        </div>
      </div>

      <div className="profile-content">
        <div className="info-section">
          <h3 className="section-title">Thông tin cá nhân</h3>
          <div className="info-grid">
            {["name", "email", "phone", "address"].map((f) => (
              <div className="info-item" key={f}>
                <label className="info-label">
                  {
                    {
                      name: "Họ và tên",
                      email: "Email",
                      phone: "Số điện thoại",
                      address: "Địa chỉ",
                    }[f]
                  }
                </label>

                {isEditing && isOwnProfile ? (
                  <input
                    type={f === "email" ? "email" : "text"}
                    className="info-input"
                    value={profileData[f]}
                    onChange={handleInputChange(f)}
                    disabled={f === "email"}
                  />
                ) : (
                  <span className="info-value">{profileData[f]}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ======================= TAB SETTINGS =======================
  const renderSettingsTab = () => (
    <div className="settings-tab">
      <h3 className="section-title">Cài đặt</h3>

      <div className="settings-content">
        <div className="settings-item">
          <div className="settings-item-label">
            <span>Đổi mật khẩu</span>
            <span className="settings-item-description">
              Thay đổi mật khẩu tài khoản của bạn
            </span>
          </div>
          <button
            className="settings-action-btn"
            onClick={() => setShowChangePasswordModal(true)}
          >
            Đổi mật khẩu
          </button>
        </div>
      </div>
    </div>
  );

  // ======================= TAB POSTS =======================
  const renderPostsTab = () => {
    // Helper function to get status text
    const getStatusText = (status) => {
      if (!status) return "Không xác định";

      // ✅ Normalize status (handle cả PascalCase và lowercase)
      const normalizedStatus = String(status).trim();
      const lowerStatus = normalizedStatus.toLowerCase();

      // ✅ Map status từ backend sang text hiển thị
      if (lowerStatus === "pending") {
        return "Đang chờ duyệt";
      } else if (lowerStatus === "approved" || lowerStatus === "active") {
        return "Đang hoạt động";
      } else if (lowerStatus === "rejected") {
        return "Đã từ chối";
      } else if (lowerStatus === "resolved") {
        return "Đã giải quyết";
      } else if (lowerStatus === "inactive") {
        return "Đã ẩn";
      }

      // ✅ Fallback: nếu không match, trả về status gốc
      return normalizedStatus;
    };

    return (
      <div className="posts-tab">
        <div className="posts-header">
          <h3 className="section-title">Bài đăng của tôi</h3>
          <div className="posts-stats">{userPosts.length} bài đăng</div>
        </div>

        {isLoadingMyPosts ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p>Đang tải bài đăng...</p>
          </div>
        ) : (
          <div className="posts-list">
            {userPosts.length === 0 ? (
              <div
                style={{ textAlign: "center", padding: "40px", color: "#666" }}
              >
                <p>Bạn chưa có bài đăng nào</p>
              </div>
            ) : (
              userPosts.map((post) => {
                const imgs =
                  post.images?.length > 0
                    ? post.images
                    : post.image
                      ? [post.image]
                      : [];

                return (
                  <div key={post.id} className={`post-item post-type-${post.type}`}>
                    {/* Status badge ở góc trên phải của card */}
                    <div
                      className={`post-status ${post.status?.toLowerCase() || "pending"
                        }`}
                    >
                      {getStatusText(post.status)}
                    </div>

                    {imgs.length > 0 && (
                      <div className="post-item-image-wrapper">
                        <ImageCarousel images={imgs} postId={post.id} />
                      </div>
                    )}

                    <div className="post-info">
                      <div className="post-header">
                        <h4 className="post-title">{post.title}</h4>
                      </div>

                      <div className="post-meta">
                        <span className="post-type">
                          {post.type === "lost" ? (
                            <>
                              <SearchIcon style={{ fontSize: 14 }} /> Tìm đồ
                            </>
                          ) : (
                            <>
                              <FoundIcon style={{ fontSize: 14 }} /> Nhặt được
                            </>
                          )}
                        </span>

                        <span className="post-time">
                          <TimeIcon style={{ fontSize: 14 }} />
                          {(() => {
                            // ✅ Debug: Log timestamp values
                            const displayTime =
                              post.displayTime ||
                              post.approvedAt ||
                              post.createdAt ||
                              post.created_at ||
                              post.id;
                            const now = Date.now();
                            const diff = now - displayTime;
                            const result = getTimeAgo(displayTime);
                            // ✅ Log chi tiết để debug
                            const displayTimeDate = displayTime
                              ? new Date(displayTime)
                              : null;
                            const nowDate = new Date(now);
                            console.log(
                              `⏰ Post ${post.id} (${post.type}) - Time calculation:`
                            );
                            console.log(`  📅 displayTime: ${displayTime}`);
                            console.log(
                              `  📅 displayTime (UTC): ${displayTimeDate
                                ? displayTimeDate.toISOString()
                                : "N/A"
                              }`
                            );
                            console.log(
                              `  📅 displayTime (Local): ${displayTimeDate
                                ? displayTimeDate.toLocaleString("vi-VN", {
                                  timeZone: "Asia/Ho_Chi_Minh",
                                })
                                : "N/A"
                              }`
                            );
                            console.log(`  🕐 now: ${now}`);
                            console.log(
                              `  🕐 now (UTC): ${nowDate.toISOString()}`
                            );
                            console.log(
                              `  🕐 now (Local): ${nowDate.toLocaleString(
                                "vi-VN",
                                { timeZone: "Asia/Ho_Chi_Minh" }
                              )}`
                            );
                            console.log(
                              `  ⏱️ diff: ${diff}ms = ${Math.floor(
                                diff / 1000
                              )}s = ${Math.floor(diff / 60000)}m = ${(
                                diff / 3600000
                              ).toFixed(2)}h`
                            );
                            console.log(
                              `  📊 Status: ${post.status}, approvedAt: ${post.approvedAt}, createdAt: ${post.createdAt}`
                            );
                            console.log(`  ✅ Result: "${result}"`);
                            const expectedResult =
                              diff < 60000
                                ? "Vừa xong"
                                : diff < 3600000
                                  ? `${Math.floor(diff / 60000)} phút trước`
                                  : diff < 86400000
                                    ? `${Math.floor(diff / 3600000)} giờ trước`
                                    : `${Math.floor(diff / 86400000)} ngày trước`;
                            console.log(`  🎯 Expected: "${expectedResult}"`);
                            if (result !== expectedResult) {
                              console.warn(
                                `  ⚠️ MISMATCH! Result "${result}" != Expected "${expectedResult}"`
                              );
                            }
                            return result;
                          })()}
                        </span>

                        <span className="post-views">
                          <VisibilityIcon style={{ fontSize: 14 }} />
                          {post.views || 0} lượt xem
                        </span>
                      </div>
                    </div>

                    <div className="post-actions">
                      <button
                        className="btn-go-post"
                        onClick={() =>
                          onNavigateToPost &&
                          onNavigateToPost(post.id, post.type)
                        }
                      >
                        Đi tới bài đăng
                      </button>

                      {post.status !== "Rejected" && (
                        <button
                          className="btn-edit-post"
                          onClick={() => setEditingPost(post)}
                        >
                          Chỉnh sửa
                        </button>
                      )}
                      <button
                        className="btn-delete-post"
                        onClick={() => setDeletingPost(post)}
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {editingPost && (
          <EditPostModal
            postData={editingPost}
            onClose={() => setEditingPost(null)}
            onUpdate={handleUpdatePost}
          />
        )}

        {deletingPost && (
          <ConfirmDeleteModal
            onCancel={() => setDeletingPost(null)}
            onConfirm={() => handleDeletePost(deletingPost.id)}
          />
        )}
      </div>
    );
  };

  // ======================= MAIN =======================
  return (
    <div className="user-profile">
      <div className="container">
        <div className="profile-container">
          {/* Sidebar */}
          <div className="profile-sidebar">
            <div className="sidebar-nav">
              <button
                className={`nav-item ${activeTab === "profile" ? "active" : ""
                  }`}
                onClick={() => setActiveTab("profile")}
              >
                <PersonIcon /> Thông tin cá nhân
              </button>

              {isOwnProfile && (
                <>
                  <button
                    className={`nav-item ${activeTab === "posts" ? "active" : ""}`}
                    onClick={() => setActiveTab("posts")}
                  >
                    <ArticleIcon /> Bài đăng của tôi
                  </button>


                </>
              )}
            </div>

            {isOwnProfile && (
              <div className="sidebar-footer">
                <button onClick={() => setShowLogoutModal(true)}>
                  <LogoutIcon /> Đăng xuất
                </button>
              </div>
            )}
          </div>

          <div className="profile-main">
            {activeTab === "profile" && renderProfileTab()}
            {activeTab === "posts" && renderPostsTab()}
            {activeTab === "settings" && renderSettingsTab()}
          </div>
        </div>
      </div>

      {showLogoutModal && (
        <ConfirmLogoutModal
          onCancel={() => setShowLogoutModal(false)}
          onConfirm={() => {
            setShowLogoutModal(false);
            onLogout();
          }}
        />
      )}

      {showChangePasswordModal && (
        <ChangePasswordModal
          onClose={() => setShowChangePasswordModal(false)}
          onSuccess={(msg) =>
            onShowToast?.({
              type: "success",
              title: "Thành công",
              message: msg || "Đổi mật khẩu thành công",
            })
          }
        />
      )}
    </div>
  );
};

export default UserProfile;
