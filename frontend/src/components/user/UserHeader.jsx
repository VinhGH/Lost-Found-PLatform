import React, { useState } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import './UserHeader.css';
import ConfirmLogoutModal from './ConfirmLogoutModal';
import {
  Home as HomeIcon,
  Search as SearchIcon,
  CheckCircle as FoundIcon,
  SearchOff as LostIcon,
  Chat as ChatIcon,
  Person as PersonIcon,
  Article as ArticleIcon,
  Logout as LogoutIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  Add as AddIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

const UserHeader = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  user,
  onLogout,
  onCreatePostClick, // ✅ callback được truyền từ UserUI
  onSearch // ✅ Hàm xử lý search từ UserUI
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch && searchQuery && searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  const handleSearchIconClick = () => {
    // Trigger search khi click vào icon
    if (onSearch && searchQuery && searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  return (
    <header className="user-header">
      <div className="header-container">
        {/* Logo */}
        <div className="header-logo" onClick={() => setActiveTab('home')}>
          <img src="/img/logo_dtu_while.png" alt="DTU Logo" className="logo-image" />
          <div className="logo-text">
            <h1>TimDoDTU</h1>
            <span>DTU Lost & Found</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="header-nav">
          <button className={`nav-btn ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
            <HomeIcon style={{ fontSize: '18px' }} /> Trang chủ
          </button>
          <button className={`nav-btn ${activeTab === 'found' ? 'active' : ''}`} onClick={() => setActiveTab('found')}>
            <FoundIcon style={{ fontSize: '18px' }} /> Đồ nhặt được
          </button>
          <button className={`nav-btn ${activeTab === 'lost' ? 'active' : ''}`} onClick={() => setActiveTab('lost')}>
            <LostIcon style={{ fontSize: '18px' }} /> Đồ mất
          </button>
          <button className={`nav-btn ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
            <ChatIcon style={{ fontSize: '18px' }} /> Chat
          </button>
        </nav>

        {/* Search */}
        <div className="header-search">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Tìm kiếm đồ thất lạc..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(e);
                }
              }}
              className="header-search-input"
            />
            <button
              type="button"
              onClick={handleSearchIconClick}
              className="search-icon-btn"
              title="Tìm kiếm"
            >
              <SearchIcon className="search-icon-right" style={{ fontSize: '18px' }} />
            </button>
          </form>
        </div>

        {/* Actions */}
        <div className="header-actions">
          <button className="post-btn" onClick={onCreatePostClick}>
            {/* ✅ Gọi callback từ UserUI */}
            <AddIcon style={{ fontSize: '18px' }} />
            <span>Đăng tin</span>
          </button>

          {/* User Menu */}
          <div
            className="header-user"
            onMouseEnter={() => setShowUserMenu(true)}
            onMouseLeave={() => setShowUserMenu(false)}
          >
            <button className="user-menu-btn" type="button">
              <div className="user-avatar">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user?.name || 'User'}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  user?.name ? user.name.charAt(0).toUpperCase() : 'U'
                )}
              </div>
              <span className="user-name">{user?.name || 'Người dùng'}</span>
              <KeyboardArrowDownIcon className="dropdown-icon" style={{ fontSize: '16px' }} />
            </button>

            <div className={`user-dropdown ${showUserMenu ? 'visible' : ''}`}>
              <div className="dropdown-content">
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setActiveTab('profile');
                    setShowUserMenu(false);
                  }}
                >
                  <PersonIcon style={{ fontSize: '16px' }} /> Hồ sơ của {user?.name || 'bạn'}
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setActiveTab('posts');
                    setShowUserMenu(false);
                  }}
                >
                  <ArticleIcon style={{ fontSize: '16px' }} /> Bài đăng của tôi
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setActiveTab('matches');
                    setShowUserMenu(false);
                  }}
                >
                  <DotLottieReact
                    src="https://lottie.host/2de4e929-6cf6-412d-a39a-7db8817377cf/VEOFwd8TTe.lottie"
                    loop
                    autoplay
                    style={{ width: '20px', height: '20px', display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }}
                  />
                  AI Matches
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setActiveTab('profile');
                    // ✅ Chuyển đến tab settings trong profile
                    setTimeout(() => {
                      const profileComponent = document.querySelector('.user-profile');
                      if (profileComponent) {
                        // Trigger event để UserProfile chuyển sang tab settings
                        window.dispatchEvent(new CustomEvent('switchToSettingsTab'));
                      }
                    }, 100);
                    setShowUserMenu(false);
                  }}
                >
                  <SettingsIcon style={{ fontSize: '16px' }} /> Cài đặt
                </button>
                <hr className="dropdown-divider" />
                <button
                  className="dropdown-item logout"
                  onClick={() => {
                    setShowUserMenu(false);
                    setShowLogoutModal(true);
                  }}
                >
                  <LogoutIcon style={{ fontSize: '16px' }} /> Đăng xuất
                </button>
              </div>
            </div>
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
    </header>
  );
};

export default UserHeader;
