# Cloud-Native Web Application

## Prerequisites

### Programming Language
- **Node.js** 18+ (LTS recommended)
- **npm** 8+ (comes with Node.js)

### System Requirements
- **PostgreSQL** 14+
- **Operating System**: macOS, Linux, or Windows
- **Memory**: 4GB RAM minimum
- **Disk Space**: 1GB available space

### Database Requirements
- PostgreSQL server running locally or remotely
- User account with CREATEDB privileges

## Framework and Library Dependencies

### Core Dependencies
```json
{
  "express": "^5.1.0",
  "sequelize": "^6.37.7",
  "pg": "^8.16.3",
  "bcrypt": "^5.1.1",
  "express-validator": "^7.2.0",
  "dotenv": "^17.2.2",
  "swagger-ui-express": "^5.0.0",
  "swagger-jsdoc": "^6.2.8",
  "yamljs": "^0.3.0"
}
```

### Development Dependencies
```json
{
  "nodemon": "^3.1.10"
}
```

## Step-by-Step Build Instructions

### 1. Repository Setup
```bash
# Clone repository using SSH
git clone git@github.com:YOUR_USERNAME/webapp.git
cd webapp
```

### 2. Install Dependencies
```bash
# Install all required packages
npm install
```

### 3. Database Setup
```bash
# Connect to PostgreSQL as superuser
psql -U postgres -h localhost

# Create database user with privileges
CREATE USER your_username WITH PASSWORD 'your_password' CREATEDB;
\q
```

### 4. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit environment file
nano .env
```

**Required Environment Variables:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=webapp_db
DB_USER=your_username
DB_PASSWORD=your_password
PORT=8080
NODE_ENV=development
```

### 5. Build and Start Application
```bash
# Start the server
npm start

# For development with auto-reload
npm run dev
```

The application will automatically:
- Create database if it doesn't exist
- Create all required tables
- Set up database relationships
- Start server on http://127.0.0.1:8080

## Testing Procedures and Commands

### Health Check Test
```bash
# Test basic connectivity
curl http://127.0.0.1:8080/healthz
# Expected: 200 OK
```

### User Registration Test
```bash
curl -X POST http://127.0.0.1:8080/v1/user \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "first_name": "John",
    "last_name": "Doe"
  }'
# Expected: 201 Created
```

### Authentication Test
```bash
# Generate auth header
AUTH=$(echo -n "test@example.com:SecurePass123!" | base64)

# Test authenticated endpoint
curl -H "Authorization: Basic $AUTH" \
  http://127.0.0.1:8080/v1/user/self
# Expected: 200 OK with user data
```

### Product Management Test
```bash
# Create product (requires authentication)
curl -X POST http://127.0.0.1:8080/v1/product \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $AUTH" \
  -d '{
    "name": "Test Product",
    "description": "Test product description",
    "sku": "TEST-001",
    "manufacturer": "Test Corp",
    "quantity": 50
  }'
# Expected: 201 Created

# Get product (public endpoint)
curl http://127.0.0.1:8080/v1/product/1
# Expected: 200 OK
```

### Interactive Testing
```bash
# Access Swagger UI for comprehensive testing
# Open browser: http://127.0.0.1:8080/api-docs
# Use "Try it out" buttons to test all endpoints
```

## Deployment Instructions

### Local Development Deployment
```bash
# 1. Ensure PostgreSQL is running
pg_ctl start -D /usr/local/var/postgres

# 2. Set up environment
cp .env.example .env
# Edit .env with your database credentials

# 3. Start application
npm start
```

### Production Deployment
```bash
# 1. Set production environment
export NODE_ENV=production

# 2. Set production database credentials
export DB_HOST=your_production_host
export DB_USER=your_production_user
export DB_PASSWORD=your_production_password
export DB_NAME=your_production_db

# 3. Start application
npm start
```

### Verification
```bash
# Verify server is running
curl http://127.0.0.1:8080/healthz

# Check logs for any errors
# Server should display:
# "Server running on http://127.0.0.1:8080"
# "Ready to receive requests"
```

## Environment-Specific Configuration

