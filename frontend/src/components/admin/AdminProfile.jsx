import React, { useState, useEffect } from "react";
import "./AdminProfile.css";
import {
  Person as PersonIcon,
  Edit as EditIcon
} from "@mui/icons-material";

const AdminProfile = ({ adminUser, onProfileUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // 🔹 Khởi tạo profileData từ localStorage hoặc adminUser prop
  const [profileData, setProfileData] = useState(() => {
    try {
      const saved = localStorage.getItem(`adminProfile_${adminUser?.email || 'default'}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log("✅ Đã load admin profile từ localStorage:", parsed);
        return {
          ...parsed,
          email: adminUser?.email || parsed.email || "admin@dtu.edu.vn"
        };
      }
    } catch (error) {
      console.error("❌ Lỗi khi load admin profile từ localStorage:", error);
    }
    // Fallback về adminUser prop hoặc giá trị mặc định
    return {
      name: adminUser?.name || "Admin User",
      email: adminUser?.email || "admin@dtu.edu.vn",
      phone: adminUser?.phone || "0901234567",
      address: adminUser?.address || "Đại học Duy Tân, Đà Nẵng",
      avatar: adminUser?.avatar || null,
    };
  });

  // 🔹 Load profile từ localStorage khi component mount hoặc khi adminUser.email thay đổi
  useEffect(() => {
    if (!adminUser?.email) {
      setIsInitialized(true);
      return;
    }

    try {
      const profileKey = `adminProfile_${adminUser.email}`;
      const saved = localStorage.getItem(profileKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        const profileWithEmail = {
          ...parsed,
          email: adminUser.email
        };
        setProfileData(profileWithEmail);
        console.log("✅ Đã load admin profile từ localStorage:", profileWithEmail);
      } else {
        // Nếu chưa có trong localStorage, khởi tạo từ adminUser prop
        const initialData = {
          name: adminUser?.name || "Admin User",
          email: adminUser?.email || "admin@dtu.edu.vn",
          phone: adminUser?.phone || "0901234567",
          address: adminUser?.address || "Đại học Duy Tân, Đà Nẵng",
          avatar: adminUser?.avatar || null,
        };
        localStorage.setItem(profileKey, JSON.stringify(initialData));
        setProfileData(initialData);
        console.log("ℹ️ Khởi tạo admin profile từ adminUser prop và lưu vào localStorage");
      }
    } catch (error) {
      console.error("❌ Lỗi khi load admin profile từ localStorage:", error);
      setProfileData({
        name: adminUser?.name || "Admin User",
        email: adminUser?.email || "admin@dtu.edu.vn",
        phone: adminUser?.phone || "0901234567",
        address: adminUser?.address || "Đại học Duy Tân, Đà Nẵng",
        avatar: adminUser?.avatar || null,
      });
    } finally {
      setIsInitialized(true);
    }
  }, [adminUser?.email]);

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
      const profileKey = `adminProfile_${adminUser?.email || 'default'}`;
      
      const profileToSave = {
        ...profileData,
        email: adminUser?.email || profileData.email
      };
      
      localStorage.setItem(profileKey, JSON.stringify(profileToSave));
      console.log("💾 Đã lưu admin profile vào localStorage:", profileToSave);
      
      // 🔹 Thông báo cho AdminUI để cập nhật adminUser state
      if (onProfileUpdate) {
        onProfileUpdate(profileToSave);
      }
      
      setProfileData(profileToSave);
      alert("✅ Thông tin hồ sơ đã được cập nhật!");
      setIsEditing(false);
    } catch (error) {
      console.error("❌ Lỗi khi lưu admin profile:", error);
      if (error.name === 'QuotaExceededError' || error.code === 22) {
        alert("⚠️ Bộ nhớ đầy. Vui lòng xóa một số dữ liệu cũ hoặc liên hệ hỗ trợ.");
      } else {
        alert("⚠️ Có lỗi xảy ra khi lưu thông tin. Vui lòng thử lại.");
      }
    }
  };

  // ======================= GIAO DIỆN PROFILE TAB =======================
  return (
    <div className="admin-profile">
      <div className="admin-profile-container">
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
                      try {
                        const profileKey = `adminProfile_${adminUser?.email || 'default'}`;
                        const saved = localStorage.getItem(profileKey);
                        if (saved) {
                          const parsed = JSON.parse(saved);
                          setProfileData({
                            ...parsed,
                            email: adminUser?.email || parsed.email
                          });
                        } else {
                          setProfileData({
                            name: adminUser?.name || "Admin User",
                            email: adminUser?.email || "admin@dtu.edu.vn",
                            phone: adminUser?.phone || "0901234567",
                            address: adminUser?.address || "Đại học Duy Tân, Đà Nẵng",
                            avatar: adminUser?.avatar || null,
                          });
                        }
                      } catch (error) {
                        console.error("❌ Lỗi khi khôi phục profile:", error);
                        setProfileData({
                          name: adminUser?.name || "Admin User",
                          email: adminUser?.email || "admin@dtu.edu.vn",
                          phone: adminUser?.phone || "0901234567",
                          address: adminUser?.address || "Đại học Duy Tân, Đà Nẵng",
                          avatar: adminUser?.avatar || null,
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
                        value={field === "email" ? (adminUser?.email || profileData[field]) : profileData[field]}
                        onChange={handleInputChange(field)}
                        disabled={field === "email"}
                        style={field === "email" ? { 
                          backgroundColor: "#f5f5f5", 
                          cursor: "not-allowed",
                          color: "#6c757d"
                        } : {}}
                      />
                    ) : (
                      <span className="info-value">{field === "email" ? (adminUser?.email || profileData[field]) : profileData[field]}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;

