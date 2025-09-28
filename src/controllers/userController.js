const { User } = require('../models/User');
const { validationResult } = require('express-validator');

// Create a new user
const createUser = async (req, res) => {
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

    const { email, password, first_name, last_name } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const user = await User.create({
      email,
      password,
      first_name,
      last_name
    });

    // Return user data without password
    const userResponse = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      account_created: user.account_created,
      account_updated: user.account_updated
    };

    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Error creating user:', error);
    
    // Handle unique constraint errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'User with this email already exists'
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
      message: 'An error occurred while creating the user'
    });
  }
};

// Get user information (authenticated user only)
const getUser = async (req, res) => {
  try {
    const user = req.user; // Set by authentication middleware

    const userResponse = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      account_created: user.account_created,
      account_updated: user.account_updated
    };

    res.status(200).json(userResponse);
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while retrieving user information'
    });
  }
};

// Update user information
const updateUser = async (req, res) => {
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

    const user = req.user; // Set by authentication middleware
    const allowedFields = ['first_name', 'last_name', 'password'];
    const updateData = {};

    // Only allow updates to specific fields
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

    // Update user
    await user.update(updateData);
    
    // Fetch the updated user from database to ensure we have latest data
    const updatedUser = await User.findByPk(user.id);
    
    if (!updatedUser) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Return updated user data without password
    const userResponse = {
      id: updatedUser.id,
      email: updatedUser.email,
      first_name: updatedUser.first_name,
      last_name: updatedUser.last_name,
      account_created: updatedUser.account_created,
      account_updated: updatedUser.account_updated
    };

    res.status(200).json(userResponse);
  } catch (error) {
    console.error('Error updating user:', error);
    
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
      message: 'An error occurred while updating user information'
    });
  }
};

module.exports = {
  createUser,
  getUser,
  updateUser
};