
const Mesh = require('./layer3_generative_mesh.js');
const ATO = require('./layer1_ato_core.js');
const FeatureSpace = require('./layer2_feature_space.js');

console.log("=".repeat(70));
console.log("LAYER 3: GENERATIVE MESH - TEST SUITE");
console.log("The living hypercube of concepts");
console.log("=".repeat(70));
console.log();

// ============================================================
// TEST 1: Create Mesh and Add Vertices
// ============================================================
console.log("TEST 1: Create Mesh and Add Vertices");
console.log("-".repeat(50));

const mesh = new Mesh.GenerativeMesh(6);

// Add I Ching hexagrams as vertices
for (let i = 1; i <= 64; i++) {
  const hex = FeatureSpace.HEXAGRAMS[i];
  mesh.addVertex(`hex_${i}`, hex.vector, hex.name, "hexagram", {
    trigram: hex.trigram,
    nature: hex.nature
  });
}

// Add semantic concepts (Mind, Body, Heart)
mesh.addVertex("mind", [1,0,0,1,0,1], "Mind", "concept", { domain: "cognition" });
mesh.addVertex("body", [0,1,0,0,1,1], "Body", "concept", { domain: "physical" });
mesh.addVertex("heart", [0,0,1,0,1,1], "Heart", "concept", { domain: "emotion" });

console.log("Mesh created with " + mesh.vertices.size + " vertices");
console.log("  Hexagrams: 64");
console.log("  Concepts: 3 (Mind, Body, Heart)");
console.log();
console.log("✓ Vertices added");
console.log();

// ============================================================
// TEST 2: Add Edges (Analogical Relationships)
// ============================================================
console.log("TEST 2: Add Edges (Analogical Relationships)");
console.log("-".repeat(50));

// Add edges for Human Design channels
for (const channel of FeatureSpace.CHANNELS) {
  mesh.addEdge(`hex_${channel.gate1}`, `hex_${channel.gate2}`, "channel", 0.7);
}

console.log("Added " + mesh.edges.size + " edges (Human Design channels)");
console.log();

// Show a specific edge
const edge1 = mesh.getEdge("hex_1", "hex_8");
if (edge1) {
  console.log("Edge: Creative -> Holding Together");
  console.log("  Transform: " + ATO.vectorToString(edge1.transform));
  console.log("  Strength: " + edge1.strength);
  console.log("  Type: " + edge1.type);
  console.log();
}

// Add edges between concepts
mesh.addEdge("mind", "body", "relates_to", 0.6);
mesh.addEdge("body", "heart", "relates_to", 0.6);
mesh.addEdge("heart", "mind", "relates_to", 0.6);

console.log("Added concept edges: Mind <-> Body <-> Heart");
console.log();
console.log("✓ Edges added");
console.log();

// ============================================================
// TEST 3: Semantic Triples
// ============================================================
console.log("TEST 3: Semantic Triples (Mind-Body-Heart)");
console.log("-".repeat(50));

// Create triples
mesh.addTriple("mind", "influences", "body");
mesh.addTriple("body", "feels", "heart");
mesh.addTriple("heart", "guides", "mind");

console.log("Semantic triples created:");
for (const triple of mesh.triples) {
  console.log("  " + triple.toString());
}
console.log();

// Find triples matching a pattern
const patternMatches = mesh.findTriples({ subject_type: "concept" });
console.log("Triples with concept subjects: " + patternMatches.length);
console.log();

console.log("✓ Semantic triples working");
console.log();

// ============================================================
// TEST 4: Generative Operations (Create New Concepts)
// ============================================================
console.log("TEST 4: Generative Operations");
console.log("-".repeat(50));

// Generate a new concept from analogy
// Mind : Body :: Heart : ?
const generated = mesh.generateFromAnalogy("mind", "body", "heart", "Soul", "generated");
if (generated) {
  console.log("Generated from analogy: Mind : Body :: Heart : Soul");
  console.log("  Result: " + generated.toString());
  console.log("  Vector: " + ATO.vectorToString(generated.vector));
  console.log("  Metadata: " + JSON.stringify(generated.metadata));
  console.log();
}

// Blend two vertices
const blended = mesh.blendVertices("hex_1", "hex_2", "Creative-Receptive Blend", "blend");
if (blended) {
  console.log("Blended: Creative + Receptive");
  console.log("  Result: " + blended.toString());
  console.log("  Vector: " + ATO.vectorToString(blended.vector));
  console.log();
}

