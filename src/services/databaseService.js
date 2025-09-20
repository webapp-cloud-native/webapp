const { sequelize } = require("../config/database");

async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    console.log("Database connection successful");

    await sequelize.sync({
      force: false,
      alter: false,
      logging: false,
    });

    await verifyTables();
  } catch (error) {
    console.error("Database initialization failed:", error.message);
    throw error;
  }
}

async function verifyTables() {
  try {
    const [results] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'health_checks'",
      { logging: false }
    );

    if (results.length === 0) {
      throw new Error("Table creation failed");
    }
  } catch (error) {
    console.error("Table verification failed:", error.message);
    throw error;
  }
}

async function closeDatabaseConnection() {
  try {
    await sequelize.close();
  } catch (error) {
    console.error("Error closing database connection:", error.message);
  }
}

module.exports = {
  initializeDatabase,
  verifyTables,
  closeDatabaseConnection,
};
