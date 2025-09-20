const express = require('express');
const { healthCheck, methodNotAllowed } = require('../controllers/healthController');
const { validatePayload } = require('../middleware/validatePayload');

const router = express.Router();

router.get('/healthz', validatePayload, healthCheck);

router.use('/healthz', methodNotAllowed);

module.exports = router;