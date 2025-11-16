import React, { useState, useEffect } from "react";
import "./UserProfile.css";
import EditPostModal from "./EditPostModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import ConfirmLogoutModal from "./ConfirmLogoutModal";
import ChangePasswordModal from "./ChangePasswordModal";
import userApi from "../../services/realApi"; // ✅ REAL API - Connects to Supabase
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

// 🔹 Đồng bộ cách hiển thị thời gian với các trang Lost/Found
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
  const date = new Date(timestamp);
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const UserProfile = ({ user, onLogout, posts, setPosts, defaultTab = "profile", onProfileUpdate, onNavigateToPost, onShowToast }) => {
  // 🔹 Khởi tạo activeTab từ localStorage hoặc defaultTab
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const savedTab = localStorage.getItem("userProfileActiveTab");
      if (savedTab && ["profile", "posts", "settings"].includes(savedTab)) {
        console.log("✅ Đã load profile tab:", savedTab, "từ localStorage");
        return savedTab;
      }
    } catch (error) {
      console.error("❌ Lỗi khi load profile tab từ localStorage:", error);
    }
    return defaultTab;
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [deletingPost, setDeletingPost] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  // 🔹 Khởi tạo profileData từ localStorage hoặc user prop
  const [profileData, setProfileData] = useState(() => {
    try {
      const saved = localStorage.getItem(`userProfile_${user?.email || 'default'}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log("✅ Đã load profile từ localStorage:", parsed);
        // 🔹 Đảm bảo email luôn lấy từ user prop (không cho phép thay đổi)
        return {
          ...parsed,
          email: user?.email || parsed.email || "user@dtu.edu.vn"
        };
      }
    } catch (error) {
      console.error("❌ Lỗi khi load profile từ localStorage:", error);
    }
    // Fallback về user prop hoặc giá trị mặc định
    return {
      name: user?.name || "Nguyễn Văn A",
      email: user?.email || "user@dtu.edu.vn",
      phone: user?.phone || "0901234567",
      address: user?.address || "Đại học Duy Tân, Đà Nẵng",
      avatar: user?.avatar || null,
    };
  });

  // 🔹 Load profile từ localStorage khi component mount hoặc khi user.email thay đổi
  useEffect(() => {
    const loadProfile = async () => {
    if (!user?.email) {
      setIsInitialized(true);
      return;
    }

    try {
        // ✅ Load profile từ Supabase
        console.log("🔄 Đang load profile từ Supabase...");
        const response = await userApi.getProfile();
        
        if (response.success && response.data) {
          const userData = response.data.user || response.data;
          const profileFromDB = {
            name: userData.user_name || user?.name || "Nguyễn Văn A",
            email: userData.email || user?.email || "user@dtu.edu.vn",
            phone: userData.phone_number || user?.phone || "",
            address: user?.address || "", // Address không có trong DB schema
            avatar: userData.avatar || user?.avatar || null,
        };
          setProfileData(profileFromDB);
          console.log("✅ Đã load profile từ Supabase:", profileFromDB);
      } else {
          // Fallback về user prop nếu API fail
          console.warn("⚠️ Không load được profile từ Supabase, dùng user prop");
          setProfileData({
          name: user?.name || "Nguyễn Văn A",
          email: user?.email || "user@dtu.edu.vn",
            phone: user?.phone || "",
            address: user?.address || "",
          avatar: user?.avatar || null,
          });
      }
    } catch (error) {
        console.error("❌ Lỗi khi load profile từ Supabase:", error);
      // Fallback về user prop nếu có lỗi
      setProfileData({
        name: user?.name || "Nguyễn Văn A",
        email: user?.email || "user@dtu.edu.vn",
          phone: user?.phone || "",
          address: user?.address || "",
        avatar: user?.avatar || null,
      });
    } finally {
      setIsInitialized(true);
    }
    };

    loadProfile();
  }, [user?.email]); // Chạy khi user.email thay đổi

  // 🔹 Lọc bài đăng của user hiện tại
  const userPosts = posts.filter((p) => p.author === profileData.name);

  // 🔹 Lưu activeTab vào localStorage khi thay đổi
  useEffect(() => {
    if (activeTab && ["profile", "posts", "settings"].includes(activeTab)) {
      try {
        localStorage.setItem("userProfileActiveTab", activeTab);
        console.log("💾 Đã lưu profile tab:", activeTab, "vào localStorage");
      } catch (error) {
        console.error("❌ Lỗi khi lưu profile tab vào localStorage:", error);
      }
    }
  }, [activeTab]);

  // 🔹 Lắng nghe event để chuyển sang tab settings từ UserHeader
  useEffect(() => {
    const handleSwitchToSettings = () => {
      setActiveTab("settings");
    };
    window.addEventListener('switchToSettingsTab', handleSwitchToSettings);
    return () => {
      window.removeEventListener('switchToSettingsTab', handleSwitchToSettings);
    };
  }, []);

  // ======================= PROFILE =======================
  const handleInputChange = (field) => (e) => {
    // 🔹 Không cho phép thay đổi email
    if (field === 'email') {
      return;
    }
    setProfileData({ ...profileData, [field]: e.target.value });
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Chuyển file sang base64 để lưu vào localStorage
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setProfileData({
          ...profileData,
          avatar: base64String,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      // 🔹 Đảm bảo email luôn lấy từ user prop (không cho phép thay đổi)
      const profileToSave = {
        ...profileData,
        email: user?.email || profileData.email
      };
      
      // Lấy tên cũ TRƯỚC KHI lưu dữ liệu mới
      let oldName = user?.name || "Nguyễn Văn A";

      // ✅ Gọi API để lưu vào Supabase
      console.log("🔄 Đang cập nhật profile vào Supabase...");
      const response = await userApi.updateProfile({
        user_name: profileToSave.name,
        phone_number: profileToSave.phone,
        avatar: profileToSave.avatar,
      });

      if (!response.success) {
        alert("⚠️ " + (response.error || "Không thể cập nhật thông tin"));
        return;
      }

      console.log("✅ Profile đã được lưu vào Supabase:", response.data);
      
      // 🔹 Lấy user data mới từ backend response
      const updatedUserData = response.data?.user || response.data;
      
      // 🔹 Format lại để match với frontend expectations
      const formattedUser = {
        account_id: updatedUserData.account_id,
        email: updatedUserData.email,
        name: updatedUserData.user_name || profileToSave.name,
        user_name: updatedUserData.user_name || profileToSave.name,
        phone: updatedUserData.phone_number || profileToSave.phone,
        phone_number: updatedUserData.phone_number || profileToSave.phone,
        avatar: updatedUserData.avatar || profileToSave.avatar,
        role: updatedUserData.role,
        created_at: updatedUserData.created_at,
              };
      
      console.log("📤 Syncing user data to header:", formattedUser);
      
      // 🔹 Thông báo cho UserUI để cập nhật user state (sync header)
      if (onProfileUpdate) {
        onProfileUpdate(formattedUser);
      }

      // 🔹 Cập nhật profileData state với email đúng
      setProfileData(profileToSave);
      
      alert("✅ Thông tin hồ sơ đã được cập nhật vào Supabase!");
      setIsEditing(false);
    } catch (error) {
      console.error("❌ Lỗi khi lưu profile:", error);
        alert("⚠️ Có lỗi xảy ra khi lưu thông tin. Vui lòng thử lại.");
    }
  };

  // ======================= POSTS =======================
  const handleUpdatePost = (updatedPost) => {
    setPosts((prev) => {
      const newList = prev.map((p) => (p.id === updatedPost.id ? updatedPost : p));
      localStorage.setItem("posts", JSON.stringify(newList)); // ✅ lưu ngay
      return newList;
    });
    setEditingPost(null);
  };

  const handleDeletePost = (id) => {
    setPosts((prev) => {
      const newList = prev.filter((p) => p.id !== id);
      localStorage.setItem("posts", JSON.stringify(newList)); // ✅ lưu ngay
      return newList;
    });
    setDeletingPost(null);
  };

  // ======================= GIAO DIỆN PROFILE TAB =======================
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
                  className="avatar-input"
                />
                <EditIcon style={{ fontSize: "14px" }} />
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
                onClick={() => {
                  // Khôi phục dữ liệu từ localStorage khi hủy
                  try {
                    const profileKey = `userProfile_${user?.email || 'default'}`;
                    const saved = localStorage.getItem(profileKey);
                    if (saved) {
                      const parsed = JSON.parse(saved);
                      // 🔹 Đảm bảo email luôn lấy từ user prop
                      setProfileData({
                        ...parsed,
                        email: user?.email || parsed.email
                      });
                    } else {
                      // Nếu không có trong localStorage, khôi phục từ user prop
                      setProfileData({
                        name: user?.name || "Nguyễn Văn A",
                        email: user?.email || "user@dtu.edu.vn",
                        phone: user?.phone || "0901234567",
                        address: user?.address || "Đại học Duy Tân, Đà Nẵng",
                        avatar: user?.avatar || null,
                      });
                    }
                  } catch (error) {
                    console.error("❌ Lỗi khi khôi phục profile:", error);
                    // Fallback về user prop nếu có lỗi
                    setProfileData({
                      name: user?.name || "Nguyễn Văn A",
                      email: user?.email || "user@dtu.edu.vn",
                      phone: user?.phone || "0901234567",
                      address: user?.address || "Đại học Duy Tân, Đà Nẵng",
                      avatar: user?.avatar || null,
                    });
                  }
                  setIsEditing(false);
                }}
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
            {["name", "email", "phone", "address"].map((field) => (
              <div className="info-item" key={field}>
                <label className="info-label">
                  {{
                    name: "Họ và tên",
                    email: "Email",
                    phone: "Số điện thoại",
                    address: "Địa chỉ",
                  }[field]}
                </label>
                {isEditing ? (
                  <input
                    type={field === "email" ? "email" : "text"}
                    className="info-input"
                    value={field === "email" ? (user?.email || profileData[field]) : profileData[field]}
                    onChange={handleInputChange(field)}
                    disabled={field === "email"} // 🔹 Vô hiệu hóa trường email khi chỉnh sửa
                    style={field === "email" ? { 
                      backgroundColor: "#f5f5f5", 
                      cursor: "not-allowed",
                      color: "#6c757d"
                    } : {}}
                  />
                ) : (
                  <span className="info-value">{field === "email" ? (user?.email || profileData[field]) : profileData[field]}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ======================= GIAO DIỆN SETTINGS TAB =======================
  const renderSettingsTab = () => (
    <div className="settings-tab">
      <div className="settings-header">
        <h3 className="section-title">Cài đặt</h3>
      </div>
      <div className="settings-content">
        <div className="settings-item">
          <div className="settings-item-label">
            <span>Đổi mật khẩu</span>
            <span className="settings-item-description">Thay đổi mật khẩu tài khoản của bạn</span>
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

  // ======================= GIAO DIỆN POSTS TAB =======================
  const renderPostsTab = () => (
    <div className="posts-tab">
      <div className="posts-header">
        <h3 className="section-title">Bài đăng của tôi</h3>
        <div className="posts-stats">Tổng cộng {userPosts.length} bài đăng</div>
      </div>

      <div className="posts-list">
        {userPosts.map((post) => (
          <div key={post.id} className="post-item">
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
                      <SearchIcon style={{ fontSize: "14px" }} /> Tìm đồ
                    </>
                  ) : (
                    <>
                      <FoundIcon style={{ fontSize: "14px" }} /> Nhặt được
                    </>
                  )}
                </span>
                <span className="post-time">
                  <TimeIcon style={{ fontSize: "14px", marginRight: "4px" }} />
                  {getTimeAgo(post.createdAt || post.id)}
                </span>
                <span className="post-views">
                  <VisibilityIcon style={{ fontSize: "14px", marginRight: "4px" }} />
                  {post.views} lượt xem
                </span>
              </div>
            </div>

            <div className="post-actions">
              <button
                className="btn-go-post"
                onClick={() => onNavigateToPost && onNavigateToPost(post.id, post.type)}
              >
                Di chuyển đến bài đăng
              </button>
              <button className="btn-edit-post" onClick={() => setEditingPost(post)}>
                Chỉnh sửa
              </button>
              <button className="btn-delete-post" onClick={() => setDeletingPost(post)}>
                Xóa
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal chỉnh sửa bài đăng */}
      {editingPost && (
        <EditPostModal
          postData={editingPost}
          onClose={() => setEditingPost(null)}
          onUpdate={handleUpdatePost}
        />
      )}

      {/* Modal xác nhận xóa */}
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
                onClick={() => {
                  setActiveTab("profile");
                }}
              >
                <PersonIcon /> Thông tin cá nhân
              </button>
              <button
                className={`nav-item ${activeTab === "posts" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("posts");
                }}
              >
                <ArticleIcon /> Bài đăng của tôi
              </button>
              <button
                className={`nav-item ${activeTab === "settings" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("settings");
                }}
              >
                <SettingsIcon /> Cài đặt
              </button>
            </div>

            <div className="sidebar-footer">
              <button className="btn-logout" onClick={() => setShowLogoutModal(true)}>
                <LogoutIcon /> Đăng xuất
              </button>
            </div>
          </div>

          {/* Nội dung chính */}
          <div className="profile-main">
            {activeTab === "profile" && renderProfileTab()}
            {activeTab === "posts" && renderPostsTab()}
            {activeTab === "settings" && renderSettingsTab()}
          </div>
        </div>
      </div>

      {/* Modal xác nhận đăng xuất */}
      {showLogoutModal && (
        <ConfirmLogoutModal
          onCancel={() => setShowLogoutModal(false)}
          onConfirm={() => {
            setShowLogoutModal(false);
            onLogout();
          }}
        />
      )}

      {/* Modal đổi mật khẩu */}
      {showChangePasswordModal && (
        <ChangePasswordModal
          onClose={() => setShowChangePasswordModal(false)}
          onSuccess={(message) => {
            setShowChangePasswordModal(false);
            // ✅ Hiển thị toast notification
            if (onShowToast) {
              onShowToast({
                type: 'success',
                title: 'Thành công',
                message: message || 'Đổi mật khẩu thành công'
              });
            }
          }}
        />
      )}
    </div>
  );
};

export default UserProfile;
