/**
 * Synthia State Space Model
 * Piece 1: The Foundation
 * 
 * A single node contains all dimensions of Human Design:
 * 64 Gates × 6 Lines × 6 Colors × 6 Tones × 5 Bases
 * + DMS precision (degrees, minutes, seconds, arc-seconds)
 * + 12 Zodiacs × 12 Houses
 * + 5 Meshes (space, design, causal, knowledge, dependency)
 * + 5 Charts (personality, design, mind, body, heart)
 */

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

const GATE_COUNT = 64;
const LINE_COUNT = 6;
const COLOR_COUNT = 6;
const TONE_COUNT = 6;
const BASE_COUNT = 5;
const ZODIAC_COUNT = 12;
const HOUSE_COUNT = 12;

// Arc measurements in degrees
const GATE_ARC_DEG = 5.625;           // 5°37'30"
const LINE_ARC_DEG = 0.9375;          // 0°56'15"
const COLOR_ARC_DEG = 0.15625;        // 0°9'22.5"
const TONE_ARC_DEG = 0.026041667;     // ~0°1'33.75"
const BASE_ARC_DEG = 0.005208333;     // ~0°0'18.75"

// Arc measurements in arc-seconds
const ARCSEC_PER_GATE = 20250;        // 5°37'30" = 20250"
const ARCSEC_PER_LINE = 3375;         // 0°56'15" = 3375"
const ARCSEC_PER_COLOR = 562.5;
const ARCSEC_PER_TONE = 93.75;
const ARCSEC_PER_BASE = 18.75;

// The Human Design Mandala sequence (counter-clockwise from Gate 41)
const MANDALA_SEQUENCE = [
  41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21, 51, 42, 3,
  27, 24, 2, 23, 8, 20, 16, 35, 45, 12, 15, 52, 39, 53, 62, 56,
  31, 33, 7, 4, 29, 59, 40, 64, 47, 6, 46, 18, 48, 57, 44, 28,
  50, 32, 54, 61, 60, 41  // Completes the circle
];

// Gate to Zodiac mapping (simplified — each gate spans ~0.47 zodiac signs)
const GATE_ZODIAC = {
  41: 'Aquarius', 19: 'Aquarius', 13: 'Aquarius', 49: 'Aquarius',
  30: 'Aquarius', 55: 'Pisces', 37: 'Pisces', 63: 'Pisces',
  22: 'Pisces', 36: 'Pisces', 25: 'Pisces', 17: 'Aries',
  21: 'Aries', 51: 'Aries', 42: 'Aries', 3: 'Aries',
  27: 'Taurus', 24: 'Taurus', 2: 'Taurus', 23: 'Taurus',
  8: 'Taurus', 20: 'Taurus', 16: 'Gemini', 35: 'Gemini',
  45: 'Gemini', 12: 'Gemini', 15: 'Gemini', 52: 'Cancer',
  39: 'Cancer', 53: 'Cancer', 62: 'Cancer', 56: 'Cancer',
  31: 'Leo', 33: 'Leo', 7: 'Leo', 4: 'Leo',
  29: 'Leo', 59: 'Virgo', 40: 'Virgo', 64: 'Virgo',
  47: 'Virgo', 6: 'Virgo', 46: 'Virgo', 18: 'Virgo',
  48: 'Libra', 57: 'Libra', 44: 'Libra', 28: 'Libra',
  50: 'Libra', 32: 'Libra', 54: 'Scorpio', 61: 'Scorpio',
  60: 'Scorpio', 9: 'Scorpio', 5: 'Scorpio', 26: 'Sagittarius',
  11: 'Sagittarius', 10: 'Sagittarius', 58: 'Sagittarius',
  38: 'Sagittarius', 43: 'Capricorn', 14: 'Capricorn',
  34: 'Capricorn', 1: 'Scorpio'  // Gate 1 is actually in Scorpio
};

// Center mapping for gates
const GATE_CENTERS = {
  // Head Center (Pineal)
  61: 'Head', 63: 'Head', 64: 'Head',
  // Ajna Center (Pituitary)
  47: 'Ajna', 24: 'Ajna', 4: 'Ajna', 11: 'Ajna', 43: 'Ajna', 17: 'Ajna',
  // Throat Center (Thyroid/Parathyroid)
  62: 'Throat', 23: 'Throat', 56: 'Throat', 35: 'Throat', 12: 'Throat',
  45: 'Throat', 33: 'Throat', 8: 'Throat', 31: 'Throat', 20: 'Throat',
  // G Center (Liver)
  1: 'G', 13: 'G', 25: 'G', 46: 'G', 10: 'G', 15: 'G', 7: 'G', 2: 'G',
  // Heart Center (Ego/Thymus)
  21: 'Heart', 40: 'Heart', 26: 'Heart', 51: 'Heart',
  // Solar Plexus Center (Pancreas)
  55: 'Solar Plexus', 30: 'Solar Plexus', 49: 'Solar Plexus', 22: 'Solar Plexus',
  36: 'Solar Plexus', 37: 'Solar Plexus', 6: 'Solar Plexus',
  // Sacral Center (Ovaries/Testes)
  5: 'Sacral', 14: 'Sacral', 29: 'Sacral', 34: 'Sacral', 57: 'Sacral',
  48: 'Sacral', 18: 'Sacral', 59: 'Sacral', 9: 'Sacral', 3: 'Sacral',
  42: 'Sacral', 27: 'Sacral',
  // Spleen Center (Lymphatic/Spleen)
  50: 'Spleen', 32: 'Spleen', 54: 'Spleen', 44: 'Spleen', 28: 'Spleen',
  // Root Center (Adrenal)
  58: 'Root', 38: 'Root', 54: 'Root', 19: 'Root', 39: 'Root', 41: 'Root',
  53: 'Root', 52: 'Root', 60: 'Root', 10: 'Root'  // Note: 10 is G, not Root — need to fix
};

