#!/bin/bash
set -e

# Configuration
BACKUP_DIR="/opt/gurmania/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo "🗄️  Starting database backups..."

# Backup DEV database
echo "Backing up DEV database..."
docker exec gurmania-db-dev pg_dump -U gurmania_dev gurmania_dev | gzip > $BACKUP_DIR/dev_backup_$DATE.sql.gz

# Backup PROD database
echo "Backing up PROD database..."
docker exec gurmania-db-prod pg_dump -U gurmania_prod gurmania_prod | gzip > $BACKUP_DIR/prod_backup_$DATE.sql.gz

# Keep only last 7 days of backups
echo "🧹 Cleaning up old backups (keeping last 7 days)..."
find $BACKUP_DIR -name "*.sql.gz" -type f -mtime +7 -delete

echo "✅ Database backups completed successfully!"
echo "📁 Backups saved to: $BACKUP_DIR"
ls -lh $BACKUP_DIR/*$DATE*

