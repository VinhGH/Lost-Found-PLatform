import React, { useState, useEffect } from 'react';
import './LostItemsManagement.css';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import PostDetailModal from '../user/PostDetailModal';
import userApi from '../../services/realApi'; // ✅ REAL API
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
} from '@mui/icons-material';

const LostItemsManagement = ({ onPostChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, postId: null, postTitle: '' });
  const [selectedPost, setSelectedPost] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Load posts từ API (admin sẽ thấy tất cả bài pending)
  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);
        console.log('📋 Admin loading posts from API...');
        
        // Call API to get all posts (backend will check if user is admin)
        const response = await userApi.getAllPosts({ status: 'pending' });
        
        if (response.success && response.data) {
          const allPosts = response.data.posts || response.data;
          // Filter only pending posts
          const pendingPosts = allPosts.filter(p => p.status === 'pending');
          setPosts(pendingPosts);
          console.log('✅ Loaded pending posts:', pendingPosts.length);
        } else {
          console.error('❌ Failed to load posts:', response.error);
          setPosts([]);
        }
      } catch (error) {
        console.error("❌ Lỗi khi load posts:", error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();

    // ✅ Lắng nghe thay đổi từ localStorage
    const handleStorageChange = () => {
      loadPosts();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('postsUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('postsUpdated', handleStorageChange);
    };
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (value) => {
    setFilterType(value);
  };

  const handleSelectPost = (postId) => {
    setSelectedPosts(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPosts.length === filteredPosts.length) {
      setSelectedPosts([]);
    } else {
      setSelectedPosts(filteredPosts.map(post => post.id));
    }
  };

  // ✅ Duyệt bài đăng qua API
  const handleApprovePost = async (postId) => {
    try {
      const postToApprove = posts.find(p => p.id === postId);
      if (!postToApprove) {
        alert('❌ Không tìm thấy bài đăng');
        return;
      }

      console.log(`✅ Approving post ${postId} (type: ${postToApprove.type})`);

      // Call API to approve post
      const response = await userApi.approvePost(postId, postToApprove.type);
      
      if (response.success) {
        console.log('✅ Post approved successfully');
        
        // ✅ Gửi thông báo đến user
        const notification = {
          id: Date.now(),
          type: 'success',
          title: 'Bài đăng đã được duyệt',
          message: 'Bài viết của bạn đã được duyệt',
          time: new Date().toISOString(),
          read: false,
          userId: postToApprove.author || postToApprove.reporter,
          postId: postId,
          postType: postToApprove.type,
          createdAt: Date.now()
        };

        const existingNotifications = JSON.parse(localStorage.getItem("notifications") || "[]");
        existingNotifications.unshift(notification);
        localStorage.setItem("notifications", JSON.stringify(existingNotifications));
        
        // ✅ Trigger event
        window.dispatchEvent(new CustomEvent('notificationAdded', { detail: notification }));
        
        // Remove from pending list
        setPosts(prev => prev.filter(p => p.id !== postId));
        window.dispatchEvent(new Event('postsUpdated'));
        if (onPostChange) onPostChange();
        
        alert("✅ Đã duyệt bài đăng và gửi thông báo đến người dùng!");
      } else {
        alert('❌ Không thể duyệt bài: ' + (response.error || 'Lỗi không xác định'));
      }
    } catch (error) {
      console.error("❌ Lỗi khi duyệt bài đăng:", error);
      alert("❌ Có lỗi xảy ra khi duyệt bài đăng!");
    }
  };

  // ✅ Mở modal xác nhận xóa
  const handleOpenDeleteModal = (postId, postTitle) => {
    setDeleteModal({ isOpen: true, postId, postTitle });
  };

  // ✅ Xóa bài đăng và gửi thông báo
  const handleConfirmDelete = () => {
    const { postId } = deleteModal;
    if (!postId) return;

    try {
      const saved = localStorage.getItem("posts");
      if (saved) {
        const allPosts = JSON.parse(saved);
        const postToDelete = allPosts.find(p => p.id === postId);
        
        if (postToDelete) {
          // ✅ Xóa bài đăng
          const updatedPosts = allPosts.filter(post => post.id !== postId);
          localStorage.setItem("posts", JSON.stringify(updatedPosts));
          
          // ✅ Gửi thông báo đến user
          const notification = {
            id: Date.now(),
            type: 'warning',
            title: 'Bài đăng đã bị xóa',
            message: 'Bài viết của bạn đã xóa vì vi phạm tiêu chuẩn cộng đồng của chúng tôi.',
            time: new Date().toISOString(),
            read: false,
            userId: postToDelete.author || postToDelete.reporter,
            createdAt: Date.now() // ✅ Lưu timestamp để tính 3 ngày
          };

          // ✅ Lưu thông báo vào localStorage
          const existingNotifications = JSON.parse(localStorage.getItem("notifications") || "[]");
          existingNotifications.unshift(notification);
          localStorage.setItem("notifications", JSON.stringify(existingNotifications));
          
          // ✅ Trigger event để NotificationsButton reload
          window.dispatchEvent(new Event('notificationAdded'));
          
          setPosts(prev => prev.filter(p => p.id !== postId));
          setDeleteModal({ isOpen: false, postId: null, postTitle: '' });
          window.dispatchEvent(new Event('postsUpdated'));
          if (onPostChange) onPostChange();
          
          alert("✅ Đã xóa bài đăng và gửi thông báo đến người dùng!");
        }
      }
    } catch (error) {
      console.error("❌ Lỗi khi xóa bài đăng:", error);
      alert("❌ Có lỗi xảy ra khi xóa bài đăng!");
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (post.reporter || post.author)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || post.type === filterType;
    return matchesSearch && matchesType;
  });

  const getTypeBadge = (type) => {
    return (
      <span className={`type-badge ${type === 'lost' ? 'type-lost' : 'type-found'}`}>
        {type === 'lost' ? (
          <>
            <LostIcon style={{ fontSize: '14px', marginRight: '4px', verticalAlign: 'middle' }} />
            Mất
          </>
        ) : (
          <>
            <FoundIcon style={{ fontSize: '14px', marginRight: '4px', verticalAlign: 'middle' }} />
            Tìm thấy
          </>
        )}
      </span>
    );
  };

  return (
    <div className="lost-items-management">
      {/* Header */}
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
            <button 
              type="button"
              className="search-btn"
              title="Tìm kiếm"
            >
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

      {/* Posts Grid */}
      <div className="posts-grid">
        {filteredPosts.map(post => (
          <div 
            key={post.id} 
            className={`post-card ${selectedPosts.includes(post.id) ? 'selected' : ''}`}
            onClick={(e) => {
              // Chỉ mở modal nếu không click vào button hoặc checkbox
              if (!e.target.closest('.post-actions') && !e.target.closest('.post-checkbox') && !e.target.closest('input')) {
                setSelectedPost(post);
              }
            }}
            style={{ cursor: 'pointer' }}
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
              {post.image && (
                <div className="post-image-preview">
                  <img src={post.image} alt={post.title} />
                </div>
              )}
              <h3 className="post-title">{post.title}</h3>
              <p className="post-description">{post.description}</p>
              
              <div className="post-details">
                <div className="detail-item">
                  <span className="detail-label"><FolderIcon /> danh mục</span>
                  <span className="detail-value">{post.category}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label"><LocationIcon /> địa điểm</span>
                  <span className="detail-value">{post.location}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label"><CalendarIcon /> ngày đăng</span>
                  <span className="detail-value">
                    {post.createdAt ? new Date(post.createdAt).toLocaleDateString('vi-VN') : 
                     post.date ? new Date(post.date).toLocaleDateString('vi-VN') : 'N/A'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label"><PersonIcon /> người đăng</span>
                  <span className="detail-value">{post.author || post.reporter}</span>
                </div>
              </div>
            </div>

            <div className="post-footer">
              <div className="post-actions" onClick={(e) => e.stopPropagation()}>
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
        ))}
      </div>

      {filteredPosts.length === 0 && (
        <div className="no-results">
          <p>Không có bài đăng nào chờ duyệt.</p>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, postId: null, postTitle: '' })}
        onConfirm={handleConfirmDelete}
        postTitle={deleteModal.postTitle}
      />

      {/* Post Detail Modal */}
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
