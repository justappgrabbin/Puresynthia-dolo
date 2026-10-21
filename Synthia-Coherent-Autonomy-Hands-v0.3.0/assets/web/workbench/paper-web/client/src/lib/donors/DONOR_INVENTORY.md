# Donor Inventory and Authority

## Canonical baseline

`donors/klein-mesh-v5.1/`

Use as the single Klein/ATO/gap-fill baseline. It includes TypeScript source and compiled `dist` output. Its patch notes explicitly acknowledge that the VQ layer is hash-based, game contexts are not yet one live shared substrate, and blends are snapshots.

## Analyzer donors

- `mirAnalyzer.ts`: useful MIR extraction seed; currently regex/keyword based.
- `ProjectAnalyzer.tsx`: useful project-analysis UI; remove tRPC dependency.
- `CodeAnalyzer.tsx`: useful code-analysis UI; remove tRPC dependency.
- `LearningAnalytics.tsx`: useful evidence display; replace tRPC and do not equate charts with learning.

## Resolver donors

- `BehaviorResolver.js`: small event-routing seed.
- `address_resolver.reference.py`: substantial addressing reference; port to TypeScript and verify mappings before making it authoritative.

## Experimental donor

`donors/experimental-sgan/`

Checksum-verified source donor. It contains unseeded `Math.random()` and must not enter the deterministic core unchanged. Treat SGAN claims as experimental until behavior is tested.

## Intentionally excluded duplicate

`ingest-gapfill-engine(20260828-122826).zip` is not copied into this handoff because it heavily overlaps the v5.1 fixed engine. It remains a provenance source, not a second runtime authority.
