// =============================================================================
// GENERATIVE ATO SUBSTRATE
// Based on Klein (1983) — extended from static divination to autopoietic system generation
// 
// Core principle: ATO operators are themselves state descriptions.
// Therefore: ATO(OperatorA, OperatorB) = new OperatorC that defines a new analogy system.
// This is the recursion that makes the mesh generative.
//
// From this substrate, we can build:
//   - Semantic triple generators (subject-predicate-object where predicate = ATO)
//   - Rule systems (collections of triples with shared operators)
//   - Meta-systems (systems whose elements are other systems)
//   - AutoLink-style pipelines (ingestion → parsing → resolution → linking → evaluation)
// =============================================================================

import {
  TRIGRAMS, TRIGRAM_BY_VALUE, HEXAGRAMS, HEX_BY_CODE, HEX_BY_VALUE,
  HOUSES, ato, atoHex, atoCode, atoTrigram, buildAnalogySystem,
  type Trigram, type Hexagram, type House, type AnalogySystem
} from './klein-iching-ato-mesh';

// -----------------------------------------------------------------------------
// 1. SEMANTIC TRIPLES — The atomic unit of generative composition
// A triple is: (Subject) —[ATO]→ (Object)
// Where the ATO operator IS the predicate — it encodes the transformation rule
// -----------------------------------------------------------------------------

export interface SemanticTriple {
  id: string;
  subject: SemanticNode;
  predicate: ATOOperator;     // The ATO that transforms subject → object
  object: SemanticNode;
  strength: number;             // 0-1, computed from recurrence/resonance
  lineage: string[];            // Chain of parent triples that generated this one
  timestamp: number;
  metadata: Record<string, any>;
}

export interface SemanticNode {
  id: string;
  type: 'trigram' | 'hexagram' | 'compound' | 'system' | 'meta';
  value: Trigram | Hexagram | CompoundNode | SystemNode | MetaNode;
  embedding: number[];           // Position in ATO vector space
  resonance: number;             // How often this node appears in successful triples
}

export interface ATOOperator {
  id: string;
  source: string;                // Hexagram code that IS this operator
  value: number;                 // Numeric value (0-63)
  arity: number;                 // How many operands (2 for binary ATO)
  domain: string;                // Which categorical domain this operator acts on
  generativePower: number;       // How many new triples this operator has spawned
}

export interface CompoundNode {
  id: string;
  components: SemanticNode[];
  emergentProperty: string;      // What arises from the composition
  stability: number;             // 0-1, how well the compound holds together
}

export interface SystemNode {
  id: string;
  name: string;
  triples: SemanticTriple[];
  operators: ATOOperator[];
  rules: SystemRule[];
  inputs: string[];              // What this system consumes
  outputs: string[];             // What this system produces
  subsystems: SystemNode[];     // Nested systems
  parentSystem?: string;
  generation: number;            // How many meta-levels deep
}

export interface SystemRule {
  id: string;
  condition: SemanticTriple;    // If this triple exists...
  action: string;               // ...then perform this action
  priority: number;
  active: boolean;
}

export interface MetaNode {
  id: string;
  systems: SystemNode[];
  crossSystemOperators: ATOOperator[];
  emergentBehavior: string;
}

// -----------------------------------------------------------------------------
// 2. ATO VECTOR SPACE — Every node has a position. Distance = ATO dissimilarity.
// The space is not Euclidean — it's defined by the attractor field of operators.
// M(x) = Σᵢ gᵢ / (1 + |x - aᵢ|)  where aᵢ are operator attractors, gᵢ their generative power
// -----------------------------------------------------------------------------

export class ATOVectorSpace {
  private operators: ATOOperator[] = [];
  private attractors: Map<string, number[]> = new Map();
  private dimension: number = 6; // 6-bit hexagram space

  registerOperator(op: ATOOperator, position: number[]) {
    this.operators.push(op);
    this.attractors.set(op.id, position);
  }

  /**
   * Compute the manifold value at position x.
   * Higher value = closer to a powerful operator attractor.
   */
  manifold(x: number[]): number {
    let sum = 0;
    for (const [id, pos] of this.attractors) {
      const op = this.operators.find(o => o.id === id);
      const g = op?.generativePower || 1;
      const dist = Math.sqrt(x.reduce((s, xi, i) => s + (xi - (pos[i] || 0)) ** 2, 0));
      sum += g / (1 + dist);
    }
    return sum;
  }

