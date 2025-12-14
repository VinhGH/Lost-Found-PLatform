import React from "react";
import { createPortal } from "react-dom";
import "./ConfirmLogoutModal.css";

const ConfirmLogoutModal = ({ onConfirm, onCancel }) => {
  // ✅ Use React Portal to render modal at document.body level
  // This fixes positioning issues when parent has transform/position
  return createPortal(
    <div className="confirm-overlay">
      <div className="confirm-modal">
        <div className="confirm-header">
          <h2>Xác nhận đăng xuất</h2>
        </div>

        <div className="confirm-body">
          <p>
            Bạn có chắc muốn đăng xuất không?
          </p>

          <div className="confirm-footer">
            <button className="cancel-btn" onClick={onCancel}>
              Hủy
            </button>
            <button className="confirm-btn" onClick={onConfirm}>
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body // Render at body level, not inside parent component
  );
};

export default ConfirmLogoutModal;

