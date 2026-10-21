# Paper — Design Direction

## Three Directions Considered

### Theme Name: Archive Instrument
Very Brief Intro: A warm editorial workspace that treats application analysis like cataloguing artifacts in a living archive. Dense evidence, paper-like surfaces, and quiet utility make complex systems feel inspectable.
Probability: 0.06

### Theme Name: Signal Workshop
Very Brief Intro: A dark technical workbench with measured luminous accents, calibrated for live transformer operations and state transitions. It feels like a serious instrument rather than a futuristic dashboard.
Probability: 0.03

### Theme Name: Transit Atlas
Very Brief Intro: A light cartographic interface where source files, behaviors, and repairs become routes across a shared system map. The mood is exploratory, legible, and quietly optimistic.
Probability: 0.08

## Selected Direction: Archive Instrument

### Design Movement
Contemporary editorial software inspired by Swiss modernist information systems, archival indexing, and the tactility of annotated engineering notebooks.

### Core Principles
1. **Evidence before decoration.** Every visual element should help users locate source, provenance, status, or consequence.
2. **Layered inspectability.** The interface reveals the Mesh in progressive layers: project intake, extracted structure, operators, and repair evidence.
3. **Quiet material contrast.** Warm paper surfaces, ink-black structure, and one assertive vermilion accent create focus without gradients or neon glow.
4. **Asymmetric instrument layout.** Persistent navigation and a split working canvas make Paper feel like a workbench, not a centered marketing page.

### Color Philosophy
Paper is built around the tension between a warm archival ground and exacting machine notation. Bone and vellum surfaces make the interface feel approachable; ink and graphite carry structure; vermilion marks active transformation, warnings, and committed changes. The accent is used sparingly so that status becomes meaningful rather than decorative.

### Layout Paradigm
A left rail anchors the project and Mesh vocabulary. The main surface uses an offset two-column instrument: a broad visual workspace for the selected artifact or graph, and a narrow evidence ledger for operator output, readiness, and provenance. Panels are edge-aligned with deliberate seams and ruled dividers instead of repeated floating cards.

### Signature Elements
- **Registration marks:** tiny crosshair and corner marks identify the active Mesh viewport and make the canvas feel calibrated.
- **Evidence ledger:** numbered, monospaced evidence rows show source, type, status, and reproducibility at a glance.
- **Vermilion pulse:** a short underline, dot, or line segment indicates live activity, selected nodes, and repair proposals.

### Interaction Philosophy
Interactions should feel like operating a precise instrument. Selection is explicit, state changes are visibly acknowledged, and destructive or committing actions require an extra confirmation step. Hover reveals context; click reveals structure; approval changes the evidence ledger rather than silently mutating the project.

### Animation
Use restrained transitions under 240ms with a crisp ease-out. Mesh nodes should fade and translate by a few pixels when a new artifact is selected; evidence rows may cascade in 40ms increments. Avoid animated layout shifts. The active vermilion pulse may gently brighten during processing, but reduced-motion users receive an immediate static state.

### Typography System
Use **DM Serif Display** for Paper’s wordmark and major section titles, paired with **IBM Plex Sans** for interface copy and **IBM Plex Mono** for paths, hashes, contracts, and statuses. Headlines are compact and editorial; labels are uppercase with deliberate tracking; evidence data is monospaced and never italicized.

### Brand Essence
Paper turns local application artifacts into an inspectable, repairable visual system for builders who need evidence, not magic. Personality: **methodical, tactile, candid**.

### Brand Voice
Headlines are declarative and specific. CTAs describe the next operator action rather than promising transformation by itself. Microcopy names uncertainty honestly.

Example lines:
- “See what the project already knows.”
- “Propose the smallest repair the evidence can support.”

### Wordmark & Logo
The mark is a folded sheet intersected by a single vermilion registration line: a simple geometric symbol with one corner lifted, suggesting both paper and a transformed artifact. The wordmark uses DM Serif Display with a custom horizontal rule extending from the final letter.

### Signature Brand Color
**Vermilion register — `#D04A3A`**. It is ownable because it behaves as a physical printer’s registration ink: present at moments of consequence, absent from passive structure.

## Style Decisions
- Preserve the Archive Instrument direction across all components.
- Treat status labels as evidence, not decoration; never imply PASS when a capability is only a mock or untested.
- Keep the shared Mesh visible as a real data structure rendered from application state, not a decorative illustration.
- Keep the application local-first and deterministic; no LLM or external AI API calls inside Paper.
