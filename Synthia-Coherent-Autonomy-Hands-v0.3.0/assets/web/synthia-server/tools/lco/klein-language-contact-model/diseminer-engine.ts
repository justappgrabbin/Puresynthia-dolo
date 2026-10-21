
/**
 * ============================================================
 * DISEMINER — Distributional Semantics Inference Maker
 * ============================================================
 * 
 * Original (Klein, Lieman, Lindstrom 1968):
 * "A system capable of learning distribution classes of lexical items
 * through processing of text, and using distributional criteria to answer
 * questions that are broader than the context of the text processed."
 * 
 * Core Algorithm: Warshall Transitive Closure
 * M = T* + T* × I
 * Where T = transitive links, I = intransitive links, T* = transitive closure
 * 
 * Modern: Vector embeddings + graph neural networks + sparse matrix ops
 */

import { Vector, SemanticNode, SemanticRelation, SemanticTriple, SemanticNetwork } from './semantic-network-core';

export interface StemEntry {
  stem: string;
  posTriples: Array<{
    partOfSpeech: number;
    wordForm: string;
    isTransitive: boolean;
  }>;
  dependencyLinks: DependencyLink[];
  semanticEmbedding: Vector;
}

export interface DependencyLink {
  from: string;      // Stem ID
  to: string;        // Stem ID
  relation: string;  // Relation type
  isTransitive: boolean;
  frequency: number;
}

export interface SemanticQuery {
  type: 'plausibility' | 'boolean' | 'listing' | 'analogy';
  subject?: string;
  relation?: string;
  object?: string;
  constraints?: string[];
  domain?: string;
}

export interface InferenceResult {
  plausible: boolean;
  confidence: number;
  path: DependencyLink[];
  semanticDistance: number;
  alternativePaths: DependencyLink[][];
  // Klein: "Each case of a positive answer violating an informant's view
  // of the possible is data for analysis"
  anomalyFlag: boolean;
}

export class DISEMINER {
  // Klein: "stem-type dictionary with provision for expansion"
  stemDictionary: Map<string, StemEntry>;

  // Klein's dependency matrices
  // T[i][j] = 1 if there is a transitive link from stem i to stem j
  transitiveMatrix: Map<string, Map<string, number>>;

  // I[i][j] = 1 if there is an intransitive link from stem i to stem j
  intransitiveMatrix: Map<string, Map<string, number>>;

  // M = merged matrix (computed via Warshall closure)
  mergedMatrix: Map<string, Map<string, number>>;

  // Modern: vector index for semantic similarity
  vectorIndex: Map<string, Vector>;

  // Modern: learned inference weights
  inferenceWeights: Map<string, number>;

  constructor() {
    this.stemDictionary = new Map();
    this.transitiveMatrix = new Map();
    this.intransitiveMatrix = new Map();
    this.mergedMatrix = new Map();
    this.vectorIndex = new Map();
    this.inferenceWeights = new Map();
  }

  /**
   * Warshall Transitive Closure Algorithm (1962)
   * 
   * Klein's implementation: "For each stem, form all paths of length two
   * passing through the stem, counting paths formed previously as paths
   * of length one."
   * 
   * Time complexity: O(n³) worst case, O(n²) for sparse matrices
   * Space complexity: O(n²)
   */
  computeClosure(): void {
    const stems = Array.from(this.stemDictionary.keys());
    const n = stems.length;

    // Initialize T* (transitive closure) from T
    const tStar = new Map<string, Map<string, number>>();
    for (const [i, row] of this.transitiveMatrix) {
      tStar.set(i, new Map(row));
    }

    // Warshall algorithm
    for (const k of stems) {
      for (const i of stems) {
        if (!tStar.get(i)?.get(k)) continue; // Optimization: skip if no path i→k

        for (const j of stems) {
          if (!tStar.get(k)?.get(j)) continue; // Optimization: skip if no path k→j

          // Path i→k→j exists, so path i→j exists
          const currentPath = tStar.get(i)!.get(j) || 0;
          const throughK = tStar.get(i)!.get(k)! * tStar.get(k)!.get(j)!;

          // Use max (boolean OR) for closure
          tStar.get(i)!.set(j, Math.max(currentPath, throughK));
        }
      }
    }

    // M = T* + T* × I (Klein's formula)
    this.mergedMatrix = new Map();

    for (const i of stems) {
      const row = new Map<string, number>();

      for (const j of stems) {
        // Direct transitive path
        const directPath = tStar.get(i)?.get(j) || 0;

        // Transitive path with final intransitive link
        let intransitivePath = 0;
        for (const k of stems) {
          const tPath = tStar.get(i)?.get(k) || 0;
          const iLink = this.intransitiveMatrix.get(k)?.get(j) || 0;
          intransitivePath = Math.max(intransitivePath, tPath * iLink);
        }

        // M[i][j] = direct OR intransitive
        row.set(j, Math.max(directPath, intransitivePath));
      }

      this.mergedMatrix.set(i, row);
    }

    // Store T* for future reference
    this.transitiveMatrix = tStar;
  }

