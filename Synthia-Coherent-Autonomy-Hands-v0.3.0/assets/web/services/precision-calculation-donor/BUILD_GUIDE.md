# SynthAi Complete — Build & Deployment Guide

## Prerequisites

- **Node.js 20+** → Frontend & TypeScript compilation
- **.NET 6+** → C# libraries compilation
- **Python 3.9+** → Backend services & MCP server
- **Git** (optional, for version control)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                  Frontend (React + Vite)                    │
│         http://localhost:5173 (dev) / dist/ (prod)          │
└────────────────┬────────────────────────────────────────────┘
                 │ API calls via axios
                 ▼
┌─────────────────────────────────────────────────────────────┐
│           Backend API (Python FastAPI)                      │
│          http://localhost:8000 (uvicorn)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐    │
│  │ Klein Engine │  │ AutoNovel    │  │ Synthia Visual  │    │
│  │ (Narratives) │  │ (Tests/Code) │  │ (Video Gen)     │    │
│  └──────────────┘  └──────────────┘  └─────────────────┘    │
└────────────────┬────────────────────────────────────────────┘
                 │ subprocess/gRPC calls
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  C# Libraries (Chart Calculations)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐    │
│  │ HumanDesign │  │ YiJing      │  │ Core / GeneKeys  │    │
│  │ (Gates/Cen) │  │ (Hexagrams) │  │ (Orchestration)  │    │
│  └─────────────┘  └─────────────┘  └──────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                 │
                 ▼
        ┌────────────────────┐
        │   Data Files       │
        │ Metadata/Hexagrams │
        │  Keywords/CSV      │
        └────────────────────┘

        Optional: MCP Bridge ↔ Claude API
```

## Step 1: Clone/Extract Project

```bash
# If you have it as a zip
unzip SynthAi_Complete.zip
cd SynthAi_Complete

# Verify structure
ls -la
# Should show: frontend/ backend/ data/ mcp/ docs/ README.md
```

## Step 2: Frontend Setup

### Install Dependencies
```bash
cd frontend
npm install
# Installs React, Vite, Tailwind, shadcn, Klein modules, etc.
```

### Development Server
```bash
npm run dev
# Starts at http://localhost:5173
# Hot reload enabled, shows any TypeScript errors
```

### Build for Production
```bash
npm run build
# Compiles TypeScript, optimizes React, outputs to dist/
# Then: npm run preview to test prod build locally
```

### Environment Configuration
Create `frontend/.env` (optional):
```env
VITE_API_URL=http://localhost:8000
VITE_MCP_ENABLED=false
```

Then use in code:
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
```

## Step 3: Backend API Setup

### Install Python Dependencies
```bash
cd backend/python
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Run API Server
```bash
python api.py
# Starts at http://localhost:8000
# Interactive docs at http://localhost:8000/docs
```

### Test API Health
```bash
curl http://localhost:8000/health
# Should return JSON with service statuses
```

## Step 4: C# Libraries Compilation (Optional)

### Build DLLs
```bash
cd backend/csharp
dotnet build SynthAi.sln
# Produces DLLs in bin/Debug or bin/Release
```

### Verify Build
```bash
ls -la SynthAi.Core/bin/Debug/
ls -la SynthAi.HumanDesign/bin/Debug/
ls -la SynthAi.YiJing/bin/Debug/
```

## Step 5: MCP Server Setup (Optional - For Claude Integration)

### Install MCP Dependencies
```bash
cd mcp
pip install anthropic
```

### Run MCP Server
```bash
python mcp_server.py
# Connects to Claude
# Available at http://localhost:9000 (or configured port)
```

### Connect to Claude
In Claude desktop or claude.ai:
```json
{
  "mcp_servers": {
    "synthia": {
      "command": "python",
      "args": ["/path/to/SynthAi_Complete/mcp/mcp_server.py"],
      "env": {
        "SYNTHIA_API": "http://localhost:8000"
      }
    }
  }
}
```

## Step 6: Full Stack Integration Test

### Open 4 Terminal Windows

**Window 1: Frontend**
```bash
cd frontend
npm run dev
# Runs at http://localhost:5173
```

**Window 2: Backend API**
```bash
cd backend/python
source venv/bin/activate
python api.py
# Runs at http://localhost:8000
```

**Window 3: MCP (Optional)**
```bash
cd mcp
source venv/bin/activate
python mcp_server.py
```

**Window 4: Monitoring**
```bash
# Watch logs, run tests, etc.
cd frontend
npm run lint
npm run type-check
```

### Test in Browser
1. Navigate to `http://localhost:5173`
2. Enter birth date/time/location
3. Click "Calculate Chart"
4. Verify API calls in Network tab (chrome dev tools)
5. View resonance field visualization

