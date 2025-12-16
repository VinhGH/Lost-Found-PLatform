import React, { useState } from "react";
import "./AdminProfile.css";
import { Edit as EditIcon } from "@mui/icons-material";

const AdminProfile = ({ adminUser }) => {
  const [isEditing, setIsEditing] = useState(false);

  // FE không lưu profile admin local, chỉ show từ BE
  const profileData = {
    name: adminUser?.name || adminUser?.user_name || "System Admin",
    email: adminUser?.email,
    phone: adminUser?.phone || "",
    address: adminUser?.address || "",
    avatar: adminUser?.avatar || null,
  };

  const [formData, setFormData] = useState(profileData);
  const [originalData, setOriginalData] = useState(profileData); // Store original data for cancel

  const handleInputChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const rd = new FileReader();
    rd.onloadend = () => {
      setFormData({ ...formData, avatar: rd.result });
    };
    rd.readAsDataURL(file);
  };

  const handleEdit = () => {
    // Save current data as original before entering edit mode
    setOriginalData({ ...formData });
    setIsEditing(true);
  };

  const handleCancel = () => {
    // Check if data has changed
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);
    
    if (hasChanges) {
      // Show confirmation dialog if there are changes
      const confirmed = window.confirm("Bạn có chắc chắn muốn hủy cập nhật thông tin không? Các thay đổi sẽ không được lưu.");
      
      if (confirmed) {
        // User confirmed, restore original data and exit edit mode
        setFormData({ ...originalData });
        setIsEditing(false);
      }
      // If not confirmed, do nothing (stay in edit mode)
    } else {
      // No changes, just exit edit mode
      setIsEditing(false);
    }
  };

  const handleSave = () => {
    // Show confirmation dialog
    const confirmed = window.confirm("Bạn có chắc chắn muốn lưu thông tin này không?");
    
    if (confirmed) {
      // User confirmed, proceed with save
      alert("⚠ FE không cho admin thay đổi hồ sơ (trừ avatar). BE sẽ không nhận yêu cầu này.");
      // Update original data to current form data after successful save
      setOriginalData({ ...formData });
      setIsEditing(false);
    }
    // If not confirmed, do nothing (stay in edit mode)
  };

  return (
    <div className="admin-profile">
      <div className="admin-profile-container">

        <div className="profile-header">
          <div className="avatar-section">
            <div className="avatar-container">
              <img
                src={formData.avatar || "/img/default-avatar.png"}
                className="profile-avatar"
                alt="Avatar"
              />

              {isEditing && (
                <label className="avatar-upload">
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} />
                  <EditIcon fontSize="small" />
                </label>
              )}
            </div>

            {/* name từ BE - không cho chỉnh */}
            <h2 className="profile-name">{profileData.name}</h2>

            {/* email BE - cố định */}
            <p className="profile-email">{profileData.email}</p>
          </div>

          <div className="profile-actions">
            {isEditing ? (
              <div className="edit-actions">
                <button className="btn-cancel" onClick={handleCancel}>Hủy</button>
                <button className="btn-save" onClick={handleSave}>Lưu</button>
              </div>
            ) : (
              <button className="btn-edit" onClick={handleEdit}>
                Chỉnh sửa hồ sơ
              </button>
            )}
          </div>
        </div>

        {/* phần thông tin */}
        <div className="profile-content">
          <div className="info-section">
            <h3 className="section-title">Thông tin cá nhân</h3>

            <div className="info-grid">
              {/* Name: không cho edit */}
              <div className="info-item">
                <label>Họ và tên</label>
                <input
                  type="text"
                  value={profileData.name}
                  disabled
                  className="info-input disabled"
                />
              </div>

              {/* Email: không edit */}
              <div className="info-item">
                <label>Email</label>
                <input
                  type="email"
                  value={profileData.email}
                  disabled
                  className="info-input disabled"
                />
              </div>

              {/* Phone */}
              <div className="info-item">
                <label>Số điện thoại</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.phone}
                  onChange={handleInputChange("phone")}
                  className={`info-input ${!isEditing ? 'disabled' : ''}`}
                />
              </div>

              {/* Address */}
              <div className="info-item">
                <label>Địa chỉ</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.address}
                  onChange={handleInputChange("address")}
                  className={`info-input ${!isEditing ? 'disabled' : ''}`}
                />
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminProfile;