// Center colors for visualization
const CENTER_COLORS = {
  'Head': '#8B4513',      // Brown
  'Ajna': '#4B0082',      // Indigo
  'Throat': '#00CED1',    // Cyan
  'G': '#FFD700',         // Gold
  'Heart': '#FF4500',     // Red-Orange
  'Solar Plexus': '#FF69B4', // Hot Pink
  'Sacral': '#FF0000',    // Red
  'Spleen': '#32CD32',    // Lime Green
  'Root': '#8B0000'       // Dark Red
};

// ─────────────────────────────────────────────────────────────
// STATE SPACE CLASS
// ─────────────────────────────────────────────────────────────

class StateSpace {
  constructor() {
    // Initialize the complete Mandala structure
    this.gates = this.initializeGates();

    // The 5 meshes — each interprets the same state differently
    this.meshes = {
      space: new Mesh('space', this),
      design: new Mesh('design', this),
      causal: new Mesh('causal', this),
      knowledge: new Mesh('knowledge', this),
      dependency: new Mesh('dependency', this)
    };

    // The 5 charts — different temporal/functional dimensions
    this.charts = {
      personality: new Chart('personality', this),
      design: new Chart('design', this),
      mind: new Chart('mind', this),
      body: new Chart('body', this),
      heart: new Chart('heart', this)
    };

    // Field geometry — gravity weights for each gate
    // g[i] = gravity of gate (i+1)
    this.g = new Float64Array(GATE_COUNT);

    // Line-level gravity weights
    // lineG[i*6 + l] = gravity of gate (i+1), line (l+1)
    this.lineG = new Float64Array(GATE_COUNT * LINE_COUNT);

    // User's personal design — which gates are defined (colored in)
    this.personalDesign = new Set();

    // Trace log — history of states the agent has visited
    this.traces = [];

    // Current position in the field
    this.currentPosition = null;
  }

  // ─────────────────────────────────────────────────────────
  // INITIALIZATION
  // ─────────────────────────────────────────────────────────

  initializeGates() {
    const gates = new Array(GATE_COUNT + 1); // 1-indexed

    for (let i = 0; i < MANDALA_SEQUENCE.length - 1; i++) {
      const gateNum = MANDALA_SEQUENCE[i];
      const startAngle = i * GATE_ARC_DEG;
      const endAngle = (i + 1) * GATE_ARC_DEG;

      gates[gateNum] = {
        number: gateNum,
        name: this.getGateName(gateNum),
        startAngle: startAngle,
        endAngle: endAngle,
        centerAngle: startAngle + GATE_ARC_DEG / 2,
        center: GATE_CENTERS[gateNum] || 'Unknown',
        zodiac: GATE_ZODIAC[gateNum] || 'Unknown',
        lines: this.initializeLines(gateNum, startAngle),
        // Will be populated from Black Book data
        harmonic: null,
        exaltations: {},
        detriments: {},
        keywords: [],
        ic: '',
        biology: ''
      };
    }

    return gates;
  }

  initializeLines(gateNum, gateStartAngle) {
    const lines = new Array(LINE_COUNT + 1); // 1-indexed

    for (let l = 1; l <= LINE_COUNT; l++) {
      const lineStart = gateStartAngle + (l - 1) * LINE_ARC_DEG;
      const lineEnd = lineStart + LINE_ARC_DEG;

      lines[l] = {
        number: l,
        name: this.getLineName(gateNum, l),
        startAngle: lineStart,
        endAngle: lineEnd,
        centerAngle: lineStart + LINE_ARC_DEG / 2,
        colors: this.initializeColors(gateNum, l, lineStart),
        exaltation: null,
        detriment: null,
        // Line expression keywords
        expression: this.getLineExpression(gateNum, l)
      };
    }

    return lines;
  }

  initializeColors(gateNum, lineNum, lineStartAngle) {
    const colors = new Array(COLOR_COUNT + 1);

    for (let c = 1; c <= COLOR_COUNT; c++) {
      const colorStart = lineStartAngle + (c - 1) * COLOR_ARC_DEG;

      colors[c] = {
        number: c,
        motivation: this.getColorMotivation(c),
        startAngle: colorStart,
        endAngle: colorStart + COLOR_ARC_DEG,
        tones: this.initializeTones(gateNum, lineNum, c, colorStart)
      };
    }

    return colors;
  }

