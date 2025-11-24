import React from "react";
import "./ConfirmLogoutModal.css";

const ConfirmLogoutModal = ({ onConfirm, onCancel }) => {
  return (
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
    </div>
  );
};

export default ConfirmLogoutModal;

