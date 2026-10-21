# Paper Acceptance Run

The acceptance harness was executed against the live built Paper application with a fresh browser context. The run imported `client/public/paper-broken-counter.zip`, parsed five files, built a canonical Mesh, ran the imported Klein donor adapter, executed the original in a sandbox, captured the deliberate failure, proposed and approved an exact source mutation, validated the repaired working copy in the sandbox, reloaded from IndexedDB, and exported the repaired ZIP.

| Gate | Result | Reproducible evidence |
|---|---|---|
| Real ZIP import | TESTED | `acceptance.mjs` import step; five `.file-row` records |
| AST-backed Mesh nodes | TESTED | `ev-ast-*` records emitted by Babel parser; `.mesh-node` assertion |
| Canonical dependency edges | TESTED | `buildMesh()` emits direct `imports` and derived `depends-on` edges |
| Stable state-space addresses | TESTED | `addressFor()` values displayed in Mesh nodes and file rows |
| Klein donor integration | TESTED | `runKleinOperators()` invokes imported `KleinEngine.process()`, `ask5W()`, and `getStats()` |
| Original sandbox failure | TESTED | Runtime ledger records `PAPER_FAIL: deliberate fixture failure` |
| Repair proposal | TESTED | `proposeRepair()` records exact before/after source and Mesh diff |
| Approval gate | TESTED | `approveRepair()` rejects non-proposed states and leaves source unchanged before approval |
| Repaired sandbox validation | TESTED | `applyRepair()` runs the candidate in the sandbox before commit |
| Rollback path | IMPLEMENTED_UNTESTED | `applyRepair()` restores the immutable project snapshot when candidate execution fails |
| IndexedDB persistence | TESTED | Reload assertion finds `Restored project, Mesh, and recipe from IndexedDB` |
| Runnable repaired export | TESTED | Download assertion confirms `<project>-repaired.zip` |

The test completed with **12 passed assertions out of 12**. The application contains no LLM invocation or external AI API call in `client/src`. The only network operation in the acceptance flow is loading the bundled local fixture asset from the Paper origin; sandbox execution records attempted network calls from the imported project separately.
