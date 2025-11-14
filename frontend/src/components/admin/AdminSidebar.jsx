import React, { useState, useEffect } from 'react';
import './AdminSidebar.css';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';

const AdminSidebar = ({ activeTab, setActiveTab, isCollapsed, setIsCollapsed }) => {
  // ✅ Tính số lượng bài đăng chờ duyệt từ localStorage
  const getPendingCount = () => {
    try {
      const saved = localStorage.getItem("posts");
      if (saved) {
        const posts = JSON.parse(saved);
        return posts.filter(p => p.status === 'pending').length;
      }
    } catch (error) {
      console.error("❌ Lỗi khi đếm pending posts:", error);
    }
    return 0;
  };
  
  const [pendingCount, setPendingCount] = useState(getPendingCount());
  
  // ✅ Cập nhật pending count khi có thay đổi
  useEffect(() => {
    const interval = setInterval(() => {
      setPendingCount(getPendingCount());
    }, 2000); // Check mỗi 2 giây
    
    // ✅ Lắng nghe event khi posts thay đổi
    const handlePostsUpdated = () => {
      setPendingCount(getPendingCount());
    };
    
    window.addEventListener('postsUpdated', handlePostsUpdated);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('postsUpdated', handlePostsUpdated);
    };
  }, []);
  
  // ✅ 2 menu items riêng biệt, không còn submenu
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
          <img src="/img/logo_dtu_while.png" alt="DTU Logo" className="sidebar-logo" />
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

