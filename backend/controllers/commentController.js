const { pool } = require('../config/db');

async function assertTicketAccess(ticketId, user) {
  const [rows] = await pool.query('SELECT * FROM tickets WHERE id = ?', [ticketId]);
  if (rows.length === 0) return { error: 404, message: 'Ticket not found.' };

  const ticket = rows[0];
  if (user.role === 'customer' && ticket.user_id !== user.id) {
    return { error: 403, message: 'You cannot access another customer\'s ticket.' };
  }
  return { ticket };
}

// GET /api/tickets/:id/comments
async function getComments(req, res) {
  try {
    const { id } = req.params;
    const access = await assertTicketAccess(id, req.user);
    if (access.error) return res.status(access.error).json({ error: access.message });

    const [comments] = await pool.query(
      `SELECT c.*, u.name AS author_name, u.role AS author_role
       FROM ticket_comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.ticket_id = ?
       ORDER BY c.created_at ASC`,
      [id]
    );

    return res.json({ comments });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error while fetching comments.' });
  }
}

// POST /api/tickets/:id/comments
async function addComment(req, res) {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    if (!comment || !comment.trim()) {
      return res.status(400).json({ error: 'comment text is required.' });
    }

    const access = await assertTicketAccess(id, req.user);
    if (access.error) return res.status(access.error).json({ error: access.message });

    const [result] = await pool.query(
      'INSERT INTO ticket_comments (ticket_id, user_id, comment) VALUES (?, ?, ?)',
      [id, req.user.id, comment.trim()]
    );

    await pool.query('UPDATE tickets SET updated_at = NOW() WHERE id = ?', [id]);

    const [rows] = await pool.query(
      `SELECT c.*, u.name AS author_name, u.role AS author_role
       FROM ticket_comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?`,
      [result.insertId]
    );

    return res.status(201).json({ message: 'Comment added.', comment: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error while adding the comment.' });
  }
}

module.exports = { getComments, addComment };
