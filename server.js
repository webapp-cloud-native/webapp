require("dotenv").config();
const express = require("express");
const { ensureDatabaseExists } = require("./src/config/database");
const {
  initializeDatabase,
  closeDatabaseConnection,
} = require("./src/services/databaseService");

// Import routes
const healthRoutes = require("./src/routes/healthRoutes");
const userRoutes = require("./src/routes/userRoutes");
const productRoutes = require("./src/routes/productRoutes");
const docsRoutes = require("./src/routes/docsRoutes");

// Import middleware
const errorHandler = require("./src/middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 8080;
const HOST = "127.0.0.1"; // IPv4 binding to prevent IPv6 connection attempts

// Middleware for parsing JSON
app.use(express.json());

// Request logging middleware (optional, for debugging)
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
  });
}

// Routes
app.use("/", docsRoutes); // API documentation routes
app.use("/", healthRoutes); // Health check routes
app.use("/", userRoutes); // User management routes
app.use("/", productRoutes); // Product management routes

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: "The requested resource was not found on this server",
    path: req.path,
    method: req.method,
  });
});

// Global error handler (must be last middleware)
app.use(errorHandler);

async function startServer() {
  try {
    console.log("Starting Web Application Server...");

    // Ensure database exists
    await ensureDatabaseExists();
    console.log("Database bootstrapping completed");

    // Initialize database tables and associations
    await initializeDatabase();

    // Start HTTP server
    const server = app.listen(PORT, HOST, () => {
      console.log(`Server running on http://${HOST}:${PORT}`);
      console.log("Environment:", process.env.NODE_ENV || "development");
      console.log("API Documentation: http://127.0.0.1:8080/api-docs");
      console.log("Ready to receive requests");
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal) => {
      console.log(`Received ${signal}, initiating graceful shutdown...`);

      server.close(async () => {
        console.log("HTTP server closed");
        await closeDatabaseConnection();
        console.log("Database connections closed");
        process.exit(0);
      });

      // Force close server after 30 seconds
      setTimeout(() => {
        console.error(
          "Could not close connections in time, forcefully shutting down"
        );
        process.exit(1);
      }, 30000);
    };

    // Handle shutdown signals
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    console.error("Failed to start server:", error.message);
    console.error("Full error:", error);
    await closeDatabaseConnection();
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on("uncaughtException", async (error) => {
  console.error("Uncaught Exception:", error);
  await closeDatabaseConnection();
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", async (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  await closeDatabaseConnection();
  process.exit(1);
});

startServer();
