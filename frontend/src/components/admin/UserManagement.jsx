import React, { useState, useEffect } from "react";
import httpClient from "../../services/httpClient";
import "./UserManagement.css";
import {
  Search as SearchIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as ManagerIcon,
  HeadsetMic as SupportIcon,
} from "@mui/icons-material";

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [selectedAdmins, setSelectedAdmins] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentAdmin = JSON.parse(localStorage.getItem("adminData") || "null");
  const currentAdminId = currentAdmin?.id || null;

  useEffect(() => {
    const loadAdmins = async () => {
      try {
        setLoading(true);

        const response = await httpClient.get(
          "/admin/users",
          {},
          {},
          { preferAdmin: true }
        );

        if (response.success && response.data) {
          setAdmins(response.data);
        } else {
          setAdmins([]);
        }
      } catch (error) {
        console.error("❌ Error loading admins:", error);
        setAdmins([]);
      } finally {
        setLoading(false);
      }
    };

    loadAdmins();
  }, []);

  const handleSearch = (e) => setSearchTerm(e.target.value);
  const handleFilterChange = (e) => setFilterRole(e.target.value);

  const handleSelectAdmin = (adminId) => {
    setSelectedAdmins((prev) =>
      prev.includes(adminId)
        ? prev.filter((id) => id !== adminId)
        : [...prev, adminId]
    );
  };

  const handleSelectAll = () => {
    if (selectedAdmins.length === filteredAdmins.length) {
      setSelectedAdmins([]);
    } else {
      setSelectedAdmins(filteredAdmins.map((admin) => admin.id));
    }
  };

  // ✅ DELETE ADMIN
  const handleDeleteAdmin = async (adminId) => {
    if (adminId === currentAdminId) {
      alert("Bạn không thể xóa tài khoản của chính mình!");
      return;
    }

    if (!window.confirm("Bạn có chắc chắn muốn xóa tài khoản admin này?")) {
      return;
    }

    const response = await httpClient.delete(
      `/admin/users/${adminId}`,
      {},
      {},
      { preferAdmin: true }
    );

    if (response.success) {
      alert("Đã xóa tài khoản admin!");

      const refreshed = await httpClient.get(
        "/admin/users",
        {},
        {},
        { preferAdmin: true }
      );

      if (refreshed.success) setAdmins(refreshed.data);
    } else {
      alert("Không thể xóa admin: " + (response.error || "Lỗi"));
    }
  };

  // ✅ LOCK / UNLOCK ADMIN
  const handleLockToggle = async (adminId) => {
    if (adminId === currentAdminId) {
      alert("Bạn không thể khóa tài khoản của chính mình!");
      return;
    }

    const user = admins.find(a => a.id === adminId || a.account_id === adminId);
    const isLocked = user?.isLocked || user?.is_locked;
    const userId = user?.id || user?.account_id || adminId;
    const endpoint = isLocked ? `/admin/users/${userId}/unlock` : `/admin/users/${userId}/lock`;
    const response = await httpClient.put(
      endpoint,
      {}, // body
      {}, // queryParams
      {}, // customHeaders
      { preferAdmin: true } // authOptions
    );

    if (response.success) {
      alert("Đã thay đổi trạng thái thành công!");

      const refreshed = await httpClient.get(
        "/admin/users",
        {},
        {},
        { preferAdmin: true }
      );

      if (refreshed.success) setAdmins(refreshed.data);
    } else {
      alert("Không thể thay đổi trạng thái: " + (response.error || "Lỗi"));
    }
  };

  // ✅ BULK ACTIONS
  const handleBulkLock = async () => {
    if (selectedAdmins.length === 0) {
      alert("Vui lòng chọn ít nhất một người dùng!");
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn khóa ${selectedAdmins.length} tài khoản đã chọn?`)) {
      return;
    }

    try {
      const promises = selectedAdmins.map(userId =>
        httpClient.put(`/admin/users/${userId}/lock`, {}, {}, {}, { preferAdmin: true })
      );

      await Promise.all(promises);
      alert(`✅ Đã khóa ${selectedAdmins.length} tài khoản!`);

      // Refresh list
      const refreshed = await httpClient.get("/admin/users", {}, {}, { preferAdmin: true });
      if (refreshed.success) setAdmins(refreshed.data);
      setSelectedAdmins([]);
    } catch (error) {
      console.error("Error bulk locking:", error);
      alert("❌ Có lỗi xảy ra khi khóa tài khoản!");
    }
  };

  const handleBulkUnlock = async () => {
    if (selectedAdmins.length === 0) {
      alert("Vui lòng chọn ít nhất một người dùng!");
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn mở khóa ${selectedAdmins.length} tài khoản đã chọn?`)) {
      return;
    }

    try {
      const promises = selectedAdmins.map(userId =>
        httpClient.put(`/admin/users/${userId}/unlock`, {}, {}, {}, { preferAdmin: true })
      );

      await Promise.all(promises);
      alert(`✅ Đã mở khóa ${selectedAdmins.length} tài khoản!`);

      // Refresh list
      const refreshed = await httpClient.get("/admin/users", {}, {}, { preferAdmin: true });
      if (refreshed.success) setAdmins(refreshed.data);
      setSelectedAdmins([]);
    } catch (error) {
      console.error("Error bulk unlocking:", error);
      alert("❌ Có lỗi xảy ra khi mở khóa tài khoản!");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedAdmins.length === 0) {
      alert("Vui lòng chọn ít nhất một người dùng!");
      return;
    }

    if (!window.confirm(`⚠️ CẢNH BÁO: Bạn có chắc chắn muốn XÓA VĨNH VIỄN ${selectedAdmins.length} tài khoản đã chọn? Hành động này không thể hoàn tác!`)) {
      return;
    }

    try {
      const promises = selectedAdmins.map(userId =>
        httpClient.delete(`/admin/users/${userId}`, {}, {}, { preferAdmin: true })
      );

      await Promise.all(promises);
      alert(`✅ Đã xóa ${selectedAdmins.length} tài khoản!`);

      // Refresh list
      const refreshed = await httpClient.get("/admin/users", {}, {}, { preferAdmin: true });
      if (refreshed.success) setAdmins(refreshed.data);
      setSelectedAdmins([]);
    } catch (error) {
      console.error("Error bulk deleting:", error);
      alert("❌ Có lỗi xảy ra khi xóa tài khoản!");
    }
  };

  const filteredAdmins = admins.filter((admin) => {
    const matchesSearch =
      (admin.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (admin.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (admin.username || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterRole === "all" || admin.role === filterRole;

    return matchesSearch && matchesFilter;
  });

  const getLockStatus = (isLocked) =>
    isLocked ? (
      <span className="lock-badge locked">
        <LockIcon /> Đã khóa
      </span>
    ) : (
      <span className="lock-badge unlocked">
        Mở khóa
      </span>
    );

  return (
    <div className="admin-accounts-management">
      <div className="page-header">
        <h2>Quản lý người dùng</h2>
        <div className="header-actions">
          {/* Removed add user button - users register themselves */}
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-filter">
          <div className="search-input-container">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email hoặc username..."
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
            <button className="search-btn" title="Tìm kiếm">
              <SearchIcon />
            </button>
          </div>

          {/* Removed role filter - only showing Student users */}
        </div>

        {selectedAdmins.length > 0 && (
          <div className="bulk-actions">
            <span className="selected-count">
              Đã chọn {selectedAdmins.length} admin
            </span>
            <button className="bulk-btn lock" onClick={handleBulkLock}>Khóa tài khoản</button>
            <button className="bulk-btn unlock" onClick={handleBulkUnlock}>Mở khóa</button>
            <button className="bulk-btn delete" onClick={handleBulkDelete}>Xóa tài khoản</button>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <p>Đang tải danh sách admin...</p>
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="table-container">
          <table className="admins-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={
                      selectedAdmins.length === filteredAdmins.length &&
                      filteredAdmins.length > 0
                    }
                    onChange={handleSelectAll}
                  />
                </th>
                <th>Thông tin Admin</th>
                <th>Username</th>
                <th>Email</th>
                <th>Khóa/Mở</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {filteredAdmins.map((admin) => (
                <tr key={admin.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedAdmins.includes(admin.id)}
                      onChange={() => handleSelectAdmin(admin.id)}
                    />
                  </td>

                  <td>
                    <div className="admin-info">
                      <div className="admin-avatar">
                        {(admin.name || admin.user_name || admin.email || 'U').charAt(0)}
                      </div>
                      <div className="admin-details">
                        <div className="admin-name">{admin.name || admin.user_name || 'N/A'}</div>
                      </div>
                    </div>
                  </td>

                  <td>{admin.username || admin.email?.split('@')[0] || 'N/A'}</td>
                  <td>{admin.email || 'N/A'}</td>
                  <td>{getLockStatus(admin.isLocked || admin.is_locked)}</td>
                  <td>
                    {admin.createdDate || admin.created_at
                      ? new Date(admin.createdDate || admin.created_at).toLocaleDateString("vi-VN")
                      : 'N/A'
                    }
                  </td>

                  <td>
                    <div className="action-buttons">
                      <button
                        className={`action-btn ${admin.isLocked ? "unlock" : "lock"
                          } ${admin.id === currentAdminId ? "disabled" : ""}`}
                        onClick={() => handleLockToggle(admin.id)}
                        disabled={admin.id === currentAdminId}
                      >
                        {admin.isLocked ? (
                          "Mở khóa"
                        ) : (
                          <>
                            <LockIcon /> Khóa
                          </>
                        )}
                      </button>

                      <button
                        className={`action-btn delete ${admin.id === currentAdminId ? "disabled" : ""
                          }`}
                        onClick={() => handleDeleteAdmin(admin.id)}
                        disabled={admin.id === currentAdminId}
                      >
                        <DeleteIcon /> Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && filteredAdmins.length === 0 && (
        <div className="no-results">
          <p>⚠️ Hiện chưa có tài khoản admin nào.</p>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
