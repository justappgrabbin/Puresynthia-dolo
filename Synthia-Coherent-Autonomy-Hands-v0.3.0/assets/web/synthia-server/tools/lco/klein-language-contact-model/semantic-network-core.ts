
/**
 * ============================================================
 * SEMANTIC NETWORK CORE — MESSY's Heart, Modernized
 * ============================================================
 * 
 * Klein's original (1971-1976):
 * "The semantic network consists of objects and relations linking those objects.
 * The object nodes and relations have no names in themselves, only numbers.
 * But they are linked to lexical expression lists that contain lexical variants."
 * 
 * Modern: Neural embeddings + symbolic triples + temporal indexing
 */

export interface Vector {
  data: Float32Array;
  dimension: number;

  add(other: Vector): Vector;
  dot(other: Vector): number;
  normalize(): Vector;
  cosineSimilarity(other: Vector): number;
}

export class SemanticNode {
  id: string;
  type: 'atom' | 'class' | 'complex_predicate';

  // Klein: "linked to lexical expression lists"
  lexicalExpressions: LexicalExpressionList;

  // Modern: neural embedding for semantic similarity
  embedding: Vector;

  // Klein: "numerical values that can be modified by simulation rules"
  // Example: affection scale +9 = "adore", +1 = "like", -8 = "hate"
  numericalValue?: number;

  // Klein's radical innovation: "complex predicate nodes"
  // Self-referential pointers to triples — gives 2nd-order predicate calculus power
  pointerToTriples?: Set<string>;

  // Temporal tracking
  createdAt: number;
  modifiedAt: number;

  constructor(id: string, type: 'atom' | 'class' | 'complex_predicate') {
    this.id = id;
    this.type = type;
    this.lexicalExpressions = new LexicalExpressionList();
    this.createdAt = Date.now();
    this.modifiedAt = Date.now();
  }

  // Klein: "An atom node may also function as a complex predicate node
  // with status that may vary during a simulation"
  promoteToPredicate(tripleIds: string[]): void {
    this.type = 'complex_predicate';
    this.pointerToTriples = new Set(tripleIds);
  }

  // Self-referential: "I know that I know that..."
  addSelfReference(): void {
    if (!this.pointerToTriples) this.pointerToTriples = new Set();
    // The node points to triples that include itself
    // This creates the recursive structure Klein used for 2nd-order logic
  }
}

export class SemanticRelation {
  id: string;

  // Klein: "linked to lexical expression lists"
  lexicalExpressions: LexicalExpressionList;

  // Modern: relation embedding
  embedding: Vector;

  // Klein: "linked to one of a limited number of syntactic dependency governance patterns"
  dependencyPattern: DependencyPattern;

  // Temporal
  createdAt: number;

  constructor(id: string, pattern: DependencyPattern) {
    this.id = id;
    this.dependencyPattern = pattern;
    this.lexicalExpressions = new LexicalExpressionList();
    this.createdAt = Date.now();
  }
}

export class SemanticTriple {
  id: string;
  subject: SemanticNode;
  relation: SemanticRelation;
  object: SemanticNode;

  // Klein's temporal innovation: "each may be linked to a value representing
  // the time it was set, or the time it was deleted from the network"
  createdAt: number;        // Simulation clock time
  deletedAt: number | null; // Null if still active

  // Klein: "reality value" — how real is this assertion?
  realityValue: number;     // 0-1

  // Klein: "hypotheticality value"
  hypotheticality: number;  // 0-1 (0 = fact, 1 = pure speculation)

  // Modern: activation strength (for neural inference)
  activation: number;

  constructor(
    id: string,
    subject: SemanticNode,
    relation: SemanticRelation,
    object: SemanticNode,
    clockTime: number
  ) {
    this.id = id;
    this.subject = subject;
    this.relation = relation;
    this.object = object;
    this.createdAt = clockTime;
    this.deletedAt = null;
    this.realityValue = 1.0;
    this.hypotheticality = 0.0;
    this.activation = 1.0;
  }

  // Is this triple currently active?
  isActive(clockTime: number): boolean {
    return this.createdAt <= clockTime && 
           (this.deletedAt === null || this.deletedAt > clockTime);
  }

  // Klein: "The relative time order of the triples is readily computable"
  temporalOrder(other: SemanticTriple): number {
    return this.createdAt - other.createdAt;
  }
}

export class LexicalExpressionList {
  // Klein: "lexical variants as well as other expression forms"
  variants: Array<{
    form: string;
    probability: number;      // Selection probability
    contextMarks: string[];   // When to use this variant
    frequency: number;        // Dynamic frequency tracking
  }>;

  // Klein: "semantic triples that are not in the network"
  // (for idiomatic expressions, recursive definitions)
  recursiveTriples: SemanticTriple[];

  // Klein: "pointers to triples that are in the network"
  networkPointers: string[];

  constructor() {
    this.variants = [];
    this.recursiveTriples = [];
    this.networkPointers = [];
  }

  // Select a variant based on context and probability
  select(context: ContextMarker[]): string {
    const candidates = this.variants.filter(v => 
      v.contextMarks.some(cm => context.includes(cm))
    );

    if (candidates.length === 0) {
      // Default: highest probability
      return this.variants.reduce((a, b) => a.probability > b.probability ? a : b).form;
    }

    // Weighted random selection
    const total = candidates.reduce((sum, v) => sum + v.probability * v.frequency, 0);
    let rand = Math.random() * total;

    for (const v of candidates) {
      rand -= v.probability * v.frequency;
      if (rand <= 0) return v.form;
    }

    return candidates[0].form;
  }
}

