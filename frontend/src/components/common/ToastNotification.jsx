import React, { useEffect, useState } from 'react';
import './ToastNotification.css';
import { CheckCircle as CheckIcon, Warning as WarningIcon, Info as InfoIcon, Close as CloseIcon } from '@mui/icons-material';

const ToastNotification = ({ notification, onClose, onClick }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation khi component mount
    setTimeout(() => setIsVisible(true), 10);

    // Tự động đóng sau duration (mặc định 8 giây nếu không có duration)
    const duration = notification?.duration || 8000;
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(), 300); // Đợi animation xong rồi mới close
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, notification?.duration]);

  if (!notification) return null;

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckIcon className="toast-icon" />;
      case 'warning':
        return <WarningIcon className="toast-icon" />;
      case 'info':
      default:
        return <InfoIcon className="toast-icon" />;
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300);
  };

  const handleClick = () => {
    if (onClick && notification.postId) {
      onClick(notification.postId, notification.postType);
      handleClose();
    }
  };

  return (
    <div 
      className={`toast-notification toast-${notification.type} ${isVisible ? 'visible' : ''} ${notification.postId ? 'clickable' : ''}`}
      onClick={notification.postId ? handleClick : undefined}
    >
      <div className="toast-content">
        <div className="toast-icon-wrapper">
          {getIcon()}
        </div>
        <div className="toast-text">
          <h4 className="toast-title">{notification.title}</h4>
          <p className="toast-message">{notification.message}</p>
        </div>
        <button className="toast-close" onClick={handleClose}>
          <CloseIcon style={{ fontSize: '18px' }} />
        </button>
      </div>
    </div>
  );
};

export default ToastNotification;

