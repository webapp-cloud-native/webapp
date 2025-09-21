const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Product name is required'
      },
      len: {
        args: [1, 255],
        msg: 'Product name must be between 1-255 characters'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Product description is required'
      },
      len: {
        args: [1, 2000],
        msg: 'Product description must be between 1-2000 characters'
      }
    }
  },
  sku: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: {
        msg: 'SKU is required'
      },
      len: {
        args: [1, 100],
        msg: 'SKU must be between 1-100 characters'
      }
    }
  },
  manufacturer: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Manufacturer is required'
      },
      len: {
        args: [1, 255],
        msg: 'Manufacturer must be between 1-255 characters'
      }
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: 'Quantity cannot be less than 0'
      },
      max: {
        args: [100],
        msg: 'Quantity cannot be more than 100'
      },
      isInt: {
        msg: 'Quantity must be an integer'
      },
      multipleOf(value) {
        if (value % 1 !== 0) {
          throw new Error('Quantity must be a multiple of 1');
        }
      }
    }
  },
  date_added: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'date_added'
  },
  date_last_updated: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'date_last_updated'
  },
  owner_user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    field: 'owner_user_id'
  }
}, {
  tableName: 'products',
  timestamps: false, // We're managing timestamps manually
  hooks: {
    beforeCreate: (product) => {
      const now = new Date();
      product.date_added = now;
      product.date_last_updated = now;
    },
    beforeUpdate: (product) => {
      product.date_last_updated = new Date();
    }
  },
  indexes: [
    { unique: true, fields: ['sku'] },
    { fields: ['owner_user_id'] },
    { fields: ['date_added'] },
    { fields: ['manufacturer'] }
  ]
});

module.exports = { Product };