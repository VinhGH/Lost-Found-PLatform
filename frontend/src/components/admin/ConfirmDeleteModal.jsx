import React from 'react';
import './ConfirmDeleteModal.css';
import { Warning as WarningIcon } from '@mui/icons-material';

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, postTitle }) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-delete-overlay" onClick={onClose}>
      <div className="confirm-delete-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-icon">
            <WarningIcon style={{ fontSize: '48px', color: '#ef4444' }} />
          </div>
          <h3>Xác nhận xóa bài đăng</h3>
        </div>
        
        <div className="modal-content">
          <p>Bạn có muốn xóa bài viết này không?</p>
          {postTitle && (
            <p className="post-title-preview">"{postTitle}"</p>
          )}
          <p className="warning-text">
            Sau khi xóa, người dùng sẽ nhận được thông báo về việc bài đăng bị xóa.
          </p>
        </div>
        
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            Hủy
          </button>
          <button className="btn-confirm" onClick={onConfirm}>
            Xóa bài đăng
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;

