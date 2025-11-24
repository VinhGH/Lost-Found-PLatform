import React, { useState } from 'react';
import { 
  Favorite as FavoriteIcon, 
  CheckCircle as CheckCircleIcon,
  ContentCopy as ContentCopyIcon
} from '@mui/icons-material';
import './DonationSection.css';

const DonationSection = () => {
  const [copied, setCopied] = useState(false);

  const accountNumber = '0339464751';
  const accountHolder = 'THAI VINH';
  const bank = 'MB bank';

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="donation-section">
      <div className="donation-container">
        {/* Header */}
        <div className="donation-header">
          <h2 className="donation-title">
            <span className="donation-title-icon">🤲</span>
            Cách thức Donate
          </h2>
        </div>

        {/* Appeal Box */}
        <div className="donation-appeal-box">
          <FavoriteIcon className="donation-heart-icon" />
          <h3 className="donation-appeal-title">Ủng hộ dự án của chúng tôi</h3>
          <p className="donation-appeal-text">
            Nếu bạn cảm thấy dự án "Lost & Found - DTU" mang lại giá trị, hãy cân nhắc đóng góp để chúng tôi có thể tiếp tục phát triển. 
            Mọi khoản quyên góp tự nguyện đều được trân trọng và công khai.
          </p>
        </div>

        {/* Donation Details */}
        <div className="donation-details">
          {/* Left: Bank Account Info */}
          <div className="donation-account-info">
            <div className="donation-info-item">
              <label className="donation-label">Số tài khoản:</label>
              <div className="donation-account-number">
                <span>{accountNumber}</span>
                <button 
                  className="donation-copy-btn"
                  onClick={handleCopyAccount}
                  title="Sao chép số tài khoản"
                >
                  <ContentCopyIcon />
                  {copied && <span className="copied-tooltip">Đã sao chép!</span>}
                </button>
              </div>
            </div>

            <div className="donation-info-item">
              <label className="donation-label">Tên chủ tài khoản:</label>
              <span className="donation-value">{accountHolder}</span>
            </div>

            <div className="donation-info-item">
              <label className="donation-label">Ngân hàng:</label>
              <span className="donation-value">{bank}</span>
            </div>
          </div>

          {/* Right: QR Code */}
          <div className="donation-qr-container">
            <div className="donation-qr-card">
              <div className="qr-card-header">
                <div className="qr-bank-logo">
                  <span className="qr-bank-name">{bank}</span>
                </div>
              </div>
              <div className="qr-code-wrapper">
                <img 
                  src="/img/qr.jpg" 
                  alt="QR Code thanh toán" 
                  className="qr-code-image"
                />
              </div>
              <div className="qr-card-footer">
                <div className="qr-payment-logos">
                  <span className="qr-logo-text">VIETQR</span>
                  <span className="qr-logo-text">napas 247</span>
                </div>
                <div className="qr-account-info">
                  <p className="qr-account-name">{accountHolder}</p>
                  <p className="qr-account-number">{accountNumber}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Thank You Box */}
        <div className="donation-thank-box">
          <CheckCircleIcon className="donation-check-icon" />
          <p className="donation-thank-text">
            Chúng tôi chân thành cám ơn sự đóng góp của bạn. Những đóng góp của bạn không chỉ giúp chúng tôi duy trì công việc mà còn góp phần làm cho cộng đồng trở nên vững mạnh hơn, từ đó có thể hỗ trợ nhiều người hơn. Sự ghi nhận và hỗ trợ từ bạn là động lực quý giá cho chúng tôi.
          </p>
        </div>
      </div>
    </section>
  );
};

export default DonationSection;

