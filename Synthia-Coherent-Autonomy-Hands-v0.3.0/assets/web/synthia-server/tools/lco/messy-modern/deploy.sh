#!/bin/bash
# MESSY Modern Deployment Script
# Usage: ./deploy.sh [environment]

set -e

ENV=${1:-production}

echo "🚀 Deploying MESSY Modern to $ENV..."

# Pull latest
docker-compose pull

# Start services
docker-compose up -d

# Wait for healthcheck
echo "⏳ Waiting for healthcheck..."
sleep 10

# Verify
docker-compose ps

echo "✅ Deployment complete!"
echo ""
echo "Access:"
echo "  Frontend: http://localhost"
echo "  API:      http://localhost/api"
echo "  WebSocket: ws://localhost/ws"
echo ""
echo "Logs:"
echo "  docker-compose logs -f messy-core"
