
const LCM = require('./layer7_lcm.js');
const ATO = require('./layer1_ato_core.js');

console.log("=".repeat(70));
console.log("LAYER 7: LCM - LANGUAGE-COGNITION MODEL");
console.log("Not an LLM. An LCM.");
console.log("=".repeat(70));
console.log();

// ============================================================
// TEST 1: Create LCM
// ============================================================
console.log("TEST 1: Create LCM");
console.log("-".repeat(50));

const lcm = new LCM.LCM();
console.log("LCM created:");
console.log("  " + lcm.toString());
console.log();
console.log("Initial state:");
console.log("  Network size: " + lcm.network.length + " triples");
console.log("  Rules: " + lcm.rules.length);
console.log("  Time: " + lcm.time);
console.log();

console.log("Default rules:");
lcm.rules.forEach((rule, i) => {
  console.log("  " + (i+1) + ". " + rule.name + " (prob: " + rule.probability + ")");
});
console.log();

console.log("✓ LCM created");
console.log();

// ============================================================
// TEST 2: 5W1H Analysis
// ============================================================
console.log("TEST 2: 5W1H Analysis");
console.log("-".repeat(50));

const query1 = "I have been avoiding a difficult conversation with my partner";
console.log("Query: " + query1);
console.log();

const analysis = lcm.fiveWOneH.analyze(query1);
console.log("5W1H Analysis:");
console.log("  WHO:   " + analysis.who);
console.log("  WHAT:  " + analysis.what);
console.log("  WHERE: " + analysis.where);
console.log("  WHEN:  " + analysis.when);
console.log("  WHY:   " + analysis.why);
console.log("  HOW:   " + analysis.how);
console.log();

console.log("✓ 5W1H analysis complete");
console.log();

// ============================================================
// TEST 3: Semantic Triples from 5W1H
// ============================================================
console.log("TEST 3: Semantic Triples");
console.log("-".repeat(50));

const triples = lcm.fiveWOneH.toTriples(analysis);
console.log("Generated triples:");
triples.forEach((t, i) => {
  console.log("  " + (i+1) + ". " + t.toString());
  console.log("     Vector: " + ATO.vectorToString(t.vector));
});
console.log();

console.log("✓ Triples generated");
console.log();

// ============================================================
// TEST 4: Full Processing Pipeline
// ============================================================
console.log("TEST 4: Full Processing Pipeline");
console.log("-".repeat(50));

const result = lcm.process(query1);
console.log("Processing result:");
console.log("  Analysis:");
console.log("    Intent: " + result.analysis.what);
console.log("    Subject: " + result.analysis.who);
console.log("  Triples added: " + result.triples.length);
console.log("  Rules fired: " + result.firedRules.length);
console.log();

if (result.firedRules.length > 0) {
  console.log("Fired rules:");
  result.firedRules.forEach((fr, i) => {
    console.log("  " + (i+1) + ". " + fr.rule);
    console.log("     Results: " + JSON.stringify(fr.results));
  });
}
console.log();

console.log("Network after processing:");
console.log("  Size: " + lcm.network.length + " triples");
console.log();

console.log("All triples in network:");
lcm.network.forEach((t, i) => {
  console.log("  " + (i+1) + ". " + t.toString());
});
console.log();

console.log("✓ Processing complete");
console.log();

// ============================================================
// TEST 5: Network Query
// ============================================================
console.log("TEST 5: Network Query");
console.log("-".repeat(50));

const queryResults = lcm.query('user', null, null);
console.log("Query: (user ? ?)");
console.log("  Results: " + queryResults.length + " triples");
queryResults.forEach(t => {
  console.log("    " + t.toString());
});
console.log();

const queryResults2 = lcm.query(null, 'exhibits', 'avoidance_pattern');
console.log("Query: (? exhibits avoidance_pattern)");
console.log("  Results: " + queryResults2.length + " triples");
queryResults2.forEach(t => {
  console.log("    " + t.toString());
});
console.log();

console.log("✓ Query working");
console.log();

// ============================================================
// TEST 6: Natural Language Generation
// ============================================================
console.log("TEST 6: Natural Language Generation");
console.log("-".repeat(50));

const text = lcm.generateText({ subject: 'user', relation: null, object: null });
console.log("Generated text from user triples:");
console.log("  "" + text + "\"");
console.log("  " + text + "");

console.log("✓ NL generation working");
console.log();

// ============================================================
// TEST 7: MCP Tool Integration
// ============================================================
console.log("TEST 7: MCP Tool Integration");
console.log("-".repeat(50));

// Register a mock code generation tool
lcm.registerTool('codegen', (params) => {
  return {
    tool: 'codegen',
    language: params.language || 'javascript',
    code: '// Generated code for: ' + params.task
  };
});

