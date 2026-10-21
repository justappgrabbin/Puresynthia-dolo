
/**
 * ============================================================
 * ANALOGICAL FOUNDATIONS — Boolean Group Creativity Engine
 * ============================================================
 * 
 * Original (Klein 1999/2002):
 * "Analogical reasoning can be modeled using Boolean groups and
 * Analogical Transformation Operators (ATOs)."
 * 
 * Key mathematical structure:
 * - Klein-4 group: {e, a, b, ab} where a² = b² = (ab)² = e
 * - Strong equivalence operator: *ab = *ba (commutative)
 * - Self-inverse: *a*ab = b
 * - Boolean vectors with XOR addition and sign multiplication
 * 
 * This enables computational creativity through analogical transformation.
 */

export interface BooleanVector {
  bits: boolean[];

  // XOR addition (mod-2)
  add(other: BooleanVector): BooleanVector;

  // Sign multiplication
  multiply(other: BooleanVector): BooleanVector;

  // Strong equivalence: *ab
  strongEquivalence(other: BooleanVector): BooleanVector;

  // Hamming distance
  distance(other: BooleanVector): number;

  // To number representation
  toNumber(): number;

  // From number representation
  static fromNumber(n: number, dimension: number): BooleanVector;
}

export class Klein4Vector implements BooleanVector {
  bits: boolean[];

  constructor(bits: boolean[]) {
    this.bits = [...bits];
  }

  add(other: BooleanVector): BooleanVector {
    // XOR: component-wise mod-2 addition
    const result = this.bits.map((b, i) => b !== other.bits[i]);
    return new Klein4Vector(result);
  }

  multiply(other: BooleanVector): BooleanVector {
    // Sign multiplication: AND of bits
    const result = this.bits.map((b, i) => b && other.bits[i]);
    return new Klein4Vector(result);
  }

  strongEquivalence(other: BooleanVector): BooleanVector {
    // *ab: the strong equivalence operator
    // This is the XOR of the two vectors
    // Klein: "*ab = *ba" (commutative)
    return this.add(other);
  }

  distance(other: BooleanVector): number {
    // Hamming distance
    return this.bits.reduce((sum, b, i) => sum + (b !== other.bits[i] ? 1 : 0), 0);
  }

  toNumber(): number {
    return this.bits.reduce((sum, b, i) => sum + (b ? 1 : 0) * Math.pow(2, i), 0);
  }

  static fromNumber(n: number, dimension: number): BooleanVector {
    const bits: boolean[] = [];
    for (let i = 0; i < dimension; i++) {
      bits.push((n & (1 << i)) !== 0);
    }
    return new Klein4Vector(bits);
  }

  // Self-inverse property: *a*ab = b
  verifySelfInverse(a: BooleanVector, b: BooleanVector): boolean {
    const ab = this.strongEquivalence(a); // *a
    const a_ab = ab.strongEquivalence(b); // *a*b
    const a_a_ab = a_ab.strongEquivalence(a); // *a*a*b

    // Should equal b
    return a_a_ab.distance(b) === 0;
  }
}

export interface AnalogicalTransformationOperator {
  name: string;

  // The transformation: maps source to target
  apply(source: BooleanVector, targetDomain: BooleanVector): BooleanVector;

  // Inverse: maps target back to source
  inverse(target: BooleanVector, sourceDomain: BooleanVector): BooleanVector;

  // Verify: check if transformation is valid
  verify(source: BooleanVector, target: BooleanVector, transformation: BooleanVector): boolean;
}

export class ATO implements AnalogicalTransformationOperator {
  name: string;

  // The transformation vector
  transform: BooleanVector;

  constructor(name: string, transform: BooleanVector) {
    this.name = name;
    this.transform = transform;
  }

  apply(source: BooleanVector, targetDomain: BooleanVector): BooleanVector {
    // *ab where a = source, b = transform
    // Result is in target domain
    const result = source.strongEquivalence(this.transform);

    // Project onto target domain
    return this.project(result, targetDomain);
  }

  inverse(target: BooleanVector, sourceDomain: BooleanVector): BooleanVector {
    // *a*ab = b, so *ab = target implies a = *b*target
    const inverse = target.strongEquivalence(this.transform);
    return this.project(inverse, sourceDomain);
  }

  verify(source: BooleanVector, target: BooleanVector, transformation: BooleanVector): boolean {
    // Check if applying transformation to source gives target
    const result = source.strongEquivalence(transformation);
    return result.distance(target) === 0;
  }

