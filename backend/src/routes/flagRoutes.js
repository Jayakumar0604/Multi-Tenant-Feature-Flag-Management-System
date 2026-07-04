const express = require('express');
const router = express.Router();
const { createFlag, getFlags, updateFlag, deleteFlag } = require('../controllers/flagController');
const requireAuth = require('../middleware/auth');
const requireRole = require('../middleware/role');

router.use(requireAuth);
router.use(requireRole('org_admin'));

router.post('/', createFlag);
router.get('/', getFlags);
router.patch('/:id', updateFlag);
router.delete('/:id', deleteFlag);

module.exports = router;
