#!/bin/bash

# SynthAi Complete - Quick Start Script
# Launches frontend, backend API, and optional MCP server

set -e  # Exit on error

echo "🚀 SynthAi Complete Startup"
echo "============================"

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 20+"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.9+"
    exit 1
fi
echo -e "${GREEN}✓ Python $(python3 --version)${NC}"

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Kill background processes on exit
cleanup() {
    echo -e "${YELLOW}Shutting down services...${NC}"
    jobs -p | xargs -r kill 2>/dev/null || true
    echo "✓ Services stopped"
}
trap cleanup EXIT

# Start Backend API
echo -e "\n${BLUE}Starting Backend API...${NC}"
cd "$SCRIPT_DIR/backend/python"

if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -q -r requirements.txt

python api.py &
API_PID=$!
echo -e "${GREEN}✓ API started (PID: $API_PID)${NC}"

# Wait for API to be ready
echo "Waiting for API to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:8000/health > /dev/null; then
        echo -e "${GREEN}✓ API is ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${YELLOW}⚠ API not responding, continuing anyway...${NC}"
    fi
    sleep 1
done

# Start Frontend
echo -e "\n${BLUE}Starting Frontend...${NC}"
cd "$SCRIPT_DIR/frontend"

if [ ! -d "node_modules" ]; then
    echo "Installing Node dependencies..."
    npm install -q
fi

npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"

# Optional: Start MCP Server
echo -e "\n${BLUE}MCP Server (optional)${NC}"
read -p "Start MCP server for Claude integration? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd "$SCRIPT_DIR/mcp"
    
    if [ ! -d "venv" ]; then
        python3 -m venv venv
    fi
    
    source venv/bin/activate
    pip install -q anthropic
    
    python mcp_server.py &
    MCP_PID=$!
    echo -e "${GREEN}✓ MCP Server started (PID: $MCP_PID)${NC}"
fi

# Summary
echo -e "\n${GREEN}================================${NC}"
echo -e "${GREEN}SynthAi Complete is running!${NC}"
echo -e "${GREEN}================================${NC}"
echo -e "\n${BLUE}Services:${NC}"
echo -e "  Frontend:  ${GREEN}http://localhost:5173${NC}"
echo -e "  API:       ${GREEN}http://localhost:8000${NC}"
echo -e "  API Docs:  ${GREEN}http://localhost:8000/docs${NC}"
if [ ! -z "$MCP_PID" ]; then
    echo -e "  MCP:       ${GREEN}Ready for Claude${NC}"
fi

echo -e "\n${BLUE}Next steps:${NC}"
echo "  1. Open http://localhost:5173 in your browser"
echo "  2. Enter your birth date, time, and location"
echo "  3. Click 'Calculate Chart' to begin"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

# Keep script running
wait
