import React, { useState } from 'react';
import './AdminSidebar.css';
import {
  Group as GroupIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Article as ArticleIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';

const AdminSidebar = ({ activeTab, setActiveTab, isCollapsed, setIsCollapsed }) => {
  const [expandedMenus, setExpandedMenus] = useState(['users']);
  const pendingCount = 4;
  const menuItems = [
    {
      id: 'users',
      label: 'Quản lý người dùng',
      icon: <GroupIcon />,
      path: '/admin/users',
      submenu: [
        { id: 'user-accounts', label: 'Tài khoản người dùng', icon: <PersonIcon /> },
        { id: 'admin-accounts', label: 'Tài khoản Admin', icon: <AdminIcon /> }
      ]
    },
    {
      id: 'content',
      label: 'Quản lý bài đăng',
      icon: <ArticleIcon />,
      path: '/admin/content',
      submenu: [
        { id: 'lost-items', label: 'Danh sách bài chờ duyệt', icon: <SearchIcon />, badge: pendingCount },
        { id: 'approved-posts', label: 'Xem bài đăng', icon: <VisibilityIcon /> }
      ]
    },
  ];

  const handleMenuClick = (itemId, hasSubmenu = false) => {
    if (hasSubmenu) {
      setExpandedMenus(prev => 
        prev.includes(itemId) 
          ? prev.filter(id => id !== itemId)
          : [...prev, itemId]
      );
    } else {
      setActiveTab(itemId);
    }
  };

  const isMenuExpanded = (itemId) => {
    return expandedMenus.includes(itemId);
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
                onClick={() => handleMenuClick(item.id, !!item.submenu)}
              >
                <span className="nav-icon">{item.icon}</span>
                {!isCollapsed && <span className="nav-label">{item.label}</span>}
                {!isCollapsed && item.submenu && (
                  <span className={`nav-arrow ${isMenuExpanded(item.id) ? 'expanded' : ''}`}>
                    <ExpandMoreIcon />
                  </span>
                )}
              </button>
              
              {/* Submenu */}
              {!isCollapsed && item.submenu && isMenuExpanded(item.id) && (
                <ul className="submenu">
                  {item.submenu.map(subItem => (
                    <li key={subItem.id} className="submenu-item">
                      <button
                        className={`submenu-link ${activeTab === subItem.id ? 'active' : ''}`}
                        onClick={() => handleMenuClick(subItem.id)}
                      >
                        <span className="submenu-icon">{subItem.icon}</span>
                        <span className="submenu-label">{subItem.label}</span>
                        {typeof subItem.badge === 'number' && subItem.badge > 0 && (
                          <span className="menu-badge" aria-label={`Số lượng chờ duyệt: ${subItem.badge}`}>{subItem.badge}</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
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

