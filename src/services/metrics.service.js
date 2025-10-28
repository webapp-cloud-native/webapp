const StatsD = require("hot-shots");

class MetricsService {
  constructor() {
    // Initialize StatsD client
    this.client = new StatsD({
      host: process.env.STATSD_HOST || "localhost",
      port: process.env.STATSD_PORT || 8125,
      prefix: "webapp.",
      globalTags: {
        env: process.env.NODE_ENV || "development",
        service: "webapp",
      },
      errorHandler: (error) => {
        console.error("StatsD Error:", error);
      },
    });

    console.log("Metrics service initialized with StatsD");
  }

  /**
   * Increment API call counter
   * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
   * @param {string} endpoint - API endpoint path
   * @param {number} statusCode - HTTP status code
   */
  incrementAPICall(method, endpoint, statusCode) {
    const sanitizedEndpoint = this.sanitizeEndpoint(endpoint);
    const metricName = `api.${method.toLowerCase()}.${sanitizedEndpoint}.count`;

    this.client.increment(metricName, 1, {
      status_code: statusCode.toString(),
      method: method,
    });
  }

  /**
   * Record API call duration
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint path
   * @param {number} duration - Duration in milliseconds
   * @param {number} statusCode - HTTP status code
   */
  recordAPICallDuration(method, endpoint, duration, statusCode) {
    const sanitizedEndpoint = this.sanitizeEndpoint(endpoint);
    const metricName = `api.${method.toLowerCase()}.${sanitizedEndpoint}.duration`;

    this.client.timing(metricName, duration, {
      status_code: statusCode.toString(),
      method: method,
    });
  }

  /**
   * Record database query duration
   * @param {string} operation - Database operation (select, insert, update, delete)
   * @param {string} table - Table name
   * @param {number} duration - Duration in milliseconds
   */
  recordDatabaseQuery(operation, table, duration) {
    const metricName = `db.${operation.toLowerCase()}.${table}.duration`;

    this.client.timing(metricName, duration, {
      operation: operation,
      table: table,
    });
  }

  /**
   * Record S3 operation duration
   * @param {string} operation - S3 operation (upload, delete, get)
   * @param {number} duration - Duration in milliseconds
   * @param {boolean} success - Whether operation was successful
   */
  recordS3Operation(operation, duration, success = true) {
    const metricName = `s3.${operation.toLowerCase()}.duration`;

    this.client.timing(metricName, duration, {
      operation: operation,
      success: success.toString(),
    });

    // Also increment counter
    const counterName = `s3.${operation.toLowerCase()}.count`;
    this.client.increment(counterName, 1, {
      success: success.toString(),
    });
  }

  /**
   * Sanitize endpoint for metric naming
   * Replace dynamic parts like IDs with placeholders
   * @param {string} endpoint - Original endpoint
   * @returns {string} Sanitized endpoint
   */
  sanitizeEndpoint(endpoint) {
    return endpoint
      .replace(/^\/+/, "") // Remove leading slashes
      .replace(/\/+$/, "") // Remove trailing slashes
      .replace(/\/\d+/g, "/:id") // Replace numeric IDs with :id
      .replace(/[^a-zA-Z0-9_\/:]/g, "_") // Replace special chars
      .replace(/\//g, ".") // Replace slashes with dots
      .replace(/^\.+|\.+$/g, ""); // Remove leading/trailing dots
  }

  /**
   * Close StatsD client connection
   */
  close() {
    this.client.close();
    console.log("Metrics service closed");
  }
}

// Export singleton instance
module.exports = new MetricsService();