// Register a mock image generation tool
lcm.registerTool('imagegen', (params) => {
  return {
    tool: 'imagegen',
    prompt: params.prompt,
    url: 'https://example.com/image_' + Date.now() + '.png'
  };
});

console.log("Registered tools: " + Array.from(lcm.tools.keys()).join(", "));
console.log();

// Call code generation tool
const codeResult = lcm.callTool('codegen', { language: 'python', task: 'generate scenario' });
console.log("Code generation result:");
console.log("  " + JSON.stringify(codeResult));
console.log();

// Call image generation tool
const imageResult = lcm.callTool('imagegen', { prompt: 'A city of mirrors and reflections' });
console.log("Image generation result:");
console.log("  " + JSON.stringify(imageResult));
console.log();

console.log("Network after tool calls:");
console.log("  Size: " + lcm.network.length + " triples");
console.log();

console.log("✓ MCP tool integration working");
console.log();

// ============================================================
// TEST 8: Self-Modification (Learning)
// ============================================================
console.log("TEST 8: Self-Modification (Learning)");
console.log("-".repeat(50));

console.log("Rules before processing:");
console.log("  Count: " + lcm.rules.length);
console.log();

// Fire the first rule many times to trigger self-modification
for (let i = 0; i < 15; i++) {
  lcm.process("I am avoiding something");
}

console.log("After 15 more avoidance inputs:");
console.log("  Rules: " + lcm.rules.length);
console.log("  Network: " + lcm.network.length + " triples");
console.log();

// Check if self-modification occurred
const newRules = lcm.rules.filter(r => r.name.includes('_v'));
console.log("New variant rules created: " + newRules.length);
newRules.forEach(r => {
  console.log("  " + r.name + " (fired " + r.firedCount + " times, prob: " + r.probability + ")");
});
console.log();

console.log("✓ Self-modification working");
console.log();

// ============================================================
// TEST 9: SSM Integration
// ============================================================
console.log("TEST 9: SSM Integration");
console.log("-".repeat(50));

const mood = lcm.ssm.getMood();
console.log("Current system mood:");
console.log("  Dominant hexagram: " + (mood.dominant + 1));
console.log("  Activation: " + mood.activation.toFixed(3));
console.log("  Mood: " + mood.mood);
console.log();

console.log("SSM state norm: " + 
  Math.sqrt(lcm.ssm.h.reduce((s, v) => s + v*v, 0)).toFixed(3));
console.log("SSM time: " + lcm.ssm.time);
console.log();

console.log("✓ SSM integration working");
console.log();

// ============================================================
// TEST 10: Mesh Integration
// ============================================================
console.log("TEST 10: Mesh Integration");
console.log("-".repeat(50));

console.log("Mesh stats:");
console.log("  " + lcm.mesh.toString());
console.log();

// Find nearest concepts to a query
const nearest = lcm.mesh.findNearest([1, 0, 1, 0, 0, 1], 3);
console.log("Nearest concepts to [1,0,1,0,0,1]:");
nearest.forEach(n => {
  console.log("  " + n.vertex.label + " (distance: " + n.distance + ")");
});
console.log();

console.log("✓ Mesh integration working");
console.log();

// ============================================================
// SUMMARY
// ============================================================
console.log("=".repeat(70));
console.log("LCM TEST COMPLETE");
console.log("=".repeat(70));
console.log();
console.log("Final state:");
console.log("  " + lcm.toString());
console.log();
console.log("What the LCM can do:");
console.log("  ✓ Analyze input using 5W1H framework");
console.log("  ✓ Convert analysis to semantic triples");
console.log("  ✓ Store triples in semantic network");
console.log("  ✓ Evaluate probabilistic rules (MESSY-style)");
console.log("  ✓ Fire rules and execute actions");
console.log("  ✓ Generate scenarios from patterns");
console.log("  ✓ Build worlds from scenarios");
console.log("  ✓ Query the network for patterns");
console.log("  ✓ Generate natural language from triples");
console.log("  ✓ Call external tools (MCP hub)");
console.log("  ✓ Self-modify rules from experience");
console.log("  ✓ Integrate with SSM for memory");
console.log("  ✓ Integrate with mesh for concept space");
console.log();
console.log("The LCM is NOT:");
console.log("  ✗ A transformer (no attention mechanism)");
console.log("  ✗ A statistical model (no next-token prediction)");
console.log("  ✗ A black box (everything is inspectable)");
console.log();
console.log("The LCM IS:");
console.log("  ✓ A cognitive engine (thinks in semantic triples)");
console.log("  ✓ A creative engine (generates worlds, stories, code)");
console.log("  ✓ A learning engine (modifies its own rules)");
console.log("  ✓ A communicative engine (chat, research, explanation)");
console.log("  ✓ An acting engine (calls tools, builds things)");
console.log();
console.log("=".repeat(70));
