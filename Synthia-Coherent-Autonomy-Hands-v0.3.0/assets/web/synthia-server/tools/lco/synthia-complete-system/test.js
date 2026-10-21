// test.js — UNIT TESTS FOR THE MESH
//
// Validates core invariants of the SemanticOS and SheldonKleinCompiler.

import { system } from './bootstrap.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (err) {
    console.log(`❌ ${name}: ${err.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

console.log("Running tests...\n");

// Test 1: Mesh pub/sub
test('Mesh publish and subscribe', () => {
  let received = false;
  const unsub = system.mesh.subscribe('test.channel', () => { received = true; });
  system.mesh.publish('test.channel', 'test', { data: 1 });
  assert(received, 'Message not received');
  unsub();
});

// Test 2: SemanticOS resolve
test('SemanticOS resolves a state', () => {
  const state = system.semanticOS.resolve({
    who: { id: 'test', namespace: 'test' },
    what: { type: 'test', traits: {} },
    where: { trajectory: [1], position: 'Aries-1' },
    when: { temporalMarker: 0, cyclePhase: 'test' },
    why: { constraints: [], purpose: 'test' },
    coordinates: { gate: 1, line: 1, color: 1, tone: 1, base: 1, degree: 0, minute: 0, second: 0, arc: 0, zodiac: 'Aries', house: 1 },
    domain: 'test'
  });
  assert(state.resolved === true, 'State not resolved');
  assert(state.hash.length > 0, 'Hash not generated');
  assert(state.coordinates.gate === 1, 'Gate mismatch');
});

// Test 3: Ontology computation
test('Ontology computes 5D values from coordinates', () => {
  const state = system.semanticOS.resolve({
    who: { id: 't', namespace: 't' },
    what: { type: 't', traits: {} },
    where: { trajectory: [1], position: 't' },
    when: { temporalMarker: 0, cyclePhase: 't' },
    why: { constraints: [], purpose: 't' },
    coordinates: { gate: 8, line: 6, color: 6, tone: 6, base: 5, degree: 360, minute: 60, second: 60, arc: 0, zodiac: 'Pisces', house: 12 },
    domain: 'test'
  });
  assert(state.ontology.movement === 0, 'Movement should be 0 for gate 8 (8%8=0)');
  assert(state.ontology.evolution === 1, 'Evolution should be 1 for line 6');
  assert(state.ontology.design === 1, 'Design should be 1 for base 5');
});

// Test 4: Morphism transition
test('Morphism transitions state', () => {
  const state = system.semanticOS.resolve({
    who: { id: 't', namespace: 't' },
    what: { type: 't', traits: {} },
    where: { trajectory: [1], position: 't' },
    when: { temporalMarker: 0, cyclePhase: 't' },
    why: { constraints: [], purpose: 't' },
    coordinates: { gate: 1, line: 1, color: 1, tone: 1, base: 1, degree: 0, minute: 0, second: 0, arc: 0, zodiac: 'Aries', house: 1 },
    domain: 'test'
  });
  const mutated = system.semanticOS.transition(state, 'mutate');
  assert(mutated.coordinates.line === 2, 'Line should increment to 2');
  assert(mutated.hash !== state.hash, 'Hash should change after transition');
});

// Test 5: Structural equivalence — same gate, line, AND all 5 ontology dims
test('Structural equivalence detection', () => {
  const s1 = system.semanticOS.resolve({
    who: { id: 'a', namespace: 'a' },
    what: { type: 'a', traits: {} },
    where: { trajectory: [1], position: 'a' },
    when: { temporalMarker: 0, cyclePhase: 'a' },
    why: { constraints: [], purpose: 'a' },
    coordinates: { gate: 10, line: 3, color: 2, tone: 4, base: 2, degree: 45, minute: 0, second: 0, arc: 0, zodiac: 'Taurus', house: 2 },
    domain: 'human'
  });
  // s2 must have identical ontology values (gate, line, color, tone, base, degree, house)
  const s2 = system.semanticOS.resolve({
    who: { id: 'b', namespace: 'b' },
    what: { type: 'b', traits: {} },
    where: { trajectory: [2], position: 'b' },
    when: { temporalMarker: 1, cyclePhase: 'b' },
    why: { constraints: ['x'], purpose: 'b' },
    coordinates: { gate: 10, line: 3, color: 2, tone: 4, base: 2, degree: 45, minute: 0, second: 0, arc: 0, zodiac: 'Gemini', house: 2 },
    domain: 'code'
  });
  assert(system.semanticOS.checkEquivalence(s1, s2), 'States with same ontology should be equivalent');
});

// Test 6: SheldonKlein compiler — use words with strong lexicon entries
test('SheldonKlein compiles text to coordinates', () => {
  const result = system.sheldonKlein.compile("I want to shift and create");
  // "shift" -> { degree: 15, line: 1 } with weight 0.20 (WHERE)
  // "create" -> { gate: 1, line: 1, base: 5 } with weight 0.25 (WHAT, default)
  // "I" -> WHO with weight 0.35, no lexicon
  // gate starts at 1, "create" adds gate:1 * 0.25 = 0.25 -> round(1.25) = 1
  // But base shifts: round(1 + 5*0.25) = round(2.25) = 2
  assert(result.coordinates.base > 1, 'Base should shift from default (create has base:5)');
  assert(result.confidence > 0, 'Confidence should be positive');
  assert(result.interrogativeMap.WHERE > 0, 'WHERE axis should be active (shift)');
});

// Test 7: Head routing
test('Head routes IChing input correctly', () => {
  const decision = system.head.run({ lines: [1, 0, 1, 0, 1, 0] });
  assert(decision.filedTo === 'symbol.iching', 'Should route to IChingGrammar');
  assert(decision.handledBy === 'IChingGrammar', 'Should be handled by IChingGrammar');
});

// Test 8: Head routing fallback
test('Head routes unknown input to unfiled', () => {
  const decision = system.head.run({ unknown: true });
  assert(decision.filedTo === 'mesh.unfiled', 'Should route to unfiled');
  assert(decision.handledBy === null, 'Should have no handler');
});

// Test 9: Cross-domain invariant projection — same ontology, different domain
test('Cross-domain invariant projection', () => {
  const humanState = system.semanticOS.resolve({
    who: { id: 'h', namespace: 'h' },
    what: { type: 'h', traits: {} },
    where: { trajectory: [1], position: 'h' },
    when: { temporalMarker: 0, cyclePhase: 'h' },
    why: { constraints: [], purpose: 'h' },
    coordinates: { gate: 25, line: 2, color: 1, tone: 1, base: 1, degree: 0, minute: 0, second: 0, arc: 0, zodiac: 'Aries', house: 1 },
    domain: 'human'
  });
  const codeState = system.semanticOS.resolve({
    who: { id: 'c', namespace: 'c' },
    what: { type: 'c', traits: {} },
    where: { trajectory: [1], position: 'c' },
    when: { temporalMarker: 0, cyclePhase: 'c' },
    why: { constraints: [], purpose: 'c' },
    coordinates: { gate: 25, line: 2, color: 1, tone: 1, base: 1, degree: 0, minute: 0, second: 0, arc: 0, zodiac: 'Libra', house: 1 },
    domain: 'code'
  });
  const projected = system.semanticOS.projectInvariant(humanState, 'code');
  assert(projected !== null, 'Should find equivalent and project');
  assert(projected.domain === 'code', 'Projected domain should be code');
});

// Test 10: Mesh trace accumulation
test('Mesh accumulates trace events', () => {
  const beforeCount = system.mesh.history('system.trace').length;
  system.mesh.publish('system.trace', 'test', { event: 'TEST_EVENT' });
  const afterCount = system.mesh.history('system.trace').length;
  assert(afterCount > beforeCount, 'Trace should accumulate');
});

console.log(`\n${"=".repeat(60)}`);
console.log(`  Results: ${passed} passed, ${failed} failed`);
console.log(`${"=".repeat(60)}`);

if (failed > 0) process.exit(1);
