/**
 * Feature Space - I Ching Hexagrams as Hypercube Vertices
 * ========================================================
 * 
 * Each of the 64 I Ching hexagrams is a 6-bit binary vector.
 * These vectors are vertices on a 6-dimensional hypercube.
 * 
 * The 6 dimensions correspond to the 6 lines of a hexagram:
 *   Line 6 (top)    = bit 5 (most significant)
 *   Line 5          = bit 4
 *   Line 4          = bit 3
 *   Line 3          = bit 2
 *   Line 2          = bit 1
 *   Line 1 (bottom) = bit 0 (least significant)
 * 
 * Yang (solid) line = 1
 * Yin (broken) line = 0
 * 
 * Example: Hexagram 1 (The Creative)
 *   Lines: 6 yang, 5 yang, 4 yang, 3 yang, 2 yang, 1 yang
 *   Vector: [1, 1, 1, 1, 1, 1] = 63 decimal
 * 
 * Example: Hexagram 2 (The Receptive)
 *   Lines: 6 yin, 5 yin, 4 yin, 3 yin, 2 yin, 1 yin
 *   Vector: [0, 0, 0, 0, 0, 0] = 0 decimal
 * 
 * The hypercube has:
 *   64 vertices (one per hexagram)
 *   192 edges (each vertex connects to 6 neighbors)
 *   But we only use 32 edges (the Human Design channels)
 * 
 * Distance between hexagrams = Hamming distance
 *   = number of differing lines
 *   = number of lines that need to change to transform one into another
 * 
 * This distance IS the "work" required to move between states.
 */

const ATO = require('./layer1_ato_core.js');

// ============================================================
// SECTION 1: HEXAGRAM DEFINITIONS
// ============================================================

/**
 * All 64 I Ching hexagrams as binary vectors.
 * Ordered by King Wen sequence (traditional order).
 */
