const express = require('express');
const router = express.Router();
const { listPublicOrganizations, checkFlag } = require('../controllers/publicController');

router.get('/organizations/public', listPublicOrganizations);
router.post('/flags/check', checkFlag);

module.exports = router;