### Development Environment
```env
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=webapp_db
DB_USER=dev_user
DB_PASSWORD=dev_password
PORT=8080
```

### Production Environment
```env
NODE_ENV=production
DB_HOST=production-db-host
DB_PORT=5432
DB_NAME=webapp_production
DB_USER=prod_user
DB_PASSWORD=secure_prod_password
PORT=8080
```

### Database Configuration Options
- **Connection Pooling**: Automatically configured (max 10 connections)
- **Timezone**: UTC (automatically set)
- **SSL**: Enable in production by adding `DB_SSL=true`
- **Connection Timeout**: 5000ms (configurable via `DB_TIMEOUT`)

### Security Configuration
- **Password Hashing**: BCrypt with 12 salt rounds (default)
- **JWT**: Not used (HTTP Basic Auth only)
- **CORS**: Configure if needed for cross-origin requests
- **Rate Limiting**: Add if needed for production

### Logging Configuration
- **Development**: Console logging enabled
- **Production**: Set `LOG_LEVEL=error` for minimal logging
- **Debug Mode**: Set `DEBUG=true` for detailed logs

## Directory Structure

```
webapp/
├── src/
│   ├── config/
│   │   ├── database.js              # Database configuration & connection
│   │   └── swagger.js               # API documentation configuration
│   ├── controllers/
│   │   ├── healthController.js      # Health check business logic
│   │   ├── userController.js        # User management operations
│   │   └── productController.js     # Product management operations
│   ├── middleware/
│   │   ├── auth.js                  # Authentication middleware
│   │   ├── errorHandler.js          # Global error handling
│   │   ├── jsonErrorHandler.js      # JSON parsing error handling
│   │   └── validatePayload.js       # Request payload validation
│   ├── models/
│   │   ├── HealthCheck.js           # Health check data model
│   │   ├── User.js                  # User data model with BCrypt
│   │   └── Product.js               # Product data model
│   ├── routes/
│   │   ├── healthRoutes.js          # Health check API endpoints
│   │   ├── userRoutes.js            # User management API endpoints
│   │   ├── productRoutes.js         # Product management API endpoints
│   │   └── docsRoutes.js            # API documentation routes
│   └── services/
│       ├── authService.js           # Authentication service functions
│       └── databaseService.js       # Database operations and initialization
├── server.js                        # Main application entry point
├── package.json                     # Project dependencies and scripts
├── package-lock.json                # Dependency lock file
├── .env.example                     # Environment variables template
├── .env                            # Environment variables (not in git)
├── .gitignore                      # Git ignore patterns
└── README.md                       # Project documentation
```

### Key Files Description

#### Core Application Files
- **server.js**: Main application entry point, server configuration, middleware setup
- **package.json**: Dependencies, scripts, and project metadata

#### Configuration Files
- **src/config/database.js**: Database connection, pooling, and bootstrapping
- **src/config/swagger.js**: API documentation schema and configuration
- **.env**: Environment-specific configuration (database credentials, ports)

#### Models (Data Layer)
- **src/models/User.js**: User schema, BCrypt password hashing, validation
- **src/models/Product.js**: Product schema, quantity constraints, relationships
- **src/models/HealthCheck.js**: Health monitoring data model

#### Controllers (Business Logic)
- **src/controllers/userController.js**: User registration, authentication, updates
- **src/controllers/productController.js**: Product CRUD operations with ownership
- **src/controllers/healthController.js**: Database health check operations

#### Routes (API Endpoints)
- **src/routes/userRoutes.js**: User API endpoints with validation
- **src/routes/productRoutes.js**: Product API endpoints with authentication
- **src/routes/healthRoutes.js**: Health check endpoint configuration
- **src/routes/docsRoutes.js**: Swagger UI documentation routes

#### Middleware (Request Processing)
- **src/middleware/auth.js**: HTTP Basic Authentication verification
- **src/middleware/errorHandler.js**: Global error handling and formatting
- **src/middleware/jsonErrorHandler.js**: JSON parsing error handling
- **src/middleware/validatePayload.js**: Request payload validation

#### Services (Business Operations)
- **src/services/authService.js**: Authentication parsing and user verification
- **src/services/databaseService.js**: Database initialization and management