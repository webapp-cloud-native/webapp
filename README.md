# Cloud-Native Web Application

A cloud-native RESTful API backend built with Node.js, Express.js, PostgreSQL, with comprehensive integration testing and CI/CD pipeline.


## Prerequisites

### Programming Language & Runtime
- **Node.js** 18+
- **npm** 8+

### System Requirements
- **PostgreSQL** 14+
- User account with CREATEDB privileges

## Framework and Library Dependencies

### Core Dependencies
- **express**: ^5.1.0
- **sequelize**: ^6.37.7  
- **pg**: ^8.16.3
- **bcrypt**: ^5.1.1
- **express-validator**: ^7.2.1
- **dotenv**: ^17.2.2
- **swagger-ui-express**: ^5.0.1
- **swagger-jsdoc**: ^6.2.8

### Testing Dependencies
- **jest**: ^29.7.0
- **supertest**: ^6.3.4
- **cross-env**: ^7.0.3

## Step-by-Step Build Instructions

### 1. Repository Setup
```bash
git clone git@github.com:YOUR_USERNAME/webapp.git
cd webapp
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup
```bash
# Connect as PostgreSQL superuser
psql -U postgres -h localhost

# Create user with CREATEDB privileges
CREATE USER your_username WITH PASSWORD 'your_password' CREATEDB;
CREATE DATABASE your_username;
CREATE DATABASE webapp_test;
GRANT ALL PRIVILEGES ON DATABASE webapp_test TO your_username;
\q
```

### 4. Environment Configuration

**Development (.env):**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=webapp_db
DB_USER=your_username
DB_PASSWORD=your_password
PORT=8080
NODE_ENV=development
```

**Testing (.env.test):**
```env
NODE_ENV=test
DB_HOST=localhost
DB_PORT=5432
DB_NAME=webapp_test
DB_USER=your_username
DB_PASSWORD=your_password
```

### 5. Build and Start Application
```bash
npm start
```

The application automatically creates databases and tables on startup.

## Testing Procedures and Commands

### Run Tests
```bash
# Complete test suite (84 integration tests)
npm test

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:coverage
```

### Manual API Testing
```bash
# Health check
curl http://127.0.0.1:8080/healthz

# User registration
curl -X POST http://127.0.0.1:8080/v1/user \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!","first_name":"John","last_name":"Doe"}'

# Authentication test
AUTH=$(echo -n "test@example.com:SecurePass123!" | base64)
curl -H "Authorization: Basic $AUTH" http://127.0.0.1:8080/v1/user/self
```

## Deployment Instructions

### Local Development
```bash
# Ensure PostgreSQL is running
brew services start postgresql@14  # macOS
sudo systemctl start postgresql    # Linux

# Start application
npm start
```

### Environment Variables Required
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `PORT` (defaults to 8080)
- `NODE_ENV` (development/test/production)

## Directory Structure

```
webapp/
├── .github/workflows/ci.yml         # CI/CD pipeline
├── src/
│   ├── config/                     # Database & Swagger configuration
│   ├── controllers/                # Business logic (health, user, product)
│   ├── middleware/                 # Auth, validation, error handling
│   ├── models/                     # Data models (User, Product, HealthCheck)
│   ├── routes/                     # API route definitions
│   └── services/                   # Auth & database services
├── tests/
│   ├── config/                     # Test database configuration
│   ├── helpers/                    # Test utilities
│   └── integration/                # Integration tests (health, user, product)
├── server.js                       # Application entry point
├── package.json                    # Dependencies and scripts
├── jest.config.js                  # Test configuration
├── .env.test                       # Test environment variables
└── README.md                       # This file
```

## API Endpoints

### Health Check
- `GET /healthz` - Database connectivity test

### User Management  
- `POST /v1/user` - User registration
- `GET /v1/user/self` - Get user profile (auth required)
- `PUT /v1/user/self` - Update user profile (auth required)

### Product Management
- `POST /v1/product` - Create product (auth required)
- `GET /v1/product/{id}` - Get product by ID
- `PUT/PATCH /v1/product/{id}` - Update product (auth + ownership required)
- `DELETE /v1/product/{id}` - Delete product (auth + ownership required)

### Documentation
- `GET /api-docs` - Swagger UI interface

## Technology Stack

- **Backend**: Node.js 18+ with Express.js 5.1.0
- **Database**: PostgreSQL 14+ with Sequelize ORM 6.37.7
- **Authentication**: HTTP Basic Auth with BCrypt password hashing
- **Testing**: Jest 29.7.0 with SuperTest for integration testing
- **CI/CD**: GitHub Actions with automated testing pipeline
- **Documentation**: Swagger/OpenAPI 3.0 specification

## Assignment Compliance

This implementation satisfies all requirements for Assignments 1-3:
- Automatic database bootstrapping with zero manual intervention
- RESTful API endpoints with proper HTTP status codes
- BCrypt password security with salt
- Comprehensive integration testing (84 tests)
- GitHub Actions CI/CD pipeline with branch protection
- Production-ready error handling and validation