# Gurmania Deployment Configuration

This directory contains all the necessary configuration files and scripts for deploying the Gurmania application to a VPS.

## 📁 Directory Structure

```
deployment/
├── README.md                       # This file
├── DEPLOYMENT_GUIDE.md            # Comprehensive deployment guide
├── QUICK_START.md                 # Quick start guide
├── docker-compose.dev.yml         # Docker Compose for dev environment
├── docker-compose.prod.yml        # Docker Compose for prod environment
├── .env.dev.example               # Example env file for dev
├── .env.prod.example              # Example env file for prod
├── nginx/
│   └── gurmania.conf              # Nginx configuration for both environments
└── scripts/
    ├── setup-vps.sh               # Initial VPS setup script
    ├── deploy-dev.sh              # Development deployment script
    ├── deploy-prod.sh             # Production deployment script
    └── backup-db.sh               # Database backup script
```

## 🚀 Getting Started

### For First-Time Setup
Follow the [QUICK_START.md](./QUICK_START.md) guide for rapid deployment (≈35 minutes).

### For Detailed Information
See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for comprehensive documentation.

## 🏗️ Architecture

**Two isolated environments:**
- **Development:** `dev.gurmania.gorstaci.org` (Port 3001)
- **Production:** `gurmania.gorstaci.org` (Port 3002)

Each environment has:
- Separate Docker containers
- Separate PostgreSQL databases
- Separate environment variables
- Automatic deployments via GitHub Actions

## 🔑 Key Features

- ✅ **Docker-based deployment** for isolation and reproducibility
- ✅ **Automated deployments** via GitHub Actions
- ✅ **Separate environments** (dev and prod)
- ✅ **Automatic database migrations** via Prisma
- ✅ **SSL/TLS certificates** via Let's Encrypt
- ✅ **Nginx reverse proxy** with security headers
- ✅ **Automated daily backups** at 2 AM
- ✅ **Health checks** after deployment
- ✅ **Zero-downtime deployments**

## 🎯 Quick Commands

### Deploy Development
```bash
cd /opt/gurmania/deployment/scripts
./deploy-dev.sh
```

### Deploy Production
```bash
cd /opt/gurmania/deployment/scripts
./deploy-prod.sh
```

### Backup Databases
```bash
cd /opt/gurmania/deployment/scripts
./backup-db.sh
```

### View Logs
```bash
# Application logs
docker logs gurmania-app-dev -f
docker logs gurmania-app-prod -f

# Database logs
docker logs gurmania-db-dev -f
docker logs gurmania-db-prod -f

# Nginx logs
sudo tail -f /var/log/nginx/dev.gurmania.error.log
sudo tail -f /var/log/nginx/prod.gurmania.error.log
```

## 📊 Monitoring

### Check Container Status
```bash
docker ps | grep gurmania
```

### Check Resource Usage
```bash
docker stats
```

### Check Disk Space
```bash
df -h
du -sh /opt/gurmania/*
```

## 🔒 Security

- Firewall configured (UFW) - only ports 22, 80, 443 open
- SSL/TLS encryption via Let's Encrypt
- Security headers configured in Nginx
- Separate databases for dev and prod
- Environment variables secured (chmod 600)
- Regular automated backups

## 🔄 CI/CD Workflow

1. Push to `dev` or `main` branch
2. GitHub Actions CI runs (lint + build)
3. If CI passes, CD runs automatically
4. For production: backup database first
5. Deploy script executes on VPS
6. Prisma migrations run automatically
7. Docker containers restart
8. Health check verifies deployment

## 📝 Environment Variables

Create `.env.dev` and `.env.prod` from the example files:

```bash
cd /opt/gurmania/deployment
cp .env.dev.example .env.dev
cp .env.prod.example .env.prod
nano .env.dev    # Fill in actual values
nano .env.prod   # Fill in actual values
chmod 600 .env.*
```

**Required variables:**
- `POSTGRES_USER` - Database username
- `POSTGRES_PASSWORD` - Database password
- `POSTGRES_DB` - Database name
- `NEXTAUTH_SECRET` - NextAuth secret (generate with `openssl rand -base64 32`)
- Email configuration (SMTP details)

## 🛠️ Troubleshooting

### Containers won't start
```bash
docker-compose -f docker-compose.dev.yml logs
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d
```

### Database issues
```bash
docker exec -it gurmania-db-dev psql -U gurmania_dev -d gurmania_dev
```

### Nginx issues
```bash
sudo nginx -t
sudo systemctl status nginx
sudo systemctl reload nginx
```

### SSL certificate issues
```bash
sudo certbot certificates
sudo certbot renew
```

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed troubleshooting.

## 📚 Documentation

- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Comprehensive guide with all details
- [QUICK_START.md](./QUICK_START.md) - Quick deployment guide (≈35 minutes)

## 🔗 URLs

- Development: https://dev.gurmania.gorstaci.org
- Production: https://gurmania.gorstaci.org

## 📞 Support

For issues or questions, please open an issue in the GitHub repository.

---

**Last Updated:** November 2025