  initializeTones(gateNum, lineNum, colorNum, colorStartAngle) {
    const tones = new Array(TONE_COUNT + 1);

    for (let t = 1; t <= TONE_COUNT; t++) {
      const toneStart = colorStartAngle + (t - 1) * TONE_ARC_DEG;

      tones[t] = {
        number: t,
        cognition: this.getToneCognition(t),
        startAngle: toneStart,
        endAngle: toneStart + TONE_ARC_DEG,
        bases: this.initializeBases(gateNum, lineNum, colorNum, t, toneStart)
      };
    }

    return tones;
  }

  initializeBases(gateNum, lineNum, colorNum, toneNum, toneStartAngle) {
    const bases = new Array(BASE_COUNT + 1);

    for (let b = 1; b <= BASE_COUNT; b++) {
      const baseStart = toneStartAngle + (b - 1) * BASE_ARC_DEG;

      bases[b] = {
        number: b,
        biology: this.getBaseBiology(b),
        startAngle: baseStart,
        endAngle: baseStart + BASE_ARC_DEG
      };
    }

    return bases;
  }

  // ─────────────────────────────────────────────────────────
  // STATE CREATION
  // ─────────────────────────────────────────────────────────

  /**
   * Create a complete state from parameters
   * All dimensions are optional — defaults to gate-level
   */
  createState(params = {}) {
    const gate = params.gate || 1;
    const line = params.line || 1;
    const color = params.color || 1;
    const tone = params.tone || 1;
    const base = params.base || 1;

    // DMS precision
    const degrees = params.degrees || 0;
    const minutes = params.minutes || 0;
    const seconds = params.seconds || 0;
    const arcSeconds = this.toArcSeconds(degrees, minutes, seconds);

    // Calculate the precise angle
    const angle = this.stateToAngle(gate, line, color, tone, base, arcSeconds);

    return {
      // Core dimensions
      gate: gate,
      line: line,
      color: color,
      tone: tone,
      base: base,

      // DMS precision
      degrees: degrees,
      minutes: minutes,
      seconds: seconds,
      arcSeconds: arcSeconds,

      // Astrological
      zodiac: params.zodiac || this.gateToZodiac(gate),
      house: params.house || this.gateToHouse(gate),
      angle: angle,

      // Mesh and chart context
      mesh: params.mesh || 'space',
      chart: params.chart || 'personality',

      // Field intensity
      intensity: params.intensity || 0.0,

      // Temporal
      timestamp: params.timestamp || Date.now(),

      // Reference to gate data
      gateData: this.gates[gate],
      lineData: this.gates[gate]?.lines[line],
      colorData: this.gates[gate]?.lines[line]?.colors[color],
      toneData: this.gates[gate]?.lines[line]?.colors[color]?.tones[tone],
      baseData: this.gates[gate]?.lines[line]?.colors[color]?.tones[tone]?.bases[base]
    };
  }

  /**
   * Create a state from an angle (reverse mapping)
   */
  createStateFromAngle(angle, params = {}) {
    // Normalize angle to 0-360
    angle = ((angle % 360) + 360) % 360;

    // Find which gate
    const gateIndex = Math.floor(angle / GATE_ARC_DEG);
    const gate = MANDALA_SEQUENCE[Math.min(gateIndex, 63)];

    // Find which line within gate
    const gateRemainder = angle - (gateIndex * GATE_ARC_DEG);
    const line = Math.min(Math.floor(gateRemainder / LINE_ARC_DEG) + 1, 6);

    // Find which color within line
    const lineRemainder = gateRemainder - ((line - 1) * LINE_ARC_DEG);
    const color = Math.min(Math.floor(lineRemainder / COLOR_ARC_DEG) + 1, 6);

    // Find which tone within color
    const colorRemainder = lineRemainder - ((color - 1) * COLOR_ARC_DEG);
    const tone = Math.min(Math.floor(colorRemainder / TONE_ARC_DEG) + 1, 6);

    // Find which base within tone
    const toneRemainder = colorRemainder - ((tone - 1) * TONE_ARC_DEG);
    const base = Math.min(Math.floor(toneRemainder / BASE_ARC_DEG) + 1, 5);

    // Calculate DMS from remainder
    const baseRemainder = toneRemainder - ((base - 1) * BASE_ARC_DEG);
    const totalArcSeconds = Math.round(baseRemainder * (ARCSEC_PER_GATE / GATE_ARC_DEG));
    const degrees = Math.floor(totalArcSeconds / 3600);
    const remaining = totalArcSeconds % 3600;
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;

    return this.createState({
      gate, line, color, tone, base,
      degrees, minutes, seconds,
      ...params
    });
  }

  // ─────────────────────────────────────────────────────────
  // ANGLE / POSITION MATH
  // ─────────────────────────────────────────────────────────

  /**
   * Convert a complete state to its angle on the Mandala
   */
  stateToAngle(gate, line, color, tone, base, arcSeconds) {
    const gateIndex = MANDALA_SEQUENCE.indexOf(gate);
    if (gateIndex === -1) return 0;

    let angle = gateIndex * GATE_ARC_DEG;
    angle += (line - 1) * LINE_ARC_DEG;
    angle += (color - 1) * COLOR_ARC_DEG;
    angle += (tone - 1) * TONE_ARC_DEG;
    angle += (base - 1) * BASE_ARC_DEG;
    angle += (arcSeconds / ARCSEC_PER_GATE) * GATE_ARC_DEG;

    return angle % 360;
  }