  private project(vector: BooleanVector, domain: BooleanVector): BooleanVector {
    // Project vector onto domain (component-wise AND)
    return vector.multiply(domain);
  }
}

export interface AnalogicalMapping {
  source: {
    domain: string;
    features: BooleanVector;
    elements: string[];
  };
  target: {
    domain: string;
    features: BooleanVector;
    elements: string[];
  };
  transformation: ATO;
  confidence: number;

  // The analogical mapping itself
  mappings: Array<{
    sourceElement: string;
    targetElement: string;
    relation: string;
  }>;
}

export class AnalogicalReasoningEngine {
  // Domain feature spaces
  domains: Map<string, DomainSpace>;

  // Known ATOs
  atos: Map<string, ATO>;

  // Learned analogies
  analogies: AnalogicalMapping[];

  constructor() {
    this.domains = new Map();
    this.atos = new Map();
    this.analogies = [];
  }

  /**
   * Register a domain with its feature space
   */
  registerDomain(name: string, features: string[], dimension: number): void {
    this.domains.set(name, {
      name,
      features,
      dimension,
      elements: new Map()
    });
  }

  /**
   * Add an element to a domain
   */
  addElement(domain: string, element: string, featureVector: boolean[]): void {
    const space = this.domains.get(domain);
    if (!space) return;

    space.elements.set(element, new Klein4Vector(featureVector));
  }

  /**
   * Create an ATO from source to target
   * Klein: "*ab = strong equivalence operator"
   */
  createATO(name: string, source: string, target: string): ATO | null {
    const sourceDomain = this.domains.get(source);
    const targetDomain = this.domains.get(target);

    if (!sourceDomain || !targetDomain) return null;

    // Compute transformation: XOR of domain feature vectors
    const sourceFeatures = this.domainToVector(sourceDomain);
    const targetFeatures = this.domainToVector(targetDomain);
    const transform = sourceFeatures.strongEquivalence(targetFeatures);

    const ato = new ATO(name, transform);
    this.atos.set(name, ato);

    return ato;
  }

  /**
   * Apply analogy: find target analog for source element
   * Klein: "Given A:B::C:?, find ?"
   */
  applyAnalogy(
    sourceDomain: string,
    sourceElement: string,
    targetDomain: string,
    atoName?: string
  ): { element: string; confidence: number }[] {
    const sDomain = this.domains.get(sourceDomain);
    const tDomain = this.domains.get(targetDomain);

    if (!sDomain || !tDomain) return [];

    const sourceVec = sDomain.elements.get(sourceElement);
    if (!sourceVec) return [];

    // Get or create ATO
    let ato: ATO;
    if (atoName && this.atos.has(atoName)) {
      ato = this.atos.get(atoName)!;
    } else {
      const newAto = this.createATO(`${sourceDomain}_${targetDomain}`, sourceDomain, targetDomain);
      if (!newAto) return [];
      ato = newAto;
    }

    // Apply transformation
    const targetVec = ato.apply(sourceVec, this.domainToVector(tDomain));

    // Find closest element in target domain
    const results: { element: string; confidence: number }[] = [];

    for (const [element, vec] of tDomain.elements) {
      const distance = targetVec.distance(vec);
      const confidence = 1 - (distance / tDomain.dimension);
      results.push({ element, confidence });
    }

    return results.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Discover analogy automatically
   * Klein: "Discover structural similarities between domains"
   */
  discoverAnalogy(domainA: string, domainB: string): AnalogicalMapping | null {
    const spaceA = this.domains.get(domainA);
    const spaceB = this.domains.get(domainB);

    if (!spaceA || !spaceB) return null;

    // Find common structural patterns
    const mappings: Array<{ sourceElement: string; targetElement: string; relation: string }> = [];

    for (const [elemA, vecA] of spaceA.elements) {
      // Find closest in B
      let bestMatch: string | null = null;
      let bestDistance = Infinity;

      for (const [elemB, vecB] of spaceB.elements) {
        const distance = vecA.distance(vecB);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestMatch = elemB;
        }
      }

      if (bestMatch && bestDistance < spaceB.dimension / 2) {
        mappings.push({
          sourceElement: elemA,
          targetElement: bestMatch,
          relation: 'analog'
        });
      }
    }

    if (mappings.length === 0) return null;

    // Create ATO
    const ato = this.createATO(`${domainA}_${domainB}_discovered`, domainA, domainB);
    if (!ato) return null;

    const mapping: AnalogicalMapping = {
      source: {
        domain: domainA,
        features: this.domainToVector(spaceA),
        elements: Array.from(spaceA.elements.keys())
      },
      target: {
        domain: domainB,
        features: this.domainToVector(spaceB),
        elements: Array.from(spaceB.elements.keys())
      },
      transformation: ato,
      confidence: mappings.length / Math.max(spaceA.elements.size, spaceB.elements.size),
      mappings
    };

    this.analogies.push(mapping);
    return mapping;
  }

