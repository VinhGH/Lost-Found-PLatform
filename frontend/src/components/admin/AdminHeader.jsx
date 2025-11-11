import React, { useState } from 'react';
import './AdminHeader.css';
import ConfirmLogoutModal from '../user/ConfirmLogoutModal';
import {
  Person as PersonIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon
} from '@mui/icons-material';

const AdminHeader = ({ onLogout, adminUser }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const notifications = [
    {
      id: 1,
      title: 'Tài khoản mới đăng ký',
      message: 'Nguyễn Văn A đã đăng ký tài khoản developer',
      time: '5 phút trước',
      type: 'info'
    },
    {
      id: 2,
      title: 'Bài đăng cần duyệt',
      message: 'Có 3 bài đăng mới cần được duyệt',
      time: '10 phút trước',
      type: 'warning'
    },
    {
      id: 3,
      title: 'Hệ thống cập nhật',
      message: 'Phiên bản mới đã được cập nhật',
      time: '1 giờ trước',
      type: 'success'
    }
  ];

  const userMenuItems = [
    { label: 'Hồ sơ', icon: <PersonIcon />, action: 'profile' },
    { label: 'Cài đặt', icon: <SettingsIcon />, action: 'settings' },
    { label: 'Đăng xuất', icon: <LogoutIcon />, action: 'logout' }
  ];

  const handleUserMenuAction = (action) => {
    if (action === 'logout') {
      setShowUserMenu(false);
      setShowLogoutModal(true);
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
        {/* Notifications */}
        <div className="notification-container">
          <button
            className="notification-btn"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <NotificationsIcon />
            {notifications.length > 0 && (
              <span className="notification-badge">{notifications.length}</span>
            )}
          </button>

          {showNotifications && (
            <div className="notification-dropdown">
              <div className="dropdown-header">
                <h4>Thông báo</h4>
                <button 
                  className="close-btn"
                  onClick={() => setShowNotifications(false)}
                >
                  <CloseIcon />
                </button>
              </div>
              <div className="notification-list">
                {notifications.map(notification => (
                  <div key={notification.id} className="notification-item">
                    <div className="notification-icon">
                      {notification.type === 'info' && <InfoIcon />}
                      {notification.type === 'warning' && <WarningIcon />}
                      {notification.type === 'success' && <CheckCircleIcon />}
                    </div>
                    <div className="notification-content">
                      <h5>{notification.title}</h5>
                      <p>{notification.message}</p>
                      <span className="notification-time">{notification.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="dropdown-footer">
                <button className="view-all-btn">Xem tất cả</button>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="user-container">
          <button
            className="user-btn"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="user-avatar">
              <span>A</span>
            </div>
            <div className="user-info">
              <span className="user-name">{adminUser?.name || 'Admin User'}</span>
              <span className="user-role">{adminUser?.role || 'Quản trị viên'}</span>
            </div>
            <span className="dropdown-arrow"><KeyboardArrowDownIcon /></span>
          </button>

          {showUserMenu && (
            <div className="user-dropdown">
              <div className="user-dropdown-header">
                <div className="user-avatar-large">
                  <span>A</span>
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
          )}
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
    </header>
  );
};

export default AdminHeader;
