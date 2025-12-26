import React, { useState } from 'react';
import './LandingPage.css';
import UserHome from './user/UserHome';
import AuthForm from './AuthForm';

const LandingPage = ({ onUserLoginSuccess, onAdminLoginSuccess }) => {
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'

  const handleOpenAuth = (mode) => {
    setAuthMode(mode);
    setShowAuthForm(true);
  };

  const handleCloseAuth = () => {
    setShowAuthForm(false);
  };

  const handleAuthSuccess = (userData, isAdmin = false) => {
    if (isAdmin) {
      onAdminLoginSuccess(userData);
    } else {
      onUserLoginSuccess(userData);
    }
    setShowAuthForm(false);
  };

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <div className="landing-header-container">
          <div className="landing-logo">
            <img src="/img/logo_dtu_while.png" alt="DTU Logo" className="landing-logo-image" />
            <div className="landing-logo-text">
              <h1>TimDoDTU</h1>
              <span>DTU Lost & Found</span>
            </div>
          </div>
          {/* ✅ LUÔN hiển thị buttons trên landing page (không check isAuthenticated) */}
          {/* Vì đây là landing page, user có thể muốn login lại hoặc login tài khoản khác */}
          <div className="landing-header-actions">
            <button
              className={`landing-btn-login ${showAuthForm && authMode === 'login' ? 'active' : ''}`}
              onClick={() => handleOpenAuth('login')}
            >
              Đăng Nhập
            </button>
            <button
              className={`landing-btn-register ${showAuthForm && authMode === 'register' ? 'active' : ''}`}
              onClick={() => handleOpenAuth('register')}
            >
              Đăng Ký
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Landing Page or Auth Form */}
      {!showAuthForm ? (
        <UserHome
          onOpenAuth={handleOpenAuth}
          isAuthenticated={false}
        />
      ) : (
        <AuthForm
          initialMode={authMode}
          onBack={handleCloseAuth}
          onAdminLoginSuccess={(userData) => handleAuthSuccess(userData, true)}
          onUserLoginSuccess={(userData) => handleAuthSuccess(userData, false)}
        />
      )}
    </div>
  );
};

export default LandingPage;

