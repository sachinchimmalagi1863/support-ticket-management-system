/**
 * API / integration tests.
 *
 * These run against a REAL MySQL test database (not mocked), so the
 * behaviour under test — hashing, JWT issuance, SQL access-control
 * checks — matches production exactly.
 *
 * Setup before running `npm test`:
 *   1. Create a dedicated test database, e.g.:
 *        CREATE DATABASE support_ticket_system_test;
 *   2. Point DB_NAME at it, e.g. via a .env.test loaded below, or by
 *      temporarily setting DB_NAME=support_ticket_system_test in .env.
 *   3. Load the schema into it:
 *        mysql -u root -p support_ticket_system_test < ../database/schema.sql
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.test') });
require('dotenv').config(); // fallback to .env if .env.test isn't present

const request = require('supertest');
const app = require('../server');
const { pool } = require('../config/db');

let customerToken;
let secondCustomerToken;
let agentToken;
let createdTicketId;

beforeAll(async () => {
  // Start each test run from a clean slate.
  await pool.query('DELETE FROM ticket_comments');
  await pool.query('DELETE FROM tickets');
  await pool.query('DELETE FROM users');
});

afterAll(async () => {
  await pool.end();
});

describe('Auth', () => {
  test('Customer registration succeeds', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test Customer',
      email: 'customer@test.com',
      password: 'Password123!',
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.token).toBeDefined();
    customerToken = res.body.token;
  });

  test('A second customer can register (used for cross-customer access test)', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Second Customer',
      email: 'customer2@test.com',
      password: 'Password123!',
    });
    expect(res.statusCode).toBe(201);
    secondCustomerToken = res.body.token;
  });

  test('Valid login succeeds', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'customer@test.com',
      password: 'Password123!',
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('customer');
  });

  test('Invalid password is rejected', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'customer@test.com',
      password: 'wrong-password',
    });
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  test('An agent account can be seeded and logged in', async () => {
    // Agents aren't self-registrable via the public API, so we insert
    // one directly (mirrors what scripts/seed.js does) then log in.
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('AgentPass123!', 10);
    await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      ['Test Agent', 'agent@test.com', hash, 'agent']
    );
    const res = await request(app).post('/api/auth/login').send({
      email: 'agent@test.com',
      password: 'AgentPass123!',
    });
    expect(res.statusCode).toBe(200);
    agentToken = res.body.token;
  });
});

describe('Tickets', () => {
  test('Unauthorized user cannot access protected data', async () => {
    const res = await request(app).get('/api/tickets');
    expect(res.statusCode).toBe(401);
  });

  test('Ticket creation succeeds for an authenticated customer', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ subject: 'Test ticket', description: 'Something is broken', priority: 'high' });

    expect(res.statusCode).toBe(201);
    expect(res.body.ticket.subject).toBe('Test ticket');
    expect(res.body.ticket.status).toBe('open');
    createdTicketId = res.body.ticket.id;
  });

  test('Customer cannot access another customer\'s ticket', async () => {
    const res = await request(app)
      .get(`/api/tickets/${createdTicketId}`)
      .set('Authorization', `Bearer ${secondCustomerToken}`);
    expect(res.statusCode).toBe(403);
  });

  test('Agent can update ticket status', async () => {
    const res = await request(app)
      .put(`/api/tickets/${createdTicketId}`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ status: 'in_progress' });

    expect(res.statusCode).toBe(200);
    expect(res.body.ticket.status).toBe('in_progress');
  });

  test('Invalid ticket ID returns the appropriate error', async () => {
    const res = await request(app)
      .get('/api/tickets/999999')
      .set('Authorization', `Bearer ${agentToken}`);
    expect(res.statusCode).toBe(404);
  });

  test('Agent can add a comment to a ticket', async () => {
    const res = await request(app)
      .post(`/api/tickets/${createdTicketId}/comments`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ comment: 'Looking into this now.' });
    expect(res.statusCode).toBe(201);
    expect(res.body.comment.comment).toBe('Looking into this now.');
  });
});
