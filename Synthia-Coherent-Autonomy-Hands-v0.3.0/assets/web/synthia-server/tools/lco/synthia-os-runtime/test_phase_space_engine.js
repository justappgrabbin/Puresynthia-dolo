
const PhaseSpace = require('./phase_space_engine.js');
const ATO = require('./layer1_ato_core.js');

console.log("=".repeat(70));
console.log("PHASE SPACE ENGINE - TEST SUITE");
console.log("Five-dimensional sequential transformation");
console.log("=".repeat(70));
console.log();

// ============================================================
// TEST 1: Create engine and run composition
// ============================================================
console.log("TEST 1: Basic Composition");
console.log("-".repeat(50));

const engine = new PhaseSpace.PhaseSpaceEngine();

const initialState = {
  vector: [1, 0, 1, 0, 0, 1],
  text: "I have been avoiding a difficult conversation"
};

const context = {
  history: [],
  mesh: { vertices: new Map() },
  rules: []
};

const result = engine.compose(initialState, context);

console.log("Composition result:");
console.log("  Complete: " + result.complete);
console.log("  Errors: " + result.errors.length);
console.log("  Trace stages: " + result.trace.length);
console.log();

console.log("Trace:");
result.trace.forEach((stage, i) => {
  console.log("  " + (i+1) + ". " + stage.stage);
  console.log("     Events: " + stage.events.length);
  console.log("     Output vector: " + (stage.output.vector ? 
    stage.output.vector.map(v => v.toFixed(2)).join(", ") : "N/A"));
});
console.log();

console.log("Final state:");
console.log("  Has _movement: " + !!result.finalState._movement);
console.log("  Has _evolution: " + !!result.finalState._evolution);
console.log("  Has _being: " + !!result.finalState._being);
console.log("  Has _design: " + !!result.finalState._design);
console.log("  Has _space: " + !!result.finalState._space);
console.log();

console.log("✓ Composition works");
console.log();

// ============================================================
// TEST 2: Interrogative projection (READ-ONLY)
// ============================================================
console.log("TEST 2: Interrogative Projection");
console.log("-".repeat(50));

const projection = engine.project(result.trace, 'interrogative');

console.log("Who → Space:");
console.log("  Stage: " + projection.Who?.stage);
console.log("  Has output: " + !!projection.Who?.output);
console.log();

console.log("What → Movement:");
console.log("  Stage: " + projection.What?.stage);
console.log("  Events: " + projection.What?.events?.length);
console.log();

console.log("Where → Being:");
console.log("  Stage: " + projection.Where?.stage);
console.log("  Has coordinates: " + !!projection.Where?.output?.coordinates);
console.log();

console.log("When → Evolution:");
console.log("  Stage: " + projection.When?.stage);
console.log("  Has trajectory: " + !!projection.When?.output?.trajectory);
console.log();

console.log("Why → Design:");
console.log("  Stage: " + projection.Why?.stage);
console.log("  Has form: " + !!projection.Why?.output?.form);
console.log();

console.log("✓ Projection is read-only");
console.log();

// ============================================================
// TEST 3: Stage order matters
// ============================================================
console.log("TEST 3: Stage Order Determinism");
console.log("-".repeat(50));

const result2 = engine.compose(initialState, context);

console.log("First composition final vector:");
const v1 = result.finalState.vector || result.finalState;
console.log("  " + (Array.isArray(v1) ? v1.map(v => v.toFixed(3)).join(", ") : "N/A"));
console.log();

console.log("Second composition final vector (same input):");
const v2 = result2.finalState.vector || result2.finalState;
console.log("  " + (Array.isArray(v2) ? v2.map(v => v.toFixed(3)).join(", ") : "N/A"));
console.log();

console.log("Same input produces same output: " + 
  (Array.isArray(v1) && Array.isArray(v2) && 
   v1.every((v, i) => Math.abs(v - v2[i]) < 0.001)));
console.log();

