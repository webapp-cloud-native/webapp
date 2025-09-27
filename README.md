# Cloud-Native Web Application

A comprehensive cloud-native RESTful API backend built with Node.js, Express.js, PostgreSQL, and comprehensive automated testing with CI/CD integration.

## Prerequisites

### Programming Language & Runtime
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
- Network connectivity to database server

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

### Development & Testing Dependencies
```json
{
  "nodemon": "^3.1.10",
  "jest": "^29.7.0",
  "supertest": "^6.3.4",
  "cross-env": "^7.0.3"
}
```

## Step-by-Step Build Instructions

### 1. Repository Setup
```bash
# Clone repository using SSH (required for assignment)
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
# Create environment file
cp .env.example .env

# Edit environment file with your settings
nano .env
```

**Required Environment Variables:**
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=webapp_db
DB_USER=your_username
DB_PASSWORD=your_password

# Server Configuration
PORT=8080
NODE_ENV=development
```

**Test Environment Variables (.env.test):**
```env
# Test Database Configuration
NODE_ENV=test
DB_HOST=localhost
DB_PORT=5432
DB_NAME=webapp_test
DB_USER=your_username
DB_PASSWORD=your_password
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
- Create all required tables (users, products, health_checks)
- Set up database relationships and constraints
- Start server on http://127.0.0.1:8080

## Testing Procedures and Commands

### Automated Test Suite

#### Run All Tests
```bash
# Run complete test suite
npm test

# Run tests in watch mode (development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

#### Test Categories Implemented

**Integration Tests:**
- Health check endpoint validation
- User registration and authentication
- Product CRUD operations with ownership
- Database connectivity and operations
- HTTP status code validation
- Request/response payload validation

**Test Structure:**
```
tests/
├── config/
│   ├── test-database.js      # Test database setup
│   └── test-setup.js         # Global test configuration
├── helpers/
│   └── app-helper.js         # Test application utilities
├── integration/
│   └── health.test.js        # Health check endpoint tests
└── simple-ci-test.test.js    # CI pipeline verification tests
```

### Manual API Testing

#### Health Check Test
```bash
# Test basic connectivity
curl http://127.0.0.1:8080/healthz
# Expected: 200 OK with empty body
```

#### User Registration Test
```bash
curl -X POST http://127.0.0.1:8080/v1/user \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "first_name": "John",
    "last_name": "Doe"
  }'
# Expected: 201 Created with user data (no password)
```

#### Authentication Test
```bash
# Generate auth header
AUTH=$(echo -n "test@example.com:SecurePass123!" | base64)

# Test authenticated endpoint
curl -H "Authorization: Basic $AUTH" \
  http://127.0.0.1:8080/v1/user/self
# Expected: 200 OK with user data
```

#### Product Management Test
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
# Expected: 200 OK with product data
```

### Interactive API Documentation
```bash
# Access Swagger UI for comprehensive testing
# Open browser: http://127.0.0.1:8080/api-docs
# Use "Try it out" buttons to test all endpoints interactively
```

## Continuous Integration (CI) Pipeline

### GitHub Actions Workflow

The application includes a comprehensive CI pipeline (`.github/workflows/ci.yml`) that:

**Triggers:**
- On pull requests to main branch
- On pushes to main branch

**Test Matrix:**
- Node.js versions: 18.x, 20.x
- Operating System: Ubuntu Latest
- Database: PostgreSQL 14 with test data

**Pipeline Steps:**
1. **Checkout Code** - Retrieves latest code
2. **Setup Node.js** - Installs specified Node.js version with npm caching
3. **Install Dependencies** - Runs `npm ci` for reproducible builds
4. **Setup PostgreSQL** - Configures test database service
5. **Run Tests** - Executes complete test suite with timeout protection
6. **Artifact Collection** - Stores test results and coverage reports

**Quality Gates:**
- All tests must pass (health checks, integration tests)
- No security vulnerabilities in dependencies
- Code builds successfully across Node.js versions
- Database connectivity and operations validated

### Branch Protection Rules

The repository enforces:
- Pull requests required for main branch
- Status checks must pass before merge
- Administrators included in restrictions
- Force pushes disabled
- Branch deletions disabled

## Deployment Instructions

### Local Development Deployment
```bash
# 1. Ensure PostgreSQL is running
# macOS with Homebrew:
brew services start postgresql@14

# Linux (systemd):
sudo systemctl start postgresql

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

# 3. Install production dependencies only
npm ci --only=production

# 4. Start application
npm start
```

### Docker Deployment (Optional)
```dockerfile
# Dockerfile example for containerized deployment
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8080
CMD ["npm", "start"]
```

### Verification
```bash
# Verify server is running
curl http://127.0.0.1:8080/healthz

# Check application logs
npm start
# Server should display:
# "Server running on http://127.0.0.1:8080"
# "Database connection successful"
# "Ready to receive requests"
```

