const metricsService = require("../services/metrics.service");

/**
 * Wrapper to track database query performance
 * @param {Function} queryFunction - The async database query function to execute
 * @param {string} operation - Operation type (select, insert, update, delete, create)
 * @param {string} table - Table name
 * @returns {Promise} - Result of the query function
 */
async function trackDatabaseQuery(queryFunction, operation, table) {
  const startTime = Date.now();

  try {
    const result = await queryFunction();
    const duration = Date.now() - startTime;

    // Record successful query
    metricsService.recordDatabaseQuery(operation, table, duration);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    // Record failed query (still track timing)
    metricsService.recordDatabaseQuery(operation, table, duration);

    // Re-throw the error so calling code can handle it
    throw error;
  }
}

/**
 * Helper to wrap Sequelize model methods with metrics
 * Usage: await trackQuery(() => User.findByPk(id), 'select', 'users')
 */
const trackQuery = trackDatabaseQuery;

module.exports = {
  trackDatabaseQuery,
  trackQuery,
};
