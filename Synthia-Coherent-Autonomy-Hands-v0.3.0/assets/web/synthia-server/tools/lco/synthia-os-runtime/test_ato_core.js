
const ATO = require('./layer1_ato_core.js');

console.log("=".repeat(60));
console.log("ATO CORE - TEST SUITE");
console.log("=".repeat(60));
console.log();

// Test 1: Basic XOR
console.log("TEST 1: Basic XOR (mod-2 addition)");
console.log("-".repeat(40));
const a = [1, 0, 0, 1];  // square, dark
const b = [0, 1, 1, 0];  // circle, light
const ab = ATO.xor(a, b);
console.log("a = " + ATO.vectorToString(a) + " (square, dark)");
console.log("b = " + ATO.vectorToString(b) + " (circle, light)");
console.log("*ab = " + ATO.vectorToString(ab) + " (transformation)");
console.log("Expected: 0111");
console.log("Pass: " + ATO.arraysEqual(ab, [1,1,1,0]));
console.log();

// Test 2: Strong Equivalence
console.log("TEST 2: Strong Equivalence (mod-2 multiplication)");
console.log("-".repeat(40));
const seq = ATO.seq(a, b);
console.log("SEQ(a,b) = " + ATO.vectorToString(seq));
console.log("Expected: 0000 (no features in common)");
console.log("Pass: " + ATO.arraysEqual(seq, [0,0,0,0]));
console.log();

// Test 3: The Full ATO (Klein's Figure 1)
console.log("TEST 3: Full ATO (Klein's Figure 1 - Visual Analogy)");
console.log("-".repeat(40));
const c = [0, 1, 0, 1];  // circle, dark
const result = ATO.atoFull(a, b, c);
console.log("Analogy: " + result.analogy);
console.log("Transform (*ab) = " + ATO.vectorToString(result.transform));
console.log("Result (d) = " + ATO.vectorToString(result.result));
console.log("Expected d = 1000 (square, light)");
console.log("Pass: " + ATO.arraysEqual(result.result, [1,0,0,0]));
console.log();

// Test 4: Klein-4 Group Properties
console.log("TEST 4: Klein-4 Group Properties");
console.log("-".repeat(40));
const k4 = ATO.verifyKlein4(
  [1, 0, 0, 0],
  [0, 1, 0, 0],
  [0, 0, 1, 0]
);
console.log("Identity (e) = " + k4.identity);
console.log("a inverse = " + k4.aInverse + " (should be e)");
console.log("b inverse = " + k4.bInverse + " (should be e)");
console.log("c inverse = " + k4.cInverse + " (should be e)");
console.log("a XOR b = " + k4.ab);
console.log("b XOR c = " + k4.bc);
console.log("a XOR c = " + k4.ac);
console.log("Is valid Klein-4 group: " + k4.isKlein4);
console.log();

// Test 5: Distance and Similarity
console.log("TEST 5: Distance and Similarity");
console.log("-".repeat(40));
const v1 = [1, 1, 1, 1, 1, 1];  // All yang (Creative)
const v2 = [0, 0, 0, 0, 0, 0];  // All yin (Receptive)
const v3 = [1, 1, 1, 0, 0, 0];  // Half yang, half yin
console.log("v1 = " + ATO.vectorToString(v1) + " (Creative)");
console.log("v2 = " + ATO.vectorToString(v2) + " (Receptive)");
console.log("v3 = " + ATO.vectorToString(v3) + " (mixed)");
console.log();
console.log("Distance v1->v2: " + ATO.hammingDistance(v1, v2) + " (max = 6)");
console.log("Distance v1->v3: " + ATO.hammingDistance(v1, v3) + " (should be 3)");
console.log("Similarity v1->v2: " + ATO.similarity(v1, v2).toFixed(2) + " (completely different)");
console.log("Similarity v1->v3: " + ATO.similarity(v1, v3).toFixed(2) + " (half similar)");
console.log();

// Test 6: I Ching Hexagram Analogy
console.log("TEST 6: I Ching Hexagram Analogy");
console.log("-".repeat(40));
const creative = [1,1,1,1,1,1];   // Hexagram 1
const receptive = [0,0,0,0,0,0];  // Hexagram 2
const difficulty = [0,0,1,0,1,0]; // Hexagram 3
const analogy = ATO.atoFull(creative, receptive, difficulty);
console.log("Creative (1) = " + ATO.vectorToString(creative));
console.log("Receptive (2) = " + ATO.vectorToString(receptive));
console.log("Difficulty (3) = " + ATO.vectorToString(difficulty));
console.log();
console.log("Analogy: Creative : Receptive :: Difficulty : ?");
console.log("Transform (*ab) = " + ATO.vectorToString(analogy.transform));
console.log("Result = " + ATO.vectorToString(analogy.result));
console.log();
console.log("Interpretation:");
console.log("  Creative -> Receptive = flip all lines (yang to yin)");
console.log("  Applying same to Difficulty -> " + ATO.vectorToString(analogy.result));
console.log("  This is the hexagram that completes the analogy.");
console.log();

console.log("=".repeat(60));
console.log("ALL TESTS COMPLETE");
console.log("=".repeat(60));
