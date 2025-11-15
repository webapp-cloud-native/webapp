packer {
  required_plugins {
    amazon = {
      version = ">= 1.0.0"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "demo_account_id" {
  type = string
}

variable "dev_account_id" {
  type = string
}

source "amazon-ebs" "ubuntu" {
  region          = var.aws_region
  ami_name        = "csye6225-webapp-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
  ami_description = "Ubuntu AMI for CSYE6225 Web Application"
  instance_type   = "t2.micro"

  source_ami_filter {
    filters = {
      name                = "ubuntu/images/hvm-ssd/ubuntu-noble-24.04-amd64-server-*"
      root-device-type    = "ebs"
      virtualization-type = "hvm"
    }
    most_recent = true
    owners      = ["099720109477"]
  }

  ssh_username = "ubuntu"
  ami_users    = [var.demo_account_id, var.dev_account_id]

  launch_block_device_mappings {
    device_name           = "/dev/sda1"
    volume_size           = 25
    volume_type           = "gp2"
    delete_on_termination = true
  }
}

build {
  sources = ["source.amazon-ebs.ubuntu"]

  # CRITICAL: Install AWS CLI and jq FIRST
  provisioner "shell" {
    inline = [
      "echo '=== Installing system dependencies ==='",
      "sudo apt-get update -y",
      "sudo apt-get upgrade -y",
      "sudo apt-get install -y awscli jq postgresql-client netcat-openbsd unzip",
      "echo '=== Verifying installations ==='",
      "aws --version",
      "jq --version",
      "psql --version",
      "nc -h 2>&1 | head -1 || true"
    ]
  }

  # Create application user and directories
  provisioner "shell" {
    inline = [
      "echo '=== Creating application user ==='",
      "sudo groupadd -r csye6225 || true",
      "sudo useradd -r -g csye6225 -s /bin/bash csye6225 || true",
      "sudo mkdir -p /opt/csye6225",
      "sudo mkdir -p /var/log/webapp",
      "sudo chown -R csye6225:csye6225 /opt/csye6225",
      "sudo chown -R csye6225:csye6225 /var/log/webapp"
    ]
  }

  # Copy application files
  provisioner "file" {
    source      = "webapp.zip"  # File is in same directory as workflow
    destination = "/tmp/webapp.zip"
  }

  # Extract and setup application
  provisioner "shell" {
    inline = [
      "echo '=== Setting up application ==='",
      "sudo unzip -q /tmp/webapp.zip -d /opt/csye6225",
      "sudo chown -R csye6225:csye6225 /opt/csye6225",
      "cd /opt/csye6225",
      "sudo -u csye6225 npm install --production --omit=dev",
      "sudo rm /tmp/webapp.zip"
    ]
  }

  # Copy systemd service file
  provisioner "file" {
    source      = "webapp.service"  # File should be in repo root
    destination = "/tmp/webapp.service"
  }

  # Setup systemd service
  provisioner "shell" {
    inline = [
      "echo '=== Setting up systemd service ==='",
      "sudo mv /tmp/webapp.service /etc/systemd/system/webapp.service",
      "sudo systemctl daemon-reload",
      "sudo systemctl enable webapp.service",
      "echo 'Service enabled but not started (will start via user_data)'"
    ]
  }

  # Copy CloudWatch config
  provisioner "file" {
    source      = "cloudwatch-config.json"  # File should be in repo root
    destination = "/tmp/cloudwatch-config.json"
  }

  # Install and configure CloudWatch Agent
  provisioner "shell" {
    inline = [
      "echo '=== Installing CloudWatch Agent ==='",
      "wget -q https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb",
      "sudo dpkg -i -E ./amazon-cloudwatch-agent.deb",
      "sudo mkdir -p /opt/aws/amazon-cloudwatch-agent/etc/",
      "sudo mv /tmp/cloudwatch-config.json /opt/aws/amazon-cloudwatch-agent/etc/cloudwatch-config.json",
      "rm amazon-cloudwatch-agent.deb",
      "echo 'CloudWatch Agent installed (will be configured via user_data)'"
    ]
  }

  # Cleanup and validation
  provisioner "shell" {
    inline = [
      "echo '=== Final validation ==='",
      "echo 'Checking AWS CLI:'",
      "which aws && aws --version",
      "echo 'Checking jq:'",
      "which jq && jq --version",
      "echo 'Checking application files:'",
      "ls -la /opt/csye6225/ | head -10",
      "echo 'Checking systemd service:'",
      "systemctl list-unit-files | grep webapp",
      "echo 'Checking CloudWatch Agent:'",
      "ls -la /opt/aws/amazon-cloudwatch-agent/etc/",
      "echo '=== AMI build validation complete ✅ ==='",
      "sudo apt-get clean",
      "sudo rm -rf /tmp/* /var/tmp/*"
    ]
  }

  # Create manifest file
  post-processor "manifest" {
    output     = "manifest.json"
    strip_path = true
  }
}