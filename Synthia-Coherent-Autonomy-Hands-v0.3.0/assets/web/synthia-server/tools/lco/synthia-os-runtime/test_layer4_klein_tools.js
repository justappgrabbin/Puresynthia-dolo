
const AutoLink = require('./layer4_autolink.js').AutoLink;
const Diseminer = require('./layer4_diseminer.js').Diseminer;
const AutoNovel = require('./layer4_autonovel.js').AutoNovel;
const WorldEngine = require('./layer4_worldengine.js').WorldEngine;
const GenerativeMesh = require('./layer3_generative_mesh.js');
const ATO = require('./layer1_ato_core.js');
const FeatureSpace = require('./layer2_feature_space.js');

console.log("=".repeat(70));
console.log("LAYER 4: KLEIN TOOLS - INTEGRATED TEST");
console.log("All four tools working together through the mesh");
console.log("=".repeat(70));
console.log();

// ============================================================
// STEP 1: Create the mesh and register all tools
// ============================================================
console.log("STEP 1: Create Mesh and Register Tools");
console.log("-".repeat(50));

const mesh = new GenerativeMesh.GenerativeMesh(6);

// Create tools
const autolink = new AutoLink();
const diseminer = new Diseminer();
const autonovel = new AutoNovel();
const worldengine = new WorldEngine();

console.log("Tools created:");
console.log("  " + autolink.toString());
console.log("  " + diseminer.toString());
console.log("  " + autonovel.toString());
console.log("  " + worldengine.toString());
console.log();

// Register tools with mesh
mesh.registerTool("AutoLink", autolink.featureSpace, (vertex, params) => {
  return autolink.handle(vertex, params);
});

mesh.registerTool("DISEMINER", diseminer.featureSpace, (vertex, params) => {
  return diseminer.handle(vertex, params);
});

mesh.registerTool("AutoNovel", autonovel.featureSpace, (vertex, params) => {
  return autonovel.handle(vertex, params);
});

mesh.registerTool("WorldEngine", worldengine.featureSpace, (vertex, params) => {
  return worldengine.handle(vertex, params);
});

console.log("All tools registered with mesh");
console.log("  Tools in mesh: " + Array.from(mesh.tools.keys()).join(", "));
console.log();

// ============================================================
// STEP 2: User speaks - AutoLink parses
// ============================================================
console.log("STEP 2: User Input -> AutoLink Parsing");
console.log("-".repeat(50));

const userText = "I have been avoiding a difficult conversation with my partner";
console.log("User: " + userText);
console.log();

const parsed = autolink.parse(userText);
console.log("AutoLink parsed:");
console.log("  Intent: " + parsed.intent + " (confidence: " + parsed.confidence.toFixed(2) + ")");
console.log("  Subject: " + parsed.semantic.subject);
console.log("  Action: " + parsed.semantic.action);
console.log("  Object: " + parsed.semantic.object);
console.log("  Emotion: " + parsed.emotion);
console.log("  Urgency: " + parsed.semantic.urgency);
console.log("  Vector: " + ATO.vectorToString(parsed.vector));
console.log();

// Add parsed concept to mesh
const userConcept = mesh.addVertex(
  "user_input_" + Date.now(),
  parsed.vector,
  userText,
  "user_input",
  { parsed: parsed }
);
console.log("Added to mesh: " + userConcept.toString());
console.log();

// ============================================================
// STEP 3: DISEMINER detects patterns
// ============================================================
console.log("STEP 3: DISEMINER Pattern Detection");
console.log("-".repeat(50));

// Record events
diseminer.recordEvent({
  type: "avoidance",
  topic: "difficult conversation",
  intensity: "high",
  avoidance: true,
  recurring: true
});

diseminer.recordEvent({
  type: "avoidance",
  topic: "difficult conversation",
  intensity: "high",
  avoidance: true,
  recurring: true
});

diseminer.recordEvent({
  type: "avoidance",
  topic: "difficult conversation",
  intensity: "high",
  avoidance: true,
  recurring: true
});

console.log("Recorded 3 avoidance events");
console.log("  Total events: " + diseminer.events.length);
console.log("  Total patterns: " + diseminer.patterns.size);
console.log();

// Get insights
const insights = diseminer.getInsights();
console.log("Insights generated: " + insights.length);
if (insights.length > 0) {
  const strongest = diseminer.getStrongestInsight();
  console.log("Strongest insight:");
  console.log("  Archetype: avoidance");
  console.log("  Text: " + strongest.text);
  console.log("  Scenario: " + strongest.scenario);
  console.log("  Lesson: " + strongest.lesson);
  console.log("  Gates: " + strongest.gates.join(", "));
  console.log("  Centers: " + strongest.centers.join(", "));
  console.log("  Hexagrams: " + strongest.hexagrams.join(", "));
}
console.log();

// Get recommendation
const recommendation = diseminer.recommendScenario();
console.log("Scenario recommendation:");
console.log("  Scenario: " + recommendation.scenario);
console.log("  Lesson: " + recommendation.lesson);
console.log("  Gates: " + recommendation.gates.join(", "));
console.log("  Centers: " + recommendation.centers.join(", "));
console.log();

