/**
 * ATO Core - Analogical Transformation Operator
 * ============================================
 * Based on Sheldon Klein's "Analogical Foundations of Creativity"
 * (1999/2002)
 *
 * The fundamental insight: analogy is not metaphor or similarity.
 * Analogy is a COMPUTABLE OPERATION on binary feature vectors.
 *
 * Given two concepts a and b, represented as binary feature vectors,
 * the ATO *ab computes the TRANSFORMATION that maps a to b.
 *
 * This transformation can then be applied to a third concept c
 * to derive a new concept d = *c*ab
 *
 * This is how creativity works: new concepts are derived from
 * analogies between existing ones.
 *
 * The operators:
 * - XOR (exclusive OR): the difference between two vectors
 * - SEQ (strong equivalence): the sameness between two vectors
 * - ATO: the analogical transformation operator
 *
 * All three are based on the Klein-4 group structure.
 */

// ============================================================
// SECTION 1: BINARY VECTOR OPERATIONS
// ============================================================

/**
 * XOR (Exclusive OR) - mod-2 addition
 * Computes the DIFFERENCE between two binary vectors.
 *
 * In Klein's terms: *ab = a XOR b
 * This gives the transformation that maps a to b.
 *
 * Example:
 *   a = [1, 0, 1, 1]  (feature vector for concept A)
 *   b = [1, 1, 0, 1]  (feature vector for concept B)
 *   *ab = [0, 1, 1, 0]  (the transformation)
 *
 * This means: to get from A to B, flip features 2 and 3.
 */
function xor(a, b) {
  if (a.length !== b.length) {
    throw new Error(`Vector length mismatch: ${a.length} vs ${b.length}`);
  }
  return a.map((bit, i) => (bit === b[i] ? 0 : 1));
}

/**
 * SEQ (Strong Equivalence) - mod-2 multiplication of signs
 * Computes the SAMENESS between two binary vectors.
 *
 * In Klein's terms: SEQ(a,b) = a AND b (in a signed sense)
 * Where +1 * +1 = +1, -1 * -1 = +1, +1 * -1 = -1
 *
 * Mapped to binary:
 *   T * T = T, F * F = T, T * F = F
 *   1 * 1 = 1, 0 * 0 = 1, 1 * 0 = 0
 *
 * This is the "strong equivalence" operator from Klein's Table 2.
 */
function seq(a, b) {
  if (a.length !== b.length) {
    throw new Error(`Vector length mismatch: ${a.length} vs ${b.length}`);
  }
  return a.map((bit, i) => (bit === b[i] ? 1 : 0));
}

/**
 * NOT - bitwise complement
 * Flips all bits in a vector.
 */
function not(a) {
  return a.map(bit => (bit === 1 ? 0 : 1));
}

/**
 * AND - bitwise AND
 */
function and(a, b) {
  if (a.length !== b.length) {
    throw new Error(`Vector length mismatch: ${a.length} vs ${b.length}`);
  }
  return a.map((bit, i) => (bit === 1 && b[i] === 1 ? 1 : 0));
}

/**
 * OR - bitwise OR
 */
function or(a, b) {
  if (a.length !== b.length) {
    throw new Error(`Vector length mismatch: ${a.length} vs ${b.length}`);
  }
  return a.map((bit, i) => (bit === 1 || b[i] === 1 ? 1 : 0));
}

// ============================================================
// SECTION 2: THE ANALOGICAL TRANSFORMATION OPERATOR (ATO)
// ============================================================

