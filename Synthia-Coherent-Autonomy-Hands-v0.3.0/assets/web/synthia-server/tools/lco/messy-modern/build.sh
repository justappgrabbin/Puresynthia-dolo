#!/bin/bash
# MESSY Modern Build Script
# Usage: ./build.sh [tag]

set -e

TAG=${1:-latest}
IMAGE_NAME="messy-modern"

echo "🔧 Building MESSY Modern v1.1..."
echo "   Tag: $TAG"

# Build Docker image
docker build -t $IMAGE_NAME:$TAG .

# Tag latest
docker tag $IMAGE_NAME:$TAG $IMAGE_NAME:latest

echo "✅ Build complete: $IMAGE_NAME:$TAG"
echo ""
echo "Run with:"
echo "  docker-compose up -d"
echo ""
echo "Or standalone:"
echo "  docker run -p 8000:8000 $IMAGE_NAME:$TAG"
