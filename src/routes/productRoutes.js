const express = require('express');
const { body, param } = require('express-validator');
const { createProduct, getProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Validation middleware for product creation
const validateProductCreation = [
  body('name')
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Product name must be between 1-255 characters')
    .trim(),
  body('description')
    .notEmpty()
    .withMessage('Product description is required')
    .isLength({ min: 1, max: 2000 })
    .withMessage('Product description must be between 1-2000 characters')
    .trim(),
  body('sku')
    .notEmpty()
    .withMessage('SKU is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('SKU must be between 1-100 characters')
    .trim(),
  body('manufacturer')
    .notEmpty()
    .withMessage('Manufacturer is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Manufacturer must be between 1-255 characters')
    .trim(),
  body('quantity')
    .isInt({ min: 0, max: 100 })
    .withMessage('Quantity must be an integer between 0 and 100')
    .custom((value) => {
      if (value % 1 !== 0) {
        throw new Error('Quantity must be a multiple of 1');
      }
      return true;
    })
];

// Validation middleware for product updates
const validateProductUpdate = [
  body('name')
    .optional()
    .notEmpty()
    .withMessage('Product name cannot be empty')
    .isLength({ min: 1, max: 255 })
    .withMessage('Product name must be between 1-255 characters')
    .trim(),
  body('description')
    .optional()
    .notEmpty()
    .withMessage('Product description cannot be empty')
    .isLength({ min: 1, max: 2000 })
    .withMessage('Product description must be between 1-2000 characters')
    .trim(),
  body('sku')
    .optional()
    .notEmpty()
    .withMessage('SKU cannot be empty')
    .isLength({ min: 1, max: 100 })
    .withMessage('SKU must be between 1-100 characters')
    .trim(),
  body('manufacturer')
    .optional()
    .notEmpty()
    .withMessage('Manufacturer cannot be empty')
    .isLength({ min: 1, max: 255 })
    .withMessage('Manufacturer must be between 1-255 characters')
    .trim(),
  body('quantity')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Quantity must be an integer between 0 and 100')
    .custom((value) => {
      if (value % 1 !== 0) {
        throw new Error('Quantity must be a multiple of 1');
      }
      return true;
    })
];

// Product ID validation middleware
const validateProductId = [
  param('productId')
    .isInt({ min: 1 })
    .withMessage('Product ID must be a positive integer')
];

// POST /v1/product - Create a new product (requires authentication)
router.post('/v1/product', authenticate, validateProductCreation, createProduct);

// GET /v1/product/:productId - Get product by ID
router.get('/v1/product/:productId', validateProductId, getProduct);

// PUT /v1/product/:productId - Update product (requires authentication and ownership)
router.put('/v1/product/:productId', authenticate, validateProductId, validateProductUpdate, updateProduct);

// PATCH /v1/product/:productId - Partial update product (requires authentication and ownership)
router.patch('/v1/product/:productId', authenticate, validateProductId, validateProductUpdate, updateProduct);

// DELETE /v1/product/:productId - Delete product (requires authentication and ownership)
router.delete('/v1/product/:productId', authenticate, validateProductId, deleteProduct);

// Handle method not allowed for product endpoints
router.all('/v1/product', (req, res) => {
  if (req.method !== 'POST') {
    res.set('Allow', 'POST');
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: 'Only POST method is allowed for product creation'
    });
  }
});

router.all('/v1/product/:productId', (req, res) => {
  if (!['GET', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    res.set('Allow', 'GET, PUT, PATCH, DELETE');
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: 'Only GET, PUT, PATCH, and DELETE methods are allowed for product operations'
    });
  }
});

module.exports = router;