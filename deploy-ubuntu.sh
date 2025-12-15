#!/bin/bash

# Farmforce Dashboard - Ubuntu Deployment Script
# Script untuk memudahkan deployment di Ubuntu Tencent Cloud

set -e

echo "==================================="
echo "Farmforce Dashboard Deployment"
echo "==================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Update system
echo "Step 1: Updating system..."
apt update && apt upgrade -y
print_success "System updated"

# Install Node.js
echo ""
echo "Step 2: Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    print_success "Node.js installed ($(node -v))"
else
    print_warning "Node.js already installed ($(node -v))"
fi

# Install PostgreSQL
echo ""
echo "Step 3: Installing PostgreSQL..."
if ! command -v psql &> /dev/null; then
    apt install -y postgresql postgresql-contrib
    systemctl start postgresql
    systemctl enable postgresql
    print_success "PostgreSQL installed"
else
    print_warning "PostgreSQL already installed"
fi

# Install PM2
echo ""
echo "Step 4: Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    print_success "PM2 installed"
else
    print_warning "PM2 already installed"
fi

# Install Nginx
echo ""
echo "Step 5: Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    systemctl enable nginx
    print_success "Nginx installed"
else
    print_warning "Nginx already installed"
fi

# Setup firewall
echo ""
echo "Step 6: Configuring firewall..."
apt install -y ufw
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
echo "y" | ufw enable
print_success "Firewall configured"

# Create database
echo ""
echo "Step 7: Setting up database..."
print_warning "You need to manually create database. Run these commands:"
echo ""
echo "sudo -u postgres psql"
echo "CREATE DATABASE farmforce_db;"
echo "CREATE USER farmforce_user WITH PASSWORD 'your_strong_password';"
echo "GRANT ALL PRIVILEGES ON DATABASE farmforce_db TO farmforce_user;"
echo "\\q"
echo ""
read -p "Press enter when database is created..."

# Setup application directory
echo ""
echo "Step 8: Creating application directory..."
mkdir -p /var/www/farmforce
chown $SUDO_USER:$SUDO_USER /var/www/farmforce
print_success "Directory created: /var/www/farmforce"

# Install Certbot for SSL
echo ""
echo "Step 9: Installing Certbot for SSL..."
apt install -y certbot python3-certbot-nginx
print_success "Certbot installed"

# Setup backup directory
echo ""
echo "Step 10: Creating backup directory..."
mkdir -p /var/backups/farmforce
print_success "Backup directory created"

# Summary
echo ""
echo "==================================="
echo "Installation Complete!"
echo "==================================="
echo ""
echo "Next steps:"
echo "1. Clone your repository to /var/www/farmforce"
echo "2. Create .env file with database credentials"
echo "3. Run: npm install"
echo "4. Run: npm run db:push"
echo "5. Run: npm run build"
echo "6. Run: pm2 start npm --name farmforce-dashboard -- start"
echo "7. Configure Nginx (see DEPLOYMENT.md)"
echo "8. Setup SSL with: sudo certbot --nginx -d your-domain.com"
echo ""
print_success "Server is ready for deployment!"
