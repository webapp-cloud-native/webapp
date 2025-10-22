// src/models/Image.js - CORRECTED VERSION
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Image = sequelize.define(
  "Image",
  {
    image_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "products",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    file_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    date_created: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      get() {
        const rawValue = this.getDataValue("date_created");
        return rawValue ? rawValue.toISOString() : null;
      },
    },
    s3_bucket_path: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    content_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    file_size: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "images",
    timestamps: false,
    indexes: [
      { fields: ["product_id"] },
      { fields: ["user_id"] },
      { fields: ["date_created"] },
    ],
  }
);

module.exports = { Image };