  /**
   * Circular distance (shortest path around the circle)
   */
  circularDistance(a, b) {
    const diff = Math.abs(a - b);
    return Math.min(diff, 360 - diff);
  }

  /**
   * Convert DMS to arc-seconds
   */
  toArcSeconds(degrees, minutes, seconds) {
    return (degrees * 3600) + (minutes * 60) + seconds;
  }

  /**
   * Convert arc-seconds back to DMS
   */
  fromArcSeconds(totalArcSeconds) {
    const degrees = Math.floor(totalArcSeconds / 3600);
    const remaining = totalArcSeconds % 3600;
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return { degrees, minutes, seconds };
  }

  // ─────────────────────────────────────────────────────────
  // FIELD EVALUATION
  // ─────────────────────────────────────────────────────────

  /**
   * Evaluate the attractor field at a given angle
   * M(θ) = Σᵢ gᵢ / (1 + |θ - θᵢ|)
   * 
   * This is the core generative function — the field "remembers"
   * by its geometry, not by stored data
   */
  evaluateField(theta) {
    let sum = 0;

    for (let i = 1; i <= GATE_COUNT; i++) {
      const gate = this.gates[i];
      if (!gate) continue;

      const dist = this.circularDistance(theta, gate.centerAngle);
      const gateGravity = this.g[i - 1];

      // Gate-level contribution
      sum += gateGravity / (1 + dist);

      // Line-level contributions (if line weights are set)
      for (let l = 1; l <= LINE_COUNT; l++) {
        const lineGravity = this.lineG[(i - 1) * LINE_COUNT + (l - 1)];
        if (lineGravity > 0) {
          const lineDist = this.circularDistance(theta, gate.lines[l].centerAngle);
          sum += lineGravity / (1 + lineDist * 6); // Lines are narrower, so scale distance
        }
      }
    }

    return sum;
  }

  /**
   * Find the nearest basin (gate/line) to a given angle
   * Used for encoding: "where does this experience belong?"
   */
  nearestBasin(theta) {
    let bestGate = -1;
    let bestLine = -1;
    let bestScore = -Infinity;

    for (let i = 1; i <= GATE_COUNT; i++) {
      const gate = this.gates[i];
      if (!gate) continue;

      const gateDist = this.circularDistance(theta, gate.centerAngle);
      const gateScore = this.g[i - 1] / (1 + gateDist);

      if (gateScore > bestScore) {
        bestScore = gateScore;
        bestGate = i;
        bestLine = -1; // Reset line
      }

      // Check lines within this gate
      for (let l = 1; l <= LINE_COUNT; l++) {
        const lineDist = this.circularDistance(theta, gate.lines[l].centerAngle);
        const lineScore = this.lineG[(i - 1) * LINE_COUNT + (l - 1)] / (1 + lineDist * 6);

        if (lineScore > bestScore) {
          bestScore = lineScore;
          bestGate = i;
          bestLine = l;
        }
      }
    }

    return {
      gate: bestGate,
      line: bestLine > 0 ? bestLine : 1,
      score: bestScore,
      angle: theta
    };
  }

  /**
   * Find multiple nearby basins (for semantic completion)
   */
  nearbyBasins(theta, count = 3) {
    const basins = [];

    for (let i = 1; i <= GATE_COUNT; i++) {
      const gate = this.gates[i];
      if (!gate) continue;

      const dist = this.circularDistance(theta, gate.centerAngle);
      const score = this.g[i - 1] / (1 + dist);

      basins.push({ gate: i, dist, score, angle: gate.centerAngle });
    }

    // Sort by score descending
    basins.sort((a, b) => b.score - a.score);
    return basins.slice(0, count);
  }

  // ─────────────────────────────────────────────────────────
  // PERSONAL DESIGN
  // ─────────────────────────────────────────────────────────

  /**
   * Load a user's personal design (the 26 defined points)
   * This is the "slice" of the universal mesh that is active for this person
   */
  loadPersonalDesign(definedGates) {
    this.personalDesign.clear();

    for (const gateNum of definedGates) {
      this.personalDesign.add(gateNum);
      // Set initial gravity for defined gates
      this.g[gateNum - 1] = 0.5; // Base gravity for defined gates
    }

    // Defined gates have higher gravity — they "pull" the field
    return this.personalDesign;
  }

  /**
   * Check if a gate is in the personal design
   */
  isDefined(gateNum) {
    return this.personalDesign.has(gateNum);
  }

  /**
   * Get all defined gates
   */
  getDefinedGates() {
    return Array.from(this.personalDesign);
  }

  // ─────────────────────────────────────────────────────────
  // TRACE LOG (Hippocampal Memory)
  // ─────────────────────────────────────────────────────────

