const { pool } = require('../config/db');

const VALID_STATUSES = ['open', 'in_progress', 'resolved', 'closed'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

// GET /api/tickets
// Customer -> only their own tickets. Agent -> all tickets.
// Supports ?status=&priority=&search=&sort=created_at|priority&order=asc|desc
async function getTickets(req, res) {
  try {
    const { status, priority, search, sort, order } = req.query;
    const params = [];

    let sql = `
      SELECT t.*, u.name AS customer_name, u.email AS customer_email,
             a.name AS agent_name
      FROM tickets t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN users a ON t.assigned_to = a.id
      WHERE 1 = 1
    `;

    if (req.user.role === 'customer') {
      sql += ' AND t.user_id = ?';
      params.push(req.user.id);
    }

    if (status && VALID_STATUSES.includes(status)) {
      sql += ' AND t.status = ?';
      params.push(status);
    }

    if (priority && VALID_PRIORITIES.includes(priority)) {
      sql += ' AND t.priority = ?';
      params.push(priority);
    }

    if (search) {
      sql += ' AND (t.subject LIKE ? OR t.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const sortableColumns = ['created_at', 'priority', 'status', 'updated_at'];
    const sortCol = sortableColumns.includes(sort) ? `t.${sort}` : 't.created_at';
    const sortOrder = order && order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    sql += ` ORDER BY ${sortCol} ${sortOrder}`;

    const [rows] = await pool.query(sql, params);
    return res.json({ tickets: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error while fetching tickets.' });
  }
}

// GET /api/tickets/:id
async function getTicketById(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT t.*, u.name AS customer_name, u.email AS customer_email,
              a.name AS agent_name
       FROM tickets t
       JOIN users u ON t.user_id = u.id
       LEFT JOIN users a ON t.assigned_to = a.id
       WHERE t.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    const ticket = rows[0];

    if (req.user.role === 'customer' && ticket.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You cannot view another customer\'s ticket.' });
    }

    return res.json({ ticket });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error while fetching the ticket.' });
  }
}

// POST /api/tickets  (customer only)
async function createTicket(req, res) {
  try {
    const { subject, description, priority } = req.body;

    if (!subject || !description) {
      return res.status(400).json({ error: 'subject and description are required.' });
    }

    const ticketPriority = VALID_PRIORITIES.includes(priority) ? priority : 'medium';

    const [result] = await pool.query(
      `INSERT INTO tickets (user_id, subject, description, priority, status)
       VALUES (?, ?, ?, ?, 'open')`,
      [req.user.id, subject, description, ticketPriority]
    );

    const [rows] = await pool.query('SELECT * FROM tickets WHERE id = ?', [result.insertId]);
    return res.status(201).json({ message: 'Ticket created.', ticket: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error while creating the ticket.' });
  }
}

// PUT /api/tickets/:id
// Customer: can only edit subject/description on their own OPEN ticket.
// Agent: can update status, priority, assigned_to.
async function updateTicket(req, res) {
  try {
    const { id } = req.params;
    const [existingRows] = await pool.query('SELECT * FROM tickets WHERE id = ?', [id]);

    if (existingRows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }
    const ticket = existingRows[0];

    if (req.user.role === 'customer') {
      if (ticket.user_id !== req.user.id) {
        return res.status(403).json({ error: 'You cannot modify another customer\'s ticket.' });
      }
      const { subject, description } = req.body;
      await pool.query(
        'UPDATE tickets SET subject = COALESCE(?, subject), description = COALESCE(?, description), updated_at = NOW() WHERE id = ?',
        [subject || null, description || null, id]
      );
    } else if (req.user.role === 'agent') {
      const { status, priority, assigned_to } = req.body;

      if (status && !VALID_STATUSES.includes(status)) {
        return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
      }
      if (priority && !VALID_PRIORITIES.includes(priority)) {
        return res.status(400).json({ error: `priority must be one of: ${VALID_PRIORITIES.join(', ')}` });
      }

      await pool.query(
        `UPDATE tickets
         SET status = COALESCE(?, status),
             priority = COALESCE(?, priority),
             assigned_to = COALESCE(?, assigned_to),
             updated_at = NOW()
         WHERE id = ?`,
        [status || null, priority || null, assigned_to || null, id]
      );
    }

    const [updatedRows] = await pool.query('SELECT * FROM tickets WHERE id = ?', [id]);
    return res.json({ message: 'Ticket updated.', ticket: updatedRows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error while updating the ticket.' });
  }
}

// DELETE /api/tickets/:id  (agent only, or the owning customer)
async function deleteTicket(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM tickets WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }
    const ticket = rows[0];

    if (req.user.role === 'customer' && ticket.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You cannot delete another customer\'s ticket.' });
    }

    await pool.query('DELETE FROM tickets WHERE id = ?', [id]);
    return res.json({ message: 'Ticket deleted.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error while deleting the ticket.' });
  }
}

module.exports = { getTickets, getTicketById, createTicket, updateTicket, deleteTicket };
