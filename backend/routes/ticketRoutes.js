const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getTickets, getTicketById, createTicket, updateTicket, deleteTicket,
} = require('../controllers/ticketController');
const { getComments, addComment } = require('../controllers/commentController');

// All ticket routes require authentication.
router.use(authenticate);

router.get('/', getTickets);
router.post('/', createTicket);
router.get('/:id', getTicketById);
router.put('/:id', updateTicket);
router.delete('/:id', deleteTicket);

router.get('/:id/comments', getComments);
router.post('/:id/comments', addComment);

module.exports = router;
