const { pool } = require('../config/db');

// GET /api/users?role=agent  (agent-only: used to populate "assign to" dropdown)
async function getUsers(req, res) {
  try {
    const { role } = req.query;
    let sql = 'SELECT id, name, email, role, created_at FROM users';
    const params = [];

    if (role) {
      sql += ' WHERE role = ?';
      params.push(role);
    }

    const [rows] = await pool.query(sql, params);
    return res.json({ users: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error while fetching users.' });
  }
}

module.exports = { getUsers };
