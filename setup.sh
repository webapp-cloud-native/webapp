#!/bin/bash
set -e

# Assignment 5 - Shell Script for Application Setup in AMI
# This script is designed to run during Packer AMI build
# Can be run multiple times safely (idempotent)

echo "============================================"
echo "Starting Application Setup for AMI Build"
echo "============================================"

# ============================================
# 1. UPDATE PACKAGE LISTS
# ============================================
echo "Step 1: Updating package lists..."
sudo apt-get update -y

# ============================================
# 2. UPGRADE SYSTEM PACKAGES
# ============================================
echo "Step 2: Upgrading system packages..."
sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y

# ============================================
# 3. INSTALL REQUIRED TOOLS
# ============================================
echo "Step 3: Installing required tools..."
sudo apt-get install -y unzip curl wget jq

# ============================================
# 4. INSTALL NODE.JS 18.x
# ============================================
echo "Step 4: Installing Node.js 18.x..."

# Remove any existing Node.js
sudo apt-get remove -y nodejs npm 2>/dev/null || true

# Install Node.js 18.x from NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js installation
node --version
npm --version

echo "Node.js installed successfully"

# ============================================
# 5. INSTALL CLOUDWATCH AGENT
# ============================================
echo "Step 5: Installing CloudWatch Agent..."

# Download CloudWatch Agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb -O /tmp/amazon-cloudwatch-agent.deb

# Install CloudWatch Agent
sudo dpkg -i /tmp/amazon-cloudwatch-agent.deb

# Verify CloudWatch Agent installation
if command -v /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl &> /dev/null; then
    echo "CloudWatch Agent installed successfully"
else
    echo "ERROR: CloudWatch Agent installation failed"
    exit 1
fi

# Create CloudWatch Agent configuration directory
sudo mkdir -p /opt/aws/amazon-cloudwatch-agent/etc/

# Clean up
sudo rm -f /tmp/amazon-cloudwatch-agent.deb

echo "CloudWatch Agent installation complete"


# ============================================
# 6. CREATE APPLICATION GROUP (IDEMPOTENT)
# ============================================
echo "Step 6: Creating application group..."
if ! getent group csye6225 > /dev/null 2>&1; then
    sudo groupadd csye6225
    echo "Group csye6225 created"
else
    echo "Group csye6225 already exists"
fi

# ============================================
# 7. CREATE APPLICATION USER ACCOUNT (IDEMPOTENT)
# ============================================
echo "Step 7: Creating application user..."
if ! id csye6225 > /dev/null 2>&1; then
    sudo useradd -r -s /usr/sbin/nologin -g csye6225 -d /opt/csye6225 -m csye6225
    echo "User csye6225 created with nologin shell"
else
    echo "User csye6225 already exists"
fi

# Ensure home directory exists with correct permissions
sudo mkdir -p /opt/csye6225
sudo chown csye6225:csye6225 /opt/csye6225
sudo chmod 755 /opt/csye6225

# ============================================
# 8. DEPLOY APPLICATION FILES
# ============================================
echo "Step 8: Deploying application files to /opt/csye6225/..."

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

    # Remove Mac artifacts and unnecessary files
    sudo rm -rf /opt/csye6225/__MACOSX
    sudo find /opt/csye6225 -name ".DS_Store" -delete 2>/dev/null || true
    sudo rm -rf /opt/csye6225/.git 2>/dev/null || true

    echo "Application files extracted successfully"
else
    echo "WARNING: webapp.zip not found in /tmp/"
    echo "Skipping application deployment (might be testing)"
fi

# ============================================
# 8.5. CREATE LOG DIRECTORY FOR APPLICATION
# ============================================
echo "Step 8.5: Creating log directory..."

# Create log directory
sudo mkdir -p /var/log/webapp

# Set ownership to application user
sudo chown csye6225:csye6225 /var/log/webapp

# Set permissions
sudo chmod 755 /var/log/webapp

echo "Log directory created at /var/log/webapp"

# ============================================
# 9. COPY ENVIRONMENT FILE
# ============================================
echo "Step 9: Setting up environment configuration..."

if [ -f /tmp/.env ]; then
    sudo cp /tmp/.env /opt/csye6225/.env
    sudo chown csye6225:csye6225 /opt/csye6225/.env
    sudo chmod 640 /opt/csye6225/.env
    echo ".env file copied and secured"
else
    echo "WARNING: .env file not found in /tmp/"
fi

# ============================================
# 10. SET PROPER OWNERSHIP AND PERMISSIONS
# ============================================
echo "Step 10: Setting ownership and permissions..."

# Set ownership of all application files
sudo chown -R csye6225:csye6225 /opt/csye6225

# Set directory permissions
sudo find /opt/csye6225 -type d -exec chmod 755 {} \;

# Set file permissions
sudo find /opt/csye6225 -type f -exec chmod 644 {} \;

# Make server.js executable (if needed)
if [ -f /opt/csye6225/server.js ]; then
    sudo chmod 755 /opt/csye6225/server.js
fi

echo "Permissions set successfully"

# ============================================
# 11. INSTALL SYSTEMD SERVICE
# ============================================
echo "Step 11: Installing systemd service..."

if [ -f /tmp/webapp.service ]; then
    # Copy service file to systemd directory
    sudo cp /tmp/webapp.service /etc/systemd/system/webapp.service

    # Set correct permissions
    sudo chmod 644 /etc/systemd/system/webapp.service

    # Reload systemd daemon
    sudo systemctl daemon-reload

    # Enable service (will start on boot)
    sudo systemctl enable webapp.service

    echo "Systemd service installed and enabled"
else
    echo "WARNING: webapp.service not found in /tmp/"
fi

# ============================================
# 12. VERIFY INSTALLATION
# ============================================
echo "Step 12: Verifying installation..."

echo "Checking Node.js..."
node --version

echo "Checking csye6225 user..."
id csye6225

echo "Checking application directory..."
ls -la /opt/csye6225/

echo "Checking systemd service..."
sudo systemctl status webapp.service --no-pager || true

# ============================================
# 13. CLEANUP
# ============================================
echo "Step 13: Cleaning up temporary files..."

# Remove git
echo "Removing git..."
if command -v git &> /dev/null; then
    sudo apt-get remove -y git
    sudo apt-get purge -y git
    echo "Git successfully removed"
else
    echo "Git was not installed"
fi

# Remove temporary files
sudo rm -f /tmp/webapp.zip
sudo rm -f /tmp/.env
sudo rm -f /tmp/.env.test
sudo rm -f /tmp/webapp.service
sudo rm -f /tmp/setup.sh

# Clean apt cache
sudo apt-get clean
sudo apt-get autoremove -y

echo "Cleanup completed"

# ============================================
# SETUP COMPLETE
# ============================================
echo "============================================"
echo "Application Setup Completed Successfully!"
echo "============================================"
echo ""
echo "Summary:"
echo "- Node.js 18.x installed"
echo "- CloudWatch Agent installed"
echo "- User csye6225 created (nologin)"
echo "- Application deployed to /opt/csye6225"
echo "- Log directory created at /var/log/webapp"
echo "- Systemd service configured"
echo ""
echo "The application will start automatically on instance boot."
echo "CloudWatch Agent will be configured and started via EC2 user data."
echo "============================================"