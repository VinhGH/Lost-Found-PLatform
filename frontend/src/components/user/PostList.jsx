import React, { useState, useEffect } from 'react';
import './PostList.css';
import {
  Search as SearchIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Label as LabelIcon,
  Person as PersonIcon,
  Phone as PhoneIcon
} from '@mui/icons-material';
import ImageCarousel from './ImageCarousel';

const PostList = ({ searchQuery }) => {
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [isLoading, setIsLoading] = useState(true);

  // Mock data
  useEffect(() => {
    const mockPosts = [
      {
        id: 1,
        type: 'lost',
        title: 'Mất ví da màu nâu tại quán cà phê',
        description: 'Ví da màu nâu, bên trong có CMND, bằng lái xe và một số tiền mặt...',
        location: 'Canteen DTU',
        category: 'Ví/Giấy tờ tùy thân',
        time: '2 giờ trước',
        image: '/img/sample-wallet.jpg',
        contact: '0901234567',
        author: 'Nguyễn Văn A'
      },
      {
        id: 2,
        type: 'found',
        title: 'Nhặt được điện thoại iPhone 13 Pro Max',
        description: 'Điện thoại iPhone 13 Pro Max màu xanh, có vỏ bảo vệ trong suốt...',
        location: 'Phòng máy tính A1',
        category: 'Thiết bị điện tử',
        time: '5 giờ trước',
        image: '/img/sample-phone.jpg',
        contact: '0907654321',
        author: 'Trần Thị B'
      },
      {
        id: 3,
        type: 'lost',
        title: 'Mất chìa khóa xe máy Honda',
        description: 'Chìa khóa xe máy Honda, có móc khóa hình con gấu...',
        location: 'Sân Thể Dục DTU',
        category: 'Chìa khóa',
        time: '1 ngày trước',
        image: '/img/sample-key.jpg',
        contact: '0909876543',
        author: 'Lê Văn C'
      },
      {
        id: 4,
        type: 'found',
        title: 'Nhặt được balo màu đen',
        description: 'Balo màu đen, có logo Nike, bên trong có sách và vở...',
        location: 'Thư viện DTU',
        category: 'Đồ dùng gia đình',
        time: '2 ngày trước',
        image: '/img/sample-bag.jpg',
        contact: '0904567890',
        author: 'Phạm Thị D'
      }
    ];

    // Simulate API call
    setTimeout(() => {
      setPosts(mockPosts);
      setIsLoading(false);
    }, 1000);
  }, []);

  const filteredPosts = posts.filter(post => {
    const matchesSearch = !searchQuery || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filter === 'all' || post.type === filter;
    
    return matchesSearch && matchesFilter;
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.time) - new Date(a.time);
      case 'oldest':
        return new Date(a.time) - new Date(b.time);
      case 'location':
        return a.location.localeCompare(b.location);
      default:
        return 0;
    }
  });

  if (isLoading) {
    return (
      <div className="post-list-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải danh sách...</p>
      </div>
    );
  }

  return (
    <div className="post-list">
      <div className="container">
        <div className="list-header">
          <h1 className="list-title">Tin mất & thất lạc</h1>
          <p className="list-subtitle">
            Tìm kiếm đồ vật thất lạc hoặc đăng tin về đồ bạn đã nhặt được
          </p>
        </div>

        <div className="list-filters">
          <div className="filter-group">
            <label className="filter-label">Loại tin:</label>
            <select 
              className="filter-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">Tất cả</option>
              <option value="lost">Tìm đồ</option>
              <option value="found">Nhặt được</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Sắp xếp:</label>
            <select 
              className="filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="location">Theo địa điểm</option>
            </select>
          </div>

          <div className="filter-stats">
            Tìm thấy {sortedPosts.length} tin đăng
          </div>
        </div>

        <div className="posts-grid">
          {sortedPosts.length === 0 ? (
            <div className="no-posts">
              <div className="no-posts-icon">
                <SearchIcon style={{ fontSize: '48px' }} />
              </div>
              <h3>Không tìm thấy tin đăng nào</h3>
              <p>Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
            </div>
          ) : (
            sortedPosts.map(post => {
              // Lấy danh sách ảnh: ưu tiên post.images, fallback về post.image
              const postImages = post.images && Array.isArray(post.images) && post.images.length > 0
                ? post.images
                : (post.image ? [post.image] : []);
              
              return (
              <div key={post.id} className="post-card">
                <div className="post-image-wrapper">
                  <ImageCarousel images={postImages} postId={post.id} />
                  <div className={`post-badge ${post.type}`}>
                    {post.type === 'found' ? 'Nhặt được' : 'Tìm đồ'}
                  </div>
                </div>
                
                <div className="post-content">
                  <h3 className="post-title">{post.title}</h3>
                  <p className="post-description">{post.description}</p>
                  
                  <div className="post-meta">
                    <div className="meta-item">
                      <span className="meta-icon">
                        <LocationIcon style={{ fontSize: '14px', marginRight: '4px', verticalAlign: 'middle' }} />
                      </span>
                      <span className="meta-text">{post.location}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-icon">
                        <LabelIcon style={{ fontSize: '14px', marginRight: '4px', verticalAlign: 'middle' }} />
                      </span>
                      <span className="meta-text">{post.category}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-icon">
                        <TimeIcon style={{ fontSize: '14px', marginRight: '4px', verticalAlign: 'middle' }} />
                      </span>
                      <span className="meta-text">{post.time}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-icon">
                        <PersonIcon style={{ fontSize: '14px', marginRight: '4px', verticalAlign: 'middle' }} />
                      </span>
                      <span className="meta-text">{post.author}</span>
                    </div>
                  </div>

                  <div className="post-actions">
                    <button className="btn-contact">
                      <PhoneIcon style={{ fontSize: '14px', marginRight: '4px', verticalAlign: 'middle' }} />
                      Liên hệ
                    </button>
                    <button className="btn-detail">
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              </div>
              );
            })
          )}
        </div>

        {sortedPosts.length > 0 && (
          <div className="load-more">
            <button className="btn-load-more">
              Tải thêm tin đăng
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostList;
