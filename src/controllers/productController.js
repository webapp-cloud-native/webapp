const { Product } = require('../models/Product');
const { validationResult } = require('express-validator');

// Create a new product
const createProduct = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Validation failed',
        details: errors.array()
      });
    }

    const { name, description, sku, manufacturer, quantity } = req.body;
    const owner_user_id = req.user.id;

    // Check if SKU already exists
    const existingProduct = await Product.findOne({ where: { sku } });
    if (existingProduct) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Product with this SKU already exists'
      });
    }

    // Create new product
    const product = await Product.create({
      name,
      description,
      sku,
      manufacturer,
      quantity,
      owner_user_id
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
      owner_user_id: product.owner_user_id
    };

    res.status(201).json(productResponse);
  } catch (error) {
    console.error('Error creating product:', error);
    
    // Handle unique constraint errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Product with this SKU already exists'
      });
    }
    
    // Handle validation errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Validation failed',
        details: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while creating the product'
    });
  }
};

// Get a product by ID
const getProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate product ID is numeric
    if (!/^\d+$/.test(productId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid product ID format'
      });
    }

    const product = await Product.findByPk(productId);
    
    if (!product) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Product not found'
      });
    }

    const productResponse = {
      id: product.id,
      name: product.name,
      description: product.description,
      sku: product.sku,
      manufacturer: product.manufacturer,
      quantity: product.quantity,
      date_added: product.date_added,
      date_last_updated: product.date_last_updated,
      owner_user_id: product.owner_user_id
    };

    res.status(200).json(productResponse);
  } catch (error) {
    console.error('Error getting product:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while retrieving the product'
    });
  }
};

// Update a product (PUT/PATCH)
const updateProduct = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Validation failed',
        details: errors.array()
      });
    }

    const { productId } = req.params;

    // Validate product ID is numeric
    if (!/^\d+$/.test(productId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid product ID format'
      });
    }

    const product = await Product.findByPk(productId);
    
    if (!product) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Product not found'
      });
    }

    // Check if user owns the product
    if (product.owner_user_id !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only update products that you own'
      });
    }

    const allowedFields = ['name', 'description', 'sku', 'manufacturer', 'quantity'];
    const updateData = {};

    // Filter allowed fields
    for (const field in req.body) {
      if (allowedFields.includes(field)) {
        updateData[field] = req.body[field];
      } else {
        return res.status(400).json({
          error: 'Bad Request',
          message: `Field '${field}' cannot be updated`
        });
      }
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No valid fields provided for update'
      });
    }

    // Check for SKU uniqueness if SKU is being updated
    if (updateData.sku && updateData.sku !== product.sku) {
      const existingProduct = await Product.findOne({ 
        where: { sku: updateData.sku } 
      });
      if (existingProduct) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Product with this SKU already exists'
        });
      }
    }

    // Update product
    await product.update(updateData);
    await product.reload();

    const productResponse = {
      id: product.id,
      name: product.name,
      description: product.description,
      sku: product.sku,
      manufacturer: product.manufacturer,
      quantity: product.quantity,
      date_added: product.date_added,
      date_last_updated: product.date_last_updated,
      owner_user_id: product.owner_user_id
    };

    res.status(200).json(productResponse);
  } catch (error) {
    console.error('Error updating product:', error);
    
    // Handle unique constraint errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Product with this SKU already exists'
      });
    }
    
    // Handle validation errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Validation failed',
        details: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while updating the product'
    });
  }
};

// Delete a product
const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate product ID is numeric
    if (!/^\d+$/.test(productId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid product ID format'
      });
    }

    const product = await Product.findByPk(productId);
    
    if (!product) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Product not found'
      });
    }

    // Check if user owns the product
    if (product.owner_user_id !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only delete products that you own'
      });
    }

    // Delete product
    await product.destroy();

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while deleting the product'
    });
  }
};

module.exports = {
  createProduct,
  getProduct,
  updateProduct,
  deleteProduct
};