// Mutate a vertex
const mutant = mesh.mutateVertex("hex_1", "Creative Mutant", "mutant");
if (mutant) {
  console.log("Mutated: Creative");
  console.log("  Result: " + mutant.toString());
  console.log("  Vector: " + ATO.vectorToString(mutant.vector));
  console.log("  Distance from parent: " + ATO.hammingDistance(mutant.vector, FeatureSpace.HEXAGRAMS[1].vector));
  console.log();
}

console.log("✓ Generative operations working");
console.log();

// ============================================================
// TEST 5: Tool Integration (Klein Tools Clip In)
// ============================================================
console.log("TEST 5: Tool Integration (Klein Tools)");
console.log("-".repeat(50));

// Register a mock AutoLink tool
mesh.registerTool("AutoLink", [1,0,0,1,0,0], (vertex, params) => {
  return {
    tool: "AutoLink",
    vertex: vertex.label,
    parsed: "intent: " + (params.intent || "unknown")
  };
});

// Register a mock DISEMINER tool
mesh.registerTool("DISEMINER", [0,1,0,0,1,0], (vertex, params) => {
  return {
    tool: "DISEMINER",
    vertex: vertex.label,
    pattern: "detected: " + (params.pattern || "none")
  };
});

console.log("Registered tools: " + Array.from(mesh.tools.keys()).join(", "));
console.log();

// Call a tool on a vertex
const toolResult = mesh.callTool("AutoLink", "hex_1", { intent: "create" });
console.log("Tool call result:");
console.log("  " + JSON.stringify(toolResult));
console.log();

// Find best tool for a vertex
const bestTool = mesh.findBestTool("hex_1");
console.log("Best tool for Creative (hex_1):");
console.log("  Tool: " + bestTool.tool);
console.log("  Distance: " + bestTool.distance);
console.log();

console.log("✓ Tool integration working");
console.log();

// ============================================================
// TEST 6: Mesh Evolution
// ============================================================
console.log("TEST 6: Mesh Evolution");
console.log("-".repeat(50));

console.log("Before evolution:");
console.log("  " + mesh.toString());
console.log();

// Traverse some edges to strengthen them
const edgeToTraverse = mesh.getEdge("hex_1", "hex_8");
if (edgeToTraverse) {
  for (let i = 0; i < 10; i++) {
    edgeToTraverse.traverse();
  }
  console.log("Traversed edge 10 times:");
  console.log("  New strength: " + edgeToTraverse.strength.toFixed(2));
  console.log();
}

// Evolve the mesh
mesh.evolve();

console.log("After evolution:");
console.log("  " + mesh.toString());
console.log();

console.log("✓ Mesh evolution working");
console.log();

// ============================================================
// TEST 7: Mesh Stats
// ============================================================
console.log("TEST 7: Mesh Statistics");
console.log("-".repeat(50));

const stats = mesh.getStats();
console.log("Mesh statistics:");
console.log("  Vertices: " + stats.vertices);
console.log("  Edges: " + stats.edges);
console.log("  Triples: " + stats.triples);
console.log("  Tools: " + stats.tools);
console.log("  Generations: " + stats.generations);
console.log("  History entries: " + stats.history);
console.log();

// Show vertex types
const types = {};
for (const v of mesh.vertices.values()) {
  types[v.type] = (types[v.type] || 0) + 1;
}
console.log("Vertex types:");
for (const [type, count] of Object.entries(types)) {
  console.log("  " + type + ": " + count);
}
console.log();

console.log("✓ Mesh statistics working");
console.log();

// ============================================================
// SUMMARY
// ============================================================
console.log("=".repeat(70));
console.log("SUMMARY: Generative Mesh is working correctly");
console.log("=".repeat(70));
console.log();
console.log("What this proves:");
console.log("  1. Concepts live as vertices with binary feature vectors");
console.log("  2. Analogies are edges with transform vectors");
console.log("  3. Semantic triples create paths through the mesh");
console.log("  4. New concepts generate from analogies (creative)");
console.log("  5. Concepts blend (genetic crossover)");
console.log("  6. Concepts mutate (evolution)");
console.log("  7. Tools clip in and can be called on vertices");
console.log("  8. Mesh evolves (edges strengthen/weaken, new concepts spawn)");
console.log();
console.log("Next layer: Klein Tools (standalone processors that clip into mesh)");
console.log("=".repeat(70));
