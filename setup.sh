#!/bin/bash
set -e

# Assignment 4 - Shell Script for Application Setup
# This script automates the deployment of a cloud-native web application
# Can be run multiple times safely (idempotent)

# ============================================
# LOAD CREDENTIALS FROM .env FILE
# ============================================

echo "Loading configuration from .env file..."

# Check if .env file exists
if [ -f /tmp/.env ]; then
    ENV_FILE="/tmp/.env"
elif [ -f .env ]; then
    ENV_FILE=".env"
else
    echo "ERROR: .env file not found!"
    exit 1
fi

# Function to extract value from .env file
get_env_value() {
    local key=$1
    grep "^${key}=" "${ENV_FILE}" | cut -d '=' -f2- | tr -d '"' | tr -d "'"
}

# Load database credentials
db_name=$(get_env_value "DB_NAME")
db_user=$(get_env_value "DB_USER")
db_password=$(get_env_value "DB_PASSWORD")

# Validate credentials
if [ -z "$db_name" ] || [ -z "$db_user" ] || [ -z "$db_password" ]; then
    echo "ERROR: Failed to load database credentials from .env"
    exit 1
fi

echo "Configuration loaded successfully"

# ============================================
# 1. UPDATE PACKAGE LISTS
# ============================================
echo "Step 1: Updating package lists..."
sudo apt-get update -y

# ============================================
# 2. UPGRADE SYSTEM PACKAGES
# ============================================
echo "Step 2: Upgrading system packages..."
sudo apt-get upgrade -y

# ============================================
# 3. INSTALL DATABASE MANAGEMENT SYSTEM + TOOLS
# ============================================
echo "Step 3: Installing PostgreSQL and required tools..."
sudo apt-get install -y postgresql postgresql-contrib unzip curl

# Enable and start PostgreSQL service
sudo systemctl enable postgresql
sudo systemctl start postgresql

echo "PostgreSQL and tools installed successfully"

# ============================================
# 4. CREATE APPLICATION DATABASE (IDEMPOTENT)
# ============================================
echo "Step 4: Creating application database..."

# Create database and user (idempotent - checks if exists first)
sudo -u postgres psql <<EOF
-- Create database only if it doesn't exist
SELECT 'CREATE DATABASE ${db_name}'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${db_name}')\gexec

-- Create or update user
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = '${db_user}') THEN
        CREATE USER ${db_user} WITH PASSWORD '${db_password}';
        RAISE NOTICE 'User ${db_user} created';
    ELSE
        ALTER USER ${db_user} WITH PASSWORD '${db_password}';
        RAISE NOTICE 'User ${db_user} password updated';
    END IF;
END
\$\$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ${db_name} TO ${db_user};
EOF

# Set schema permissions
sudo -u postgres psql -d "${db_name}" <<EOF
-- Make user owner of public schema
ALTER SCHEMA public OWNER TO ${db_user};

-- Grant all privileges on schema
GRANT ALL PRIVILEGES ON SCHEMA public TO ${db_user};

-- Grant privileges on existing tables and sequences
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${db_user};
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${db_user};

-- Grant default privileges for future tables and sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${db_user};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${db_user};
EOF

echo "Database '${db_name}' created successfully with full permissions"

# ============================================
# 5. CREATE APPLICATION LINUX GROUP (IDEMPOTENT)
# ============================================
echo "Step 5: Creating application group..."
# Only create if doesn't exist
if ! getent group csye6225 > /dev/null 2>&1; then
    sudo groupadd csye6225
    echo "Group csye6225 created"
else
    echo "Group csye6225 already exists"
fi

# ============================================
# 6. CREATE APPLICATION USER ACCOUNT (IDEMPOTENT)
# ============================================
echo "Step 6: Creating application user..."
# Only create if doesn't exist
if ! id csye6225 > /dev/null 2>&1; then
    sudo useradd -r -s /bin/false -g csye6225 -d /opt/csye6225 -m csye6225
    echo "User csye6225 created"
else
    echo "User csye6225 already exists"
fi

# Ensure home directory exists with correct permissions
sudo mkdir -p /home/csye6225
sudo chown csye6225:csye6225 /home/csye6225
sudo chmod 755 /home/csye6225

# ============================================
# 7. DEPLOY APPLICATION FILES
# ============================================
echo "Step 7: Deploying application files to /opt/csye6225/..."

# Create directory if it doesn't exist
sudo mkdir -p /opt/csye6225

