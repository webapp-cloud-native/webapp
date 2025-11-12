const { User } = require("../models/User");
const { validationResult } = require("express-validator");
const { trackQuery } = require("../utils/dbMetrics");
const logger = require("../config/logger");
const { publishUserVerification } = require("../services/snsService");
const { v4: uuidv4 } = require("uuid");

// ============================================
// CREATE USER
// ============================================
const createUser = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Validation failed",
        details: errors.array(),
      });
    }

    const { username, password, first_name, last_name } = req.body;

    // Additional validation: ensure username is lowercase email
    if (!username || typeof username !== "string") {
      return res.status(400).json({
        error: "Bad Request",
        message: "Username is required and must be a string",
      });
    }

    // Generate verification token and timestamp
    const verificationToken = uuidv4();
    const tokenCreatedAt = new Date();

    // Create user with metrics tracking
    const user = await trackQuery(
      () =>
        User.create({
          username: username.toLowerCase(),
          password,
          first_name,
          last_name,
          is_verified: false,
          verification_token: verificationToken,
          token_created_at: tokenCreatedAt,
        }),
      "insert",
      "users"
    );

    logger.info("User created successfully", {
      userId: user.id,
      username: user.username,
    });

    // Publish to SNS for email verification
    try {
      await publishUserVerification(
        user.username,
        verificationToken,
        user.first_name
      );
      logger.info("Verification email request published to SNS", {
        userId: user.id,
        email: user.username,
      });
    } catch (snsError) {
      logger.error("Failed to publish verification email to SNS", {
        userId: user.id,
        email: user.username,
        error: snsError.message,
      });
      // Note: We don't fail user creation if SNS publishing fails
      // The user is created but verification email won't be sent
    }

    // Return user without password and verification token
    const userResponse = {
      id: user.id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      account_created: user.account_created,
      account_updated: user.account_updated,
    };

    res.status(201).json(userResponse);
  } catch (error) {
    logger.error("Error creating user", {
      error: error.message,
      stack: error.stack,
    });

    // Handle unique constraint errors
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        error: "Bad Request",
        message: "User with this username already exists",
      });
    }

    // Handle validation errors
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        error: "Bad Request",
        message: "Validation failed",
        details: error.errors.map((err) => ({
          field: err.path,
          message: err.message,
        })),
      });
    }

    res.status(500).json({
      error: "Internal Server Error",
      message: "An error occurred while creating the user",
    });
  }
};

// ============================================
// GET USER INFORMATION
// ============================================
const getUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId is a number
    if (!/^\d+$/.test(userId)) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Invalid user ID format",
      });
    }

    // Convert userId to integer
    const requestedUserId = parseInt(userId, 10);

    // Check if the authenticated user is trying to access their own account
    if (requestedUserId !== req.user.id) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You can only access your own account information",
      });
    }

    const user = req.user; // Set by authentication middleware

    logger.info("User information retrieved", {
      userId: user.id,
    });

    // Return user information without password and verification fields
    const userResponse = {
      id: user.id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      account_created: user.account_created,
      account_updated: user.account_updated,
    };

    res.status(200).json(userResponse);
  } catch (error) {
    logger.error("Error getting user", {
      error: error.message,
      stack: error.stack,
      userId: req.params.userId,
    });
    res.status(500).json({
      error: "Internal Server Error",
      message: "An error occurred while retrieving user information",
    });
  }
};

