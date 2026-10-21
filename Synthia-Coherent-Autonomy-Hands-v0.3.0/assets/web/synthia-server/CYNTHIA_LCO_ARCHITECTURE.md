# Cynthia Language Contact Organism

Cynthia is the organism. The LCM is the model she uses for contact, memory, and adaptation.

## Private And Public Boundary

- Public app requests go through Cynthia first.
- Public app requests cannot directly write files, patch code, run GitHub sync, or trigger live changes.
- Backend/admin requests can ask Trident and Cynthia to prepare or apply front-end and back-end changes through `/builder/apply-change`.
- Live code changes create a rollback manifest first.
- Sandbox code changes land under `builder-sandbox/code-updates` before being promoted.

## Organs

- LCM: contact/memory/adaptation model.
- LCM v2 chat/compiler: newer TypeScript contact/chat/compiler source, kept private because its demo UI exposes internal gate labels.
- Synthia Python LCM: standalone Python contact/chat/build reference engine, kept private because its language is internal.
- Autoling: expression/compiler organ, including the WH interrogative core.
- Diseminer: perception and recognition organ.
- MESSY: body/world and self-modification substrate.
- Synthia OS Runtime: local runtime body.
- Trident: private probabilistic backend helper, never a public app surface.
- Seedbox Swarm: rule-governed build and compile body.
- Final Human Design/Biverse sources: preserved by ontological address, with a repaired biverse source package for runtime use.
- IsoHuman and DNA/HD Compiler: both named input forms are preserved; the strongest runtime address is the extracted source tree.
- Klein final engines: Monte Carlo grammar, DISEMINER, automatic novel writer, I-Ching ATO mesh, and generative ATO substrate.
- ModuleBuilder: visual module-building interface source, registered as an app/editor module.

## WH Rule Spine

The Autoling source maps the WH interrogatives in this order:

1. WHERE: Movement
2. WHAT: Evolution
3. WHEN: Being
4. WHY: Design
5. WHO: Space

The active rules live in:

- `config/synthia-rules.json`
- `config/seedbox-swarm-rules.json`
- `config/swarm-placement-rules.json`

The swarm intake rule is simple: complete projects stay intact, manifest files win, known loose files are placed by organ rules, and unknown loose files go to review.

## Final Input Rule

Cynthia does not decide sameness by file bytes alone. Final files are addressed by name, source path, role, and runtime fitness. If two files appear similar, the system keeps the strongest working address while preserving aliases and source names in `config/final-inputs-manifest.json`.
