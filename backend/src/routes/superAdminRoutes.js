const express = require('express');
const router = express.Router();
const { createOrganization, listOrganizations } = require('../controllers/superAdminController');
const requireAuth = require('../middleware/auth');
const requireRole = require('../middleware/role');

router.use(requireAuth);
router.use(requireRole('super_admin'));

router.post('/organizations', createOrganization);
router.get('/organizations', listOrganizations);

module.exports = router;
