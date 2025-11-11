const express = require("express");
const { body, param } = require("express-validator");
const {
  createProduct,
  getProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
const { authenticate } = require("../middleware/auth");
const { requireVerification } = require("../middleware/verificationCheck");

const router = express.Router();

// Validation middleware for product creation
const validateProductCreation = [
  body("name")
    .notEmpty()
    .withMessage("Product name is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Product name must be between 1-255 characters")
    .trim()
    .custom((value) => {
      if (!value || value.length === 0) {
        throw new Error("Product name cannot be empty");
      }
      return true;
    }),
  body("description")
    .notEmpty()
    .withMessage("Product description is required")
    .isLength({ min: 1, max: 2000 })
    .withMessage("Product description must be between 1-2000 characters")
    .trim()
    .custom((value) => {
      if (!value || value.length === 0) {
        throw new Error("Product description cannot be empty");
      }
      return true;
    }),
  body("sku")
    .notEmpty()
    .withMessage("SKU is required")
    .isLength({ min: 1, max: 100 })
    .withMessage("SKU must be between 1-100 characters")
    .trim()
    .custom((value) => {
      if (!value || value.length === 0) {
        throw new Error("SKU cannot be empty");
      }
      return true;
    }),
  body("manufacturer")
    .notEmpty()
    .withMessage("Manufacturer is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Manufacturer must be between 1-255 characters")
    .trim()
    .custom((value) => {
      if (!value || value.length === 0) {
        throw new Error("Manufacturer cannot be empty");
      }
      return true;
    }),
  body("quantity")
    .isInt({ min: 0, max: 100 })
    .withMessage("Quantity must be an integer between 0 and 100")
    .custom((value) => {
      if (value % 1 !== 0) {
        throw new Error("Quantity must be a multiple of 1");
      }
      return true;
    }),
];

// Validation middleware for product updates
const validateProductUpdate = [
  body("name")
    .optional()
    .notEmpty()
    .withMessage("Product name cannot be empty")
    .isLength({ min: 1, max: 255 })
    .withMessage("Product name must be between 1-255 characters")
    .trim()
    .custom((value) => {
      if (value === "") {
        throw new Error("Product name cannot be empty");
      }
      return true;
    }),
  body("description")
    .optional()
    .notEmpty()
    .withMessage("Product description cannot be empty")
    .isLength({ min: 1, max: 2000 })
    .withMessage("Product description must be between 1-2000 characters")
    .trim()
    .custom((value) => {
      if (value === "") {
        throw new Error("Product description cannot be empty");
      }
      return true;
    }),
  body("sku")
    .optional()
    .notEmpty()
    .withMessage("SKU cannot be empty")
    .isLength({ min: 1, max: 100 })
    .withMessage("SKU must be between 1-100 characters")
    .trim()
    .custom((value) => {
      if (value === "") {
        throw new Error("SKU cannot be empty");
      }
      return true;
    }),
  body("manufacturer")
    .optional()
    .notEmpty()
    .withMessage("Manufacturer cannot be empty")
    .isLength({ min: 1, max: 255 })
    .withMessage("Manufacturer must be between 1-255 characters")
    .trim()
    .custom((value) => {
      if (value === "") {
        throw new Error("Manufacturer cannot be empty");
      }
      return true;
    }),
  body("quantity")
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage("Quantity must be an integer between 0 and 100")
    .custom((value) => {
      if (value % 1 !== 0) {
        throw new Error("Quantity must be a multiple of 1");
      }
      return true;
    }),
];

// Product ID validation middleware
const validateProductId = [
  param("productId").custom((value) => {
    // Check if it's a positive integer
    const num = parseInt(value, 10);
    if (
      isNaN(num) ||
      num < 1 ||
      !Number.isInteger(num) ||
      value !== num.toString()
    ) {
      throw new Error("Product ID must be a positive integer");
    }
    return true;
  }),
];

// POST /v1/product - Create product (FIXED ORDER: authenticate THEN requireVerification)
router.post(
  "/v1/product",
  authenticate,
  requireVerification,
  validateProductCreation,
  createProduct
);

// GET /v1/product/:productId - Get product (public, no auth required)
router.get("/v1/product/:productId", validateProductId, getProduct);

// PUT /v1/product/:productId - Update product (FIXED ORDER)
router.put(
  "/v1/product/:productId",
  authenticate,
  requireVerification,
  validateProductId,
  validateProductUpdate,
  updateProduct
);

// PATCH /v1/product/:productId - Partial update (FIXED ORDER)
router.patch(
  "/v1/product/:productId",
  authenticate,
  requireVerification,
  validateProductId,
  validateProductUpdate,
  updateProduct
);

// DELETE /v1/product/:productId - Delete product (FIXED ORDER)
router.delete(
  "/v1/product/:productId",
  authenticate,
  requireVerification,
  validateProductId,
  deleteProduct
);

// Handle method not allowed for product endpoints
router.all("/v1/product", (req, res) => {
  if (req.method !== "POST") {
    res.set("Allow", "POST");
    return res.status(405).json({
      error: "Method Not Allowed",
      message: "Only POST method is allowed for product creation",
    });
  }
});

router.all("/v1/product/:productId", (req, res) => {
  if (!["GET", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    res.set("Allow", "GET, PUT, PATCH, DELETE");
    return res.status(405).json({
      error: "Method Not Allowed",
      message:
        "Only GET, PUT, PATCH, and DELETE methods are allowed for product operations",
    });
  }
});

module.exports = router;