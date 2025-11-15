import React, { useState, useEffect } from "react";
import UserHeader from "./UserHeader";
import UserHome from "./UserHome";
import UserProfile from "./UserProfile";
import FoundPage from "./FoundPage";
import LostPage from "./LostPage";
import ChatPage from "./ChatPage";
import CreatePostModal from "./CreatePostModal";
import PostDetailModal from "./PostDetailModal";
import userApi from "../../services/userApi";
import "./UserUI.css";
import ThemeToggle from "../common/ThemeToggle.jsx";
import NotificationsButton from "../common/NotificationsButton.jsx";
import ToastNotification from "../common/ToastNotification.jsx";

const UserUI = ({ onLogout, user: initialUser }) => {
  // 🔹 Load theme cho User khi component mount
  useEffect(() => {
    if (window.__loadTheme) {
      window.__loadTheme('user');
    }
  }, []);

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
  const [selectedPost, setSelectedPost] = useState(null); // State cho PostDetailModal
  const [isSearching, setIsSearching] = useState(false); // Flag để phân biệt khi đang search
  const [toastNotification, setToastNotification] = useState(null); // State cho toast notification

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

  // ✅ Clear search input khi chuyển tab (trừ khi đang search)
  useEffect(() => {
    if (tabInitialized && !isSearching) {
      // Chỉ clear khi không phải là action search
      setSearchQuery("");
    }
  }, [activeTab, tabInitialized, isSearching]); // Chạy khi activeTab thay đổi

  // ✅ Reset flag isSearching sau khi tab đã chuyển xong
  useEffect(() => {
    if (isSearching) {
      // Reset flag sau một khoảng thời gian ngắn để đảm bảo tab đã chuyển xong
      const timer = setTimeout(() => {
        setIsSearching(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isSearching, activeTab]);

  // ✅ Lắng nghe event để hiển thị toast khi admin duyệt bài
  useEffect(() => {
    const handleShowToast = (event) => {
      if (event.detail) {
        setToastNotification({
          type: event.detail.type || 'success',
          title: event.detail.title || 'Bài đăng đã được duyệt',
          message: event.detail.message || 'Bài viết của bạn đã được duyệt',
          postId: event.detail.postId, // ✅ Lưu postId để có thể navigate
          postType: event.detail.postType // ✅ Lưu postType để navigate đúng tab
        });
      }
    };

    window.addEventListener('showToast', handleShowToast);
    return () => {
      window.removeEventListener('showToast', handleShowToast);
    };
  }, []);

  // ✅ Hàm xử lý search - tự động chuyển sang tab có kết quả
  const handleSearch = (query) => {
    if (!query || !query.trim()) {
      return; // Không làm gì nếu query rỗng
    }

    setIsSearching(true); // Đánh dấu đang search để không clear input
    const keyword = query.toLowerCase().trim();

    // Tìm kiếm trong posts
    const foundResults = posts.filter((p) => {
      if (p.type !== "found") return false;
      const searchableText = [
        p.title || "",
        p.description || "",
        p.location || "",
        p.author || "",
        p.category || ""
      ].join(" ").toLowerCase();
      return searchableText.includes(keyword);
    });

    const lostResults = posts.filter((p) => {
      if (p.type !== "lost") return false;
      const searchableText = [
        p.title || "",
        p.description || "",
        p.location || "",
        p.author || "",
        p.category || ""
      ].join(" ").toLowerCase();
      return searchableText.includes(keyword);
    });

    // Tự động chuyển sang tab có kết quả
    if (foundResults.length > 0 && lostResults.length > 0) {
      // Nếu cả 2 tab đều có kết quả, ưu tiên "Đồ nhặt được"
      setActiveTab("found");
    } else if (foundResults.length > 0) {
      setActiveTab("found");
    } else if (lostResults.length > 0) {
      setActiveTab("lost");
    } else {
      // Nếu không có kết quả, chuyển sang tab "Đồ nhặt được" để hiển thị "Không tìm thấy"
      setActiveTab("found");
    }
  };

  // 🔹 Load bài đăng từ localStorage khi component mount
  const loadPosts = () => {
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
  };

  useEffect(() => {
    loadPosts();

    // ✅ Lắng nghe sự thay đổi từ admin (khi admin xóa/duyệt bài đăng)
    const handlePostsUpdated = () => {
      console.log("🔄 Phát hiện thay đổi posts từ admin, reload lại...");
      loadPosts();
    };

    // Lắng nghe custom event từ admin
    window.addEventListener('postsUpdated', handlePostsUpdated);
    
    // Lắng nghe storage event (từ tab/window khác)
    window.addEventListener('storage', (e) => {
      if (e.key === 'posts') {
        handlePostsUpdated();
      }
    });

    return () => {
      window.removeEventListener('postsUpdated', handlePostsUpdated);
      window.removeEventListener('storage', handlePostsUpdated);
    };
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
    // Xử lý images array (mới) hoặc image đơn lẻ (cũ) để tương thích
    const handleImages = () =>
      new Promise((resolve) => {
        // Nếu có images array (từ CreatePostModal mới)
        if (data.images && Array.isArray(data.images) && data.images.length > 0) {
          const imagePromises = data.images
            .filter(img => img instanceof File)
            .map(img => {
              return new Promise((res) => {
                const reader = new FileReader();
                reader.onloadend = () => res(reader.result);
                reader.readAsDataURL(img);
              });
            });
          Promise.all(imagePromises).then(results => {
            // Lấy ảnh đầu tiên làm ảnh chính (hoặc có thể dùng imagePreviews)
            resolve(data.imagePreviews?.[0] || results[0] || "");
          });
        } 
        // Nếu có image đơn lẻ (backward compatibility)
        else if (data.image instanceof File) {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(data.image);
        } 
        // Nếu có imagePreviews (từ CreatePostModal mới)
        else if (data.imagePreviews && Array.isArray(data.imagePreviews) && data.imagePreviews.length > 0) {
          resolve(data.imagePreviews[0]);
        }
        // Fallback
        else {
          resolve(data.image || "");
        }
      });

    handleImages().then((imageBase64) => {
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
        status: "pending", // ✅ Mặc định là pending - cần admin duyệt
        views: 0,
      };

      const updated = [newPost, ...posts];
      setPosts(updated);
      console.log("🆕 Danh sách bài đăng:", updated);
      // Không cần lưu trực tiếp, useEffect sẽ tự động lưu khi posts thay đổi

      // ✅ Tạo thông báo trong localStorage
      const notification = {
        id: Date.now(),
        type: 'info',
        title: 'Bài đăng đã được tạo',
        message: 'Bài viết của bạn đang chờ duyệt !',
        time: new Date().toISOString(),
        read: false,
        userId: user?.name || data.author,
        postId: now, // ✅ Lưu postId để có thể navigate
        postType: data.postType, // ✅ Lưu postType để navigate đúng tab
        createdAt: Date.now() // ✅ Lưu timestamp để tính 3 ngày
      };

      const existingNotifications = JSON.parse(localStorage.getItem("notifications") || "[]");
      existingNotifications.unshift(notification);
      localStorage.setItem("notifications", JSON.stringify(existingNotifications));
      
      // ✅ Trigger event để NotificationsButton reload
      window.dispatchEvent(new Event('notificationAdded'));

      // ✅ Hiển thị toast notification tự động
      setToastNotification({
        type: 'info',
        title: 'Bài đăng đã được tạo',
        message: 'Bài viết của bạn đang chờ duyệt !',
        postId: now, // ✅ Lưu postId để có thể navigate
        postType: data.postType // ✅ Lưu postType để navigate đúng tab
      });

      setActiveTab(data.postType === "lost" ? "lost" : "found");
      setShowCreateModal(false);
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
        return <ChatPage user={user} chatTarget={chatTarget} setActiveTab={setActiveTab} posts={posts} onOpenPostDetail={setSelectedPost} />;
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
        }} onShowToast={(toast) => {
          setToastNotification(toast);
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
        }} onShowToast={(toast) => {
          setToastNotification(toast);
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
        onSearch={handleSearch} // ✅ Truyền hàm xử lý search
      />

      <main className="user-main">
        {renderContent()}

        {/* ✅ Popup "Đăng tin" */}
        {showCreateModal && (
          <CreatePostModal
            mode="create"
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreatePost}
            user={user}
          />
        )}

        {/* ✅ PostDetailModal - Hiển thị khi có selectedPost */}
        {selectedPost && (
          <PostDetailModal
            post={selectedPost}
            onClose={() => setSelectedPost(null)}
            currentTab={selectedPost.type === "lost" ? "Đồ mất" : "Đồ nhặt được"}
            categoryPath={selectedPost.category}
            onNavigate={(path) => {
              if (path === (selectedPost.type === "lost" ? "Đồ mất" : "Đồ nhặt được")) {
                setSelectedPost(null);
              }
            }}
          />
        )}
      </main>
      
      {/* Notifications bell - show on all tabs except Chat */}
      {activeTab !== "chat" && (
        <NotificationsButton 
          onNotificationClick={(postId, postType) => {
            // ✅ Navigate đến bài đăng khi click vào thông báo
            if (postType === "lost") {
              setActiveTab("lost");
            } else if (postType === "found") {
              setActiveTab("found");
            }
            // Đợi tab render xong rồi scroll đến bài viết
            setTimeout(() => {
              const el = document.getElementById(`post-${postId}`);
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
                // Highlight bài đăng
                el.style.transition = "box-shadow 0.3s";
                el.style.boxShadow = "0 0 0 3px rgba(25, 118, 210, 0.3)";
                setTimeout(() => {
                  el.style.boxShadow = "";
                }, 2000);
              } else {
                // Nếu không tìm thấy trong list, mở PostDetailModal
                const post = posts.find(p => p.id === postId);
                if (post) {
                  setSelectedPost(post);
                }
              }
            }, 300);
          }}
        />
      )}

      {/* Dark mode toggle - show on Home, Found, Lost, Profile, Posts */}
      {["home", "found", "lost", "profile", "posts"].includes(activeTab) && <ThemeToggle />}

      {/* Toast Notification - hiển thị tự động */}
      {toastNotification && (
        <ToastNotification
          notification={toastNotification}
          onClose={() => setToastNotification(null)}
          onClick={(postId, postType) => {
            // ✅ Navigate đến bài đăng khi click vào toast
            if (postType === "lost") {
              setActiveTab("lost");
            } else if (postType === "found") {
              setActiveTab("found");
            }
            // Đợi tab render xong rồi scroll đến bài viết
            setTimeout(() => {
              const el = document.getElementById(`post-${postId}`);
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
                // Highlight bài đăng
                el.style.transition = "box-shadow 0.3s";
                el.style.boxShadow = "0 0 0 3px rgba(25, 118, 210, 0.3)";
                setTimeout(() => {
                  el.style.boxShadow = "";
                }, 2000);
              } else {
                // Nếu không tìm thấy trong list, mở PostDetailModal
                const post = posts.find(p => p.id === postId);
                if (post) {
                  setSelectedPost(post);
                }
              }
            }, 300);
          }}
        />
      )}
    </div>
  );
};

export default UserUI;
