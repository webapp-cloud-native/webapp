# Cloud-Native Web Application

RESTful API backend with Node.js, Express.js, PostgreSQL, comprehensive integration testing, and CI/CD pipeline.

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

---

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

# Create development database
CREATE DATABASE webapp_db;
GRANT ALL PRIVILEGES ON DATABASE webapp_db TO your_username;

# Create test database
CREATE DATABASE webapp_test;
GRANT ALL PRIVILEGES ON DATABASE webapp_test TO your_username;

\q
```

### 4. Environment Configuration

Create `.env` file in project root:
```env
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=webapp_db
DB_USER=your_username
DB_PASSWORD=your_password
PORT=8080
```

Create `.env.test` file in project root:
```env
NODE_ENV=test
DB_HOST=localhost
DB_PORT=5432
DB_NAME=webapp_test
DB_USER=your_username
DB_PASSWORD=your_password
PORT=8080
```

**Important:** Replace `your_username` and `your_password` with actual PostgreSQL credentials.

### 5. Start Application
```bash
npm start
```

Application automatically creates tables and schema on startup.

---

## Testing Procedures and Commands

### Run Integration Tests
```bash
# Run all 84 integration tests
npm test

# Run with watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Configuration
- **Test Framework:** Jest 29.7.0
- **HTTP Testing:** SuperTest 6.3.4
- **Test Database:** Separate `webapp_test` database
- **Execution:** Serial (maxWorkers: 1) for database isolation
- **Timeout:** 30 seconds per test

### Test Coverage
- Health check endpoints (12 tests)
- User management and authentication (50 tests)
- Product CRUD operations (22 tests)
- Total: 84 integration tests

### Manual API Testing
```bash
# Health check
curl http://127.0.0.1:8080/healthz

# Create user
curl -X POST http://127.0.0.1:8080/v1/user \
  -H "Content-Type: application/json" \
  -d '{
    "username":"test@example.com",
    "password":"SecurePass123!",
    "first_name":"John",
    "last_name":"Doe"
  }'

# Get user (authenticated)
AUTH=$(echo -n "test@example.com:SecurePass123!" | base64)
curl -H "Authorization: Basic $AUTH" \
  http://127.0.0.1:8080/v1/user/1
```

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
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `PORT` (defaults to 8080)
- `NODE_ENV` (development/test/production)

---

## API Endpoints

### Health Check
- `GET /healthz` - Database connectivity test (200/503)

### User Management  
- `POST /v1/user` - User registration (201)
- `GET /v1/user/:userId` - Get user profile (200, auth required)
- `PUT /v1/user/:userId` - Update user profile (204, auth required)

### Product Management
- `POST /v1/product` - Create product (201, auth required)
- `GET /v1/product/:productId` - Get product (200, public)
- `PUT /v1/product/:productId` - Update product (200, owner only)
- `PATCH /v1/product/:productId` - Partial update (200, owner only)
- `DELETE /v1/product/:productId` - Delete product (204, owner only)

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
- Pull request required before merging
- CI tests must pass
- Branches must be up to date
- Applies to administrators

---

## Technology Stack

- **Backend:** Node.js 18+ with Express.js 5.1.0
- **Database:** PostgreSQL 14+ with Sequelize ORM 6.37.7
- **Authentication:** HTTP Basic Auth with BCrypt password hashing
- **Testing:** Jest 29.7.0 with SuperTest integration testing
- **CI/CD:** GitHub Actions with automated testing
- **Documentation:** Swagger/OpenAPI 3.0

---

## Project Structure

```
webapp/
├── .github/workflows/ci.yml       # CI/CD pipeline
├── src/
│   ├── config/                    # Database & Swagger config
│   ├── controllers/               # Business logic
│   ├── middleware/                # Auth, validation, errors
│   ├── models/                    # Data models
│   ├── routes/                    # API routes
│   └── services/                  # Auth & database services
├── tests/
│   ├── config/                    # Test configuration
│   ├── helpers/                   # Test utilities
│   └── integration/               # Integration tests (84 tests)
├── .env                           # Development config (not in git)
├── .env.test                      # Test config (not in git)
├── jest.config.js                 # Jest configuration
├── package.json                   # Dependencies
└── server.js                      # Application entry point
```
