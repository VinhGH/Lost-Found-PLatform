import React, { useState, useEffect } from "react";
import UserHeader from "./UserHeader";
import UserHome from "./UserHome";
import UserProfile from "./UserProfile";
import FoundPage from "./FoundPage";
import LostPage from "./LostPage";
import ChatPage from "./ChatPage";
import CreatePostModal from "./CreatePostModal";
import userApi from "../../services/userApi";
import "./UserUI.css";
import ThemeToggle from "../common/ThemeToggle.jsx";
import NotificationsButton from "../common/NotificationsButton.jsx";

const UserUI = ({ onLogout, user: initialUser }) => {
  // 🔹 Load user từ localStorage (merge với profile) và state
  const [user, setUser] = useState(() => {
    // Ưu tiên load từ userApi (đã merge với profile)
    const currentUser = userApi.getCurrentUser();
    return currentUser || initialUser;
  });
  
  // 🔹 Khởi tạo activeTab từ localStorage ngay từ đầu (lazy initialization)
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const savedTab = localStorage.getItem("userActiveTab");
      if (savedTab && ["home", "found", "lost", "chat", "profile", "posts"].includes(savedTab)) {
        console.log("✅ Đã load tab:", savedTab, "từ localStorage (lazy init)");
        return savedTab;
      }
    } catch (error) {
      console.error("❌ Lỗi khi load activeTab từ localStorage:", error);
    }
    console.log("ℹ️ Sử dụng tab mặc định: home");
    return "home";
  });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [chatTarget, setChatTarget] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [posts, setPosts] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [tabInitialized, setTabInitialized] = useState(false);

  const handlePostViewed = (postId) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, views: (p.views || 0) + 1 } : p
      )
    );
  };

  // 🔹 Load user từ localStorage khi component mount (merge với profile)
  useEffect(() => {
    const currentUser = userApi.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      console.log("✅ Đã load user từ userApi (đã merge với profile):", currentUser);
    } else if (initialUser) {
      setUser(initialUser);
    }
  }, [initialUser]);

  // 🔹 Handler để cập nhật user khi profile thay đổi
  const handleProfileUpdate = (updatedUser) => {
    setUser(updatedUser);
    console.log("✅ Đã cập nhật user state từ profile update:", updatedUser);
  };

  // 🔹 Đánh dấu đã khởi tạo xong tab (sau lần render đầu tiên)
  useEffect(() => {
    setTabInitialized(true);
  }, []);

  // 🔹 Lưu activeTab vào localStorage khi thay đổi (chỉ sau khi đã khởi tạo xong)
  useEffect(() => {
    if (activeTab && tabInitialized) {
      try {
        localStorage.setItem("userActiveTab", activeTab);
        console.log("💾 Đã lưu tab:", activeTab, "vào localStorage");
      } catch (error) {
        console.error("❌ Lỗi khi lưu activeTab vào localStorage:", error);
      }
    }
  }, [activeTab, tabInitialized]);

  // 🔹 Load bài đăng từ localStorage khi component mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("posts");
      if (saved) {
        const parsedPosts = JSON.parse(saved);
        if (Array.isArray(parsedPosts)) {
          setPosts(parsedPosts);
          console.log("✅ Đã load", parsedPosts.length, "bài đăng từ localStorage");
        } else {
          console.warn("⚠️ Dữ liệu posts trong localStorage không hợp lệ, khởi tạo mảng rỗng");
          setPosts([]);
        }
      } else {
        console.log("ℹ️ Chưa có dữ liệu posts trong localStorage");
        setPosts([]);
      }
    } catch (error) {
      console.error("❌ Lỗi khi load posts từ localStorage:", error);
      // Nếu có lỗi, khởi tạo mảng rỗng để tránh crash
      setPosts([]);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // 🔹 Lưu lại localStorage (chỉ khi đã khởi tạo xong để tránh ghi đè dữ liệu khi mount)
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem("posts", JSON.stringify(posts));
        console.log("💾 Đã lưu", posts.length, "bài đăng vào localStorage");
      } catch (error) {
        console.error("❌ Lỗi khi lưu posts vào localStorage:", error);
        // Nếu localStorage đầy, thử xóa một số dữ liệu cũ hoặc thông báo lỗi
        alert("⚠️ Không thể lưu dữ liệu. Vui lòng thử lại.");
      }
    }
  }, [posts, isInitialized]);

  // 🟢 Xử lý tạo bài đăng mới
  const handleCreatePost = (data) => {
    const handleImage = () =>
      new Promise((resolve) => {
        if (data.image instanceof File) {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(data.image);
        } else {
          resolve(data.sampleImage || "");
        }
      });

    handleImage().then((imageBase64) => {
      const now = Date.now();
      const newPost = {
        id: now,
        type: data.postType,
        title: data.title,
        description: data.description,
        location: data.location,
        category: data.category,
        date: data.date,
        contact: data.contact,
        author: user?.name || data.author,
        image: imageBase64,
        time: "Vừa đăng",
        createdAt: now, // 🔹 Lưu timestamp để tính thời gian real-time
        status: "active",
        views: 0,
      };

      const updated = [newPost, ...posts];
      setPosts(updated);
      console.log("🆕 Danh sách bài đăng:", updated);
      // Không cần lưu trực tiếp, useEffect sẽ tự động lưu khi posts thay đổi

      setActiveTab(data.postType === "lost" ? "lost" : "found");
      setShowCreateModal(false);
      alert("✅ Bài đăng mới đã được tạo thành công!");
    });
  };

  // 🧩 Render theo tab
  const renderContent = () => {
    console.log("🔄 Render tab:", activeTab, "| Tổng bài:", posts.length);
    switch (activeTab) {
      case "found":
        return <FoundPage posts={posts} setActiveTab={setActiveTab} setChatTarget={setChatTarget} searchQuery={searchQuery} onViewPost={handlePostViewed} />;
      case "lost":
        return <LostPage posts={posts} setActiveTab={setActiveTab} setChatTarget={setChatTarget} searchQuery={searchQuery} onViewPost={handlePostViewed} />;
      case "chat":
        return <ChatPage user={user} chatTarget={chatTarget} setActiveTab={setActiveTab} />;
      case "posts":
        return <UserProfile user={user} posts={posts} setPosts={setPosts} onLogout={onLogout} defaultTab="posts" onProfileUpdate={handleProfileUpdate} onNavigateToPost={(postId, type) => {
          setActiveTab(type === "lost" ? "lost" : "found");
          // Đợi tab render xong rồi scroll đến bài viết
          setTimeout(() => {
            const el = document.getElementById(`post-${postId}`);
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }, 120);
        }} />;        
      case "profile":
        return <UserProfile user={user} posts={posts} setPosts={setPosts} onLogout={onLogout} onProfileUpdate={handleProfileUpdate} onNavigateToPost={(postId, type) => {
          setActiveTab(type === "lost" ? "lost" : "found");
          setTimeout(() => {
            const el = document.getElementById(`post-${postId}`);
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }, 120);
        }} />;        
      default:
        return <UserHome searchQuery={searchQuery} />;
    }
  };

  return (
    <div className="user-dashboard">
      <UserHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        user={user}
        onLogout={onLogout}
        onCreatePostClick={() => setShowCreateModal(true)} // ✅ truyền callback mở modal
      />

      <main className="user-main">
        {renderContent()}

        {/* ✅ Popup “Đăng tin” */}
        {showCreateModal && (
          <CreatePostModal
            mode="create"
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreatePost}
          />
        )}
      </main>
      
      {/* Notifications bell - show on all tabs except Chat */}
      {activeTab !== "chat" && <NotificationsButton />}

      {/* Dark mode toggle - only show on Home, Found, Lost */}
      {["home", "found", "lost"].includes(activeTab) && <ThemeToggle />}
    </div>
  );
};

export default UserUI;
