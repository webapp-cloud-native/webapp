# Cloud-Native Web Application

RESTful API with Node.js, Express.js, PostgreSQL, Packer AMI, and AWS deployment.

## Prerequisites

- **Node.js** 18+
- **npm** 8+
- **PostgreSQL** 14+
- **Packer** (latest)
- **Terraform** 1.5+
- **AWS CLI**
- **Ubuntu 24.04 LTS**

## Dependencies

**Core:**
- express ^5.1.0
- sequelize ^6.37.7
- pg ^8.16.3
- bcrypt ^5.1.1
- express-validator ^7.2.1
- dotenv ^17.2.2

**Testing:**
- jest ^29.7.0
- supertest ^6.3.4

## Quick Start

### 1. Clone & Install
```bash
git clone git@github.com:YOUR_USERNAME/webapp.git
cd webapp
npm install
```

### 2. Database Setup
```bash
psql -U postgres
CREATE USER your_username WITH PASSWORD 'your_password' CREATEDB;
CREATE DATABASE webapp_db;
CREATE DATABASE webapp_test;
\q
```

### 3. Environment Configuration
Create `.env`:
```env
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=webapp_db
DB_USER=your_username
DB_PASSWORD=your_password
PORT=8080
```

### 4. Run
```bash
npm start
```

## Testing

```bash
npm test                  # Run all 84 tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
```

**Test Suite:**
- Health endpoint: 12 tests
- User management: 50 tests
- Product management: 22 tests

## Packer AMI

### Components
- `packer/aws-ubuntu.pkr.hcl` - AMI template
- `packer/webapp.service` - Systemd service
- `setup.sh` - Automated setup script

### Build AMI
```bash
cd packer
packer init .
packer fmt .
packer validate aws-ubuntu.pkr.hcl
packer build -var "aws_region=us-east-1" aws-ubuntu.pkr.hcl
```

**AMI Includes:**
- Ubuntu 24.04 LTS
- Node.js 18.x
- PostgreSQL 14
- Application at `/opt/csye6225/`
- User `csye6225` (nologin)
- Systemd service

## AWS Deployment

### With Terraform
```bash
cd tf-aws-infra
terraform init
terraform plan
terraform apply

# Access application
curl http://<EC2_PUBLIC_IP>:8080/healthz

# Destroy
terraform destroy
```

### EC2 Details
- Application runs automatically via systemd
- Service: `systemctl status webapp.service`
- Path: `/opt/csye6225/`
- User: `csye6225`
- Database: PostgreSQL (local)

## API Endpoints

**Public:**
- `GET /healthz` - Health check
- `POST /v1/user` - User registration
- `GET /v1/product/{id}` - Get product

**Authenticated (Basic Auth):**
- `GET /v1/user/{id}` - Get user
- `PUT /v1/user/{id}` - Update user
- `POST /v1/product` - Create product
- `PUT /v1/product/{id}` - Update product
- `PATCH /v1/product/{id}` - Partial update
- `DELETE /v1/product/{id}` - Delete product
- `GET /api-docs` - Swagger UI

## CI/CD Workflows

### 1. Integration Tests (`ci.yml`)
- **Trigger:** PR to `main`
- **Steps:** Checkout → Setup Node.js → Install deps → Setup PostgreSQL → Run tests

### 2. Packer Validate (`packer-validate.yml`)
- **Trigger:** PR to `main`
- **Steps:** Checkout → Setup Packer → Format check → Validate template

### 3. Packer Build (`packer-build.yml`)
- **Trigger:** Push to `main` (after merge)
- **Steps:** Checkout → Setup → Run tests → Build artifact → Build AMI → Share with DEMO

