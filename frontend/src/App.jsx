import React, { useState, useEffect } from "react";
import LandingPage from "./components/LandingPage.jsx";
import AdminUI from "./components/admin/AdminUI.jsx";
import UserUI from "./components/user/UserUI.jsx";
import adminApi from "./services/adminApi.js";
import userApi from "./services/realApi.js";

function App() {
  const [currentView, setCurrentView] = useState("main"); // 'main', 'admin-dashboard', 'user-dashboard'
  const [adminUser, setAdminUser] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing sessions on app load
  // Check for existing sessions on app load
  useEffect(() => {
    const checkSessions = () => {
      const savedView = sessionStorage.getItem("currentView");

      const adminToken = localStorage.getItem("adminToken");
      const userToken = localStorage.getItem("userToken");

      console.log("🔍 App.jsx - Checking sessions:");
      console.log("  savedView:", savedView);
      console.log("  adminToken:", adminToken ? "Exists" : "Missing");
      console.log("  userToken:", userToken ? "Exists" : "Missing");

      // ===========================================================
      // 1. RESTORE ADMIN DASHBOARD
      // ===========================================================
      if (savedView === "admin-dashboard") {
        console.log("📋 Restoring ADMIN session...");

        if (adminToken) {
          const adminDataRaw = localStorage.getItem("adminData");
          if (adminDataRaw) {
            const adminData = JSON.parse(adminDataRaw);
            console.log("✅ Admin restored:", adminData.email);
            setAdminUser(adminData);
            setCurrentView("admin-dashboard");
            setIsLoading(false);
            return;
          }

          console.log("⚠️ adminToken exists but adminData missing → clearing");
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminData");
          sessionStorage.removeItem("currentView");
          setIsLoading(false);
          return;
        }

        console.log("⚠️ No adminToken → cannot restore admin dashboard");
        sessionStorage.removeItem("currentView");
        setIsLoading(false);
        return;
      }

      // ===========================================================
      // 2. RESTORE USER DASHBOARD
      // ===========================================================
      if (savedView === "user-dashboard") {
        console.log("📋 Restoring USER session...");

        if (userToken) {
          const userDataRaw = localStorage.getItem("userData");
          if (userDataRaw) {
            const userData = JSON.parse(userDataRaw);
            console.log("✅ User restored:", userData.email);

            setUser(userData);
            setCurrentView("user-dashboard");
            setIsLoading(false);
            return;
          }

          console.log("⚠️ userToken exists but userData missing → clearing");
          localStorage.removeItem("userToken");
          localStorage.removeItem("userData");
          sessionStorage.removeItem("currentView");
          setIsLoading(false);
          return;
        }

        console.log("⚠️ Cannot restore user dashboard (no userToken)");
        sessionStorage.removeItem("currentView");
        setIsLoading(false);
        return;
      }

      // ===========================================================
      // 3. NO SAVED VIEW → only show Landing Page
      // ===========================================================
      console.log("📋 No saved view → Showing landing");
      setIsLoading(false);
    };

    checkSessions();
  }, []);

  // ✅ Đồng bộ sessionStorage mỗi khi currentView thay đổi
  useEffect(() => {
    if (currentView === "admin-dashboard" || currentView === "user-dashboard") {
      sessionStorage.setItem("currentView", currentView);
      console.log(`✅ Updated sessionStorage: currentView = ${currentView}`);
    } else if (currentView === "main") {
      sessionStorage.removeItem("currentView");
      console.log("✅ Cleared sessionStorage: currentView (logged out)");
    }
  }, [currentView]);

  const handleAdminLoginSuccess = (user) => {
    setAdminUser(user);
    setCurrentView("admin-dashboard");
    // ✅ sessionStorage sẽ được cập nhật tự động qua useEffect bên trên
  };

  const handleUserLoginSuccess = (userData) => {
    // Xóa tab đã lưu để đảm bảo về trang chủ khi đăng nhập
    try {
      localStorage.removeItem("userActiveTab");
    } catch (error) {
      console.error("Error clearing userActiveTab on login:", error);
    }

    // 🔹 QUAN TRỌNG: Dùng userData từ login response trực tiếp
    // KHÔNG gọi getCurrentUser() vì có thể còn cache cũ
    console.log("✅ User login success with email:", userData?.email);
    setUser(userData);
    setCurrentView("user-dashboard");
    // ✅ sessionStorage sẽ được cập nhật tự động qua useEffect bên trên
  };

  const handleAdminLogout = async () => {
    try {
      await adminApi.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Xóa tab đã lưu trong localStorage khi đăng xuất
      try {
        localStorage.removeItem("userActiveTab");
        // ✅ sessionStorage sẽ được xóa tự động qua useEffect khi currentView = 'main'
      } catch (error) {
        console.error("Error clearing storage:", error);
      }
      setAdminUser(null);
      setCurrentView("main");
    }
  };

  const handleUserLogout = () => {
    // Xóa tab đã lưu trong localStorage khi đăng xuất
    try {
      localStorage.removeItem("userActiveTab");
      // ✅ sessionStorage sẽ được xóa tự động qua useEffect khi currentView = 'main'
    } catch (error) {
      console.error("Error clearing storage:", error);
    }
    userApi.clearAuthData();
    setUser(null);
    setCurrentView("main");
  };

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "#f8f9fa",
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            background: "white",
            borderRadius: "12px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "4px solid #f3f3f3",
              borderTop: "4px solid #3498db",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 20px",
            }}
          ></div>
          <p style={{ margin: 0, color: "#666", fontSize: "16px" }}>
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
      {currentView === "main" && (
        <LandingPage
          onAdminLoginSuccess={handleAdminLoginSuccess}
          onUserLoginSuccess={handleUserLoginSuccess}
        />
      )}

      {currentView === "admin-dashboard" && adminUser && (
        <AdminUI onLogout={handleAdminLogout} adminUser={adminUser} />
      )}

      {currentView === "user-dashboard" && user && (
        <UserUI onLogout={handleUserLogout} user={user} />
      )}
    </div>
  );
}

export default App;
