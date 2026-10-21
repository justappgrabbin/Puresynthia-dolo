# MESSY Modern - Meta-Symbolic Simulation System

A complete reimagining of Sheldon Klein's 1973 MESSY (Meta-Symbolic Simulation System) for the modern era, combining semantic network simulation, neural code generation, and spatial mesh visualization.

## What Is This?

MESSY Modern is a **generative substrate** where:
- Everything is a **semantic triple** (subject-relation-object)
- Triples have **geometry** (position, velocity, force fields)
- Triples are **vectors** in a neural embedding space
- Triples become **code** (games, apps, videos, tools)
- The system **self-describes** and **self-modifies** through triples

## Quick Start

### 1. Open the Frontend
Simply open `messy_modern.html` in a modern web browser:
```bash
open messy_modern.html
# or
python -m http.server 8080
# then visit http://localhost:8080/messy_modern.html
```

### 2. Start the Python Backend (Optional, for neural generation)
```bash
pip install fastapi uvicorn numpy
python messy_backend.py
# API available at http://localhost:8000
```

### 3. Use the System
1. **Assert triples** in the left panel (e.g., `JOHN LOVES MARY`)
2. **Watch the mesh** evolve in the 3D visualization
3. **Generate code** by clicking "Generate" - select target (JS, HTML, Three.js, etc.)
4. **Export** the generated code and run it

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MESSY MODERN SYSTEM                       │
│                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐  │
│  │   JS Front  │◄──►│  Canonical  │◄──►│  Python Back    │  │
│  │  (Three.js) │    │    Mesh     │    │  (FastAPI +     │  │
│  │             │    │  (Triples   │    │   Neural Net)   │  │
│  │  • Visual   │    │   + Space)  │    │                 │  │
│  │  • Input    │    │             │    │  • Generate     │  │
│  │  • Render   │    │  • Assert   │    │  • Execute      │  │
│  │             │    │  • Query    │    │  • Sandbox      │  │
│  └─────────────┘    │  • Physics  │    └─────────────────┘  │
│                     │  • Self-mod │                           │
│                     └─────────────┘                           │
│                                                              │
│  The mesh is not storage. It is a physical system where       │
│  semantic assertions have geometric consequences.            │
└─────────────────────────────────────────────────────────────┘
```

## Key Features

### Semantic Network with Physics
- Triples attract/repel based on relation type
- `LOVES` = attraction, `HATES` = repulsion
- `MARRIED` = strong bond, `AT` = position constraint
- Real-time force-directed layout in 3D space

### Neural Code Generation
- Triple patterns become code structure
- Context-aware generation (patterns determine output)
- Multiple target surfaces: JavaScript, HTML5, Three.js, GLSL, Python

### Self-Describing System
- The mesh contains triples that describe itself
- `MESH CAN ASSERT`, `SYSTEM SHOULD ADJUST`
- No external configuration - everything is in the mesh

### Safe Execution
- Sandboxed Python execution with AST validation
- Restricted builtins, no file/network access
- Triple output feeds back into the mesh

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/stats` | GET | Get mesh statistics |
| `/triples` | GET | Query triples (filter by s/r/o) |
| `/triples` | POST | Assert a new triple |
| `/triples/{id}` | DELETE | Negate a triple |
| `/generate` | POST | Generate code from mesh state |
| `/execute` | POST | Execute code in sandbox |
| `/step` | POST | Advance simulation one step |
| `/ws` | WebSocket | Real-time mesh updates |

## Example Usage

### Asserting Triples
```javascript
// Via WebSocket
ws.send(JSON.stringify({
    action: "assert",
    subject: "HERO",
    relation: "DEFEATS",
    object: "DRAGON",
    meta: { value: 5 }
}));
```

### Generating Code
```javascript
// Generate a JavaScript game
ws.send(JSON.stringify({
    action: "generate",
    target: "javascript"
}));

// Response:
// {
//     "event": "generated",
//     "code": "class GeneratedGame { ... }"
// }
```

### Querying the Mesh
```python
import requests

# Get all active triples
r = requests.get("http://localhost:8000/triples")
print(r.json())

# Assert a triple
r = requests.post("http://localhost:8000/triples", json={
    "subject": "PLAYER",
    "relation": "HAS",
    "object": "SWORD",
    "meta": {"value": 10}
})
```

## The Canonical Form

The system's canonical representation:

```javascript
// Everything is a triple
mesh.assert("JOHN", "LOVES", "MARY");
mesh.assert("MARY", "LOVES", "JOHN");
mesh.assert("JAMES", "HATES", "JOHN");

// The mesh describes itself
mesh.assert("MESH", "HAS", "DIMENSIONS", { value: 3 });
mesh.assert("MESH", "CAN", "GENERATE");
mesh.assert("SYSTEM", "VERSION", "MESSY_MODERN_1.0");

// Self-modification
mesh.assert("MESH", "ADJUST", "REPULSION", { value: 50 });
```

## From the Original MESSY (1973)

This system extends concepts from Sheldon Klein's original work:

- **Semantic triples** as fundamental unit (subject-relation-object)
- **Probabilistic rules** with frequency parameters
- **Natural language generation** from semantic networks
- **Simulation** of social dynamics and narrative
- **Generative grammars** for stylistic control

New additions:
- **Spatial geometry** for triples (position, velocity, forces)
- **Neural embeddings** for semantic similarity
- **Code generation** from triple patterns
- **Self-modification** through meta-triples
- **Real-time 3D visualization**

## License

MIT - Based on academic research by Sheldon Klein (1966-1973)

## References

1. Klein, S. (1965). "Control of Style with a Generative Grammar." *Language*, 41(4).
2. Klein, S. et al. (1973). "Modeling Propp and Levi-Strauss in a Meta-Symbolic Simulation System." *Proc. Annual Meeting of the ACL*.
3. Klein, S. (1974). "Computer Simulation of Language Contact Models." *COLING*.
4. Oakley, J.D. (1975). "MESSY User Manual." University of Wisconsin.
