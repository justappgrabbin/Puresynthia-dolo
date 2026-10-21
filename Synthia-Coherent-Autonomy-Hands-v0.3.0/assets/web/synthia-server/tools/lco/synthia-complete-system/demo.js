// demo.js — RUNNING THE SYSTEM
//
// Demonstrates the full pipeline:
//   1. Natural language -> SheldonKleinCompiler (compile)
//   2. Coordinates -> SemanticOS (resolve)
//   3. State -> SemanticOS (transition via morphism)
//   4. Tool dispatch via Head
//   5. Cross-tool mesh communication

import { system } from './bootstrap.js';

console.log("=".repeat(60));
console.log("  SYNTHIA KLEIN MESH — Semantic Operating System Demo");
console.log("=".repeat(60));

// Demo 1: Parse natural language into a resolved state
console.log("\n📜 DEMO 1: Natural Language -> Resolved State");
console.log("-".repeat(60));

const text1 = "I want to shift my identity and move toward deeper purpose";
const result1 = await system.parseAndResolve(text1, 'human');

console.log(`Input: "${text1}"`);
console.log(`Confidence: ${result1.compiled.confidence.toFixed(3)}`);
console.log(`Dominant Axis: ${result1.compiled.interrogativeMap.WHO > result1.compiled.interrogativeMap.WHY ? 'WHO (Identity)' : 'WHY (Purpose)'}`);
console.log(`Resolved Coordinates:`);
console.log(`  Gate: ${result1.state.coordinates.gate}, Line: ${result1.state.coordinates.line}`);
console.log(`  Color: ${result1.state.coordinates.color}, Tone: ${result1.state.coordinates.tone}`);
console.log(`  Base: ${result1.state.coordinates.base}, Degree: ${result1.state.coordinates.degree.toFixed(1)}°`);
console.log(`  House: ${result1.state.coordinates.house}, Zodiac: ${result1.state.coordinates.zodiac}`);
console.log(`  State Hash: ${result1.state.hash.slice(0, 16)}...`);
console.log(`  Ontology (5D):`);
console.log(`    Movement: ${result1.state.ontology.movement.toFixed(4)}`);
console.log(`    Evolution: ${result1.state.ontology.evolution.toFixed(4)}`);
console.log(`    Being: ${result1.state.ontology.being.toFixed(4)}`);
console.log(`    Design: ${result1.state.ontology.design.toFixed(4)}`);
console.log(`    Space: ${result1.state.ontology.space.toFixed(4)}`);

// Demo 2: Apply morphism transitions
console.log("\n🔄 DEMO 2: State Transition (Morphism)");
console.log("-".repeat(60));

const mutated = system.semanticOS.transition(result1.state, 'mutate');
console.log(`Operator: MUTATE (line transition)`);
console.log(`  Before: Line ${result1.state.coordinates.line} -> After: Line ${mutated.coordinates.line}`);

const reflected = system.semanticOS.transition(mutated, 'reflect');
console.log(`Operator: REFLECT (polar reflection)`);
console.log(`  Before: Degree ${mutated.coordinates.degree}°, House ${mutated.coordinates.house}`);
console.log(`  After:  Degree ${reflected.coordinates.degree}°, House ${reflected.coordinates.house}`);

// Demo 3: Tool dispatch via Head
console.log("\n🎯 DEMO 3: Head Dispatch — IChing Grammar");
console.log("-".repeat(60));

const ichingResult = await system.dispatch({ lines: [1, 0, 1, 0, 1, 0] });
console.log(`Input: { lines: [1,0,1,0,1,0] }`);
console.log(`Routed to: ${ichingResult.filedTo}`);
console.log(`Handled by: ${ichingResult.handledBy}`);
console.log(`Executed: ${ichingResult.executed}`);
if (ichingResult.result) {
  console.log(`Result:`, JSON.stringify(ichingResult.result, null, 2).slice(0, 300));
}

// Demo 4: Analogy Engine
console.log("\n🔗 DEMO 4: Analogy Engine (A:B::C:?)");
console.log("-".repeat(60));

const analogyResult = await system.dispatch({
  vocab: ['creative', 'receptive', 'active', 'yielding', 'heaven', 'earth', 'initiating', 'bounded'],
  A: ['creative', 'heaven', 'active'],
  B: ['receptive', 'earth', 'yielding'],
  C: ['initiating', 'arousing', 'thunder']
});
console.log(`Transformation: ${analogyResult.result?.transformation?.join(', ')}`);
console.log(`Result D: ${analogyResult.result?.result?.join(', ')}`);

