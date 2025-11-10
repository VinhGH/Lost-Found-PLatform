import React, { useState } from 'react';
import './ApprovedPostsView.css';
import {
  Search as LostIcon,
  CheckCircle as FoundIcon,
  LocationOn as LocationIcon,
  Folder as FolderIcon,
  CalendarToday as CalendarIcon,
  Phone as PhoneIcon,
  ThumbUp as ThumbUpIcon,
  Comment as CommentIcon,
  Share as ShareIcon,
  CameraAlt as CameraIcon,
  Article as ArticleIcon
} from '@mui/icons-material';

const ApprovedPostsView = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showComments, setShowComments] = useState({});

  // Mock data for approved posts
  const [posts] = useState([
    {
      id: 1,
      title: 'Tìm thấy ví da màu đen',
      description: 'Tìm thấy ví da màu đen tại khu vực thư viện, bên trong có thẻ sinh viên và một số tiền mặt. Ai mất vui lòng liên hệ để nhận lại.',
      type: 'found',
      category: 'Ví/Túi',
      location: 'Thư viện DTU',
      date: '2024-12-20',
      time: '14:30',
      status: 'active',
      reporter: {
        name: 'Nguyễn Văn A',
        avatar: 'A',
        studentId: '21IT001'
      },
      images: ['wallet1.jpg', 'wallet2.jpg'],
      contactInfo: '0123456789',
      likes: 12,
      comments: 3,
      shares: 1,
      commentsList: [
        {
          id: 1,
          author: 'Nguyễn Thị E',
          content: 'Tôi cũng mất ví tương tự ở khu vực này hôm qua, có thể liên hệ để xác nhận không?',
          time: '2 giờ trước'
        },
        {
          id: 2,
          author: 'Trần Văn F',
          content: 'Cảm ơn bạn đã tìm thấy, tôi sẽ liên hệ ngay để nhận lại.',
          time: '1 giờ trước'
        },
        {
          id: 3,
          author: 'Lê Thị G',
          content: 'Bạn có thể gửi ảnh chi tiết hơn không? Tôi muốn xác nhận có phải ví của mình không.',
          time: '30 phút trước'
        }
      ]
    },
    {
      id: 2,
      title: 'Mất điện thoại iPhone 13',
      description: 'Mất điện thoại iPhone 13 màu xanh tại khu vực canteen, có vỏ bảo vệ màu đen. Rất cần thiết cho việc học tập. Ai thấy vui lòng liên hệ.',
      type: 'lost',
      category: 'Điện thoại',
      location: 'Canteen DTU',
      date: '2024-12-19',
      time: '11:15',
      status: 'active',
      reporter: {
        name: 'Trần Thị B',
        avatar: 'B',
        studentId: '21IT002'
      },
      images: [],
      contactInfo: '0987654321',
      likes: 8,
      comments: 5,
      shares: 2,
      commentsList: [
        {
          id: 1,
          author: 'Phạm Văn H',
          content: 'Tôi thấy có điện thoại tương tự ở bãi xe, bạn có thể đến kiểm tra.',
          time: '3 giờ trước'
        },
        {
          id: 2,
          author: 'Hoàng Thị I',
          content: 'Mình cũng mất điện thoại ở canteen, có thể cùng tìm kiếm không?',
          time: '2 giờ trước'
        },
        {
          id: 3,
          author: 'Vũ Văn K',
          content: 'Bạn có nhớ lần cuối sử dụng điện thoại ở đâu không?',
          time: '1 giờ trước'
        },
        {
          id: 4,
          author: 'Đặng Thị L',
          content: 'Tôi sẽ hỏi bạn bè xem có ai thấy không.',
          time: '45 phút trước'
        },
        {
          id: 5,
          author: 'Bùi Văn M',
          content: 'Có thể điện thoại bị rơi ở khu vực khác, bạn nên kiểm tra lại.',
          time: '20 phút trước'
        }
      ]
    },
    {
      id: 3,
      title: 'Tìm thấy laptop Dell',
      description: 'Tìm thấy laptop Dell tại phòng máy tính, có sticker DTU trên mặt laptop. Chủ nhân vui lòng liên hệ để nhận lại.',
      type: 'found',
      category: 'Laptop',
      location: 'Phòng máy tính A1',
      date: '2024-12-18',
      time: '16:45',
      status: 'active',
      reporter: {
        name: 'Lê Văn C',
        avatar: 'C',
        studentId: '21IT003'
      },
      images: ['laptop1.jpg'],
      contactInfo: '0369852147',
      likes: 15,
      comments: 7,
      shares: 3,
      commentsList: [
        {
          id: 1,
          author: 'Ngô Văn N',
          content: 'Laptop này có vẻ giống laptop của tôi, tôi sẽ liên hệ ngay.',
          time: '4 giờ trước'
        },
        {
          id: 2,
          author: 'Dương Thị O',
          content: 'Cảm ơn bạn đã tìm thấy, tôi đã mất laptop này từ hôm qua.',
          time: '3 giờ trước'
        },
        {
          id: 3,
          author: 'Lý Văn P',
          content: 'Bạn có thể mô tả thêm về sticker DTU không?',
          time: '2 giờ trước'
        },
        {
          id: 4,
          author: 'Tôn Thị Q',
          content: 'Tôi cũng có laptop Dell tương tự, có thể là của tôi.',
          time: '1 giờ trước'
        },
        {
          id: 5,
          author: 'Hồ Văn R',
          content: 'Laptop này có password không? Tôi muốn xác nhận.',
          time: '45 phút trước'
        },
        {
          id: 6,
          author: 'Võ Thị S',
          content: 'Tôi sẽ đến phòng máy tính để kiểm tra ngay.',
          time: '30 phút trước'
        },
        {
          id: 7,
          author: 'Đinh Văn T',
          content: 'Cảm ơn bạn rất nhiều, tôi đã nhận được laptop.',
          time: '15 phút trước'
        }
      ]
    },
    {
      id: 4,
      title: 'Mất chìa khóa xe máy',
      description: 'Mất chìa khóa xe máy Honda tại bãi xe sinh viên, có móc khóa hình con gấu. Rất quan trọng, ai thấy vui lòng liên hệ ngay.',
      type: 'lost',
      category: 'Chìa khóa',
      location: 'Bãi xe sinh viên',
      date: '2024-12-17',
      time: '08:20',
      status: 'active',
      reporter: {
        name: 'Phạm Thị D',
        avatar: 'D',
        studentId: '21IT004'
      },
      images: [],
      contactInfo: '0741258963',
      likes: 6,
      comments: 2,
      shares: 1,
      commentsList: [
        {
          id: 1,
          author: 'Trương Văn U',
          content: 'Tôi thấy có chìa khóa tương tự ở bãi xe, bạn có thể đến kiểm tra.',
          time: '5 giờ trước'
        },
        {
          id: 2,
          author: 'Lâm Thị V',
          content: 'Mình cũng mất chìa khóa xe máy, có thể cùng tìm kiếm không?',
          time: '3 giờ trước'
        }
      ]
    }
  ]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e) => {
    setFilterType(e.target.value);
  };

  const toggleComments = (postId) => {
    setShowComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.reporter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || post.type === filterType;
    return matchesSearch && matchesFilter;
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

  const formatTime = (date, time) => {
    const postDate = new Date(`${date} ${time}`);
    const now = new Date();
    const diffInHours = Math.floor((now - postDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Vừa xong';
    } else if (diffInHours < 24) {
      return `${diffInHours} giờ trước`;
    } else {
      return postDate.toLocaleDateString('vi-VN');
    }
  };

  return (
    <div className="approved-posts-view">
      {/* Header */}
      <div className="page-header">
        <h2>Xem bài đăng đã duyệt</h2>
        <p>Xem các bài đăng đã được phê duyệt dưới dạng blog</p>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-filter">
          <input
            type="text"
            placeholder="Tìm kiếm bài đăng..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
          <select
            value={filterType}
            onChange={handleFilterChange}
            className="type-filter"
          >
            <option value="all">Tất cả loại</option>
            <option value="lost">Đồ mất</option>
            <option value="found">Đồ tìm thấy</option>
          </select>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="posts-feed">
        {filteredPosts.map(post => (
          <div key={post.id} className="post-card">
            {/* Post Header */}
            <div className="post-header">
              <div className="user-info">
                <div className="user-avatar">
                  {post.reporter.avatar}
                </div>
                <div className="user-details">
                  <h4 className="user-name">{post.reporter.name}</h4>
                  <p className="user-meta">
                    {post.reporter.studentId} • {formatTime(post.date, post.time)}
                  </p>
                </div>
              </div>
              <div className="post-type">
                {getTypeBadge(post.type)}
              </div>
            </div>

            {/* Post Content */}
            <div className="post-content">
              <h3 className="post-title">{post.title}</h3>
              <p className="post-description">{post.description}</p>
              
              {/* Post Details */}
              <div className="post-details">
                <div className="detail-item">
                  <span className="detail-icon"><LocationIcon /></span>
                  <span className="detail-text">{post.location}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-icon"><FolderIcon /></span>
                  <span className="detail-text">{post.category}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-icon"><CalendarIcon /></span>
                  <span className="detail-text">{new Date(post.date).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-icon"><PhoneIcon /></span>
                  <span className="detail-text">{post.contactInfo}</span>
                </div>
              </div>

              {/* Post Images */}
              {post.images.length > 0 && (
                <div className="post-images">
                  <div className="images-grid">
                    {post.images.map((image, index) => (
                      <div key={index} className="image-placeholder">
                        <span className="image-icon"><CameraIcon /></span>
                        <span className="image-name">{image}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Post Footer */}
            <div className="post-footer">
              <div className="post-stats">
                <span className="stat-item">
                  <span className="stat-icon"><ThumbUpIcon /></span>
                  <span className="stat-count">{post.likes}</span>
                </span>
                <span className="stat-item">
                  <span className="stat-icon"><CommentIcon /></span>
                  <span className="stat-count">{post.comments}</span>
                </span>
                <span className="stat-item">
                  <span className="stat-icon"><ShareIcon /></span>
                  <span className="stat-count">{post.shares}</span>
                </span>
              </div>
              <div className="post-actions">
                <button className="action-btn like">
                  <ThumbUpIcon /> Thích
                </button>
                <button 
                  className="action-btn comment"
                  onClick={() => toggleComments(post.id)}
                >
                  <CommentIcon /> Bình luận ({post.comments})
                </button>
                <button className="action-btn share">
                  <ShareIcon /> Chia sẻ
                </button>
              </div>
            </div>

            {/* Comments Section */}
            {showComments[post.id] && post.commentsList && (
              <div className="comments-section">
                <div className="comments-header">
                  <h4>Bình luận ({post.comments})</h4>
                </div>
                <div className="comments-list">
                  {post.commentsList.map(comment => (
                    <div key={comment.id} className="comment-item">
                      <div className="comment-content">
                        <span className="comment-author">{comment.author}:</span>
                        <span className="comment-text">{comment.content}</span>
                      </div>
                      <div className="comment-time">{comment.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredPosts.length === 0 && (
        <div className="no-results">
          <div className="no-results-icon"><ArticleIcon /></div>
          <h3>Không có bài đăng nào</h3>
          <p>Không tìm thấy bài đăng nào phù hợp với tiêu chí tìm kiếm.</p>
        </div>
      )}
    </div>
  );
};

export default ApprovedPostsView;