// ============================================
// UPDATE USER INFORMATION
// ============================================
const updateUser = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Validation failed",
        details: errors.array(),
      });
    }

    const { userId } = req.params;

    // Validate userId is a number
    if (!/^\d+$/.test(userId)) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Invalid user ID format",
      });
    }

    // Convert userId to integer
    const requestedUserId = parseInt(userId, 10);

    // Check if the authenticated user is trying to update their own account
    if (requestedUserId !== req.user.id) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You can only update your own account information",
      });
    }

    const user = req.user; // Set by authentication middleware
    const allowedFields = ["first_name", "last_name", "password"];
    const updateData = {};

    // Only allow updates to specific fields
    for (const field in req.body) {
      if (allowedFields.includes(field)) {
        updateData[field] = req.body[field];
      } else {
        return res.status(400).json({
          error: "Bad Request",
          message: `Field '${field}' cannot be updated`,
        });
      }
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: "Bad Request",
        message: "No valid fields provided for update",
      });
    }

    // Update user with metrics tracking
    await trackQuery(() => user.update(updateData), "update", "users");

    logger.info("User updated successfully", {
      userId: user.id,
      updatedFields: Object.keys(updateData),
    });

    // Return 204 No Content as per assignment requirements
    res.status(204).send();
  } catch (error) {
    logger.error("Error updating user", {
      error: error.message,
      stack: error.stack,
      userId: req.params.userId,
    });

    // Handle validation errors
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        error: "Bad Request",
        message: "Validation failed",
        details: error.errors.map((err) => ({
          field: err.path,
          message: err.message,
        })),
      });
    }

    res.status(500).json({
      error: "Internal Server Error",
      message: "An error occurred while updating user information",
    });
  }
};

// ============================================
// VERIFY USER EMAIL
// ============================================
const verifyUser = async (req, res) => {
  try {
    const { email, token } = req.query;

    // Validate required query parameters
    if (!email || !token) {
      logger.warn("Email verification failed: missing parameters", {
        email: email || "missing",
        hasToken: !!token,
      });
      return res.status(400).json({
        error: "Bad Request",
        message: "Email and token are required",
      });
    }

    logger.info("Email verification attempt", {
      email: email,
      tokenPrefix: token.substring(0, 8) + "...", // Log partial token for security
    });

    // Find user by email
    const user = await trackQuery(
      () => User.findOne({ where: { username: email.toLowerCase() } }),
      "select",
      "users"
    );

    if (!user) {
      logger.warn("Verification failed: user not found", { email });
      return res.status(404).json({
        error: "Not Found",
        message: "User not found",
      });
    }

    // Check if user is already verified
    if (user.is_verified) {
      logger.info("User already verified", {
        userId: user.id,
        email: user.username,
      });
      return res.status(200).json({
        message: "Email is already verified. You can log in.",
      });
    }

    // Validate token matches
    if (user.verification_token !== token) {
      logger.warn("Verification failed: invalid token", {
        userId: user.id,
        email: user.username,
        expectedTokenPrefix: user.verification_token
          ? user.verification_token.substring(0, 8) + "..."
          : "null",
        providedTokenPrefix: token.substring(0, 8) + "...",
      });
      return res.status(400).json({
        error: "Bad Request",
        message: "Invalid verification token",
      });
    }

    // Check if token has expired (1 minute = 60,000 ms)
    const tokenAge = Date.now() - new Date(user.token_created_at).getTime();
    const oneMinuteInMs = 60 * 1000;

    if (tokenAge > oneMinuteInMs) {
      logger.warn("Verification failed: token expired", {
        userId: user.id,
        email: user.username,
        tokenAgeSeconds: Math.floor(tokenAge / 1000),
        expirySeconds: 60,
      });
      return res.status(400).json({
        error: "Bad Request",
        message:
          "Verification link has expired. Please request a new verification email.",
      });
    }

    // Mark user as verified
    await trackQuery(
      () =>
        user.update({
          is_verified: true,
          verification_token: null,
          token_created_at: null,
        }),
      "update",
      "users"
    );

    logger.info("User verified successfully", {
      userId: user.id,
      email: user.username,
      verificationTimeSeconds: Math.floor(tokenAge / 1000),
    });

    res.status(200).json({
      message: "Email verified successfully. You can now log in.",
    });
  } catch (error) {
    logger.error("Error verifying user", {
      error: error.message,
      stack: error.stack,
      email: req.query.email,
    });

    res.status(500).json({
      error: "Internal Server Error",
      message: "An error occurred while verifying email",
    });
  }
};

// ============================================
// EXPORTS
// ============================================
module.exports = {
  createUser,
  getUser,
  updateUser,
  verifyUser,
};
