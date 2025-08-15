#!/bin/bash

# Deployment script for Job Application Tracker
set -e

echo "🚀 Starting deployment..."

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ Error: .env.production file not found!"
    echo "Please copy env.production.example to .env.production and configure your environment variables."
    exit 1
fi

# Build the application
echo "📦 Building application..."
docker-compose -f docker-compose.prod.yml build

# Start the services
echo "🚀 Starting services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check health
echo "🏥 Checking application health..."
curl -f http://localhost:3000/health || {
    echo "❌ Application health check failed!"
    echo "Check logs with: docker-compose -f docker-compose.prod.yml logs"
    exit 1
}

echo "✅ Deployment completed successfully!"
echo "🌐 Application is running at: http://localhost:3000"
echo "📊 Temporal UI is available at: http://localhost:7233"