const HEXAGRAMS = {
  // Upper Trigram: Heaven (111)
  1:  { name: "The Creative",         vector: [1,1,1,1,1,1], trigram: "heaven",   nature: "strong" },
  // Upper Trigram: Earth (000)
  2:  { name: "The Receptive",        vector: [0,0,0,0,0,0], trigram: "earth",    nature: "yielding" },
  // Upper Trigram: Water (010)
  3:  { name: "Difficulty at Beginning", vector: [0,0,1,0,1,0], trigram: "water", nature: "chaos" },
  // Upper Trigram: Mountain (100)
  4:  { name: "Youthful Folly",       vector: [0,0,0,1,0,0], trigram: "mountain", nature: "inexperience" },
  // Upper Trigram: Water (010)
  5:  { name: "Waiting",              vector: [0,1,1,0,1,0], trigram: "water",    nature: "patience" },
  // Upper Trigram: Heaven (111)
  6:  { name: "Conflict",             vector: [0,0,0,1,1,0], trigram: "heaven",   nature: "dispute" },
  // Upper Trigram: Earth (000)
  7:  { name: "The Army",             vector: [0,0,0,0,1,0], trigram: "earth",    nature: "collective" },
  // Upper Trigram: Earth (000)
  8:  { name: "Holding Together",     vector: [0,0,0,0,0,1], trigram: "earth",    nature: "union" },
  // Upper Trigram: Heaven (111)
  9:  { name: "Small Taming",         vector: [1,1,1,0,1,0], trigram: "heaven",   nature: "restraint" },
  // Upper Trigram: Lake (011)
  10: { name: "Treading",             vector: [0,1,1,1,1,0], trigram: "lake",     nature: "caution" },
  // Upper Trigram: Earth (000)
  11: { name: "Peace",                vector: [1,1,1,0,0,0], trigram: "earth",    nature: "harmony" },
  // Upper Trigram: Heaven (111)
  12: { name: "Standstill",           vector: [0,0,0,1,1,1], trigram: "heaven",   nature: "stagnation" },
  // Upper Trigram: Heaven (111)
  13: { name: "Fellowship",           vector: [1,1,1,1,0,1], trigram: "heaven",   nature: "community" },
  // Upper Trigram: Fire (101)
  14: { name: "Great Possession",     vector: [1,1,1,1,0,1], trigram: "fire",     nature: "abundance" },
  // Upper Trigram: Mountain (100)
  15: { name: "Modesty",              vector: [0,0,1,0,0,0], trigram: "mountain", nature: "humility" },
  // Upper Trigram: Earth (000)
  16: { name: "Enthusiasm",           vector: [0,0,0,1,0,0], trigram: "earth",    nature: "joy" },
  // Upper Trigram: Lake (011)
  17: { name: "Following",            vector: [0,1,1,0,0,1], trigram: "lake",     nature: "adaptation" },
  // Upper Trigram: Mountain (100)
  18: { name: "Work on Decay",        vector: [1,0,0,1,1,0], trigram: "mountain", nature: "repair" },
  // Upper Trigram: Earth (000)
  19: { name: "Approach",             vector: [0,0,0,1,1,1], trigram: "earth",    nature: "advance" },
  // Upper Trigram: Wind (110)
  20: { name: "Contemplation",        vector: [1,1,0,0,0,0], trigram: "wind",     nature: "observation" },
  // Upper Trigram: Fire (101)
  21: { name: "Biting Through",       vector: [1,0,1,1,0,1], trigram: "fire",     nature: "penetration" },
  // Upper Trigram: Mountain (100)
  22: { name: "Grace",                vector: [1,0,0,1,1,1], trigram: "mountain", nature: "beauty" },
  // Upper Trigram: Mountain (100)
  23: { name: "Splitting Apart",      vector: [1,0,0,0,0,0], trigram: "mountain", nature: "dissolution" },
  // Upper Trigram: Earth (000)
  24: { name: "Return",               vector: [0,0,0,0,0,1], trigram: "earth",    nature: "cycle" },
  // Upper Trigram: Heaven (111)
  25: { name: "Innocence",            vector: [1,1,1,0,0,1], trigram: "heaven",   nature: "purity" },
  // Upper Trigram: Mountain (100)
  26: { name: "Great Taming",         vector: [1,0,0,1,0,0], trigram: "mountain", nature: "control" },
  // Upper Trigram: Mountain (100)
  27: { name: "Nourishment",          vector: [1,0,0,0,0,1], trigram: "mountain", nature: "sustenance" },
  // Upper Trigram: Lake (011)
  28: { name: "Great Excess",         vector: [0,1,1,1,1,1], trigram: "lake",     nature: "overload" },
  // Upper Trigram: Water (010)
  29: { name: "The Abysmal",          vector: [0,1,0,0,1,0], trigram: "water",    nature: "danger" },
  // Upper Trigram: Fire (101)
  30: { name: "The Clinging",         vector: [1,0,1,1,0,1], trigram: "fire",     nature: "radiance" },
  // Upper Trigram: Lake (011)
  31: { name: "Influence",            vector: [0,1,1,0,0,0], trigram: "lake",     nature: "attraction" },
  // Upper Trigram: Thunder (001)
  32: { name: "Duration",             vector: [0,0,1,0,0,0], trigram: "thunder",  nature: "permanence" },
  // Upper Trigram: Heaven (111)
  33: { name: "Retreat",              vector: [1,1,1,0,0,0], trigram: "heaven",   nature: "withdrawal" },
  // Upper Trigram: Heaven (111)
  34: { name: "Great Power",          vector: [1,1,1,0,0,1], trigram: "heaven",   nature: "strength" },
  // Upper Trigram: Fire (101)
  35: { name: "Progress",             vector: [0,0,0,1,0,1], trigram: "fire",     nature: "advancement" },
  // Upper Trigram: Earth (000)
  36: { name: "Darkening of Light",   vector: [1,0,1,0,0,0], trigram: "earth",    nature: "adversity" },
  // Upper Trigram: Wind (110)
  37: { name: "The Family",           vector: [1,1,0,0,1,0], trigram: "wind",     nature: "clan" },
  // Upper Trigram: Lake (011)
  38: { name: "Opposition",           vector: [0,1,1,0,1,0], trigram: "lake",     nature: "conflict" },
  // Upper Trigram: Water (010)
  39: { name: "Obstruction",          vector: [0,1,0,0,0,1], trigram: "water",    nature: "difficulty" },
  // Upper Trigram: Thunder (001)
  40: { name: "Deliverance",          vector: [0,0,1,0,1,1], trigram: "thunder",  nature: "release" },
  // Upper Trigram: Mountain (100)
  41: { name: "Decrease",             vector: [1,0,0,0,1,0], trigram: "mountain", nature: "reduction" },
  // Upper Trigram: Thunder (001)
  42: { name: "Increase",             vector: [0,0,1,1,0,0], trigram: "thunder",  nature: "growth" },
  // Upper Trigram: Heaven (111)
  43: { name: "Breakthrough",         vector: [1,1,1,1,1,0], trigram: "heaven",   nature: "resolution" },
  // Upper Trigram: Heaven (111)
  44: { name: "Coming to Meet",     vector: [1,1,1,1,1,0], trigram: "heaven",   nature: "encounter" },
  // Upper Trigram: Earth (000)
  45: { name: "Gathering",            vector: [0,0,0,1,1,0], trigram: "earth",    nature: "assembly" },
  // Upper Trigram: Lake (011)
  46: { name: "Pushing Upward",       vector: [0,1,1,0,0,0], trigram: "lake",     nature: "elevation" },
  // Upper Trigram: Water (010)
  47: { name: "Exhaustion",           vector: [0,1,0,1,1,0], trigram: "water",    nature: "oppression" },
  // Upper Trigram: Water (010)
  48: { name: "The Well",             vector: [0,1,0,0,1,1], trigram: "water",    nature: "source" },
  // Upper Trigram: Lake (011)
  49: { name: "Revolution",           vector: [0,1,1,1,0,1], trigram: "lake",     nature: "change" },
  // Upper Trigram: Fire (101)
  50: { name: "The Cauldron",         vector: [1,0,1,1,1,0], trigram: "fire",     nature: "transformation" },
  // Upper Trigram: Thunder (001)
  51: { name: "The Arousing",         vector: [0,0,1,0,0,1], trigram: "thunder",  nature: "shock" },
  // Upper Trigram: Mountain (100)
  52: { name: "Keeping Still",        vector: [1,0,0,1,0,0], trigram: "mountain", nature: "meditation" },
  // Upper Trigram: Wind (110)
  53: { name: "Development",          vector: [1,1,0,0,0,1], trigram: "wind",     nature: "gradual" },
  // Upper Trigram: Thunder (001)
  54: { name: "Marrying Maiden",      vector: [0,0,1,1,0,1], trigram: "thunder",  nature: "transition" },
  // Upper Trigram: Fire (101)
  55: { name: "Abundance",            vector: [1,0,1,1,1,1], trigram: "fire",     nature: "fullness" },
  // Upper Trigram: Fire (101)
  56: { name: "The Wanderer",         vector: [1,0,1,0,0,0], trigram: "fire",     nature: "travel" },
  // Upper Trigram: Wind (110)
  57: { name: "The Gentle",           vector: [1,1,0,1,1,0], trigram: "wind",     nature: "penetration" },
  // Upper Trigram: Lake (011)
  58: { name: "The Joyous",           vector: [0,1,1,0,1,1], trigram: "lake",     nature: "pleasure" },
  // Upper Trigram: Wind (110)
  59: { name: "Dispersion",           vector: [1,1,0,0,1,1], trigram: "wind",     nature: "dissolution" },
  // Upper Trigram: Water (010)
  60: { name: "Limitation",           vector: [0,1,0,1,1,1], trigram: "water",    nature: "restriction" },
  // Upper Trigram: Wind (110)
  61: { name: "Inner Truth",          vector: [1,1,0,0,0,1], trigram: "wind",     nature: "sincerity" },
  // Upper Trigram: Thunder (001)
  62: { name: "Small Excess",         vector: [0,0,1,1,1,0], trigram: "thunder",  nature: "imbalance" },
  // Upper Trigram: Water (010)
  63: { name: "Already Fulfilled",    vector: [0,1,0,1,0,1], trigram: "water",    nature: "completion" },
  // Upper Trigram: Fire (101)
  64: { name: "Not Yet Fulfilled",    vector: [1,0,1,0,1,0], trigram: "fire",     nature: "incompletion" }
};

