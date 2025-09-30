const express = require("express");
const { body } = require("express-validator");
const {
  createUser,
  getUser,
  updateUser,
} = require("../controllers/userController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// Validation middleware for user creation
const validateUserCreation = [
  body("username")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
  body("first_name")
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ min: 1, max: 100 })
    .withMessage("First name must be between 1-100 characters")
    .trim(),
  body("last_name")
    .notEmpty()
    .withMessage("Last name is required")
    .isLength({ min: 1, max: 100 })
    .withMessage("Last name must be between 1-100 characters")
    .trim(),
];

// Validation middleware for user updates
const validateUserUpdate = [
  body("first_name")
    .optional()
    .notEmpty()
    .withMessage("First name cannot be empty")
    .isLength({ min: 1, max: 100 })
    .withMessage("First name must be between 1-100 characters")
    .trim(),
  body("last_name")
    .optional()
    .notEmpty()
    .withMessage("Last name cannot be empty")
    .isLength({ min: 1, max: 100 })
    .withMessage("Last name must be between 1-100 characters")
    .trim(),
  body("password")
    .optional()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
];

/**
 * @swagger
 * /v1/user:
 *   post:
 *     tags: [User Management]
 *     summary: Create a new user account
 *     description: |
 *       Register a new user with username (email), password, and personal information.
 *
 *       **Username Requirements**:
 *       - Must be a valid email format
 *       - Used as username for authentication
 *       - Must be unique across all users
 *
 *       **Password Requirements**:
 *       - Minimum 8 characters
 *       - At least one uppercase letter (A-Z)
 *       - At least one lowercase letter (a-z)
 *       - At least one number (0-9)
 *       - At least one special character (@$!%*?&)
 *
 *       **Name Requirements**:
 *       - First name: 1-100 characters, required
 *       - Last name: 1-100 characters, required
 *
 *       **Read-only Fields**: `account_created` and `account_updated` are automatically set by the system
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserCreate'
 *           examples:
 *             valid_user:
 *               summary: Valid user registration
 *               value:
 *                 username: "jane.doe@example.com"
 *                 password: "SecurePass123!"
 *                 first_name: "Jane"
 *                 last_name: "Doe"
 *             complex_password:
 *               summary: User with complex password
 *               value:
 *                 username: "john.smith@company.com"
 *                 password: "MyP@ssw0rd2023!"
 *                 first_name: "John"
 *                 last_name: "Smith"
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/User'
 *                 - type: object
 *                   properties:
 *                     password:
 *                       description: Password field is never returned in responses
 *                       readOnly: true
 *             example:
 *               id: 1
 *               username: "jane.doe@example.com"
 *               first_name: "Jane"
 *               last_name: "Doe"
 *               account_created: "2023-09-20T10:30:00.000Z"
 *               account_updated: "2023-09-20T10:30:00.000Z"
 *       400:
 *         description: Bad Request - Validation failed or username already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               duplicate_username:
 *                 summary: Username already exists
 *                 value:
 *                   error: "Bad Request"
 *                   message: "User with this username already exists"
 *               invalid_username:
 *                 summary: Invalid username format
 *                 value:
 *                   error: "Bad Request"
 *                   message: "Validation failed"
 *                   details:
 *                     - field: "username"
 *                       message: "Please provide a valid email address"
 *               weak_password:
 *                 summary: Password does not meet requirements
 *                 value:
 *                   error: "Bad Request"
 *                   message: "Validation failed"
 *                   details:
 *                     - field: "password"
 *                       message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
 *               short_password:
 *                 summary: Password too short
 *                 value:
 *                   error: "Bad Request"
 *                   message: "Validation failed"
 *                   details:
 *                     - field: "password"
 *                       message: "Password must be at least 8 characters long"
 *               missing_fields:
 *                 summary: Required fields missing
 *                 value:
 *                   error: "Bad Request"
 *                   message: "Validation failed"
 *                   details:
 *                     - field: "first_name"
 *                       message: "First name is required"
 *                     - field: "last_name"
 *                       message: "Last name is required"
 *               empty_names:
 *                 summary: Empty name fields
 *                 value:
 *                   error: "Bad Request"
 *                   message: "Validation failed"
 *                   details:
 *                     - field: "first_name"
 *                       message: "First name is required"
 *               name_too_long:
 *                 summary: Name fields too long
 *                 value:
 *                   error: "Bad Request"
 *                   message: "Validation failed"
 *                   details:
 *                     - field: "first_name"
 *                       message: "First name must be between 1-100 characters"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Internal Server Error"
 *               message: "An error occurred while creating the user"
 */
