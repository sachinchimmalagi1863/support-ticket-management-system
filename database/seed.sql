-- Support Ticket Management System - Sample Data
--
-- NOTE ON PASSWORDS:
-- Real bcrypt hashes cannot be safely hand-written into a .sql file.
-- Run `npm run seed` from /backend instead (see backend/scripts/seed.js) --
-- it creates the demo users below with properly bcrypt-hashed passwords
-- and then inserts this same ticket/comment data. This file is kept as a
-- reference for the schema-required "seed script" and can be run AFTER
-- backend/scripts/seed.js has created users with ids 1 and 2.
--
-- Demo accounts created by `npm run seed`:
--   agent@example.com    / Password123!   (role: agent)
--   customer@example.com / Password123!   (role: customer)

INSERT INTO tickets (user_id, subject, description, priority, status, assigned_to) VALUES
  (2, 'Cannot log into my account', 'I keep getting an "invalid credentials" error even though I am sure my password is correct.', 'high', 'open', NULL),
  (2, 'Invoice amount looks wrong', 'My latest invoice charged me twice for the same subscription period. Please check.', 'medium', 'in_progress', 1),
  (2, 'Feature request: dark mode', 'It would be great to have a dark mode option in the dashboard settings.', 'low', 'resolved', 1);

INSERT INTO ticket_comments (ticket_id, user_id, comment) VALUES
  (2, 2, 'Just to add, this has been happening since yesterday afternoon.'),
  (2, 1, 'Thanks for the report - we are looking into the billing discrepancy now.'),
  (3, 1, 'Added to our roadmap, thanks for the suggestion!');