// Demo 5: Diseminer (Distributional Semantics)
console.log("\n📊 DEMO 5: Diseminer — Distributional Semantics");
console.log("-".repeat(60));

const corpus = [
  "the gate opens to reveal the path",
  "the path leads through the gate to the mountain",
  "the mountain stands still while the wind moves",
  "the wind carries the seed to new ground",
  "the ground receives the seed and nurtures growth",
  "growth emerges from the creative tension between stillness and motion"
];

const diseminerResult = await system.dispatch({
  corpus,
  term: 'gate',
  topN: 5
});
console.log(`Query term: "gate"`);
console.log(`Nearest neighbors:`);
diseminerResult.result?.neighbors?.forEach((n, i) => {
  console.log(`  ${i + 1}. "${n.term}" — similarity: ${n.similarity.toFixed(4)}`);
});

// Demo 6: Mesh Trace
console.log("\n📡 DEMO 6: Mesh Communication Trace");
console.log("-".repeat(60));

const trace = system.mesh.history('system.trace');
console.log(`Total trace events: ${trace.length}`);
console.log(`Events by type:`);
const eventTypes = {};
trace.forEach((t) => {
  const type = t.payload?.event || 'unknown';
  eventTypes[type] = (eventTypes[type] || 0) + 1;
});
Object.entries(eventTypes).forEach(([type, count]) => {
  console.log(`  ${type}: ${count}`);
});

// Demo 7: Novel Writer (Deterministic Narrative)
console.log("\n📖 DEMO 7: NovelWriter — Deterministic Narrative");
console.log("-".repeat(60));

const story = await system.dispatch({ seed: 42 });
console.log(`Seed: ${story.result?.seed}`);
console.log(`Hero: ${story.result?.hero}`);
console.log(`Lack: ${story.result?.lack}`);
console.log(`Antagonist: ${story.result?.antagonist}`);
console.log(`Boon: ${story.result?.boon}`);
console.log(`\nStory beats:`);
story.result?.beats?.forEach((beat, i) => {
  console.log(`  ${i + 1}. ${beat}`);
});

// Demo 8: Historical Monte Carlo (Language Drift)
console.log("\n🎲 DEMO 8: HistoricalMonteCarlo — Language Drift Simulation");
console.log("-".repeat(60));

const mcResult = await system.dispatch({
  variants: { formal: 0.5, colloquial: 0.3, hybrid: 0.2 },
  generations: 10,
  mutationScale: 0.15,
  seed: 123
});
console.log(`Dominant variant after 10 generations: ${mcResult.result?.dominantVariant}`);
console.log(`Final weights:`);
Object.entries(mcResult.result?.finalWeights || {}).forEach(([k, v]) => {
  console.log(`  ${k}: ${(v * 100).toFixed(1)}%`);
});

// Demo 9: Language Contact (Grammar Blending)
console.log("\n🌐 DEMO 9: LanguageContact — Grammar Blending");
console.log("-".repeat(60));

const contactResult = await system.dispatch({
  grammarA: { svo: true, prepositions: true, articles: true },
  grammarB: { svo: false, prepositions: false, articles: false, cases: true },
  contactRate: 0.25,
  generations: 8,
  seed: 99
});
console.log(`Final grammar after 8 generations of contact:`);
console.log(JSON.stringify(contactResult.result?.finalGrammar, null, 2));

// Demo 10: Full Pipeline — Text -> State -> Tool Chain
console.log("\n🚀 DEMO 10: Full Pipeline — Text -> State -> Tool Chain");
console.log("-".repeat(60));

const text2 = "the creative force moves through the gate to initiate transformation";
const compiled2 = system.sheldonKlein.compile(text2);
const state2 = await system.parseAndResolve(text2, 'human');

// Use the state's coordinates to drive an IChing query
const gateBinary = state2.state.coordinates.gate.toString(2).padStart(6, '0').split('').map(Number);
const ichingFromState = await system.dispatch({ lines: gateBinary });

console.log(`Input: "${text2}"`);
console.log(`Resolved to Gate ${state2.state.coordinates.gate} -> Binary: [${gateBinary.join(',')}]`);
console.log(`IChing features: ${ichingFromState.result?.features?.join(', ')}`);
console.log(`Lower trigram: ${ichingFromState.result?.lowerTrigram}`);
console.log(`Upper trigram: ${ichingFromState.result?.upperTrigram}`);

console.log("\n" + "=".repeat(60));
console.log("  All demos complete. The system is live.");
console.log("=".repeat(60));