// ============================================================
// SECTION 2: TRIGRAMS (The 8 Fundamental Forces)
// ============================================================

const TRIGRAMS = {
  heaven:   { vector: [1,1,1], element: "air",    quality: "creative",   symbol: "☰" },
  earth:    { vector: [0,0,0], element: "earth",  quality: "receptive",  symbol: "☷" },
  water:    { vector: [0,1,0], element: "water",  quality: "abysmal",    symbol: "☵" },
  fire:     { vector: [1,0,1], element: "fire",   quality: "clinging",   symbol: "☲" },
  thunder:  { vector: [0,0,1], element: "wood",   quality: "arousing",   symbol: "☳" },
  wind:     { vector: [1,1,0], element: "wood",   quality: "gentle",     symbol: "☴" },
  mountain: { vector: [1,0,0], element: "earth",  quality: "keeping",    symbol: "☶" },
  lake:     { vector: [0,1,1], element: "metal",  quality: "joyous",     symbol: "☱" }
};

// ============================================================
// SECTION 3: HYPERCUBE GEOMETRY
// ============================================================

/**
 * Get the upper and lower trigrams of a hexagram.
 * Upper = lines 4,5,6 (bits 3,4,5)
 * Lower = lines 1,2,3 (bits 0,1,2)
 */
