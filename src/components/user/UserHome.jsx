import React, {useState} from 'react';
import './UserHome.css';
import CreatePostModal from "./CreatePostModal";
import userApi from '../../services/userApi';
import {
  Group as GroupIcon,
  Search as SearchIcon,
  GpsFixed as TargetIcon,
  CheckCircle as CheckIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Lightbulb as LightbulbIcon,
  Public as PublicIcon,
} from '@mui/icons-material';

const UserHome = ({ searchQuery, onOpenAuth, isAuthenticated }) => {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('lost');

  const openModal = (type) => {
    // Check if user is authenticated
    if (!isAuthenticated && !userApi.isAuthenticated()) {
      // If not authenticated, open auth form
      if (onOpenAuth) {
        onOpenAuth('login');
      }
      return;
    }
    
    setModalType(type);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleSubmit = (data) => {
    console.log("✅ Bài đăng mới:", data);
    closeModal();
  };


  return (
    <div className="user-home">
      {/* Landing Page Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Kết nối | Tìm kiếm | Hoàn trả
          </h1>
          <p className="hero-subtitle">
            Website tìm đồ thất lạc danh cho sinh viên Đại học Duy Tân<br />
            Đăng tin tìm ví, điện thoại, giấy tờ, chìa khóa, tài liệu, vật dụng cá nhân.
          </p>
          <div className="hero-features">
            <div className="feature-item">
              <GroupIcon className="feature-icon" />
              <span className="feature-text">Kết nối</span>
            </div>
            <div className="feature-item">
              <SearchIcon className="feature-icon" />
              <span className="feature-text">Tìm kiếm</span>
            </div>
            <div className="feature-item">
              <TargetIcon className="feature-icon" />
              <span className="feature-text">Hoàn trả</span>
            </div>
          </div>
          <div className="hero-actions">
            <button className="btn-primary" onClick={() => openModal('lost')}>
              Đăng Tin Tìm Đồ
            </button>
            <button className="btn-secondary" onClick={() => openModal('found')}>
              Trả Đồ Nhặt Được
            </button>
          </div>
        </div>
      </section>

      {/* About Us / How It Works Section */}
      <section className="about-section">
        <div className="about-container">
          <div className="about-header">
            <div className="about-header-line"></div>
            <PublicIcon className="about-header-icon" />
            <h2 className="about-title">Lost&Found - Website Tìm Đồ Thất Lạc Danh Cho Sinh Viên DTU</h2>
            <PublicIcon className="about-header-icon" />
            <div className="about-header-line"></div>
          </div>

          <div className="about-content">
            {/* Left Column */}
            <div className="about-left">
              <h3 className="about-subtitle">Tại sao chọn Lost&Found?</h3>
              <p className="about-description">
              Lost&Found là nền tảng kết nối cộng đồng sinh viên DTU chuyên về tìm kiếm đồ vật thất lạc. 
                Với hệ thống thông minh và cộng đồng người dùng năng động, chúng tôi đã giúp hàng nghìn người 
                tìm lại những món đồ quý giá của mình. Từ thẻ sinh viên, điện thoại, ví tiền, chìa khóa xe đến những 
                vật dụng cá nhân khác, Lost&Found luôn là cầu nối đáng tin cậy.
              </p>
              
              <h4 className="about-services-title">Dịch vụ chính của chúng tôi:</h4>
              <ul className="about-services-list">
                <li>
                  <CheckIcon className="check-icon" />
                  <span>Đăng tin tìm đồ thất lạc hoàn toàn miễn phí với hệ thống phân loại chi tiết</span>
                </li>
                <li>
                  <CheckIcon className="check-icon" />
                  <span>Kết nối trực tiếp người mất đồ và người nhặt được thông qua hệ thống chat</span>
                </li>
                <li>
                  <CheckIcon className="check-icon" />
                  <span>Tìm kiếm nhanh chóng theo địa điểm, loại đồ vật và thời gian với công nghệ AI</span>
                </li>
                <li>
                  <CheckIcon className="check-icon" />
                  <span>Với các chia sẻ kinh nghiệm và mẹo hay trong việc tìm kiếm đồ vật</span>
                </li>
              </ul>
            </div>

            {/* Right Column */}
            <div className="about-right">
              <h3 className="about-subtitle">Hướng dẫn sử dụng Lost&Found</h3>
              
              <div className="guide-box guide-box-blue">
                <h4 className="guide-box-title">Khi bạn mất đồ:</h4>
                <p className="guide-box-text">
                  Đăng tin ngay lập tức với mô tả chi tiết, hình ảnh rõ nét và thông tin liên hệ. 
                  Hệ thống sẽ đăng bài viết của bạn để những người mất đồ nhìn thấy và thông báo để liên hệ trực tiếp.
                </p>
              </div>

              <div className="guide-box guide-box-green">
                <h4 className="guide-box-title">Khi bạn nhặt được đồ:</h4>
                <p className="guide-box-text">
                  Đăng tin với hình ảnh và mô tả chung, tránh tiết lộ quá nhiều chi tiết để xác minh chủ sở hữu thật sự. 
                  Hệ thống sẽ kết nối bạn với chủ sở hữu một cách an toàn.
                </p>
              </div>

              <div className="guide-box guide-box-purple">
                <h4 className="guide-box-title">Tính năng thông minh:</h4>
                <p className="guide-box-text">
                 Lost&Found sử dụng AI để gợi ý các tin đăng có thể liên quan, phân tích hình ảnh và đề xuất 
                  tìm kiếm dựa trên dữ liệu thống kê từ các trường hợp thành công trước đó.
                </p>
              </div>

              <div className="tips-box">
                <LightbulbIcon className="tips-icon" />
                <h4 className="tips-title">Mẹo tăng cơ hội tìm lại đồ:</h4>
                <ul className="tips-list">
                  <li>Đăng tin càng sớm càng tốt sau khi phát hiện mất đồ</li>
                  <li>Mô tả chi tiết đặc điểm nhận dạng độc đáo của vật phẩm</li>
                  <li>Chia sẻ tin đăng lên mạng xã hội để lan tỏa rộng hơn</li>
                  <li>Kiểm tra thường xuyên các tin đăng mới</li>
                  <li>Liên hệ trực tiếp với những địa điểm có khả năng có đồ của bạn</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="about-footer">
            <p>
              Tham gia cộng đồng Lost&Found ngay hôm nay để trải nghiệm dịch vụ tìm đồ thất lạc hiệu quả danh cho sinh viên DTU. 
              Cùng nhau xây dựng một cộng đồng tương trợ, chia sẻ và lan tỏa yêu thương.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="container">
          <h2 className="section-title">Câu Hỏi Thường Gặp</h2>

          <div className="faq-list">
            <details className="faq-item">
              <summary>Đăng tin tìm đồ thất lạc có tốn phí không?</summary>
              <p>Không. Việc đăng tin tìm đồ thất lạc hoặc nhặt được hoàn toàn miễn phí cho sinh viên.</p>
            </details>

            <details className="faq-item">
              <summary>Nếu có thông tin về đồ thất lạc, tôi sẽ được liên lạc bằng cách nào?</summary>
              <p>Bạn sẽ được liên hệ qua số điện thoại hoặc email đã cung cấp khi đăng tin.</p>
            </details>

            <details className="faq-item">
              <summary>Bài đăng tìm đồ của tôi sẽ được chia sẻ trên những nền tảng nào?</summary>
              <p>Các bài đăng sẽ được chia sẻ trên hệ thống website và các nhóm sinh viên của Đại học Duy Tân.</p>
            </details>

            <details className="faq-item">
              <summary>Nhặt được đồ, tôi nên làm gì để trả lại chủ nhân nhanh chóng?</summary>
              <p>Bạn có thể đăng tin “Nhặt được đồ” kèm hình ảnh và mô tả chi tiết, ban quản trị sẽ giúp xác minh thông tin.</p>
            </details>

            <details className="faq-item">
              <summary>Làm thế nào để bài đăng tìm đồ của tôi hiệu quả hơn?</summary>
              <p>Hãy thêm ảnh chụp rõ ràng, mô tả chi tiết thời gian, địa điểm mất và thông tin liên hệ chính xác.</p>
            </details>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="main-footer">
        <div className="footer-container">
          <div className="footer-column">
            <div className="footer-logo">
              <SearchIcon className="footer-logo-icon" />
              <span className="footer-logo-text">Lost&Found</span>
            </div>
            <p className="footer-description">
              Lost&Found là nền tảng kết nối cộng đồng tìm kiếm, trao trả đồ vật. 
              Đăng tin nhanh chóng, tìm đồ dễ dàng, an toàn.
            </p>
          </div>

          <div className="footer-column">
            <h4 className="footer-heading">Danh mục nổi bật</h4>
            <ul className="footer-list">
              <li>Ví/Giấy tờ tùy thân</li>
              <li>Balo/Túi sách</li>
              <li>Điện thoại</li>
              <li>Tài liệu</li>
              <li>Đồ dùng cá nhân</li>
            </ul>
          </div>

          <div className="footer-column">
            <h4 className="footer-heading">Hỗ trợ sinh viên</h4>
            <ul className="footer-list">
              <li>Hướng dẫn đăng tin</li>
              <li>Chính sách bảo mật</li>
              <li>Điều khoản sử dụng</li>
              <li>Hỗ trợ quyên góp dự án</li>
            </ul>
          </div>

          <div className="footer-column">
            <h4 className="footer-heading">Liên hệ với chúng tôi</h4>
            <ul className="footer-list footer-contact">
              <li>
                <PhoneIcon className="footer-contact-icon" />
                <span>0123456789</span>
              </li>
              <li>
                <EmailIcon className="footer-contact-icon" />
                <span>Admin@dtu.edu.vn</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-copyright">
          <p>Copyright©2025 Lost&Found. Kết nối cộng đồng tìm đồ cho sinh viên.</p>
        </div>

      </footer>

      {/* Create Post Modal */}
      {showModal && (
        <CreatePostModal 
          onClose={closeModal}
          onSubmit={handleSubmit}
          initialPostType={modalType}
          lockPostType={true}
        />
      )}
    </div>
  );
};

export default UserHome;
