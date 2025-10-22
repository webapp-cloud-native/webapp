const multer = require("multer");
const mime = require("mime-types");

// Allowed image MIME types
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png"];

// Allowed file extensions
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png"];

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

/**
 * File filter to validate file type
 */
const fileFilter = (req, file, cb) => {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(
      new Error(
        `Invalid file type. Only ${ALLOWED_EXTENSIONS.join(
          ", "
        )} files are allowed.`
      ),
      false
    );
  }

  // Additional check: validate file extension
  const ext = mime.extension(file.mimetype);
  if (!ext || !ALLOWED_EXTENSIONS.includes(`.${ext}`)) {
    return cb(
      new Error(
        `Invalid file extension. Only ${ALLOWED_EXTENSIONS.join(
          ", "
        )} files are allowed.`
      ),
      false
    );
  }

  // File is valid
  cb(null, true);
};

/**
 * Multer configuration - store in memory (buffer)
 * We'll upload directly to S3 from memory
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1, // Only one file at a time
  },
  fileFilter: fileFilter,
});

/**
 * Middleware to handle single file upload
 * Field name: "file"
 */
const uploadSingleImage = upload.single("file");

/**
 * Error handler for multer errors
 */
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "Bad Request",
        message: `File size exceeds the maximum limit of ${
          MAX_FILE_SIZE / (1024 * 1024)
        }MB`,
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        error: "Bad Request",
        message: "Only one file can be uploaded at a time",
      });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        error: "Bad Request",
        message: "Unexpected field name. Use 'file' as the field name.",
      });
    }
    return res.status(400).json({
      error: "Bad Request",
      message: err.message,
    });
  }

  if (err) {
    // Custom file filter errors
    return res.status(400).json({
      error: "Bad Request",
      message: err.message,
    });
  }

  next();
};

/**
 * Middleware to validate file presence
 */
const validateFilePresence = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      error: "Bad Request",
      message: "No file uploaded. Please provide an image file.",
    });
  }
  next();
};

module.exports = {
  uploadSingleImage,
  handleMulterError,
  validateFilePresence,
};
