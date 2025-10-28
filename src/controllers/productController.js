const { Product } = require("../models/Product");
const { validationResult } = require("express-validator");
const { trackQuery } = require("../utils/dbMetrics");
const logger = require("../config/logger");

// Helper function to check for empty or whitespace-only strings
const isEmptyString = (value) => {
  return typeof value === "string" && value.trim().length === 0;
};

// Create a new product
const createProduct = async (req, res) => {
  try {
    // Check for validation errors from express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Validation failed",
        details: errors.array(),
      });
    }

    const { name, description, sku, manufacturer, quantity } = req.body;

    // Manual validation for empty strings (after express-validator)
    const emptyFieldErrors = [];

    if (isEmptyString(name)) {
      emptyFieldErrors.push({
        field: "name",
        message: "Product name cannot be empty",
      });
    }

    if (isEmptyString(description)) {
      emptyFieldErrors.push({
        field: "description",
        message: "Product description cannot be empty",
      });
    }

    if (isEmptyString(sku)) {
      emptyFieldErrors.push({
        field: "sku",
        message: "SKU cannot be empty",
      });
    }

    if (isEmptyString(manufacturer)) {
      emptyFieldErrors.push({
        field: "manufacturer",
        message: "Manufacturer cannot be empty",
      });
    }

    if (emptyFieldErrors.length > 0) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Validation failed",
        details: emptyFieldErrors,
      });
    }

    // Check for duplicate SKU
    const existingProduct = await Product.findBySku(sku);
    if (existingProduct) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Product with this SKU already exists",
      });
    }

    // Create product with metrics tracking
    const product = await trackQuery(
      () =>
        Product.create({
          name,
          description,
          sku,
          manufacturer,
          quantity,
          owner_user_id: req.user.id,
        }),
      "insert",
      "products"
    );

    logger.info("Product created successfully", {
      productId: product.id,
      sku: product.sku,
      ownerId: req.user.id,
    });

    const productResponse = {
      id: product.id,
      name: product.name,
      description: product.description,
      sku: product.sku,
      manufacturer: product.manufacturer,
      quantity: product.quantity,
      date_added: product.date_added,
      date_last_updated: product.date_last_updated,
      owner_user_id: product.owner_user_id,
    };

    res.status(201).json(productResponse);
  } catch (error) {
    logger.error("Error creating product", {
      error: error.message,
      stack: error.stack,
    });

    // Handle unique constraint errors
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        error: "Bad Request",
        message: "Product with this SKU already exists",
      });
    }

    // Handle validation errors
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        error: "Bad Request",
        message: "Validation failed",
        details: error.errors.map((err) => ({
          field: err.path,
          message: err.message,
        })),
      });
    }

    res.status(500).json({
      error: "Internal Server Error",
      message: "An error occurred while creating the product",
    });
  }
};

// Get a single product
const getProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    // Validation errors are handled by express-validator middleware
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Invalid product ID format",
      });
    }

    const product = await Product.findByPk(productId);

    if (!product) {
      logger.warn("Product not found", { productId });
      return res.status(404).json({
        error: "Not Found",
        message: "Product not found",
      });
    }

    logger.info("Product retrieved successfully", { productId: product.id });

    const productResponse = {
      id: product.id,
      name: product.name,
      description: product.description,
      sku: product.sku,
      manufacturer: product.manufacturer,
      quantity: product.quantity,
      date_added: product.date_added,
      date_last_updated: product.date_last_updated,
      owner_user_id: product.owner_user_id,
    };

    res.status(200).json(productResponse);
  } catch (error) {
    logger.error("Error getting product", {
      error: error.message,
      stack: error.stack,
      productId: req.params.productId,
    });
    res.status(500).json({
      error: "Internal Server Error",
      message: "An error occurred while retrieving the product",
    });
  }
};

