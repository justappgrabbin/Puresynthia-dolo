
// ============================================================
// I CHING SUBSTRATE — The coordinate system beneath everything
// 64 gates × 6 lines × 13 planetary filters = actual state topology
// Not floating-point vectors. Named coordinates.
// ============================================================

// -----------------------------------------------------------
// GATE DEFINITIONS — 64 gates, each with 6 lines
// Each line has: color, tone, base, astrological correspondence
// -----------------------------------------------------------

export type GateNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
  11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 |
  21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 |
  31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 |
  41 | 42 | 43 | 44 | 45 | 46 | 47 | 48 | 49 | 50 |
  51 | 52 | 53 | 54 | 55 | 56 | 57 | 58 | 59 | 60 |
  61 | 62 | 63 | 64;

export type LineNumber = 1 | 2 | 3 | 4 | 5 | 6;

export type Color = 'red' | 'black' | 'white' | 'yellow';
export type Tone = '1st' | '2nd' | '3rd' | '4th' | '5th' | '6th';
export type Base = 'left' | 'right';

export interface LineDefinition {
  line: LineNumber;
  color: Color;
  tone: Tone;
  base: Base;
  astrologicalSign: string;
  keyword: string;
  exalted: string;
  detriment: string;
}

export interface GateDefinition {
  gate: GateNumber;
  name: string;
  circuit: CircuitName;
  center: CenterName;
  hexagram: string;
  trigramAbove: Trigram;
  trigramBelow: Trigram;
  lines: Record<LineNumber, LineDefinition>;
}

export type CircuitName = 
  | 'individual' | 'collective' | 'tribal' | 'integration';

export type CenterName =
  | 'head' | 'ajna' | 'throat' | 'g' | 'sacral' | 'root' |
  | 'spleen' | 'heart' | 'solar-plexus';

export type Trigram =
  | '☰ heaven' | '☱ lake' | '☲ fire' | '☳ thunder' |
  | '☴ wind' | '☵ water' | '☶ mountain' | '☷ earth';

// -----------------------------------------------------------
// PLANETARY FILTERS — 13 filters that project the gate space
// -----------------------------------------------------------

export type PlanetaryFilter =
  | 'sun' | 'earth' | 'moon' | 'north-node' | 'south-node' |
  | 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn' |
  | 'uranus' | 'neptune' | 'pluto';

export const PLANETARY_FILTERS: PlanetaryFilter[] = [
  'sun', 'earth', 'moon', 'north-node', 'south-node',
  'mercury', 'venus', 'mars', 'jupiter', 'saturn',
  'uranus', 'neptune', 'pluto'
];

// -----------------------------------------------------------
// ADDRESS — A specific coordinate in the I Ching space
// Not a vector. A named, typed coordinate.
// -----------------------------------------------------------

export interface IChingAddress {
  gate: GateNumber;
  line: LineNumber;
  color: Color;
  tone: Tone;
  base: Base;
  filter: PlanetaryFilter;
}

// DMS precision: 1 gate = 5°37'30" = 20250 arc-sec
// 1 line = 0°56'15" = 3375 arc-sec
export function addressToArcSeconds(addr: IChingAddress): number {
  const gateArcSec = (addr.gate - 1) * 20250;
  const lineArcSec = (addr.line - 1) * 3375;
  const colorArcSec = (colorIndex(addr.color)) * 844;  // 3375 / 4
  const toneArcSec = (toneIndex(addr.tone)) * 141;     // 844 / 6
  const baseArcSec = addr.base === 'left' ? 0 : 70;    // 141 / 2
  return gateArcSec + lineArcSec + colorArcSec + toneArcSec + baseArcSec;
}

function colorIndex(c: Color): number {
  return { red: 0, black: 1, white: 2, yellow: 3 }[c];
}

function toneIndex(t: Tone): number {
  return { '1st': 0, '2nd': 1, '3rd': 2, '4th': 3, '5th': 4, '6th': 5 }[t];
}

// -----------------------------------------------------------
// GATE DATABASE — The 64 gates with all lines
// -----------------------------------------------------------

