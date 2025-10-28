const metricsService = require("../services/metrics.service");
const logger = require("../config/logger");

/**
 * Middleware to track API metrics
 * Records API call count and duration for every request
 */
const metricsMiddleware = (req, res, next) => {
  // Record start time
  const startTime = Date.now();

  // Store original end function
  const originalEnd = res.end;

  // Override res.end to capture metrics when response finishes
  res.end = function (chunk, encoding) {
    // Restore original end function
    res.end = originalEnd;

    // Calculate duration
    const duration = Date.now() - startTime;

    // Get endpoint and method
    const method = req.method;
    const endpoint = req.route ? req.route.path : req.path;
    const statusCode = res.statusCode;

    try {
      // Increment API call counter
      metricsService.incrementAPICall(method, endpoint, statusCode);

      // Record API call duration
      metricsService.recordAPICallDuration(
        method,
        endpoint,
        duration,
        statusCode
      );

      // Log the request
      logger.info("API Request", {
        method: method,
        endpoint: endpoint,
        statusCode: statusCode,
        duration: duration,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get("user-agent"),
      });
    } catch (error) {
      logger.error("Failed to record metrics", {
        error: error.message,
        stack: error.stack,
      });
    }

    // Call original end function
    res.end(chunk, encoding);
  };

  next();
};

module.exports = metricsMiddleware;