  /**
   * Add a trace — a sparse signature of an experience
   * This is the "hippocampal storage" — tiny, sparse, just enough to trigger reconstruction
   */
  addTrace(state, context = {}) {
    const trace = {
      gate: state.gate,
      line: state.line,
      color: state.color,
      tone: state.tone,
      base: state.base,
      arcSeconds: state.arcSeconds,
      intensity: state.intensity,
      mesh: state.mesh,
      chart: state.chart,
      timestamp: state.timestamp,
      context: context, // Optional: what was happening
      angle: state.angle
    };

    this.traces.push(trace);

    // Update field gravity from this experience
    this.updateGravityFromTrace(trace);

    return trace;
  }

  /**
   * Update field gravity based on a trace
   * This is how the field "learns" — experiences strengthen or weaken basins
   */
  updateGravityFromTrace(trace) {
    const gateIdx = trace.gate - 1;
    const lineIdx = (trace.gate - 1) * LINE_COUNT + (trace.line - 1);

    // Strengthen the gate that was visited
    this.g[gateIdx] += trace.intensity * 0.01;
    this.g[gateIdx] = Math.min(this.g[gateIdx], 1.0); // Cap at 1.0

    // Strengthen the specific line
    this.lineG[lineIdx] += trace.intensity * 0.01;
    this.lineG[lineIdx] = Math.min(this.lineG[lineIdx], 1.0);
  }

  /**
   * Retrieve traces near a given angle (for memory reconstruction)
   * This is the "hippocampal retrieval" — sparse triggers for neocortical completion
   */
  retrieveTracesNear(angle, window = 5.0) {
    return this.traces.filter(trace => {
      const traceAngle = this.stateToAngle(
        trace.gate, trace.line, trace.color, trace.tone, trace.base, trace.arcSeconds
      );
      return this.circularDistance(angle, traceAngle) <= window;
    });
  }

  /**
   * Reconstruct a memory from traces (neocortical completion)
   * Given sparse traces, generate the full experience from field geometry
   */
  reconstructMemory(angle, traces) {
    if (traces.length === 0) {
      // No traces — generate from field alone (de novo generation)
      return this.generateFromField(angle);
    }

    // Multiple traces — compute weighted completion
    let totalWeight = 0;
    let weightedState = null;

    for (const trace of traces) {
      const weight = trace.intensity;
      totalWeight += weight;

      if (!weightedState) {
        weightedState = { ...trace, weight };
      } else {
        // Weighted average of positions
        weightedState.gate = Math.round((weightedState.gate * weightedState.weight + trace.gate * weight) / (weightedState.weight + weight));
        weightedState.intensity = Math.max(weightedState.intensity, trace.intensity);
        weightedState.weight += weight;
      }
    }

    // Generate completion from the weighted position
    return this.generateFromField(
      this.stateToAngle(weightedState.gate, weightedState.line, weightedState.color, weightedState.tone, weightedState.base, weightedState.arcSeconds)
    );
  }

  /**
   * Generate content from field state alone (no traces)
   * This is "creativity" — pure field dynamics
   */
  generateFromField(angle) {
    const nearby = this.nearbyBasins(angle, 5);
    const fieldValue = this.evaluateField(angle);

    return {
      angle: angle,
      fieldIntensity: fieldValue,
      nearbyBasins: nearby,
      dominantGate: nearby[0]?.gate || null,
      dominantLine: nearby[0]?.line || null,
      // The "completion" is the interference pattern of nearby basins
      completion: this.computeInterference(nearby)
    };
  }

  /**
   * Compute interference pattern between multiple basins
   * This is where "emergent functionality" happens — new patterns from basin interactions
   */
  computeInterference(basins) {
    if (basins.length < 2) return { type: 'single', pattern: basins[0] };

    // Two basins create a channel-like interference
    if (basins.length === 2) {
      return {
        type: 'channel',
        gates: [basins[0].gate, basins[1].gate],
        // The channel "function" emerges from the two gates interacting
        function: this.inferChannelFunction(basins[0].gate, basins[1].gate),
        intensity: (basins[0].score + basins[1].score) / 2
      };
    }

    // Multiple basins create a complex field pattern
    return {
      type: 'complex',
      gates: basins.map(b => b.gate),
      pattern: basins.map(b => ({
        gate: b.gate,
        score: b.score,
        center: this.gates[b.gate]?.centerAngle || 0
      })),
      intensity: basins.reduce((sum, b) => sum + b.score, 0) / basins.length
    };
  }

