const { pool } = require('../../config/db');

class AccountModel {
  async getByEmail(email) {
    const query = `
      SELECT account_id, email, password, role, user_name, avatar, phone_number
      FROM "Account"
      WHERE email = $1
      LIMIT 1;
    `;
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  }

  async create(userData) {
    const query = `
      INSERT INTO "Account" (email, password, user_name, phone_number, role, created_at)
      VALUES ($1, $2, $3, $4, 'Student', NOW())
      RETURNING account_id, email, role;
    `;
    const values = [
      userData.email,
      userData.password,
      userData.user_name || 'Anonymous',
      userData.phone_number || null,
    ];
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }
}

module.exports = new AccountModel();