  /**
   * Process text to learn distributional patterns
   * Klein: "The parsing routine provides as output a collection of stem links"
   */
  processText(text: string, parseResult: ParseResult): void {
    for (const link of parseResult.dependencyLinks) {
      // Add to stem dictionary
      if (!this.stemDictionary.has(link.from)) {
        this.stemDictionary.set(link.from, {
          stem: link.from,
          posTriples: [],
          dependencyLinks: [],
          semanticEmbedding: this.computeEmbedding(link.from)
        });
      }

      if (!this.stemDictionary.has(link.to)) {
        this.stemDictionary.set(link.to, {
          stem: link.to,
          posTriples: [],
          dependencyLinks: [],
          semanticEmbedding: this.computeEmbedding(link.to)
        });
      }

      // Add dependency link
      this.stemDictionary.get(link.from)!.dependencyLinks.push(link);

      // Add to appropriate matrix
      if (link.isTransitive) {
        this.addToMatrix(this.transitiveMatrix, link.from, link.to, link.frequency);
      } else {
        this.addToMatrix(this.intransitiveMatrix, link.from, link.to, link.frequency);
      }
    }

    // Recompute closure after learning
    this.computeClosure();
  }

  private addToMatrix(
    matrix: Map<string, Map<string, number>>,
    from: string,
    to: string,
    weight: number
  ): void {
    if (!matrix.has(from)) {
      matrix.set(from, new Map());
    }
    const row = matrix.get(from)!;
    row.set(to, Math.max(row.get(to) || 0, weight));
  }

  /**
   * Answer semantic plausibility questions
   * Klein: "Is it possible that...?"
   * 
   * Uses distributional criteria to infer semantic plausibility.
   * If the vocabulary and dependency relations in one text are included
   * in the dependency relations of another, then the meaning of one
   * is included in the other.
   */
  infer(query: SemanticQuery): InferenceResult {
    switch (query.type) {
      case 'plausibility':
        return this.inferPlausibility(query);
      case 'boolean':
        return this.inferBoolean(query);
      case 'listing':
        return this.inferListing(query);
      case 'analogy':
        return this.inferAnalogy(query);
      default:
        return {
          plausible: false,
          confidence: 0,
          path: [],
          semanticDistance: Infinity,
          alternativePaths: [],
          anomalyFlag: false
        };
    }
  }

  private inferPlausibility(query: SemanticQuery): InferenceResult {
    // Find path in merged matrix
    const subject = query.subject!;
    const object = query.object!;

    const directPath = this.mergedMatrix.get(subject)?.get(object) || 0;

    if (directPath > 0) {
      // Direct path exists
      return {
        plausible: true,
        confidence: directPath,
        path: this.reconstructPath(subject, object),
        semanticDistance: 1,
        alternativePaths: [],
        anomalyFlag: false
      };
    }

    // Try indirect paths via semantic similarity
    const subjectEntry = this.stemDictionary.get(subject);
    const objectEntry = this.stemDictionary.get(object);

    if (subjectEntry && objectEntry) {
      const similarity = subjectEntry.semanticEmbedding.cosineSimilarity(
        objectEntry.semanticEmbedding
      );

      // Klein: "If the vocabulary and dependency relations in one text are
      // included in the dependency relations of another, then the meaning
      // of one is included in the other"

      if (similarity > 0.5) {
        return {
          plausible: true,
          confidence: similarity * 0.7, // Reduced confidence for analogical inference
          path: [],
          semanticDistance: 1 - similarity,
          alternativePaths: [],
          anomalyFlag: similarity > 0.9 // High similarity might indicate anomaly
        };
      }
    }

    // No plausible inference
    return {
      plausible: false,
      confidence: 0,
      path: [],
      semanticDistance: Infinity,
      alternativePaths: [],
      anomalyFlag: false
    };
  }

  private inferBoolean(query: SemanticQuery): InferenceResult {
    // Boolean: AND/OR/NOT of conditions
    const result = this.inferPlausibility(query);

    if (query.constraints) {
      // Check constraints
      for (const constraint of query.constraints) {
        const constraintResult = this.inferPlausibility({
          type: 'plausibility',
          subject: constraint
        });

        if (!constraintResult.plausible) {
          return {
            ...result,
            plausible: false,
            confidence: result.confidence * 0.3
          };
        }
      }
    }

    return result;
  }

  private inferListing(query: SemanticQuery): InferenceResult[] {
    // "Who [What V1 (and) V2 (and) ... Vn]"
    // Return list of items matching the pattern

    const results: InferenceResult[] = [];

    for (const [stem, entry] of this.stemDictionary) {
      // Check if stem matches query pattern
      const matches = this.matchesPattern(stem, query);

      if (matches) {
        results.push({
          plausible: true,
          confidence: matches,
          path: entry.dependencyLinks,
          semanticDistance: 0,
          alternativePaths: [],
          anomalyFlag: false
        });
      }
    }

    return results.sort((a, b) => b.confidence - a.confidence);
  }