function getTrigrams(hexagramNum) {
  const hex = HEXAGRAMS[hexagramNum];
  if (!hex) return null;

  const upper = [hex.vector[5], hex.vector[4], hex.vector[3]]; // lines 6,5,4
  const lower = [hex.vector[2], hex.vector[1], hex.vector[0]]; // lines 3,2,1

  // Find which trigram names match
  let upperName = null, lowerName = null;
  for (const [name, data] of Object.entries(TRIGRAMS)) {
    if (ATO.arraysEqual(upper, data.vector)) upperName = name;
    if (ATO.arraysEqual(lower, data.vector)) lowerName = name;
  }

  return { upper: upperName, lower: lowerName, upperVec: upper, lowerVec: lower };
}

/**
 * Compute distance between two hexagrams.
 * This is the Hamming distance = number of lines that differ.
 * It is also the "work" required to transform one into the other.
 */
function hexagramDistance(hex1, hex2) {
  const h1 = HEXAGRAMS[hex1]?.vector;
  const h2 = HEXAGRAMS[hex2]?.vector;
  if (!h1 || !h2) return null;
  return ATO.hammingDistance(h1, h2);
}

/**
 * Find all hexagrams within a given distance of a target.
 * This defines the "neighborhood" of a concept in feature space.
 */
function findNeighbors(hexNum, maxDistance = 2) {
  const neighbors = [];
  for (let i = 1; i <= 64; i++) {
    if (i === hexNum) continue;
    const dist = hexagramDistance(hexNum, i);
    if (dist !== null && dist <= maxDistance) {
      neighbors.push({ hexagram: i, distance: dist, name: HEXAGRAMS[i].name });
    }
  }
  return neighbors.sort((a, b) => a.distance - b.distance);
}

/**
 * Compute the analogical transformation between two hexagrams.
 * Returns: the transformation vector and what it means.
 */
function hexagramAnalogy(a, b, c) {
  const ha = HEXAGRAMS[a]?.vector;
  const hb = HEXAGRAMS[b]?.vector;
  const hc = HEXAGRAMS[c]?.vector;

  if (!ha || !hb || !hc) return null;

  const result = ATO.atoFull(ha, hb, hc);

  // Find which hexagram the result corresponds to
  let resultHex = null;
  for (let i = 1; i <= 64; i++) {
    if (ATO.arraysEqual(result.result, HEXAGRAMS[i].vector)) {
      resultHex = i;
      break;
    }
  }

  return {
    analogy: `${HEXAGRAMS[a].name} : ${HEXAGRAMS[b].name} :: ${HEXAGRAMS[c].name} : ${resultHex ? HEXAGRAMS[resultHex].name : 'unknown'}`,
    transform: result.transform,
    result: result.result,
    resultHexagram: resultHex,
    changingLines: result.transform.map((bit, i) => bit === 1 ? 6 - i : null).filter(x => x !== null)
  };
}

// ============================================================
// SECTION 4: HUMAN DESIGN CHANNELS (The 32 Edges)
// ============================================================

/**
 * The 32 Human Design channels are edges in the hypercube.
 * Each channel connects two hexagrams (gates) that share
 * a complementary relationship.
 */
