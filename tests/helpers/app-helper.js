const request = require('supertest');
const express = require('express');
const TestDatabase = require('../config/test-database');

// Import your existing middleware and routes
const healthRoutes = require('../../src/routes/healthRoutes');
const errorHandler = require('../../src/middleware/errorHandler');
const { jsonErrorHandler } = require('../../src/middleware/jsonErrorHandler');

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
    
    // Add routes
    app.use('/', healthRoutes);
    
    // 404 handler
    app.use((req, res) => {
      res.status(404).json({
        error: "Not Found",
        message: "The requested resource was not found on this server"
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
          console.log('Test server stopped');
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