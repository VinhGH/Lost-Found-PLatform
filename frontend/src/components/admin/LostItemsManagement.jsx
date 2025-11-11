import React, { useState } from 'react';
import './LostItemsManagement.css';
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
  Close as RejectIcon
} from '@mui/icons-material';

const LostItemsManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedPosts, setSelectedPosts] = useState([]);

  // Mock data for lost items posts
  const [posts, setPosts] = useState([
    {
      id: 1,
      title: 'Tìm thấy ví da màu đen',
      description: 'Tìm thấy ví da màu đen tại khu vực thư viện, bên trong có thẻ sinh viên và một số tiền mặt.',
      type: 'found',
      category: 'Ví/Túi',
      location: 'Thư viện DTU',
      date: '2024-12-20',
      status: 'active',
      reporter: 'Nguyễn Văn A',
      reporterEmail: 'nguyenvana@dtu.edu.vn',
      images: ['wallet1.jpg', 'wallet2.jpg'],
      contactInfo: '0123456789'
    },
    {
      id: 2,
      title: 'Mất điện thoại iPhone 13',
      description: 'Mất điện thoại iPhone 13 màu xanh tại khu vực canteen, có vỏ bảo vệ màu đen.',
      type: 'lost',
      category: 'Điện thoại',
      location: 'Canteen DTU',
      date: '2024-12-19',
      status: 'pending',
      reporter: 'Trần Thị B',
      reporterEmail: 'tranthib@dtu.edu.vn',
      images: [],
      contactInfo: '0987654321'
    },
    {
      id: 3,
      title: 'Tìm thấy laptop Dell',
      description: 'Tìm thấy laptop Dell tại phòng máy tính, có sticker DTU trên mặt laptop.',
      type: 'found',
      category: 'Laptop',
      location: 'Phòng máy tính A1',
      date: '2024-12-18',
      status: 'pending',
      reporter: 'Lê Văn C',
      reporterEmail: 'levanc@dtu.edu.vn',
      images: ['laptop1.jpg'],
      contactInfo: '0369852147'
    },
    {
      id: 4,
      title: 'Mất chìa khóa xe máy',
      description: 'Mất chìa khóa xe máy Honda tại bãi xe sinh viên, có móc khóa hình con gấu.',
      type: 'lost',
      category: 'Chìa khóa',
      location: 'Bãi xe sinh viên',
      date: '2024-12-17',
      status: 'pending',
      reporter: 'Phạm Thị D',
      reporterEmail: 'phamthid@dtu.edu.vn',
      images: [],
      contactInfo: '0741258963'
    },
    {
      id: 5,
      title: 'Tìm thấy tai nghe AirPods',
      description: 'Tìm thấy tai nghe AirPods màu trắng tại khu vực sân thể thao.',
      type: 'found',
      category: 'Phụ kiện',
      location: 'Sân thể thao DTU',
      date: '2024-12-16',
      status: 'pending',
      reporter: 'Hoàng Văn E',
      reporterEmail: 'hoangvane@dtu.edu.vn',
      images: ['airpods1.jpg'],
      contactInfo: '0852147369'
    }
  ]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (filterType, value) => {
    if (filterType === 'status') {
      setFilterStatus(value);
    } else if (filterType === 'type') {
      setFilterType(value);
    }
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

  const handleStatusChange = (postId, newStatus) => {
    setPosts(prev => prev.map(post => 
      post.id === postId ? { ...post, status: newStatus } : post
    ));
  };

  const handleBulkAction = (action) => {
    if (action === 'approve') {
      setPosts(prev => prev.map(post => 
        selectedPosts.includes(post.id) 
          ? { ...post, status: 'active' }
          : post
      ));
    } else if (action === 'reject') {
      setPosts(prev => prev.map(post => 
        selectedPosts.includes(post.id) 
          ? { ...post, status: 'rejected' }
          : post
      ));
    } else if (action === 'delete') {
      if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedPosts.length} bài đăng đã chọn?`)) {
        setPosts(prev => prev.filter(post => !selectedPosts.includes(post.id)));
        setSelectedPosts([]);
      }
    }
  };

  const handleDeletePost = (postId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài đăng này?')) {
      setPosts(prev => prev.filter(post => post.id !== postId));
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.reporter.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || post.status === filterStatus;
    const matchesType = filterType === 'all' || post.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { class: 'status-active', text: 'Đã duyệt' },
      pending: { class: 'status-pending', text: 'Chờ duyệt' },
      rejected: { class: 'status-rejected', text: 'Từ chối' }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <span className={`status-badge ${config.class}`}>{config.text}</span>;
  };

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
        <h2>Danh sách bài chờ duyệt</h2>
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-number">{posts.filter(p => p.status === 'pending').length}</span>
            <span className="stat-label">Bài cần duyệt</span>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
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
              onClick={() => {
                // Trigger search functionality
                console.log('Searching for:', searchTerm);
              }}
              title="Tìm kiếm"
            >
              <SearchIcon />
            </button>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="status-filter"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ duyệt</option>
            <option value="active">Đã duyệt</option>
            <option value="rejected">Từ chối</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="type-filter"
          >
            <option value="all">Tất cả loại</option>
            <option value="lost">Đồ mất</option>
            <option value="found">Đồ tìm thấy</option>
          </select>
        </div>

        {selectedPosts.length > 0 && (
          <div className="bulk-actions">
            <span className="selected-count">
              Đã chọn {selectedPosts.length} bài đăng
            </span>
            <button 
              className="bulk-btn approve"
              onClick={() => handleBulkAction('approve')}
            >
              Duyệt bài
            </button>
            <button 
              className="bulk-btn reject"
              onClick={() => handleBulkAction('reject')}
            >
              Từ chối
            </button>
            <button 
              className="bulk-btn delete"
              onClick={() => handleBulkAction('delete')}
            >
              Xóa bài
            </button>
          </div>
        )}
      </div>

      {/* Posts Grid */}
      <div className="posts-grid">
        {filteredPosts.map(post => (
          <div key={post.id} className={`post-card ${selectedPosts.includes(post.id) ? 'selected' : ''}`}>
            <div className="post-header">
              <div className="post-type">{getTypeBadge(post.type)}</div>
              <input
                type="checkbox"
                checked={selectedPosts.includes(post.id)}
                onChange={() => handleSelectPost(post.id)}
                className="post-checkbox"
              />
            </div>
            
            <div className="post-content">
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
                  <span className="detail-value">{new Date(post.date).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label"><PersonIcon /> người đăng</span>
                  <span className="detail-value">{post.reporter}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label"><EmailIcon /> email</span>
                  <span className="detail-value">{post.reporterEmail}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label"><PhoneIcon /> liên hệ</span>
                  <span className="detail-value">{post.contactInfo}</span>
                </div>
              </div>

              {post.images.length > 0 && (
                <div className="post-images">
                  <span className="images-label">Hình ảnh:</span>
                  <div className="images-list">
                    {post.images.map((image, index) => (
                      <span key={index} className="image-item">{image}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="post-footer">
              <div className="post-status">
                {getStatusBadge(post.status)}
              </div>
              <div className="post-actions">
                <button 
                  className="action-btn approve"
                  onClick={() => handleStatusChange(post.id, 'active')}
                  disabled={post.status === 'active'}
                >
                  <ApproveIcon /> Duyệt
                </button>
                <button 
                  className="action-btn reject"
                  onClick={() => handleStatusChange(post.id, 'rejected')}
                  disabled={post.status === 'rejected'}
                >
                  <RejectIcon /> Từ chối
                </button>
                <button 
                  className="action-btn delete"
                  onClick={() => handleDeletePost(post.id)}
                >
                  <DeleteIcon /> Xóa
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPosts.length === 0 && (
        <div className="no-results">
          <p>Không tìm thấy bài đăng nào phù hợp với tiêu chí tìm kiếm.</p>
        </div>
      )}
    </div>
  );
};

export default LostItemsManagement;
