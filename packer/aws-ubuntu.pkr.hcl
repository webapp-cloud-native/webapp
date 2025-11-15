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

variable "source_ami" {
  type    = string
  default = "ami-0e2c8caa4b6378d8c" # Ubuntu 24.04 LTS in us-east-1
}

variable "ssh_username" {
  type    = string
  default = "ubuntu"
}

variable "subnet_id" {
  type    = string
  default = ""
}

variable "ami_prefix" {
  type    = string
  default = "csye6225"
}

variable "instance_type" {
  type    = string
  default = "t2.micro"
}

variable "demo_account_id" {
  type    = string
  default = "606531835150"
}

variable "dev_account_id" {
  type    = string
  default = "516246499586"
}

locals {
  timestamp = regex_replace(timestamp(), "[- TZ:]", "")
  ami_name  = "${var.ami_prefix}-${local.timestamp}"
}

source "amazon-ebs" "ubuntu" {
  ami_name        = local.ami_name
  ami_description = "Ubuntu 24.04 LTS AMI for CSYE6225 webapp"
  instance_type   = var.instance_type
  region          = var.aws_region
  ssh_username    = var.ssh_username
  source_ami      = var.source_ami
  ami_users       = [var.demo_account_id]

  aws_polling {
    delay_seconds = 30
    max_attempts  = 50
  }

  launch_block_device_mappings {
    device_name           = "/dev/sda1"
    volume_size           = 25
    volume_type           = "gp2"
    delete_on_termination = true
  }

  tags = {
    Name        = local.ami_name
    Environment = "dev"
    Project     = "CSYE6225"
    Created_by  = "Packer"
    Timestamp   = local.timestamp
  }
}

build {
  sources = ["source.amazon-ebs.ubuntu"]

  # Copy .env file
  provisioner "file" {
    source      = "../.env"
    destination = "/tmp/.env"
  }

  # Copy application zip (will be created by GitHub Actions)
  provisioner "file" {
    source      = "../webapp.zip"
    destination = "/tmp/webapp.zip"
  }

  # Copy systemd service file
  provisioner "file" {
    source      = "webapp.service"
    destination = "/tmp/webapp.service"
  }

  # Copy CloudWatch Agent configuration file
  provisioner "file" {
    source      = "cloudwatch-config.json"
    destination = "/tmp/cloudwatch-config.json"
  }

  # Copy setup script
  provisioner "file" {
    source      = "../setup.sh"
    destination = "/tmp/setup.sh"
  }

  # Make setup script executable
  provisioner "shell" {
    inline = [
      "chmod +x /tmp/setup.sh"
    ]
  }

  # Run setup script
  provisioner "shell" {
    inline = [
      "sudo /tmp/setup.sh"
    ]
  }

  # Copy CloudWatch config to proper location
  provisioner "shell" {
    inline = [
      "sudo mkdir -p /opt/aws/amazon-cloudwatch-agent/etc/",
      "sudo cp /tmp/cloudwatch-config.json /opt/aws/amazon-cloudwatch-agent/etc/cloudwatch-config.json",
      "sudo chown root:root /opt/aws/amazon-cloudwatch-agent/etc/cloudwatch-config.json",
      "sudo chmod 644 /opt/aws/amazon-cloudwatch-agent/etc/cloudwatch-config.json",
      "echo 'CloudWatch configuration file copied'"
    ]
  }

  # Verify installation
  provisioner "shell" {
    inline = [
      "echo 'Verifying Node.js installation...'",
      "node --version",
      "echo 'Verifying csye6225 user...'",
      "id csye6225",
      "echo 'Verifying application directory...'",
      "ls -la /opt/csye6225/",
      "echo 'Verifying CloudWatch Agent...'",
      "ls -la /opt/aws/amazon-cloudwatch-agent/etc/cloudwatch-config.json",
      "echo 'Verifying systemd service...'",
      "sudo systemctl status webapp.service --no-pager || echo 'Service configured but not running (expected during build)'",
      "echo 'Verification complete!'"
    ]
  }

  post-processor "manifest" {
    output     = "manifest.json"
    strip_path = true
  }
}