# SynthAi Complete: Astrology + Klein Narrative Engine

A unified system that combines:
- **Human Design astrology** (gates, centers, channels, incarnation crosses)
- **Yi Jing divination** (hexagrams, trigrams, King Wen sequence)
- **Klein's semantic narrative engine** (generates personalized advice)
- **AutoNovel meta-compiler** (generates code, tests, reports)
- **Synthia visual engine** (video/visual generation based on your chart)
- **MCP bridge** (chat with Claude about your chart, get personalized guidance)

## What You Can Do

1. **Calculate your chart** (Tropical, Sidereal, Draconic positions)
2. **Get personalized narrative advice** from Klein based on your specific chart
3. **Generate & run experiments** with scientific reporting
4. **Ask Klein questions** about your chart via Claude/MCP
5. **Generate tests and code** via AutoNovel
6. **View visual representations** of your chart via Synthia
7. **Save/load your state** and continue where you left off

## Quick Start

### Prerequisites
- **Node.js 20+** (for frontend)
- **.NET 6+** (for C# backend)
- **Python 3.9+** (for Python tools & MCP)

### 1. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

### 2. Backend API (Python)

```bash
cd backend/python
pip install -r requirements.txt
python api.py
# API runs at http://localhost:8000
# Docs at http://localhost:8000/docs
```

### 3. C# Libraries (Compilation)

```bash
cd backend/csharp
dotnet build SynthAi.sln
# Produces DLLs for chart calculation
```

### 4. MCP Server (Optional - For Claude Integration)

```bash
cd mcp
python mcp_server.py
# Connects Claude to your chart data and Klein engine
```

## Project Structure

```
SynthAi_Complete/
├── frontend/                    # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/          # UI components
│   │   ├── engine/              # CodonMatrix, CHNOPS, Resonance
│   │   ├── klein/               # Klein narrative engine (TypeScript)
│   │   ├── synthia/             # Visual generation
│   │   └── services/            # API integration
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── csharp/                  # .NET libraries
│   │   ├── SynthAi.Core/
│   │   ├── SynthAi.YiJing/
│   │   ├── SynthAi.HumanDesign/
│   │   └── SynthAi.GeneKeys/
│   └── python/
│       ├── api.py               # FastAPI backend
│       ├── klein_engine.py      # Klein narrative engine
│       ├── magic_squares_astrology.py
│       ├── klein_mesh.py
│       └── requirements.txt
│
├── mcp/
│   └── mcp_server.py            # MCP bridge to Claude
│
├── data/
│   ├── metadata/                # Gates.csv, Lines.csv, KingWen.csv
│   ├── hexagrams/               # Yi Jing data
│   └── keywords/                # Semantic data
│
└── docs/
    ├── Klein_2024_Neural_RAG_Architecture.md
    └── SHELDON_KLEIN_INTEGRATION.md
```

## How the Pieces Work Together

### Chart Calculation Flow
1. **Frontend**: User enters birth date/time/location
2. **Backend (C#)**: Calculates positions, gates, centers
3. **Python API**: Exposes data via REST
4. **Frontend**: Displays Resonance Field, CHNOPS vectors

### Klein Narrative Generation
1. **User asks question** (via UI or Claude MCP)
2. **Frontend/MCP calls Backend API**: `/api/klein/insight`
3. **Python backend instantiates KleinNarrativeEngine**
4. **Klein's semantic network queries chart data**
5. **Returns personalized narrative/advice**

### Test Generation & Execution
1. **User or system requests test** via `/api/autonovel/generate-test`
2. **AutoNovel meta-compiler writes test code** (Python/JS)
3. **Test is sandboxed and executed** via `/api/autonovel/execute-test`
4. **Results reported back** with pass/fail status

### Visual Generation (Synthia)
1. **Klein decides to generate visual** (mood-based)
2. **Calls `/api/synthia/generate-visual`**
3. **Synthia prepares video diffusion prompt**
4. **Frontend renders video/animation**

### MCP Integration
1. **Claude asks a question** via MCP tools
2. **MCP server calls Python backend API**
3. **Chart data + Klein narrative returned to Claude**
4. **Claude synthesizes response for user**

## API Endpoints

### Chart Calculations
- `POST /api/chart/calculate` - Full chart (tropical, sidereal, draconic)
- `POST /api/chart/chnops` - Biochemical resonance vectors

### Klein Narrative
- `POST /api/klein/narrative` - Generate narrative/advice
- `POST /api/klein/insight` - Answer specific question

### AutoNovel (Code/Tests/Reports)
- `POST /api/autonovel/generate-test` - Generate test code
- `POST /api/autonovel/generate-report` - Generate markdown report
- `POST /api/autonovel/execute-test` - Run test and get results

### Synthia Visual
- `POST /api/synthia/generate-visual` - Generate video/visual

### State
- `POST /api/state/save` - Save full state
- `GET /api/state/load/{session_id}` - Load saved state

## Key Features Explained

### 1. Resonance Field (Frontend)
Visualizes your astrological chart with:
- Tropical/Sidereal/Draconic positions
- Human Design gates and centers
- Incarnation cross type
- Mandala geometry

### 2. CHNOPS Biochemical Computation
Maps your 64 Human Design gates to 20 amino acids with exact chemical formulas:
- Carbon (C), Hydrogen (H), Nitrogen (N), Oxygen (O), Phosphorus (P), Sulfur (S)
- Cosine similarity for resonance detection
- Purpose vector alignment

### 3. Klein's Semantic Network
Deep semantic understanding of your chart:
- Objects & Relations → semantic triples
- Hierarchical knowledge graph
- RAG-backed narrative generation
- Stochastic simulation with controllable randomness

### 4. AutoNovel Meta-Compiler
Generates:
- Python/JavaScript test code
- Markdown reports
- Executable tests with result reporting
- Self-improving rules (can learn patterns)

### 5. Synthia Life Engine
Translates your chart into visual/video:
- Design-to-world mapping
- Video diffusion generation
- Episode-based narratives
- Real-time rendering

## Configuration

### Frontend
Edit `frontend/vite.config.ts` to:
- Change API URL (default: `http://localhost:8000`)
- Configure build output
- Adjust dev server port

### Backend API
Set environment variables in `.env`:
```
CHART_SERVICE_URL=http://localhost:5000  # C# service
KLEIN_MODEL_PATH=./models/klein.pkl
SYNTHIA_CACHE=./cache/synthia
```

### MCP Server
Configure `mcp/mcp_server.py`:
```python
server = SynthAiMCPServer(api_url="http://localhost:8000")
```

## Development

### Adding a New Feature

1. **Frontend**: Create React component in `frontend/src/components/`
2. **Backend**: Add endpoint in `backend/python/api.py`
3. **Service**: Wire it in `frontend/src/services/`
4. **MCP**: Add tool definition to `mcp/mcp_server.py` if user-facing

### Building for Production

```bash
# Frontend
cd frontend
npm run build
# Output: dist/

# Backend (Docker recommended)
cd backend/python
docker build -t synthia-api .
docker run -p 8000:8000 synthia-api

# C# (if needed as separate service)
cd backend/csharp
dotnet publish -c Release
```

## Troubleshooting

**Frontend can't reach API:**
- Check `http://localhost:8000/health` is responding
- Verify CORS is enabled (default includes localhost)
- Check firewall

**Tests don't execute:**
- Ensure sandbox environment is available
- Check Python version is 3.9+
- Review test output in console

**Chart calculations wrong:**
- Verify ephemeris data is loaded (check `data/metadata/`)
- Confirm birth coordinates are correct (latitude/longitude)
- Check timezone offset

## Roadmap

- [ ] APK/Mobile build (React Native wrapper)
- [ ] Cloud deployment (Docker Compose)
- [ ] Advanced Klein training (custom models)
- [ ] Real video generation (instead of prompts)
- [ ] Multi-user support
- [ ] Persistent knowledge base (PDF ingestion)

## Credits

- **Klein (1973)**: Sheldon Klein's semantic narrative generation system
- **Human Design**: Ra Uru Hu
- **Yi Jing**: Ancient Chinese divination
- **CHNOPS**: Biochemical mapping framework
- **Synthia**: Visual generation engine
- **Your Code**: Everything custom and original

## License

This project is for personal use. All original components are yours.

## Support

Issues or questions? Check:
1. API health: `GET http://localhost:8000/health`
2. Frontend console (browser dev tools)
3. Python backend logs
4. MCP server logs (if using Claude)

---

**Built with care. Made for you.**