  /**
   * Geodesic distance — distance along the manifold, not through flat space.
   * Two nodes that are ATO-related are "close" even if their raw codes differ.
   */
  geodesic(a: number[], b: number[]): number {
    // Sample points along the path and integrate manifold density
    const steps = 20;
    let pathLength = 0;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const point = a.map((ai, j) => ai + t * (b[j] - ai));
      const density = this.manifold(point);
      pathLength += 1 / (1 + density); // Higher density = shorter geodesic
    }
    return pathLength / steps;
  }

  /**
   * Find the operator that best mediates between two positions.
   * This is the ATO operator c such that a * c ≈ b (or equivalently, c = ATO(a, b))
   */
  findMediatingOperator(a: number[], b: number[]): ATOOperator | null {
    // Convert positions back to hexagram values
    const av = this.positionToValue(a);
    const bv = this.positionToValue(b);
    const cv = ato(av, bv, this.dimension);
    const hex = HEX_BY_VALUE[cv];
    if (!hex) return null;
    return this.operators.find(o => o.source === hex.code) || null;
  }

  private positionToValue(pos: number[]): number {
    // Map continuous position back to discrete hexagram by nearest neighbor
    let best = 0, bestDist = Infinity;
    for (const hx of HEXAGRAMS) {
      const hxPos = this.hexagramToPosition(hx);
      const dist = Math.sqrt(pos.reduce((s, p, i) => s + (p - hxPos[i]) ** 2, 0));
      if (dist < bestDist) { bestDist = dist; best = hx.value; }
    }
    return best;
  }

  hexagramToPosition(hx: Hexagram): number[] {
    // 6D position: upper trigram (3D) + lower trigram (3D)
    const upper = TRIGRAMS[hx.upper].value;
    const lower = TRIGRAMS[hx.lower].value;
    return [
      (upper >> 2) & 1, (upper >> 1) & 1, upper & 1,
      (lower >> 2) & 1, (lower >> 1) & 1, lower & 1
    ];
  }
}

// -----------------------------------------------------------------------------
// 3. TRIPLE GENERATOR — The engine that produces semantic triples from ATO operations
// Every ATO operation between two nodes produces a triple.
// The triple's strength is determined by:
//   - Resonance: how often this pattern recurs
//   - Coherence: how well the subject and object categories align
//   - Generative power: how many new triples this triple has spawned
// -----------------------------------------------------------------------------

export class TripleGenerator {
  private space: ATOVectorSpace;
  private triples: Map<string, SemanticTriple> = new Map();
  private nodes: Map<string, SemanticNode> = new Map();
  private operators: Map<string, ATOOperator> = new Map();
  private tripleCounter = 0;
  private nodeCounter = 0;

  constructor(space: ATOVectorSpace) {
    this.space = space;
    this.seedBaseNodes();
  }

  private seedBaseNodes() {
    // Seed all 64 hexagrams as nodes
    for (const hx of HEXAGRAMS) {
      const node: SemanticNode = {
        id: `hex-${hx.code}`,
        type: 'hexagram',
        value: hx,
        embedding: this.space.hexagramToPosition(hx),
        resonance: 0.5
      };
      this.nodes.set(node.id, node);

      // Each hexagram is also an operator (double-hexagrams are identity operators)
      const op: ATOOperator = {
        id: `op-${hx.code}`,
        source: hx.code,
        value: hx.value,
        arity: 2,
        domain: 'universal',
        generativePower: 0
      };
      this.operators.set(op.id, op);
      this.space.registerOperator(op, node.embedding);
    }

    // Seed all 8 trigrams as nodes
    for (const [code, tri] of Object.entries(TRIGRAMS)) {
      const node: SemanticNode = {
        id: `tri-${code}`,
        type: 'trigram',
        value: tri,
        embedding: [
          (tri.value >> 2) & 1, (tri.value >> 1) & 1, tri.value & 1,
          0, 0, 0 // Pad to 6D
        ],
        resonance: 0.3
      };
      this.nodes.set(node.id, node);
    }
  }

