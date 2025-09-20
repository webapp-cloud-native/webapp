const { Sequelize } = require("sequelize");

// Function to create database if it doesn't exist
async function ensureDatabaseExists() {
  const systemSequelize = new Sequelize({
    database: "postgres",
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    logging: false,
  });

  try {
    const databaseName = process.env.DB_NAME;

    await systemSequelize.authenticate();

    const [results] = await systemSequelize.query(
      `SELECT 1 FROM pg_database WHERE datname = '${databaseName}'`
    );

    if (results.length === 0) {
      await systemSequelize.query(`CREATE DATABASE "${databaseName}"`);
      console.log(`Database '${databaseName}' created successfully`);
    }

    await systemSequelize.close();
  } catch (error) {
    console.error("Error ensuring database exists:", error.message);
    await systemSequelize.close();
    throw error;
  }
}

// Create main database connection
const sequelize = new Sequelize({
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: "postgres",
  logging: false,
  pool: {
    max: 10,
    min: 0,
    acquire: 5000,
    idle: 1000,
    evict: 1000,
  },
  timezone: "+00:00",
  dialectOptions: {
    timezone: "+00:00",
    connectTimeout: 5000,
  },
  retry: {
    max: 0,
  },
});

module.exports = { sequelize, ensureDatabaseExists };
