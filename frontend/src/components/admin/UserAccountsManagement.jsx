import React, { useState } from 'react';
import './UserAccountsManagement.css';
import {
  Search as SearchIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

const UserAccountsManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Load users từ API (TODO: Implement API endpoint)
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        // TODO: Gọi API để lấy danh sách users
        // const response = await httpClient.get('/accounts/users');
        // if (response.success) {
        //   setUsers(response.data);
        // }
        setUsers([]); // Tạm thời để empty
      } catch (error) {
        console.error('❌ Error loading users:', error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e) => {
    setFilterStatus(e.target.value);
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };


  const handleLockToggle = async (userId) => {
    // TODO: Gọi API để lock/unlock user
    // const response = await httpClient.patch(`/accounts/${userId}/lock`);
    alert('⚠️ Chức năng đang được phát triển. API endpoint chưa có.');
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) {
      // TODO: Gọi API để xóa user
      // const response = await httpClient.delete(`/accounts/${userId}`);
      alert('⚠️ Chức năng đang được phát triển. API endpoint chưa có.');
    }
  };

  const handleBulkAction = async (action) => {
    // TODO: Implement bulk actions với API
    alert('⚠️ Chức năng đang được phát triển. API endpoint chưa có.');
  };


  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phone.includes(searchTerm) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { class: 'status-active', text: 'Hoạt động' },
      inactive: { class: 'status-inactive', text: 'Không hoạt động' },
      suspended: { class: 'status-suspended', text: 'Tạm khóa' }
    };
    const config = statusConfig[status] || statusConfig.active;
    return <span className={`status-badge ${config.class}`}>{config.text}</span>;
  };


  const getLockStatus = (isLocked) => {
    return isLocked ? (
      <span className="lock-badge locked">
        <LockIcon /> Đã khóa
      </span>
    ) : (
      <span className="lock-badge unlocked">
        <LockOpenIcon /> Mở khóa
      </span>
    );
  };

  return (
    <div className="user-accounts-management">
      {/* Header */}
      <div className="page-header">
        <h2>Quản lý tài khoản người dùng</h2>
      </div>

      {/* Filters and Actions */}
      <div className="filters-section">
        <div className="search-filter">
          <div className="search-input-container">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email hoặc số điện thoại..."
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
            <button 
              type="button"
              className="search-btn"
              onClick={() => {
                // Trigger search functionality
                console.log('Searching for:', searchTerm);
              }}
              title="Tìm kiếm"
            >
              <SearchIcon />
            </button>
          </div>
          <select
            value={filterStatus}
            onChange={handleFilterChange}
            className="status-filter"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Không hoạt động</option>
            <option value="suspended">Tạm khóa</option>
          </select>
        </div>

        {selectedUsers.length > 0 && (
          <div className="bulk-actions">
            <span className="selected-count">
              Đã chọn {selectedUsers.length} người dùng
            </span>
            <button 
              className="bulk-btn lock"
              onClick={() => handleBulkAction('lock')}
            >
              Khóa tài khoản
            </button>
            <button 
              className="bulk-btn unlock"
              onClick={() => handleBulkAction('unlock')}
            >
              Mở khóa
            </button>
            <button 
              className="bulk-btn delete"
              onClick={() => handleBulkAction('delete')}
            >
              Xóa tài khoản
            </button>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Đang tải danh sách người dùng...</p>
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={handleSelectAll}
                    className="select-all-checkbox"
                  />
                </th>
                <th>Thông tin cá nhân</th>
                <th>Email</th>
                <th>Số điện thoại</th>
                <th>Khóa/Mở</th>
                <th>Ngày tham gia</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
              <tr key={user.id} className={selectedUsers.includes(user.id) ? 'selected' : ''}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => handleSelectUser(user.id)}
                    className="user-checkbox"
                  />
                </td>
                <td>
                  <div className="user-info">
                    <div className="user-avatar">
                      {user.name.charAt(0)}
                    </div>
                    <div className="user-details">
                      <div className="user-name">{user.name}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="user-email-cell">
                    <span className="email-text">{user.email}</span>
                  </div>
                </td>
                <td>
                  <div className="user-phone-cell">
                    <span className="phone-text">{user.phone}</span>
                  </div>
                </td>
                <td>{getLockStatus(user.isLocked)}</td>
                <td>{new Date(user.joinDate).toLocaleDateString('vi-VN')}</td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className={`action-btn ${user.isLocked ? 'unlock' : 'lock'}`}
                      onClick={() => handleLockToggle(user.id)}
                    >
                      {user.isLocked ? <><LockOpenIcon /> Mở khóa</> : <><LockIcon /> Khóa</>}
                    </button>
                    <button 
                      className="action-btn delete"
                      onClick={() => handleDeleteUser(user.id)}
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

      {!loading && filteredUsers.length === 0 && (
        <div className="no-results">
          <p>⚠️ Chức năng quản lý tài khoản người dùng đang được phát triển. API endpoint chưa có.</p>
          <p style={{ marginTop: '10px', color: '#666', fontSize: '14px' }}>
            Hiện tại chỉ có thể quản lý bài đăng. Dữ liệu người dùng sẽ được đồng bộ từ database khi API được triển khai.
          </p>
        </div>
      )}
    </div>
  );
};

export default UserAccountsManagement;

