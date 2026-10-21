
// ============================================================
// LCM v2 — Demo
// Shows the full stack: I Ching substrate → Klein → Contact → Realization
// ============================================================

import { createState, activate, computeCentroid, traverse, addressToArcSeconds } from './i-ching-substrate';
import { KleinDecomposer } from './klein-decomposer';
import { LanguageContactEngine, LanguageRealizer } from './lcm-v2';
import { ScaffoldingReader, AppCompiler } from './compiler-v2';

// -----------------------------------------------------------
// DEMO 1: I Ching substrate basics
// -----------------------------------------------------------
function demoSubstrate() {
  console.log("=== DEMO 1: I Ching Substrate ===\n");

  const state = createState();

  // Activate some addresses
  activate(state, { gate: 6, line: 4, color: 'yellow', tone: '4th', base: 'right', filter: 'sun' }, 0.9);
  activate(state, { gate: 1, line: 1, color: 'red', tone: '1st', base: 'left', filter: 'sun' }, 0.7);
  activate(state, { gate: 25, line: 3, color: 'white', tone: '3rd', base: 'left', filter: 'moon' }, 0.5);

  console.log("Activations:", state.activations.size);
  console.log("Centroid:", computeCentroid(state));
  console.log("Trajectory:", state.trajectory.length, "steps");

  // Traverse
  const step = traverse(
    { gate: 6, line: 4, color: 'yellow', tone: '4th', base: 'right', filter: 'sun' },
    'advance_line'
  );
  console.log("\nTraversal:", step.operator, "→", step.to);
  console.log("Cost:", step.cost, "Resonance:", step.resonance);
}

// -----------------------------------------------------------
// DEMO 2: Klein decomposition
// -----------------------------------------------------------
function demoKlein() {
  console.log("\n\n=== DEMO 2: Klein Decomposition ===\n");

  const decomposer = new KleinDecomposer();
  const result = decomposer.decompose("I need room to decide for myself");

  console.log("Who:", result.who?.head || "unresolved", "→ Gate", result.who?.address?.gate);
  console.log("What:", result.what?.head || "unresolved", "→ Gate", result.what?.address?.gate);
  console.log("Where:", result.where?.head || "unresolved", "→ Gate", result.where?.address?.gate);
  console.log("When:", result.when?.head || "unresolved", "→ Gate", result.when?.address?.gate);
  console.log("Why:", result.why?.head || "unresolved", "→ Gate", result.why?.address?.gate);

  console.log("\nState activations:", result.state.activations.size);
  console.log("Centroid:", computeCentroid(result.state));

  console.log("\nOperator log:", decomposer.getOperatorLog().length, "operations");
  for (const op of decomposer.getOperatorLog().slice(0, 3)) {
    console.log(`  ${op.operator}: ${op.input.head} → Gate ${op.address.gate}:${op.address.line}`);
  }
}

// -----------------------------------------------------------
// DEMO 3: Language contact between two I Ching states
// -----------------------------------------------------------
function demoContact() {
  console.log("\n\n=== DEMO 3: Language Contact ===\n");

  const engine = new LanguageContactEngine();

  // Alice speaks
  const event1 = engine.contact('A', "I need room to decide for myself", 'advance_line');
  console.log("Alice speaks. Resonance:", event1.resonance.matched ? "YES" : "NO");
  if (event1.resonance.matched) {
    console.log("  Strength:", event1.resonance.strength.toFixed(2));
    console.log("  Harmonic:", event1.resonance.harmonic);
  }
  console.log("  Crystallization:", event1.crystallization ? event1.crystallization.type : "none");

  // Bob responds
  const event2 = engine.contact('B', "I understand. You need space.", 'cross_gate');
  console.log("\nBob responds. Resonance:", event2.resonance.matched ? "YES" : "NO");
  if (event2.resonance.matched) {
    console.log("  Strength:", event2.resonance.strength.toFixed(2));
  }
  console.log("  Intimacy:", engine.getIntimacy().toFixed(2));

  // Alice again
  const event3 = engine.contact('A', "Yes. Room to breathe.", 'planetary_shift');
  console.log("\nAlice again. Resonance:", event3.resonance.matched ? "YES" : "NO");
  console.log("  Crystallizations so far:", engine.getCrystallizations().length);

  // Realize
  const realizer = new LanguageRealizer();
  const state = engine.getState();
  console.log("\nRealization from field A:", realizer.realize(state.fieldA));
  console.log("Realization from field B:", realizer.realize(state.fieldB));
}

// -----------------------------------------------------------
// DEMO 4: Compiler reads scaffolding
// -----------------------------------------------------------
function demoCompiler() {
  console.log("\n\n=== DEMO 4: Compiler v2 ===\n");

  const compiler = new AppCompiler();
  const reader = new ScaffoldingReader();

  const files = [
    {
      path: "src/components/UserProfile.tsx",
      content: `
import React from 'react';
import { useAuth } from '../hooks/useAuth';

export function UserProfile() {
  const { user } = useAuth();
  return <div>{user.name}</div>;
}
`
    },
    {
      path: "src/hooks/useAuth.ts",
      content: `
import { useState } from 'react';

export function useAuth() {
  const [user, setUser] = useState(null);
  return { user, setUser };
}
`
    },
    {
      path: "src/utils/api.ts",
      content: `
export async function fetchUser(id: string) {
  return fetch(`/api/users/${id}`);
}
`
    },
    {
      path: "src/pages/Home.tsx",
      content: `
import { UserProfile } from '../components/UserProfile';

export function Home() {
  return <UserProfile />;
}
`
    }
  ];

  console.log("Ingesting files...");
  compiler.ingest(reader, files);

  console.log("\nCompiling app...");
  const app = compiler.compile("SynthiaApp", "src/pages/Home.tsx");

  console.log("\nModules:");
  for (const mod of app.modules) {
    console.log(`  ${mod.path} → ${mod.semanticType}`);
    console.log(`    Active gates: ${Array.from(mod.state.activations.keys()).map(k => k.split(':')[0]).join(', ')}`);
  }

  console.log("\nConnections:");
  for (const conn of app.connections) {
    console.log(`  ${conn.from} --${conn.type}(${conn.strength.toFixed(2)})--> ${conn.to}`);
    console.log(`    Resonance at Gate ${conn.resonanceAddress.gate}:${conn.resonanceAddress.line}`);
  }

  console.log("\nDesign basin:");
  console.log("  Center:", app.designBasin.center);
  console.log("  Gates:", app.designBasin.gates);
  console.log("  Depth:", app.designBasin.depth.toFixed(2));

  console.log("\nInserting compiler...");
  const self = compiler.insertSelf();
  console.log("Self-module:", self.path);
  console.log("Size:", self.content.length, "chars");

  console.log("\nExporting...");
  const exported = compiler.exportApp(app);
  console.log("Manifest preview:");
  console.log(exported.manifest.substring(0, 500));
}

// Run
// demoSubstrate();
// demoKlein();
// demoContact();
// demoCompiler();

export { demoSubstrate, demoKlein, demoContact, demoCompiler };
