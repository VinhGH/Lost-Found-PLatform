import React, { useState, useEffect } from "react";
import "./ApprovedPostsView.css";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import PostDetailModal from "../user/PostDetailModal";
import ImageCarousel from "../user/ImageCarousel";
import httpClient from "../../services/httpClient"; // ✅ HTTP Client với admin token
import userApi from "../../services/realApi"; // ✅ API service
import {
  Search as SearchIcon,
  Search as LostIcon,
  CheckCircle as FoundIcon,
  LocationOn as LocationIcon,
  Folder as FolderIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";

const ApprovedPostsView = ({ onPostChange }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    postId: null,
    postTitle: "",
  });
  const [selectedPost, setSelectedPost] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPosts, setSelectedPosts] = useState([]); // ✅ Selection State
  const [isSelectionMode, setIsSelectionMode] = useState(false); // ✅ Selection Mode

  // ✅ Load posts từ API (admin sẽ thấy tất cả bài đã duyệt)
  const loadPosts = async () => {
    try {
      setLoading(true);
      console.log("📋 Admin loading approved posts from API...");

      // ✅ Sử dụng httpClient để đảm bảo admin token được gửi
      // Load posts với status='active' và limit=100 để hiển thị tất cả bài đã duyệt
      const response = await httpClient.get(
        "/posts",
        { status: "active", limit: 100 },
        {},
        { preferAdmin: true }
      );

      if (response.success && response.data) {
        const allPosts = response.data.posts || response.data;
        // Filter với cả 'active' và 'approved' để đảm bảo
        const approvedPosts = allPosts.filter((p) => {
          const status = (p.status || "").toLowerCase();
          return status === "active" || status === "approved";
        });
        setPosts(approvedPosts);
        console.log("✅ Loaded approved posts:", approvedPosts.length);
        console.log("📋 Approved posts:", approvedPosts);
      } else {
        console.error(
          "❌ Failed to load approved posts:",
          response.error || response.message
        );
        setPosts([]);
      }
    } catch (error) {
      console.error("❌ Lỗi khi load approved posts:", error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();

    const handlePostsUpdated = (event) => {
      const detail = event.detail || {};
      console.log(
        "🔄 Posts updated event received in ApprovedPostsView:",
        detail
      );

      // ✅ Reload nếu là delete hoặc update (với status approved/active)
      if (detail.action === "delete") {
        console.log("🔄 Post deleted, reloading approved posts...");
        setTimeout(() => {
          loadPosts();
        }, 500);
      } else if (detail.action === "profileUpdate") {
        // ✅ Khi profile được update, reload để hiển thị tên mới
        console.log(
          "👤 Profile updated, reloading approved posts to show new name..."
        );
        setTimeout(() => {
          loadPosts();
        }, 500);
      } else if (detail.action === "update") {
        // ✅ Nếu là update, chỉ reload nếu status là 'approved' hoặc 'active'
        const status = (detail.status || "").toLowerCase();
        if (status === "approved" || status === "active") {
          console.log(
            "🔄 Post updated (approved/active), reloading approved posts..."
          );
          setTimeout(() => {
            loadPosts();
          }, 500);
        } else {
          console.log(
            "🔄 Post updated (not approved/active), skipping reload in approved tab"
          );
        }
      }
    };

    window.addEventListener("postsUpdated", handlePostsUpdated);

    return () => {
      window.removeEventListener("postsUpdated", handlePostsUpdated);
    };
  }, []);

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

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedPosts([]);
  };

  // ✅ Xử lý xóa nhiều bài cùng lúc
  const handleBulkDelete = async () => {
    if (!window.confirm(`⚠️ CẢNH BÁO: Bạn có chắc muốn XÓA VĨNH VIỄN ${selectedPosts.length} bài đăng đã chọn? Hành động này không thể hoàn tác!`)) {
      return;
    }

    try {
      const promises = selectedPosts.map(postId => {
        const post = posts.find(p => p.id === postId);
        if (!post) return Promise.resolve();
        return httpClient.delete(
          `/posts/${postId}`,
          { type: post.type },
          {},
          { preferAdmin: true }
        );
      });

      await Promise.all(promises);

      alert(`✅ Đã xóa ${selectedPosts.length} bài đăng!`);

      setSelectedPosts([]);
      setIsSelectionMode(false);
      loadPosts();

      // Notify other components
      window.dispatchEvent(
        new CustomEvent("postsUpdated", {
          detail: { action: "bulk_delete", count: selectedPosts.length }
        })
      );

    } catch (error) {
      console.error("❌ Bulk delete error:", error);
      alert("❌ Có lỗi xảy ra khi xóa nhiều bài.");
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
      // httpClient sẽ tự động lấy admin token từ localStorage (ưu tiên adminToken)
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
          message:
            "Bài viết của bạn đã xóa vì vi phạm tiêu chuẩn cộng đồng của chúng tôi.",
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

        // ✅ Trigger event để NotificationsButton reload
        window.dispatchEvent(new Event("notificationAdded"));

        // ✅ Reload danh sách posts từ API
        await loadPosts();

        setDeleteModal({ isOpen: false, postId: null, postTitle: "" });

        // ✅ Dispatch event với thông tin chi tiết để các component biết bài nào bị xóa
        // Đợi một chút để đảm bảo backend đã commit transaction xóa bài đăng
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

        alert("✅ Đã xóa bài đăng và gửi thông báo đến người dùng!");
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
      (post.reporter?.name || post.author)
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      post.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || post.type === filterType;
    return matchesSearch && matchesType;
  });

  const getTypeBadge = (type) => {
    return (
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
  };

  return (
    <div className="approved-posts-view">
      {/* Header */}
      <div className="page-header">
        <h2>Bài viết đã duyệt</h2>
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-number">{posts.length}</span>
            <span className="stat-label">Bài đã duyệt</span>
          </div>
          <button
            className={`btn-select-mode ${isSelectionMode ? 'active' : ''}`}
            onClick={toggleSelectionMode}
          >
            {isSelectionMode ? 'Hủy chọn' : 'Chọn nhiều'}
          </button>
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

      {/* ✅ Bulk Action Bar */}
      {
        isSelectionMode && (
          <div className="bulk-action-bar-admin">
            <div className="bulk-info">
              <span className="selected-count">{selectedPosts.length} đã chọn</span>
              <button className="btn-text" onClick={handleSelectAll}>
                {selectedPosts.length === filteredPosts.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
              </button>
            </div>
            <div className="bulk-actions">
              <button
                className="btn-bulk-delete"
                onClick={handleBulkDelete}
                disabled={selectedPosts.length === 0}
              >
                <DeleteIcon fontSize="small" /> Xóa ({selectedPosts.length})
              </button>
            </div>
          </div>
        )
      }

      {/* Loading State */}
      {
        loading && (
          <div
            className="loading-state"
            style={{ textAlign: "center", padding: "40px" }}
          >
            <p>Đang tải bài đăng đã duyệt...</p>
          </div>
        )
      }

      {/* Posts Grid */}
      {
        !loading && (
          <div className="posts-grid">
            {filteredPosts.map((post) => {
              // Lấy danh sách ảnh: ưu tiên post.images, fallback về post.image
              const postImages =
                post.images &&
                  Array.isArray(post.images) &&
                  post.images.length > 0
                  ? post.images
                  : post.image
                    ? [post.image]
                    : [];

              return (
                <div
                  key={`${post.type}-${post.id}`}
                  className="post-card"
                  onClick={(e) => {
                    // Chỉ mở modal nếu không click vào button
                    if (!e.target.closest(".post-actions")) {
                      setSelectedPost(post);
                    }
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <div className="post-header">
                    <div className="post-type">{getTypeBadge(post.type)}</div>
                    {isSelectionMode && (
                      <div
                        className="post-checkbox-wrapper"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectPost(post.id);
                        }}
                      >
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
                    )}
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
                          {post.author || post.reporter?.name || post.reporter}
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
        )
      }

      {
        !loading && filteredPosts.length === 0 && (
          <div className="no-results">
            <p>Không có bài đăng nào đã duyệt.</p>
          </div>
        )
      }

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() =>
          setDeleteModal({ isOpen: false, postId: null, postTitle: "" })
        }
        onConfirm={handleConfirmDelete}
        postTitle={deleteModal.postTitle}
      />

      {/* Post Detail Modal */}
      {
        selectedPost && (
          <PostDetailModal
            post={selectedPost}
            onClose={() => setSelectedPost(null)}
            currentTab={selectedPost.type === "lost" ? "Đồ mất" : "Đồ nhặt được"}
            categoryPath={selectedPost.category}
          />
        )
      }
    </div >
  );
};

export default ApprovedPostsView;
