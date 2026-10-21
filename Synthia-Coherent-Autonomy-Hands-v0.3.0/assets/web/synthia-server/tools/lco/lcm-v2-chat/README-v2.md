# Language Contact Model v2

## What Changed

The previous version was a **language layer pretending to be a substrate**. This version inverts the dependency:

```
v1 (WRONG):
  Input → count imports → vector[0] = count → "semantic field"

v2 (RIGHT):
  Input → Klein Decomposition → I Ching Address → 13 Planetary Projections → 5D Tensor → Trajectory → Language
```

## Architecture

```
┌─────────────────┐
│  I Ching        │  ← The substrate. 64 gates × 6 lines × 13 filters.
│  Substrate      │     Named coordinates, not floating-point vectors.
└────────┬────────┘
         │
┌────────▼────────┐
│  Klein          │  ← Decomposition engine. AUTOLING feature structures.
│  Decomposer     │     DISEMINER semantic decomposition. Meaning operators.
└────────┬────────┘
         │
┌────────▼────────┐
│  Language       │  ← Contact dynamics. Two I Ching states touch.
│  Contact Engine │     Resonance is computed on the substrate.
└────────┬────────┘
         │
┌────────▼────────┐
│  Compiler v2    │  ← Reads scaffolding through Klein + I Ching.
│                 │     Connections from resonance, not regex.
└─────────────────┘
```

## The I Ching Substrate (`i-ching-substrate.ts`)

### Address System

Not `design: [0.5, 0.2, 0, 0, 0]`.

Instead:
```typescript
interface IChingAddress {
  gate: 1..64;           // Which hexagram
  line: 1..6;            // Which line within hexagram
  color: red|black|white|yellow;
  tone: 1st|2nd|3rd|4th|5th|6th;
  base: left|right;
  filter: sun|earth|moon|...|pluto;  // 13 planetary filters
}
```

### DMS Precision

- 1 gate = 5°37'30" = 20,250 arc-seconds
- 1 line = 0°56'15" = 3,375 arc-seconds
- 1 color = 844 arc-seconds
- 1 tone = 141 arc-seconds
- 1 base = 70 arc-seconds

```typescript
const arcSec = addressToArcSeconds({ gate: 6, line: 4, color: 'yellow', tone: '4th', base: 'right', filter: 'sun' });
// → 117,844 arc-seconds
```

### State = Set of Activations

Not a vector. A set of named addresses with activation levels:
```typescript
interface IChingState {
  activations: Map<string, number>;  // "6:4:yellow:4th:right:sun" → 0.9
  centroid: IChingAddress | null;    // Computed, not stored
  trajectory: IChingAddress[];         // Where it's been
  step: number;
}
```

### Traversal Operators

Moving through the space:
- `advance_line` — Next line in same gate
- `retreat_line` — Previous line
- `cross_gate` — Jump to harmonic gate
- `planetary_shift` — Change filter
- `circuit_traverse` — Move along circuit
- `center_transition` — Move between centers
- `hexagram_flip` — Invert trigrams
- `line_resonance` — Same line, different gate

## The Klein Decomposer (`klein-decomposer.ts`)

### AUTOLING Feature Structures

```typescript
interface FeatureStructure {
  id: string;
  type: 'entity' | 'event' | 'relation' | 'modifier' | ...;
  head: string;                    // What this feature is ABOUT
  subfeatures: FeatureStructure[]; // Recursive
  role: SemanticRole;              // agent, patient, instrument, ...
  variables: Map<string, FeatureStructure>; // Unification variables
  address: IChingAddress | null;   // Where it lives in the substrate
  activation: number;
}
```

### DISEMINER Output