export const GATES: Record<GateNumber, GateDefinition> = {
  1: {
    gate: 1, name: "The Creative", circuit: "individual", center: "g",
    hexagram: "䷀", trigramAbove: "☰ heaven", trigramBelow: "☰ heaven",
    lines: {
      1: { line: 1, color: "red", tone: "1st", base: "left", astrologicalSign: "", keyword: "creativity", exalted: "", detriment: "" },
      2: { line: 2, color: "black", tone: "2nd", base: "right", astrologicalSign: "", keyword: "potential", exalted: "", detriment: "" },
      3: { line: 3, color: "white", tone: "3rd", base: "left", astrologicalSign: "", keyword: "uncertainty", exalted: "", detriment: "" },
      4: { line: 4, color: "yellow", tone: "4th", base: "right", astrologicalSign: "", keyword: "influence", exalted: "", detriment: "" },
      5: { line: 5, color: "red", tone: "5th", base: "left", astrologicalSign: "", keyword: "manifestation", exalted: "", detriment: "" },
      6: { line: 6, color: "black", tone: "6th", base: "right", astrologicalSign: "", keyword: "transcendence", exalted: "", detriment: "" }
    }
  },
  // ... (all 64 gates would be fully defined here)
  // For brevity, the full database would be ~2000 lines
  // In production, this loads from a data file
  6: {
    gate: 6, name: "Conflict", circuit: "individual", center: "solar-plexus",
    hexagram: "䷅", trigramAbove: "☰ heaven", trigramBelow: "☵ water",
    lines: {
      1: { line: 1, color: "red", tone: "1st", base: "left", astrologicalSign: "", keyword: "retreat", exalted: "", detriment: "" },
      2: { line: 2, color: "black", tone: "2nd", base: "right", astrologicalSign: "", keyword: "diplomacy", exalted: "", detriment: "" },
      3: { line: 3, color: "white", tone: "3rd", base: "left", astrologicalSign: "", keyword: "trial", exalted: "", detriment: "" },
      4: { line: 4, color: "yellow", tone: "4th", base: "right", astrologicalSign: "", keyword: "victory", exalted: "", detriment: "" },
      5: { line: 5, color: "red", tone: "5th", base: "left", astrologicalSign: "", keyword: "arbitration", exalted: "", detriment: "" },
      6: { line: 6, color: "black", tone: "6th", base: "right", astrologicalSign: "", keyword: "compromise", exalted: "", detriment: "" }
    }
  }
} as const;

// -----------------------------------------------------------
// STATE — A point in the I Ching manifold
// Not a vector. A set of active addresses with activation levels.
// -----------------------------------------------------------

export interface IChingState {
  // Active addresses with their activation (0-1)
  activations: Map<string, number>;  // key = "gate:line:color:tone:base:filter"

  // The state's center of gravity (computed, not stored as primary)
  centroid: IChingAddress | null;

  // Trajectory history
  trajectory: IChingAddress[];

  // Turn / step count
  step: number;
}

export function createState(): IChingState {
  return {
    activations: new Map(),
    centroid: null,
    trajectory: [],
    step: 0
  };
}

export function activate(state: IChingState, addr: IChingAddress, strength: number): void {
  const key = `${addr.gate}:${addr.line}:${addr.color}:${addr.tone}:${addr.base}:${addr.filter}`;
  state.activations.set(key, Math.min(Math.max(strength, 0), 1));
  state.step++;
  state.trajectory.push(addr);
  state.centroid = computeCentroid(state);
}

export function computeCentroid(state: IChingState): IChingAddress | null {
  if (state.activations.size === 0) return null;

  let totalArcSec = 0;
  let totalWeight = 0;

  for (const [key, weight] of state.activations) {
    const parts = key.split(':');
    const addr: IChingAddress = {
      gate: parseInt(parts[0]) as GateNumber,
      line: parseInt(parts[1]) as LineNumber,
      color: parts[2] as Color,
      tone: parts[3] as Tone,
      base: parts[4] as Base,
      filter: parts[5] as PlanetaryFilter
    };
    const arcSec = addressToArcSeconds(addr);
    totalArcSec += arcSec * weight;
    totalWeight += weight;
  }

  // Convert back to nearest address
  const avgArcSec = totalArcSec / totalWeight;
  return arcSecondsToAddress(avgArcSec);
}

