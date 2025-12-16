import React, { useState, useEffect } from 'react';
import './AdminSidebar.css';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Folder as FolderIcon,
  People as PeopleIcon,
} from '@mui/icons-material';

const AdminSidebar = ({ activeTab, setActiveTab, isCollapsed, setIsCollapsed }) => {
  // ✅ Tính số lượng bài đăng chờ duyệt (sẽ được cập nhật từ LostItemsManagement)
  const [pendingCount, setPendingCount] = useState(0);

  // ✅ Lắng nghe event khi posts thay đổi để cập nhật count
  useEffect(() => {
    const handlePendingCountUpdate = (event) => {
      // LostItemsManagement sẽ dispatch event với count
      if (event.detail && typeof event.detail.pendingCount === 'number') {
        setPendingCount(event.detail.pendingCount);
      }
    };

    const handlePostsUpdated = () => {
      // Có thể gọi API để lấy count nếu cần
      // Hoặc đợi LostItemsManagement dispatch event
    };

    window.addEventListener('pendingCountUpdated', handlePendingCountUpdate);
    window.addEventListener('postsUpdated', handlePostsUpdated);

    return () => {
      window.removeEventListener('pendingCountUpdated', handlePendingCountUpdate);
      window.removeEventListener('postsUpdated', handlePostsUpdated);
    };
  }, []);

  // ✅ Menu items with new categories and users tabs
  const menuItems = [
    {
      id: 'lost-items',
      label: 'Bài đăng chờ duyệt',
      icon: <SearchIcon />,
      badge: pendingCount
    },
    {
      id: 'approved-posts',
      label: 'Bài đăng đã duyệt',
      icon: <VisibilityIcon />
    },
    {
      id: 'categories',
      label: 'Quản lý chuyên mục',
      icon: <FolderIcon />
    },
    {
      id: 'users',
      label: 'Quản lý người dùng',
      icon: <PeopleIcon />
    }
  ];

  const handleMenuClick = (itemId) => {
    setActiveTab(itemId);
  };

  return (
    <div className={`admin-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Logo Section */}
      <div className="sidebar-header">
        <div className="logo-container">
          <img src="/img/logo_dtu.png" alt="DTU Logo" className="sidebar-logo" />
          {!isCollapsed && (
            <div className="logo-text">
              <h3>DTU Admin</h3>
              <span>Lost & Found</span>
            </div>
          )}
        </div>
        <button
          className="collapse-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-nav">
        <ul className="nav-menu">
          {menuItems.map(item => (
            <li key={item.id} className="nav-item">
              <button
                className={`nav-link ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => handleMenuClick(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                {!isCollapsed && <span className="nav-label">{item.label}</span>}
                {!isCollapsed && typeof item.badge === 'number' && item.badge > 0 && (
                  <span className="menu-badge" aria-label={`Số lượng chờ duyệt: ${item.badge}`}>{item.badge}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        {!isCollapsed && (
          <div className="footer-info">
            <p>DTU Lost & Found</p>
            <span>Version 1.0.0</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSidebar;