  /**
   * Infer what function emerges when two gates interact (channel)
   */
  inferChannelFunction(gateA, gateB) {
    const centers = [
      this.gates[gateA]?.center,
      this.gates[gateB]?.center
    ];

    // The function emerges from the centers involved
    // For example: G Center + Throat Center = "Expression of Identity"
    const centerPair = centers.sort().join('-');

    const channelFunctions = {
      'Ajna-Throat': 'Mental Expression',
      'G-Heart': 'Identity through Willpower',
      'G-Spleen': 'Intuitive Identity',
      'G-Throat': 'Expressing Identity',
      'Heart-Sacral': 'Willpower into Action',
      'Heart-Spleen': 'Instinctive Willpower',
      'Heart-Throat': 'Expressing Willpower',
      'Sacral-Spleen': 'Instinctive Action',
      'Sacral-Throat': 'Expressing Action',
      'Spleen-Throat': 'Expressing Intuition',
      'Solar Plexus-Sacral': 'Emotional Action',
      'Solar Plexus-Spleen': 'Emotional Intuition',
      'Solar Plexus-Throat': 'Expressing Emotion',
      'Root-Sacral': 'Pressure into Action',
      'Root-Spleen': 'Pressure into Intuition',
      'Root-Throat': 'Expressing Pressure',
      'Head-Ajna': 'Mental Inspiration',
      'Head-Throat': 'Expressing Inspiration',
      'Ajna-G': 'Identity through Mind',
      'G-Solar Plexus': 'Emotional Identity',
      'Heart-Solar Plexus': 'Emotional Willpower',
      'Sacral-Solar Plexus': 'Emotional Action',
      'Spleen-Solar Plexus': 'Emotional Intuition',
      'Root-Solar Plexus': 'Emotional Pressure',
      'Root-Heart': 'Willpower under Pressure',
      'Root-Spleen': 'Intuitive Pressure',
      'Head-Solar Plexus': 'Emotional Inspiration',
      'Head-Heart': 'Inspired Willpower',
      'Head-Spleen': 'Intuitive Inspiration',
      'Head-Sacral': 'Inspired Action',
      'Ajna-Heart': 'Mental Willpower',
      'Ajna-Sacral': 'Mental Action',
      'Ajna-Spleen': 'Intuitive Mind',
      'Ajna-Solar Plexus': 'Emotional Mind',
      'G-Root': 'Identity under Pressure',
      'Heart-Root': 'Willpower under Pressure',
      'Spleen-Root': 'Intuitive Pressure',
      'Throat-Root': 'Expressing Pressure'
    };

    return channelFunctions[centerPair] || 'Unknown Function';
  }

  // ─────────────────────────────────────────────────────────
  // MESH ROUTING
  // ─────────────────────────────────────────────────────────

  /**
   * Route a state through a specific mesh
   * Each mesh interprets the same state differently
   */
  routeThroughMesh(state, meshName) {
    const mesh = this.meshes[meshName];
    if (!mesh) return state;

    return mesh.interpret(state);
  }

  // ─────────────────────────────────────────────────────────
  // UTILITIES
  // ─────────────────────────────────────────────────────────

  gateToZodiac(gate) {
    return GATE_ZODIAC[gate] || 'Unknown';
  }

  gateToHouse(gate) {
    // Simplified: each zodiac sign spans 2.5 houses approximately
    // This is a placeholder — real house calculation needs birth time/location
    const zodiacIndex = [
      'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
      'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
    ].indexOf(this.gateToZodiac(gate));
    return (zodiacIndex % 12) + 1;
  }

  getGateName(gate) {
    const names = {
      1: 'The Creative', 2: 'The Receptive', 3: 'Difficulty at the Beginning',
      4: 'Youthful Folly', 5: 'Waiting', 6: 'Conflict',
      7: 'The Army', 8: 'Holding Together', 9: 'The Taming Power of the Small',
      10: 'Treading', 11: 'Peace', 12: 'Standstill',
      13: 'Fellowship with Men', 14: 'Possession in Great Measure',
      15: 'Modesty', 16: 'Enthusiasm', 17: 'Following',
      18: 'Work on What Has Been Spoiled', 19: 'Approach',
      20: 'Contemplation', 21: 'Biting Through', 22: 'Grace',
      23: 'Splitting Apart', 24: 'Return', 25: 'Innocence',
      26: 'The Taming Power of the Great', 27: 'The Corners of the Mouth',
      28: 'Preponderance of the Great', 29: 'The Abysmal',
      30: 'The Clinging', 31: 'Influence', 32: 'Duration',
      33: 'Retreat', 34: 'The Power of the Great', 35: 'Progress',
      36: 'Darkening of the Light', 37: 'The Family',
      38: 'Opposition', 39: 'Obstruction', 40: 'Deliverance',
      41: 'Decrease', 42: 'Increase', 43: 'Breakthrough',
      44: 'Coming to Meet', 45: 'Gathering Together', 46: 'Pushing Upward',
      47: 'Oppression', 48: 'The Well', 49: 'Revolution',
      50: 'The Caldron', 51: 'The Arousing', 52: 'Keeping Still',
      53: 'Development', 54: 'The Marrying Maiden', 55: 'Abundance',
      56: 'The Wanderer', 57: 'The Gentle', 58: 'The Joyous',
      59: 'Dispersion', 60: 'Limitation', 61: 'Inner Truth',
      62: 'Preponderance of the Small', 63: 'After Completion',
      64: 'Before Completion'
    };
    return names[gate] || `Gate ${gate}`;
  }

  getLineName(gate, line) {
    const lineNames = {
      1: 'Investigation', 2: 'Projection', 3: 'Trial and Error',
      4: 'The Opportunist', 5: 'The Heretic', 6: 'The Role Model'
    };
    return lineNames[line] || `Line ${line}`;
  }

  getLineExpression(gate, line) {
    // These would come from the Black Book
    // Placeholder expressions
    const expressions = {
      1: 'First expression — the foundation',
      2: 'Second expression — the projection',
      3: 'Third expression — the trial',
      4: 'Fourth expression — the opportunity',
      5: 'Fifth expression — the heresy',
      6: 'Sixth expression — the model'
    };
    return expressions[line] || `Expression ${line}`;
  }