const CHANNELS = [
  { gate1: 1,  gate2: 8,  name: "Inspiration",         center1: "head",       center2: "throat" },
  { gate1: 2,  gate2: 14, name: "Beat",                center1: "g_center",   center2: "sacral" },
  { gate1: 3,  gate2: 60, name: "Mutation",            center1: "sacral",     center2: "root" },
  { gate1: 4,  gate2: 63, name: "Logic",               center1: "ajna",       center2: "head" },
  { gate1: 5,  gate2: 15, name: "Rhythm",              center1: "sacral",     center2: "g_center" },
  { gate1: 6,  gate2: 59, name: "Mating",              center1: "solar",      center2: "sacral" },
  { gate1: 7,  gate2: 31, name: "Alpha",               center1: "ajna",       center2: "throat" },
  { gate1: 9,  gate2: 52, name: "Concentration",       center1: "sacral",     center2: "root" },
  { gate1: 10, gate2: 34, name: "Exploration",         center1: "g_center",   center2: "sacral" },
  { gate1: 11, gate2: 56, name: "Curiosity",           center1: "ajna",       center2: "throat" },
  { gate1: 12, gate2: 22, name: "Openness",            center1: "throat",     center2: "solar" },
  { gate1: 13, gate2: 33, name: "Prodigal",            center1: "g_center",   center2: "throat" },
  { gate1: 16, gate2: 48, name: "Wavelength",          center1: "throat",     center2: "spleen" },
  { gate1: 17, gate2: 62, name: "Acceptance",          center1: "ajna",       center2: "throat" },
  { gate1: 18, gate2: 58, name: "Judgment",            center1: "spleen",     center2: "root" },
  { gate1: 19, gate2: 49, name: "Synthesis",           center1: "root",       center2: "solar" },
  { gate1: 20, gate2: 34, name: "Charisma",            center1: "throat",     center2: "sacral" },
  { gate1: 21, gate2: 45, name: "Money",               center1: "ego",        center2: "throat" },
  { gate1: 23, gate2: 43, name: "Structuring",         center1: "ajna",       center2: "throat" },
  { gate1: 24, gate2: 61, name: "Awareness",           center1: "ajna",       center2: "head" },
  { gate1: 25, gate2: 51, name: "Initiation",          center1: "g_center",   center2: "ego" },
  { gate1: 26, gate2: 44, name: "Transmission",        center1: "ego",        center2: "spleen" },
  { gate1: 27, gate2: 50, name: "Preservation",        center1: "sacral",     center2: "spleen" },
  { gate1: 28, gate2: 38, name: "Struggle",            center1: "spleen",     center2: "root" },
  { gate1: 29, gate2: 46, name: "Discovery",           center1: "sacral",     center2: "g_center" },
  { gate1: 30, gate2: 41, name: "Recognition",         center1: "solar",      center2: "root" },
  { gate1: 32, gate2: 54, name: "Transformation",      center1: "spleen",     center2: "root" },
  { gate1: 35, gate2: 36, name: "Transitoriness",      center1: "solar",      center2: "solar" },
  { gate1: 37, gate2: 40, name: "Community",           center1: "solar",      center2: "ego" },
  { gate1: 39, gate2: 55, name: "Emoting",             center1: "root",       center2: "solar" },
  { gate1: 42, gate2: 53, name: "Maturation",          center1: "sacral",     center2: "root" },
  { gate1: 47, gate2: 64, name: "Abstract",            center1: "ajna",       center2: "head" }
];

// ============================================================
// SECTION 5: EXPORT
// ============================================================

const CENTER_GATES = {
  head: [64, 61, 63],
  ajna: [47, 24, 4, 11],
  throat: [56, 62, 23, 43, 20, 8, 31, 33, 12, 45],
  g_center: [1, 13, 25, 46, 2, 15, 10, 7, 44],
  ego: [51, 21, 26, 40],
  sacral: [5, 14, 29, 59, 9, 3, 42, 27, 34],
  root: [58, 38, 54, 19, 39, 41, 53, 60, 52],
  spleen: [48, 18, 57, 28, 44, 50, 32],
  solar_plexus: [55, 30, 36, 22, 6, 37, 49, 63]
};

const FeatureSpace = {
  HEXAGRAMS,
  TRIGRAMS,
  CHANNELS,
  CENTER_GATES,
  getTrigrams,
  hexagramDistance,
  findNeighbors,
  hexagramAnalogy
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = FeatureSpace;
}

if (typeof window !== 'undefined') {
  window.FeatureSpace = FeatureSpace;
}
