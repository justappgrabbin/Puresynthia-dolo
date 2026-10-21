
/**
 * W-H Interrogative Core for AUTOLING Pattern Recognition Compiler
 * 
 * Five questions probe any input across five dimensions:
 * WHERE (Movement) → Spatial/Movement Container → Directional vectors
 * WHAT (Evolution) → Semantic/Evolution Container → Functional markers
 * WHEN (Being) → Temporal/Being Container → Cyclical presence
 * WHY (Design) → Causal/Design Container → Motivational intent
 * WHO (Space) → Identity/Space Container → Entity/agentive markers
 * 
 * The Core performs recursive convergence to lock onto a gate state.
 */

import { MeshAddressingSystem, MeshAddress, TOTAL_NODES } from './mesh-addressing-system';

export interface HContainer {
  probe: string;
  h_value: number | null;      // Packed mesh address or null
  contact_clues: string[];      // Extracted semantic tokens
  node_links: number[];         // Candidate packed addresses
  confidence: number;           // 0.0 - 1.0
  dimension: number;           // 0-4 mapping
}

export interface InterrogationManifest {
  input_id: string;
  raw_input: string;
  h_containers: {
    where: HContainer;
    what: HContainer;
    when: HContainer;
    why: HContainer;
    who: HContainer;
  };
  convergence: {
    is_locked: boolean;
    locked_gate_id: number | null;
    locked_address: MeshAddress | null;
    confidence_score: number;
    recursive_depth: number;
    convergence_path: string[];
  };
  timestamp: number;
}

// Dimensional mapping for W-H probes
const DIMENSION_MAP: Record<string, number> = {
  'where': 0,  // Movement
  'what': 1,   // Evolution
  'when': 2,   // Being
  'why': 3,    // Design
  'who': 4     // Space
};

// Contact clue extraction patterns for each dimension
const EXTRACTION_PATTERNS: Record<string, RegExp[]> = {
  'where': [
    /\b(north|south|east|west|up|down|left|right|forward|back|center|edge|boundary)\b/gi,
    /\b(in|at|on|under|over|through|between|around|within|beyond)\b/gi,
    /\b(here|there|where|place|space|location|position|direction)\b/gi,
    /\b(move|go|come|arrive|depart|travel|flow|drift|orbit)\b/gi
  ],
  'what': [
    /\b(is|are|was|were|become|transform|change|evolve|grow|develop)\b/gi,
    /\b(thing|object|entity|form|shape|structure|pattern|system)\b/gi,
    /\b(function|purpose|role|task|action|operation|process)\b/gi,
    /\b(energy|force|power|drive|momentum|impulse)\b/gi
  ],
  'when': [
    /\b(now|then|before|after|during|while|until|since|whenever)\b/gi,
    /\b(time|moment|instant|period|cycle|phase|stage|epoch)\b/gi,
    /\b(begin|start|end|finish|continue|persist|last|endure)\b/gi,
    /\b(always|never|sometimes|often|rarely|soon|later|eventually)\b/gi
  ],
  'why': [
    /\b(because|since|as|therefore|thus|hence|consequently)\b/gi,
    /\b(reason|cause|motive|intention|goal|aim|purpose|meaning)\b/gi,
    /\b(design|plan|structure|pattern|logic|principle|law)\b/gi,
    /\b(need|want|desire|seek|strive|drive|compel|force)\b/gi
  ],
  'who': [
    /\b(I|you|he|she|it|we|they|self|other|one|all|none)\b/gi,
    /\b(person|being|entity|agent|actor|subject|object|witness)\b/gi,
    /\b(identity|name|role|mask|face|soul|spirit|essence)\b/gi,
    /\b(know|see|feel|think|believe|understand|perceive|experience)\b/gi
  ]
};

export class WHInterrogativeCore {
  private mesh: MeshAddressingSystem;
  private convergenceThreshold: number;
  private maxRecursiveDepth: number;

  constructor(mesh: MeshAddressingSystem, threshold: number = 0.75, maxDepth: number = 7) {
    this.mesh = mesh;
    this.convergenceThreshold = threshold;
    this.maxRecursiveDepth = maxDepth;
  }

  /**
   * Main entry: probe an input and converge to a gate lock
   */
  async interrogate(input: string): Promise<InterrogationManifest> {
    const manifest: InterrogationManifest = {
      input_id: this.generateUUID(),
      raw_input: input,
      h_containers: {
        where: this.createContainer('where'),
        what: this.createContainer('what'),
        when: this.createContainer('when'),
        why: this.createContainer('why'),
        who: this.createContainer('who')
      },
      convergence: {
        is_locked: false,
        locked_gate_id: null,
        locked_address: null,
        confidence_score: 0.0,
        recursive_depth: 0,
        convergence_path: []
      },
      timestamp: Date.now()
    };

    // Phase 1: Extract contact clues from input
    this.extractClues(manifest, input);

    // Phase 2: Map clues to candidate nodes
    this.mapCluesToNodes(manifest);

    // Phase 3: Recursive convergence
    await this.converge(manifest);

    return manifest;
  }

  private createContainer(probe: string): HContainer {
    return {
      probe: probe.toUpperCase() + '?',
      h_value: null,
      contact_clues: [],
      node_links: [],
      confidence: 0.0,
      dimension: DIMENSION_MAP[probe]
    };
  }

