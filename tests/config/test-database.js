const { sequelize } = require('../../src/config/database');
const { initializeDatabase } = require('../../src/services/databaseService');

class TestDatabase {
  static async setup() {
    try {
      // Initialize test database
      await initializeDatabase();
      console.log('Test database initialized');
    } catch (error) {
      console.error('Test database setup failed:', error);
      throw error;
    }
  }

  static async cleanup() {
    try {
      // Close database connections
      await sequelize.close();
      console.log('Test database connections closed');
    } catch (error) {
      console.error('Test database cleanup failed:', error);
    }
  }

  static async clearData() {
    try {
      // Clear test data between tests if needed
      // You can add specific cleanup logic here
    } catch (error) {
      console.error('Test data cleanup failed:', error);
    }
  }
}

module.exports = TestDatabase;