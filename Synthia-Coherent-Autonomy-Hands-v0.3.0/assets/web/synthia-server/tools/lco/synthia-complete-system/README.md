# Synthia Klein Mesh — Semantic Operating System

A recursive state-space operating system built on Sheldon Klein's linguistic tools and a five-dimensional ontology.

## Architecture

```
Layer 1: Parser        (Who, What, Where, When, Why)
Layer 2: Ontology       (Movement, Evolution, Being, Design, Space)
Layer 3: Address        (Gate, Line, Color, Tone, Base, Degree, ...)
Layer 4: State          (Resolved coordinate — identity lives here)
Layer 5: Morphism      (How — the transition operator)
```

## Core Hypothesis

Structurally equivalent states share transformation laws regardless of domain. A human, a protein, a compiler, a musical phrase — if they occupy equivalent structural positions in the substrate, the same operator describes their transformation.

## Components

| File | Role |
|------|------|
| `mesh.js` | Pub/sub nervous system |
| `semanticOS.js` | Core state engine (5D ontology + morphisms) |
| `sheldonKleinCompiler.js` | Natural language → coordinate compiler |
| `head.js` | Structural dispatcher (routes by shape, not semantics) |
| `bootstrap.js` | Wires everything together |
| `demo.js` | 10 working demonstrations |
| `test.js` | 10 unit tests validating invariants |

## Klein Tools (No-LLM, Deterministic)

| Tool | Channel | What it does |
|------|---------|-------------|
| AIHub | `hub.ninthcenter` | Routes to Claude/ChatGPT/Gemini/Kimi |
| AnalogyEngine | `reason.analogy` | Boolean feature-vector analogy solving |
| AutoLing | `lang.autoling` | Bidirectional grammar generation/recognition |
| GitHubRAG | `code.githubrag` | Code retrieval + distributional reranking |
| Diseminer | `lang.diseminer` | Distributional semantic inference |
| IChingGrammar | `symbol.iching` | Hexagram → feature-vector mapping |
| LanguageContact | `lang.contact` | Stochastic grammar blending |
| Messy | `sim.messy` | Agent simulation + HTML5 canvas codegen |
| NovelWriter | `narrative.novelwriter` | Deterministic narrative generation |
| HistoricalMonteCarlo | `sim.montecarlo` | Language drift simulation |

## Usage

```js
import { system } from './bootstrap.js';

// Parse text into a resolved state
const { state } = await system.parseAndResolve(
  "I want to shift my identity toward deeper purpose",
  'human'
);

// Apply a morphism
const newState = system.semanticOS.transition(state, 'mutate');

// Dispatch a tool
const result = await system.dispatch({ lines: [1,0,1,0,1,0] });
```

## Running

```bash
node demo.js    # 10 live demonstrations
node test.js    # 10 unit tests
```
