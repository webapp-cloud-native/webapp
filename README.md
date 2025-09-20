# WebApp

A cloud-native backend API with automatic database bootstrapping and health monitoring capabilities.

## Features

- Health check endpoint (`GET /healthz`)
- Automatic database and table creation
- PostgreSQL integration with connection pooling
- MVC architecture with proper separation of concerns
- Environment-based configuration
- No manual database setup required

## Prerequisites

- Node.js 18+
- PostgreSQL 14+

## Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Database User Setup (One-time)
```sql
-- Connect as postgres superuser
CREATE USER your_username WITH PASSWORD 'your_password' CREATEDB;
```

### 3. Environment Configuration
```bash
cp .env.example .env
# Edit .env with your database credentials
```

### 4. Start Application
```bash
npm start
```

The application automatically creates the database and tables on first run.

## API Endpoint

### Health Check: `GET /healthz`

Tests database connectivity by inserting a record.

**Responses:**
- `200 OK` - Database healthy
- `400 Bad Request` - Request contains payload
- `405 Method Not Allowed` - Non-GET method
- `503 Service Unavailable` - Database unhealthy

**Example:**
```bash
curl -v http://localhost:8080/healthz
# Returns: 200 OK with empty body
```

## Project Structure

```
Assignment/
├── src/
│   ├── config/
│   │   └── database.js              # Database configuration & bootstrapping
│   ├── controllers/
│   │   └── healthController.js      # Health check business logic
│   ├── middleware/
│   │   ├── errorHandler.js          # Global error handling
│   │   └── validatePayload.js       # Request payload validation
│   ├── models/
│   │   └── HealthCheck.js           # Health check data model
│   ├── routes/
│   │   └── healthRoutes.js          # API route definitions
│   └── services/
│       └── databaseService.js       # Database operations service
├── server.js                        # Main application entry point
├── package.json                     # Dependencies and scripts
├── .env.example                     # Environment variables template
├── .env                            # Your environment variables (not in git)
├── start-db.sh                     # PostgreSQL start script (macOS)
├── stop-db.sh                      # PostgreSQL stop script (macOS)
└── README.md                       # This file
```

## Database Schema

```sql
CREATE TABLE health_checks (
  check_id BIGSERIAL PRIMARY KEY,
  check_datetime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## Testing

**Success:**
```bash
curl http://localhost:8080/healthz  # 200 OK
```

**Method Not Allowed:**
```bash
curl -X POST http://localhost:8080/healthz  # 405
```

**Bad Request:**
```bash
curl -d '{}' http://localhost:8080/healthz  # 400
```

**Database Failure:**
```bash
./stop-db.sh  # Stop database
curl http://localhost:8080/healthz  # 503 Service Unavailable
./start-db.sh  # Restart database
curl http://localhost:8080/healthz  # 200 OK
```

## Author

Aniruddha Chitte - Cloud Assignment 1