/**
 * ATO - Analogical Transformation Operator
 * The core of Klein's system.
 *
 * Given: a, b, c (three binary feature vectors)
 * Compute: d = *c*ab
 *
 * Where:
 *   *ab = a XOR b  (the transformation from a to b)
 *   *c*ab = c XOR *ab  (apply that transformation to c)
 *
 * This derives a NEW concept d from the analogy between a:b and c:d.
 *
 * Example from Klein's paper (Figure 1):
 *   a = [1,0,0,1]  (square, dark)
 *   b = [0,1,1,0]  (circle, light)
 *   c = [0,1,0,1]  (circle, dark)
 *   *ab = [1,1,1,1]  (flip all features)
 *   d = *c*ab = [1,0,1,0]  (square, light)
 *
 * The analogy: a is to b as c is to d
 *   square-dark : circle-light :: circle-dark : square-light
 */
function ato(a, b, c) {
  const transform = xor(a, b);  // *ab
  return xor(c, transform);      // *c*ab = d
}

/**
 * ATO with explicit transformation
 * Returns both the transformation and the result.
 */
function atoFull(a, b, c) {
  const transform = xor(a, b);
  const result = xor(c, transform);
  return {
    transform,     // *ab
    result,        // d = *c*ab
    analogy: `${vectorToString(a)} : ${vectorToString(b)} :: ${vectorToString(c)} : ${vectorToString(result)}`
  };
}

// ============================================================
// SECTION 3: KLEIN-4 GROUP PROPERTIES
// ============================================================

/**
 * The Klein-4 group has four elements: {e, a, b, c}
 * With the property that every element is its own inverse:
 *   a * a = e, b * b = e, c * c = e
 * And the product of any two non-identity elements is the third:
 *   a * b = c, b * c = a, a * c = b
 *
 * In our binary vector terms:
 *   e = [0,0,0,...] (identity)
 *   a, b, c are any vectors where a XOR a = e
 *
 * This property is CRUCIAL because it means:
 *   *ab = transform
 *   *transform*ab = e (the identity)
 *   So applying the same transformation twice cancels out.
 */

/**
 * Verify Klein-4 group properties for a set of vectors
 */
function verifyKlein4(a, b, c) {
  const e = new Array(a.length).fill(0);

  // Every element is its own inverse
  const aInv = xor(a, a);
  const bInv = xor(b, b);
  const cInv = xor(c, c);

  // Product of two non-identity = third
  const ab = xor(a, b);
  const bc = xor(b, c);
  const ac = xor(a, c);

  return {
    identity: vectorToString(e),
    aInverse: vectorToString(aInv),
    bInverse: vectorToString(bInv),
    cInverse: vectorToString(cInv),
    ab: vectorToString(ab),
    bc: vectorToString(bc),
    ac: vectorToString(ac),
    isKlein4: (
      arraysEqual(aInv, e) &&
      arraysEqual(bInv, e) &&
      arraysEqual(cInv, e)
    )
  };
}

// ============================================================
// SECTION 4: UTILITY FUNCTIONS
// ============================================================

/**
 * Convert a binary vector to a string for display
 */
function vectorToString(vec) {
  return vec.join('');
}

/**
 * Parse a binary string to a vector
 */
function stringToVector(str) {
  return str.split('').map(c => parseInt(c, 10));
}

/**
 * Check if two arrays are equal
 */
function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  return a.every((val, i) => val === b[i]);
}

/**
 * Hamming distance - number of differing bits
 * Measures "distance" between concepts in feature space.
 */
function hammingDistance(a, b) {
  return xor(a, b).reduce((sum, bit) => sum + bit, 0);
}

/**
 * Similarity - ratio of same bits
 * 1.0 = identical, 0.0 = completely different
 */
function similarity(a, b) {
  const same = seq(a, b).reduce((sum, bit) => sum + bit, 0);
  return same / a.length;
}

// ============================================================
// SECTION 5: EXPORT
// ============================================================

const ATOCore = {
  xor,
  seq,
  not,
  and,
  or,
  ato,
  atoFull,
  verifyKlein4,
  vectorToString,
  stringToVector,
  arraysEqual,
  hammingDistance,
  similarity
};

// Node.js export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ATOCore;
}

// Browser global
if (typeof window !== 'undefined') {
  window.ATOCore = ATOCore;
}
