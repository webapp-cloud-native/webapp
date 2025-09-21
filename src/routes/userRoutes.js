const express = require('express');
const { body } = require('express-validator');
const { createUser, getUser, updateUser } = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Validation middleware for user creation
const validateUserCreation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('first_name')
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('First name must be between 1-100 characters')
    .trim(),
  body('last_name')
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name must be between 1-100 characters')
    .trim()
];

// Validation middleware for user updates
const validateUserUpdate = [
  body('first_name')
    .optional()
    .notEmpty()
    .withMessage('First name cannot be empty')
    .isLength({ min: 1, max: 100 })
    .withMessage('First name must be between 1-100 characters')
    .trim(),
  body('last_name')
    .optional()
    .notEmpty()
    .withMessage('Last name cannot be empty')
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name must be between 1-100 characters')
    .trim(),
  body('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

// POST /v1/user - Create a new user
router.post('/v1/user', validateUserCreation, createUser);

// GET /v1/user/self - Get current user information (requires authentication)
router.get('/v1/user/self', authenticate, getUser);

// PUT /v1/user/self - Update user information (requires authentication)
router.put('/v1/user/self', authenticate, validateUserUpdate, updateUser);

// Handle method not allowed for user endpoints
router.all('/v1/user', (req, res) => {
  if (req.method !== 'POST') {
    res.set('Allow', 'POST');
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: 'Only POST method is allowed for user creation'
    });
  }
});

router.all('/v1/user/self', (req, res) => {
  if (!['GET', 'PUT'].includes(req.method)) {
    res.set('Allow', 'GET, PUT');
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: 'Only GET and PUT methods are allowed for user self endpoints'
    });
  }
});

module.exports = router;