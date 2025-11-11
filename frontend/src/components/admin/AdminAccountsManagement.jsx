import React, { useState } from 'react';
import './AdminAccountsManagement.css';
import {
  Search as SearchIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as ManagerIcon,
  HeadsetMic as SupportIcon
} from '@mui/icons-material';

const AdminAccountsManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [selectedAdmins, setSelectedAdmins] = useState([]);
  
  // Current admin ID (in real app, this would come from authentication context)
  const currentAdminId = 1; // Mock current admin ID

  // Mock data for admin accounts
  const [admins, setAdmins] = useState([
    {
      id: 1,
      name: 'Admin User',
      email: 'admin@dtu.edu.vn',
      username: 'admin',
      role: 'Admin',
      status: 'active',
      isLocked: false,
      lastLogin: '2024-12-20',
      createdDate: '2024-01-01'
    },
    {
      id: 2,
      name: 'Manager User',
      email: 'manager@dtu.edu.vn',
      username: 'manager',
      role: 'Manager',
      status: 'active',
      isLocked: false,
      lastLogin: '2024-12-19',
      createdDate: '2024-02-15'
    },
    {
      id: 3,
      name: 'Support User',
      email: 'support@dtu.edu.vn',
      username: 'support',
      role: 'Support',
      status: 'inactive',
      isLocked: true,
      lastLogin: '2024-12-10',
      createdDate: '2024-03-01'
    }
  ]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e) => {
    setFilterRole(e.target.value);
  };

  const handleSelectAdmin = (adminId) => {
    setSelectedAdmins(prev => 
      prev.includes(adminId) 
        ? prev.filter(id => id !== adminId)
        : [...prev, adminId]
    );
  };

  const handleSelectAll = () => {
    if (selectedAdmins.length === filteredAdmins.length) {
      setSelectedAdmins([]);
    } else {
      setSelectedAdmins(filteredAdmins.map(admin => admin.id));
    }
  };

  const handleStatusChange = (adminId, newStatus) => {
    setAdmins(prev => prev.map(admin => 
      admin.id === adminId ? { ...admin, status: newStatus } : admin
    ));
  };

  const handleLockToggle = (adminId) => {
    // Prevent admin from locking other admin accounts
    if (adminId === currentAdminId) {
      alert('Bạn không thể khóa tài khoản của chính mình!');
      return;
    }

    const adminToToggle = admins.find(admin => admin.id === adminId);
    const action = adminToToggle?.isLocked ? 'mở khóa' : 'khóa';
    
    if (window.confirm(`Bạn có chắc chắn muốn ${action} tài khoản admin "${adminToToggle?.name}"?`)) {
      setAdmins(prev => prev.map(admin => 
        admin.id === adminId ? { ...admin, isLocked: !admin.isLocked } : admin
      ));
    }
  };

  const handleDeleteAdmin = (adminId) => {
    // Prevent admin from deleting their own account
    if (adminId === currentAdminId) {
      alert('Bạn không thể xóa tài khoản của chính mình!');
      return;
    }

    const adminToDelete = admins.find(admin => admin.id === adminId);
    if (window.confirm(`Bạn có chắc chắn muốn xóa tài khoản admin "${adminToDelete?.name}"?`)) {
      setAdmins(prev => prev.filter(admin => admin.id !== adminId));
      // Remove from selected list if it was selected
      setSelectedAdmins(prev => prev.filter(id => id !== adminId));
    }
  };

  const handleBulkAction = (action) => {
    if (action === 'lock') {
      // Check if current admin is in selected list
      const hasCurrentAdmin = selectedAdmins.includes(currentAdminId);
      if (hasCurrentAdmin) {
        alert('Bạn không thể khóa tài khoản của chính mình!');
        return;
      }

      if (window.confirm(`Bạn có chắc chắn muốn khóa ${selectedAdmins.length} tài khoản admin đã chọn?`)) {
        setAdmins(prev => prev.map(admin => 
          selectedAdmins.includes(admin.id) 
            ? { ...admin, isLocked: true }
            : admin
        ));
      }
    } else if (action === 'unlock') {
      // Check if current admin is in selected list
      const hasCurrentAdmin = selectedAdmins.includes(currentAdminId);
      if (hasCurrentAdmin) {
        alert('Bạn không thể mở khóa tài khoản của chính mình!');
        return;
      }

      if (window.confirm(`Bạn có chắc chắn muốn mở khóa ${selectedAdmins.length} tài khoản admin đã chọn?`)) {
        setAdmins(prev => prev.map(admin => 
          selectedAdmins.includes(admin.id) 
            ? { ...admin, isLocked: false }
            : admin
        ));
      }
    } else if (action === 'delete') {
      // Check if current admin is in selected list
      const hasCurrentAdmin = selectedAdmins.includes(currentAdminId);
      if (hasCurrentAdmin) {
        alert('Bạn không thể xóa tài khoản của chính mình!');
        return;
      }

      if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedAdmins.length} tài khoản admin đã chọn?`)) {
        setAdmins(prev => prev.filter(admin => !selectedAdmins.includes(admin.id)));
        setSelectedAdmins([]);
      }
    }
    setSelectedAdmins([]);
  };

  const filteredAdmins = admins.filter(admin => {
    const matchesSearch = admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         admin.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterRole === 'all' || admin.role === filterRole;
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

  const getRoleBadge = (role) => {
    const roleConfig = {
      'Admin': { class: 'role-admin', text: <><AdminIcon /> Admin</> },
      'Manager': { class: 'role-manager', text: <><ManagerIcon /> Manager</> },
      'Support': { class: 'role-support', text: <><SupportIcon /> Support</> }
    };
    const config = roleConfig[role] || roleConfig['Admin'];
    return <span className={`role-badge ${config.class}`}>{config.text}</span>;
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
    <div className="admin-accounts-management">
      {/* Header */}
      <div className="page-header">
        <h2>Quản lý tài khoản Admin</h2>
        <div className="header-actions">
          <button className="add-admin-btn">
            <AddIcon /> Thêm Admin
          </button>
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
            value={filterRole}
            onChange={handleFilterChange}
            className="role-filter"
          >
            <option value="all">Tất cả vai trò</option>
            <option value="Admin">Admin</option>
            <option value="Manager">Manager</option>
            <option value="Support">Support</option>
          </select>
        </div>

        {selectedAdmins.length > 0 && (
          <div className="bulk-actions">
            <span className="selected-count">
              Đã chọn {selectedAdmins.length} admin
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

      {/* Table */}
      <div className="table-container">
        <table className="admins-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedAdmins.length === filteredAdmins.length && filteredAdmins.length > 0}
                  onChange={handleSelectAll}
                  className="select-all-checkbox"
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
            {filteredAdmins.map(admin => (
              <tr key={admin.id} className={selectedAdmins.includes(admin.id) ? 'selected' : ''}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedAdmins.includes(admin.id)}
                    onChange={() => handleSelectAdmin(admin.id)}
                    className="admin-checkbox"
                  />
                </td>
                <td>
                  <div className="admin-info">
                    <div className="admin-avatar">
                      {admin.name.charAt(0)}
                    </div>
                    <div className="admin-details">
                      <div className="admin-name">{admin.name}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="username">{admin.username}</span>
                </td>
                <td>
                  <div className="admin-email-cell">
                    <span className="email-text">{admin.email}</span>
                  </div>
                </td>
                <td>{getLockStatus(admin.isLocked)}</td>
                <td>{new Date(admin.createdDate).toLocaleDateString('vi-VN')}</td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className={`action-btn ${admin.isLocked ? 'unlock' : 'lock'} ${admin.id === currentAdminId ? 'disabled' : ''}`}
                      onClick={() => handleLockToggle(admin.id)}
                      disabled={admin.id === currentAdminId}
                      title={admin.id === currentAdminId ? 'Không thể khóa tài khoản của chính mình' : (admin.isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản')}
                    >
                      {admin.isLocked ? <><LockOpenIcon /> Mở khóa</> : <><LockIcon /> Khóa</>}
                    </button>
                    <button 
                      className={`action-btn delete ${admin.id === currentAdminId ? 'disabled' : ''}`}
                      onClick={() => handleDeleteAdmin(admin.id)}
                      disabled={admin.id === currentAdminId}
                      title={admin.id === currentAdminId ? 'Không thể xóa tài khoản của chính mình' : 'Xóa tài khoản'}
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

      {filteredAdmins.length === 0 && (
        <div className="no-results">
          <p>Không tìm thấy admin nào phù hợp với tiêu chí tìm kiếm.</p>
        </div>
      )}
    </div>
  );
};

export default AdminAccountsManagement;



