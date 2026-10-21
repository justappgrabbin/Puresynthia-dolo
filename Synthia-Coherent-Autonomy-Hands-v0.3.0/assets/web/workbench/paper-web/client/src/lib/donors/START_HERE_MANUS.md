# PAPER — MANUS BUILD DIRECTIVE

Build one runnable, local-first application named **Paper** from the supplied donors.

Paper is a visual application transformer powered by **Klein tools operating on one shared Mesh**. The shipped application must not call an LLM, an AI API, tRPC, Supabase, or a required cloud backend. Do not substitute a chatbot or generic AI analysis.

## Do not misread the task

- Do not concatenate the donors into a ZIP and call that integration.
- Do not build a decorative node graph disconnected from source code.
- Do not leave the analyzer UI connected to its existing `trpc.ai.*` endpoints.
- Do not claim that hash-based frame compression is a trained VQ-VAE.
- Do not claim the mock diffusion adapter generates a working game.
- Do not alter the imported originals. Transformations operate on working copies.
- Do not declare completion because the interface renders or TypeScript compiles.

## Fixed architecture

1. **Paper UI** — visual projection and editing surface.
2. **Canonical MIR** — one normalized representation of artifacts, symbols, states, behaviors, dependencies, and evidence.
3. **Shared Mesh** — one graph used by every Klein operator.
4. **Klein operators** — Comp-Gram-Coder, DISEMINER, AUTOLING, coherence, paraphrase/style, analogy, and historical change.
5. **State-space resolver** — stable addresses; port the Python reference to TypeScript.
6. **Local runtime sandbox** — runs supported browser projects and captures evidence.
7. **Mutation ledger** — proposal, diff, validation, commit/reject, rollback.
8. **IndexedDB persistence** — projects, Mesh, evidence, execution recipes, and checkpoints.

All modules must exchange the contracts in `contracts/canonical-mir.ts`. If a donor uses another structure, write an adapter. Do not introduce a second authoritative graph.

## Required first-version inputs

- ZIP/folder projects
- JavaScript, TypeScript, JSX, TSX
- HTML, CSS, JSON
- Common browser assets

Preserve unknown files and label them `UNSUPPORTED`. Every file receives a hash, provenance record, stable ID, and address when sufficient addressing data exists.

## Required deterministic pipeline

`INGEST → PARSE → SYMBOLIZE → CLASSIFY → MESH → ADDRESS → LEARN GRAMMAR → RUN → OBSERVE → DIAGNOSE → PROPOSE → VALIDATE → COMMIT/REJECT → PERSIST → EXPORT`

Every stage must emit a result and status. A failure must stop dependent stages and remain visible.

## Donor use

- `donors/klein-mesh-v5.1/` is the canonical Klein/ATO/gap-fill baseline.
- `donors/analyzers/mirAnalyzer.ts` is a seed only. Replace regex-only extraction with AST analysis for supported code.
- Analyzer TSX files are UI donors only. Remove all tRPC/backend assumptions and connect them to the local canonical pipeline.
- `BehaviorResolver.js` is a routing seed, not a complete behavior engine.
- `address_resolver.reference.py` is reference logic. Port it to TypeScript; Python must not be required at runtime.
- `experimental-sgan/` is quarantined experimental material. Replace unseeded randomness before use and label any remaining simulation honestly.

## Klein-on-Mesh behavior

- Comp-Gram-Coder classifies Mesh nodes using form and context.
- DISEMINER writes typed direct relationships and computed reachability.
- AUTOLING learns valid structural/action sequences from parsed projects and runtime traces.
- Coherence rejects incomplete or illegal sequences.
- Paraphrase/style transforms implementation while retaining validated behavior.
- Analogy maps compatible structures between projects/frameworks.
- Historical change creates controlled variants. Variants are not learned until validated.

Each conclusion stores its operator, inputs, evidence, confidence, and reproducible result.

## Execution and transformation

Run compatible projects in an isolated local browser sandbox. Capture console output, errors, imports, events, state changes, render results, crashes, and network attempts. Static HTML that was never executed is not a successful run.

Every repair follows:

`problem → evidence → affected Mesh nodes → proposed mutation → source/Mesh diff → sandbox execution → validation → approval policy → commit or rollback`

Never silently edit source. Never learn from an unvalidated mutation.

## Required visual surfaces

- Original and current file tree
- Running preview
- Source/code editor
- Component/UI tree
- Typed Mesh view
- Dependency/reachability view
- Behavioral grammar/state-transition view
- Gaps and contradictions
- Exact mutation diff with approve/reject
- Runtime and validation logs

Visual actions must mutate the canonical MIR/Mesh and regenerate affected source. A canvas-only representation is insufficient.

## Required proof

Use a deliberately broken local web-app fixture and demonstrate:

1. Import ZIP.
2. Parse files and symbols.
3. Build/display the Mesh.
4. Assign stable addresses.
5. Attempt execution and capture the failure.
6. Identify the exact missing dependency/reference.
7. Propose the smallest repair and show its diff.
8. Approve, apply, and validate it.
9. Run the repaired app successfully.
10. Export the repaired project.
11. Reload Paper and prove the project, Mesh, and execution recipe persisted.

Report each feature as exactly one of: `TESTED`, `IMPLEMENTED_UNTESTED`, `MOCK`, `UNSUPPORTED`, or `MISSING`.

## Completion gate

Paper is complete only when `tests/ACCEPTANCE.md` passes with evidence. Deliver the runnable source, build output, fixture, test results, and exact local run instructions.
