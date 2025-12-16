import React, { useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import LostItemsManagement from './LostItemsManagement';
import ApprovedPostsView from './ApprovedPostsView';
import AdminProfile from './AdminProfile';
import CategoryManagement from './CategoryManagement';
import UserManagement from './UserManagement';
import './AdminUI.css';
import './AdminGlobalOverrides.css';

const AdminUI = ({ onLogout, adminUser }) => {
  // 🔹 Force Admin luôn ở light mode, không bị ảnh hưởng bởi dark mode của User
  useEffect(() => {
    // ✅ Force set theme về light mode cho Admin
    const root = document.documentElement;
    let isUpdating = false; // ✅ Flag để tránh infinite loop

    const forceLightMode = () => {
      if (isUpdating) return; // ✅ Tránh infinite loop
      isUpdating = true;

      if (root.getAttribute('data-theme') !== 'light') {
        root.setAttribute('data-theme', 'light');
      }
      if (document.body.classList.contains('dark')) {
        document.body.classList.remove('dark');
      }

      // ✅ Reset flag sau một chút
      setTimeout(() => {
        isUpdating = false;
      }, 10);
    };

    forceLightMode();

    // ✅ Thêm class để identify admin dashboard
    root.classList.add('admin-mode');

    // ✅ Lắng nghe thay đổi của data-theme và force lại về light mode
    const observer = new MutationObserver((mutations) => {
      if (isUpdating) return; // ✅ Tránh xử lý khi đang update

      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          const currentTheme = root.getAttribute('data-theme');
          if (currentTheme === 'dark') {
            // ✅ Nếu bị đổi sang dark, force lại về light
            forceLightMode();
          }
        }
      });
    });

    // ✅ Observe thay đổi của data-theme attribute
    observer.observe(root, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    // ✅ Lắng nghe thay đổi của body class
    const bodyObserver = new MutationObserver((mutations) => {
      if (isUpdating) return; // ✅ Tránh xử lý khi đang update

      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          if (document.body.classList.contains('dark')) {
            // ✅ Nếu body có class dark, remove nó
            forceLightMode();
          }
        }
      });
    });

    bodyObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });

    // ✅ Cleanup: remove class và disconnect observers khi unmount
    return () => {
      root.classList.remove('admin-mode');
      observer.disconnect();
      bodyObserver.disconnect();
    };
  }, []);

  // 🔹 Khởi tạo activeTab từ localStorage hoặc mặc định
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const savedTab = localStorage.getItem("adminActiveTab");
      if (savedTab && ["lost-items", "approved-posts", "categories", "users", "profile"].includes(savedTab)) {
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

      // Category Management
      case 'categories':
        return <CategoryManagement />;

      // User Management
      case 'users':
        return <UserManagement />;

      // Profile
      case 'profile':
        return <AdminProfile adminUser={currentAdminUser} onProfileUpdate={handleProfileUpdate} />;

      default:
        return <LostItemsManagement onPostChange={() => {
          window.dispatchEvent(new Event('postsUpdated'));
        }} />;
    }
  };

  return (
    <div className="admin-dashboard admin-light-mode">
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
