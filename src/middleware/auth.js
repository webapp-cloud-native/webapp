const { authenticateFromHeader } = require("../services/authService");

/**
 * Authentication middleware for protected routes
 * Validates Basic Authentication and sets req.user
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.get("Authorization");

    if (!authHeader) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required. Please provide valid credentials.",
      });
    }

    // Authenticate user using function instead of class method
    const user = await authenticateFromHeader(authHeader);

    if (!user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid credentials provided.",
      });
    }

    // Set user in request object for use in route handlers
    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "An error occurred during authentication",
    });
  }
};

/**
 * Optional authentication middleware
 * Sets req.user if valid credentials provided, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.get("Authorization");

    if (authHeader) {
      const user = await authenticateFromHeader(authHeader);
      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    console.error("Optional authentication error:", error);
    // Continue without authentication for optional auth
    next();
  }
};

module.exports = {
  authenticate,
  optionalAuth,
};