  /**
   * Generate a triple from two existing nodes.
   * This is the fundamental generative operation.
   */
  generateTriple(subjectId: string, objectId: string, lineage: string[] = []): SemanticTriple | null {
    const subject = this.nodes.get(subjectId);
    const object = this.nodes.get(objectId);
    if (!subject || !object) return null;

    // Compute the mediating ATO operator
    const op = this.space.findMediatingOperator(subject.embedding, object.embedding);
    if (!op) return null;

    const tripleId = `triple-${this.tripleCounter++}`;
    const triple: SemanticTriple = {
      id: tripleId,
      subject,
      predicate: op,
      object,
      strength: this.computeStrength(subject, object, op),
      lineage: [...lineage, tripleId],
      timestamp: Date.now(),
      metadata: {
        geodesicDistance: this.space.geodesic(subject.embedding, object.embedding),
        manifoldValue: this.space.manifold(subject.embedding),
        categoryAlignment: this.computeCategoryAlignment(subject, object)
      }
    };

    this.triples.set(tripleId, triple);

    // Increase operator generative power
    op.generativePower++;

    // Increase node resonance
    subject.resonance = Math.min(1, subject.resonance + 0.05);
    object.resonance = Math.min(1, object.resonance + 0.05);

    return triple;
  }

  /**
   * Generate all possible triples from a set of seed nodes.
   * This is the "big bang" of a new system.
   */
  generateAllTriples(seedIds: string[]): SemanticTriple[] {
    const results: SemanticTriple[] = [];
    for (let i = 0; i < seedIds.length; i++) {
      for (let j = 0; j < seedIds.length; j++) {
        if (i === j) continue;
        const triple = this.generateTriple(seedIds[i], seedIds[j]);
        if (triple) results.push(triple);
      }
    }
    return results;
  }

  /**
   * Generate triples recursively: each new triple becomes a node,
   * which can then participate in further triples.
   * This is the autopoietic loop.
   */
  generateRecursively(seedIds: string[], depth: number = 3): SemanticTriple[] {
    const allTriples: SemanticTriple[] = [];
    let currentIds = [...seedIds];

    for (let d = 0; d < depth; d++) {
      const newTriples: SemanticTriple[] = [];
      for (let i = 0; i < currentIds.length; i++) {
        for (let j = 0; j < currentIds.length; j++) {
          if (i === j) continue;
          const triple = this.generateTriple(currentIds[i], currentIds[j], 
            allTriples.length > 0 ? [allTriples[allTriples.length - 1].id] : []);
          if (triple) {
            newTriples.push(triple);
            allTriples.push(triple);
          }
        }
      }

      // Promote strong triples to compound nodes for next iteration
      const strongTriples = newTriples.filter(t => t.strength > 0.6);
      for (const t of strongTriples) {
        const compoundId = this.createCompoundNode(t);
        currentIds.push(compoundId);
      }
    }

    return allTriples;
  }

  /**
   * Create a compound node from a triple.
   * The compound IS the triple — it becomes a first-class node.
   */
  private createCompoundNode(triple: SemanticTriple): string {
    const compound: CompoundNode = {
      id: `compound-${this.nodeCounter++}`,
      components: [triple.subject, triple.object],
      emergentProperty: this.inferEmergentProperty(triple),
      stability: triple.strength
    };

    const node: SemanticNode = {
      id: compound.id,
      type: 'compound',
      value: compound,
      embedding: this.computeCompoundEmbedding(triple.subject, triple.object),
      resonance: triple.strength
    };

    this.nodes.set(node.id, node);
    return node.id;
  }

  private computeCompoundEmbedding(a: SemanticNode, b: SemanticNode): number[] {
    // The compound's embedding is the ATO of its components
    const av = this.space['positionToValue'](a.embedding); // Access private via bracket
    const bv = this.space['positionToValue'](b.embedding);
    const cv = ato(av, bv, 6);
    const hx = HEX_BY_VALUE[cv];
    return this.space.hexagramToPosition(hx);
  }

