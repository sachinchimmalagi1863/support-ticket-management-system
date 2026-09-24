/**
 * Seeds the database with two demo accounts and a few sample tickets.
 * Run with:  npm run seed   (from the /backend directory)
 *
 * Demo accounts:
 *   agent@example.com    / Password123!   (role: agent)
 *   customer@example.com / Password123!   (role: customer)
 */
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function seed() {
  const conn = await pool.getConnection();
  try {
    console.log('🌱 Seeding database...');

    const passwordHash = await bcrypt.hash('Password123!', 10);

    await conn.query('DELETE FROM ticket_comments');
    await conn.query('DELETE FROM tickets');
    await conn.query('DELETE FROM users');
    await conn.query('ALTER TABLE users AUTO_INCREMENT = 1');
    await conn.query('ALTER TABLE tickets AUTO_INCREMENT = 1');
    await conn.query('ALTER TABLE ticket_comments AUTO_INCREMENT = 1');

    const [agentResult] = await conn.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      ['Alex Agent', 'agent@example.com', passwordHash, 'agent']
    );
    const [customerResult] = await conn.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      ['Casey Customer', 'customer@example.com', passwordHash, 'customer']
    );

    const agentId = agentResult.insertId;
    const customerId = customerResult.insertId;

    const [t1] = await conn.query(
      `INSERT INTO tickets (user_id, subject, description, priority, status, assigned_to)
       VALUES (?, ?, ?, 'high', 'open', NULL)`,
      [customerId, 'Cannot log into my account', 'I keep getting an "invalid credentials" error even though I am sure my password is correct.']
    );
    const [t2] = await conn.query(
      `INSERT INTO tickets (user_id, subject, description, priority, status, assigned_to)
       VALUES (?, ?, ?, 'medium', 'in_progress', ?)`,
      [customerId, 'Invoice amount looks wrong', 'My latest invoice charged me twice for the same subscription period. Please check.', agentId]
    );
    const [t3] = await conn.query(
      `INSERT INTO tickets (user_id, subject, description, priority, status, assigned_to)
       VALUES (?, ?, ?, 'low', 'resolved', ?)`,
      [customerId, 'Feature request: dark mode', 'It would be great to have a dark mode option in the dashboard settings.', agentId]
    );

    await conn.query(
      'INSERT INTO ticket_comments (ticket_id, user_id, comment) VALUES (?, ?, ?)',
      [t1.insertId, customerId, 'Just to add, this has been happening since yesterday afternoon.']
    );
    await conn.query(
      'INSERT INTO ticket_comments (ticket_id, user_id, comment) VALUES (?, ?, ?)',
      [t2.insertId, agentId, 'Thanks for the report - we are looking into the billing discrepancy now.']
    );
    await conn.query(
      'INSERT INTO ticket_comments (ticket_id, user_id, comment) VALUES (?, ?, ?)',
      [t3.insertId, agentId, 'Added to our roadmap, thanks for the suggestion!']
    );

    console.log('✅ Seed complete.');
    console.log('   Agent login:    agent@example.com / Password123!');
    console.log('   Customer login: customer@example.com / Password123!');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
  } finally {
    conn.release();
    await pool.end();
  }
}

seed();
