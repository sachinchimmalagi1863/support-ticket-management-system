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

The same collection can also be pointed at the live Railway deployment
instead of `localhost:5000` — set the collection's `baseUrl` variable to
`https://support-ticket-management-system-production.up.railway.app/api`
and re-run the same folders. A Postman API Testing Report (PDF), documenting
registration, login, ticket CRUD, and the authorization/validation edge
cases run against the deployed production API, is included alongside this
README.

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

This app is deployed as two independently deployable pieces, both hosted on **Railway**:

1. **MySQL** — provisioned as a Railway MySQL plugin/service, attached to the backend service via Railway's internal networking. Connection env vars (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`) are pulled from the MySQL service's Railway-generated variables.
2. **Backend** — deployed as a Railway web service from the `backend/` directory. Env vars from `.env.example` are set in the Railway service's **Variables** tab, the schema is run against the Railway MySQL instance (and `npm run seed` for demo data), and Railway builds/starts the service automatically on push (`npm start`).
   Live backend: `https://support-ticket-management-system-production.up.railway.app`
3. **Frontend** — deploy `frontend/` as a static site (Vercel, Netlify, Render Static Site, or a second Railway static/Node service). Build command `npm run build`, publish directory `dist`. Set `VITE_API_URL` to the deployed backend's `/api` URL, e.g. `https://support-ticket-management-system-production.up.railway.app/api`.

After deploying, verify:
- `GET https://support-ticket-management-system-production.up.railway.app/api/health` returns `{"status":"ok"}`
- The frontend can register/login and reach the backend (check CORS `FRONTEND_URL` matches the deployed frontend origin)
- Railway's deploy logs show the service listening on the `PORT` Railway injects (the app reads `process.env.PORT`, falling back to `5000` locally)

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