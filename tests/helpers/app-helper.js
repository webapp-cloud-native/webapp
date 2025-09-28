const request = require("supertest");
const express = require("express");
const TestDatabase = require("../config/test-database");

// Import your existing middleware and routes
const healthRoutes = require("../../src/routes/healthRoutes");
const userRoutes = require("../../src/routes/userRoutes");
const errorHandler = require("../../src/middleware/errorHandler");
const { jsonErrorHandler } = require("../../src/middleware/jsonErrorHandler");

class AppHelper {
  constructor() {
    this.app = null;
    this.server = null;
  }

  async createTestApp() {
    const app = express();

    // Apply same middleware as your main app
    app.use(express.json());
    app.use(jsonErrorHandler);

    // Request logging middleware (optional, for debugging)
    if (process.env.NODE_ENV === "development") {
      app.use((req, res, next) => {
        console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
        next();
      });
    }

    // Add routes
    app.use("/", healthRoutes);
    app.use("/", userRoutes);
    app.use("/", require("../../src/routes/productRoutes"));

    // 404 handler for undefined routes
    app.use((req, res) => {
      res.status(404).json({
        error: "Not Found",
        message: "The requested resource was not found on this server",
        path: req.path,
        method: req.method,
      });
    });

    // Global error handler
    app.use(errorHandler);

    this.app = app;
    return app;
  }

  async startServer() {
    return new Promise((resolve) => {
      this.server = this.app.listen(0, () => {
        const port = this.server.address().port;
        console.log(`Test server started on port ${port}`);
        resolve(port);
      });
    });
  }

  async stopServer() {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          console.log("Test server stopped");
          resolve();
        });
      });
    }
  }

  getRequest() {
    return request(this.app);
  }
}

module.exports = AppHelper;
