import React, { useState, useEffect } from "react";
import "./UserProfile.css";
import EditPostModal from "./EditPostModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import ConfirmLogoutModal from "./ConfirmLogoutModal";
import userApi from "../../services/userApi";
import {
  Article as ArticleIcon,
  Search as SearchIcon,
  CheckCircle as FoundIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  ExitToApp as LogoutIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon
} from "@mui/icons-material";


const UserProfile = ({ user, onLogout, posts, setPosts, defaultTab = "profile", onProfileUpdate }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [deletingPost, setDeletingPost] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

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
    if (!user?.email) {
      setIsInitialized(true);
      return;
    }

    try {
      const profileKey = `userProfile_${user.email}`;
      const saved = localStorage.getItem(profileKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // 🔹 Đảm bảo email luôn lấy từ user prop (không cho phép thay đổi)
        const profileWithEmail = {
          ...parsed,
          email: user.email
        };
        setProfileData(profileWithEmail);
        console.log("✅ Đã load profile từ localStorage:", profileWithEmail);
      } else {
        // Nếu chưa có trong localStorage, khởi tạo từ user prop
        const initialData = {
          name: user?.name || "Nguyễn Văn A",
          email: user?.email || "user@dtu.edu.vn",
          phone: user?.phone || "0901234567",
          address: user?.address || "Đại học Duy Tân, Đà Nẵng",
          avatar: user?.avatar || null,
        };
        // Lưu vào localStorage để lần sau có thể load
        localStorage.setItem(profileKey, JSON.stringify(initialData));
        setProfileData(initialData);
        console.log("ℹ️ Khởi tạo profile từ user prop và lưu vào localStorage");
      }
    } catch (error) {
      console.error("❌ Lỗi khi load profile từ localStorage:", error);
      // Fallback về user prop nếu có lỗi
      setProfileData({
        name: user?.name || "Nguyễn Văn A",
        email: user?.email || "user@dtu.edu.vn",
        phone: user?.phone || "0901234567",
        address: user?.address || "Đại học Duy Tân, Đà Nẵng",
        avatar: user?.avatar || null,
      });
    } finally {
      setIsInitialized(true);
    }
  }, [user?.email]); // Chạy khi user.email thay đổi

  // 🔹 Lọc bài đăng của user hiện tại
  const userPosts = posts.filter((p) => p.author === profileData.name);

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

  const handleSave = () => {
    try {
      const profileKey = `userProfile_${user?.email || 'default'}`;
      
      // 🔹 Đảm bảo email luôn lấy từ user prop (không cho phép thay đổi)
      const profileToSave = {
        ...profileData,
        email: user?.email || profileData.email
      };
      
      // Lấy tên cũ TRƯỚC KHI lưu dữ liệu mới
      let oldName = user?.name || "Nguyễn Văn A";
      const savedProfile = localStorage.getItem(profileKey);
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          oldName = parsed.name || oldName;
        } catch (e) {
          // Ignore, dùng oldName từ user prop
        }
      }
      
      // Lưu profile mới vào localStorage (không bao gồm email có thể thay đổi)
      localStorage.setItem(profileKey, JSON.stringify(profileToSave));
      console.log("💾 Đã lưu profile vào localStorage:", profileToSave);
      
      // 🔹 Cập nhật userData trong localStorage để sync với header (không cập nhật email)
      userApi.updateUserData({
        name: profileToSave.name,
        phone: profileToSave.phone,
        address: profileToSave.address,
        avatar: profileToSave.avatar
        // 🔹 Không cập nhật email - email luôn lấy từ userData gốc
      });
      console.log("✅ Đã cập nhật userData trong userApi");
      
      // 🔹 Thông báo cho UserUI để cập nhật user state
      if (onProfileUpdate) {
        const updatedUser = userApi.getCurrentUser();
        onProfileUpdate(updatedUser);
      }
      
      // Cập nhật tên author trong các posts nếu name thay đổi
      if (profileToSave.name && profileToSave.name !== oldName) {
        setPosts((prevPosts) => {
          const updatedPosts = prevPosts.map((post) => {
            // Cập nhật tất cả posts có author trùng với tên cũ
            if (post.author === oldName) {
              return { ...post, author: profileToSave.name };
            }
            return post;
          });
          localStorage.setItem("posts", JSON.stringify(updatedPosts));
          console.log("✅ Đã cập nhật author trong posts từ", oldName, "sang", profileToSave.name);
          return updatedPosts;
        });
      }
      
      // 🔹 Cập nhật profileData state với email đúng
      setProfileData(profileToSave);
      
      alert("✅ Thông tin hồ sơ đã được cập nhật!");
      setIsEditing(false);
    } catch (error) {
      console.error("❌ Lỗi khi lưu profile:", error);
      // Kiểm tra nếu lỗi do localStorage đầy
      if (error.name === 'QuotaExceededError' || error.code === 22) {
        alert("⚠️ Bộ nhớ đầy. Vui lòng xóa một số dữ liệu cũ hoặc liên hệ hỗ trợ.");
      } else {
        alert("⚠️ Có lỗi xảy ra khi lưu thông tin. Vui lòng thử lại.");
      }
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
                  {post.time}
                </span>
                <span className="post-views">
                  <VisibilityIcon style={{ fontSize: "14px", marginRight: "4px" }} />
                  {post.views} lượt xem
                </span>
              </div>
            </div>

            <div className="post-actions">
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
    </div>
  );
};

export default UserProfile;
