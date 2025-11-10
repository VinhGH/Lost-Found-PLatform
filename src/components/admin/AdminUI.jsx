import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import UserAccountsManagement from './UserAccountsManagement';
import AdminAccountsManagement from './AdminAccountsManagement';
import LostItemsManagement from './LostItemsManagement';
import ApprovedPostsView from './ApprovedPostsView';
import './AdminUI.css';

const AdminUI = ({ onLogout, adminUser }) => {
  const [activeTab, setActiveTab] = useState('user-accounts');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      // User Management
      case 'user-accounts':
        return <UserAccountsManagement />;
      case 'admin-accounts':
        return <AdminAccountsManagement />;
      
      // Content Management
      case 'lost-items':
        return <LostItemsManagement />;
      case 'approved-posts':
        return <ApprovedPostsView />;
      
      default:
        return <UserAccountsManagement />;
    }
  };

  const breadcrumbMap = {
    'user-accounts': ['Trang chủ', 'Quản lý người dùng', 'Tài khoản người dùng'],
    'admin-accounts': ['Trang chủ', 'Quản lý người dùng', 'Tài khoản Admin'],
    'lost-items': ['Trang chủ', 'Quản lý bài đăng', 'Danh sách chờ duyệt'],
    'approved-posts': ['Trang chủ', 'Quản lý bài đăng', 'Xem bài đăng']
  };
  const breadcrumbs = breadcrumbMap[activeTab] || ['Trang chủ'];

  return (
    <div className="admin-dashboard">
      <AdminSidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
      />
      
      <div className="admin-main">
        <AdminHeader onLogout={onLogout} adminUser={adminUser} />
        
        <div className="breadcrumb">
          {breadcrumbs.map((crumb, idx) => (
            <span key={idx} className="breadcrumb-item">
              {crumb}
              {idx < breadcrumbs.length - 1 && <span className="breadcrumb-sep"> / </span>}
            </span>
          ))}
        </div>

        <main className="admin-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};



export default AdminUI;
