# Synthia Unified StateSpace — Kimi + Emergent v0.1.1

This package performs a **non-destructive compositional merge** of two recovered StateSpace lineages:

1. **Kimi / PureAutomata operational StateSpace** — recovered as executable sovereign bundle code. It supplies deterministic address math, 16 named transitions, operators, gate transforms, five graph projections, automata execution, ToolFactory/process-field functionality, derivation hashes, and replay.
2. **Emergent StateSpace geometric/field model** — recovered as `state-space-model.js`. It supplies the dense Gate → Line → Color → Tone → Base geometry, DMS/angle mapping, field gravity, traces/memory reconstruction, charts, and Space/Design/Causal/Knowledge/Dependency interpretations.

The merge does **not** pick a semantic winner. A canonical address identifies one state while `views.kimi` and `views.emergent` preserve both sourced interpretations.

## API

```js
import { createUnifiedStateSpace } from './src/unified-state-space.mjs';

const stateSpace = createUnifiedStateSpace();
const state = stateSpace.resolve({ gate: 25, line: 4, color: 6, tone: 5, base: 2 });
const next = stateSpace.transition({ address: state.address, transition: 'mirror' });
stateSpace.observe(next.resolved.address, { source: 'runtime' });
const snapshot = stateSpace.exportState();
```

Core surface:

- `normalizeAddress(address)`
- `resolve(addressOrArcSecond)`
- `project(address, perspective)`
- `transition(event)`
- `observe(address, context)`
- `executeKimi(input)` / `replayKimi(derivation)`
- `getHistory()`
- `getRelationships(address)`
- `exportState()` / `hydrate(snapshot)`
- `validate()`

## No LLM dependency

This package has **zero npm dependencies and no LLM/API integration**. The recovered Kimi engine is executed locally as JavaScript. This merge does not add Groq, Anthropic, OpenRouter, OpenAI, or any model fallback.

## Provenance honesty

This is a runnable recovery merge, **not a claim that the two historical ZIP archives were byte-exactly recovered**. The Phase 2 recovery record states that the exact original Kimi archive and canonical `Synthia-Emergent-StateSpace-v0.6.8.zip` still required provenance reconciliation. Therefore the source snapshots in `vendor/` are retained unchanged and identified as recovered executable sources.

## Test

```bash
npm test
```

The included regression verifies dual-view retention, canonical address preservation, Kimi mirror/shadow involutions, changing-line transition, Emergent observation, Kimi deterministic replay, persistence/hydration, and the no-LLM policy.