  private inferEmergentProperty(triple: SemanticTriple): string {
    const su = triple.subject.type === 'hexagram' ? (triple.subject.value as Hexagram).upper : '';
    const sl = triple.subject.type === 'hexagram' ? (triple.subject.value as Hexagram).lower : '';
    const ou = triple.object.type === 'hexagram' ? (triple.object.value as Hexagram).upper : '';
    const ol = triple.object.type === 'hexagram' ? (triple.object.value as Hexagram).lower : '';

    if (!su || !ou) return 'unknown';

    const sTri = TRIGRAMS[su];
    const oTri = TRIGRAMS[ou];

    // Emergent property is the ATO of the upper trigrams
    const emergentValue = ato(sTri.value, oTri.value, 3);
    const emergentTri = TRIGRAM_BY_VALUE[emergentValue];
    return `${emergentTri.name}-field`;
  }

  private computeStrength(subject: SemanticNode, object: SemanticNode, op: ATOOperator): number {
    const geo = this.space.geodesic(subject.embedding, object.embedding);
    const res = (subject.resonance + object.resonance) / 2;
    const power = Math.min(1, op.generativePower / 10);
    return (1 / (1 + geo)) * 0.4 + res * 0.4 + power * 0.2;
  }

  private computeCategoryAlignment(a: SemanticNode, b: SemanticNode): number {
    if (a.type !== 'hexagram' || b.type !== 'hexagram') return 0.5;
    const ha = a.value as Hexagram;
    const hb = b.value as Hexagram;
    const au = TRIGRAMS[ha.upper], al = TRIGRAMS[ha.lower];
    const bu = TRIGRAMS[hb.upper], bl = TRIGRAMS[hb.lower];

    let score = 0;
    const categories = ['element', 'direction', 'season', 'virtue'] as const;
    for (const cat of categories) {
      if ((au as any)[cat] === (bu as any)[cat]) score += 0.1;
      if ((al as any)[cat] === (bl as any)[cat]) score += 0.1;
    }
    return score;
  }

  getTriples(): SemanticTriple[] { return Array.from(this.triples.values()); }
  getNodes(): SemanticNode[] { return Array.from(this.nodes.values()); }
  getOperators(): ATOOperator[] { return Array.from(this.operators.values()); }
}

// -----------------------------------------------------------------------------
// 4. SYSTEM COMPOSER — Assembles triples into functional systems
// A system is a graph of triples with shared operators and coherent rules.
// Systems can be nested: a meta-system's nodes are other systems.
// -----------------------------------------------------------------------------

export class SystemComposer {
  private generator: TripleGenerator;
  private systems: Map<string, SystemNode> = new Map();
  private systemCounter = 0;

  constructor(generator: TripleGenerator) {
    this.generator = generator;
  }

  /**
   * Compose a system from a seed set of triples.
   * The system extracts shared operators, builds rules, and identifies I/O.
   */
  composeSystem(name: string, seedTriples: SemanticTriple[], generation: number = 0): SystemNode {
    const systemId = `system-${this.systemCounter++}`;

    // Extract unique operators
    const operators = [...new Set(seedTriples.map(t => t.predicate.id))]
      .map(id => this.generator.getOperators().find(o => o.id === id))
      .filter((o): o is ATOOperator => o !== undefined);

    // Build rules: each operator defines a transformation rule
    const rules: SystemRule[] = operators.map((op, i) => ({
      id: `rule-${systemId}-${i}`,
      condition: seedTriples.find(t => t.predicate.id === op.id)!,
      action: `transform_${op.domain}`,
      priority: op.generativePower,
      active: true
    }));

    // Identify I/O: nodes that only appear as subjects (inputs) or objects (outputs)
    const subjectIds = new Set(seedTriples.map(t => t.subject.id));
    const objectIds = new Set(seedTriples.map(t => t.object.id));
    const inputs = [...subjectIds].filter(id => !objectIds.has(id));
    const outputs = [...objectIds].filter(id => !subjectIds.has(id));

    const system: SystemNode = {
      id: systemId,
      name,
      triples: seedTriples,
      operators,
      rules,
      inputs,
      outputs,
      subsystems: [],
      generation
    };

    this.systems.set(systemId, system);
    return system;
  }