# Check if webapp.zip exists and unzip
if [ -f /tmp/webapp.zip ]; then
    # Extract to /opt/csye6225/
    sudo unzip -o /tmp/webapp.zip -d /opt/csye6225/
    
    # Handle nested webapp folder if it exists
    if [ -d /opt/csye6225/webapp ]; then
        echo "Detected nested webapp folder, flattening structure..."
        sudo cp -r /opt/csye6225/webapp/* /opt/csye6225/
        sudo rm -rf /opt/csye6225/webapp
    fi
    
    # Remove Mac artifacts
    sudo rm -rf /opt/csye6225/__MACOSX
    sudo find /opt/csye6225 -name ".DS_Store" -delete 2>/dev/null || true
    
    echo "Application files extracted successfully"
else
    echo "ERROR: webapp.zip not found in /tmp/"
    exit 1
fi

# Copy .env file to application directory
if [ -f "${ENV_FILE}" ]; then
    sudo cp "${ENV_FILE}" /opt/csye6225/.env
    echo ".env file copied to application directory"
fi

# Copy .env.test file if exists
if [ -f /tmp/.env.test ]; then
    sudo cp /tmp/.env.test /opt/csye6225/.env.test
    echo ".env.test file copied to application directory"
fi

# ============================================
# 8. SET FILE PERMISSIONS
# ============================================
echo "Step 8: Setting file permissions..."

# Set ownership to application user and group
sudo chown -R csye6225:csye6225 /opt/csye6225

# Set appropriate permissions
sudo chmod -R 755 /opt/csye6225

# Secure the .env files
sudo chmod 600 /opt/csye6225/.env
[ -f /opt/csye6225/.env.test ] && sudo chmod 600 /opt/csye6225/.env.test

echo "File permissions set successfully"

# ============================================
# INSTALL NODE.JS AND DEPENDENCIES
# ============================================
echo "Installing Node.js..."

# Check if Node.js already installed
if command -v node > /dev/null 2>&1; then
    echo "Node.js already installed: $(node -v)"
else
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo "Node.js installed: $(node -v)"
fi

echo "NPM version: $(npm -v)"

# Clean up any existing node_modules to avoid conflicts
echo "Cleaning up existing node_modules..."
sudo rm -rf /opt/csye6225/node_modules

# Install application dependencies
echo "Installing application dependencies..."
cd /opt/csye6225
sudo -u csye6225 npm install

echo "Dependencies installed successfully"

# ============================================
# CREATE LOG DIRECTORY
# ============================================
echo "Creating log directory..."
sudo mkdir -p /var/log/csye6225
sudo chown csye6225:csye6225 /var/log/csye6225
sudo chmod 755 /var/log/csye6225

# ============================================
# START APPLICATION
# ============================================
echo "=========================================="
echo "Starting application..."
echo "=========================================="

cd /opt/csye6225

# Start the application in background
sudo -u csye6225 nohup npm start > /var/log/csye6225/app.log 2>&1 &
APP_PID=$!

echo "Application started with PID: $APP_PID"
echo "Waiting for application to initialize..."
sleep 10

# Check if application is still running
if ps -p $APP_PID > /dev/null; then
    echo "✅ Application is running"
else
    echo "❌ Application failed to start"
    echo "Check logs at: /var/log/csye6225/app.log"
    tail -20 /var/log/csye6225/app.log
    exit 1
fi

# ============================================
# HEALTH CHECK TEST
# ============================================
echo "=========================================="
echo "Testing application health..."
echo "=========================================="

# Test the health endpoint
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/healthz)

if [ "$HEALTH_CHECK" = "200" ]; then
    echo "✅ Health check passed (HTTP 200)"
    echo "Application is healthy and ready to serve requests"
else
    echo "❌ Health check failed (HTTP $HEALTH_CHECK)"
    echo "Check logs at: /var/log/csye6225/app.log"
    tail -20 /var/log/csye6225/app.log
    exit 1
fi

# ============================================
# COMPLETION
# ============================================
echo "=========================================="
echo "Setup completed successfully!"
echo "=========================================="
echo "Database: ${db_name}"
echo "Database User: ${db_user}"
echo "Application Directory: /opt/csye6225"
echo "Application PID: $APP_PID"
echo "Log File: /var/log/csye6225/app.log"
echo ""
echo "Application Status:"
echo "  Running: ✅ YES"
echo "  Health Check: ✅ PASSED"
echo "  Endpoint: http://localhost:8080"
echo ""
echo "Useful Commands:"
echo "  View logs: tail -f /var/log/csye6225/app.log"
echo "  Stop app: sudo pkill -f 'node.*server.js'"
echo "  Restart app: cd /opt/csye6225 && sudo -u csye6225 npm start"
echo "  Test health: curl http://localhost:8080/healthz"
echo "=========================================="