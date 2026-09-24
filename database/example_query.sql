-- Section 8: Example Database Query Requirement
-- Returns all OPEN tickets along with the customer's name and email.
-- Demonstrates a JOIN plus filtering.

SELECT
  t.id          AS ticket_id,
  t.subject,
  t.priority,
  t.status,
  t.created_at,
  u.name        AS customer_name,
  u.email       AS customer_email
FROM tickets t
JOIN users u ON t.user_id = u.id
WHERE t.status = 'open'
ORDER BY t.created_at DESC;
