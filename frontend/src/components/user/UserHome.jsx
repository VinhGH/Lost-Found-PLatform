import React, { useState, useEffect, useRef } from 'react';
import './UserHome.css';
import CreatePostModal from "./CreatePostModal";
import PolicyButton from "./PolicyButton";
import PolicyModal from "./PolicyModal";
import GuideModal from "./GuideModal";
import DonationModal from "./DonationModal";
import TermsModal from "./TermsModal";
import userApi from '../../services/realApi'; // ✅ REAL API
import {
  CheckCircle as CheckIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Lightbulb as LightbulbIcon,
  Public as PublicIcon,
  Search as SearchIcon,
} from '@mui/icons-material';

const UserHome = ({ searchQuery, onOpenAuth, isAuthenticated, onCreatePost }) => {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('lost');
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const heroSectionRef = useRef(null);
  const parallaxBackgroundRef = useRef(null);

  const openModal = (type) => {
    // ✅ If onCreatePost is provided (from UserUI), use it directly
    if (onCreatePost) {
      onCreatePost(type);
      return;
    }

    // ✅ Otherwise, check authentication (for LandingPage)
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

  const handleSubmit = async (data) => {
    try {
      console.log("📤 Submitting post:", data);

      // Convert images to base64 if present
      let imageUrls = [];
      if (data.images && data.images.length > 0) {
        // Convert File objects to base64
        const base64Promises = data.images.map(file => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        });

        try {
          imageUrls = await Promise.all(base64Promises);
        } catch (error) {
          console.error("❌ Error converting images:", error);
        }
      }

      // Prepare JSON payload
      const postData = {
        type: data.postType,
        title: data.title,
        description: data.description,
        category: data.category,
        location: data.location,
        contact: data.contact,
        date: data.date,
        images: imageUrls
      };

      console.log("📦 Sending post data:", { ...postData, images: `[${imageUrls.length} images]` });

      // Call API with JSON
      const response = await userApi.createPost(postData);

      if (response.success) {
        console.log("✅ Post created successfully!");
        alert("Bài đăng đã được gửi! Admin sẽ duyệt trong thời gian sớm nhất.");
        closeModal();
      } else {
        console.error("❌ Failed to create post:", response.error);
        alert(response.error || "Không thể tạo bài đăng. Vui lòng thử lại!");
      }
    } catch (error) {
      console.error("❌ Error creating post:", error);
      alert("Đã xảy ra lỗi khi tạo bài đăng. Vui lòng thử lại!");
    }
  };

  // ✅ Parallax Effect cho Hero Section
  useEffect(() => {
    const handleScroll = () => {
      // Chỉ áp dụng parallax trên desktop (màn hình > 768px)
      if (window.innerWidth <= 768) {
        // Reset transform trên mobile
        if (parallaxBackgroundRef.current) {
          parallaxBackgroundRef.current.style.transform = 'none';
        }
        return;
      }

      if (parallaxBackgroundRef.current && heroSectionRef.current) {
        const scrollY = window.scrollY || window.pageYOffset;
        const heroSection = heroSectionRef.current;
        const rect = heroSection.getBoundingClientRect();
        const heroHeight = heroSection.offsetHeight;

        // Chỉ áp dụng parallax khi hero section còn trong viewport
        // rect.top < heroHeight nghĩa là section vẫn còn một phần trong viewport
        if (rect.top < heroHeight && rect.bottom > 0) {
          // Tính toán tốc độ parallax (background di chuyển chậm hơn 50%)
          const parallaxSpeed = 0.5;
          // Tính scroll position từ đầu hero section
          const scrollFromHero = Math.max(0, -rect.top);
          const yPos = -(scrollFromHero * parallaxSpeed);
          parallaxBackgroundRef.current.style.transform = `translate3d(0, ${yPos}px, 0)`;
        } else if (rect.top >= heroHeight) {
          // Nếu đã scroll qua hero section, reset về vị trí cuối
          const maxYPos = -(heroHeight * 0.5);
          parallaxBackgroundRef.current.style.transform = `translate3d(0, ${maxYPos}px, 0)`;
        } else {
          // Nếu chưa đến hero section, reset về vị trí đầu
          parallaxBackgroundRef.current.style.transform = 'translate3d(0, 0, 0)';
        }
      }
    };

    // Throttle scroll event để tối ưu performance
    let ticking = false;
    const optimizedScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', optimizedScroll, { passive: true });
    window.addEventListener('resize', optimizedScroll, { passive: true });

    // Gọi lần đầu để set vị trí ban đầu
    handleScroll();

    return () => {
      window.removeEventListener('scroll', optimizedScroll);
      window.removeEventListener('resize', optimizedScroll);
    };
  }, []);


  return (
    <div className="user-home">
      {/* Landing Page Hero Section với Parallax Background */}
      <section className="hero-section" ref={heroSectionRef}>
        {/* Parallax Background Layer */}
        <div
          className="hero-parallax-background"
          ref={parallaxBackgroundRef}
          style={{
            backgroundImage: `url(${process.env.PUBLIC_URL}/img/background.jpg)`
          }}
        >
          <div className="hero-background-overlay"></div>
        </div>
        {/* Content Layer */}
        <div className="hero-content">
          <h1 className="hero-title">
            Kết nối | Tìm kiếm | Hoàn trả
          </h1>
          <p className="hero-subtitle">
            Website tìm đồ thất lạc danh cho sinh viên Đại học Duy Tân<br />
            Đăng tin tìm ví, điện thoại, giấy tờ, chìa khóa, tài liệu, vật dụng cá nhân.
          </p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={() => openModal('lost')}>
              Đăng Tin Mới
            </button>
            <PolicyButton />
          </div>
        </div>
      </section>

      {/* About Us / How It Works Section */}
      <section className="about-section">
        <div className="about-container">
          <div className="about-header">
            <div className="about-header-line"></div>
            <PublicIcon className="about-header-icon" />
            <h2 className="about-title">Lost & Found - Website Tìm Đồ Thất Lạc Danh Cho Sinh Viên DTU</h2>
            <PublicIcon className="about-header-icon" />
            <div className="about-header-line"></div>
          </div>

          <div className="about-content">
            {/* Left Column */}
            <div className="about-left">
              <h3 className="about-subtitle">Tại sao chọn Lost & Found?</h3>
              <p className="about-description">
                Lost & Found là nền tảng kết nối cộng đồng sinh viên DTU chuyên về tìm kiếm đồ vật thất lạc.
                Với hệ thống thông minh và cộng đồng người dùng năng động, chúng tôi đã giúp hàng nghìn người
                tìm lại những món đồ quý giá của mình. Từ thẻ sinh viên, điện thoại, ví tiền, chìa khóa xe đến những
                vật dụng cá nhân khác, Lost & Found luôn là cầu nối đáng tin cậy.
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

              <div className="dtu-guide">
                <h4 className="about-services-title">HƯỚNG DẪN LẤY LẠI PASSWORD LOGIN MAIL DTU</h4>
                <p className="dtu-guide-text">
                  Sinh viên làm theo hướng dẫn ở file đính kèm để lấy lại password login mail DTU
                  trong trường hợp **không biết password login mail DTU**.
                </p>
                <p className="dtu-guideline-link">
                  Xem video hướng dẫn:
                  <a href="https://www.youtube.com/watch?v=lk7vPf_C9Gw" target="_blank" rel="noopener noreferrer">
                    https://www.youtube.com/watch?v=lk7vPf_C9Gw
                  </a>
                </p>
                <p className="dtu-guideline-link">
                  hoặc đọc file hướng dẫn tại đây:
                  <a href="/doc/HUONG-DAN-RESET-MAT-KHAU-MAIL-DTU.pdf" target="_blank" rel="noopener noreferrer">
                    **HUONG DAN RESET MAT KHAU MAIL DTU.pdf**
                  </a>
                </p>
              </div>
            </div>

            {/* Right Column */}
            <div className="about-right">
              <h3 className="about-subtitle">Hướng dẫn sử dụng Lost & Found</h3>

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
                  Lost & Found sử dụng AI để gợi ý các tin đăng có thể liên quan, phân tích hình ảnh và đề xuất
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
              Tham gia cộng đồng Lost & Found ngay hôm nay để trải nghiệm dịch vụ tìm đồ thất lạc hiệu quả danh cho sinh viên DTU.
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
              <img src="/img/logo_dtu.png" alt="DTU Logo" className="footer-logo-image" />
              <div className="footer-logo-text-container">
                <span className="footer-logo-title"><span className="footer-logo-tim">Tim</span>ĐoDTU</span>
                <span className="footer-logo-subtitle">DTU Lost & Found</span>
              </div>
            </div>
            <p className="footer-description">
              Lost & Found là nền tảng kết nối cộng đồng tìm kiếm, trao trả đồ vật.
              Đăng tin nhanh chóng, tìm đồ dễ dàng, an toàn.
            </p>
          </div>

          <div className="footer-column">
            <h4 className="footer-heading">Danh mục nổi bật</h4>
            <ul className="footer-list">
              <li>Ví/Túi</li>
              <li>Điện thoại</li>
              <li>Laptop</li>
              <li>Chìa khóa</li>
              <li>Phụ kiện</li>
              <li>Khác</li>
            </ul>
          </div>

          <div className="footer-column">
            <h4 className="footer-heading">Hỗ trợ sinh viên</h4>
            <ul className="footer-list">
              <li onClick={() => setShowGuideModal(true)} style={{ cursor: 'pointer' }}>Hướng dẫn đăng tin</li>
              <li onClick={() => setShowPolicyModal(true)} style={{ cursor: 'pointer' }}>Chính sách bảo mật</li>
              <li onClick={() => setShowTermsModal(true)} style={{ cursor: 'pointer' }}>Điều khoản sử dụng</li>
              <li onClick={() => setShowDonationModal(true)} style={{ cursor: 'pointer' }}>Hỗ trợ quyên góp dự án</li>
            </ul>
          </div>

          <div className="footer-column">
            <h4 className="footer-heading">Liên hệ với chúng tôi</h4>
            <ul className="footer-list footer-contact">
              <li>
                <PhoneIcon className="footer-contact-icon" />
                <span>0339464751</span>
              </li>
              <li>
                <EmailIcon className="footer-contact-icon" />
                <span>lostandfounddtu.1711@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-copyright">
          <p>Copyright©2025 Lost & Found. Kết nối cộng đồng tìm đồ cho sinh viên.</p>
        </div>

      </footer>

      {/* Create Post Modal */}
      {showModal && (
        <CreatePostModal
          onClose={closeModal}
          onSubmit={handleSubmit}
          initialPostType={modalType}
          lockPostType={false}
          user={userApi.getCurrentUser()}
        />
      )}

      {/* Policy Modal */}
      {showPolicyModal && (
        <PolicyModal onClose={() => setShowPolicyModal(false)} />
      )}

      {/* Guide Modal */}
      {showGuideModal && (
        <GuideModal onClose={() => setShowGuideModal(false)} />
      )}

      {/* Donation Modal */}
      {showDonationModal && (
        <DonationModal onClose={() => setShowDonationModal(false)} />
      )}

      {/* Terms Modal */}
      {showTermsModal && (
        <TermsModal onClose={() => setShowTermsModal(false)} />
      )}
    </div>
  );
};

export default UserHome;