router.post("/v1/user", validateUserCreation, createUser);

/**
 * @swagger
 * /v1/user/{userId}:
 *   get:
 *     tags: [User Management]
 *     summary: Get user information
 *     description: |
 *       Retrieve the authenticated user's profile information.
 *       Users can only access their own account information.
 *
 *       **Authentication Required**: HTTP Basic Auth with username (email) and password
 *       **Authorization**: Users can only access their own account (userId must match authenticated user's ID)
 *     security:
 *       - basicAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: User ID (must be the authenticated user's ID)
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/User'
 *                 - type: object
 *                   properties:
 *                     password:
 *                       type: string
 *                       description: Password field is never returned
 *                       readOnly: true
 *             example:
 *               id: 1
 *               username: "jane.doe@example.com"
 *               first_name: "Jane"
 *               last_name: "Doe"
 *               account_created: "2023-09-20T10:30:00.000Z"
 *               account_updated: "2023-09-20T10:30:00.000Z"
 *       400:
 *         description: Bad Request - Invalid user ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Bad Request"
 *               message: "Invalid user ID format"
 *       401:
 *         description: Unauthorized - Invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Unauthorized"
 *               message: "Authentication required. Please provide valid credentials."
 *       403:
 *         description: Forbidden - Cannot access other users' accounts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Forbidden"
 *               message: "You can only access your own account information"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/v1/user/:userId", authenticate, getUser);

/**
 * @swagger
 * /v1/user/{userId}:
 *   put:
 *     tags: [User Management]
 *     summary: Update user information
 *     description: |
 *       Update the authenticated user's profile information.
 *       Users can only update their own account information.
 *
 *       **Allowed Fields**: Only `first_name`, `last_name`, and `password` can be updated.
 *
 *       **Forbidden Fields**: The following fields are read-only and cannot be updated:
 *       - `id` - System generated unique identifier
 *       - `username` - Cannot be changed after account creation
 *       - `account_created` - System managed timestamp
 *       - `account_updated` - Automatically updated by system
 *
 *       **Password Requirements** (if updating password):
 *       - Minimum 8 characters
 *       - At least one uppercase letter (A-Z)
 *       - At least one lowercase letter (a-z)
 *       - At least one number (0-9)
 *       - At least one special character (@$!%*?&)
 *
 *       **Name Requirements**:
 *       - First name: 1-100 characters (if provided)
 *       - Last name: 1-100 characters (if provided)
 *
 *       **Authentication Required**: HTTP Basic Auth with username (email) and password
 *       **Authorization**: Users can only update their own account (userId must match authenticated user's ID)
 *     security:
 *       - basicAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: User ID (must be the authenticated user's ID)
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserUpdate'
 *           examples:
 *             update_name_only:
 *               summary: Update name only
 *               value:
 *                 first_name: "Jane"
 *                 last_name: "Smith"
 *             update_password_only:
 *               summary: Update password only
 *               value:
 *                 password: "NewSecurePass456!"
 *             update_all_allowed:
 *               summary: Update all allowed fields
 *               value:
 *                 first_name: "Jane"
 *                 last_name: "Smith"
 *                 password: "NewSecurePass456!"
 *             single_field:
 *               summary: Update single field
 *               value:
 *                 first_name: "Janet"
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/User'
 *                 - type: object
 *                   properties:
 *                     password:
 *                       description: Password field is never returned
 *                       readOnly: true
 *             example:
 *               id: 1
 *               username: "jane.doe@example.com"
 *               first_name: "Jane"
 *               last_name: "Smith"
 *               account_created: "2023-09-20T10:30:00.000Z"
 *               account_updated: "2023-09-21T15:45:30.000Z"
 *       400:
 *         description: Bad Request - Validation failed or invalid fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               forbidden_field_username:
 *                 summary: Attempt to update username (forbidden)
 *                 value:
 *                   error: "Bad Request"
 *                   message: "Field 'username' cannot be updated"
 *               forbidden_field_id:
 *                 summary: Attempt to update ID (forbidden)
 *                 value:
 *                   error: "Bad Request"
 *                   message: "Field 'id' cannot be updated"
 *               forbidden_field_account_created:
 *                 summary: Attempt to update account_created (forbidden)
 *                 value:
 *                   error: "Bad Request"
 *                   message: "Field 'account_created' cannot be updated"
 *               forbidden_field_account_updated:
 *                 summary: Attempt to update account_updated (forbidden)
 *                 value:
 *                   error: "Bad Request"
 *                   message: "Field 'account_updated' cannot be updated"
 *               validation_empty_name:
 *                 summary: Empty name validation error
 *                 value:
 *                   error: "Bad Request"
 *                   message: "Validation failed"
 *                   details:
 *                     - field: "first_name"
 *                       message: "First name cannot be empty"
 *               validation_weak_password:
 *                 summary: Weak password validation
 *                 value:
 *                   error: "Bad Request"
 *                   message: "Validation failed"
 *                   details:
 *                     - field: "password"
 *                       message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
 *               validation_short_password:
 *                 summary: Short password validation
 *                 value:
 *                   error: "Bad Request"
 *                   message: "Validation failed"
 *                   details:
 *                     - field: "password"
 *                       message: "Password must be at least 8 characters long"
 *               validation_name_too_long:
 *                 summary: Name too long validation
 *                 value:
 *                   error: "Bad Request"
 *                   message: "Validation failed"
 *                   details:
 *                     - field: "first_name"
 *                       message: "First name must be between 1-100 characters"
 *               no_valid_fields:
 *                 summary: No valid fields provided
 *                 value:
 *                   error: "Bad Request"
 *                   message: "No valid fields provided for update"
 *               invalid_user_id:
 *                 summary: Invalid user ID format
 *                 value:
 *                   error: "Bad Request"
 *                   message: "Invalid user ID format"
 *       401:
 *         description: Unauthorized - Invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               missing_auth:
 *                 summary: Missing authentication
 *                 value:
 *                   error: "Unauthorized"
 *                   message: "Authentication required. Please provide valid credentials."
 *               invalid_credentials:
 *                 summary: Invalid credentials
 *                 value:
 *                   error: "Unauthorized"
 *                   message: "Invalid credentials provided."
 *       403:
 *         description: Forbidden - Cannot update other users' accounts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Forbidden"
 *               message: "You can only update your own account information"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Internal Server Error"
 *               message: "An error occurred while updating user information"
 */
router.put("/v1/user/:userId", authenticate, validateUserUpdate, updateUser);

// Handle method not allowed for user endpoints
router.all("/v1/user", (req, res) => {
  if (req.method !== "POST") {
    res.set("Allow", "POST");
    return res.status(405).json({
      error: "Method Not Allowed",
      message: "Only POST method is allowed for user creation",
    });
  }
});

router.all("/v1/user/:userId", (req, res) => {
  if (!["GET", "PUT"].includes(req.method)) {
    res.set("Allow", "GET, PUT");
    return res.status(405).json({
      error: "Method Not Allowed",
      message: "Only GET and PUT methods are allowed for user endpoints",
    });
  }
});

module.exports = router;