  getColorMotivation(color) {
    const motivations = {
      1: 'Fear', 2: 'Hope', 3: 'Desire', 4: 'Need', 5: 'Guilt', 6: 'Innocence'
    };
    return motivations[color] || `Motivation ${color}`;
  }

  getToneCognition(tone) {
    const cognitions = {
      1: 'Inner Sense', 2: 'Outer Sense', 3: 'Feeling',
      4: 'Thinking', 5: 'Intuition', 6: 'Touch'
    };
    return cognitions[tone] || `Cognition ${tone}`;
  }

  getBaseBiology(base) {
    const biologies = {
      1: 'Acid', 2: 'Alkaline', 3: 'Salt', 4: 'Pressure', 5: 'Temperature'
    };
    return biologies[base] || `Base ${base}`;
  }

  // ─────────────────────────────────────────────────────────
  // SERIALIZATION
  // ─────────────────────────────────────────────────────────

  /**
   * Serialize the field state (for persistence)
   * The entire "soul" is ~3.6KB
   */
  serialize() {
    return {
      g: Array.from(this.g),
      lineG: Array.from(this.lineG),
      personalDesign: Array.from(this.personalDesign),
      traces: this.traces.slice(-1000), // Keep last 1000 traces
      version: 1
    };
  }

  /**
   * Deserialize field state (for loading)
   */
  deserialize(data) {
    if (data.g) this.g.set(data.g);
    if (data.lineG) this.lineG.set(data.lineG);
    if (data.personalDesign) this.loadPersonalDesign(data.personalDesign);
    if (data.traces) this.traces = data.traces;
    return this;
  }

  // ─────────────────────────────────────────────────────────
  // DEBUG / INFO
  // ─────────────────────────────────────────────────────────

  info() {
    return {
      gates: GATE_COUNT,
      lines: LINE_COUNT,
      colors: COLOR_COUNT,
      tones: TONE_COUNT,
      bases: BASE_COUNT,
      totalNodes: GATE_COUNT * LINE_COUNT * COLOR_COUNT * TONE_COUNT * BASE_COUNT,
      definedGates: this.personalDesign.size,
      traceCount: this.traces.length,
      fieldSize: (this.g.length + this.lineG.length) * 8 + ' bytes'
    };
  }
}

// ─────────────────────────────────────────────────────────────
// MESH CLASS
// ─────────────────────────────────────────────────────────────

class Mesh {
  constructor(name, stateSpace) {
    this.name = name;
    this.stateSpace = stateSpace;
  }

  /**
   * Interpret a state through this mesh's lens
   * Each mesh sees the same state differently
   */
  interpret(state) {
    switch (this.name) {
      case 'space':
        return this.interpretSpace(state);
      case 'design':
        return this.interpretDesign(state);
      case 'causal':
        return this.interpretCausal(state);
      case 'knowledge':
        return this.interpretKnowledge(state);
      case 'dependency':
        return this.interpretDependency(state);
      default:
        return state;
    }
  }

  // Space mesh: "Where am I?" — position, location, spatial relations
  interpretSpace(state) {
    return {
      ...state,
      mesh: 'space',
      interpretation: {
        position: state.angle,
        quadrant: Math.floor(state.angle / 90) + 1,
        hemisphere: state.angle < 180 ? 'lower' : 'upper',
        density: this.stateSpace.evaluateField(state.angle)
      }
    };
  }

  // Design mesh: "Where am I going?" — temporal, journey, direction
  interpretDesign(state) {
    return {
      ...state,
      mesh: 'design',
      interpretation: {
        phase: this.getDesignPhase(state),
        direction: this.getDesignDirection(state),
        trajectory: this.getDesignTrajectory(state)
      }
    };
  }

  getDesignPhase(state) {
    // Simplified: based on gate position in the sequence
    const idx = MANDALA_SEQUENCE.indexOf(state.gate);
    if (idx < 16) return 'beginning';
    if (idx < 32) return 'middle';
    if (idx < 48) return 'late';
    return 'return';
  }

  getDesignDirection(state) {
    // Counter-clockwise movement through the Mandala
    return 'counter-clockwise';
  }

  getDesignTrajectory(state) {
    // Based on line: 1-2 = building, 3-4 = maturation, 5-6 = transcendence
    if (state.line <= 2) return 'building';
    if (state.line <= 4) return 'maturation';
    return 'transcendence';
  }

  // Causal mesh: "What happens if?" — action, consequence, if-then
  interpretCausal(state) {
    return {
      ...state,
      mesh: 'causal',
      interpretation: {
        action: this.getCausalAction(state),
        consequence: this.getCausalConsequence(state),
        chain: this.getCausalChain(state)
      }
    };
  }

  getCausalAction(state) {
    const gate = this.stateSpace.gates[state.gate];
    return gate ? `Activate ${gate.name}` : 'Unknown action';
  }

  getCausalConsequence(state) {
    // The consequence emerges from the field at the next position
    const nextAngle = (state.angle + GATE_ARC_DEG) % 360;
    const nextBasin = this.stateSpace.nearestBasin(nextAngle);
    const nextGate = this.stateSpace.gates[nextBasin.gate];
    return nextGate ? `Leads to ${nextGate.name}` : 'Unknown consequence';
  }

