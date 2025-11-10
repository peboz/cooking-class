#!/bin/bash
set -e

echo "🚀 Starting deployment for DEV environment..."

# Navigate to deployment directory
cd /opt/gurmania/deployment

# Load environment variables
export $(cat .env.dev | grep -v '^#' | xargs)

# Pull latest changes
echo "📦 Pulling latest code from dev branch..."
cd /opt/gurmania
git fetch origin
git checkout dev
git pull origin dev

# Build and deploy with docker-compose
echo "🐳 Building and deploying Docker containers..."
cd /opt/gurmania/deployment
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml build --no-cache
docker-compose -f docker-compose.dev.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if containers are running
if docker ps | grep -q "gurmania-app-dev"; then
    echo "✅ DEV deployment successful!"
    echo "📊 Container status:"
    docker ps --filter "name=gurmania" || true
else
    echo "❌ DEV deployment failed!"
    docker-compose -f docker-compose.dev.yml logs
    exit 1
fi

# Cleanup old images
echo "🧹 Cleaning up old Docker images..."
docker image prune -f

echo "✨ DEV deployment completed successfully!"

exit 0

