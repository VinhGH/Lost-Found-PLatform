import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage.jsx';
import AdminUI from './components/admin/AdminUI.jsx';
import UserUI from './components/user/UserUI.jsx';
import adminApi from './services/adminApi.js';
import userApi from './services/userApi.js';

function App() {
  const [currentView, setCurrentView] = useState('main'); // 'main', 'admin-dashboard', 'user-dashboard'
  const [adminUser, setAdminUser] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing sessions on app load
  useEffect(() => {
    const checkSessions = () => {
      // Check admin session first
      if (adminApi.isAuthenticated()) {
        const adminUserData = adminApi.getAdminUser();
        if (adminUserData) {
          setAdminUser(adminUserData);
          setCurrentView('admin-dashboard');
          setIsLoading(false);
          return;
        } else {
          adminApi.clearAuthData();
        }
      }

      // Check user session
      if (userApi.isAuthenticated()) {
        // getCurrentUser() đã tự động merge với profile đã lưu
        const userData = userApi.getCurrentUser();
        if (userData) {
          setUser(userData);
          setCurrentView('user-dashboard');
          setIsLoading(false);
          return;
        } else {
          userApi.clearAuthData();
        }
      }

      setIsLoading(false);
    };

    checkSessions();
  }, []);


  const handleAdminLoginSuccess = (user) => {
    setAdminUser(user);
    setCurrentView('admin-dashboard');
  };

  const handleUserLoginSuccess = (userData) => {
    // Xóa tab đã lưu để đảm bảo về trang chủ khi đăng nhập
    try {
      localStorage.removeItem("userActiveTab");
    } catch (error) {
      console.error('Error clearing userActiveTab on login:', error);
    }
    // getCurrentUser() đã tự động merge với profile đã lưu
    const currentUser = userApi.getCurrentUser();
    setUser(currentUser || userData);
    setCurrentView('user-dashboard');
  };

  const handleAdminLogout = async () => {
    try {
      await adminApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Xóa tab đã lưu trong localStorage khi đăng xuất
      try {
        localStorage.removeItem("userActiveTab");
      } catch (error) {
        console.error('Error clearing userActiveTab:', error);
      }
      setAdminUser(null);
      setCurrentView('main');
    }
  };

  const handleUserLogout = () => {
    // Xóa tab đã lưu trong localStorage khi đăng xuất
    try {
      localStorage.removeItem("userActiveTab");
    } catch (error) {
      console.error('Error clearing userActiveTab:', error);
    }
    userApi.clearAuthData();
    setUser(null);
    setCurrentView('main');
  };


  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f8f9fa'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '40px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p style={{ margin: 0, color: '#666', fontSize: '16px' }}>
            Đang tải ứng dụng...
          </p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="App">
      {currentView === 'main' && (
        <LandingPage 
          onAdminLoginSuccess={handleAdminLoginSuccess}
          onUserLoginSuccess={handleUserLoginSuccess}
        />
      )}

      {currentView === 'admin-dashboard' && adminUser && (
        <AdminUI 
          onLogout={handleAdminLogout}
          adminUser={adminUser}
        />
      )}

      {currentView === 'user-dashboard' && user && (
        <UserUI 
          onLogout={handleUserLogout}
          user={user}
        />
      )}
    </div>
  );
}

export default App;
