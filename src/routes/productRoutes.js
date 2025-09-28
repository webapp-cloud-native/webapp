const express = require("express");
const { body, param } = require("express-validator");
const {
  createProduct,
  getProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
const { authenticate } = require("../middleware/auth");

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

// Product ID validation middleware - FIXED
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

/**
 * @swagger
 * /v1/product:
 *   post:
 *     tags: [Product Management]
 *     summary: Create a new product
 *     description: |
 *       Create a new product with the provided details. User must be authenticated.
 *
 *       **Authentication Required**: HTTP Basic Auth
 *
 *       **Validation Rules**:
 *       - Name: 1-255 characters, required
 *       - Description: 1-2000 characters, required
 *       - SKU: 1-100 characters, required, must be unique
 *       - Manufacturer: 1-255 characters, required
 *       - Quantity: Integer 0-100, must be multiple of 1
 *
 *       **Ownership**: Product is automatically assigned to the authenticated user
 *     security:
 *       - basicAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductCreate'
 *           examples:
 *             basic_product:
 *               summary: Basic product example
 *               value:
 *                 name: "Professional Widget"
 *                 description: "A high-quality professional widget designed for enterprise use"
 *                 sku: "PRO-WIDGET-001"
 *                 manufacturer: "WidgetCorp Industries"
 *                 quantity: 50
 *             minimal_quantity:
 *               summary: Product with minimal quantity
 *               value:
 *                 name: "Basic Tool"
 *                 description: "A simple basic tool for everyday use"
 *                 sku: "BASIC-TOOL-001"
 *                 manufacturer: "Tool Makers Inc"
 *                 quantity: 0
 *             maximum_quantity:
 *               summary: Product with maximum quantity
 *               value:
 *                 name: "Premium Device"
 *                 description: "A premium device with advanced features"
 *                 sku: "PREM-DEV-001"
 *                 manufacturer: "Tech Solutions Ltd"
 *                 quantity: 100
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *             example:
 *               id: 1
 *               name: "Professional Widget"
 *               description: "A high-quality professional widget designed for enterprise use"
 *               sku: "PRO-WIDGET-001"
 *               manufacturer: "WidgetCorp Industries"
 *               quantity: 50
 *               date_added: "2023-09-20T14:22:00.000Z"
 *               date_last_updated: "2023-09-20T14:22:00.000Z"
 *               owner_user_id: "550e8400-e29b-41d4-a716-446655440000"
 *       400:
 *         description: Bad Request - Validation failed or SKU already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               validation_error:
 *                 summary: Validation error
 *                 value:
 *                   error: "Bad Request"
 *                   message: "Validation failed"
 *                   details:
 *                     - field: "quantity"
 *                       message: "Quantity must be an integer between 0 and 100"
 *               duplicate_sku:
 *                 summary: Duplicate SKU error
 *                 value:
 *                   error: "Bad Request"
 *                   message: "Product with this SKU already exists"
 *               quantity_too_high:
 *                 summary: Quantity validation error
 *                 value:
 *                   error: "Bad Request"
 *                   message: "Validation failed"
 *                   details:
 *                     - field: "quantity"
 *                       message: "Quantity must be an integer between 0 and 100"
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Unauthorized"
 *               message: "Authentication required. Please provide valid credentials."
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/v1/product",
  authenticate,
  validateProductCreation,
  createProduct
);

/**
 * @swagger
 * /v1/product/{productId}:
 *   get:
 *     tags: [Product Management]
 *     summary: Get product by ID
 *     description: |
 *       Retrieve a product by its unique ID. This is a public endpoint - no authentication required.
 *
 *       **Product ID Format**: Must be a positive integer (1, 2, 3, etc.)
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         description: Unique identifier of the product
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *             example:
 *               id: 1
 *               name: "Professional Widget"
 *               description: "A high-quality professional widget designed for enterprise use"
 *               sku: "PRO-WIDGET-001"
 *               manufacturer: "WidgetCorp Industries"
 *               quantity: 50
 *               date_added: "2023-09-20T14:22:00.000Z"
 *               date_last_updated: "2023-09-21T09:15:45.000Z"
 *               owner_user_id: "550e8400-e29b-41d4-a716-446655440000"
 *       400:
 *         description: Bad Request - Invalid product ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Bad Request"
 *               message: "Invalid product ID format"
 *       404:
 *         description: Not Found - Product does not exist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Not Found"
 *               message: "Product not found"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/v1/product/:productId", validateProductId, getProduct);

/**
 * @swagger
 * /v1/product/{productId}:
 *   put:
 *     tags: [Product Management]
 *     summary: Update product (complete replacement)
 *     description: |
 *       Update a product with new data. Only the product owner can update the product.
 *
 *       **Authentication Required**: HTTP Basic Auth
 *       **Ownership Required**: User must be the owner of the product
 *
 *       **Update Behavior**: PUT replaces the entire resource - all fields should be provided
 *
 *       **Validation Rules**:
 *       - Name: 1-255 characters
 *       - Description: 1-2000 characters
 *       - SKU: 1-100 characters, must be unique (can keep same SKU)
 *       - Manufacturer: 1-255 characters
 *       - Quantity: Integer 0-100, must be multiple of 1
 *     security:
 *       - basicAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         description: Unique identifier of the product to update
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductUpdate'
 *           examples:
 *             complete_update:
 *               summary: Complete product update
 *               value:
 *                 name: "Updated Professional Widget"
 *                 description: "An updated high-quality professional widget with new features"
 *                 sku: "PRO-WIDGET-002"
 *                 manufacturer: "WidgetCorp Industries Ltd"
 *                 quantity: 75
 *             quantity_change:
 *               summary: Update with quantity change
 *               value:
 *                 name: "Professional Widget"
 *                 description: "A high-quality professional widget designed for enterprise use"
 *                 sku: "PRO-WIDGET-001"
 *                 manufacturer: "WidgetCorp Industries"
 *                 quantity: 25
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *             example:
 *               id: 1
 *               name: "Updated Professional Widget"
 *               description: "An updated high-quality professional widget with new features"
 *               sku: "PRO-WIDGET-002"
 *               manufacturer: "WidgetCorp Industries Ltd"
 *               quantity: 75
 *               date_added: "2023-09-20T14:22:00.000Z"
 *               date_last_updated: "2023-09-21T16:30:15.000Z"
 *               owner_user_id: "550e8400-e29b-41d4-a716-446655440000"
 *       400:
 *         description: Bad Request - Validation failed or invalid product ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               validation_error:
 *                 summary: Validation error
 *                 value:
 *                   error: "Bad Request"
 *                   message: "Validation failed"
 *                   details:
 *                     - field: "sku"
 *                       message: "SKU cannot be empty"
 *               invalid_field:
 *                 summary: Invalid field error
 *                 value:
 *                   error: "Bad Request"
 *                   message: "Field 'invalid_field' cannot be updated"
 *               duplicate_sku:
 *                 summary: SKU conflict
 *                 value:
 *                   error: "Bad Request"
 *                   message: "Product with this SKU already exists"
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - User does not own this product
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Forbidden"
 *               message: "You can only update products that you own"
 *       404:
 *         description: Not Found - Product does not exist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Not Found"
 *               message: "Product not found"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  "/v1/product/:productId",
  authenticate,
  validateProductId,
  validateProductUpdate,
  updateProduct
);

/**
 * @swagger
 * /v1/product/{productId}:
 *   patch:
 *     tags: [Product Management]
 *     summary: Update product (partial update)
 *     description: |
 *       Partially update a product. Only the product owner can update the product.
 *
 *       **Authentication Required**: HTTP Basic Auth
 *       **Ownership Required**: User must be the owner of the product
 *
 *       **Update Behavior**: PATCH allows partial updates - only provided fields are updated
 *
 *       **Validation Rules** (for provided fields):
 *       - Name: 1-255 characters
 *       - Description: 1-2000 characters
 *       - SKU: 1-100 characters, must be unique
 *       - Manufacturer: 1-255 characters
 *       - Quantity: Integer 0-100, must be multiple of 1
 *     security:
 *       - basicAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         description: Unique identifier of the product to update
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductUpdate'
 *           examples:
 *             quantity_only:
 *               summary: Update quantity only
 *               value:
 *                 quantity: 30
 *             name_and_description:
 *               summary: Update name and description
 *               value:
 *                 name: "Premium Professional Widget"
 *                 description: "A premium high-quality professional widget with enhanced features"
 *             sku_update:
 *               summary: Update SKU
 *               value:
 *                 sku: "PRO-WIDGET-V3"
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Bad Request - Validation failed or invalid product ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - User does not own this product
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Not Found - Product does not exist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch(
  "/v1/product/:productId",
  authenticate,
  validateProductId,
  validateProductUpdate,
  updateProduct
);

/**
 * @swagger
 * /v1/product/{productId}:
 *   delete:
 *     tags: [Product Management]
 *     summary: Delete product
 *     description: |
 *       Delete a product permanently. Only the product owner can delete the product.
 *
 *       **Authentication Required**: HTTP Basic Auth
 *       **Ownership Required**: User must be the owner of the product
 *
 *       **Warning**: This operation is irreversible. The product will be permanently removed.
 *     security:
 *       - basicAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         description: Unique identifier of the product to delete
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *     responses:
 *       204:
 *         description: Product deleted successfully (no content returned)
 *       400:
 *         description: Bad Request - Invalid product ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Bad Request"
 *               message: "Invalid product ID format"
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - User does not own this product
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Forbidden"
 *               message: "You can only delete products that you own"
 *       404:
 *         description: Not Found - Product does not exist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Not Found"
 *               message: "Product not found"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
  "/v1/product/:productId",
  authenticate,
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
