import React, { useState, useEffect } from "react";
import UserHeader from "./UserHeader";
import UserHome from "./UserHome";
import UserProfile from "./UserProfile";
import FoundPage from "./FoundPage";
import LostPage from "./LostPage";
import ChatPage from "./ChatPage";
import MatchesPage from "./MatchesPage";
import CreatePostModal from "./CreatePostModal";
import PostDetailModal from "./PostDetailModal";

import userApi from "../../services/realApi";     // ✅ GIỮ API THẬT
import aiMatchingService from "../../services/aiMatchingService";  // ✅ GIỮ AI MATCHING
import { compressImages } from "../../utils/imageCompressor";  // ✅ Image compression

import "./UserUI.css";
import ThemeToggle from "../common/ThemeToggle.jsx";
import NotificationsButton from "../common/NotificationsButton.jsx";
import ToastNotification from "../common/ToastNotification.jsx";

const UserUI = ({ onLogout, user: initialUser }) => {
  useEffect(() => {
    if (window.__loadTheme) window.__loadTheme("user");
  }, []);

  const [user, setUser] = useState(() => {
    // 🔹 QUAN TRỌNG: Ưu tiên initialUser từ prop (từ login response)
    // KHÔNG gọi getCurrentUser() ở đây vì có thể lấy cache cũ
    console.log('👤 UserUI init - User email:', initialUser?.email);
    return initialUser;
  });

  const [activeTab, setActiveTab] = useState(() => {
    try {
      const savedTab = localStorage.getItem("userActiveTab");
      if (
        savedTab &&
        ["home", "found", "lost", "chat", "profile", "posts", "matches"].includes(savedTab)
      ) {
        return savedTab;
      }
    } catch { }
    return "home";
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [chatTarget, setChatTarget] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [posts, setPosts] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [tabInitialized, setTabInitialized] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [toastNotification, setToastNotification] = useState(null);
  const [profileTargetUser, setProfileTargetUser] = useState(null); // State để lưu user cần xem profile
  const [unreadMessageCount, setUnreadMessageCount] = useState(0); // ✅ Unread messages count


  const handlePostViewed = (postId) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, views: (p.views || 0) + 1 } : p
      )
    );
  };

  useEffect(() => {
    // 🔹 Cập nhật user state khi initialUser thay đổi (từ login/logout)
    if (initialUser) {
      console.log('🔄 Updating user from initialUser prop:', initialUser.email);
      setUser(initialUser);
    }
  }, [initialUser]);

  useEffect(() => {
    aiMatchingService.startScanning();
    return () => aiMatchingService.stopScanning();
  }, []);

  const handleProfileUpdate = (updatedUser) => {
    // 🔹 Cập nhật user state
    setUser(updatedUser);

    // 🔹 QUAN TRỌNG: Cập nhật userData trong localStorage với tên mới
    // Map backend fields sang frontend fields
    const mappedUser = {
      ...updatedUser,
      name: updatedUser.user_name || updatedUser.name,
      phone: updatedUser.phone_number || updatedUser.phone,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
      address: updatedUser.address || '',
      account_id: updatedUser.account_id,
      role: updatedUser.role
    };

    // Clear old cache và lưu user mới
    userApi.updateUserData(mappedUser);

    console.log('✅ Profile updated in localStorage:', mappedUser.name);
  };

  useEffect(() => setTabInitialized(true), []);

  useEffect(() => {
    if (activeTab && tabInitialized)
      localStorage.setItem("userActiveTab", activeTab);
  }, [activeTab, tabInitialized]);

  useEffect(() => {
    if (tabInitialized && !isSearching) setSearchQuery("");
  }, [activeTab, tabInitialized, isSearching]);

  useEffect(() => {
    if (isSearching) {
      const t = setTimeout(() => setIsSearching(false), 100);
      return () => clearTimeout(t);
    }
  }, [isSearching, activeTab]);

  // Reset profileTargetUser when switching away from profile tab
  useEffect(() => {
    if (activeTab !== "profile" && profileTargetUser) {
      setProfileTargetUser(null);
    }
  }, [activeTab, profileTargetUser]);

  useEffect(() => {
    const handleShowToast = (event) => {
      if (event.detail) {
        setToastNotification({
          type: event.detail.type || "success",
          title: event.detail.title || "Bài đăng đã được duyệt",
          message: event.detail.message || "Bài viết của bạn đã được duyệt",
          postId: event.detail.postId,
          postType: event.detail.postType,
        });
      }
    };
    window.addEventListener("showToast", handleShowToast);
    return () => window.removeEventListener("showToast", handleShowToast);
  }, []);

  const handleSearch = (query) => {
    if (!query?.trim()) return;

    setIsSearching(true);
    const keyword = query.toLowerCase().trim();

    const foundResults = posts.filter(
      (p) =>
        p.type === "found" &&
        `${p.title} ${p.description} ${p.location} ${p.author} ${p.category}`
          .toLowerCase()
          .includes(keyword)
    );

    const lostResults = posts.filter(
      (p) =>
        p.type === "lost" &&
        `${p.title} ${p.description} ${p.location} ${p.author} ${p.category}`
          .toLowerCase()
          .includes(keyword)
    );

    if (foundResults.length > 0) setActiveTab("found");
    else if (lostResults.length > 0) setActiveTab("lost");
    else setActiveTab("found");
  };

  // 📌 Load posts từ API thay vì localStorage
  const loadPosts = async () => {
    try {
      setIsLoadingPosts(true);
      console.log('📋 Loading posts from API...');

      // ✅ Không filter status, backend sẽ tự động chỉ trả về Approved posts cho user
      // Hoặc có thể dùng status: 'active' (backend sẽ map 'active' -> 'Approved' trong DB)
      const response = await userApi.getPosts({
        // Không cần filter status, backend sẽ tự động filter Approved posts cho user
        limit: 100        // Load tối đa 100 posts
      });

      if (response.success && response.data) {
        const postsData = response.data.posts || response.data;
        // ✅ Filter lại để đảm bảo chỉ lấy posts có status 'active' hoặc 'Approved'
        const activePosts = Array.isArray(postsData) ? postsData.filter(p => {
          const status = (p.status || '').toLowerCase();
          return status === 'active' || status === 'approved';
        }) : [];
        setPosts(activePosts);
        console.log('✅ Loaded posts from API:', activePosts.length);
        console.log('📋 Posts data:', activePosts);
      } else {
        console.error('❌ Failed to load posts:', response.error);
        setPosts([]);
      }
    } catch (error) {
      console.error('❌ Error loading posts:', error);
      setPosts([]);
    } finally {
      setIsLoadingPosts(false);
      setIsInitialized(true);
    }
  };

  // 🔄 Silent load function - reload posts without showing loading spinner
  const loadPostsSilently = async () => {
    try {
      console.log('🔄 Silent background refresh...');

      const response = await userApi.getPosts({ limit: 100 });

      if (response.success && response.data) {
        const postsData = response.data.posts || response.data;
        const activePosts = Array.isArray(postsData) ? postsData.filter(p => {
          const status = (p.status || '').toLowerCase();
          return status === 'active' || status === 'approved';
        }) : [];

        // Only update if there are actual changes
        if (hasPostsChanged(posts, activePosts)) {
          console.log('✅ Posts changed, updating UI silently...');
          setPosts(activePosts);
        } else {
          console.log('ℹ️ No changes detected in background refresh');
        }
      }
    } catch (error) {
      console.error('❌ Silent refresh error:', error);
      // Don't show error to user, just log it
    }
  };

  // Helper function to detect if posts have changed
  const hasPostsChanged = (oldPosts, newPosts) => {
    if (oldPosts.length !== newPosts.length) {
      console.log(`📊 Post count changed: ${oldPosts.length} -> ${newPosts.length}`);
      return true;
    }

    const oldIds = new Set(oldPosts.map(p => p.id));
    const newIds = new Set(newPosts.map(p => p.id));

    // Check if any posts were added or removed
    for (const id of newIds) {
      if (!oldIds.has(id)) {
        console.log(`➕ New post detected: ${id}`);
        return true;
      }
    }

    for (const id of oldIds) {
      if (!newIds.has(id)) {
        console.log(`➖ Post removed: ${id}`);
        return true;
      }
    }

    return false;
  };

  // Load posts khi component mount
  useEffect(() => {
    loadPosts();

    // Lắng nghe event để reload posts khi có thay đổi
    const handlePostsUpdated = (event) => {
      const detail = event.detail || {};
      console.log('🔄 Posts updated event received in UserUI:', detail);
      console.log('🔄 Reloading posts...');

      // ✅ Xác định delay dựa trên action
      // Tăng delay cho delete để đảm bảo backend đã xóa xong
      let delay = 500; // Default delay
      if (detail.action === 'delete') {
        delay = 800; // ✅ Tăng delay lên 800ms để đảm bảo backend đã xóa xong (từ 300ms -> 800ms)
        console.log('🗑️ Post deleted, waiting 800ms for backend to complete deletion...');
      } else if (detail.action === 'approve') {
        delay = 500; // Approve cần thời gian để backend update status
      } else if (detail.action === 'create') {
        delay = 500; // Create delay bình thường
      } else if (detail.action === 'profileUpdate') {
        // ✅ Khi profile được update, reload tất cả posts để hiển thị tên mới
        delay = 500; // Profile update delay bình thường
        console.log('👤 Profile updated, reloading all posts to show new name...');
      } else if (detail.action === 'update') {
        // ✅ Nếu là update, chỉ reload nếu status là 'approved' hoặc 'active'
        const status = (detail.status || '').toLowerCase();
        if (status === 'approved' || status === 'active') {
          delay = 500; // Update delay bình thường
          console.log('✏️ Post updated (approved/active), reloading posts...');
        } else {
          console.log('✏️ Post updated (not approved/active), skipping reload in public tabs');
          return; // ✅ Không reload nếu status không phải approved/active
        }
      }

      console.log(`⏱️ Reloading posts in ${delay}ms for action: ${detail.action}`);
      setTimeout(() => {
        console.log('🔄 Executing reload now...');
        loadPosts();
      }, delay);
    };

    window.addEventListener("postsUpdated", handlePostsUpdated);

    return () => {
      window.removeEventListener("postsUpdated", handlePostsUpdated);
    };
  }, []);

  // 🔄 Listen cross-tab changes (khi admin approve/delete ở tab khác)
  useEffect(() => {
    const handleStorageChange = (e) => {
      // Chỉ xử lý khi key là 'postsRefreshTrigger'
      if (e.key !== 'postsRefreshTrigger') return;

      if (e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          console.log('🔄 Cross-tab refresh triggered:', data);

          // Reload posts sau một chút để đảm bảo backend đã commit
          setTimeout(() => {
            console.log('📡 Auto-refreshing posts from other tab action...');
            loadPosts();
          }, 300);
        } catch (error) {
          console.error('❌ Error parsing postsRefreshTrigger:', error);
        }
      }
    };

    // Storage event chỉ fire khi localStorage thay đổi từ TAB KHÁC
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // � Polling interval - auto refresh posts every 30 seconds (silent)
  useEffect(() => {
    // Only poll on tabs that show posts
    const shouldPoll = ['home', 'found', 'lost'].includes(activeTab);

    if (!shouldPoll || !isInitialized) {
      console.log(`⏸️ Polling paused (tab: ${activeTab}, initialized: ${isInitialized})`);
      return;
    }

    console.log(`▶️ Starting background polling for tab: ${activeTab}`);

    // Set up interval to check for updates every 30 seconds
    const intervalId = setInterval(() => {
      loadPostsSilently();
    }, 30000); // 30 seconds

    return () => {
      console.log(`⏹️ Stopping background polling for tab: ${activeTab}`);
      clearInterval(intervalId);
    };
  }, [activeTab, isInitialized, posts]); // Re-run when activeTab, isInitialized, or posts change

  // �📌 Tạo bài đăng → API thật
  const handleCreatePost = async (data) => {
    // ✅ Kiểm tra authentication trước
    if (!userApi.isAuthenticated()) {
      setToastNotification({
        type: "error",
        title: "Lỗi!",
        message: "Bạn cần đăng nhập để tạo bài đăng. Vui lòng đăng nhập lại.",
      });
      return;
    }

    // ✅ Kiểm tra token có tồn tại không
    const token = localStorage.getItem('userToken');
    if (!token) {
      setToastNotification({
        type: "error",
        title: "Lỗi!",
        message: "Token không tồn tại. Vui lòng đăng nhập lại.",
      });
      return;
    }

    // 🚀 ĐÓNG MODAL NGAY LẬP TỨC để tránh lag
    setShowCreateModal(false);

    // 🔔 Hiển thị toast "Đang xử lý..." ngay lập tức
    setToastNotification({
      type: "info",
      title: "Đang xử lý...",
      message: "Đang tạo bài đăng của bạn, vui lòng đợi trong giây lát.",
    });

    console.log('🔑 Token exists, creating post...');

    // 🔄 Xử lý tất cả logic trong background (không block UI)
    try {
      // 🖼️ Compress ảnh trước khi upload (nhanh hơn và nhẹ hơn)
      let imageBase64Array = [];

      if (Array.isArray(data.images) && data.images.length > 0) {
        const imageFiles = data.images.filter(img => img instanceof File);

        if (imageFiles.length > 0) {
          // Compress tất cả ảnh cùng lúc với chất lượng 0.8 và max size 1200x1200
          imageBase64Array = await compressImages(imageFiles, {
            maxWidth: 1200,
            maxHeight: 1200,
            quality: 0.8,
            outputFormat: 'image/jpeg'
          });
        }
      }

      const postData = {
        type: data.postType,
        title: data.title,
        description: data.description,
        category: data.category,
        location: data.location,
        images: imageBase64Array,
        contact: data.contact || user?.phone,
      };

      const response = await userApi.createPost(postData);

      if (!response.success) {
        // Nếu lỗi 401, yêu cầu đăng nhập lại
        if (response.status === 401 || response.error?.includes('token') || response.error?.includes('Unauthorized')) {
          setToastNotification({
            type: "error",
            title: "Phiên đăng nhập hết hạn",
            message: "Vui lòng đăng nhập lại để tiếp tục.",
          });
          // Có thể tự động redirect về trang login
          setTimeout(() => {
            userApi.clearAuthData();
            window.location.reload();
          }, 2000);
          return;
        }
        throw new Error(response.error || "Không thể tạo bài đăng");
      }

      // ✅ Log response để debug
      console.log('📝 Create post response:', response);

      // ✅ Post mới có status 'Pending', không hiển thị trong danh sách công khai
      // User có thể xem trong tab "Bài đăng của tôi"
      const newPost = response.data?.data || response.data;
      console.log('📄 New post created:', newPost);

      // 🚀 Không await loadPosts() - để nó chạy background, không block UI
      loadPosts();

      // ✅ Dispatch event một lần duy nhất (loại bỏ setTimeout 300ms)
      window.dispatchEvent(new CustomEvent('postsUpdated', {
        detail: {
          action: 'create',
          postId: newPost?.id || newPost?.post_id,
          type: data.postType,
          status: 'pending'
        }
      }));

      // ✅ Thêm notification vào localStorage
      const notif = {
        id: Date.now(),
        type: "info",
        title: "Bài đăng đã được tạo",
        message: "Đang chờ admin duyệt!",
        time: new Date().toISOString(),
        read: false,
        userId: user?.name,
        postId: newPost?.id || newPost?.post_id || Date.now(),
        postType: data.postType,
        createdAt: Date.now(),
      };

      const ex = JSON.parse(localStorage.getItem("notifications") || "[]");
      ex.unshift(notif);
      localStorage.setItem("notifications", JSON.stringify(ex));

      window.dispatchEvent(new Event("notificationAdded"));

      // 🔔 Toast thành công
      setToastNotification({
        type: "success",
        title: "Thành công!",
        message: "Bài đăng đã được tạo thành công. Đang chờ admin duyệt. Bạn có thể xem trong 'Bài đăng của tôi'.",
      });

      // 🔄 Chuyển tab nếu cần
      setActiveTab(data.postType === "lost" ? "lost" : "found");
    } catch (err) {
      setToastNotification({
        type: "error",
        title: "Lỗi!",
        message: err.message || "Không thể tạo bài đăng. Vui lòng thử lại.",
      });
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "found":
        return (
          <FoundPage
            posts={posts}
            setActiveTab={setActiveTab}
            setChatTarget={setChatTarget}
            searchQuery={searchQuery}
            onViewPost={handlePostViewed}
          />
        );
      case "lost":
        return (
          <LostPage
            posts={posts}
            setActiveTab={setActiveTab}
            setChatTarget={setChatTarget}
            searchQuery={searchQuery}
            onViewPost={handlePostViewed}
          />
        );
      case "chat":
        return (
          <ChatPage
            user={user}
            chatTarget={chatTarget}
            setActiveTab={setActiveTab}
            posts={posts}
            onOpenPostDetail={setSelectedPost}
            setProfileTargetUser={setProfileTargetUser}
          />
        );
      case "posts":
        return (
          <UserProfile
            user={user}
            posts={posts}
            setPosts={setPosts}
            onLogout={onLogout}
            defaultTab="posts"
            onProfileUpdate={handleProfileUpdate}
            onNavigateToPost={(postId, type) => {
              setActiveTab(type === "lost" ? "lost" : "found");
              setTimeout(() => {
                const el = document.getElementById(`post-${postId}`);
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }, 120);
            }}
            onShowToast={setToastNotification}
          />
        );
      case "profile":
        return (
          <UserProfile
            user={user}
            posts={posts}
            setPosts={setPosts}
            onLogout={onLogout}
            onProfileUpdate={handleProfileUpdate}
            onNavigateToPost={(postId, type) => {
              setActiveTab(type === "lost" ? "lost" : "found");
              setTimeout(() => {
                const el = document.getElementById(`post-${postId}`);
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }, 120);
            }}
            onShowToast={setToastNotification}
            viewUser={profileTargetUser}
          />
        );
      case "matches":
        return (
          <MatchesPage
            user={user}
            onNavigateToChat={(targetUser) => {
              setChatTarget(targetUser);
              setActiveTab("chat");
            }}
            onNavigateToPost={(postId, type) => {
              setActiveTab(type === "lost" ? "lost" : "found");
              setTimeout(() => {
                const el = document.getElementById(`post-${postId}`);
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }, 120);
            }}
          />
        );
      default:
        return (
          <UserHome
            searchQuery={searchQuery}
            onCreatePost={(type) => {
              setShowCreateModal(true);
              // You can optionally set the modal type here if needed
            }}
          />
        );
    }
  };

  // ✅ Fetch unread message count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await userApi.getConversations();
        if (response.success && response.data) {
          const conversations = response.data.data || response.data;
          // Count conversations with unread messages
          let totalUnread = 0;
          conversations.forEach(conv => {
            if (conv.last_message && !conv.last_message.is_read && conv.last_message.sender_id !== user?.account_id) {
              totalUnread++;
            }
          });
          setUnreadMessageCount(totalUnread);
        }
      } catch (error) {
        console.error('❌ Error fetching unread count:', error);
      }
    };

    if (user?.account_id) {
      fetchUnreadCount();
      // Poll every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.account_id]);

  return (
    <div className="user-dashboard">
      <UserHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        user={user}
        onLogout={onLogout}
        onCreatePostClick={() => setShowCreateModal(true)}
        onSearch={handleSearch}
        unreadMessageCount={unreadMessageCount} // ✅ Pass unread count
      />

      <main className={`user-main ${activeTab === 'home' ? 'home-page' : ''}`}>
        {isLoadingPosts && !isInitialized && (
          <>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '40px',
              minHeight: '200px'
            }}>
              <div style={{
                textAlign: 'center',
                color: '#666'
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
                <p>Đang tải bài đăng...</p>
              </div>
            </div>
          </>
        )}
        {!isLoadingPosts && renderContent()}

        {showCreateModal && (
          <CreatePostModal
            mode="create"
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreatePost}
            user={user}
          />
        )}

        {selectedPost && (
          <PostDetailModal
            post={selectedPost}
            onClose={() => setSelectedPost(null)}
            currentTab={
              selectedPost.type === "lost" ? "Đồ mất" : "Đồ nhặt được"
            }
            categoryPath={selectedPost.category}
            onNavigate={() => setSelectedPost(null)}
          />
        )}
      </main>

      {activeTab !== "chat" && (
        <NotificationsButton
          onNotificationClick={(postId, postType) => {
            // ✅ Nếu là thông báo "Bài đăng đã được duyệt", chuyển đến tab "Bài đăng của tôi"
            if (postType === "post_approved") {
              setActiveTab("posts");
              setTimeout(() => {
                const el = document.getElementById(`post-${postId}`);
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "center" });
                  el.style.transition = "box-shadow 0.3s";
                  el.style.boxShadow = "0 0 0 3px rgba(220, 20, 60, 0.4)"; // Red highlight
                  setTimeout(() => (el.style.boxShadow = ""), 2000);
                }
              }, 300);
            } else {
              // ✅ Các thông báo khác (AI matching, etc.) - chuyển đến tab lost/found
              setActiveTab(postType === "lost" ? "lost" : "found");
              setTimeout(() => {
                const el = document.getElementById(`post-${postId}`);
                if (el) {
                  el.scrollIntoView({ behavior: "smooth" });
                  el.style.transition = "box-shadow 0.3s";
                  el.style.boxShadow = "0 0 0 3px rgba(25,118,210,0.3)";
                  setTimeout(() => (el.style.boxShadow = ""), 2000);
                } else {
                  const post = posts.find((p) => p.id === postId);
                  if (post) setSelectedPost(post);
                }
              }, 300);
            }
          }}
        />
      )}

      {["home", "found", "lost", "profile", "posts"].includes(activeTab) && (
        <ThemeToggle />
      )}

      {toastNotification && (
        <ToastNotification
          notification={toastNotification}
          onClose={() => setToastNotification(null)}
          onClick={(postId, postType) => {
            setActiveTab(postType === "lost" ? "lost" : "found");
            setTimeout(() => {
              const el = document.getElementById(`post-${postId}`);
              if (el) {
                el.scrollIntoView({ behavior: "smooth" });
                el.style.transition = "box-shadow 0.3s";
                el.style.boxShadow = "0 0 0 3px rgba(25,118,210,0.3)";
                setTimeout(() => (el.style.boxShadow = ""), 2000);
              } else {
                const post = posts.find((p) => p.id === postId);
                if (post) setSelectedPost(post);
              }
            }, 300);
          }}
        />
      )}
    </div>
  );
};

export default UserUI;
