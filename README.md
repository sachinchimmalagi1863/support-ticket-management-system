# Support Ticket Management System

A full-stack support portal where customers can raise tickets and support
agents can manage and respond to them. Built for the Junior Full Stack
Developer technical assessment.

**Stack:** React (Vite) · Node.js/Express · MySQL · JWT auth

---

## 1. Project Structure

```
support-ticket-system/
├── backend/              Express REST API
│   ├── config/db.js      MySQL connection pool
│   ├── controllers/      Route handlers (auth, tickets, comments, users)
│   ├── middleware/auth.js  JWT verification + role-based authorization
│   ├── routes/           Express routers
│   ├── scripts/seed.js   Seeds demo users + sample tickets
│   ├── tests/            Jest + Supertest integration tests
│   └── server.js
├── database/
│   ├── schema.sql        Table definitions (users, tickets, ticket_comments)
│   ├── seed.sql           Reference SQL for sample ticket/comment data
│   └── example_query.sql  JOIN query required by the assessment (section 8)
├── frontend/              React (Vite) SPA
│   └── src/
│       ├── api/axios.js       Axios instance with JWT interceptor
│       ├── context/AuthContext.jsx
│       ├── components/        Navbar, TicketList, ProtectedRoute
│       └── pages/             Login, Register, Dashboards, TicketDetail, CreateTicket
├── tests/postman_collection.json
├── docker-compose.yml     Optional: spins up MySQL only
└── README.md
```

---

## 2. Prerequisites

- Node.js 18+
- npm
- MySQL 8+ (local install, or run `docker compose up -d` to start MySQL in a container)

---

## 3. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with your MySQL credentials:

```
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=support_ticket_system
JWT_SECRET=replace_this_with_a_long_random_secret
JWT_EXPIRES_IN=1d
FRONTEND_URL=http://localhost:5173
```

Create the database and load the schema:

```bash
mysql -u root -p -e "CREATE DATABASE support_ticket_system"
mysql -u root -p support_ticket_system < ../database/schema.sql
```

Seed demo data (creates two logins and a few sample tickets):

```bash
npm run seed
```

This creates:

| Role     | Email                | Password      |
|----------|-----------------------|----------------|
| Agent    | agent@example.com     | Password123!   |
| Customer | customer@example.com  | Password123!   |

Start the API:

```bash
npm run dev      # nodemon, auto-restarts
# or
npm start
```

The API runs at `http://localhost:5000`. Health check: `GET /api/health`.

---

## 4. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:5000/api
npm run dev
```

The app runs at `http://localhost:5173`.

---

## 5. Running Tests

### Backend (Jest + Supertest)

Tests run against a **real** MySQL test database (not mocked).

```bash
mysql -u root -p -e "CREATE DATABASE support_ticket_system_test"
mysql -u root -p support_ticket_system_test < ../database/schema.sql
```

Create `backend/.env.test` pointing `DB_NAME` at the test database (copy
`.env` and change just that line), then:

```bash
cd backend
npm test
```

Covers: successful login, invalid password, ticket creation, unauthorized
access, cross-customer access denial, agent status updates, and 404 handling
for invalid ticket IDs.

### Postman

Import `tests/postman_collection.json` into Postman. Run the **Auth** folder
first (it stores tokens as collection variables), then **Tickets**. Run
`npm run seed` in the backend first so `agent@example.com` exists.

---

## 6. API Reference

All protected routes require `Authorization: Bearer <token>`.

| Method | Endpoint | Access | Purpose |
|--------|-----------|--------|---------|
| POST | /api/auth/register | Public | Register a customer |
| POST | /api/auth/login | Public | Log in (customer or agent) |
| GET | /api/tickets | Auth | List tickets (own for customer, all for agent). Supports `?status=&priority=&search=&sort=&order=` |
| POST | /api/tickets | Customer | Create a ticket |
| GET | /api/tickets/:id | Auth | Get ticket details |
| PUT | /api/tickets/:id | Auth | Update ticket (customer: subject/description; agent: status/priority/assigned_to) |
| DELETE | /api/tickets/:id | Auth | Delete ticket (owner customer or any agent) |
| GET | /api/tickets/:id/comments | Auth | List comments |
| POST | /api/tickets/:id/comments | Auth | Add a comment |
| GET | /api/users?role=agent | Agent | List agents (for ticket assignment) |

---

## 7. Security Notes

- Passwords hashed with bcrypt (10 salt rounds), never stored in plain text.
- JWT-based auth; tokens carry `id`, `role`, `name`, `email` and expire (`JWT_EXPIRES_IN`).
- Authorization is enforced at the query level: customers can only ever
  fetch/modify rows where `user_id` matches their own id — verified both in
  `ticketController.js` and covered by the "cannot access another
  customer's ticket" test.
- All SQL uses parameterized queries (`mysql2` placeholders) — no string
  concatenation, so no SQL injection surface.
- `.env` is git-ignored; only `.env.example` is committed.
- CORS is restricted to `FRONTEND_URL`.

---

## 8. Deployment

This app is two independently deployable pieces:

1. **MySQL** — any managed MySQL host (PlanetScale, Railway, Render, AWS RDS, etc.)
2. **Backend** — deploy `backend/` as a Node web service (Render, Railway, Fly.io, etc.). Set the env vars from `.env.example` in the platform's dashboard, then run the schema (and optionally `npm run seed`) against the managed database.
3. **Frontend** — deploy `frontend/` as a static site (Vercel, Netlify, Render Static Site). Build command `npm run build`, publish directory `dist`. Set `VITE_API_URL` to the deployed backend's `/api` URL.

After deploying, verify:
- `GET <backend-url>/api/health` returns `{"status":"ok"}`
- The frontend can register/login and reach the backend (check CORS `FRONTEND_URL` matches the deployed frontend origin)

---

## 9. Example JOIN Query (Section 8)

See `database/example_query.sql` — returns all open tickets with the
customer's name and email using a JOIN + `WHERE status = 'open'` filter.

---

## 10. Notes on Scope

Per section 15 of the assessment, optional enhancements (Docker for the app
itself, TypeScript, pagination, file attachments, email notifications,
CI/CD, Redis, monitoring) were intentionally left out to match the "junior,
1–2 years experience" scope. `docker-compose.yml` is included only to make
local MySQL setup easier, not as a full containerized deployment.