  private extractClues(manifest: InterrogationManifest, input: string): void {
    const lowerInput = input.toLowerCase();

    for (const [probe, container] of Object.entries(manifest.h_containers)) {
      const patterns = EXTRACTION_PATTERNS[probe] || [];
      const clues: string[] = [];

      for (const pattern of patterns) {
        const matches = lowerInput.match(pattern);
        if (matches) {
          clues.push(...matches.map(m => m.toLowerCase()));
        }
      }

      // Remove duplicates and score
      container.contact_clues = [...new Set(clues)];
      container.confidence = Math.min(1.0, container.contact_clues.length / 5);
    }
  }

  private mapCluesToNodes(manifest: InterrogationManifest): void {
    for (const [probe, container] of Object.entries(manifest.h_containers)) {
      const candidates: number[] = [];

      // Hash clues to gate space (0-63)
      for (const clue of container.contact_clues) {
        const gateHash = this.hashToGate(clue);
        const lineHash = this.hashToLine(clue);
        const colorHash = this.hashToColor(clue);
        const toneHash = this.hashToTone(clue);

        // Create candidate addresses at this dimension
        for (let base = 0; base < 3; base++) {
          const packed = this.mesh.pack({
            dimension: container.dimension,
            gate: gateHash,
            line: lineHash,
            color: colorHash,
            tone: toneHash,
            base
          });
          candidates.push(packed);
        }
      }

      container.node_links = [...new Set(candidates)];
    }
  }

  private async converge(manifest: InterrogationManifest): Promise<void> {
    let depth = 0;
    let converged = false;

    while (!converged && depth < this.maxRecursiveDepth) {
      depth++;
      manifest.convergence.recursive_depth = depth;

      // Calculate resonance across all containers
      const resonanceMap = new Map<number, number>();

      for (const container of Object.values(manifest.h_containers)) {
        for (const node of container.node_links) {
          const current = resonanceMap.get(node) || 0;
          resonanceMap.set(node, current + container.confidence);
        }
      }

      // Find highest resonance cluster
      let bestNode: number | null = null;
      let bestScore = 0;

      for (const [node, score] of resonanceMap) {
        if (score > bestScore) {
          bestScore = score;
          bestNode = node;
        }
      }

      if (bestNode !== null && bestScore >= this.convergenceThreshold * 5) {
        // Lock achieved
        const addr = this.mesh.unpack(bestNode);
        manifest.convergence.is_locked = true;
        manifest.convergence.locked_gate_id = addr.gate;
        manifest.convergence.locked_address = addr;
        manifest.convergence.confidence_score = bestScore / 5;
        manifest.convergence.convergence_path.push(
          `Depth ${depth}: Locked Gate ${addr.gate + 1} at ${DIMENSIONS[addr.dimension]} dimension`
        );

        // Activate the locked node in the mesh
        this.mesh.activate(bestNode, manifest.convergence.confidence_score);
        converged = true;
      } else {
        // Divergence: drill down
        manifest.convergence.convergence_path.push(
          `Depth ${depth}: Divergence detected (score ${bestScore.toFixed(2)}), re-segmenting...`
        );

        // Re-segment: expand clue extraction with synonyms
        this.resegment(manifest);
      }
    }

    if (!converged) {
      manifest.convergence.convergence_path.push(
        `Max depth reached (${this.maxRecursiveDepth}). No convergence achieved.`
      );
    }
  }

  private resegment(manifest: InterrogationManifest): void {
    // Expand contact clues with semantic neighbors
    for (const container of Object.values(manifest.h_containers)) {
      const expanded: string[] = [...container.contact_clues];

      for (const clue of container.contact_clues) {
        // Add phonetic/semantic variants
        expanded.push(...this.getSemanticNeighbors(clue));
      }

      container.contact_clues = [...new Set(expanded)];
      container.confidence = Math.min(1.0, container.contact_clues.length / 10);
    }

    // Re-map
    this.mapCluesToNodes(manifest);
  }

  private getSemanticNeighbors(word: string): string[] {
    // Simple phonetic neighbor generation
    const neighbors: string[] = [];
    const vowels = 'aeiou';

    for (let i = 0; i < word.length; i++) {
      if (vowels.includes(word[i])) {
        for (const v of vowels) {
          neighbors.push(word.slice(0, i) + v + word.slice(i + 1));
        }
      }
    }

    return neighbors;
  }

  private hashToGate(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash) % 64;
  }

  private hashToLine(str: string): number {
    return Math.abs(this.hashToGate(str) * 7) % 6;
  }

  private hashToColor(str: string): number {
    return Math.abs(this.hashToGate(str) * 13) % 6;
  }

  private hashToTone(str: string): number {
    return Math.abs(this.hashToGate(str) * 17) % 6;
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  /**
   * Get the current resonance field around a locked gate
   */
  getResonanceField(gateId: number, dimension: number = 0): Map<number, number> {
    const centerAddr = this.mesh.pack({
      dimension,
      gate: gateId,
      line: 0,
      color: 0,
      tone: 0,
      base: 0
    });
    return this.mesh.getResonanceField(centerAddr, 3);
  }
}

export default WHInterrogativeCore;
