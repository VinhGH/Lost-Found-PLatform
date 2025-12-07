import React, { useState, useEffect } from "react";
import "./LostItemsManagement.css";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import PostDetailModal from "../user/PostDetailModal";
import userApi from "../../services/realApi"; // ✅ REAL API
import httpClient from "../../services/httpClient"; // ✅ HTTP Client với admin token
import ImageCarousel from "../user/ImageCarousel";

import {
  Search as SearchIcon,
  Search as LostIcon,
  CheckCircle as FoundIcon,
  Folder as FolderIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Delete as DeleteIcon,
  Check as ApproveIcon,
} from "@mui/icons-material";

const LostItemsManagement = ({ onPostChange }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    postId: null,
    postTitle: "",
  });
  const [selectedPost, setSelectedPost] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Load posts từ API (admin sẽ thấy tất cả bài pending)
  const loadPosts = async (skipIfLoading = true) => {
    // ✅ Tránh reload nếu đang loading (trừ khi force reload)
    if (skipIfLoading && loading) {
      console.log("⏸️ Already loading, skipping reload...");
      return;
    }

    try {
      setLoading(true);
      console.log("📋 Admin loading posts from API...");

      // ✅ Sử dụng httpClient để đảm bảo admin token được gửi
      // Backend sẽ tự động map 'pending' -> 'Pending' cho DB
      // ✅ Tăng limit lên 100 để đảm bảo lấy hết tất cả pending posts
      const response = await httpClient.get(
        "/posts",
        { status: "pending", limit: 100 },
        {},
        { preferAdmin: true }
      );

      console.log("📋 API Response:", response);

      if (response.success && response.data) {
        const allPosts = response.data.posts || response.data;
        console.log("📋 Raw posts from API:", allPosts.length);

        // Filter với cả 'pending' và 'Pending' để đảm bảo
        const pendingPosts = allPosts.filter((p) => {
          const status = (p.status || "").toLowerCase();
          const isPending = status === "pending";
          if (!isPending) {
            console.log(
              `⚠️ Post ${p.id} (${p.type}) has status: ${p.status}, skipping...`
            );
          }
          return isPending;
        });

        console.log("📋 Filtered pending posts:", pendingPosts.length);

        // ✅ Loại bỏ duplicate posts (có thể có cả lost và found với cùng ID)
        // Sử dụng Map với key là `${type}-${id}` để đảm bảo unique
        const uniquePostsMap = new Map();
        pendingPosts.forEach((post) => {
          const uniqueKey = `${post.type || "unknown"}-${
            post.id || post.post_id || "unknown"
          }`;
          if (!uniquePostsMap.has(uniqueKey)) {
            uniquePostsMap.set(uniqueKey, post);
          } else {
            console.warn(`⚠️ Duplicate post detected: ${uniqueKey}`, post);
          }
        });
        const uniquePosts = Array.from(uniquePostsMap.values());

        setPosts(uniquePosts);
        console.log("✅ Loaded pending posts:", uniquePosts.length);
        console.log("📋 Posts breakdown:", {
          total: allPosts.length,
          pending: pendingPosts.length,
          unique: uniquePosts.length,
          lost: uniquePosts.filter((p) => p.type === "lost").length,
          found: uniquePosts.filter((p) => p.type === "found").length,
        });

        // ✅ Dispatch event để AdminSidebar cập nhật count (dùng uniquePosts.length)
        window.dispatchEvent(
          new CustomEvent("pendingCountUpdated", {
            detail: { pendingCount: uniquePosts.length },
          })
        );
      } else {
        console.error(
          "❌ Failed to load posts:",
          response.error || response.message
        );
        setPosts([]);
      }
    } catch (error) {
      console.error("❌ Lỗi khi load posts:", error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // ✅ Load lần đầu
    loadPosts(false); // Force load lần đầu

    // ✅ Lắng nghe event khi có bài đăng mới được tạo/cập nhật/xóa
    const handlePostsUpdated = (event) => {
      const detail = event.detail || {};
      console.log(
        "🔄 Posts updated event received in LostItemsManagement:",
        detail
      );

      // ✅ Nếu là action create hoặc không có action (backward compatible), reload ngay
      if (!detail.action || detail.action === "create") {
        console.log("🔄 New post created, reloading pending posts...");
        // Delay nhỏ để đảm bảo backend đã lưu xong
        setTimeout(() => {
          loadPosts(true); // Skip if loading (check trong loadPosts)
        }, 500);
      } else if (detail.action === "delete" || detail.action === "approve") {
        // ✅ Nếu là delete hoặc approve, cũng reload
        console.log("🔄 Post deleted/approved, reloading pending posts...");
        setTimeout(() => {
          loadPosts(true); // Skip if loading (check trong loadPosts)
        }, 500);
      } else if (detail.action === "profileUpdate") {
        // ✅ Khi profile được update, reload để hiển thị tên mới
        console.log(
          "👤 Profile updated, reloading pending posts to show new name..."
        );
        setTimeout(() => {
          loadPosts(true); // Skip if loading (check trong loadPosts)
        }, 500);
      } else if (detail.action === "update") {
        // ✅ Nếu là update, chỉ reload nếu status là 'pending' (bài đăng chưa duyệt)
        const status = (detail.status || "").toLowerCase();
        if (status === "pending") {
          console.log("🔄 Post updated (pending), reloading pending posts...");
          setTimeout(() => {
            loadPosts(true); // Skip if loading (check trong loadPosts)
          }, 500);
        } else {
          console.log(
            "🔄 Post updated (not pending), skipping reload in pending tab"
          );
        }
      }
    };

    // ✅ Auto-refresh mỗi 10 giây để đảm bảo không bỏ sót bài đăng mới
    // ✅ Tăng interval lên 10 giây để giảm tải server và tránh reload liên tục
    const autoRefreshInterval = setInterval(() => {
      // ✅ loadPosts() sẽ tự check và skip nếu đang loading
      console.log("🔄 Auto-refreshing pending posts...");
      loadPosts(true); // Skip if loading (check trong loadPosts)
    }, 10000); // 10 giây (tăng từ 5 giây)

    // ✅ Chỉ lắng nghe 'postsUpdated' event, không lắng nghe 'storage' để tránh conflict
    window.addEventListener("postsUpdated", handlePostsUpdated);

    return () => {
      clearInterval(autoRefreshInterval);
      window.removeEventListener("postsUpdated", handlePostsUpdated);
    };
  }, []); // ✅ Empty dependency array - chỉ chạy một lần khi mount

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (value) => {
    setFilterType(value);
  };

  const handleSelectPost = (postId) => {
    setSelectedPosts((prev) =>
      prev.includes(postId)
        ? prev.filter((id) => id !== postId)
        : [...prev, postId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPosts.length === filteredPosts.length) {
      setSelectedPosts([]);
    } else {
      setSelectedPosts(filteredPosts.map((post) => post.id));
    }
  };

  // ✅ Duyệt bài đăng qua API
  const handleApprovePost = async (postId) => {
    try {
      const postToApprove = posts.find((p) => p.id === postId);
      if (!postToApprove) {
        alert("❌ Không tìm thấy bài đăng");
        return;
      }

      const adminToken = localStorage.getItem("adminToken");
      if (!adminToken) {
        alert("⚠️ Admin token không tồn tại! Vui lòng đăng nhập lại.");
        return;
      }

      console.log(`✅ Approving post ${postId} (type: ${postToApprove.type})`);

      // Gửi TYPE qua query (CHUẨN NHẤT)
      const response = await httpClient.patch(
        `/posts/${postId}/approve?type=${postToApprove.type}`,
        {}, // Không gửi body, backend không đọc body
        {},
        { preferAdmin: true }
      );

      if (response.success) {
        alert("✅ Duyệt bài thành công!");

        // reload danh sách pending
        await loadPosts(false);

        window.dispatchEvent(
          new CustomEvent("postsUpdated", {
            detail: {
              action: "approve",
              postId,
              type: postToApprove.type,
              status: "approved",
            },
          })
        );
      } else {
        alert("❌ Lỗi duyệt bài: " + (response.error || response.message));
      }
    } catch (error) {
      console.error("❌ Error approving post:", error);
      alert("❌ Lỗi: " + (error.message || "Không xác định"));
    }
  };

  // ✅ Mở modal xác nhận xóa
  const handleOpenDeleteModal = (postId, postTitle) => {
    setDeleteModal({ isOpen: true, postId, postTitle });
  };

  // ✅ Xóa bài đăng qua API và gửi thông báo
  const handleConfirmDelete = async () => {
    const { postId } = deleteModal;
    if (!postId) return;

    try {
      const postToDelete = posts.find((p) => p.id === postId);
      if (!postToDelete) {
        alert("❌ Không tìm thấy bài đăng");
        return;
      }

      // ✅ Kiểm tra admin token trước khi xóa
      const adminToken = localStorage.getItem("adminToken");
      if (!adminToken) {
        alert(
          "⚠️ Admin token không tồn tại! Vui lòng đăng nhập lại admin.\n\nNếu bạn đang ở Admin UI, hãy đăng xuất và đăng nhập lại với:\n- Email: admin@dtu.edu.vn\n- Password: Admin@123"
        );
        console.error("❌ Admin token missing! Cannot delete post.");
        return;
      }

      console.log("🔍 Before delete - Checking tokens:");
      console.log("  - adminToken:", adminToken ? "Exists" : "Missing");
      console.log(
        "  - userToken:",
        localStorage.getItem("userToken") ? "Exists" : "Missing"
      );

      // ✅ Gọi API trực tiếp qua httpClient để đảm bảo dùng admin token
      const response = await httpClient.delete(
        `/posts/${postId}`,
        { type: postToDelete.type },
        {},
        { preferAdmin: true }
      );

      if (response.success) {
        // ✅ Tạo thông báo
        const notification = {
          id: Date.now(),
          type: "warning",
          title: "Bài đăng đã bị xóa",
          message: "Bài viết của bạn đã xóa vì vi phạm tiêu chuẩn cộng đồng.",
          time: new Date().toISOString(),
          read: false,
          userId: postToDelete.author || postToDelete.reporter,
          createdAt: Date.now(),
        };

        // ✅ Lưu thông báo vào localStorage (tạm thời, sẽ chuyển sang API sau)
        const existingNotifications = JSON.parse(
          localStorage.getItem("notifications") || "[]"
        );
        existingNotifications.unshift(notification);
        localStorage.setItem(
          "notifications",
          JSON.stringify(existingNotifications)
        );

        window.dispatchEvent(new Event("notificationAdded"));

        // ✅ Đóng modal trước
        setDeleteModal({ isOpen: false, postId: null, postTitle: "" });

        // ✅ Xóa bài đăng khỏi state ngay lập tức (optimistic update)
        setPosts((prevPosts) =>
          prevPosts.filter((p) => {
            const uniqueKey = `${p.type || "unknown"}-${
              p.id || p.post_id || "unknown"
            }`;
            const deletedKey = `${postToDelete.type || "unknown"}-${
              postId || "unknown"
            }`;
            return uniqueKey !== deletedKey;
          })
        );

        console.log("🗑️ Post removed from UI immediately");

        // ✅ Reload danh sách posts từ API sau một chút để đảm bảo backend đã commit
        setTimeout(async () => {
          console.log("🔄 Reloading posts from API after delete...");
          await loadPosts(false); // Force reload, không skip
        }, 500); // Đợi 500ms để backend commit transaction

        // ✅ Dispatch event với thông tin chi tiết để các component biết bài nào bị xóa
        setTimeout(() => {
          console.log("📢 Dispatching postsUpdated event for delete action...");
          window.dispatchEvent(
            new CustomEvent("postsUpdated", {
              detail: {
                action: "delete",
                postId: postId,
                type: postToDelete.type,
              },
            })
          );

          // 🔄 Trigger cross-tab refresh bằng localStorage
          localStorage.setItem(
            "postsRefreshTrigger",
            JSON.stringify({
              action: "delete",
              postId: postId,
              type: postToDelete.type,
              timestamp: Date.now(),
            })
          );

          console.log("✅ postsUpdated event dispatched");
        }, 200); // Đợi 200ms để backend commit transaction

        if (onPostChange) onPostChange();

        alert("✅ Đã xóa bài đăng và gửi thông báo!");
      } else {
        alert(
          "❌ Không thể xóa bài: " + (response.error || "Lỗi không xác định")
        );
      }
    } catch (error) {
      console.error("❌ Lỗi khi xóa bài đăng:", error);
      alert(
        "❌ Có lỗi xảy ra khi xóa bài đăng: " +
          (error.message || "Lỗi không xác định")
      );
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.reporter || post.author)
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      post.location?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === "all" || post.type === filterType;
    return matchesSearch && matchesType;
  });

  const getTypeBadge = (type) => (
    <span
      className={`type-badge ${type === "lost" ? "type-lost" : "type-found"}`}
    >
      {type === "lost" ? (
        <>
          <LostIcon
            style={{
              fontSize: "14px",
              marginRight: "4px",
              verticalAlign: "middle",
            }}
          />
          Mất
        </>
      ) : (
        <>
          <FoundIcon
            style={{
              fontSize: "14px",
              marginRight: "4px",
              verticalAlign: "middle",
            }}
          />
          Tìm thấy
        </>
      )}
    </span>
  );

  return (
    <div className="lost-items-management">
      <div className="page-header">
        <h2>Bài viết chờ duyệt</h2>
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-number">{posts.length}</span>
            <span className="stat-label">Bài cần duyệt</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-filter">
          <div className="search-input-container">
            <input
              type="text"
              placeholder="Tìm kiếm theo tiêu đề, mô tả, người đăng hoặc địa điểm..."
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
            <button type="button" className="search-btn" title="Tìm kiếm">
              <SearchIcon />
            </button>
          </div>

          <select
            value={filterType}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="type-filter"
          >
            <option value="all">Tất cả loại</option>
            <option value="lost">Đồ mất</option>
            <option value="found">Đồ tìm thấy</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div
          className="loading-state"
          style={{ textAlign: "center", padding: "40px" }}
        >
          <p>Đang tải bài đăng chờ duyệt...</p>
        </div>
      )}

      {/* Posts Grid */}
      {!loading && (
        <div className="posts-grid">
          {filteredPosts.map((post) => {
            const postImages =
              post.images &&
              Array.isArray(post.images) &&
              post.images.length > 0
                ? post.images
                : post.image
                ? [post.image]
                : [];

            // ✅ Sử dụng key unique để tránh conflict giữa lost và found posts
            const uniqueKey = `${post.type || "unknown"}-${
              post.id || post.post_id || "unknown"
            }`;

            return (
              <div
                key={uniqueKey}
                className={`post-card ${
                  selectedPosts.includes(post.id) ? "selected" : ""
                }`}
                onClick={(e) => {
                  if (
                    !e.target.closest(".post-actions") &&
                    !e.target.closest(".post-checkbox") &&
                    !e.target.closest("input")
                  ) {
                    setSelectedPost(post);
                  }
                }}
                style={{ cursor: "pointer" }}
              >
                <div className="post-header">
                  <div className="post-type">{getTypeBadge(post.type)}</div>
                  <input
                    type="checkbox"
                    checked={selectedPosts.includes(post.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleSelectPost(post.id);
                    }}
                    className="post-checkbox"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                <div className="post-content">
                  {postImages.length > 0 && (
                    <div className="post-image-preview">
                      <ImageCarousel images={postImages} postId={post.id} />
                    </div>
                  )}
                  <h3 className="post-title">{post.title}</h3>
                  <p className="post-description">{post.description}</p>

                  <div className="post-details">
                    <div className="detail-item">
                      <span className="detail-label">
                        <FolderIcon /> danh mục
                      </span>
                      <span className="detail-value">{post.category}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">
                        <LocationIcon /> địa điểm
                      </span>
                      <span className="detail-value">{post.location}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">
                        <CalendarIcon /> ngày đăng
                      </span>
                      <span className="detail-value">
                        {post.createdAt
                          ? new Date(post.createdAt).toLocaleDateString("vi-VN")
                          : post.date
                          ? new Date(post.date).toLocaleDateString("vi-VN")
                          : "N/A"}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">
                        <PersonIcon /> người đăng
                      </span>
                      <span className="detail-value">
                        {post.author || post.reporter}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="post-footer">
                  <div
                    className="post-actions"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="action-btn approve"
                      onClick={() => handleApprovePost(post.id)}
                    >
                      <ApproveIcon /> Duyệt bài
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={() => handleOpenDeleteModal(post.id, post.title)}
                    >
                      <DeleteIcon /> Xóa bài
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && filteredPosts.length === 0 && (
        <div className="no-results">
          <p>Không có bài đăng nào chờ duyệt.</p>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() =>
          setDeleteModal({ isOpen: false, postId: null, postTitle: "" })
        }
        onConfirm={handleConfirmDelete}
        postTitle={deleteModal.postTitle}
      />

      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          currentTab={selectedPost.type === "lost" ? "Đồ mất" : "Đồ nhặt được"}
          categoryPath={selectedPost.category}
        />
      )}
    </div>
  );
};

export default LostItemsManagement;
