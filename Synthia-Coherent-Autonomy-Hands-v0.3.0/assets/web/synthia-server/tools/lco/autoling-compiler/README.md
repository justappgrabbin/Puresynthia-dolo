# AUTOLING Pattern Recognition Compiler

A 69,120-node mesh-based cognitive engine that implements Sheldon Klein's AUTOLING heuristic grammar learning within a Human Design / I Ching ontological framework.

## Architecture

### Three-Stage Transduction Pipeline

1. **Perceptual Layer (DISEMINER)** — Front-end compiler that extracts W-H parameters from any input
2. **Resonant Substrate (69,120-node Mesh)** — Linker/optimizer using I Ching hexagram addressing and 36-channel topology
3. **Generative Back-End (Transduction Engine)** — Code generator compiling resonance states into 5 output modalities

### Core Components

| Component | Description |
|-----------|-------------|
| **Mesh Addressing System (MAS)** | 24-bit packed addressing for 69,120 nodes across 5 dimensions × 64 gates × 6 lines × 6 colors × 6 tones × 3 bases |
| **W-H Interrogative Core** | 5-axis probe (WHERE, WHAT, WHEN, WHY, WHO) with recursive convergence and re-segmentation |
| **AUTOLING Heuristic Engine** | 4 heuristics + 1 dimensional mapping: bootstrap, substitution, class assignment, recursive coining |
| **Transduction Engine** | Compiles locked gate states into Story, Code, Image, Video, or Game artifacts |
| **MESSY Simulator** | Asynchronous wave propagation with attractor basin detection and emotional weather |
| **Universal Engine** | Orchestrator tying all components into a unified pipeline |

## Quick Start

```typescript
import { UniversalEngine } from 'autoling-pattern-compiler';

const engine = new UniversalEngine();

const output = await engine.process({
  raw: 'I stand at the threshold of a great decision...',
  sourceType: 'situation'
});

// Access compiled artifacts
console.log(output.artifacts.story.content);
console.log(output.artifacts.code.content);
console.log(output.artifacts.game.content);

// Query engine state
const state = engine.query('What is the current state?');
console.log(state.answer);
```

## W-H Interrogative Core

The five questions probe any input across five dimensions:

| Question | Dimension | Container | Extractive Target |
|----------|-----------|-----------|-------------------|
| WHERE? | Movement | Spatial/Movement | Directional vectors |
| WHAT? | Evolution | Semantic/Evolution | Functional markers |
| WHEN? | Being | Temporal/Being | Cyclical presence |
| WHY? | Design | Causal/Design | Motivational intent |
| WHO? | Space | Identity/Space | Entity/agentive markers |

## Mesh Addressing

Each node is a 24-bit packed address:
```
bits 0-2:   Dimension (0-4)
bits 3-8:   Gate (0-63)
bits 9-11:  Line (0-5)
bits 12-14: Color (0-5)
bits 15-17: Tone (0-5)
bits 18-19: Base (0-2)
bits 20-23: State flags
```

## AUTOLING Heuristics

1. **Bootstrap** — Coin tentative rules from unparsed input
2. **Substitution** — Group morphemes in identical environments
3. **Class Assignment** — Add morphemes to existing classes
4. **Recursive Coining** — Create recursive production rules
5. **Dimensional Mapping** — Map productions to 5-base ontology (new)

## Output Modalities

- **Story** — Narrative archetypes with I Ching line meanings
- **Code** — Functional blocks mapped to gate semantics
- **Image** — Visual composition descriptors
- **Video** — Scene sequence descriptors
- **Game** — Interactive mechanics and rules

## MESSY Simulation

- Asynchronous wave propagation through mesh
- Attractor basin detection
- Entropy and coherence metrics
- Emotional weather (fear/hope/desire aggregate)

## License

MIT
