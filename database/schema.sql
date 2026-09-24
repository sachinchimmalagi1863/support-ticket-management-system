-- Support Ticket Management System - Database Schema
-- Run this after creating the database:
--   CREATE DATABASE support_ticket_system;
--   USE support_ticket_system;
--   SOURCE schema.sql;

DROP TABLE IF EXISTS ticket_comments;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120)  NOT NULL,
  email         VARCHAR(160)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  role          ENUM('customer', 'agent') NOT NULL DEFAULT 'customer',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE tickets (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,                 -- the customer who raised the ticket
  subject      VARCHAR(200) NOT NULL,
  description  TEXT NOT NULL,
  priority     ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
  status       ENUM('open', 'in_progress', 'resolved', 'closed') NOT NULL DEFAULT 'open',
  assigned_to  INT NULL,                     -- agent handling the ticket
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_ticket_customer FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ticket_agent    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,

  INDEX idx_tickets_user_id (user_id),
  INDEX idx_tickets_status (status),
  INDEX idx_tickets_priority (priority),
  INDEX idx_tickets_assigned_to (assigned_to)
) ENGINE=InnoDB;

CREATE TABLE ticket_comments (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id  INT NOT NULL,
  user_id    INT NOT NULL,                   -- author of the comment (customer or agent)
  comment    TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_comment_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  CONSTRAINT fk_comment_user   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  INDEX idx_comments_ticket_id (ticket_id)
) ENGINE=InnoDB;
