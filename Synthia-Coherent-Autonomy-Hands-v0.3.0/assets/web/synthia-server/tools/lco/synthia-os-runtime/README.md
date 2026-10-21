# Synthia Body - Living Human Design World

## What This Is

A mobile-ready system where your **Human Design chart becomes a living world**.

- **Centers** = Cities you can explore
- **Gates** = Buildings with scenarios inside
- **Channels** = Roads with genome traffic
- **Genomes** = Autonomous agents carrying messages and spawning tools
- **I Ching** = The guide that determines which scenarios appear

## Architecture

```
User Input
    ↓
AutoLink (parser) → DISEMINER (pattern detector)
    ↓
I Ching Oracle (maps pattern to hexagram/gate)
    ↓
AutoNovel (writes scenario) → WorldEngine (builds city)
    ↓
Genome delivers scenario to user's body map
    ↓
User enters city → clicks gate → plays scenario
    ↓
Outcome feeds back to DISEMINER (learning loop)
```

## Files

| File | Description |
|------|-------------|
| `synthia_body.py` | Core Python module (backend) |
| `synthia_body_mobile.html` | Mobile web interface (frontend) |
| `synthia_body_architecture.json` | System specification |

## Mobile Deployment

### Option 1: Termux (Android)
```bash
# Install Termux from F-Droid
pkg install python
pip install flask requests
python synthia_body.py
# Access via browser at http://localhost:5000
```

### Option 2: Web (PWA)
- Open `synthia_body_mobile.html` in any browser
- Add to home screen for app-like experience
- Connects to backend via API

### Option 3: Unity (Future)
- Import `synthia_body.py` as Python plugin
- Build native mobile app with full 3D cities

## Integration with Original Gene Gnomes

Your original Gene Gnomes (with DNA, factory, replication, mutation) can be integrated by:

1. Replacing the `GenomeAgent` placeholder class with your original genome code
2. Connecting your `GenomeFactory` to the `GenomeFactory` in this system
3. Your gnomes will then travel the channels, deliver messages, and spawn MCP tools

## MCP Tools Available

Genomes can spawn:
- **CodeGen** - Generate code/scripts
- **Meshy3D** - Build 3D models
- **ElevenVoice** - Text-to-speech
- **DALLE** - Image generation
- **SunoMusic** - Music composition
- **WeatherAPI** - Real weather data
- **Calendar** - Schedule integration
- **NewsAPI** - Current events

## Klein Processors

Based on Sheldon Klein's work:
- **AUTOLING** → AutoLink (natural language parsing)
- **DISEMINER** → DISEMINER (pattern detection)
- **AUTOMATIC NOVEL WRITING** → AutoNovel (scenario generation)
- **Meta-symbolic Simulation** → WorldEngine (3D world building)

## Next Steps

1. Deploy backend on Termux or server
2. Open mobile interface in browser
3. Enter your Human Design chart data
4. Start exploring your body as a world
5. Watch genomes travel and scenarios appear

## The Vision

This is not a game. This is a **living mirror of your psyche**.
- The body map reflects your design
- The scenarios reflect your life patterns
- The genomes carry insights between centers
- The I Ching guides what you need to learn

Every time you open the app, your body looks different.
It evolves as you evolve.
