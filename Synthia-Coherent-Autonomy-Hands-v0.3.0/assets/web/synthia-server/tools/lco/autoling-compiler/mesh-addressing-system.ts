
/**
 * Mesh Addressing System (MAS) for AUTOLING Pattern Recognition Compiler
 * 69,120-node topology with I Ching hexagram-based addressing
 * 
 * Architecture: 5 Dimensions × 64 Gates × 6 Lines × 6 Colors × 6 Tones × 3 Bases
 * Total: 5 × 64 × 6 × 6 × 6 × 3 = 69,120 nodes
 * 
 * Each node is a 24-bit packed address:
 *   bits 0-2:   Dimension (0-4: Movement, Evolution, Being, Design, Space)
 *   bits 3-8:   Gate (0-63)
 *   bits 9-11:  Line (0-5)
 *   bits 12-14: Color (0-5)
 *   bits 15-17: Tone (0-5)
 *   bits 18-19: Base (0-2)
 *   bits 20-23: Reserved for state flags
 */

export const DIMENSIONS = [
  'Movement',   // Energy, Creation, Seeing, Landscape, Environment
  'Evolution',  // Gravity, Memory, Taste, Love, Light
  'Being',      // Matter, Touch, Sex, Survival
  'Design',     // Structure, Progress, Smell, Life, Art
  'Space'       // Form, Illusion, Hearing, Music, Freedom
] as const;

export const DIMENSION_COMPONENTS = [
  'Magnetic Monopole',     // Movement
  'Personality Crystal',   // Evolution
  'The Atom',              // Being
  'Design Crystal',        // Design
  'Personality Crystal'    // Space
] as const;

export const GATES = 64;
export const LINES = 6;
export const COLORS = 6;
export const TONES = 6;
export const BASES = 3;
export const TOTAL_NODES = 5 * 64 * 6 * 6 * 6 * 3; // 69,120

// I Ching hexagram mapping: 64 gates = 64 hexagrams
// Each hexagram is a 6-bit binary string (broken=0, solid=1)
export const HEXAGRAM_MAP: Record<number, string> = {
  1: '111111', 2: '000000', 3: '100010', 4: '010001', 5: '111010',
  6: '010111', 7: '010000', 8: '000010', 9: '111011', 10: '110111',
  11: '111000', 12: '000111', 13: '101111', 14: '111101', 15: '000100',
  16: '001000', 17: '100110', 18: '011001', 19: '110000', 20: '000011',
  21: '100101', 22: '101001', 23: '000001', 24: '100000', 25: '100111',
  26: '111100', 27: '100001', 28: '011110', 29: '010010', 30: '101101',
  31: '001110', 32: '011100', 33: '001111', 34: '111100', 35: '000101',
  36: '101000', 37: '101011', 38: '110101', 39: '001010', 40: '010100',
  41: '100011', 42: '110001', 43: '111110', 44: '011111', 45: '000110',
  46: '011000', 47: '010110', 48: '011010', 49: '101110', 50: '011101',
  51: '100100', 52: '001001', 53: '001011', 54: '110100', 55: '001101',
  56: '101100', 57: '011011', 58: '110110', 59: '010011', 60: '110010',
  61: '110011', 62: '001100', 63: '101010', 64: '010101'
};

// 36 channels (connections between gates)
export const CHANNELS: [number, number][] = [
  [1, 8], [1, 2], [2, 14], [3, 60], [4, 63], [5, 15],
  [6, 59], [7, 31], [9, 52], [10, 34], [10, 20], [11, 56],
  [12, 22], [13, 33], [16, 48], [17, 62], [18, 58], [19, 49],
  [20, 57], [21, 45], [23, 43], [24, 61], [25, 51], [26, 44],
  [27, 50], [28, 38], [29, 46], [30, 41], [32, 54], [34, 57],
  [35, 36], [37, 40], [39, 55], [42, 53], [47, 64], [60, 3]
];

export interface MeshAddress {
  dimension: number;  // 0-4
  gate: number;       // 0-63
  line: number;       // 0-5
  color: number;      // 0-5
  tone: number;       // 0-5
  base: number;       // 0-2
}

export class MeshAddressingSystem {
  private substrate: Float32Array;
  private adjacency: Map<number, Set<number>>;

  constructor() {
    // Flat memory substrate: 69,120 nodes × 8 floats each
    // [activation, resonance, fear, hope, desire, mutation, last_update, reserved]
    this.substrate = new Float32Array(TOTAL_NODES * 8);
    this.adjacency = this.buildAdjacency();
  }

