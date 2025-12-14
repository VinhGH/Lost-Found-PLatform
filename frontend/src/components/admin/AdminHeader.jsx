import React, { useState } from 'react';
import './AdminHeader.css';
import {
  Person as PersonIcon,
  Logout as LogoutIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon
} from '@mui/icons-material';

const AdminHeader = ({ onLogout, adminUser, onProfileClick }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const userMenuItems = [
    { label: 'Hồ sơ', icon: <PersonIcon />, action: 'profile' },
    { label: 'Đăng xuất', icon: <LogoutIcon />, action: 'logout' }
  ];

  const handleUserMenuAction = (action) => {
    if (action === 'logout') {
      setShowUserMenu(false);
      onLogout(); // ✅ Đăng xuất ngay, không cần popup
    } else if (action === 'profile' && onProfileClick) {
      setShowUserMenu(false);
      onProfileClick();
    } else {
      setShowUserMenu(false);
    }
  };

  return (
    <header className="admin-header">
      <div className="header-left">
        <div className="page-title">
          <h1>Admin Dashboard</h1>
          <p>Quản lý hệ thống DTU Lost & Found</p>
        </div>
      </div>

      <div className="header-right">
        {/* User Menu */}
        <div 
          className="user-container"
          onMouseEnter={() => setShowUserMenu(true)}
          onMouseLeave={() => setShowUserMenu(false)}
        >
          <button
            className="user-btn"
            type="button"
          >
            <div className="user-avatar">
              {adminUser?.avatar ? (
                <img 
                  src={adminUser.avatar} 
                  alt={adminUser?.name || 'Admin'} 
                  className="user-avatar-img"
                />
              ) : (
                <span>{(adminUser?.name || 'Admin User').charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="user-info">
              <span className="user-name">{adminUser?.name || 'Admin User'}</span>
              <span className="user-role">{adminUser?.role || 'Quản trị viên'}</span>
            </div>
            <span className="dropdown-arrow"><KeyboardArrowDownIcon /></span>
          </button>

          <div className={`user-dropdown ${showUserMenu ? 'visible' : ''}`}>
            <div className="user-dropdown-header">
              <div className="user-avatar-large">
                {adminUser?.avatar ? (
                  <img 
                    src={adminUser.avatar} 
                    alt={adminUser?.name || 'Admin'} 
                    className="user-avatar-img-large"
                  />
                ) : (
                  <span>{(adminUser?.name || 'Admin User').charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="user-details">
                <h4>{adminUser?.name || 'Admin User'}</h4>
                <p>{adminUser?.email || 'admin@dtu.edu.vn'}</p>
              </div>
            </div>
            <div className="user-menu-items">
              {userMenuItems.map((item, index) => (
                <button
                  key={index}
                  className="user-menu-item"
                  onClick={() => handleUserMenuAction(item.action)}
                >
                  <span className="menu-icon">{item.icon}</span>
                  <span className="menu-label">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
