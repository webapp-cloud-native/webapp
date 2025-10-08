# Cloud-Native Web Application

RESTful API backend with Node.js, Express.js, PostgreSQL, integration testing, and CI/CD.

---

## Prerequisites

### Programming Language & Runtime
- **Node.js** 18+
- **npm** 8+

### System Requirements
- **PostgreSQL** 14+
- User account with CREATEDB privileges

---

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

---

## Step-by-Step Build Instructions

### 1. Clone Repository
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
psql -U postgres -h localhost

CREATE USER your_username WITH PASSWORD 'your_password' CREATEDB;
CREATE DATABASE webapp_db;
GRANT ALL PRIVILEGES ON DATABASE webapp_db TO your_username;
CREATE DATABASE webapp_test;
GRANT ALL PRIVILEGES ON DATABASE webapp_test TO your_username;

\q
```

### 4. Environment Configuration

Create `.env` file:
```env
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=webapp_db
DB_USER=your_username
DB_PASSWORD=your_password
PORT=8080
```

Create `.env.test` file:
```env
NODE_ENV=test
DB_HOST=localhost
DB_PORT=5432
DB_NAME=webapp_test
DB_USER=your_username
DB_PASSWORD=your_password
PORT=8080
```

### 5. Start Application
```bash
npm start
```

---

## Testing Procedures and Commands

### Run Tests
```bash
# Run all 84 integration tests
npm test

# Run with watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Configuration
- **Framework:** Jest 29.7.0
- **HTTP Testing:** SuperTest 6.3.4
- **Execution:** Serial (maxWorkers: 1)
- **Timeout:** 30 seconds per test
- **Total Tests:** 84 integration tests

### Test Coverage
- Health endpoint: 12 tests
- User management: 50 tests
- Product management: 22 tests

---

## Deployment Instructions

### Local Development
```bash
# Start PostgreSQL
brew services start postgresql@14  # macOS
sudo systemctl start postgresql    # Linux

# Start application
npm start
```

### Required Environment Variables
- `NODE_ENV` - Environment (development/test/production)
- `DB_HOST` - Database host
- `DB_PORT` - Database port
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `PORT` - Application port (default: 8080)

---

## API Endpoints

### Public
- `GET /healthz` - Health check (200/503)
- `POST /v1/user` - User registration (201)
- `GET /v1/product/{productId}` - Get product (200)

### Authenticated
- `GET /v1/user/{userId}` - Get user (200, auth required)
- `PUT /v1/user/{userId}` - Update user (204, auth required)
- `POST /v1/product` - Create product (201, auth required)
- `PUT /v1/product/{productId}` - Update product (200, owner only)
- `PATCH /v1/product/{productId}` - Partial update (200, owner only)
- `DELETE /v1/product/{productId}` - Delete product (204, owner only)

### Documentation
- `GET /api-docs` - Swagger UI

---

## CI/CD Pipeline

### GitHub Actions Workflow
**File:** `.github/workflows/ci.yml`

**Triggers:** Pull requests to `main` branch

**Steps:**
1. Checkout code
2. Setup Node.js 18
3. Install dependencies
4. Start PostgreSQL service
5. Run integration tests

**Environment:**
- Ubuntu latest
- PostgreSQL 14
- Node.js 18

### Branch Protection
- Require pull request before merging
- Require status checks to pass
- Require branches to be up to date
- Include administrators

---

## Technology Stack

- **Backend:** Node.js 18, Express.js 5.1.0
- **Database:** PostgreSQL 14, Sequelize 6.37.7
- **Authentication:** HTTP Basic Auth with BCrypt
- **Testing:** Jest 29.7.0, SuperTest 6.3.4
- **CI/CD:** GitHub Actions
- **Documentation:** Swagger/OpenAPI 3.0

---

## Project Structure

```
webapp/
├── .github/
│   └── workflows/
│       └── ci.yml                    # CI/CD pipeline
│
├── src/
│   ├── config/
│   │   ├── database.js              # Database configuration
│   │   └── swagger.js               # API documentation config
│   ├── controllers/
│   │   ├── healthController.js      # Health check logic
│   │   ├── userController.js        # User management logic
│   │   └── productController.js     # Product management logic
│   ├── middleware/
│   │   ├── auth.js                  # Authentication
│   │   ├── errorHandler.js          # Error handling
│   │   ├── jsonErrorHandler.js      # JSON error handler
│   │   └── validatePayload.js       # Request validation
│   ├── models/
│   │   ├── HealthCheck.js           # HealthCheck model
│   │   ├── User.js                  # User model
│   │   └── Product.js               # Product model
│   ├── routes/
│   │   ├── healthRoutes.js          # Health endpoints
│   │   ├── userRoutes.js            # User endpoints
│   │   ├── productRoutes.js         # Product endpoints
│   │   └── docsRoutes.js            # Swagger docs
│   └── services/
│       ├── authService.js           # Auth utilities
│       └── databaseService.js       # Database utilities
│
├── tests/
│   ├── config/
│   │   ├── test-database.js         # Test DB setup
│   │   └── test-setup.js            # Jest config
│   ├── helpers/
│   │   └── app-helper.js            # Test helper
│   └── integration/
│       ├── health.test.js           # Health tests (12)
│       ├── A-positive-tests/        # Happy path tests
│       │   ├── authentication-tests/
│       │   ├── creation-tests/
│       │   ├── retrieval-tests/
│       │   ├── update-tests/
│       │   └── delete-tests/
│       ├── B-negative-tests/        # Error handling tests
│       │   ├── authentication-error-tests/
│       │   ├── invalid-input-tests/
│       │   ├── resource-not-found-tests/
│       │   └── http-method-tests/
│       └── C-edge-case-tests/       # Edge case tests
│           ├── boundary-value-tests/
│           ├── data-integrity-tests/
│           └── performance-tests/
│
├── .env                              # Development config (gitignored)
├── .env.test                         # Test config (gitignored)
├── .gitignore                        # Git ignore patterns
├── jest.config.js                    # Jest configuration
├── package.json                      # Dependencies & scripts
├── README.md                         # This file
└── server.js                         # Application entry point
```

---

## Manual API Testing

```bash
# Health check
curl http://127.0.0.1:8080/healthz

# Create user
curl -X POST http://127.0.0.1:8080/v1/user \
  -H "Content-Type: application/json" \
  -d '{"username":"test@example.com","password":"SecurePass123!","first_name":"John","last_name":"Doe"}'

# Get user (authenticated)
AUTH=$(echo -n "test@example.com:SecurePass123!" | base64)
curl -H "Authorization: Basic $AUTH" http://127.0.0.1:8080/v1/user/1
```

---

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL status
brew services list  # macOS
sudo systemctl status postgresql  # Linux
```

### Test Failures
```bash
# Verify test database exists
psql -U postgres -l | grep webapp_test

# Run with verbose output
npm test -- --verbose
```

### Port Conflicts
```bash
# Find process using port 8080 /test
lsof -i :8080
```
