#!/bin/bash
set -e

echo "🔧 Starting VPS setup for Gurmania deployment..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
echo "📦 Installing required packages..."
sudo apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    software-properties-common \
    git \
    nginx \
    ufw

# Install Docker
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo "✅ Docker installed"
else
    echo "✅ Docker already installed"
fi

# Install Docker Compose
echo "🐳 Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose installed"
else
    echo "✅ Docker Compose already installed"
fi

# Setup firewall
echo "🔥 Configuring firewall..."
sudo ufw --force enable
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
echo "✅ Firewall configured"

# Create application directory
echo "📁 Creating application directories..."
sudo mkdir -p /opt/gurmania
sudo mkdir -p /opt/gurmania/backups
sudo chown -R $USER:$USER /opt/gurmania

# Clone repository (you'll need to add SSH key or use HTTPS with credentials)
echo "📥 Setting up repository..."
if [ ! -d "/opt/gurmania/.git" ]; then
    # Check if directory is empty
    if [ -z "$(ls -A /opt/gurmania)" ]; then
        cd /opt/gurmania
        # Replace with your repository URL
        read -p "Enter your GitHub repository URL (e.g., git@github.com:username/cooking-class.git): " REPO_URL
        git clone $REPO_URL .
    else
        # Directory exists but no .git - initialize and pull
        cd /opt/gurmania
        read -p "Enter your GitHub repository URL (e.g., git@github.com:username/cooking-class.git): " REPO_URL
        git init
        git remote add origin $REPO_URL
        git fetch origin
        git checkout -b dev origin/dev || git checkout dev
        git pull origin dev
    fi
else
    echo "✅ Repository already cloned"
    cd /opt/gurmania
    echo "📦 Pulling latest changes..."
    git fetch origin
    git checkout dev
    git pull origin dev
fi

# Setup Nginx - Create temporary HTTP-only config for SSL verification
echo "🌐 Setting up temporary Nginx configuration..."
sudo tee /etc/nginx/sites-available/gurmania-temp > /dev/null <<'EOF'
server {
    listen 80;
    server_name dev.gurmania.gorstaci.org gurmania.gorstaci.org;
    
    location / {
        return 200 "OK - Gurmania Setup";
        add_header Content-Type text/plain;
    }
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/gurmania-temp /etc/nginx/sites-enabled/gurmania-temp
sudo rm -f /etc/nginx/sites-enabled/default
sudo mkdir -p /var/www/html

# Test Nginx configuration
sudo nginx -t
sudo systemctl reload nginx

# Install Certbot for SSL
echo "🔐 Installing Certbot for SSL certificates..."
if ! command -v certbot &> /dev/null; then
    sudo snap install core
    sudo snap refresh core
    sudo snap install --classic certbot
    sudo ln -sf /snap/bin/certbot /usr/bin/certbot
    echo "✅ Certbot installed"
else
    echo "✅ Certbot already installed"
fi

# Setup cron for database backups
echo "⏰ Setting up automated database backups..."
CRON_JOB="0 2 * * * /opt/gurmania/deployment/scripts/backup-db.sh >> /var/log/gurmania-backup.log 2>&1"
(crontab -l 2>/dev/null | grep -v backup-db.sh; echo "$CRON_JOB") | crontab -

# Make scripts executable
echo "🔧 Making deployment scripts executable..."
chmod +x /opt/gurmania/deployment/scripts/*.sh

echo ""
echo "✨ VPS setup completed successfully!"
echo ""
echo "📝 Next steps:"
echo ""
echo "1. Obtain SSL certificates:"
echo "   sudo certbot --nginx -d gurmania.gorstaci.org -d dev.gurmania.gorstaci.org"
echo ""
echo "2. Apply final Nginx configuration with SSL:"
echo "   sudo rm /etc/nginx/sites-enabled/gurmania-temp"
echo "   sudo ln -sf /etc/nginx/sites-available/gurmania /etc/nginx/sites-enabled/gurmania"
echo "   sudo nginx -t"
echo "   sudo systemctl reload nginx"
echo ""
echo "3. Create .env files:"
echo "   cd /opt/gurmania/deployment"
echo "   cp .env.dev.example .env.dev"
echo "   cp .env.prod.example .env.prod"
echo "   nano .env.dev  # Fill in actual values"
echo "   nano .env.prod # Fill in actual values (use DIFFERENT passwords!)"
echo "   chmod 600 .env.dev .env.prod"
echo ""
echo "4. Generate NEXTAUTH_SECRET for both environments:"
echo "   openssl rand -base64 32"
echo ""
echo "5. Deploy the applications:"
echo "   cd /opt/gurmania/deployment/scripts"
echo "   ./deploy-dev.sh"
echo "   ./deploy-prod.sh"
echo ""
echo "6. Setup GitHub Actions secrets:"
echo "   - VPS_HOST: Your VPS IP address"
echo "   - VPS_USER: Your SSH username"
echo "   - VPS_SSH_KEY: Generate with 'ssh-keygen -t ed25519 -C github-actions'"
echo "   - VPS_PORT: 22"
echo ""
echo "📚 For detailed instructions, see: /opt/gurmania/deployment/DEPLOYMENT_GUIDE.md"
echo ""
echo "⚠️  Remember to log out and log back in for Docker group changes to take effect!"

