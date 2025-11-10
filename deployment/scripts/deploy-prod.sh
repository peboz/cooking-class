#!/bin/bash
set -e

echo "🚀 Starting deployment for PRODUCTION environment..."

# Navigate to deployment directory
cd /opt/gurmania/deployment

# Load environment variables
export $(cat .env.prod | grep -v '^#' | xargs)

# Pull latest changes
echo "📦 Pulling latest code from main branch..."
cd /opt/gurmania
git fetch origin
git checkout main
git pull origin main

# Build and deploy with docker-compose
echo "🐳 Building and deploying Docker containers..."
cd /opt/gurmania/deployment
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if containers are running
if docker ps | grep -q "gurmania-app-prod"; then
    echo "✅ PRODUCTION deployment successful!"
    echo "📊 Container status:"
    docker ps --filter "name=gurmania" || true
else
    echo "❌ PRODUCTION deployment failed!"
    docker-compose -f docker-compose.prod.yml logs
    exit 1
fi

# Cleanup old images
echo "🧹 Cleaning up old Docker images..."
docker image prune -f

echo "✨ PRODUCTION deployment completed successfully!"

exit 0

