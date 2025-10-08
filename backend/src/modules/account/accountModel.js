const { sql, pool } = require('../../config/db');

class AccountModel {
  async getByEmail(email) {
    const request = pool.request();
    request.input('Email', sql.NVarChar(255), email);
    const result = await request.execute('sp_Login');
    return result.recordset[0] || null;
  }

  async create(userData) {
    const request = pool.request();
    request.input('Email', sql.NVarChar(255), userData.email);
    request.input('Password', sql.NVarChar(255), userData.password);
    request.input('User_name', sql.NVarChar(255), userData.user_name || 'Anonymous');
    request.input('Phone_number', sql.NVarChar(50), userData.phone_number || null);
    // ❌ KHÔNG truyền Role vì SP không có tham số này
    const result = await request.execute('sp_CreateAccount');
    return result.recordset[0] || null;
  }
}

module.exports = new AccountModel();
