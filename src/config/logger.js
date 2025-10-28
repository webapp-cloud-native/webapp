const winston = require("winston");
const path = require("path");
const fs = require("fs");

// Create logs directory if it doesn't exist
const logDir = process.env.LOG_DIR || "/var/log/webapp";

// Only create directory in production, use local logs in development
if (process.env.NODE_ENV === "production") {
  if (!fs.existsSync(logDir)) {
    try {
      fs.mkdirSync(logDir, { recursive: true, mode: 0o755 });
    } catch (error) {
      console.error("Failed to create log directory:", error);
    }
  }
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Custom format for console output (more readable)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : "";
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// Create Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: logFormat,
  defaultMeta: {
    service: "webapp",
    environment: process.env.NODE_ENV || "development",
  },
  transports: [],
});

// Add transports based on environment
if (process.env.NODE_ENV === "production") {
  // Production: Log to files for CloudWatch Agent to pick up
  logger.add(
    new winston.transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true,
    })
  );

  logger.add(
    new winston.transports.File({
      filename: path.join(logDir, "app.log"),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true,
    })
  );

  // Also log to console in production for systemd journal
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
} else {
  // Development: Log to console only
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// Create a stream object for Morgan HTTP logging (if needed)
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

module.exports = logger;
