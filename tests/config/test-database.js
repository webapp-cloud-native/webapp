const { sequelize } = require("../../src/config/database");
const { initializeDatabase } = require("../../src/services/databaseService");

class TestDatabase {
  static async setup() {
    try {
      // Initialize test database
      await initializeDatabase();
      console.log("Test database initialized");
    } catch (error) {
      console.error("Test database setup failed:", error);
      throw error;
    }
  }

  static async cleanup() {
    try {
      // Close database connections
      await sequelize.close();
      console.log("Test database connections closed");
    } catch (error) {
      console.error("Test database cleanup failed:", error);
    }
  }

  static async clearData() {
    try {
      // Clear test data between tests in the correct order (respecting foreign key constraints)
      // Clear products first (they reference users)
      await sequelize.query("DELETE FROM products WHERE 1=1", {
        logging: false,
      });

      // Clear users
      await sequelize.query("DELETE FROM users WHERE 1=1", { logging: false });

      // Clear health checks
      await sequelize.query("DELETE FROM health_checks WHERE 1=1", {
        logging: false,
      });

      console.log("Test data cleared");
    } catch (error) {
      console.error("Test data cleanup failed:", error);
      // Don't throw error here as it might be expected in some test scenarios
    }
  }

  static async clearUsers() {
    try {
      // Clear only users table (useful for user-specific tests)
      await sequelize.query("DELETE FROM products WHERE 1=1", {
        logging: false,
      });
      await sequelize.query("DELETE FROM users WHERE 1=1", { logging: false });
      console.log("User test data cleared");
    } catch (error) {
      console.error("User test data cleanup failed:", error);
    }
  }

  static async getUserCount() {
    try {
      const [results] = await sequelize.query(
        "SELECT COUNT(*) as count FROM users",
        { logging: false }
      );
      return parseInt(results[0].count);
    } catch (error) {
      console.error("Error getting user count:", error);
      return 0;
    }
  }

  // Use the same method as clearData - it was working correctly
  static async safeClearData() {
    await this.clearData();
  }
}

module.exports = TestDatabase;