  private buildAdjacency(): Map<number, Set<number>> {
    const adj = new Map<number, Set<number>>();

    // Build channel-based connections
    for (const [g1, g2] of CHANNELS) {
      for (let d = 0; d < 5; d++) {
        for (let l = 0; l < 6; l++) {
          for (let c = 0; c < 6; c++) {
            for (let t = 0; t < 6; t++) {
              for (let b = 0; b < 3; b++) {
                const addr1 = this.pack({ dimension: d, gate: g1-1, line: l, color: c, tone: t, base: b });
                const addr2 = this.pack({ dimension: d, gate: g2-1, line: l, color: c, tone: t, base: b });

                if (!adj.has(addr1)) adj.set(addr1, new Set());
                if (!adj.has(addr2)) adj.set(addr2, new Set());
                adj.get(addr1)!.add(addr2);
                adj.get(addr2)!.add(addr1);
              }
            }
          }
        }
      }
    }

    // Add dimensional cross-links (same gate, different dimension)
    for (let g = 0; g < 64; g++) {
      for (let l = 0; l < 6; l++) {
        for (let c = 0; c < 6; c++) {
          for (let t = 0; t < 6; t++) {
            for (let b = 0; b < 3; b++) {
              const baseAddrs: number[] = [];
              for (let d = 0; d < 5; d++) {
                baseAddrs.push(this.pack({ dimension: d, gate: g, line: l, color: c, tone: t, base: b }));
              }
              for (let i = 0; i < 5; i++) {
                for (let j = i + 1; j < 5; j++) {
                  if (!adj.has(baseAddrs[i])) adj.set(baseAddrs[i], new Set());
                  if (!adj.has(baseAddrs[j])) adj.set(baseAddrs[j], new Set());
                  adj.get(baseAddrs[i])!.add(baseAddrs[j]);
                  adj.get(baseAddrs[j])!.add(baseAddrs[i]);
                }
              }
            }
          }
        }
      }
    }

    return adj;
  }

  pack(addr: MeshAddress): number {
    return ((addr.dimension & 0x7) << 0) |
           ((addr.gate & 0x3F) << 3) |
           ((addr.line & 0x7) << 9) |
           ((addr.color & 0x7) << 12) |
           ((addr.tone & 0x7) << 15) |
           ((addr.base & 0x3) << 18);
  }

  unpack(packed: number): MeshAddress {
    return {
      dimension: (packed >> 0) & 0x7,
      gate: (packed >> 3) & 0x3F,
      line: (packed >> 9) & 0x7,
      color: (packed >> 12) & 0x7,
      tone: (packed >> 15) & 0x7,
      base: (packed >> 18) & 0x3
    };
  }

  getIndex(packed: number): number {
    const addr = this.unpack(packed);
    return ((addr.dimension * 64 + addr.gate) * 6 + addr.line) * 6 + addr.color;
  }

  getState(packed: number): Float32Array {
    const idx = this.getIndex(packed) * 8;
    return this.substrate.subarray(idx, idx + 8);
  }

  activate(packed: number, intensity: number = 1.0): void {
    const state = this.getState(packed);
    state[0] = Math.min(1.0, state[0] + intensity); // activation
    state[6] = performance.now(); // last_update

    // Propagate to neighbors
    const neighbors = this.adjacency.get(packed);
    if (neighbors) {
      for (const neighbor of neighbors) {
        const nState = this.getState(neighbor);
        nState[1] = Math.min(1.0, nState[1] + intensity * 0.3); // resonance
      }
    }
  }

  getHexagram(gate: number): string {
    return HEXAGRAM_MAP[gate + 1] || '000000';
  }

  mutate(gate: number, line: number): string {
    const hex = this.getHexagram(gate).split('');
    hex[line] = hex[line] === '1' ? '0' : '1';
    return hex.join('');
  }

  getActiveNodes(threshold: number = 0.1): Array<{ address: MeshAddress; packed: number; state: Float32Array }> {
    const active: Array<{ address: MeshAddress; packed: number; state: Float32Array }> = [];
    for (let i = 0; i < TOTAL_NODES; i++) {
      const packed = this.indexToPacked(i);
      const state = this.getState(packed);
      if (state[0] > threshold || state[1] > threshold) {
        active.push({ address: this.unpack(packed), packed, state });
      }
    }
    return active;
  }

  private indexToPacked(index: number): number {
    const base = index;
    const dim = Math.floor(base / (64 * 6 * 6 * 6 * 3));
    const rem1 = base % (64 * 6 * 6 * 6 * 3);
    const gate = Math.floor(rem1 / (6 * 6 * 6 * 3));
    const rem2 = rem1 % (6 * 6 * 6 * 3);
    const line = Math.floor(rem2 / (6 * 6 * 3));
    const rem3 = rem2 % (6 * 6 * 3);
    const color = Math.floor(rem3 / (6 * 3));
    const rem4 = rem3 % (6 * 3);
    const tone = Math.floor(rem4 / 3);
    const b = rem4 % 3;
    return this.pack({ dimension: dim, gate, line, color, tone, base: b });
  }

  getResonanceField(center: number, radius: number = 3): Map<number, number> {
    const field = new Map<number, number>();
    const visited = new Set<number>();
    const queue: Array<{ node: number; dist: number }> = [{ node: center, dist: 0 }];

    while (queue.length > 0) {
      const { node, dist } = queue.shift()!;
      if (visited.has(node)) continue;
      visited.add(node);

      const decay = Math.exp(-dist * 0.5);
      field.set(node, decay);

      if (dist < radius) {
        const neighbors = this.adjacency.get(node);
        if (neighbors) {
          for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
              queue.push({ node: neighbor, dist: dist + 1 });
            }
          }
        }
      }
    }

    return field;
  }
}

export default MeshAddressingSystem;
