import React, { useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import UserAccountsManagement from './UserAccountsManagement';
import AdminAccountsManagement from './AdminAccountsManagement';
import LostItemsManagement from './LostItemsManagement';
import ApprovedPostsView from './ApprovedPostsView';
import AdminProfile from './AdminProfile';
import './AdminUI.css';

const AdminUI = ({ onLogout, adminUser }) => {
  // 🔹 Khởi tạo activeTab từ localStorage hoặc mặc định
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const savedTab = localStorage.getItem("adminActiveTab");
      if (savedTab && ["lost-items", "approved-posts", "profile"].includes(savedTab)) {
        console.log("✅ Đã load tab:", savedTab, "từ localStorage");
        return savedTab;
      }
    } catch (error) {
      console.error("❌ Lỗi khi load activeTab từ localStorage:", error);
    }
    console.log("ℹ️ Sử dụng tab mặc định: lost-items");
    return "lost-items";
  });
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem("adminSidebarCollapsed");
      return saved === "true";
    } catch (error) {
      return false;
    }
  });
  
  // 🔹 Khởi tạo currentAdminUser từ localStorage và merge với adminUser prop
  const [currentAdminUser, setCurrentAdminUser] = useState(() => {
    try {
      const email = adminUser?.email || 'default';
      const profileKey = `adminProfile_${email}`;
      const saved = localStorage.getItem(profileKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge với adminUser prop, ưu tiên dữ liệu từ localStorage
        return {
          ...adminUser,
          name: parsed.name || adminUser?.name || "Admin User",
          email: parsed.email || adminUser?.email || "admin@dtu.edu.vn",
          phone: parsed.phone || adminUser?.phone || "0901234567",
          address: parsed.address || adminUser?.address || "Đại học Duy Tân, Đà Nẵng",
          avatar: parsed.avatar || adminUser?.avatar || null,
          role: adminUser?.role || 'Quản trị viên'
        };
      }
    } catch (error) {
      console.error("❌ Lỗi khi load admin profile từ localStorage:", error);
    }
    return adminUser || {
      name: "Admin User",
      email: "admin@dtu.edu.vn",
      phone: "0901234567",
      address: "Đại học Duy Tân, Đà Nẵng",
      avatar: null,
      role: "Quản trị viên"
    };
  });
  
  const [tabInitialized, setTabInitialized] = useState(false);

  // 🔹 Đánh dấu đã khởi tạo xong tab
  useEffect(() => {
    setTabInitialized(true);
  }, []);

  // 🔹 Load profile từ localStorage khi component mount hoặc adminUser thay đổi
  useEffect(() => {
    if (!adminUser?.email) return;
    
    try {
      const profileKey = `adminProfile_${adminUser.email}`;
      const saved = localStorage.getItem(profileKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge với adminUser prop, ưu tiên dữ liệu từ localStorage
        setCurrentAdminUser(prev => ({
          ...prev,
          ...adminUser,
          name: parsed.name || adminUser?.name || prev.name,
          email: parsed.email || adminUser?.email || prev.email,
          phone: parsed.phone || adminUser?.phone || prev.phone,
          address: parsed.address || adminUser?.address || prev.address,
          avatar: parsed.avatar || adminUser?.avatar || prev.avatar,
          role: adminUser?.role || prev.role || 'Quản trị viên'
        }));
        console.log("✅ Đã load admin profile từ localStorage và cập nhật currentAdminUser");
      } else {
        // Nếu chưa có trong localStorage, dùng adminUser prop
        setCurrentAdminUser(prev => ({
          ...prev,
          ...adminUser
        }));
      }
    } catch (error) {
      console.error("❌ Lỗi khi load admin profile:", error);
      setCurrentAdminUser(prev => ({
        ...prev,
        ...adminUser
      }));
    }
  }, [adminUser?.email]); // Chỉ chạy khi email thay đổi

  // 🔹 Lưu activeTab vào localStorage khi thay đổi (chỉ sau khi đã khởi tạo xong)
  useEffect(() => {
    if (activeTab && tabInitialized) {
      try {
        localStorage.setItem("adminActiveTab", activeTab);
        console.log("💾 Đã lưu tab:", activeTab, "vào localStorage");
      } catch (error) {
        console.error("❌ Lỗi khi lưu activeTab vào localStorage:", error);
      }
    }
  }, [activeTab, tabInitialized]);

  // 🔹 Lưu sidebar collapsed state
  useEffect(() => {
    try {
      localStorage.setItem("adminSidebarCollapsed", sidebarCollapsed.toString());
    } catch (error) {
      console.error("❌ Lỗi khi lưu sidebar state:", error);
    }
  }, [sidebarCollapsed]);

  const handleProfileUpdate = (updatedProfile) => {
    setCurrentAdminUser(prev => ({
      ...prev,
      name: updatedProfile.name || prev.name,
      email: updatedProfile.email || prev.email,
      phone: updatedProfile.phone || prev.phone,
      address: updatedProfile.address || prev.address,
      avatar: updatedProfile.avatar || prev.avatar,
      role: prev.role || 'Quản trị viên' // Giữ nguyên role
    }));
    console.log("✅ Đã cập nhật adminUser state:", updatedProfile);
  };

  const renderContent = () => {
    switch (activeTab) {
      // Content Management
      case 'lost-items':
        return <LostItemsManagement onPostChange={() => {
          // Trigger re-render khi có thay đổi bài đăng
          window.dispatchEvent(new Event('postsUpdated'));
        }} />;
      case 'approved-posts':
        return <ApprovedPostsView onPostChange={() => {
          // Trigger re-render khi có thay đổi bài đăng
          window.dispatchEvent(new Event('postsUpdated'));
        }} />;
      case 'profile':
        return <AdminProfile adminUser={currentAdminUser} onProfileUpdate={handleProfileUpdate} />;
      
      default:
        return <LostItemsManagement onPostChange={() => {
          window.dispatchEvent(new Event('postsUpdated'));
        }} />;
    }
  };

  return (
    <div className="admin-dashboard">
      <AdminSidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
      />
      
      <div className="admin-main">
        <AdminHeader 
          onLogout={onLogout} 
          adminUser={currentAdminUser}
          onProfileClick={() => setActiveTab('profile')}
        />
        
        <main className="admin-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};



export default AdminUI;
