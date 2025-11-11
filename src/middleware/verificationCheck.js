const logger = require("../config/logger");

/**
 * Middleware to check if user's email is verified
 * Should be used after authentication middleware
 */
const requireVerification = (req, res, next) => {
  try {
    // User should be set by authentication middleware
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
      });
    }

    // BYPASS verification check in test environment
    if (process.env.NODE_ENV === "test") {
      return next();
    }

    // Check if user is verified
    if (!req.user.is_verified) {
      logger.warn("Unverified user attempted to access protected resource", {
        userId: req.user.id,
        email: req.user.username,
      });

      return res.status(403).json({
        error: "Forbidden",
        message:
          "Email verification required. Please verify your email before accessing this resource.",
      });
    }

    // User is verified, proceed
    next();
  } catch (error) {
    logger.error("Error in verification check middleware", {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      error: "Internal Server Error",
      message: "An error occurred while checking verification status",
    });
  }
};

module.exports = {
  requireVerification,
};
