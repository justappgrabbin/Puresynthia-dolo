# Synthia OS - Minimum Runtime Merge

## What You Need

1. **Node.js** (v14+) installed
2. All files in the same directory
3. Run: `node runtime_entry.js`

## Files You Need (Minimum)

Core (required):
- `runtime_entry.js` - The entry point
- `layer1_ato_core.js` - Math operators
- `layer2_feature_space.js` - Hexagram data
- `layer3_generative_mesh.js` - Concept mesh

Tools (required):
- `layer4_autolink.js` - Language parser
- `layer4_diseminer.js` - Pattern detector
- `layer4_autonovel.js` - Narrative generator
- `layer4_worldengine.js` - World builder

State (required):
- `layer5_ssm.js` - Temporal memory
- `phase_space_engine.js` - 5-stage pipeline
- `layer7_lcm.js` - Orchestrator

Substrate (required):
- `rich_state_engine.js` - Multi-component state
- `edge_function_engine.js` - Edge computation
- `semantic_triple_engine.js` - Executable triples
- `coordinate_engine.js` - 13-layer coordinates
- `tool_runtime_engine.js` - Tool pipeline

## Quick Start

```bash
# 1. Install Node.js (if not already installed)
#    pkg install nodejs  (on Termux)
#    or download from nodejs.org

# 2. Run the system
node runtime_entry.js

# 3. The system will auto-start and run a demo
```

## Usage

```javascript
const Synthia = require('./runtime_entry.js');

// Start the system
Synthia.start();

// Process input
const result = Synthia.process('I want to build a game');
console.log(result);

// Query the network
const triples = Synthia.query('user', 'wants', null);

// Get system state
const state = Synthia.getState();
```

## What Happens When You Run It

1. **Loads** all 14 modules
2. **Wires** tools into the LCM
3. **Registers** tool operators with phase space engine
4. **Starts** the system
5. **Runs** a demo processing "I want to build a game about my life"

## Output

```
Intent: want
Triples: 5
Rules fired: 0
Mood: neutral
```

## Architecture

```
User Input
    ↓
AutoLink (Movement) → parses text into initial state
    ↓
Phase Space Engine
    Movement → detects impulse
    Evolution → computes trajectory
    Being → situates state
    Design → generates forms
    Space → embeds in geometry
    ↓
LCM stores trace, updates mesh, generates triples
    ↓
Output: state, trace, projections, triples
```

## No External Dependencies

- No MCP
- No external APIs
- No DALL-E
- No GitHub Copilot
- Everything generates from the state space itself

## Mobile/Termux

```bash
# Install Termux from F-Droid
pkg install nodejs
# Copy all files to /sdcard/synthia/
cd /sdcard/synthia
node runtime_entry.js
```

## Troubleshooting

If a module fails to load:
- Check that all files are in the same directory
- Check Node.js version: `node --version` (need v14+)
- Check file permissions: `ls -la *.js`

## The 5 Missing Pieces

These are the new computational substrate engines:

1. **Rich State Engine** - State = identity + geometry + semantics + energy + memory + coordinates + edges + affordances + potential + constraints
2. **Edge Function Engine** - Computation lives on connections, not nodes
3. **Semantic Triple Engine** - (Subject → Predicate → Object) IS the computation
4. **13-Layer Coordinate Engine** - 3.35 quintillion addressable states
5. **Tool Runtime Engine** - Every tool is a transform in the pipeline

## Total Files: 20

All 20 files are required for full functionality.
Total size: ~100 KB