  private inferAnalogy(query: SemanticQuery): InferenceResult {
    // Klein 1999/2002: Boolean group analogical reasoning
    // ATO: Analogical Transformation Operator

    const source = query.subject!;
    const target = query.object!;

    // Compute feature vectors
    const sourceFeatures = this.extractFeatures(source);
    const targetFeatures = this.extractFeatures(target);

    // Klein-4 group operation: *ab (strong equivalence)
    const transformation = this.xorVectors(sourceFeatures, targetFeatures);

    // Apply to find analog
    const analogFeatures = this.applyTransformation(sourceFeatures, transformation);

    // Find closest match in dictionary
    let bestMatch: string | null = null;
    let bestScore = -1;

    for (const [stem, entry] of this.stemDictionary) {
      const stemFeatures = this.extractFeatures(stem);
      const score = this.cosineSimilarity(analogFeatures, stemFeatures);

      if (score > bestScore) {
        bestScore = score;
        bestMatch = stem;
      }
    }

    return {
      plausible: bestScore > 0.5,
      confidence: bestScore,
      path: bestMatch ? this.reconstructPath(source, bestMatch) : [],
      semanticDistance: 1 - bestScore,
      alternativePaths: [],
      anomalyFlag: false
    };
  }

  // Helper methods
  private reconstructPath(from: string, to: string): DependencyLink[] {
    // BFS to reconstruct actual path
    const visited = new Set<string>();
    const queue: Array<{ node: string; path: DependencyLink[] }> = [
      { node: from, path: [] }
    ];

    while (queue.length > 0) {
      const { node, path } = queue.shift()!;

      if (node === to) return path;
      if (visited.has(node)) continue;
      visited.add(node);

      const entry = this.stemDictionary.get(node);
      if (!entry) continue;

      for (const link of entry.dependencyLinks) {
        queue.push({
          node: link.to,
          path: [...path, link]
        });
      }
    }

    return [];
  }

  private computeEmbedding(stem: string): Vector {
    // Modern: Use pre-trained embeddings or compute from context
    // For now, return a random embedding (would be replaced with actual model)
    const dim = 128;
    const data = new Float32Array(dim);
    for (let i = 0; i < dim; i++) {
      data[i] = (Math.random() - 0.5) * 2;
    }
    return {
      data,
      dimension: dim,
      add: (other) => this.computeEmbedding(stem), // Placeholder
      dot: (other) => 0, // Placeholder
      normalize: () => this.computeEmbedding(stem), // Placeholder
      cosineSimilarity: (other) => {
        let dot = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < dim; i++) {
          dot += data[i] * other.data[i];
          normA += data[i] * data[i];
          normB += other.data[i] * other.data[i];
        }
        return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-8);
      }
    };
  }

  private extractFeatures(stem: string): number[] {
    // Extract Boolean feature vector from stem's distribution
    const entry = this.stemDictionary.get(stem);
    if (!entry) return [];

    // Use dependency patterns as features
    const features: number[] = [];
    for (const link of entry.dependencyLinks) {
      features.push(link.isTransitive ? 1 : 0);
      features.push(link.frequency);
    }

    return features;
  }

  private xorVectors(a: number[], b: number[]): number[] {
    const maxLen = Math.max(a.length, b.length);
    const result: number[] = [];
    for (let i = 0; i < maxLen; i++) {
      result.push((a[i] || 0) !== (b[i] || 0) ? 1 : 0);
    }
    return result;
  }

  private applyTransformation(features: number[], transform: number[]): number[] {
    // Klein-4: *a*ab = b (self-inverse property)
    return this.xorVectors(features, transform);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    const maxLen = Math.max(a.length, b.length);

    for (let i = 0; i < maxLen; i++) {
      const ai = a[i] || 0;
      const bi = b[i] || 0;
      dot += ai * bi;
      normA += ai * ai;
      normB += bi * bi;
    }

    return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-8);
  }

  private matchesPattern(stem: string, query: SemanticQuery): number {
    // Check if stem matches query constraints
    // Returns confidence score (0 = no match, >0 = match with confidence)

    const entry = this.stemDictionary.get(stem);
    if (!entry) return 0;

    // Check if stem has required relations
    if (query.relation) {
      const hasRelation = entry.dependencyLinks.some(l => l.relation === query.relation);
      if (!hasRelation) return 0;
    }

    // Compute match confidence based on distribution overlap
    return entry.dependencyLinks.length / 10; // Normalize
  }
}

export interface ParseResult {
  dependencyLinks: DependencyLink[];
  tokens: string[];
  posTags: string[];
}
