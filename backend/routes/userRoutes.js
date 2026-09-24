const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getUsers } = require('../controllers/userController');

router.get('/', authenticate, authorize('agent'), getUsers);

module.exports = router;