**GitHub Secrets Required:**
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- `DEMO_ACCOUNT_ID`, `DEV_ACCOUNT_ID`
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`

## Tech Stack

- Node.js 18, Express.js 5.1
- PostgreSQL 14, Sequelize 6.37
- Jest 29.7, SuperTest 6.3
- Packer, Terraform
- GitHub Actions, systemd

## Project Structure

```
webapp/
├── .github/
│   └── workflows/
│       ├── ci.yml                        # Integration testing workflow
│       ├── packer-validate.yml           # Packer validation workflow
│       └── packer-build.yml              # AMI building workflow
│
├── packer/
│   ├── aws-ubuntu.pkr.hcl                # Packer template for AMI
│   └── webapp.service                    # Systemd service configuration
│
├── src/
│   ├── config/
│   │   ├── database.js                   # Database configuration
│   │   └── swagger.js                    # API documentation config
│   ├── controllers/
│   │   ├── healthController.js           # Health check logic
│   │   ├── userController.js             # User management logic
│   │   └── productController.js          # Product management logic
│   ├── middleware/
│   │   ├── auth.js                       # Authentication
│   │   ├── errorHandler.js               # Error handling
│   │   ├── jsonErrorHandler.js           # JSON error handler
│   │   └── validatePayload.js            # Request validation
│   ├── models/
│   │   ├── HealthCheck.js                # HealthCheck model
│   │   ├── User.js                       # User model
│   │   └── Product.js                    # Product model
│   ├── routes/
│   │   ├── healthRoutes.js               # Health endpoints
│   │   ├── userRoutes.js                 # User endpoints
│   │   ├── productRoutes.js              # Product endpoints
│   │   └── docsRoutes.js                 # Swagger docs
│   └── services/
│       ├── authService.js                # Auth utilities
│       └── databaseService.js            # Database utilities
│
├── tests/
│   ├── config/
│   │   ├── test-database.js              # Test DB setup
│   │   └── test-setup.js                 # Jest config
│   ├── helpers/
│   │   └── app-helper.js                 # Test helper
│   └── integration/
│       ├── health.test.js                # Health tests (12)
│       ├── A-positive-tests/             # Happy path tests
│       │   ├── authentication-tests/
│       │   ├── creation-tests/
│       │   ├── retrieval-tests/
│       │   ├── update-tests/
│       │   └── delete-tests/
│       ├── B-negative-tests/             # Error handling tests
│       │   ├── authentication-error-tests/
│       │   ├── invalid-input-tests/
│       │   ├── resource-not-found-tests/
│       │   └── http-method-tests/
│       └── C-edge-case-tests/            # Edge case tests
│           ├── boundary-value-tests/
│           ├── data-integrity-tests/
│           └── performance-tests/
│
├── .env                                   # Development config (gitignored)
├── .env.test                              # Test config (gitignored)
├── .gitignore                             # Git ignore patterns
├── jest.config.js                         # Jest configuration
├── package.json                           # Dependencies & scripts
├── setup.sh                               # Automated setup script for AMI
├── README.md                              # This file
└── server.js                              # Application entry point
```

### EC2 Structure
```
/opt/csye6225/                    # Application directory
├── src/
├── node_modules/
├── .env
├── server.js
└── ...

/etc/systemd/system/webapp.service
```

## AWS Resources

- VPC with public/private subnets
- Security groups (ports 22, 80, 443, 8080)
- EC2 instance with custom AMI
- PostgreSQL (local on EC2)
- Database port 5432 not exposed

## Testing

### Local
```bash
curl http://127.0.0.1:8080/healthz

curl -X POST http://127.0.0.1:8080/v1/user \
  -H "Content-Type: application/json" \
  -d '{"username":"test@example.com","password":"Pass123!","first_name":"John","last_name":"Doe"}'
```

### EC2
```bash
curl http://<EC2_PUBLIC_IP>:8080/healthz
```

## Troubleshooting

**Database:**
```bash
brew services list                      # macOS
sudo systemctl status postgresql        # Linux
```

**Packer:**
```bash
packer fmt -check packer/
export PACKER_LOG=1
```

**EC2:**
```bash
sudo systemctl status webapp.service
sudo journalctl -u webapp.service -f
ls -la /opt/csye6225/
```

**Terraform:**
```bash
terraform validate
TF_LOG=DEBUG terraform plan
```

## AWS Accounts

- DEV: 516246499586
- DEMO: 606531835150

---

CSYE6225 - Cloud Computing