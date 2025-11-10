# Gurmania Deployment Guide

Complete guide for deploying Gurmania to a VPS with Docker, PostgreSQL, and Nginx.

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [VPS Initial Setup](#vps-initial-setup)
4. [SSH Key Setup](#ssh-key-setup)
5. [Environment Configuration](#environment-configuration)
6. [SSL Certificate Setup](#ssl-certificate-setup)
7. [Initial Deployment](#initial-deployment)
8. [GitHub Actions Setup](#github-actions-setup)
9. [Monitoring and Maintenance](#monitoring-and-maintenance)
10. [Troubleshooting](#troubleshooting)
11. [Database Management](#database-management)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     VPS (Ubuntu 24.04)                  │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │              Nginx Reverse Proxy               │    │
│  │  - dev.gurmania.gorstaci.org (Port 443)       │    │
│  │  - gurmania.gorstaci.org (Port 443)           │    │
│  └────────────┬───────────────────┬────────────────┘    │
│               │                   │                     │
│  ┌────────────▼──────────┐   ┌───▼──────────────────┐  │
│  │  Dev Environment      │   │  Prod Environment    │  │
│  │  (Port 3001)          │   │  (Port 3002)         │  │
│  │                       │   │                      │  │
│  │  ┌─────────────────┐  │   │  ┌─────────────────┐ │  │
│  │  │ Next.js App     │  │   │  │ Next.js App     │ │  │
│  │  │ (Docker)        │  │   │  │ (Docker)        │ │  │
│  │  └─────────┬───────┘  │   │  └────────┬────────┘ │  │
│  │            │          │   │           │          │  │
│  │  ┌─────────▼───────┐  │   │  ┌────────▼────────┐ │  │
│  │  │ PostgreSQL      │  │   │  │ PostgreSQL      │ │  │
│  │  │ (Docker)        │  │   │  │ (Docker)        │ │  │
│  │  │ gurmania_dev    │  │   │  │ gurmania_prod   │ │  │
│  │  └─────────────────┘  │   │  └─────────────────┘ │  │
│  └───────────────────────┘   └──────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Key Components:**
- **Two isolated environments** (dev and prod) with separate databases
- **Docker containers** for application and database
- **Nginx** as reverse proxy with SSL termination
- **Automatic deployments** via GitHub Actions
- **Database migrations** via Prisma on each deployment

---

## Prerequisites

### On Your Local Machine:
- Git configured with SSH access to your repository
- Access to your VPS via SSH

### On Your VPS:
- Ubuntu 24.04 (fresh installation)
- Root or sudo access
- DNS A records pointing to your VPS IP:
  - `dev.gurmania.gorstaci.org` → VPS IP
  - `gurmania.gorstaci.org` → VPS IP

---

## VPS Initial Setup

### Step 1: Connect to Your VPS

```bash
ssh root@your-vps-ip
# or if you have a non-root user:
ssh your-username@your-vps-ip
```

### Step 2: Run the Automated Setup Script

```bash
# Download and run the setup script
curl -o setup.sh https://raw.githubusercontent.com/YOUR_USERNAME/cooking-class/main/deployment/scripts/setup-vps.sh
chmod +x setup.sh
./setup.sh
```

**Or manually copy the script:**

```bash
# Create a temporary file
nano setup-vps.sh
# Copy the contents from deployment/scripts/setup-vps.sh
# Make it executable
chmod +x setup-vps.sh
# Run it
./setup-vps.sh
```

The script will:
- ✅ Update system packages
- ✅ Install Docker and Docker Compose
- ✅ Install Nginx
- ✅ Configure firewall (UFW)
- ✅ Install Certbot for SSL
- ✅ Create application directories
- ✅ Clone your repository
- ✅ Setup cron jobs for backups

### Step 3: Log Out and Back In

```bash
exit
ssh your-username@your-vps-ip
```

This ensures Docker group permissions take effect.

### Step 4: Verify Installations

```bash
docker --version
docker-compose --version
nginx -v
git --version
```

---

## SSH Key Setup

### Step 1: Generate SSH Deploy Key (if needed)

On your VPS:

```bash
ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/github_deploy
# Press Enter to skip passphrase (for automated deployments)
```

### Step 2: Add Deploy Key to GitHub

1. Copy the public key:
```bash
cat ~/.ssh/github_deploy.pub
```

2. Go to your GitHub repository → Settings → Deploy keys
3. Click "Add deploy key"
4. Title: "VPS Deploy Key"
5. Paste the public key
6. ✅ Check "Allow write access" (if needed for git operations)
7. Click "Add key"

### Step 3: Configure Git SSH

On your VPS:

```bash
# Add GitHub to known hosts
ssh-keyscan github.com >> ~/.ssh/known_hosts

# Configure SSH to use the deploy key
cat >> ~/.ssh/config << 'EOF'
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/github_deploy
    IdentitiesOnly yes
EOF

chmod 600 ~/.ssh/config
```

### Step 4: Clone Repository

```bash
cd /opt/gurmania
# If not already cloned during setup:
git clone git@github.com:YOUR_USERNAME/cooking-class.git .
```

---

## Environment Configuration

### Step 1: Create Development Environment File

```bash
cd /opt/gurmania/deployment
cp .env.dev.example .env.dev
nano .env.dev
```

Fill in the values:

```env
# PostgreSQL Configuration
POSTGRES_USER=gurmania_dev
POSTGRES_PASSWORD=your_strong_dev_password_here
POSTGRES_DB=gurmania_dev

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret_dev_here

# Email Configuration
EMAIL_SERVER_HOST=smtp.example.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your_email@example.com
EMAIL_SERVER_PASSWORD=your_email_password
EMAIL_FROM=noreply@gurmania.gorstaci.org
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### Step 2: Create Production Environment File

```bash
cp .env.prod.example .env.prod
nano .env.prod
```

Fill in the values (use **different** passwords and secrets than dev):

```env
# PostgreSQL Configuration
POSTGRES_USER=gurmania_prod
POSTGRES_PASSWORD=your_strong_prod_password_here
POSTGRES_DB=gurmania_prod

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret_prod_here

# Email Configuration
EMAIL_SERVER_HOST=smtp.example.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your_email@example.com
EMAIL_SERVER_PASSWORD=your_email_password
EMAIL_FROM=noreply@gurmania.gorstaci.org
```

### Step 3: Secure Environment Files

```bash
chmod 600 .env.dev .env.prod
```

---

## SSL Certificate Setup

### Step 1: Initial Nginx Configuration (Without SSL)

Before obtaining SSL certificates, we need to temporarily configure Nginx for HTTP only:

```bash
sudo nano /etc/nginx/sites-available/gurmania-temp
```

Add this temporary configuration:

```nginx
server {
    listen 80;
    server_name dev.gurmania.gorstaci.org gurmania.gorstaci.org;
    
    location / {
        return 200 "OK";
        add_header Content-Type text/plain;
    }
}
```

Enable it:

```bash
sudo ln -sf /etc/nginx/sites-available/gurmania-temp /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### Step 2: Obtain SSL Certificates

```bash
sudo certbot --nginx -d gurmania.gorstaci.org -d dev.gurmania.gorstaci.org
```

Follow the prompts:
- Enter your email address
- Agree to Terms of Service
- Choose whether to redirect HTTP to HTTPS (recommended: Yes)

### Step 3: Apply Final Nginx Configuration

```bash
sudo rm /etc/nginx/sites-enabled/gurmania-temp
sudo ln -sf /etc/nginx/sites-available/gurmania /etc/nginx/sites-enabled/gurmania
sudo nginx -t
sudo systemctl reload nginx
```

### Step 4: Setup Auto-Renewal

Certbot automatically sets up renewal. Verify:

```bash
sudo certbot renew --dry-run
```

---

## Initial Deployment

### Step 1: Make Scripts Executable

```bash
cd /opt/gurmania/deployment/scripts
chmod +x *.sh
```

### Step 2: Deploy Development Environment

```bash
./deploy-dev.sh
```

This will:
- Pull latest code from `dev` branch
- Build Docker images
- Run Prisma migrations
- Start containers

**Monitor the deployment:**

```bash
# Check container status
docker ps | grep gurmania-dev

# Check logs
docker-compose -f /opt/gurmania/deployment/docker-compose.dev.yml logs -f
```

### Step 3: Verify Development Deployment

```bash
curl https://dev.gurmania.gorstaci.org
```

Or visit in your browser: https://dev.gurmania.gorstaci.org

### Step 4: Deploy Production Environment

```bash
./deploy-prod.sh
```

**Monitor the deployment:**

```bash
# Check container status
docker ps | grep gurmania-prod

# Check logs
docker-compose -f /opt/gurmania/deployment/docker-compose.prod.yml logs -f
```

### Step 5: Verify Production Deployment

```bash
curl https://gurmania.gorstaci.org
```

Or visit in your browser: https://gurmania.gorstaci.org

---

## GitHub Actions Setup

### Step 1: Generate SSH Key for GitHub Actions

On your VPS:

```bash
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions
# Press Enter to skip passphrase
cat ~/.ssh/github_actions
# Copy the PRIVATE key (entire output including BEGIN and END lines)
```

### Step 2: Add Public Key to VPS

```bash
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
```

### Step 3: Configure GitHub Repository Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

Add these secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `VPS_HOST` | Your VPS IP address | e.g., `203.0.113.45` |
| `VPS_USER` | Your SSH username | e.g., `ubuntu` or `root` |
| `VPS_SSH_KEY` | Private key content | Output from `cat ~/.ssh/github_actions` |
| `VPS_PORT` | SSH port (optional) | Default: `22` |

### Step 4: Test GitHub Actions

**For Dev Environment:**
```bash
git checkout dev
git commit --allow-empty -m "Test dev deployment"
git push origin dev
```

**For Prod Environment:**
```bash
git checkout main
git commit --allow-empty -m "Test prod deployment"
git push origin main
```

Monitor the workflow in GitHub Actions tab.

---

## Monitoring and Maintenance

### Check Application Logs

**Development:**
```bash
docker logs gurmania-app-dev -f
```

**Production:**
```bash
docker logs gurmania-app-prod -f
```

### Check Database Logs

**Development:**
```bash
docker logs gurmania-db-dev -f
```

**Production:**
```bash
docker logs gurmania-db-prod -f
```

### Check Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/dev.gurmania.access.log
sudo tail -f /var/log/nginx/prod.gurmania.access.log

# Error logs
sudo tail -f /var/log/nginx/dev.gurmania.error.log
sudo tail -f /var/log/nginx/prod.gurmania.error.log
```

### Check Container Resource Usage

```bash
docker stats
```

### Check Disk Space

```bash
df -h
du -sh /opt/gurmania/*
```

### Restart Services

**Development:**
```bash
cd /opt/gurmania/deployment
docker-compose -f docker-compose.dev.yml restart
```

**Production:**
```bash
cd /opt/gurmania/deployment
docker-compose -f docker-compose.prod.yml restart
```

### Restart Nginx

```bash
sudo systemctl restart nginx
```

---

## Troubleshooting

### Issue: Containers Won't Start

**Check logs:**
```bash
docker-compose -f docker-compose.dev.yml logs
```

**Common causes:**
- Port already in use
- Database connection issues
- Missing environment variables

**Solution:**
```bash
# Stop all containers
docker-compose -f docker-compose.dev.yml down

# Check if ports are available
sudo netstat -tulpn | grep -E '3001|3002'

# Restart
docker-compose -f docker-compose.dev.yml up -d
```

### Issue: Database Connection Failed

**Check if database container is running:**
```bash
docker ps | grep postgres
```

**Check database logs:**
```bash
docker logs gurmania-db-dev
```

**Test database connection:**
```bash
docker exec -it gurmania-db-dev psql -U gurmania_dev -d gurmania_dev
```

### Issue: Nginx Configuration Error

**Test configuration:**
```bash
sudo nginx -t
```

**Common issues:**
- SSL certificate paths incorrect
- Port conflicts
- Syntax errors

**Reload configuration:**
```bash
sudo systemctl reload nginx
```

### Issue: SSL Certificate Issues

**Check certificate status:**
```bash
sudo certbot certificates
```

**Renew certificates manually:**
```bash
sudo certbot renew
```

**Check certificate files:**
```bash
sudo ls -la /etc/letsencrypt/live/gurmania.gorstaci.org/
```

### Issue: Deployment Script Fails

**Check script permissions:**
```bash
ls -la /opt/gurmania/deployment/scripts/
chmod +x /opt/gurmania/deployment/scripts/*.sh
```

**Run script with verbose output:**
```bash
bash -x ./deploy-dev.sh
```

### Issue: Out of Disk Space

**Clean Docker resources:**
```bash
# Remove stopped containers
docker container prune -f

# Remove unused images
docker image prune -af

# Remove unused volumes
docker volume prune -f

# Remove unused networks
docker network prune -f
```

**Clean old backups:**
```bash
find /opt/gurmania/backups -name "*.sql.gz" -type f -mtime +7 -delete
```

---

## Database Management

### Manual Backup

```bash
cd /opt/gurmania/deployment/scripts
./backup-db.sh
```

Backups are stored in: `/opt/gurmania/backups/`

### Restore Database

**Development:**
```bash
# Stop the application
docker-compose -f /opt/gurmania/deployment/docker-compose.dev.yml stop app-dev

# Restore from backup
gunzip < /opt/gurmania/backups/dev_backup_YYYYMMDD_HHMMSS.sql.gz | \
  docker exec -i gurmania-db-dev psql -U gurmania_dev -d gurmania_dev

# Restart application
docker-compose -f /opt/gurmania/deployment/docker-compose.dev.yml start app-dev
```

**Production:**
```bash
# Stop the application
docker-compose -f /opt/gurmania/deployment/docker-compose.prod.yml stop app-prod

# Restore from backup
gunzip < /opt/gurmania/backups/prod_backup_YYYYMMDD_HHMMSS.sql.gz | \
  docker exec -i gurmania-db-prod psql -U gurmania_prod -d gurmania_prod

# Restart application
docker-compose -f /opt/gurmania/deployment/docker-compose.prod.yml start app-prod
```

### Access Database Console

**Development:**
```bash
docker exec -it gurmania-db-dev psql -U gurmania_dev -d gurmania_dev
```

**Production:**
```bash
docker exec -it gurmania-db-prod psql -U gurmania_prod -d gurmania_prod
```

**Useful SQL commands:**
```sql
-- List all tables
\dt

-- View table structure
\d table_name

-- View all databases
\l

-- Quit
\q
```

### Run Prisma Migrations Manually

**Development:**
```bash
docker exec -it gurmania-app-dev npx prisma migrate deploy
```

**Production:**
```bash
docker exec -it gurmania-app-prod npx prisma migrate deploy
```

### View Migration Status

```bash
docker exec -it gurmania-app-dev npx prisma migrate status
```

---

## Security Best Practices

### 1. Keep System Updated

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Configure Firewall Properly

```bash
sudo ufw status verbose
```

### 3. Use Strong Passwords

- Database passwords should be 20+ characters
- Use different passwords for dev and prod
- Store passwords securely

### 4. Secure Environment Files

```bash
chmod 600 /opt/gurmania/deployment/.env.*
```

### 5. Regular Backups

Automated daily backups are configured via cron at 2 AM.

Check cron job:
```bash
crontab -l
```

### 6. Monitor Logs Regularly

```bash
# Check failed login attempts
sudo grep "Failed password" /var/log/auth.log

# Check Nginx errors
sudo tail -100 /var/log/nginx/error.log
```

### 7. Update Docker Images

```bash
docker-compose -f docker-compose.dev.yml pull
docker-compose -f docker-compose.prod.yml pull
```

---

## Continuous Deployment Workflow

### Development Branch (`dev`)
1. Push code to `dev` branch
2. GitHub Actions triggers automatically
3. Runs deployment script on VPS
4. Pulls latest code
5. Builds Docker images
6. Runs database migrations
7. Deploys to `dev.gurmania.gorstaci.org`

### Production Branch (`main`)
1. Merge `dev` into `main` or push to `main`
2. GitHub Actions triggers automatically
3. Creates database backup first
4. Runs deployment script on VPS
5. Pulls latest code
6. Builds Docker images
7. Runs database migrations
8. Deploys to `gurmania.gorstaci.org`

---

## Quick Reference Commands

```bash
# View all running containers
docker ps

# View all containers (including stopped)
docker ps -a

# View container logs
docker logs <container_name> -f

# Restart a container
docker restart <container_name>

# Stop all containers
docker stop $(docker ps -q)

# Remove all stopped containers
docker container prune -f

# View Docker resource usage
docker stats

# Check Nginx status
sudo systemctl status nginx

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# View SSL certificates
sudo certbot certificates

# Renew SSL certificates
sudo certbot renew

# Check firewall status
sudo ufw status

# View backup files
ls -lh /opt/gurmania/backups/

# Check disk usage
df -h
```

---

## Support and Maintenance Schedule

### Daily Tasks (Automated)
- ✅ Database backups (2 AM via cron)
- ✅ Log rotation
- ✅ SSL certificate renewal check

### Weekly Tasks (Manual)
- 📊 Review application logs
- 📊 Check disk space
- 📊 Monitor resource usage

### Monthly Tasks (Manual)
- 🔄 System updates (`apt update && apt upgrade`)
- 🔄 Docker image updates
- 🔄 Review security logs
- 🔄 Test backup restoration

---

## Environment URLs

- **Development:** https://dev.gurmania.gorstaci.org
- **Production:** https://gurmania.gorstaci.org

---

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Certbot Documentation](https://certbot.eff.org/docs/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

## Contact and Support

For issues or questions, please open an issue in the GitHub repository.

---

**Last Updated:** November 2025