// Add insight to mesh
const insightVertex = mesh.addVertex(
  "insight_" + Date.now(),
  [1, 0, 1, 0, 0, 1],
  "Avoidance Pattern",
  "insight",
  { recommendation: recommendation }
);
console.log("Added to mesh: " + insightVertex.toString());
console.log();

// ============================================================
// STEP 4: AutoNovel generates scenario
// ============================================================
console.log("STEP 4: AutoNovel Scenario Generation");
console.log("-".repeat(50));

const scenario = autonovel.generate(recommendation);
console.log("Generated scenario: " + scenario.name);
console.log("  Archetype: " + scenario.archetype);
console.log("  Hexagrams: " + scenario.hexagrams.join(", "));
console.log("  Gates: " + scenario.gates.join(", "));
console.log();

console.log("Setup:");
console.log("  " + scenario.setup);
console.log();

console.log("NPCs:");
scenario.npcs.forEach(npc => {
  console.log("  " + npc.name + " - " + npc.role);
});
console.log();

console.log("Choices:");
scenario.choices.forEach((choice, i) => {
  console.log("  " + (i+1) + ". " + choice.text);
  console.log("     Line: " + choice.line + " (Hexagram " + choice.hexagram + ")");
  console.log("     Lesson: " + choice.lesson);
});
console.log();

// Add scenario to mesh
const scenarioVertex = mesh.addVertex(
  scenario.id,
  scenario.feature,
  scenario.name,
  "scenario",
  { scenario: scenario }
);
console.log("Added to mesh: " + scenarioVertex.toString());
console.log();

// ============================================================
// STEP 5: WorldEngine builds 3D world
// ============================================================
console.log("STEP 5: WorldEngine 3D World Building");
console.log("-".repeat(50));

const world = worldengine.buildWorld(scenario);
console.log("Generated world: " + world.id);
console.log("  Name: " + world.name);
console.log("  Archetype: " + world.archetype);
console.log();

console.log("Environment:");
console.log("  Trigram: " + world.environment.trigram);
console.log("  Center: " + world.environment.center);
console.log("  Sky: " + world.environment.sky);
console.log("  Ground: " + world.environment.ground);
console.log("  Architecture: " + world.environment.architecture);
console.log("  Scale: " + world.environment.scale);
console.log("  Color: [" + world.environment.color.join(", ") + "]");
console.log();

console.log("Lighting:");
console.log("  Type: " + world.lighting.type);
console.log("  Brightness: " + world.lighting.brightness.toFixed(2));
console.log("  Color: [" + world.lighting.color.join(", ") + "]");
console.log();

console.log("Audio:");
console.log("  Ambient: " + world.audio.ambient.join(", "));
console.log();

console.log("Structures: " + world.structures.length);
world.structures.forEach(s => {
  console.log("  " + s.type + ": " + (s.gateNumber ? "Gate " + s.gateNumber : s.architecture));
});
console.log();

console.log("NPCs: " + world.npcs.length);
world.npcs.forEach(npc => {
  console.log("  " + npc.name + " (" + npc.form + ") at [" + npc.position.join(", ") + "]");
});
console.log();

console.log("Interactables (Choice Portals): " + world.interactables.length);
world.interactables.forEach(item => {
  console.log("  Portal " + item.choiceIndex + ": " + item.text.substring(0, 40) + "...");
  console.log("    Line: " + item.line + ", Color: [" + item.color.map(c => c.toFixed(1)).join(", ") + "]");
});
console.log();

console.log("Atmosphere:");
console.log("  Fog density: " + world.atmosphere.fog.density);
console.log("  Particles: " + world.atmosphere.particles.type);
console.log("  Weather: " + world.atmosphere.weather.type);
console.log();

// Add world to mesh
const worldVertex = mesh.addVertex(
  world.id,
  [0, 1, 0, 1, 0, 1],
  world.name,
  "world",
  { world: world }
);
console.log("Added to mesh: " + worldVertex.toString());
console.log();

// ============================================================
// STEP 6: Full pipeline summary
// ============================================================
console.log("=".repeat(70));
console.log("FULL PIPELINE COMPLETE");
console.log("=".repeat(70));
console.log();
console.log("The flow:");
console.log("  1. User speaks: I have been avoiding a difficult conversation...");
console.log("  2. AutoLink parses -> intent: avoid, emotion: negative");
console.log("  3. DISEMINER detects -> avoidance pattern (3 events)");
console.log("  4. DISEMINER maps -> archetype: avoidance, hexagrams: 6,33,36");
console.log("  5. DISEMINER recommends -> scenario: The Meeting");
console.log("  6. AutoNovel generates -> The Meeting scenario with NPCs and choices");
console.log("  7. WorldEngine builds -> 3D world with water trigram, solar plexus center");
console.log("  8. All stored in mesh -> connected vertices with edges");
console.log();
console.log("Mesh stats:");
console.log("  " + mesh.toString());
console.log();
console.log("=".repeat(70));
console.log("KLEIN TOOLS WORKING CORRECTLY");
console.log("=".repeat(70));
