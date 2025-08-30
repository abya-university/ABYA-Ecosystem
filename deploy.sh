#!/bin/bash

# ABYA Ecosystem Digital Ocean Deployment Script
# Usage: ./deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}
DOMAIN="passport.abyauniversity.com"

echo "🚀 Starting ABYA Ecosystem deployment..."
echo "Environment: $ENVIRONMENT"
echo "Domain: $DOMAIN"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if environment file exists
if [ ! -f ".env" ]; then
    if [ -f ".env.production.template" ]; then
        echo "📋 Copying environment template..."
        cp .env.production.template .env
        echo "⚠️  Please edit .env file with your actual configuration values"
        echo "   - VITE_APP_PINATA_API_KEY"
        echo "   - VITE_APP_PINATA_SECRET_KEY"
        echo "   - Contract addresses (if different)"
        read -p "Press Enter after updating .env file..."
    else
        echo "❌ No .env file found and no template available"
        exit 1
    fi
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p certs
mkdir -p data/redis

# Pull latest images
echo "📥 Pulling latest Docker images..."
docker-compose pull

# Build and start services
echo "🔨 Building and starting services..."
docker-compose down --remove-orphans
docker-compose up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check service health
echo "🔍 Checking service health..."
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ Application is healthy!"
else
    echo "❌ Application health check failed"
    echo "📋 Service status:"
    docker-compose ps
    echo "📋 Recent logs:"
    docker-compose logs --tail=20
    exit 1
fi

# Display service status
echo "📋 Service Status:"
docker-compose ps

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📍 Your application should be accessible at:"
echo "   http://localhost (local)"
echo "   https://$DOMAIN (public - after DNS propagation)"
echo ""
echo "🔧 Useful commands:"
echo "   View logs: docker-compose logs -f"
echo "   Stop services: docker-compose down"
echo "   Update: git pull && ./deploy.sh"
echo ""
echo "📚 For detailed deployment guide, see: docs/DIGITAL_OCEAN_DEPLOYMENT.md"