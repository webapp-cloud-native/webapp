const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const bcrypt = require("bcrypt");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: {
          msg: "Please provide a valid email address",
        },
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: {
          args: [8, 255],
          msg: "Password must be at least 8 characters long",
        },
      },
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "First name is required",
        },
        len: {
          args: [1, 100],
          msg: "First name must be between 1-100 characters",
        },
      },
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Last name is required",
        },
        len: {
          args: [1, 100],
          msg: "Last name must be between 1-100 characters",
        },
      },
    },
    account_created: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "account_created",
    },
    account_updated: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "account_updated",
    },
  },
  {
    tableName: "users",
    timestamps: false,
    hooks: {
      beforeCreate: async (user) => {
        // Hash password before creating user
        const saltRounds = 12;
        user.password = await bcrypt.hash(user.password, saltRounds);

        // Set timestamps
        const now = new Date();
        user.account_created = now;
        user.account_updated = now;
      },
      beforeUpdate: async (user) => {
        // Hash password if it's being updated
        if (user.changed("password")) {
          const saltRounds = 12;
          user.password = await bcrypt.hash(user.password, saltRounds);
        }

        user.account_updated = new Date();
      },
    },
    indexes: [
      { unique: true, fields: ["username"] },
      { fields: ["account_created"] },
    ],
  }
);

User.prototype.validatePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Class method to find user by username (email)
User.findByUsername = async function (username) {
  return await this.findOne({ where: { username } });
};

module.exports = { User };