// Update a product (PUT/PATCH)
const updateProduct = async (req, res) => {
  try {
    // Check for validation errors from express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Validation failed",
        details: errors.array(),
      });
    }

    const { productId } = req.params;

    const product = await Product.findByPk(productId);

    if (!product) {
      return res.status(404).json({
        error: "Not Found",
        message: "Product not found",
      });
    }

    // Check if user owns the product
    if (product.owner_user_id !== req.user.id) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You can only update products that you own",
      });
    }

    const allowedFields = [
      "name",
      "description",
      "sku",
      "manufacturer",
      "quantity",
    ];
    const updateData = {};

    // Filter allowed fields
    for (const field in req.body) {
      if (allowedFields.includes(field)) {
        updateData[field] = req.body[field];
      } else {
        return res.status(400).json({
          error: "Bad Request",
          message: `Field '${field}' cannot be updated`,
        });
      }
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: "Bad Request",
        message: "No valid fields provided for update",
      });
    }

    // Manual validation for empty strings in updates
    const emptyFieldErrors = [];

    if (updateData.hasOwnProperty("name") && isEmptyString(updateData.name)) {
      emptyFieldErrors.push({
        field: "name",
        message: "Product name cannot be empty",
      });
    }

    if (
      updateData.hasOwnProperty("description") &&
      isEmptyString(updateData.description)
    ) {
      emptyFieldErrors.push({
        field: "description",
        message: "Product description cannot be empty",
      });
    }

    if (updateData.hasOwnProperty("sku") && isEmptyString(updateData.sku)) {
      emptyFieldErrors.push({
        field: "sku",
        message: "SKU cannot be empty",
      });
    }

    if (
      updateData.hasOwnProperty("manufacturer") &&
      isEmptyString(updateData.manufacturer)
    ) {
      emptyFieldErrors.push({
        field: "manufacturer",
        message: "Manufacturer cannot be empty",
      });
    }

    if (emptyFieldErrors.length > 0) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Validation failed",
        details: emptyFieldErrors,
      });
    }

    // Check for SKU uniqueness if SKU is being updated
    if (updateData.sku && updateData.sku !== product.sku) {
      const existingProduct = await Product.findBySku(updateData.sku);
      if (existingProduct) {
        return res.status(400).json({
          error: "Bad Request",
          message: "Product with this SKU already exists",
        });
      }
    }

    // Update product with metrics tracking
    await trackQuery(() => product.update(updateData), "update", "products");
    await product.reload();

    logger.info("Product updated successfully", {
      productId: product.id,
      updatedFields: Object.keys(updateData),
    });

    const productResponse = {
      id: product.id,
      name: product.name,
      description: product.description,
      sku: product.sku,
      manufacturer: product.manufacturer,
      quantity: product.quantity,
      date_added: product.date_added,
      date_last_updated: product.date_last_updated,
      owner_user_id: product.owner_user_id,
    };

    // Return 200 OK with product data as per Postman tests
    res.status(200).json(productResponse);
  } catch (error) {
    logger.error("Error updating product", {
      error: error.message,
      stack: error.stack,
      productId: req.params.productId,
    });

    // Handle unique constraint errors
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        error: "Bad Request",
        message: "Product with this SKU already exists",
      });
    }

    // Handle validation errors
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        error: "Bad Request",
        message: "Validation failed",
        details: error.errors.map((err) => ({
          field: err.path,
          message: err.message,
        })),
      });
    }

    res.status(500).json({
      error: "Internal Server Error",
      message: "An error occurred while updating the product",
    });
  }
};

// Delete a product
const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    // Validation errors are handled by express-validator middleware
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Invalid product ID format",
      });
    }

    const product = await Product.findByPk(productId);

    if (!product) {
      return res.status(404).json({
        error: "Not Found",
        message: "Product not found",
      });
    }

    // Check if user owns the product
    if (product.owner_user_id !== req.user.id) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You can only delete products that you own",
      });
    }

    // Delete product with metrics tracking
    await trackQuery(() => product.destroy(), "delete", "products");

    logger.info("Product deleted successfully", {
      productId: productId,
      ownerId: req.user.id,
    });

    res.status(204).send();
  } catch (error) {
    logger.error("Error deleting product", {
      error: error.message,
      stack: error.stack,
      productId: req.params.productId,
    });
    res.status(500).json({
      error: "Internal Server Error",
      message: "An error occurred while deleting the product",
    });
  }
};

module.exports = {
  createProduct,
  getProduct,
  updateProduct,
  deleteProduct,
};