function arcSecondsToAddress(arcSec: number): IChingAddress {
  const gate = Math.floor(arcSec / 20250) + 1;
  const remainder = arcSec % 20250;
  const line = Math.floor(remainder / 3375) + 1;
  const colorRem = remainder % 3375;
  const colorIdx = Math.floor(colorRem / 844);
  const toneRem = colorRem % 844;
  const toneIdx = Math.floor(toneRem / 141);
  const baseRem = toneRem % 141;

  const colors: Color[] = ['red', 'black', 'white', 'yellow'];
  const tones: Tone[] = ['1st', '2nd', '3rd', '4th', '5th', '6th'];

  return {
    gate: Math.min(Math.max(gate, 1), 64) as GateNumber,
    line: Math.min(Math.max(line, 1), 6) as LineNumber,
    color: colors[Math.min(colorIdx, 3)],
    tone: tones[Math.min(toneIdx, 5)],
    base: baseRem < 70 ? 'left' : 'right',
    filter: 'sun'  // Default, would be determined by context
  };
}

// -----------------------------------------------------------
// TRAVERSAL — Moving through the I Ching space
// -----------------------------------------------------------

export interface TraversalStep {
  from: IChingAddress;
  to: IChingAddress;
  operator: TraversalOperator;
  cost: number;
  resonance: number;
}

export type TraversalOperator =
  | 'advance_line'      // Move to next line in same gate
  | 'retreat_line'      // Move to previous line
  | 'cross_gate'        // Jump to harmonic gate
  | 'planetary_shift'   // Change filter, same coordinate
  | 'circuit_traverse'  // Move along circuit
  | 'center_transition' // Move between centers
  | 'hexagram_flip'     // Invert trigrams
  | 'line_resonance';   // Jump to same line in different gate

export function traverse(
  from: IChingAddress,
  operator: TraversalOperator,
  target?: Partial<IChingAddress>
): TraversalStep {
  let to: IChingAddress = { ...from };
  let cost = 1;
  let resonance = 0;

  switch (operator) {
    case 'advance_line':
      to.line = Math.min(from.line + 1, 6) as LineNumber;
      cost = 1;
      resonance = 0.9;
      break;
    case 'retreat_line':
      to.line = Math.max(from.line - 1, 1) as LineNumber;
      cost = 1;
      resonance = 0.7;
      break;
    case 'cross_gate':
      if (target?.gate) {
        to.gate = target.gate;
        cost = Math.abs(target.gate - from.gate) * 0.5;
        resonance = 1 / (cost + 1);
      }
      break;
    case 'planetary_shift':
      if (target?.filter) {
        to.filter = target.filter;
        cost = 0.5;
        resonance = 0.8;
      }
      break;
    case 'circuit_traverse':
      // Move to next gate in same circuit
      cost = 2;
      resonance = 0.6;
      break;
    case 'center_transition':
      cost = 3;
      resonance = 0.4;
      break;
    case 'hexagram_flip':
      // Swap trigrams
      cost = 1.5;
      resonance = 0.85;
      break;
    case 'line_resonance':
      if (target?.gate) {
        to.gate = target.gate;
        cost = Math.abs(target.gate - from.gate) * 0.3;
        resonance = 0.95;  // Same line = strong resonance
      }
      break;
  }

  return { from, to, operator, cost, resonance };
}

// -----------------------------------------------------------
// DEPENDENCY TOPOLOGY — Design basin structure
// -----------------------------------------------------------

export interface DesignBasin {
  // A basin is a region of the I Ching space where states tend to settle
  center: IChingAddress;
  radius: number;  // In arc-seconds
  depth: number;   // Attractor strength
  gates: GateNumber[];
  circuit: CircuitName;
}

export function findBasin(addr: IChingAddress, basins: DesignBasin[]): DesignBasin | null {
  const arcSec = addressToArcSeconds(addr);
  let nearest: DesignBasin | null = null;
  let minDist = Infinity;

  for (const basin of basins) {
    const basinArcSec = addressToArcSeconds(basin.center);
    const dist = Math.abs(arcSec - basinArcSec);
    if (dist < basin.radius && dist < minDist) {
      minDist = dist;
      nearest = basin;
    }
  }

  return nearest;
}
