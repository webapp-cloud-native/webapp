const express = require('express');
const { healthCheck, methodNotAllowed } = require('../controllers/healthController');
const { validatePayload } = require('../middleware/validatePayload');

const router = express.Router();

/**
 * @swagger
 * /healthz:
 *   get:
 *     tags: [Health Check]
 *     summary: Health check endpoint
 *     description: |
 *       Tests database connectivity by inserting a health check record.
 *       This endpoint is used by load balancers and monitoring systems
 *       to determine if the application instance is healthy.
 *       
 *       **Important**: 
 *       - No request body or query parameters are allowed
 *       - Only GET method is supported
 *       - Response body is always empty
 *     responses:
 *       200:
 *         description: Application is healthy - database connection successful
 *         headers:
 *           Cache-Control:
 *             schema:
 *               type: string
 *               example: no-cache, no-store, must-revalidate
 *           Pragma:
 *             schema:
 *               type: string
 *               example: no-cache
 *           X-Content-Type-Options:
 *             schema:
 *               type: string
 *               example: nosniff
 *       400:
 *         description: Bad Request - request contains payload or query parameters
 *         headers:
 *           Cache-Control:
 *             schema:
 *               type: string
 *               example: no-cache, no-store, must-revalidate
 *           Pragma:
 *             schema:
 *               type: string
 *               example: no-cache
 *       405:
 *         description: Method Not Allowed - only GET method is supported
 *         headers:
 *           Allow:
 *             schema:
 *               type: string
 *               example: GET
 *       503:
 *         description: Service Unavailable - database connection failed
 *         headers:
 *           Cache-Control:
 *             schema:
 *               type: string
 *               example: no-cache, no-store, must-revalidate
 */
router.get('/healthz', validatePayload, healthCheck);

/**
 * @swagger
 * /healthz:
 *   post:
 *     tags: [Health Check]
 *     summary: Method not allowed
 *     responses:
 *       405:
 *         description: Method Not Allowed
 *   put:
 *     tags: [Health Check] 
 *     summary: Method not allowed
 *     responses:
 *       405:
 *         description: Method Not Allowed
 *   patch:
 *     tags: [Health Check]
 *     summary: Method not allowed
 *     responses:
 *       405:
 *         description: Method Not Allowed
 *   delete:
 *     tags: [Health Check]
 *     summary: Method not allowed
 *     responses:
 *       405:
 *         description: Method Not Allowed
 */
router.use('/healthz', methodNotAllowed);

module.exports = router;