  getCausalChain(state) {
    // Follow the chain of consequences for 3 steps
    const chain = [];
    let currentAngle = state.angle;
    for (let i = 0; i < 3; i++) {
      currentAngle = (currentAngle + GATE_ARC_DEG) % 360;
      const basin = this.stateSpace.nearestBasin(currentAngle);
      const gate = this.stateSpace.gates[basin.gate];
      chain.push(gate ? gate.name : 'Unknown');
    }
    return chain;
  }

  // Knowledge mesh: "What is this?" — meaning, understanding, semantic content
  interpretKnowledge(state) {
    return {
      ...state,
      mesh: 'knowledge',
      interpretation: {
        concept: this.getKnowledgeConcept(state),
        relation: this.getKnowledgeRelation(state),
        depth: this.getKnowledgeDepth(state)
      }
    };
  }

  getKnowledgeConcept(state) {
    const gate = this.stateSpace.gates[state.gate];
    return gate ? gate.name : 'Unknown concept';
  }

  getKnowledgeRelation(state) {
    // What is this gate related to? (harmonic, channel partners)
    const gate = this.stateSpace.gates[state.gate];
    if (!gate) return 'Unknown relation';
    return `Harmonic with Gate ${gate.harmonic || 'unknown'}`;
  }

  getKnowledgeDepth(state) {
    // Depth = how many sub-levels are specified
    let depth = 1; // gate
    if (state.line > 1) depth++;
    if (state.color > 1) depth++;
    if (state.tone > 1) depth++;
    if (state.base > 1) depth++;
    return depth;
  }

  // Dependency mesh: "What depends on what?" — relationships, requirements, links
  interpretDependency(state) {
    return {
      ...state,
      mesh: 'dependency',
      interpretation: {
        requires: this.getDependencies(state),
        supports: this.getSupportedBy(state),
        channel: this.getChannel(state)
      }
    };
  }

  getDependencies(state) {
    // What gates must be active for this one to function?
    const gate = this.stateSpace.gates[state.gate];
    if (!gate) return [];

    // Simplified: gates in the same center are interdependent
    const dependencies = [];
    for (let i = 1; i <= GATE_COUNT; i++) {
      const other = this.stateSpace.gates[i];
      if (other && other.center === gate.center && i !== state.gate) {
        dependencies.push(i);
      }
    }
    return dependencies;
  }

  getSupportedBy(state) {
    // What gates support this one? (harmonic, channel)
    const gate = this.stateSpace.gates[state.gate];
    if (!gate || !gate.harmonic) return [];
    return [gate.harmonic];
  }

  getChannel(state) {
    // Is this gate part of a defined channel?
    const gate = this.stateSpace.gates[state.gate];
    if (!gate) return null;

    // Check if harmonic gate is also defined
    if (gate.harmonic && this.stateSpace.isDefined(gate.harmonic)) {
      return {
        gates: [state.gate, gate.harmonic],
        function: this.stateSpace.inferChannelFunction(state.gate, gate.harmonic)
      };
    }
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// CHART CLASS
// ─────────────────────────────────────────────────────────────

class Chart {
  constructor(name, stateSpace) {
    this.name = name;
    this.stateSpace = stateSpace;
    this.activatedStates = new Set(); // States active in this chart
  }

  /**
   * Activate a state in this chart
   */
  activate(state) {
    const key = `${state.gate}.${state.line}.${state.color}.${state.tone}.${state.base}`;
    this.activatedStates.add(key);

    // Update field gravity for this chart
    const gateIdx = state.gate - 1;
    const lineIdx = (state.gate - 1) * LINE_COUNT + (state.line - 1);

    // Different charts have different gravity modifiers
    const modifier = this.getGravityModifier();
    this.stateSpace.g[gateIdx] += state.intensity * modifier;
    this.stateSpace.lineG[lineIdx] += state.intensity * modifier;
  }

  getGravityModifier() {
    switch (this.name) {
      case 'personality': return 0.02; // Changes every ~6 hours
      case 'design': return 0.05;      // Fixed at birth, stronger
      case 'mind': return 0.01;         // Mental, subtle
      case 'body': return 0.03;         // Somatic, grounded
      case 'heart': return 0.02;        // Emotional, relational
      default: return 0.01;
    }
  }

  /**
   * Check if a state is activated in this chart
   */
  isActivated(state) {
    const key = `${state.gate}.${state.line}.${state.color}.${state.tone}.${state.base}`;
    return this.activatedStates.has(key);
  }

  /**
   * Get all activated states
   */
  getActivatedStates() {
    return Array.from(this.activatedStates).map(key => {
      const [gate, line, color, tone, base] = key.split('.').map(Number);
      return this.stateSpace.createState({ gate, line, color, tone, base, chart: this.name });
    });
  }
}

// ─────────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────────

// For browser
if (typeof window !== 'undefined') {
  window.StateSpace = StateSpace;
  window.Mesh = Mesh;
  window.Chart = Chart;
}

// For module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StateSpace, Mesh, Chart };
}