export class SemanticNetwork {
  // Klein: "The network is actually stored in the form of a hash table,
  // wherein the actual semantic network is implied and computable
  // rather than overtly listed"

  nodes: Map<string, SemanticNode>;
  relations: Map<string, SemanticRelation>;
  triples: Map<string, SemanticTriple>;

  // Modern: neural embeddings for similarity search
  nodeEmbeddings: Map<string, Vector>;
  relationEmbeddings: Map<string, Vector>;

  // Temporal index: triples by time
  temporalIndex: Map<number, Set<string>>;

  // Simulation clock
  clock: number;

  constructor() {
    this.nodes = new Map();
    this.relations = new Map();
    this.triples = new Map();
    this.nodeEmbeddings = new Map();
    this.relationEmbeddings = new Map();
    this.temporalIndex = new Map();
    this.clock = 0;
  }

  // Advance simulation clock
  tick(): number {
    this.clock++;
    return this.clock;
  }

  // Assert a triple (add to network)
  assert(subject: SemanticNode, relation: SemanticRelation, object: SemanticNode): SemanticTriple {
    const id = `${subject.id}-${relation.id}-${object.id}@${this.clock}`;
    const triple = new SemanticTriple(id, subject, relation, object, this.clock);
    this.triples.set(id, triple);

    // Index by time
    if (!this.temporalIndex.has(this.clock)) {
      this.temporalIndex.set(this.clock, new Set());
    }
    this.temporalIndex.get(this.clock)!.add(id);

    return triple;
  }

  // Negate a triple (mark as deleted)
  negate(tripleId: string): void {
    const triple = this.triples.get(tripleId);
    if (triple) {
      triple.deletedAt = this.clock;
    }
  }

  // Klein: "Compute precisely the relative order of all events"
  getTriplesAtTime(time: number): SemanticTriple[] {
    const ids = this.temporalIndex.get(time);
    if (!ids) return [];
    return Array.from(ids)
      .map(id => this.triples.get(id)!)
      .filter(t => t.isActive(time));
  }

  // Path finding: "Is there a path between A and B through Rk or Ri and Rj but not Rk?"
  findPath(
    from: SemanticNode,
    to: SemanticNode,
    allowedRelations?: Set<string>,
    forbiddenRelations?: Set<string>
  ): SemanticTriple[][] {
    // Breadth-first search through active triples
    const paths: SemanticTriple[][] = [];
    const visited = new Set<string>();
    const queue: Array<{ node: SemanticNode; path: SemanticTriple[] }> = [
      { node: from, path: [] }
    ];

    while (queue.length > 0) {
      const { node, path } = queue.shift()!;

      if (node.id === to.id) {
        paths.push(path);
        continue;
      }

      if (visited.has(node.id)) continue;
      visited.add(node.id);

      // Find all active triples where this node is the subject
      for (const triple of this.triples.values()) {
        if (!triple.isActive(this.clock)) continue;
        if (triple.subject.id !== node.id) continue;

        // Check relation constraints
        if (allowedRelations && !allowedRelations.has(triple.relation.id)) continue;
        if (forbiddenRelations && forbiddenRelations.has(triple.relation.id)) continue;

        queue.push({
          node: triple.object,
          path: [...path, triple]
        });
      }
    }

    return paths;
  }

  // Modern: semantic similarity search using embeddings
  findSimilar(node: SemanticNode, threshold: number = 0.7): SemanticNode[] {
    const nodeEmbedding = this.nodeEmbeddings.get(node.id);
    if (!nodeEmbedding) return [];

    const similar: SemanticNode[] = [];
    for (const [id, embedding] of this.nodeEmbeddings) {
      if (id === node.id) continue;
      const similarity = nodeEmbedding.cosineSimilarity(embedding);
      if (similarity >= threshold) {
        similar.push(this.nodes.get(id)!);
      }
    }

    return similar.sort((a, b) => {
      const simA = nodeEmbedding.cosineSimilarity(this.nodeEmbeddings.get(a.id)!);
      const simB = nodeEmbedding.cosineSimilarity(this.nodeEmbeddings.get(b.id)!);
      return simB - simA;
    });
  }

  // Export network state for persistence or inspection
  toJSON(): object {
    return {
      clock: this.clock,
      nodes: Array.from(this.nodes.entries()),
      relations: Array.from(this.relations.entries()),
      triples: Array.from(this.triples.values())
        .filter(t => t.isActive(this.clock))
        .map(t => ({
          id: t.id,
          subject: t.subject.id,
          relation: t.relation.id,
          object: t.object.id,
          createdAt: t.createdAt,
          realityValue: t.realityValue,
          hypotheticality: t.hypotheticality
        }))
    };
  }
}

export type DependencyPattern = 
  | 'subject_governor'
  | 'object_governor' 
  | 'attribute_dependent'
  | 'prepositional_governor'
  | 'coordinate';

export type ContextMarker = 
  | 'formal'
  | 'informal'
  | 'past_tense'
  | 'present_tense'
  | 'future_tense'
  | 'positive'
  | 'negative'
  | 'question'
  | 'imperative';
