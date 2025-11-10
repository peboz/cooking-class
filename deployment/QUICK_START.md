# Quick Start Deployment Guide

This is a condensed version for rapid deployment. For detailed explanations, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).

## Prerequisites
- Ubuntu 24.04 VPS
- DNS A records pointing to your VPS:
  - `dev.gurmania.gorstaci.org` → VPS IP
  - `gurmania.gorstaci.org` → VPS IP

---

## Step 1: Initial VPS Setup (10 minutes)

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Download or create the setup script
# Copy content from deployment/scripts/setup-vps.sh

# Run setup
chmod +x setup-vps.sh
./setup-vps.sh

# Log out and back in
exit
ssh your-username@your-vps-ip
```

---

## Step 2: Configure Environment Variables (5 minutes)

```bash
cd /opt/gurmania/deployment

# Development
cp .env.dev.example .env.dev
nano .env.dev
# Fill in all values, generate NEXTAUTH_SECRET with: openssl rand -base64 32

# Production
cp .env.prod.example .env.prod
nano .env.prod
# Fill in all values (use DIFFERENT passwords and secrets!)

# Secure the files
chmod 600 .env.dev .env.prod
```

---

## Step 3: SSL Certificates (5 minutes)

```bash
# Create temporary Nginx config for certificate validation
sudo tee /etc/nginx/sites-available/gurmania-temp > /dev/null <<'EOF'
server {
    listen 80;
    server_name dev.gurmania.gorstaci.org gurmania.gorstaci.org;
    location / {
        return 200 "OK";
        add_header Content-Type text/plain;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/gurmania-temp /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# Obtain SSL certificates
sudo certbot --nginx -d gurmania.gorstaci.org -d dev.gurmania.gorstaci.org

# Apply final Nginx configuration
sudo rm /etc/nginx/sites-enabled/gurmania-temp
sudo ln -sf /etc/nginx/sites-available/gurmania /etc/nginx/sites-enabled/gurmania
sudo nginx -t && sudo systemctl reload nginx
```

---

## Step 4: Deploy Applications (10 minutes)

```bash
cd /opt/gurmania/deployment/scripts

# Deploy development
./deploy-dev.sh

# Wait for dev to complete, then deploy production
./deploy-prod.sh
```

**Verify deployments:**
```bash
curl https://dev.gurmania.gorstaci.org
curl https://gurmania.gorstaci.org
```

---

## Step 5: Setup GitHub Actions (5 minutes)

### On your VPS:

```bash
# Generate SSH key for GitHub Actions
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/github_actions  # Copy this PRIVATE key
```

### On GitHub:

1. Go to repository → Settings → Secrets and variables → Actions
2. Add these secrets:
   - `VPS_HOST`: Your VPS IP address
   - `VPS_USER`: Your SSH username (e.g., `ubuntu`)
   - `VPS_SSH_KEY`: The PRIVATE key from above
   - `VPS_PORT`: `22` (optional, if using default)

### Test deployments:

```bash
# Test dev deployment
git checkout dev
git commit --allow-empty -m "Test deployment"
git push origin dev

# Test prod deployment
git checkout main
git commit --allow-empty -m "Test deployment"
git push origin main
```

---

## Verification Checklist

- [ ] VPS setup completed
- [ ] Environment files configured (.env.dev and .env.prod)
- [ ] SSL certificates obtained and working
- [ ] Dev environment accessible at https://dev.gurmania.gorstaci.org
- [ ] Prod environment accessible at https://gurmania.gorstaci.org
- [ ] GitHub Actions secrets configured
- [ ] Automatic deployments working

---

## Common Commands

```bash
# View logs
docker logs gurmania-app-dev -f
docker logs gurmania-app-prod -f

# Restart services
cd /opt/gurmania/deployment
docker-compose -f docker-compose.dev.yml restart
docker-compose -f docker-compose.prod.yml restart

# Manual backup
cd /opt/gurmania/deployment/scripts
./backup-db.sh

# View backups
ls -lh /opt/gurmania/backups/

# Check container status
docker ps | grep gurmania

# View Nginx logs
sudo tail -f /var/log/nginx/dev.gurmania.error.log
sudo tail -f /var/log/nginx/prod.gurmania.error.log
```

---

## Troubleshooting

### Containers won't start
```bash
docker-compose -f docker-compose.dev.yml logs
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d
```

### Database connection failed
```bash
docker exec -it gurmania-db-dev psql -U gurmania_dev -d gurmania_dev
```

### SSL certificate issues
```bash
sudo certbot renew
sudo nginx -t
sudo systemctl reload nginx
```

---

## What Happens on Each Deployment

1. 🔄 Pull latest code from Git
2. 🐳 Build Docker images
3. 🗄️ Run Prisma migrations
4. 🚀 Start/restart containers
5. ✅ Health check

**Deployment trigger:**
- `dev` branch → deploys to dev.gurmania.gorstaci.org
- `main` branch → deploys to gurmania.gorstaci.org

---

## Next Steps

- Review [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed information
- Set up monitoring (optional)
- Configure email notifications (optional)
- Review security settings

---

**Total Setup Time: ~35 minutes**

For detailed explanations and advanced topics, see the full [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).

