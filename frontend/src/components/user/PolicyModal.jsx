import React, { useEffect } from 'react';
import { Close as CloseIcon } from '@mui/icons-material';
import './PolicyModal.css';

const PolicyModal = ({ onClose }) => {
  // Lock body and html scroll when modal is open
  useEffect(() => {
    // Get current scroll position
    const scrollY = window.scrollY;
    
    // Add class to body to lock scroll
    document.body.classList.add('modal-open');
    document.documentElement.classList.add('modal-open');
    
    // Set inline styles as backup
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.left = '0';
    document.body.style.right = '0';
    
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      // Remove class
      document.body.classList.remove('modal-open');
      document.documentElement.classList.remove('modal-open');
      
      // Restore styles
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.documentElement.style.overflow = '';
      
      // Restore scroll position
      window.scrollTo(0, scrollY);
    };
  }, []);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="policy-overlay" onClick={onClose}>
      <div className="policy-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="policy-header">
          <h2>Chính sách & Quy định</h2>
          <button className="policy-close-btn" onClick={onClose} aria-label="Đóng">
            <CloseIcon />
          </button>
        </div>

        {/* Content */}
        <div className="policy-content">
          {/* 1. Điều khoản sử dụng */}
          <section className="policy-section">
            <h3 className="policy-section-title">1. Điều khoản sử dụng (Terms of Service)</h3>
            <p className="policy-text">
              Lost & Found là nền tảng hỗ trợ sinh viên DTU đăng tin tìm đồ thất lạc và kết nối chủ nhân thật sự. Khi sử dụng hệ thống, bạn đồng ý rằng:
            </p>
            <ul className="policy-list">
              <li>Tất cả thông tin đăng tải phải <strong>chính xác</strong>, <strong>trung thực</strong> và <strong>không gây hiểu lầm</strong>.</li>
              <li>Không được đăng tin sai sự thật, spam hoặc các nội dung mang mục đích gây rối.</li>
              <li>Không được sử dụng hình ảnh, thông tin cá nhân của người khác khi chưa được phép.</li>
              <li>Nền tảng có quyền ẩn, xoá hoặc từ chối các bài đăng vi phạm quy định.</li>
              <li>Hệ thống có thể gửi thông báo qua email hoặc ứng dụng nếu có cập nhật liên quan đến bài đăng.</li>
            </ul>
            <p className="policy-text">
              Việc tiếp tục sử dụng nền tảng đồng nghĩa bạn đồng ý với toàn bộ điều khoản này.
            </p>
          </section>

          {/* 2. Chính sách đăng tin */}
          <section className="policy-section">
            <h3 className="policy-section-title">2. Chính sách đăng tin</h3>
            <p className="policy-text">
              Để đảm bảo môi trường sử dụng an toàn và hiệu quả, mọi bài đăng phải tuân thủ:
            </p>

            <div className="policy-subsection">
              <h4 className="policy-subtitle">2.1. Quy định đối với tin "Mất đồ"</h4>
              <ul className="policy-list">
                <li>Mô tả rõ ràng, chi tiết (màu sắc, đặc điểm nhận dạng, thời gian, địa điểm).</li>
                <li>Hình ảnh rõ nét (nếu có).</li>
                <li>Không tiết lộ thông tin nhạy cảm (CMND, thẻ sinh viên quá rõ, số seri thiết bị…).</li>
                <li>Thêm thông tin liên hệ hợp lệ để người nhặt trả lại có thể kết nối.</li>
              </ul>
            </div>

            <div className="policy-subsection">
              <h4 className="policy-subtitle">2.2. Quy định đối với tin "Nhặt được"</h4>
              <ul className="policy-list">
                <li>Đăng hình ảnh vật nhặt được nhưng <strong>che bớt</strong> các đặc điểm quan trọng (để chủ thực xác minh).</li>
                <li>Không tiết lộ toàn bộ thông tin vật phẩm có giá trị cao.</li>
                <li>Không được yêu cầu tiền chuộc, trả phí hoặc trao đổi lợi ích.</li>
                <li>Giao vật đúng người – đúng chủ, tránh trường hợp trả nhầm.</li>
              </ul>
            </div>
          </section>

          {/* 3. Quy định cộng đồng */}
          <section className="policy-section">
            <h3 className="policy-section-title">3. Quy định cộng đồng (Community Rules)</h3>
            <p className="policy-text">
              Tất cả người dùng phải tuân thủ các quy định sau:
            </p>
            <ul className="policy-list">
              <li>Không xúc phạm, miệt thị hoặc quấy rối người khác.</li>
              <li>Không đăng nội dung vi phạm pháp luật, chống phá, đồi trụy hoặc bạo lực.</li>
              <li>Không lạm dụng nền tảng cho mục đích thương mại, quảng cáo hoặc thu lợi cá nhân.</li>
              <li>Không dùng platform để dụ dỗ, thu thập dữ liệu cá nhân trái phép.</li>
            </ul>
            <p className="policy-text policy-warning">
              Vi phạm nhiều lần có thể dẫn đến <strong>khóa tài khoản</strong>.
            </p>
          </section>

          {/* 4. Chính sách bảo mật */}
          <section className="policy-section">
            <h3 className="policy-section-title">4. Chính sách bảo mật thông tin (Privacy Policy)</h3>
            <p className="policy-text">
              Lost & Found cam kết bảo vệ dữ liệu của sinh viên:
            </p>

            <div className="policy-subsection">
              <h4 className="policy-subtitle">Chúng tôi thu thập:</h4>
              <ul className="policy-list">
                <li>Email DTU</li>
                <li>Tên, avatar, số điện thoại (nếu người dùng cung cấp)</li>
                <li>Thông tin bài đăng</li>
                <li>Lịch sử kết nối giữa người nhặt và người mất</li>
              </ul>
            </div>

            <div className="policy-subsection">
              <h4 className="policy-subtitle">Chúng tôi sử dụng dữ liệu để:</h4>
              <ul className="policy-list">
                <li>Kết nối người dùng đúng mục đích (trả đồ – nhận đồ)</li>
                <li>Gửi thông báo liên quan đến bài đăng</li>
                <li>Hỗ trợ thống kê cải thiện hệ thống</li>
              </ul>
            </div>

            <div className="policy-subsection">
              <h4 className="policy-subtitle">Chúng tôi <strong>không bao giờ</strong>:</h4>
              <ul className="policy-list">
                <li>Bán dữ liệu cho bên thứ ba</li>
                <li>Sử dụng dữ liệu cho mục đích thương mại</li>
                <li>Công khai thông tin cá nhân khi không được phép</li>
              </ul>
            </div>

            <p className="policy-text">
              Người dùng có quyền yêu cầu sửa hoặc xoá dữ liệu bất cứ lúc nào.
            </p>
          </section>

          {/* 5. Trách nhiệm người dùng */}
          <section className="policy-section">
            <h3 className="policy-section-title">5. Trách nhiệm của người dùng</h3>
            <p className="policy-text">
              Bạn chịu trách nhiệm hoàn toàn với mọi nội dung đăng tải. Bạn cam kết:
            </p>
            <ul className="policy-list">
              <li>Đăng tin đúng sự thật.</li>
              <li>Không giấu thông tin quan trọng khi nhặt được đồ.</li>
              <li>Không giả mạo mất đồ để chiếm đoạt tài sản.</li>
              <li>Không sử dụng nền tảng để lừa đảo hoặc đòi phí chuộc.</li>
              <li>Tự chịu trách nhiệm khi trao đổi liên hệ bên ngoài nền tảng.</li>
            </ul>
          </section>

          {/* 6. Quy định về AI Matching */}
          <section className="policy-section">
            <h3 className="policy-section-title">6. Quy định về tính năng AI Matching</h3>
            <p className="policy-text">
              Nền tảng sử dụng AI để gợi ý bài đăng có thể trùng khớp. Tuy nhiên:
            </p>
            <ul className="policy-list">
              <li>AI chỉ đóng vai trò <strong>gợi ý</strong>, không đảm bảo chính xác 100%.</li>
              <li>Người dùng phải <strong>tự xác minh</strong> thông tin trước khi liên hệ.</li>
              <li>Đội ngũ hệ thống không chịu trách nhiệm cho các kết luận sai lệch do người dùng tự suy diễn từ gợi ý AI.</li>
            </ul>
            <p className="policy-text">
              Để đảm bảo an toàn, hãy luôn kiểm tra kỹ trước khi trao vật phẩm.
            </p>
          </section>

          {/* Footer */}
          <div className="policy-footer">
            <p className="policy-footer-text">
              Bằng việc tiếp tục sử dụng Lost & Found, bạn đồng ý với toàn bộ điều khoản và chính sách trên.
              Nếu bạn có thắc mắc hoặc cần hỗ trợ, vui lòng liên hệ đội ngũ quản trị hệ thống.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PolicyModal;

