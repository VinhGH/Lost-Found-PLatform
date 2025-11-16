import React, { useState, useEffect } from "react";
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
  Settings as SettingsIcon
} from "@mui/icons-material";

// 🔹 Đồng bộ cách hiển thị thời gian
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
  return new Date(timestamp).toLocaleDateString("vi-VN");
};

const UserProfile = ({
  user,
  onLogout,
  posts,
  setPosts,
  defaultTab = "profile",
  onProfileUpdate,
  onNavigateToPost,
  onShowToast
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

  // 🔹 Khởi tạo profile
  const [profileData, setProfileData] = useState(() => {
    const saved = localStorage.getItem(`userProfile_${user?.email}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...parsed, email: user?.email };
    }
    return {
      name: user?.name || "Nguyễn Văn A",
      email: user?.email,
      phone: user?.phone || "",
      address: user?.address || "",
      avatar: user?.avatar || null
    };
  });

  // 🔹 Load profile từ Supabase
  useEffect(() => {
    const load = async () => {
      if (!user?.email) return;

      try {
        const response = await userApi.getProfile();
        if (response.success) {
          const u = response.data.user || response.data;
          setProfileData({
            name: u.user_name,
            email: u.email,
            phone: u.phone_number || "",
            address: u.address || "",
            avatar: u.avatar || null
          });
        }
      } catch (err) {
        console.error("Lỗi load profile:", err);
      }
    };
    load();
  }, [user?.email]);

  // 🔹 Bài đăng của user
  const userPosts = posts.filter((p) => p.author === profileData.name);

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
        avatar: profileData.avatar
      });

      if (!res.success) {
        alert("Không thể cập nhật");
        return;
      }

      if (onProfileUpdate) onProfileUpdate(res.data.user);
      setIsEditing(false);
      alert("Cập nhật thành công!");
    } catch (e) {
      alert("Lỗi khi lưu profile.");
      console.error(e);
    }
  };

  // 🔹 Update / Delete post
  const handleUpdatePost = (updated) => {
    setPosts((prev) => {
      const list = prev.map((p) => (p.id === updated.id ? updated : p));
      localStorage.setItem("posts", JSON.stringify(list));
      return list;
    });
    setEditingPost(null);
  };

  const handleDeletePost = (id) => {
    setPosts((prev) => {
      const list = prev.filter((p) => p.id !== id);
      localStorage.setItem("posts", JSON.stringify(list));
      return list;
    });
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
            {isEditing && (
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
              Chỉnh sửa hồ sơ
            </button>
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
                  {{
                    name: "Họ và tên",
                    email: "Email",
                    phone: "Số điện thoại",
                    address: "Địa chỉ"
                  }[f]}
                </label>

                {isEditing ? (
                  <input
                    type={f === "email" ? "email" : "text"}
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
          <button onClick={() => setShowChangePasswordModal(true)}>
            Đổi mật khẩu
          </button>
        </div>
      </div>
    </div>
  );

  // ======================= TAB POSTS =======================
  const renderPostsTab = () => (
    <div className="posts-tab">
      <div className="posts-header">
        <h3 className="section-title">Bài đăng của tôi</h3>
        <div className="posts-stats">{userPosts.length} bài đăng</div>
      </div>

      <div className="posts-list">
        {userPosts.map((post) => {
          const imgs =
            post.images?.length > 0 ? post.images : post.image ? [post.image] : [];

          return (
            <div key={post.id} className="post-item">
              {imgs.length > 0 && (
                <div className="post-item-image-wrapper">
                  <ImageCarousel images={imgs} postId={post.id} />
                </div>
              )}

              <div className="post-info">
                <div className="post-header">
                  <h4 className="post-title">{post.title}</h4>
                  <div className={`post-status ${post.status}`}>
                    {post.status === "resolved" ? "Đã giải quyết" : "Đang hoạt động"}
                  </div>
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
                    {getTimeAgo(post.createdAt || post.id)}
                  </span>

                  <span className="post-views">
                    <VisibilityIcon style={{ fontSize: 14 }} />
                    {post.views} lượt xem
                  </span>
                </div>
              </div>

              <div className="post-actions">
                <button
                  className="btn-go-post"
                  onClick={() =>
                    onNavigateToPost && onNavigateToPost(post.id, post.type)
                  }
                >
                  Đi tới bài đăng
                </button>

                <button onClick={() => setEditingPost(post)}>Chỉnh sửa</button>
                <button onClick={() => setDeletingPost(post)}>Xóa</button>
              </div>
            </div>
          );
        })}
      </div>

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

  // ======================= MAIN =======================
  return (
    <div className="user-profile">
      <div className="container">
        <div className="profile-container">
          {/* Sidebar */}
          <div className="profile-sidebar">
            <div className="sidebar-nav">
              <button
                className={`nav-item ${activeTab === "profile" ? "active" : ""}`}
                onClick={() => setActiveTab("profile")}
              >
                <PersonIcon /> Thông tin cá nhân
              </button>

              <button
                className={`nav-item ${activeTab === "posts" ? "active" : ""}`}
                onClick={() => setActiveTab("posts")}
              >
                <ArticleIcon /> Bài đăng của tôi
              </button>

              <button
                className={`nav-item ${activeTab === "settings" ? "active" : ""}`}
                onClick={() => setActiveTab("settings")}
              >
                <SettingsIcon /> Cài đặt
              </button>
            </div>

            <div className="sidebar-footer">
              <button onClick={() => setShowLogoutModal(true)}>
                <LogoutIcon /> Đăng xuất
              </button>
            </div>
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
              message: msg || "Đổi mật khẩu thành công"
            })
          }
        />
      )}
    </div>
  );
};

export default UserProfile;