## Production Deployment

### Docker (Recommended)

#### Build Docker Images
```bash
# API
cd backend/python
docker build -t synthia-api:latest .
docker run -p 8000:8000 synthia-api:latest

# Frontend
cd frontend
docker build -t synthia-ui:latest .
docker run -p 5173:5173 synthia-ui:latest
```

#### Docker Compose (All at Once)
```bash
# In project root
docker-compose up -d
# Starts frontend on 5173, api on 8000, mcp on 9000
```

### Cloud Deployment

#### Vercel (Frontend)
```bash
npm install -g vercel
cd frontend
vercel --prod
# Follow prompts, set VITE_API_URL to production backend
```

#### Heroku (Backend API)
```bash
heroku create synthia-api
heroku config:set FLASK_ENV=production
git push heroku main
# Sets CORS to allow your Vercel domain
```

#### AWS (Full Stack)
- Use Lambda + API Gateway for backend
- CloudFront + S3 for frontend
- See AWS CDK examples in `docs/`

## Troubleshooting

### "Cannot find module 'react'"
```bash
cd frontend
rm -rf node_modules
npm install
npm run dev
```

### "API connection refused"
```bash
# Check backend is running
curl http://localhost:8000/health

# If not running:
cd backend/python
python api.py
```

### "CORS errors in browser"
- Backend CORS settings in `api.py` line ~20
- Add your frontend URL to `allow_origins`
- Restart API: `python api.py`

### "Tests won't execute"
- Verify Python 3.9+: `python --version`
- Ensure test sandbox is available
- Check filesystem permissions

### "Chart calculation returns null"
- Verify data files exist: `ls data/metadata/`
- Ensure ephemeris data is loaded
- Check birth coordinates are correct

## Configuration Files

### Vite (Frontend Build)
Edit `frontend/vite.config.ts`:
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000'  // Proxy API calls
    }
  }
})
```

### FastAPI (Backend)
Edit `backend/python/api.py`:
```python
# Line ~20: CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://yourdomain.com"],
)
```

### Environment Variables
```bash
# backend/python/.env
PYTHONUNBUFFERED=1
API_PORT=8000
KLEIN_MODEL_PATH=./models/klein.pkl
SYNTHIA_CACHE=./cache/synthia
```

## Performance Tips

### Frontend
- Use `npm run build` for production (not `npm run dev`)
- Enable caching in CDN
- Code split routes with React.lazy()
- Monitor bundle size: `npm run build -- --analyze`

### Backend
- Use uvicorn workers: `gunicorn api:app -w 4 -k uvicorn.workers.UvicornWorker`
- Cache chart calculations (same birthdate = same chart)
- Limit Klein narrative max_length to conserve compute
- Consider async video generation for Synthia

### C# Libraries
- Compile to Release mode: `dotnet build -c Release`
- Use NativeAOT for deployment
- Cache ephemeris data in memory

## Monitoring

### Frontend (Browser DevTools)
- Network tab: Monitor API calls
- Console: Check for JS errors
- Performance: React Profiler for component renders

### Backend (Terminal)
- Uvicorn logs show request/response times
- Use `strace` to monitor system calls
- Monitor memory: `top`, `ps aux | grep python`

### MCP Server
- Enable debug logging: `export MCP_DEBUG=1`
- Monitor Claude API usage
- Check token consumption

## Testing

### Frontend Tests
```bash
cd frontend
npm test
# If no test files, add them to src/__tests__/
```

### Backend Tests
```bash
cd backend/python
python -m pytest
# Or: python -m unittest discover
```

### Integration Tests
```bash
# Start all services (see Step 6)
# Then run:
cd tests
python test_full_stack.py
```

## Maintenance

### Update Dependencies
```bash
# Frontend
cd frontend
npm update
npm audit fix

# Backend
cd backend/python
pip list --outdated
pip install --upgrade <package-name>

# C#
cd backend/csharp
dotnet list package --outdated
```

### Backup Data
```bash
# Save state periodically
curl -X POST http://localhost:8000/api/state/save \
  -H "Content-Type: application/json" \
  -d '{"data": "..."}' > state_backup.json
```

### Monitoring Production
- Set up error tracking (Sentry, etc.)
- Monitor API latency
- Track Klein narrative accuracy
- Log AutoNovel test success rates

## Support

- Check `README.md` for feature overview
- Review `docs/` for architecture details
- Search issues in code comments
- Contact: [your contact info]

---

**Last Updated**: 2024
**Version**: 1.0.0
