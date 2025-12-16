import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Close as CloseIcon } from '@mui/icons-material';
import './GuideModal.css';

const GuideModal = ({ onClose }) => {
    // Lock body scroll when modal is open
    useEffect(() => {
        const scrollY = window.scrollY;
        document.body.classList.add('modal-open');
        document.documentElement.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';

        return () => {
            document.body.classList.remove('modal-open');
            document.documentElement.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
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

    return ReactDOM.createPortal(
        <div className="guide-overlay" onClick={onClose}>
            <div className="guide-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="guide-header">
                    <h2>Hướng Dẫn Sử Dụng Lost & Found</h2>
                    <button className="guide-close-btn" onClick={onClose} aria-label="Đóng">
                        <CloseIcon />
                    </button>
                </div>

                {/* Content */}
                <div className="guide-content">
                    {/* 1. Đăng tin tìm đồ */}
                    <section className="guide-section">
                        <h3 className="guide-section-title">1. Đăng tin tìm đồ thất lạc</h3>
                        <p className="guide-text">
                            Để đăng tin tìm đồ thất lạc hoặc đăng tin nhặt được đồ, làm theo các bước sau:
                        </p>
                        <ul className="guide-list">
                            <li>Click vào nút <strong>"Đăng Tin Mới"</strong> ở trang chủ hoặc trên thanh menu</li>
                            <li>Chọn loại bài đăng: <strong>"Tìm đồ thất lạc"</strong> hoặc <strong>"Nhặt được đồ"</strong></li>
                            <li>Điền đầy đủ thông tin:
                                <ul className="guide-sublist">
                                    <li><strong>Tiêu đề:</strong> Mô tả ngắn gọn (ít nhất 5 ký tự)</li>
                                    <li><strong>Mô tả chi tiết:</strong> Mô tả đặc điểm, màu sắc, nhãn hiệu (ít nhất 8 ký tự)</li>
                                    <li><strong>Danh mục:</strong> Chọn loại đồ vật (Ví/Túi, Điện thoại, Laptop, Chìa khóa, Phụ kiện, Khác)</li>
                                    <li><strong>Tòa:</strong> Chọn tòa nhà nơi mất/nhặt đồ</li>
                                    <li><strong>Phòng:</strong> Số phòng (nếu có)</li>
                                    <li><strong>Địa chỉ:</strong> Vị trí cụ thể (ví dụ: Cổng số 3, Khu A)</li>
                                    <li><strong>Ngày xảy ra:</strong> Chọn ngày mất/nhặt đồ</li>
                                    <li><strong>Số điện thoại:</strong> Số điện thoại liên hệ của bạn</li>
                                </ul>
                            </li>
                            <li><strong>Upload ảnh:</strong> Tải lên 1-3 ảnh rõ nét của đồ vật</li>
                            <li>Click <strong>"Đăng bài"</strong> để hoàn tất</li>
                        </ul>
                        <p className="guide-note">
                            <strong>Lưu ý:</strong> Bài đăng sẽ được admin duyệt trước khi hiển thị công khai.
                        </p>
                    </section>

                    {/* 2. Tìm kiếm và lọc */}
                    <section className="guide-section">
                        <h3 className="guide-section-title">2. Tìm kiếm và lọc bài đăng</h3>
                        <p className="guide-text">
                            Sử dụng các công cụ tìm kiếm để nhanh chóng tìm thấy đồ vật của bạn:
                        </p>
                        <ul className="guide-list">
                            <li><strong>Thanh tìm kiếm:</strong> Nhập từ khóa (tên đồ vật, màu sắc, địa điểm) để tìm kiếm</li>
                            <li><strong>Tab "Đồ thất lạc":</strong> Xem các bài đăng tìm đồ</li>
                            <li><strong>Tab "Đồ nhặt được":</strong> Xem các bài đăng nhặt được đồ</li>
                            <li><strong>Bộ lọc:</strong> Click biểu tượng lọc để lọc theo:
                                <ul className="guide-sublist">
                                    <li><strong>Tòa:</strong> Lọc theo tòa nhà</li>
                                    <li><strong>Danh mục:</strong> Lọc theo loại đồ vật</li>
                                    <li><strong>Ngày đăng:</strong> Lọc theo thời gian (24 giờ, 3 ngày, 7 ngày, 30 ngày)</li>
                                </ul>
                            </li>
                            <li>Click vào bài đăng để xem chi tiết và liên hệ</li>
                        </ul>
                    </section>

                    {/* 3. AI Matching */}
                    <section className="guide-section">
                        <h3 className="guide-section-title">3. Tính năng AI Matching</h3>
                        <p className="guide-text">
                            Hệ thống AI tự động phân tích và gợi ý các bài đăng có thể trùng khớp với đồ vật của bạn:
                        </p>
                        <ul className="guide-list">
                            <li><strong>Tự động phân tích:</strong> AI so sánh hình ảnh, mô tả, địa điểm, thời gian của các bài đăng</li>
                            <li><strong>Tab "AI Matches":</strong> Xem các bài đăng được AI gợi ý có thể là đồ của bạn</li>
                            <li><strong>Điểm tương đồng:</strong> Mỗi match hiển thị % độ tương đồng</li>
                            <li><strong>Thông báo:</strong> Nhận thông báo khi AI tìm thấy match mới</li>
                            <li><strong>Nhắn tin nhanh:</strong> Click "Nhắn tin" để liên hệ trực tiếp với người đăng</li>
                        </ul>
                        <p className="guide-note">
                            <strong>Lưu ý:</strong> AI chỉ gợi ý, bạn cần tự xác minh thông tin trước khi giao nhận.
                        </p>
                    </section>

                    {/* 4. Chat và liên hệ */}
                    <section className="guide-section">
                        <h3 className="guide-section-title">4. Chat và liên hệ</h3>
                        <p className="guide-text">
                            Liên hệ trực tiếp với người đăng qua hệ thống chat:
                        </p>
                        <ul className="guide-list">
                            <li>Click nút <strong>"Nhắn tin"</strong> trên bài đăng</li>
                            <li>Gửi tin nhắn để xác minh thông tin đồ vật</li>
                            <li><strong>Xác minh kỹ:</strong> Hỏi các đặc điểm chi tiết chỉ chủ nhân mới biết</li>
                            <li>Hẹn địa điểm giao nhận an toàn (ưu tiên địa điểm công cộng)</li>
                            <li>Xem lịch sử chat trong tab <strong>"Chat"</strong></li>
                        </ul>
                        <p className="guide-warning">
                            <strong>Cảnh báo:</strong> Không chuyển tiền hoặc cung cấp thông tin cá nhân nhạy cảm qua chat.
                        </p>
                    </section>

                    {/* 5. Quản lý bài đăng */}
                    <section className="guide-section">
                        <h3 className="guide-section-title">5. Quản lý bài đăng của bạn</h3>
                        <p className="guide-text">
                            Quản lý các bài đăng của bạn trong phần <strong>"Bài đăng của tôi"</strong>:
                        </p>
                        <ul className="guide-list">
                            <li><strong>Xem bài đăng:</strong> Xem tất cả bài đăng của bạn (đang chờ duyệt, đã duyệt)</li>
                            <li><strong>Chỉnh sửa:</strong> Click biểu tượng bút chì để sửa thông tin bài đăng</li>
                            <li><strong>Đánh dấu đã tìm thấy:</strong> Khi đã tìm thấy đồ, đánh dấu để thông báo cho mọi người</li>
                            <li><strong>Xóa bài đăng:</strong> Xóa bài đăng nếu không còn cần thiết</li>
                        </ul>
                    </section>

                    {/* 6. Thông báo */}
                    <section className="guide-section">
                        <h3 className="guide-section-title">6. Thông báo</h3>
                        <p className="guide-text">
                            Nhận thông báo real-time về các hoạt động liên quan:
                        </p>
                        <ul className="guide-list">
                            <li><strong>AI Match:</strong> Thông báo khi AI tìm thấy bài đăng có thể trùng khớp</li>
                            <li><strong>Tin nhắn mới:</strong> Thông báo khi có tin nhắn mới</li>
                            <li><strong>Bài đăng được duyệt:</strong> Thông báo khi admin duyệt bài đăng của bạn</li>
                            <li>Click biểu tượng chuông trên thanh menu để xem tất cả thông báo</li>
                        </ul>
                    </section>

                    {/* Footer */}
                    <div className="guide-footer">
                        <p className="guide-footer-text">
                            Nếu bạn gặp khó khăn hoặc cần hỗ trợ thêm, vui lòng liên hệ đội ngũ quản trị qua email hoặc số điện thoại trong phần "Liên hệ".
                        </p>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default GuideModal;
