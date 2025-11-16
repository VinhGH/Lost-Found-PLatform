import React, { useState, useEffect } from "react";
import UserHeader from "./UserHeader";
import UserHome from "./UserHome";
import UserProfile from "./UserProfile";
import FoundPage from "./FoundPage";
import LostPage from "./LostPage";
import ChatPage from "./ChatPage";
import CreatePostModal from "./CreatePostModal";
import PostDetailModal from "./PostDetailModal";

import userApi from "../../services/realApi";     // ✅ GIỮ API THẬT
import aiMatchingService from "../../services/aiMatchingService";  // ✅ GIỮ AI MATCHING

import "./UserUI.css";
import ThemeToggle from "../common/ThemeToggle.jsx";
import NotificationsButton from "../common/NotificationsButton.jsx";
import ToastNotification from "../common/ToastNotification.jsx";

const UserUI = ({ onLogout, user: initialUser }) => {
  useEffect(() => {
    if (window.__loadTheme) window.__loadTheme("user");
  }, []);

  const [user, setUser] = useState(() => {
    const currentUser = userApi.getCurrentUser();
    return currentUser || initialUser;
  });

  const [activeTab, setActiveTab] = useState(() => {
    try {
      const savedTab = localStorage.getItem("userActiveTab");
      if (
        savedTab &&
        ["home", "found", "lost", "chat", "profile", "posts"].includes(savedTab)
      ) {
        return savedTab;
      }
    } catch {}
    return "home";
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [chatTarget, setChatTarget] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [posts, setPosts] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [tabInitialized, setTabInitialized] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [toastNotification, setToastNotification] = useState(null);

  const handlePostViewed = (postId) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, views: (p.views || 0) + 1 } : p
      )
    );
  };

  useEffect(() => {
    const currentUser = userApi.getCurrentUser();
    if (currentUser) setUser(currentUser);
    else if (initialUser) setUser(initialUser);
  }, [initialUser]);

  useEffect(() => {
    aiMatchingService.startScanning();
    return () => aiMatchingService.stopScanning();
  }, []);

  const handleProfileUpdate = (updatedUser) => {
    setUser(updatedUser);
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

  const loadPosts = () => {
    try {
      const saved = localStorage.getItem("posts");
      if (saved) {
        const parsed = JSON.parse(saved);
        setPosts(Array.isArray(parsed) ? parsed : []);
      } else setPosts([]);
    } catch {
      setPosts([]);
    } finally {
      setIsInitialized(true);
    }
  };

  useEffect(() => {
    loadPosts();

    const handlePostsUpdated = () => loadPosts();

    window.addEventListener("postsUpdated", handlePostsUpdated);
    window.addEventListener("storage", (e) => {
      if (e.key === "posts") handlePostsUpdated();
    });

    return () => {
      window.removeEventListener("postsUpdated", handlePostsUpdated);
      window.removeEventListener("storage", handlePostsUpdated);
    };
  }, []);

  useEffect(() => {
    if (isInitialized)
      localStorage.setItem("posts", JSON.stringify(posts));
  }, [posts, isInitialized]);

  // 📌 Tạo bài đăng → API thật
  const handleCreatePost = async (data) => {
    try {
      const imagePromises = [];

      if (Array.isArray(data.images)) {
        for (const img of data.images) {
          if (img instanceof File) {
            imagePromises.push(
              new Promise((resolve) => {
                const r = new FileReader();
                r.onloadend = () => resolve(r.result);
                r.readAsDataURL(img);
              })
            );
          }
        }
      }

      const imageBase64Array = await Promise.all(imagePromises);

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

      if (!response.success)
        throw new Error(response.error || "Không thể tạo bài đăng");

      const newPost = response.data.post || response.data;
      setPosts((prev) => [newPost, ...prev]);

      setToastNotification({
        type: "success",
        title: "Thành công!",
        message: "Bài đăng đã được tạo và gửi lên Supabase",
      });
    } catch (err) {
      setToastNotification({
        type: "error",
        title: "Lỗi!",
        message: err.message,
      });
      return;
    }

    const notif = {
      id: Date.now(),
      type: "info",
      title: "Bài đăng đã được tạo",
      message: "Đang chờ admin duyệt!",
      time: new Date().toISOString(),
      read: false,
      userId: user?.name,
      postId: Date.now(),
      postType: data.postType,
      createdAt: Date.now(),
    };

    const ex = JSON.parse(localStorage.getItem("notifications") || "[]");
    ex.unshift(notif);
    localStorage.setItem("notifications", JSON.stringify(ex));

    window.dispatchEvent(new Event("notificationAdded"));

    setActiveTab(data.postType === "lost" ? "lost" : "found");
    setShowCreateModal(false);
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
          />
        );
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
        onCreatePostClick={() => setShowCreateModal(true)}
        onSearch={handleSearch}
      />

      <main className="user-main">
        {renderContent()}

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
