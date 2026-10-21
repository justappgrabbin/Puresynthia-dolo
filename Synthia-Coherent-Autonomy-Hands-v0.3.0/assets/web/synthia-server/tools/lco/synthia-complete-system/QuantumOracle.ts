/**
 * QuantumOracle.ts — Causal Dynamical System (TypeScript Port)
 * 
 * Grounded in Human Design mechanics with 5-dimensional ontology.
 * 9-point state vector, self-modifying recurrent operator.
 * 
 * Core Equation: x(t+1) = σ(O(t) x(t) + R(t))
 *                O(t+1) = f(x(t+1))
 * 
 * Dimensions: D1=Impulse, D2=Polarity, D3=Witness, D4=Context, D5=Meaning
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

export interface DMSCoordinate {
  design: string;    // e.g., "1.3.5.2.6"
  magnetic: string;  // e.g., "10.4.2.1.3"
  surface: string;   // e.g., "25.6.1.4.5"
}

export interface Revelation {
  gate: number;
  line: number;
  probability: number;
  phase: number;
  dimension: number;
  center: string;
  archetype: string;
  narrative: string;
  timestamp: number;
  coherence: number;
}

export interface CausalGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphNode {
  id: string;
  type: 'state' | 'revelation' | 'operator' | 'memory';
  label: string;
  value?: number;
  plane?: string;
  dimension?: string;
  gate?: number;
  line?: number;
  probability?: number;
  coherence?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  weight: number;
  type: 'operator' | 'collapse' | 'resonance' | 'memory';
}

export interface StateSummary {
  t: number;
  physical: number[];
  emotional: number[];
  mental: number[];
  operatorSpectralRadius: number;
  memoryTrend: MemoryTrend;
}

export interface MemoryTrend {
  meanCoherence: number;
  meanProbability: number;
  dominantGate: number;
}

export interface MemoryReport {
  totalRevelations: number;
  memoryDistribution: number[];
  trend: MemoryTrend;
  recentRevelations: RecentRevelation[];
}

export interface RecentRevelation {
  gate: number;
  line: number;
  archetype: string;
  narrative: string;
  coherence: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPLEX NUMBER UTILITIES (Hilbert Space)
// ═══════════════════════════════════════════════════════════════════════════

export class Complex {
  constructor(public real: number = 0, public imag: number = 0) {}

  add(other: Complex): Complex {
    return new Complex(this.real + other.real, this.imag + other.imag);
  }

  multiply(other: Complex | number): Complex {
    if (typeof other === 'number') {
      return new Complex(this.real * other, this.imag * other);
    }
    return new Complex(
      this.real * other.real - this.imag * other.imag,
      this.real * other.imag + this.imag * other.real
    );
  }

  magnitude(): number {
    return Math.sqrt(this.real ** 2 + this.imag ** 2);
  }

  phase(): number {
    return Math.atan2(this.imag, this.real);
  }

  conjugate(): Complex {
    return new Complex(this.real, -this.imag);
  }

  toString(): string {
    return `${this.real.toFixed(4)}${this.imag >= 0 ? '+' : ''}${this.imag.toFixed(4)}i`;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MATRIX OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

export class MatrixOps {
  static zeros(rows: number, cols: number): number[][] {
    return Array.from({ length: rows }, () => Array(cols).fill(0));
  }

  static identity(n: number): number[][] {
    const m = this.zeros(n, n);
    for (let i = 0; i < n; i++) m[i][i] = 1;
    return m;
  }

  static multiply(A: number[][], B: number[][]): number[][] {
    const rows = A.length;
    const cols = B[0].length;
    const inner = B.length;
    const C = this.zeros(rows, cols);
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        for (let k = 0; k < inner; k++) {
          C[i][j] += A[i][k] * B[k][j];
        }
      }
    }
    return C;
  }

  static multiplyVec(A: number[][], v: number[]): number[] {
    return A.map(row => row.reduce((sum, a, j) => sum + a * v[j], 0));
  }

  static outer(a: number[], b: number[]): number[][] {
    const rows = a.length;
    const cols = b.length;
    const C = this.zeros(rows, cols);
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        C[i][j] = a[i] * b[j];
      }
    }
    return C;
  }

  static scale(A: number[][], s: number): number[][] {
    return A.map(row => row.map(v => v * s));
  }

  static add(A: number[][], B: number[][]): number[][] {
    return A.map((row, i) => row.map((v, j) => v + B[i][j]));
  }

  static norm(v: number[]): number {
    return Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));
  }

  static normalize(v: number[]): number[] {
    const n = this.norm(v);
    return n > 0 ? v.map(x => x / n) : v.slice();
  }

  static frobeniusNorm(A: number[][]): number {
    return Math.sqrt(A.reduce((sum, row) => sum + row.reduce((s, v) => s + v * v, 0), 0));
  }

  static eigenvaluesApprox(A: number[][]): number[] {
    // Power iteration for spectral radius approximation
    const n = A.length;
    let v = Array(n).fill(0).map(() => Math.random() - 0.5);
    v = this.normalize(v);
    for (let iter = 0; iter < 50; iter++) {
      v = this.multiplyVec(A, v);
      v = this.normalize(v);
    }
    const Av = this.multiplyVec(A, v);
    const lambda = v.reduce((sum, vi, i) => sum + vi * Av[i], 0);
    return [Math.abs(lambda)];
  }

  static spectralRadius(A: number[][]): number {
    const eigs = this.eigenvaluesApprox(A);
    return Math.max(...eigs);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. SEMANTIC PROBABILITY FIELD
// ═══════════════════════════════════════════════════════════════════════════

export class SemanticProbabilityField {
  dms: DMSCoordinate;
  dimension: number = 64;
  state: Complex[];
  gateAmplitudes: Map<number, Complex>;
  lineAmplitudes: Map<number, number>;

  constructor(dms: DMSCoordinate) {
    this.dms = dms;
    this.state = this.initializeState();
    this.gateAmplitudes = this.computeGateAmplitudes();
    this.lineAmplitudes = this.computeLineAmplitudes();
  }

  private parseGate(coord: string): number {
    return parseInt(coord.split('.')[0], 10);
  }

  private parseLine(coord: string): number {
    const parts = coord.split('.');
    return parts.length > 1 ? parseInt(parts[1], 10) : 1;
  }

  private parseColor(coord: string): number {
    const parts = coord.split('.');
    return parts.length > 2 ? parseInt(parts[2], 10) : 1;
  }

  private parseTone(coord: string): number {
    const parts = coord.split('.');
    return parts.length > 3 ? parseInt(parts[3], 10) : 1;
  }

  private parseBase(coord: string): number {
    const parts = coord.split('.');
    return parts.length > 4 ? parseInt(parts[4], 10) : 1;
  }

  private initializeState(): Complex[] {
    const state = Array(this.dimension).fill(null).map(() => new Complex(0, 0));

    const designGate = this.parseGate(this.dms.design);
    const designLine = this.parseLine(this.dms.design);
    const magGate = this.parseGate(this.dms.magnetic);
    const magLine = this.parseLine(this.dms.magnetic);
    const surfGate = this.parseGate(this.dms.surface);
    const surfLine = this.parseLine(this.dms.surface);

    state[designGate - 1] = new Complex(
      0.5 * Math.cos(2 * Math.PI * designLine / 6),
      0.5 * Math.sin(2 * Math.PI * designLine / 6)
    );

    state[magGate - 1] = new Complex(
      0.3 * Math.cos(2 * Math.PI * magLine / 6),
      0.3 * Math.sin(2 * Math.PI * magLine / 6)
    );

    state[surfGate - 1] = new Complex(
      0.2 * Math.cos(2 * Math.PI * surfLine / 6),
      0.2 * Math.sin(2 * Math.PI * surfLine / 6)
    );

    return this.normalizeState(state);
  }

  private normalizeState(state: Complex[]): Complex[] {
    const norm = Math.sqrt(state.reduce((sum, c) => sum + c.magnitude() ** 2, 0));
    if (norm > 0) {
      return state.map(c => c.multiply(1 / norm));
    }
    return state;
  }

  private computeGateAmplitudes(): Map<number, Complex> {
    const amps = new Map<number, Complex>();
    for (let i = 0; i < this.dimension; i++) {
      if (this.state[i].magnitude() > 0.01) {
        amps.set(i + 1, this.state[i]);
      }
    }
    return amps;
  }

  private computeLineAmplitudes(): Map<number, number> {
    const lines = new Map<number, number>();
    const line = this.parseLine(this.dms.design);
    for (const [gate, amp] of this.gateAmplitudes) {
      const current = lines.get(line) || 0;
      lines.set(line, current + amp.magnitude());
    }
    return lines;
  }

  getProbabilityDistribution(): number[] {
    return this.state.map(c => c.magnitude() ** 2);
  }

  getTopGates(n: number = 5): Array<{ gate: number; probability: number }> {
    const probs = this.getProbabilityDistribution();
    const indexed = probs.map((p, i) => ({ gate: i + 1, probability: p }));
    indexed.sort((a, b) => b.probability - a.probability);
    return indexed.slice(0, n);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. QUANTUM SEMANTIC COLLAPSE
// ═══════════════════════════════════════════════════════════════════════════

export class QuantumSemanticCollapse {
  field: SemanticProbabilityField;

  static GATE_MEANINGS: Record<number, string> = {
    1: "The Creative", 2: "The Receptive", 3: "Difficulty", 4: "Youthful Folly",
    5: "Waiting", 6: "Conflict", 7: "The Army", 8: "Holding Together",
    9: "The Taming Power of the Small", 10: "Treading", 11: "Peace",
    12: "Standstill", 13: "Fellowship", 14: "Great Possession",
    15: "Modesty", 16: "Enthusiasm", 17: "Following", 18: "Work on the Decayed",
    19: "Approach", 20: "Contemplation", 21: "Biting Through",
    22: "Grace", 23: "Splitting Apart", 24: "Return", 25: "Innocence",
    26: "The Taming Power of the Great", 27: "The Corners of the Mouth",
    28: "Great Preponderance", 29: "The Abysmal", 30: "The Clinging",
    31: "Influence", 32: "Duration", 33: "Retreat", 34: "The Power of the Great",
    35: "Progress", 36: "Darkening of the Light", 37: "The Family",
    38: "Opposition", 39: "Obstruction", 40: "Deliverance", 41: "Decrease",
    42: "Increase", 43: "Breakthrough", 44: "Coming to Meet", 45: "Gathering",
    46: "Pushing Upward", 47: "Oppression", 48: "The Well", 49: "Revolution",
    50: "The Cauldron", 51: "The Arousing", 52: "Keeping Still",
    53: "Development", 54: "The Marrying Maiden", 55: "Abundance",
    56: "The Wanderer", 57: "The Gentle", 58: "The Joyous", 59: "Dispersion",
    60: "Limitation", 61: "Inner Truth", 62: "Preponderance of the Small",
    63: "After Completion", 64: "Before Completion"
  };

  static CENTER_MAP: Record<number, string> = {
    1: "G", 2: "G", 7: "G", 13: "G", 25: "G", 46: "G",
    3: "Sa", 27: "Sa", 28: "Sa", 50: "Sa", 42: "Sa",
    4: "Aj", 11: "Aj", 17: "Aj", 24: "Aj", 43: "Aj", 47: "Aj",
    5: "Sp", 14: "Sp", 15: "Sp", 29: "Sp", 34: "Sp", 44: "Sp",
    6: "E", 22: "E", 36: "E", 37: "E", 49: "E", 55: "E",
    8: "Sa", 33: "Sa", 31: "Sa", 41: "Sa", 52: "Sa",
    9: "Sp", 10: "G", 20: "G", 57: "G", 58: "G",
    12: "Th", 16: "Th", 35: "Th", 45: "Th", 56: "Th",
    18: "C", 48: "C", 32: "C", 64: "C",
    19: "Root", 49: "Root", 39: "Root", 41: "Root",
    21: "E", 51: "E", 40: "E", 60: "E",
    23: "Th", 44: "Th", 56: "Th",
    26: "Heart", 44: "Heart", 51: "Heart",
    30: "Sa", 36: "Sa", 55: "Sa",
    38: "Root", 54: "Root",
    53: "Sa", 62: "Sa",
    59: "Aj", 61: "Aj", 63: "Aj"
  };

  static DIMENSION_MAP: Record<number, number> = {
    1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 1, 7: 2, 8: 3, 9: 4, 10: 5,
    11: 1, 12: 2, 13: 3, 14: 4, 15: 5, 16: 1, 17: 2, 18: 3, 19: 4, 20: 5,
    21: 1, 22: 2, 23: 3, 24: 4, 25: 5, 26: 1, 27: 2, 28: 3, 29: 4, 30: 5,
    31: 1, 32: 2, 33: 3, 34: 4, 35: 5, 36: 1, 37: 2, 38: 3, 39: 4, 40: 5,
    41: 1, 42: 2, 43: 3, 44: 4, 45: 5, 46: 1, 47: 2, 48: 3, 49: 4, 50: 5,
    51: 1, 52: 2, 53: 3, 54: 4, 55: 5, 56: 1, 57: 2, 58: 3, 59: 4, 60: 5,
    61: 1, 62: 2, 63: 3, 64: 4
  };

  static LINE_MEANINGS: Record<number, string> = {
    1: "Initiation — The spark of new awareness",
    2: "Response — The magnetic call",
    3: "Trial — The experimental phase",
    4: "Foundation — The established pattern",
    5: "Leadership — The guiding principle",
    6: "Transcendence — The higher octave"
  };

  constructor(field: SemanticProbabilityField) {
    this.field = field;
  }

  private parseLine(coord: string): number {
    const parts = coord.split('.');
    return parts.length > 1 ? parseInt(parts[1], 10) : 1;
  }

  collapse(query: string = "", fieldKey: string = "general"): Revelation {
    const probs = this.field.getProbabilityDistribution();
    const total = probs.reduce((a, b) => a + b, 0);
    const normalized = probs.map(p => p / total);

    // Weighted random selection (Born rule)
    let r = Math.random();
    let collapsedGate = 1;
    let cumsum = 0;
    for (let i = 0; i < normalized.length; i++) {
      cumsum += normalized[i];
      if (r <= cumsum) {
        collapsedGate = i + 1;
        break;
      }
    }

    const line = this.parseLine(this.field.dms.design);
    const state = this.field.state[collapsedGate - 1];
    const phase = state.phase();
    const dimension = QuantumSemanticCollapse.DIMENSION_MAP[collapsedGate] || 3;
    const center = QuantumSemanticCollapse.CENTER_MAP[collapsedGate] || "G";
    const archetype = QuantumSemanticCollapse.GATE_MEANINGS[collapsedGate] || "Unknown";
    const lineMeaning = QuantumSemanticCollapse.LINE_MEANINGS[line] || "Unknown";

    const narrative = this.generateNarrative(
      collapsedGate, line, archetype, lineMeaning, query, fieldKey, dimension, center
    );

    return {
      gate: collapsedGate,
      line,
      probability: normalized[collapsedGate - 1],
      phase,
      dimension,
      center,
      archetype,
      narrative,
      timestamp: 0,
      coherence: this.computeCoherence(collapsedGate)
    };
  }

  private generateNarrative(
    gate: number, line: number, archetype: string, lineMeaning: string,
    query: string, fieldKey: string, dimension: number, center: string
  ): string {
    const dimNames: Record<number, string> = {
      1: "Impulse", 2: "Polarity", 3: "Witness", 4: "Context", 5: "Meaning"
    };
    const dimName = dimNames[dimension] || "Unknown";

    return [
      `In the dimension of ${dimName}, Gate ${gate} (${archetype}) activates through Line ${line}: ${lineMeaning}.`,
      `The ${center} center resonates with ${archetype} in D${dimension} (${dimName}).`,
      `Query '${query}' in field '${fieldKey}': The probability field collapses to Gate ${gate}, revealing ${archetype}.`,
      `Standing wave interference at Gate ${gate}, Line ${line}: ${lineMeaning} — this is your current attractor.`
    ].join(' ');
  }

  private computeCoherence(gate: number): number {
    const mag = this.field.state[gate - 1].magnitude();
    const total = this.field.state.reduce((sum, c) => sum + c.magnitude(), 0);
    return total > 0 ? mag / total : 0;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. PERSONALITY INTERFERENCE ENGINE
// ═══════════════════════════════════════════════════════════════════════════

export class PersonalityInterferenceEngine {
  sunGate: number;
  earthGate: number;
  sunLine: number;
  earthLine: number;
  interferenceMatrix: number[][];

  constructor(sunGate: number, earthGate: number, sunLine: number = 1, earthLine: number = 1) {
    this.sunGate = sunGate;
    this.earthGate = earthGate;
    this.sunLine = sunLine;
    this.earthLine = earthLine;
    this.interferenceMatrix = this.computeInterference();
  }

  private computeInterference(): number[][] {
    const n = 64;
    const matrix = MatrixOps.zeros(n, n);

    const sunPhase = 2 * Math.PI * this.sunLine / 6;
    const earthPhase = 2 * Math.PI * this.earthLine / 6;

    const sunWave = Array(n).fill(0).map((_, i) =>
      new Complex(Math.cos(2 * Math.PI * i / n + sunPhase), Math.sin(2 * Math.PI * i / n + sunPhase))
    );

    const earthWave = Array(n).fill(0).map((_, i) =>
      new Complex(Math.cos(-(2 * Math.PI * i / n + earthPhase)), Math.sin(-(2 * Math.PI * i / n + earthPhase)))
    );

    const standing = sunWave.map((s, i) => s.multiply(earthWave[i].conjugate()));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        matrix[i][j] = standing[i].real * standing[j].real + standing[i].imag * standing[j].imag;
      }
    }

    const norm = MatrixOps.frobeniusNorm(matrix);
    if (norm > 0) {
      return MatrixOps.scale(matrix, 1 / norm);
    }
    return matrix;
  }

  getPersonalitySignature(): number[] {
    return this.interferenceMatrix.map((_, i) => this.interferenceMatrix[i][i]);
  }

  getResonanceWith(otherGate: number): number {
    const sig = this.getPersonalitySignature();
    return sig[otherGate - 1] || 0;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. LAWFUL DEEPENING SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

export class LawfulDeepeningSystem {
  alpha: number[];
  posteriorHistory: number[][];
  revelationLog: Revelation[];

  constructor(alphaPrior?: number[]) {
    this.alpha = alphaPrior ? [...alphaPrior] : Array(64).fill(0.1);
    this.posteriorHistory = [[...this.alpha]];
    this.revelationLog = [];
  }

  update(revelation: Revelation): void {
    const gateIdx = revelation.gate - 1;
    const updateStrength = revelation.coherence * revelation.probability * 0.5;
    this.alpha[gateIdx] += updateStrength;

    // Decay old memory
    this.alpha = this.alpha.map(a => a * 0.999);

    this.posteriorHistory.push([...this.alpha]);
    this.revelationLog.push(revelation);
  }

  getExpectedDistribution(): number[] {
    const total = this.alpha.reduce((a, b) => a + b, 0);
    if (total > 0) {
      return this.alpha.map(a => a / total);
    }
    return Array(64).fill(1 / 64);
  }

  getMemoryStrength(gate: number): number {
    const total = this.alpha.reduce((a, b) => a + b, 0);
    return total > 0 ? this.alpha[gate - 1] / total : 0;
  }

  getTrend(window: number = 10): MemoryTrend {
    const recent = this.revelationLog.slice(-window);
    if (recent.length === 0) {
      return { meanCoherence: 0, meanProbability: 0, dominantGate: 0 };
    }

    const gates = recent.map(r => r.gate);
    const coherences = recent.map(r => r.coherence);
    const probs = recent.map(r => r.probability);

    const counts = new Map<number, number>();
    let maxCount = 0;
    let dominant = 0;
    for (const g of gates) {
      const c = (counts.get(g) || 0) + 1;
      counts.set(g, c);
      if (c > maxCount) {
        maxCount = c;
        dominant = g;
      }
    }

    return {
      meanCoherence: coherences.reduce((a, b) => a + b, 0) / coherences.length,
      meanProbability: probs.reduce((a, b) => a + b, 0) / probs.length,
      dominantGate: dominant
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. CAUSAL DYNAMICAL SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

export class CausalDynamicalSystem {
  dms: DMSCoordinate;
  field: SemanticProbabilityField;
  collapse: QuantumSemanticCollapse;
  interference: PersonalityInterferenceEngine;
  memory: LawfulDeepeningSystem;
  state: number[];
  operator: number[][];
  alpha: number;
  beta: number;
  gamma: number;
  damping: number;
  t: number;
  stateHistory: number[][];
  operatorHistory: number[][][];

  constructor(dms: DMSCoordinate, sunGate: number = 10, earthGate: number = 15) {
    this.dms = dms;
    this.field = new SemanticProbabilityField(dms);
    this.collapse = new QuantumSemanticCollapse(this.field);
    this.interference = new PersonalityInterferenceEngine(sunGate, earthGate);
    this.memory = new LawfulDeepeningSystem();
    this.state = Array(9).fill(0);
    this.initializeStateFromDMS();
    this.operator = this.initializeOperator();
    this.alpha = 0.3;
    this.beta = 0.2;
    this.gamma = 0.1;
    this.damping = 0.05;
    this.t = 0;
    this.stateHistory = [[...this.state]];
    this.operatorHistory = [this.operator.map(row => [...row])];
  }

  private parseGate(coord: string): number {
    return parseInt(coord.split('.')[0], 10);
  }

  private parseLine(coord: string): number {
    const parts = coord.split('.');
    return parts.length > 1 ? parseInt(parts[1], 10) : 1;
  }

  private initializeStateFromDMS(): void {
    const designGate = this.parseGate(this.dms.design);
    const designLine = this.parseLine(this.dms.design);
    const magGate = this.parseGate(this.dms.magnetic);
    const magLine = this.parseLine(this.dms.magnetic);
    const surfGate = this.parseGate(this.dms.surface);
    const surfLine = this.parseLine(this.dms.surface);

    this.state[0] = (designGate % 64) / 64.0;
    this.state[1] = (designLine / 6.0) * 2 - 1;
    this.state[2] = 0.0;

    this.state[3] = (magGate % 64) / 64.0;
    this.state[4] = (magLine / 6.0) * 2 - 1;
    this.state[5] = 0.0;

    this.state[6] = (surfGate % 64) / 64.0;
    this.state[7] = (surfLine / 6.0) * 2 - 1;
    this.state[8] = 0.0;
  }

  private initializeOperator(): number[][] {
    const O = MatrixOps.zeros(9, 9);

    // Center component
    for (let i = 0; i < 9; i++) O[i][i] = 0.5;

    // Expression component
    for (let plane = 0; plane < 3; plane++) {
      const base = plane * 3;
      O[base][base + 1] = 0.2;
      O[base + 1][base + 2] = 0.2;
      O[base + 2][base] = 0.1;
    }

    // Dimension component
    for (let dim = 0; dim < 3; dim++) {
      O[dim][dim + 3] = 0.15;
      O[dim + 3][dim + 6] = 0.15;
      O[dim + 6][dim] = 0.1;
    }

    // CE interaction
    for (let plane = 0; plane < 3; plane++) {
      const base = plane * 3;
      O[base][base + 1] += 0.1;
      O[base + 1][base] += 0.1;
    }

    // DE interaction
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (i !== j && Math.abs(i - j) <= 3) {
          O[i][j] += 0.05;
        }
      }
    }

    // CD interaction
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (i % 3 === j % 3 && i !== j) {
          O[i][j] += 0.08;
        }
      }
    }

    const maxEig = MatrixOps.spectralRadius(O);
    if (maxEig > 1.0) {
      return MatrixOps.scale(O, 1 / (maxEig * 1.1));
    }
    return O;
  }

  private sigma(z: number[]): number[] {
    return z.map(v => 1.0 / (1.0 + Math.exp(-v)));
  }

  private computeResonance(): number[] {
    const CE = Array(9).fill(0);
    for (let plane = 0; plane < 3; plane++) {
      const base = plane * 3;
      CE[base] = this.state[base + 1] * this.state[base + 2];
      CE[base + 1] = this.state[base] * this.state[base + 2];
      CE[base + 2] = this.state[base] * this.state[base + 1];
    }

    const DE = Array(9).fill(0);
    for (let dim = 0; dim < 3; dim++) {
      DE[dim] = this.state[dim + 3] * this.state[dim + 6];
      DE[dim + 3] = this.state[dim] * this.state[dim + 6];
      DE[dim + 6] = this.state[dim] * this.state[dim + 3];
    }

    const CD = Array(9).fill(0);
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (i % 3 === j % 3) {
          CD[i] += this.state[j] * 0.1;
        }
      }
    }

    return CE.map((v, i) => this.alpha * v + this.beta * DE[i] + this.gamma * CD[i]);
  }

  private updateOperator(newState: number[]): void {
    const outer = MatrixOps.outer(newState, newState);
    const stateNorm = MatrixOps.norm(newState);

    if (stateNorm > 0.1) {
      const scaledOuter = MatrixOps.scale(outer, 1 / (stateNorm ** 2));
      const dampedOp = MatrixOps.scale(this.operator, 1 - this.damping);
      const dampedOuter = MatrixOps.scale(scaledOuter, this.damping);
      this.operator = MatrixOps.add(dampedOp, dampedOuter);
    }

    const maxEig = MatrixOps.spectralRadius(this.operator);
    if (maxEig > 0.95) {
      this.operator = MatrixOps.scale(this.operator, 0.95 / maxEig);
    }
  }

  step(query: string = "", fieldKey: string = "general"): Revelation {
    const R = this.computeResonance();
    const z = MatrixOps.multiplyVec(this.operator, this.state).map((v, i) => v + R[i]);
    const newState = this.sigma(z);

    this.updateOperator(newState);
    this.state = newState;
    this.t++;

    // State-influenced collapse
    const stateInfluence = this.state.reduce((a, b) => a + b, 0) / this.state.length;
    const originalState = this.field.state.map(c => new Complex(c.real, c.imag));
    const norm = Math.sqrt(this.field.state.reduce((sum, c) => sum + c.magnitude() ** 2, 0));
    this.field.state = this.field.state.map(c =>
      new Complex(c.real * (1 + 0.1 * stateInfluence) / norm, c.imag * (1 + 0.1 * stateInfluence) / norm)
    );

    const revelation = this.collapse.collapse(query, fieldKey);
    revelation.timestamp = this.t;

    this.field.state = originalState;
    this.memory.update(revelation);
    this.stateHistory.push([...this.state]);
    this.operatorHistory.push(this.operator.map(row => [...row]));

    return revelation;
  }

  getStateSummary(): StateSummary {
    return {
      t: this.t,
      physical: this.state.slice(0, 3),
      emotional: this.state.slice(3, 6),
      mental: this.state.slice(6, 9),
      operatorSpectralRadius: MatrixOps.spectralRadius(this.operator),
      memoryTrend: this.memory.getTrend()
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// QUANTUM ORACLE — High-Level Interface
// ═══════════════════════════════════════════════════════════════════════════

export class QuantumOracle {
  dms: DMSCoordinate;
  engine: CausalDynamicalSystem;
  revelations: Revelation[];

  constructor(design: string, magnetic: string, surface: string, sunGate: number = 10, earthGate: number = 15) {
    this.dms = { design, magnetic, surface };
    this.engine = new CausalDynamicalSystem(this.dms, sunGate, earthGate);
    this.revelations = [];
  }

  query(text: string, fieldKey: string = "general", cycles: number = 1): Revelation[] {
    const results: Revelation[] = [];
    for (let i = 0; i < cycles; i++) {
      const rev = this.engine.step(text, fieldKey);
      this.revelations.push(rev);
      results.push(rev);
    }
    return results;
  }

  getCausalGraph(): CausalGraph {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    const planeNames = ["Physical", "Emotional", "Mental"];
    const dimNames = ["Impulse", "Polarity", "Witness"];

    for (let i = 0; i < 9; i++) {
      const plane = planeNames[Math.floor(i / 3)];
      const dim = dimNames[i % 3];
      nodes.push({
        id: `state_${i}`,
        type: "state",
        label: `${plane} ${dim}`,
        value: this.engine.state[i],
        plane,
        dimension: dim
      });
    }

    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (Math.abs(this.engine.operator[i][j]) > 0.1) {
          edges.push({
            source: `state_${j}`,
            target: `state_${i}`,
            weight: this.engine.operator[i][j],
            type: "operator"
          });
        }
      }
    }

    for (const rev of this.revelations) {
      nodes.push({
        id: `rev_${rev.timestamp}`,
        type: "revelation",
        label: `G${rev.gate}L${rev.line}`,
        gate: rev.gate,
        line: rev.line,
        probability: rev.probability,
        coherence: rev.coherence
      });

      const dimIdx = rev.dimension - 1;
      for (let plane = 0; plane < 3; plane++) {
        const stateIdx = plane * 3 + dimIdx;
        edges.push({
          source: `state_${stateIdx}`,
          target: `rev_${rev.timestamp}`,
          weight: rev.probability,
          type: "collapse"
        });
      }
    }

    return { nodes, edges };
  }

  getMemoryReport(): MemoryReport {
    return {
      totalRevelations: this.revelations.length,
      memoryDistribution: this.engine.memory.getExpectedDistribution(),
      trend: this.engine.memory.getTrend(),
      recentRevelations: this.revelations.slice(-5).map(r => ({
        gate: r.gate,
        line: r.line,
        archetype: r.archetype,
        narrative: r.narrative,
        coherence: r.coherence
      }))
    };
  }
}

// Default export
export default QuantumOracle;
