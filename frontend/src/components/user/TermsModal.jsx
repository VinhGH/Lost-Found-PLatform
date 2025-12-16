import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Close as CloseIcon } from '@mui/icons-material';
import './TermsModal.css';

const TermsModal = ({ onClose }) => {
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
        <div className="terms-overlay" onClick={onClose}>
            <div className="terms-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="terms-header">
                    <h2>Điều Khoản Sử Dụng</h2>
                    <button className="terms-close-btn" onClick={onClose} aria-label="Đóng">
                        <CloseIcon />
                    </button>
                </div>

                {/* Content */}
                <div className="terms-content">
                    {/* Introduction */}
                    <section className="terms-section">
                        <p className="terms-intro">
                            Chào mừng bạn đến với <strong>Lost & Found - DTU</strong>! Bằng việc truy cập và sử dụng nền tảng của chúng tôi,
                            bạn đồng ý tuân thủ các điều khoản và điều kiện sau đây. Vui lòng đọc kỹ trước khi sử dụng dịch vụ.
                        </p>
                    </section>

                    {/* 1. Chấp nhận điều khoản */}
                    <section className="terms-section">
                        <h3 className="terms-section-title">1. Chấp Nhận Điều Khoản</h3>
                        <p className="terms-text">
                            Khi đăng ký tài khoản, đăng tin hoặc sử dụng bất kỳ tính năng nào trên Lost & Found, bạn xác nhận rằng:
                        </p>
                        <ul className="terms-list">
                            <li>Bạn đã đọc, hiểu và đồng ý với toàn bộ điều khoản này</li>
                            <li>Bạn có đủ năng lực pháp lý để ký kết hợp đồng</li>
                            <li>Bạn cam kết sử dụng dịch vụ một cách hợp pháp và có trách nhiệm</li>
                            <li>Bạn hiểu rằng vi phạm điều khoản có thể dẫn đến việc tài khoản bị khóa hoặc chấm dứt</li>
                        </ul>
                    </section>

                    {/* 2. Đăng ký tài khoản */}
                    <section className="terms-section">
                        <h3 className="terms-section-title">2. Đăng Ký Tài Khoản</h3>
                        <p className="terms-text">
                            Để sử dụng đầy đủ các tính năng của Lost & Found, bạn cần:
                        </p>
                        <ul className="terms-list">
                            <li><strong>Email DTU:</strong> Sử dụng email sinh viên Đại học Duy Tân (@duytan.edu.vn) để đăng ký</li>
                            <li><strong>Xác thực OTP:</strong> Xác nhận email qua mã OTP được gửi đến hộp thư của bạn</li>
                            <li><strong>Thông tin chính xác:</strong> Cung cấp thông tin cá nhân đúng sự thật (tên, số điện thoại)</li>
                            <li><strong>Bảo mật tài khoản:</strong> Bạn chịu trách nhiệm bảo vệ mật khẩu và không chia sẻ cho người khác</li>
                            <li><strong>Thông báo vi phạm:</strong> Báo ngay cho chúng tôi nếu phát hiện tài khoản bị truy cập trái phép</li>
                        </ul>
                    </section>

                    {/* 3. Quy định đăng tin */}
                    <section className="terms-section">
                        <h3 className="terms-section-title">3. Quy Định Đăng Tin</h3>

                        <div className="terms-subsection">
                            <h4 className="terms-subtitle">3.1. Nội dung được phép</h4>
                            <ul className="terms-list">
                                <li>Đăng tin tìm đồ thất lạc với thông tin chính xác, đầy đủ</li>
                                <li>Đăng tin nhặt được đồ để trả lại chủ nhân</li>
                                <li>Hình ảnh rõ nét, liên quan đến đồ vật</li>
                                <li>Mô tả chi tiết về đặc điểm, màu sắc, thời gian, địa điểm</li>
                            </ul>
                        </div>

                        <div className="terms-subsection">
                            <h4 className="terms-subtitle">3.2. Nội dung bị cấm</h4>
                            <ul className="terms-list">
                                <li><strong>Thông tin sai lệch:</strong> Đăng tin giả mạo, lừa đảo hoặc spam</li>
                                <li><strong>Nội dung vi phạm pháp luật:</strong> Bạo lực, khiêu dâm, phân biệt chủng tộc, tôn giáo</li>
                                <li><strong>Quảng cáo thương mại:</strong> Sử dụng nền tảng để bán hàng, quảng cáo dịch vụ</li>
                                <li><strong>Xâm phạm quyền riêng tư:</strong> Đăng thông tin cá nhân của người khác không được phép</li>
                                <li><strong>Yêu cầu tiền chuộc:</strong> Đòi tiền hoặc lợi ích để trả lại đồ vật</li>
                            </ul>
                        </div>

                        <p className="terms-warning">
                            <strong>⚠️ Cảnh báo:</strong> Bài đăng vi phạm sẽ bị xóa và tài khoản có thể bị khóa vĩnh viễn.
                        </p>
                    </section>

                    {/* 4. Quyền và trách nhiệm */}
                    <section className="terms-section">
                        <h3 className="terms-section-title">4. Quyền và Trách Nhiệm</h3>

                        <div className="terms-subsection">
                            <h4 className="terms-subtitle">4.1. Quyền của người dùng</h4>
                            <ul className="terms-list">
                                <li>Đăng tin tìm đồ và nhặt được đồ miễn phí</li>
                                <li>Sử dụng tính năng AI Matching để tìm kiếm đồ vật</li>
                                <li>Nhắn tin trực tiếp với người đăng</li>
                                <li>Chỉnh sửa hoặc xóa bài đăng của mình</li>
                                <li>Yêu cầu xóa dữ liệu cá nhân bất cứ lúc nào</li>
                            </ul>
                        </div>

                        <div className="terms-subsection">
                            <h4 className="terms-subtitle">4.2. Trách nhiệm của người dùng</h4>
                            <ul className="terms-list">
                                <li>Đảm bảo thông tin đăng tải chính xác và trung thực</li>
                                <li>Xác minh kỹ thông tin trước khi giao nhận đồ vật</li>
                                <li>Không sử dụng nền tảng cho mục đích bất hợp pháp</li>
                                <li>Tôn trọng quyền riêng tư và thông tin của người khác</li>
                                <li>Chịu trách nhiệm pháp lý với mọi hành vi vi phạm</li>
                            </ul>
                        </div>

                        <div className="terms-subsection">
                            <h4 className="terms-subtitle">4.3. Quyền của Lost & Found</h4>
                            <ul className="terms-list">
                                <li>Kiểm duyệt và từ chối bài đăng vi phạm quy định</li>
                                <li>Khóa hoặc xóa tài khoản vi phạm nghiêm trọng</li>
                                <li>Thay đổi, tạm ngưng hoặc chấm dứt dịch vụ bất cứ lúc nào</li>
                                <li>Cập nhật điều khoản sử dụng mà không cần thông báo trước</li>
                                <li>Hợp tác với cơ quan chức năng khi có yêu cầu pháp lý</li>
                            </ul>
                        </div>
                    </section>

                    {/* 5. Tính năng AI Matching */}
                    <section className="terms-section">
                        <h3 className="terms-section-title">5. Tính Năng AI Matching</h3>
                        <p className="terms-text">
                            Lost & Found sử dụng công nghệ AI để gợi ý các bài đăng có thể trùng khớp:
                        </p>
                        <ul className="terms-list">
                            <li><strong>Chỉ mang tính gợi ý:</strong> AI không đảm bảo 100% chính xác</li>
                            <li><strong>Trách nhiệm xác minh:</strong> Người dùng phải tự kiểm tra và xác nhận thông tin</li>
                            <li><strong>Không chịu trách nhiệm:</strong> Lost & Found không chịu trách nhiệm cho các kết quả sai lệch từ AI</li>
                            <li><strong>Cải thiện liên tục:</strong> Hệ thống AI được cập nhật và cải thiện thường xuyên</li>
                        </ul>
                    </section>

                    {/* 6. Giới hạn trách nhiệm */}
                    <section className="terms-section">
                        <h3 className="terms-section-title">6. Giới Hạn Trách Nhiệm</h3>
                        <p className="terms-text">
                            Lost & Found là nền tảng kết nối, chúng tôi không chịu trách nhiệm cho:
                        </p>
                        <ul className="terms-list">
                            <li>Tính chính xác của thông tin do người dùng cung cấp</li>
                            <li>Tranh chấp giữa người mất đồ và người nhặt được</li>
                            <li>Thiệt hại phát sinh từ việc giao nhận đồ vật</li>
                            <li>Mất mát dữ liệu do lỗi kỹ thuật hoặc bất khả kháng</li>
                            <li>Hành vi lừa đảo, gian lận của người dùng</li>
                        </ul>
                        <p className="terms-note">
                            <strong>Lưu ý:</strong> Bạn nên gặp mặt tại địa điểm công cộng và xác minh kỹ thông tin trước khi giao nhận.
                        </p>
                    </section>

                    {/* 7. Sở hữu trí tuệ */}
                    <section className="terms-section">
                        <h3 className="terms-section-title">7. Sở Hữu Trí Tuệ</h3>
                        <ul className="terms-list">
                            <li><strong>Nội dung của Lost & Found:</strong> Logo, giao diện, mã nguồn thuộc quyền sở hữu của chúng tôi</li>
                            <li><strong>Nội dung người dùng:</strong> Bạn giữ quyền sở hữu nội dung đăng tải nhưng cấp cho chúng tôi quyền sử dụng để vận hành dịch vụ</li>
                            <li><strong>Cấm sao chép:</strong> Không được sao chép, phân phối hoặc sử dụng nội dung của nền tảng cho mục đích thương mại</li>
                        </ul>
                    </section>

                    {/* 8. Chấm dứt dịch vụ */}
                    <section className="terms-section">
                        <h3 className="terms-section-title">8. Chấm Dứt Dịch Vụ</h3>
                        <p className="terms-text">
                            Chúng tôi có quyền chấm dứt hoặc tạm ngưng tài khoản của bạn nếu:
                        </p>
                        <ul className="terms-list">
                            <li>Vi phạm điều khoản sử dụng hoặc chính sách bảo mật</li>
                            <li>Có hành vi gian lận, lừa đảo hoặc spam</li>
                            <li>Sử dụng nền tảng cho mục đích bất hợp pháp</li>
                            <li>Theo yêu cầu của cơ quan chức năng</li>
                        </ul>
                        <p className="terms-text">
                            Bạn cũng có quyền xóa tài khoản bất cứ lúc nào thông qua trang cài đặt.
                        </p>
                    </section>

                    {/* 9. Thay đổi điều khoản */}
                    <section className="terms-section">
                        <h3 className="terms-section-title">9. Thay Đổi Điều Khoản</h3>
                        <p className="terms-text">
                            Lost & Found có quyền cập nhật điều khoản sử dụng bất cứ lúc nào. Các thay đổi sẽ có hiệu lực ngay khi được đăng tải.
                            Việc bạn tiếp tục sử dụng dịch vụ sau khi có thay đổi đồng nghĩa với việc bạn chấp nhận điều khoản mới.
                        </p>
                    </section>

                    {/* 10. Liên hệ */}
                    <section className="terms-section">
                        <h3 className="terms-section-title">10. Liên Hệ</h3>
                        <p className="terms-text">
                            Nếu bạn có bất kỳ câu hỏi nào về điều khoản sử dụng, vui lòng liên hệ:
                        </p>
                        <ul className="terms-list">
                            <li><strong>Email:</strong> t.vinh.1109z@gmail.com</li>
                            <li><strong>Số điện thoại:</strong> 0339464751</li>
                        </ul>
                    </section>

                    {/* Footer */}
                    <div className="terms-footer">
                        <p className="terms-footer-text">
                            <strong>Ngày cập nhật:</strong> 16/12/2025<br />
                            Bằng việc sử dụng Lost & Found, bạn đồng ý với toàn bộ điều khoản trên.
                            Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ của chúng tôi!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsModal;
