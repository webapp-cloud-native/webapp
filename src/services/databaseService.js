const { sequelize } = require("../config/database");
const { HealthCheck } = require("../models/HealthCheck");

// Import User and Product models conditionally to avoid errors if they don't exist yet
let User, Product;

try {
  const userModel = require("../models/User");
  User = userModel.User;
} catch (error) {
  console.log("User model not found - skipping user-related associations");
}

try {
  const productModel = require("../models/Product");
  Product = productModel.Product;
} catch (error) {
  console.log(
    "Product model not found - skipping product-related associations"
  );
}

async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    console.log("Database connection successful");

    // Define model associations
    defineAssociations();

    // Sync all models (create tables)
    await sequelize.sync({
      force: false,
      alter: false,
      logging: false,
    });

    await verifyTables();
    console.log("Database initialization completed successfully");
  } catch (error) {
    console.error("Database initialization failed:", error.message);
    throw error;
  }
}

function defineAssociations() {
  // Only define relationships if both models exist
  if (User && Product) {
    // User has many Products
    User.hasMany(Product, {
      foreignKey: "owner_user_id",
      onDelete: "CASCADE",
    });

    // Product belongs to User
    Product.belongsTo(User, {
      foreignKey: "owner_user_id",
      as: "owner",
    });

    console.log("User-Product associations defined successfully");
  } else {
    console.log(
      "Skipping model associations - User or Product model not available"
    );
  }
}

async function verifyTables() {
  try {
    // Check for health_checks table (always required)
    const [results] = await sequelize.query(
      `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'health_checks'
    `,
      { logging: false }
    );

    if (results.length === 0) {
      throw new Error("Required table 'health_checks' was not created");
    }

    console.log("Required database tables verified successfully");
  } catch (error) {
    console.error("Table verification failed:", error.message);
    throw error;
  }
}

async function closeDatabaseConnection() {
  try {
    await sequelize.close();
    console.log("Database connection closed successfully");
  } catch (error) {
    console.error("Error closing database connection:", error.message);
  }
}

// Health check function for database connectivity
async function testDatabaseConnection() {
  try {
    await sequelize.authenticate();
    return true;
  } catch (error) {
    console.error("Database connection test failed:", error.message);
    return false;
  }
}

module.exports = {
  initializeDatabase,
  verifyTables,
  closeDatabaseConnection,
  testDatabaseConnection,
};
