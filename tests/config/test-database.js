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

      // Reset sequences for auto-increment fields
      await this.resetSequences();

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
      await this.resetSequences();
      console.log("User test data cleared");
    } catch (error) {
      console.error("User test data cleanup failed:", error);
    }
  }

  static async resetSequences() {
    try {
      // Reset PostgreSQL sequences to start from 1
      await sequelize.query(
        "ALTER SEQUENCE IF EXISTS users_id_seq RESTART WITH 1",
        { logging: false }
      );
      await sequelize.query(
        "ALTER SEQUENCE IF EXISTS products_id_seq RESTART WITH 1",
        { logging: false }
      );
      await sequelize.query(
        "ALTER SEQUENCE IF EXISTS health_checks_check_id_seq RESTART WITH 1",
        { logging: false }
      );
    } catch (error) {
      console.error("Error resetting sequences:", error);
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

  static async getProductCount() {
    try {
      const [results] = await sequelize.query(
        "SELECT COUNT(*) as count FROM products",
        { logging: false }
      );
      return parseInt(results[0].count);
    } catch (error) {
      console.error("Error getting product count:", error);
      return 0;
    }
  }

  // Verify database state - useful for debugging
  static async verifyDatabaseState() {
    try {
      const userCount = await this.getUserCount();
      const productCount = await this.getProductCount();

      console.log("Database state:", {
        users: userCount,
        products: productCount,
      });

      return { users: userCount, products: productCount };
    } catch (error) {
      console.error("Error verifying database state:", error);
      return null;
    }
  }

  // Safe cleanup with retries
  static async safeClearData(retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        await this.clearData();
        return;
      } catch (error) {
        if (i === retries - 1) {
          console.error("Safe clear data failed after retries:", error);
          throw error;
        }
        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
  }

  // Truncate tables - more aggressive cleanup (use with caution)
  static async truncateTables() {
    try {
      await sequelize.query(
        "TRUNCATE TABLE products RESTART IDENTITY CASCADE",
        { logging: false }
      );
      await sequelize.query("TRUNCATE TABLE users RESTART IDENTITY CASCADE", {
        logging: false,
      });
      await sequelize.query(
        "TRUNCATE TABLE health_checks RESTART IDENTITY CASCADE",
        { logging: false }
      );
      console.log("Tables truncated");
    } catch (error) {
      console.error("Table truncation failed:", error);
      throw error;
    }
  }
}

module.exports = TestDatabase;