Maps input to five interrogative dimensions:
```typescript
interface DiseminerOutput {
  who: FeatureStructure | null;   // Space dimension → Gates 1, 13, 25, ...
  what: FeatureStructure | null;   // Evolution → Gates 3, 42, ...
  where: FeatureStructure | null;   // Movement → Gates 20, 31, ...
  when: FeatureStructure | null;    // Being → Gates 5, 15, ...
  why: FeatureStructure | null;    // Design → Gates 2, 9, ...
  fullStructure: FeatureStructure;
  state: IChingState;
}
```

### Meaning Operators

Each feature gets mapped through a Klein operator:
- `identify` → entity → gate address
- `predicate` → event → gate address
- `quantify` → quantity → line depth
- `modalize` → modality → color/tone
- `temporalize` → time → planetary filter
- `spatialize` → space → center/circuit
- `intensify` → intensity → activation level
- `negate` → negation → hexagram inversion
- `question` → interrogative → traversal operator
- `implicate` → relation → dependency edge
- `presuppose` → presupposition → basin constraint

## The Language Contact Engine (`lcm-v2.ts`)

### Contact = Two I Ching States Touch

```typescript
const engine = new LanguageContactEngine();

// Alice speaks
engine.contact('A', "I need room to decide for myself", 'advance_line');

// Bob responds
engine.contact('B', "I understand. You need space.", 'cross_gate');
```

### Resonance = Matching Activations

Not vector dot product. Gate/line matching on the substrate:
- Same gate + same line = strength 1.0, harmonic 1
- Same gate, different line = strength 0.7, harmonic 2
- Same line, different gate = strength 0.5, harmonic 3
- Distance-based falloff otherwise

### Crystallization = Meaning Condenses

When resonance changes significantly, a new address emerges:
```typescript
interface Crystallization {
  id: string;
  address: IChingAddress;  // The stable point that emerged
  type: 'resonance' | 'interference' | 'harmonic' | 'collision';
  stability: number;
  contributors: ('A' | 'B')[];
}
```

## The Compiler v2 (`compiler-v2.ts`)

### Files Are Decomposed, Not Counted

```typescript
// WRONG (v1):
const imports = lines.filter(l => l.includes("import")).length;
const design = [imports * 0.1, 0, 0, 0, 0];

// RIGHT (v2):
const decomposition = decomposer.decompose(content);
const state = decomposition.state;  // I Ching activations
const type = inferSemanticType(decomposition);  // From dimensions
```

### Connections From Resonance

```typescript
// Two files contact each other via I Ching states
const event = contactEngine.contact('A', file1.content, 'cross_gate');
if (event.resonance.matched) {
  connections.push({
    from: file1.path,
    to: file2.path,
    type: resonanceToConnectionType(event.resonance),
    strength: event.resonance.strength,
    resonanceAddress: event.emission.address
  });
}
```

### Self-Insertion = Compiler's I Ching State

```typescript
const self = compiler.insertSelf();
// Generates a module containing the compiler's:
// - Centroid address
// - Active I Ching addresses
// - Trajectory length
// - Can be awakened at runtime
```

## Files

| File | Lines | Purpose |
|------|-------|---------|
| `i-ching-substrate.ts` | 337 | 64-gate coordinate system, DMS precision, traversal |
| `klein-decomposer.ts` | 455 | AUTOLING, DISEMINER, meaning operators |
| `lcm-v2.ts` | 432 | Contact dynamics on I Ching substrate |
| `compiler-v2.ts` | 424 | Scaffolding reader, app compiler, self-insertion |
| `index-v2.ts` | 9 | Module exports |
| `demo-v2.ts` | 192 | Live demonstrations |

**Total: ~1,850 lines**

## What It Actually Is

> A language contact model built on an I Ching coordinate substrate, analyzed through Sheldon Klein's semantic decomposition tools.

Not:
- An LLM (no next-token prediction)
- A deterministic state machine (emergent routing)
- A probabilistic model (pre-probabilistic field dynamics)
- A semantic vector space (named coordinates, not vectors)

## License

MIT — Build living systems on named coordinates.
