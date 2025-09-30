const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Cloud-Native Web App API",
      version: "fall2025-a2",
      description: `Assignment 2 - RESTful API for User and Product Management

This API provides comprehensive user management and product management capabilities with proper authentication and validation.

**Authentication**: HTTP Basic Authentication using username (email) and password.

**Key Features**:
- User registration and profile management
- Product CRUD operations with ownership-based access control
- Database health monitoring
- Comprehensive input validation
- BCrypt password hashing with salt

**Important Notes**:
- All timestamps are in UTC
- Passwords are never returned in API responses
- Users can only modify their own data and products they own
- SKU must be unique across all products
- Quantity must be between 0-100 and a multiple of 1
- User ID is an integer, not UUID`,
      contact: {
        name: "API Support",
        email: "support@example.com",
      },
    },
    servers: [
      {
        url: "http://127.0.0.1:8080",
        description: "Development server",
      },
      {
        url: "http://localhost:8080",
        description: "Local development server",
      },
    ],
    components: {
      securitySchemes: {
        basicAuth: {
          type: "http",
          scheme: "basic",
          description:
            "HTTP Basic Authentication. Use username (email) and password. Example: Authorization: Basic base64(email:password)",
        },
      },
      schemas: {
        User: {
          type: "object",
          required: ["username", "password", "first_name", "last_name"],
          properties: {
            id: {
              type: "integer",
              format: "int64",
              readOnly: true,
              description: "Unique identifier for the user",
              example: 1,
            },
            username: {
              type: "string",
              format: "email",
              description:
                "User email address (used as username for authentication)",
              example: "jane.doe@example.com",
            },
            password: {
              type: "string",
              writeOnly: true,
              minLength: 8,
              pattern:
                "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]+",
              description:
                "Password with at least 8 characters, including uppercase, lowercase, number, and special character",
              example: "SecurePass123!",
            },
            first_name: {
              type: "string",
              minLength: 1,
              maxLength: 100,
              description: "User first name",
              example: "Jane",
            },
            last_name: {
              type: "string",
              minLength: 1,
              maxLength: 100,
              description: "User last name",
              example: "Doe",
            },
            account_created: {
              type: "string",
              format: "date-time",
              readOnly: true,
              description: "Account creation timestamp (UTC)",
              example: "2023-09-20T10:30:00.000Z",
            },
            account_updated: {
              type: "string",
              format: "date-time",
              readOnly: true,
              description: "Account last updated timestamp (UTC)",
              example: "2023-09-21T15:45:30.000Z",
            },
          },
        },
        UserCreate: {
          type: "object",
          required: ["username", "password", "first_name", "last_name"],
          properties: {
            username: {
              type: "string",
              format: "email",
              description: "User email address (used as username)",
              example: "jane.doe@example.com",
            },
            password: {
              type: "string",
              writeOnly: true,
              minLength: 8,
              pattern:
                "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]+",
              description: "Password with complexity requirements",
              example: "SecurePass123!",
            },
            first_name: {
              type: "string",
              minLength: 1,
              maxLength: 100,
              description: "User first name",
              example: "Jane",
            },
            last_name: {
              type: "string",
              minLength: 1,
              maxLength: 100,
              description: "User last name",
              example: "Doe",
            },
          },
        },
        UserUpdate: {
          type: "object",
          properties: {
            first_name: {
              type: "string",
              minLength: 1,
              maxLength: 100,
              description: "User first name",
              example: "Jane",
            },
            last_name: {
              type: "string",
              minLength: 1,
              maxLength: 100,
              description: "User last name",
              example: "Smith",
            },
            password: {
              type: "string",
              writeOnly: true,
              minLength: 8,
              pattern:
                "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]+",
              description: "New password with complexity requirements",
              example: "NewSecurePass456!",
            },
          },
        },
        Product: {
          type: "object",
          required: ["name", "description", "sku", "manufacturer", "quantity"],
          properties: {
            id: {
              type: "integer",
              format: "int64",
              readOnly: true,
              description: "Unique identifier for the product",
              example: 1,
            },
            name: {
              type: "string",
              minLength: 1,
              maxLength: 255,
              description: "Product name",
              example: "Professional Widget",
            },
            description: {
              type: "string",
              minLength: 1,
              maxLength: 2000,
              description: "Detailed product description",
              example:
                "A high-quality professional widget designed for enterprise use",
            },
            sku: {
              type: "string",
              minLength: 1,
              maxLength: 100,
              description:
                "Stock Keeping Unit - must be unique across all products",
              example: "PRO-WIDGET-001",
            },
            manufacturer: {
              type: "string",
              minLength: 1,
              maxLength: 255,
              description: "Product manufacturer",
              example: "WidgetCorp Industries",
            },
            quantity: {
              type: "integer",
              minimum: 0,
              maximum: 100,
              multipleOf: 1,
              description:
                "Product quantity in stock (0-100, must be whole number)",
              example: 50,
            },
            date_added: {
              type: "string",
              format: "date-time",
              readOnly: true,
              description: "Product creation timestamp (UTC)",
              example: "2023-09-20T14:22:00.000Z",
            },
            date_last_updated: {
              type: "string",
              format: "date-time",
              readOnly: true,
              description: "Product last updated timestamp (UTC)",
              example: "2023-09-21T09:15:45.000Z",
            },
            owner_user_id: {
              type: "integer",
              format: "int64",
              readOnly: true,
              description: "ID of the user who created this product",
              example: 10,
            },
          },
        },
        ProductCreate: {
          type: "object",
          required: ["name", "description", "sku", "manufacturer", "quantity"],
          properties: {
            name: {
              type: "string",
              minLength: 1,
              maxLength: 255,
              description: "Product name",
              example: "Professional Widget",
            },
            description: {
              type: "string",
              minLength: 1,
              maxLength: 2000,
              description: "Detailed product description",
              example:
                "A high-quality professional widget designed for enterprise use",
            },
            sku: {
              type: "string",
              minLength: 1,
              maxLength: 100,
              description: "Stock Keeping Unit - must be unique",
              example: "PRO-WIDGET-001",
            },
            manufacturer: {
              type: "string",
              minLength: 1,
              maxLength: 255,
              description: "Product manufacturer",
              example: "WidgetCorp Industries",
            },
            quantity: {
              type: "integer",
              minimum: 0,
              maximum: 100,
              multipleOf: 1,
              description: "Product quantity in stock",
              example: 50,
            },
          },
        },
        ProductUpdate: {
          type: "object",
          properties: {
            name: {
              type: "string",
              minLength: 1,
              maxLength: 255,
              description: "Product name",
              example: "Updated Professional Widget",
            },
            description: {
              type: "string",
              minLength: 1,
              maxLength: 2000,
              description: "Product description",
              example: "An updated high-quality professional widget",
            },
            sku: {
              type: "string",
              minLength: 1,
              maxLength: 100,
              description: "Stock Keeping Unit",
              example: "PRO-WIDGET-002",
            },
            manufacturer: {
              type: "string",
              minLength: 1,
              maxLength: 255,
              description: "Product manufacturer",
              example: "WidgetCorp Industries Ltd",
            },
            quantity: {
              type: "integer",
              minimum: 0,
              maximum: 100,
              multipleOf: 1,
              description: "Product quantity in stock",
              example: 75,
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: {
              type: "string",
              description: "Error type/category",
              example: "Bad Request",
            },
            message: {
              type: "string",
              description: "Human-readable error message",
              example: "Validation failed",
            },
            details: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: {
                    type: "string",
                    description: "Field that caused the error",
                    example: "username",
                  },
                  message: {
                    type: "string",
                    description: "Field-specific error message",
                    example: "Please provide a valid email address",
                  },
                },
              },
              description: "Detailed validation errors (when applicable)",
            },
          },
        },
      },
    },
    tags: [
      {
        name: "Health Check",
        description:
          "Application health monitoring and database connectivity testing",
      },
      {
        name: "User Management",
        description:
          "User registration, authentication, and profile management operations",
      },
      {
        name: "Product Management",
        description:
          "Product CRUD operations with ownership-based access control",
      },
    ],
  },
  apis: ["./src/routes/*.js", "./src/controllers/*.js"],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
