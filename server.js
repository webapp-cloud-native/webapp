require("dotenv").config();
const express = require("express");
const { ensureDatabaseExists } = require("./src/config/database");
const {
  initializeDatabase,
  closeDatabaseConnection,
} = require("./src/services/databaseService");
const healthRoutes = require("./src/routes/healthRoutes");
const errorHandler = require("./src/middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 8080;
const HOST = "127.0.0.1";

app.use("/", healthRoutes);

app.use((req, res) => {
  res
    .set({
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      "X-Content-Type-Options": "nosniff",
    })
    .status(404)
    .send();
});

app.use(errorHandler);

async function startServer() {
  try {
    console.log("Starting Health Check API...");

    await ensureDatabaseExists();

    await initializeDatabase();

    app.listen(PORT, HOST, () => {
      console.log(`Server running on http://${HOST}:${PORT}`);
      console.log("Ready to receive requests");
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  }
}

const shutdown = async (signal) => {
  console.log(`Received ${signal}, shutting down gracefully...`);
  await closeDatabaseConnection();
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

startServer();