  /**
   * Creative generation: combine analogies to produce novel concepts
   * Klein: "Creativity arises from the combination of analogical mappings"
   */
  generateCreativeConcept(
    sourceDomain: string,
    targetDomain: string,
    constraints: string[]
  ): { concept: string; explanation: string; confidence: number }[] {
    const results: { concept: string; explanation: string; confidence: number }[] = [];

    // Get analogy
    const analogy = this.analogies.find(a => 
      a.source.domain === sourceDomain && a.target.domain === targetDomain
    ) || this.discoverAnalogy(sourceDomain, targetDomain);

    if (!analogy) return results;

    // For each mapping, generate a creative concept
    for (const mapping of analogy.mappings) {
      // Combine source and target elements
      const concept = `${mapping.sourceElement}_${mapping.targetElement}`;

      // Check constraints
      const satisfiesConstraints = constraints.every(c => 
        concept.includes(c) || mapping.sourceElement.includes(c) || mapping.targetElement.includes(c)
      );

      if (satisfiesConstraints) {
        results.push({
          concept,
          explanation: `Analogical blend of ${mapping.sourceElement} (from ${sourceDomain}) and ${mapping.targetElement} (from ${targetDomain})`,
          confidence: analogy.confidence * 0.8
        });
      }
    }

    return results;
  }

  private domainToVector(domain: DomainSpace): BooleanVector {
    // Aggregate all elements in domain
    const aggregated = Array(domain.dimension).fill(false);

    for (const vec of domain.elements.values()) {
      for (let i = 0; i < domain.dimension; i++) {
        aggregated[i] = aggregated[i] || vec.bits[i];
      }
    }

    return new Klein4Vector(aggregated);
  }
}

interface DomainSpace {
  name: string;
  features: string[];
  dimension: number;
  elements: Map<string, BooleanVector>;
}

// ============================================================
// EXAMPLE: Klein's Boy-Loves-Light → Mythology Analogy
// ============================================================

export function createBoyLightMythologyAnalogy(): AnalogicalMapping {
  const engine = new AnalogicalReasoningEngine();

  // Register domains
  engine.registerDomain('human_experience', 
    ['desire', 'pursuit', 'illumination', 'transformation', 'mortality', 'growth', 'love', 'knowledge'],
    8
  );

  engine.registerDomain('mythology',
    ['quest', 'journey', 'revelation', 'metamorphosis', 'fate', 'evolution', 'eros', 'wisdom'],
    8
  );

  // Add elements
  engine.addElement('human_experience', 'boy_loves_light', 
    [true, true, true, false, true, false, true, false]
  );

  engine.addElement('human_experience', 'child_seeks_knowledge',
    [true, true, false, false, true, true, false, true]
  );

  engine.addElement('mythology', 'icarus_sun',
    [true, true, true, true, true, false, false, false]
  );

  engine.addElement('mythology', 'prometheus_fire',
    [true, true, true, false, true, false, false, true]
  );

  engine.addElement('mythology', 'orpheus_eurydice',
    [true, true, false, true, true, false, true, false]
  );

  // Discover analogy
  return engine.discoverAnalogy('human_experience', 'mythology')!;
}

// ============================================================
// EXAMPLE: Language Contact Analogy
// ============================================================

export function createLanguageContactAnalogy(): AnalogicalMapping {
  const engine = new AnalogicalReasoningEngine();

  engine.registerDomain('language_change',
    ['borrowing', 'simplification', 'innovation', 'prestige', 'isolation', 'contact', 'generation', 'selection'],
    8
  );

  engine.registerDomain('biological_evolution',
    ['hybridization', 'reduction', 'mutation', 'fitness', 'speciation', 'symbiosis', 'reproduction', 'selection'],
    8
  );

  engine.addElement('language_change', 'creole_formation',
    [true, true, true, false, false, true, true, true]
  );

  engine.addElement('biological_evolution', 'speciation_event',
    [true, true, true, false, true, false, true, true]
  );

  return engine.discoverAnalogy('language_change', 'biological_evolution')!;
}