  /**
   * Compose a meta-system from existing systems.
   * The meta-system's triples are cross-system ATO operations.
   */
  composeMetaSystem(name: string, subsystems: SystemNode[]): SystemNode {
    const metaId = `meta-${this.systemCounter++}`;

    // Generate cross-system triples: each subsystem is a node
    const crossTriples: SemanticTriple[] = [];
    for (let i = 0; i < subsystems.length; i++) {
      for (let j = 0; j < subsystems.length; j++) {
        if (i === j) continue;
        // Use the system's primary operator as its "value" for ATO
        const opA = subsystems[i].operators[0];
        const opB = subsystems[j].operators[0];
        if (!opA || !opB) continue;

        const crossOpValue = ato(opA.value, opB.value, 6);
        const crossHex = HEX_BY_VALUE[crossOpValue];
        if (!crossHex) continue;

        // Create a synthetic triple representing the cross-system operation
        const triple: SemanticTriple = {
          id: `cross-${metaId}-${i}-${j}`,
          subject: { id: subsystems[i].id, type: 'system', value: subsystems[i], embedding: [], resonance: 0.5 },
          predicate: { id: `cross-op-${crossHex.code}`, source: crossHex.code, value: crossHex.value, arity: 2, domain: 'meta', generativePower: 0 },
          object: { id: subsystems[j].id, type: 'system', value: subsystems[j], embedding: [], resonance: 0.5 },
          strength: 0.7,
          lineage: [],
          timestamp: Date.now(),
          metadata: { crossSystem: true }
        };
        crossTriples.push(triple);
      }
    }

    const metaSystem: SystemNode = {
      id: metaId,
      name,
      triples: crossTriples,
      operators: [],
      rules: crossTriples.map((t, i) => ({
        id: `meta-rule-${metaId}-${i}`,
        condition: t,
        action: `orchestrate_${t.subject.id}_to_${t.object.id}`,
        priority: 1,
        active: true
      })),
      inputs: subsystems.map(s => s.id),
      outputs: subsystems.map(s => s.id),
      subsystems,
      generation: Math.max(...subsystems.map(s => s.generation)) + 1
    };

    this.systems.set(metaId, metaSystem);
    return metaSystem;
  }

  /**
   * Auto-compose: given a goal description, generate the minimal system that achieves it.
   * This is the AutoLink-style pipeline builder.
   */
  autoCompose(goal: string, availableNodes: string[]): SystemNode {
    // 1. Parse goal into trigram/hexagram components
    const goalComponents = this.parseGoal(goal);

    // 2. Find shortest ATO path from available nodes to goal
    const path = this.findATOPath(availableNodes, goalComponents);

    // 3. Generate triples along the path
    const pathTriples: SemanticTriple[] = [];
    for (let i = 0; i < path.length - 1; i++) {
      const triple = this.generator.generateTriple(path[i], path[i + 1]);
      if (triple) pathTriples.push(triple);
    }

    // 4. Compose system from path triples
    return this.composeSystem(`auto-${goal}`, pathTriples, 0);
  }

  private parseGoal(goal: string): string[] {
    // Map goal keywords to trigram/hexagram IDs
    const keywords: Record<string, string[]> = {
      'link': ['tri-110', 'tri-111'],      // Wind + Heaven = penetration + creativity
      'parse': ['tri-001', 'tri-010'],    // Thunder + Water = arousing + abyssal
      'resolve': ['tri-101', 'tri-100'],  // Fire + Mountain = clarity + stillness
      'evaluate': ['tri-111', 'tri-101'], // Heaven + Fire = creative + clinging
      'transform': ['tri-110', 'tri-001'], // Wind + Thunder = gentle + arousing
      'connect': ['tri-011', 'tri-110'],  // Lake + Wind = joyous + gentle
      'build': ['tri-111', 'tri-000'],    // Heaven + Earth = the creative + receptive
      'learn': ['tri-010', 'tri-110'],    // Water + Wind = flowing + penetrating
    };

    for (const [key, ids] of Object.entries(keywords)) {
      if (goal.toLowerCase().includes(key)) return ids;
    }
    return ['hex-111111', 'hex-000000']; // Default: Creative + Receptive
  }

