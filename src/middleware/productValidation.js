const { param } = require("express-validator");

/**
 * Validate productId parameter
 */
const validateProductId = [
  param("productId")
    .isInt({ min: 1 })
    .withMessage("Product ID must be a positive integer")
    .toInt(),
  (req, res, next) => {
    const { validationResult } = require("express-validator");
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Invalid product ID format",
      });
    }

    next();
  },
];

/**
 * Validate imageId parameter
 */
const validateImageId = [
  param("imageId")
    .isInt({ min: 1 })
    .withMessage("Image ID must be a positive integer")
    .toInt(),
  (req, res, next) => {
    const { validationResult } = require("express-validator");
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Invalid image ID format",
      });
    }

    next();
  },
];

module.exports = {
  validateProductId,
  validateImageId,
};