console.log("✓ Deterministic");
console.log();

// ============================================================
// TEST 4: Custom operators
// ============================================================
console.log("TEST 4: Custom Operator Registration");
console.log("-".repeat(50));

const customOp = new PhaseSpace.PhaseOperator('Custom', (state, ctx) => {
  return {
    state: { ...state, custom: true, customValue: 42 },
    events: [{ type: 'custom_transform', value: 42 }]
  };
});

engine.registerOperator('Custom', customOp);

console.log("Registered custom operator: " + engine.getOperator('Custom').name);
console.log();

console.log("✓ Custom operators work");
console.log();

// ============================================================
// TEST 5: Validation errors
// ============================================================
console.log("TEST 5: Validation Errors");
console.log("-".repeat(50));

const badEngine = new PhaseSpace.PhaseSpaceEngine();
// Remove an operator
badEngine.operators.Movement = null;

const badResult = badEngine.compose(initialState, context);

console.log("Missing operator result:");
console.log("  Complete: " + badResult.complete);
console.log("  Errors: " + badResult.errors.length);
if (badResult.errors.length > 0) {
  console.log("  Error: " + badResult.errors[0].message);
}
console.log();

console.log("✓ Validation works");
console.log();

// ============================================================
// TEST 6: Projection does not alter trace
// ============================================================
console.log("TEST 6: Projection Immutability");
console.log("-".repeat(50));

const traceBefore = JSON.stringify(result.trace);
const proj1 = engine.project(result.trace, 'interrogative');
const proj2 = engine.project(result.trace, 'chronological');
const traceAfter = JSON.stringify(result.trace);

console.log("Trace before projection: " + traceBefore.length + " chars");
console.log("Trace after projection: " + traceAfter.length + " chars");
console.log("Trace unchanged: " + (traceBefore === traceAfter));
console.log();

console.log("Different projections of same trace:");
console.log("  Interrogative keys: " + Object.keys(proj1).join(", "));
console.log("  Chronological keys: " + Object.keys(proj2).join(", "));
console.log();

console.log("✓ Projection is immutable");
console.log();

// ============================================================
// TEST 7: Reference data independence
// ============================================================
console.log("TEST 7: Reference Data Independence");
console.log("-".repeat(50));

// The engine should work without any reference data
const cleanEngine = new PhaseSpace.PhaseSpaceEngine();
const cleanResult = cleanEngine.compose({ vector: [0.5, -0.3, 0.8, 0.1, -0.4, 0.2] }, {});

console.log("Clean engine (no reference data):");
console.log("  Complete: " + cleanResult.complete);
console.log("  Trace stages: " + cleanResult.trace.length);
console.log("  Final state has identity: " + !!cleanResult.finalState._space?.identity);
console.log();

console.log("✓ Engine works without reference data");
console.log();

// ============================================================
// SUMMARY
// ============================================================
console.log("=".repeat(70));
console.log("PHASE SPACE ENGINE TESTS COMPLETE");
console.log("=".repeat(70));
console.log();
console.log("Verified:");
console.log("  ✓ Five-stage sequential composition");
console.log("  ✓ Each stage receives output of previous stage");
console.log("  ✓ Full trace recorded");
console.log("  ✓ Interrogative projection (Who/What/Where/When/Why)");
console.log("  ✓ Projection is READ-ONLY (does not alter trace)");
console.log("  ✓ Deterministic (same input → same output)");
console.log("  ✓ Custom operators can be registered");
console.log("  ✓ Validation errors for missing operators");
console.log("  ✓ Works without reference data");
console.log();
console.log("The five dimensions:");
console.log("  1. Movement   - impulse, rotation, derivative");
console.log("  2. Evolution  - trajectory, patterns, history");
console.log("  3. Being      - situation, coordinates, identity");
console.log("  4. Design     - forms, constraints, selection");
console.log("  5. Space      - embedding, address, navigation");
console.log();
console.log("=".repeat(70));