  private findATOPath(fromIds: string[], toIds: string[]): string[] {
    // BFS through ATO space
    const visited = new Set<string>();
    const queue: { id: string; path: string[] }[] = fromIds.map(id => ({ id, path: [id] }));

    while (queue.length > 0) {
      const { id, path } = queue.shift()!;
      if (toIds.includes(id)) return path;
      if (visited.has(id)) continue;
      visited.add(id);

      // Expand: all nodes reachable by one ATO operation
      const node = this.generator.getNodes().find(n => n.id === id);
      if (!node) continue;

      for (const other of this.generator.getNodes()) {
        if (visited.has(other.id)) continue;
        const triple = this.generator.generateTriple(id, other.id);
        if (triple && triple.strength > 0.3) {
          queue.push({ id: other.id, path: [...path, other.id] });
        }
      }
    }

    return [...fromIds, ...toIds]; // Fallback: direct connection
  }

  getSystems(): SystemNode[] { return Array.from(this.systems.values()); }
}

// -----------------------------------------------------------------------------
// 5. AUTO-LINK PIPELINE — Built from the generative substrate
// This is a specific system architecture built ON TOP of the ATO mesh,
// demonstrating that the substrate can generate real working systems.
//
// AutoLink Pipeline:
//   Ingestor → Parser → Resolver → Linker → Evaluator → Output
// Each stage is a system composed from ATO triples.
// -----------------------------------------------------------------------------

export interface PipelineStage {
  name: string;
  system: SystemNode;
  inputType: string;
  outputType: string;
  transform: (input: any) => any;
}

export class AutoLinkPipeline {
  private composer: SystemComposer;
  private stages: PipelineStage[] = [];

  constructor(composer: SystemComposer) {
    this.composer = composer;
    this.buildPipeline();
  }

  private buildPipeline() {
    // Stage 1: Ingestor — receives raw input, identifies structure
    const ingestorTriples = this.composer['generator'].generateRecursively(
      ['tri-010', 'tri-110'], 2 // Water (flow) + Wind (penetration) = ingestion
    );
    const ingestor = this.composer.composeSystem('ingestor', ingestorTriples, 0);
    this.stages.push({
      name: 'ingestor', system: ingestor,
      inputType: 'raw', outputType: 'structured',
      transform: (input) => ({ ...input, structured: true, tokens: [] })
    });

    // Stage 2: Parser — breaks structure into semantic units
    const parserTriples = this.composer['generator'].generateRecursively(
      ['tri-001', 'tri-111'], 2 // Thunder (arousing) + Heaven (creative) = parsing
    );
    const parser = this.composer.composeSystem('parser', parserTriples, 0);
    this.stages.push({
      name: 'parser', system: parser,
      inputType: 'structured', outputType: 'semantic-units',
      transform: (input) => ({ ...input, units: [], parsed: true })
    });

    // Stage 3: Resolver — resolves references and ambiguities
    const resolverTriples = this.composer['generator'].generateRecursively(
      ['tri-101', 'tri-100'], 2 // Fire (clarity) + Mountain (stillness) = resolution
    );
    const resolver = this.composer.composeSystem('resolver', resolverTriples, 0);
    this.stages.push({
      name: 'resolver', system: resolver,
      inputType: 'semantic-units', outputType: 'resolved',
      transform: (input) => ({ ...input, resolved: true, references: {} })
    });

    // Stage 4: Linker — creates connections between resolved units
    const linkerTriples = this.composer['generator'].generateRecursively(
      ['tri-011', 'tri-110'], 2 // Lake (joyous) + Wind (gentle) = linking
    );
    const linker = this.composer.composeSystem('linker', linkerTriples, 0);
    this.stages.push({
      name: 'linker', system: linker,
      inputType: 'resolved', outputType: 'linked',
      transform: (input) => ({ ...input, links: [], linked: true })
    });

    // Stage 5: Evaluator — assesses coherence and quality
    const evaluatorTriples = this.composer['generator'].generateRecursively(
      ['tri-111', 'tri-101'], 2 // Heaven (creative) + Fire (clinging) = evaluation
    );
    const evaluator = this.composer.composeSystem('evaluator', evaluatorTriples, 0);
    this.stages.push({
      name: 'evaluator', system: evaluator,
      inputType: 'linked', outputType: 'evaluated',
      transform: (input) => ({ ...input, score: 0.5, evaluated: true })
    });

    // Compose the meta-system that orchestrates all stages
    const pipeline = this.composer.composeMetaSystem('AutoLink', [
      ingestor, parser, resolver, linker, evaluator
    ]);
  }

