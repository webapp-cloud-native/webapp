const { AuthService } = require("../services/authService");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.get("Authorization");

    if (!authHeader) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required. Please provide valid credentials.",
      });
    }

    // Authenticate user
    const user = await AuthService.authenticateFromHeader(authHeader);

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


const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.get("Authorization");

    if (authHeader) {
      const user = await AuthService.authenticateFromHeader(authHeader);
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
