const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const HealthCheck = sequelize.define('HealthCheck', {
  check_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  check_datetime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'health_checks',
  timestamps: false,
  indexes: [
    { fields: ['check_datetime'] }
  ]
});

module.exports = { HealthCheck };