import React from "react";
import "./ConfirmDeleteModal.css"; // ✅ dùng file CSS riêng để dễ quản lý

const ConfirmDeleteModal = ({ onConfirm, onCancel }) => {
  return (
    <div className="confirm-overlay">
      <div className="confirm-modal">
        <div className="confirm-header">
          <h2>Xác nhận xóa</h2>
        </div>

        <div className="confirm-body">
          <p>
            Bạn có chắc muốn xóa bài viết này không? <br />
            Hành động này không thể hoàn tác.
          </p>

          <div className="confirm-footer">
            <button className="cancel-btn" onClick={onCancel}>
              Hủy
            </button>
            <button className="confirm-btn" onClick={onConfirm}>
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