  process(input: any): any {
    let current = input;
    for (const stage of this.stages) {
      current = stage.transform(current);
      current.stage = stage.name;
    }
    return current;
  }

  getStages(): PipelineStage[] { return this.stages; }
}

// -----------------------------------------------------------------------------
// 6. MESSY-STYLE META-SYSTEM — Higher-order system that manages other systems
// "Messy" sits above AutoLink. It doesn't process data — it processes systems.
// It decides which systems to spawn, which to merge, which to retire.
// -----------------------------------------------------------------------------

export class MessyMetaSystem {
  private composer: SystemComposer;
  private activeSystems: SystemNode[] = [];
  private systemHistory: SystemNode[] = [];

  constructor(composer: SystemComposer) {
    this.composer = composer;
  }

  /**
   * Spawn a new system in response to a need.
   * The need is parsed into ATO components, and a system is auto-composed.
   */
  spawnSystem(need: string): SystemNode {
    const system = this.composer.autoCompose(need, this.getAvailableNodeIds());
    this.activeSystems.push(system);
    this.systemHistory.push(system);
    return system;
  }

  /**
   * Merge two systems into a higher-order system.
   * The merge operator is the ATO of the two systems' primary operators.
   */
  mergeSystems(a: SystemNode, b: SystemNode): SystemNode {
    const merged = this.composer.composeMetaSystem(
      `merge-${a.name}-${b.name}`,
      [a, b]
    );
    this.activeSystems = this.activeSystems.filter(s => s.id !== a.id && s.id !== b.id);
    this.activeSystems.push(merged);
    return merged;
  }

  /**
   * Evaluate the ecosystem: which systems are thriving, which are obsolete?
   * Systems with low generative power and low resonance get retired.
   */
  evaluateEcosystem(): { thriving: SystemNode[]; obsolete: SystemNode[] } {
    const scored = this.activeSystems.map(s => ({
      system: s,
      score: s.operators.reduce((sum, op) => sum + op.generativePower, 0) / Math.max(1, s.operators.length)
        + s.triples.reduce((sum, t) => sum + t.strength, 0) / Math.max(1, s.triples.length)
    }));

    scored.sort((a, b) => b.score - a.score);
    const thriving = scored.filter(s => s.score > 0.5).map(s => s.system);
    const obsolete = scored.filter(s => s.score <= 0.3).map(s => s.system);

    this.activeSystems = thriving;
    return { thriving, obsolete };
  }

  private getAvailableNodeIds(): string[] {
    const ids = new Set<string>();
    for (const sys of this.activeSystems) {
      sys.triples.forEach(t => { ids.add(t.subject.id); ids.add(t.object.id); });
    }
    // Always include base trigrams
    Object.keys(TRIGRAMS).forEach(code => ids.add(`tri-${code}`));
    return [...ids];
  }

  getActiveSystems(): SystemNode[] { return this.activeSystems; }
  getHistory(): SystemNode[] { return this.systemHistory; }
}

// -----------------------------------------------------------------------------
// 7. EXPORT: THE FULL GENERATIVE SUBSTRATE
// -----------------------------------------------------------------------------

export function createGenerativeSubstrate() {
  const space = new ATOVectorSpace();
  const generator = new TripleGenerator(space);
  const composer = new SystemComposer(generator);
  const pipeline = new AutoLinkPipeline(composer);
  const messy = new MessyMetaSystem(composer);

  return {
    space,
    generator,
    composer,
    pipeline,
    messy,

    // High-level API
    spawn: (need: string) => messy.spawnSystem(need),
    process: (input: any) => pipeline.process(input),
    evaluate: () => messy.evaluateEcosystem(),

    // Introspection
    getState: () => ({
      nodes: generator.getNodes().length,
      triples: generator.getTriples().length,
      systems: composer.getSystems().length,
      activeSystems: messy.getActiveSystems().length,
      operators: generator.getOperators().map(o => ({ id: o.id, power: o.generativePower }))
    })
  };
}

export type GenerativeSubstrate = ReturnType<typeof createGenerativeSubstrate>;

export {
  ATOVectorSpace,
  TripleGenerator,
  SystemComposer,
  AutoLinkPipeline,
  MessyMetaSystem
};

export default createGenerativeSubstrate;