## Environment-Specific Configuration

### Development Environment
```env
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=webapp_dev
DB_USER=dev_user
DB_PASSWORD=dev_password
PORT=8080
LOG_LEVEL=debug
```

### Test Environment
```env
NODE_ENV=test
DB_HOST=localhost
DB_PORT=5432
DB_NAME=webapp_test
DB_USER=test_user
DB_PASSWORD=test_password
PORT=0  # Random available port
```

### Production Environment
```env
NODE_ENV=production
DB_HOST=production-db-host.com
DB_PORT=5432
DB_NAME=webapp_production
DB_USER=prod_user
DB_PASSWORD=secure_prod_password
PORT=8080
LOG_LEVEL=warn
DB_SSL=true
```

### Database Configuration Options
- **Connection Pooling**: Max 10 connections, configurable via `DB_POOL_MAX`
- **Timezone**: UTC (automatically configured)
- **SSL**: Enable in production with `DB_SSL=true`
- **Connection Timeout**: 5000ms (configurable via `DB_TIMEOUT`)
- **Retry Logic**: Automatic reconnection with exponential backoff

### Security Configuration
- **Password Hashing**: BCrypt with 12 salt rounds
- **Authentication**: HTTP Basic Auth (RFC 7617 compliant)
- **Input Validation**: Express-validator with comprehensive rules
- **SQL Injection Protection**: Sequelize ORM with parameterized queries
- **CORS**: Configurable for cross-origin requests

## Directory Structure

```
webapp/
├── .github/
│   └── workflows/
│       └── ci.yml                   # GitHub Actions CI pipeline
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
├── tests/
│   ├── config/
│   │   ├── test-database.js         # Test database configuration
│   │   └── test-setup.js            # Global test setup and teardown
│   ├── helpers/
│   │   └── app-helper.js            # Test application utilities
│   ├── integration/
│   │   └── health.test.js           # Integration tests for health endpoint
│   └── simple-ci-test.test.js       # Basic CI pipeline verification
├── server.js                        # Main application entry point
├── package.json                     # Project dependencies and scripts
├── jest.config.js                   # Jest testing configuration
├── .env.test                        # Test environment variables
├── .gitignore                       # Git ignore patterns
└── README.md                        # Project documentation (this file)
```

## API Endpoints

### Health Check
- `GET /healthz` - Application health check with database connectivity test

### User Management
- `POST /v1/user` - Create new user account
- `GET /v1/user/self` - Get authenticated user information (requires auth)
- `PUT /v1/user/self` - Update authenticated user information (requires auth)

### Product Management
- `POST /v1/product` - Create new product (requires auth)
- `GET /v1/product/{productId}` - Get product by ID
- `PUT /v1/product/{productId}` - Update product (requires auth + ownership)
- `PATCH /v1/product/{productId}` - Partial update product (requires auth + ownership)
- `DELETE /v1/product/{productId}` - Delete product (requires auth + ownership)

### API Documentation
- `GET /api-docs` - Interactive Swagger UI documentation
- `GET /api-docs.json` - Raw OpenAPI specification

## Technology Stack

### Backend Framework
- **Node.js 18+** with **Express.js 5.1.0**
- **Sequelize ORM 6.37.7** for database operations
- **PostgreSQL 14+** as the primary database

### Security & Authentication
- **BCrypt 5.1.1** for password hashing with salt
- **HTTP Basic Authentication** (RFC 7617)
- **Express-validator 7.2.0** for input validation

### Testing Framework
- **Jest 29.7.0** as test runner
- **Supertest 6.3.4** for API testing
- **Custom test helpers** for database and application management

### Documentation & Development
- **Swagger/OpenAPI 3.0** for API documentation
- **Nodemon** for development auto-reload
- **ESLint** for code quality (configurable)

## Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check PostgreSQL status
psql -U postgres -c "SELECT version();"

# Verify user permissions
psql -U postgres -c "SELECT rolname FROM pg_roles WHERE rolname='your_username';"
```

#### Port Already in Use
```bash
# Find and kill process using port 8080
lsof -ti:8080 | xargs kill -9

# Or use a different port
export PORT=3000
npm start
```

#### Test Failures
```bash
# Run tests with verbose output
npm test -- --verbose

# Check test database connectivity
psql -U your_username -d webapp_test -c "SELECT 1;"
```

### Getting Help

1. Check the application logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure PostgreSQL is running and accessible
4. Confirm Node.js version compatibility (18+ required)

For additional support, refer to the assignment documentation or contact the teaching team.

---

## Assignment Compliance

This implementation fulfills all requirements for:
- **Assignment 1**: Health check endpoint with database integration
- **Assignment 2**: User and product management with authentication
- **Assignment 3**: Comprehensive integration testing with CI/CD pipeline

The application demonstrates cloud-native principles including stateless design, external configuration management, comprehensive health monitoring, and automated quality gates.