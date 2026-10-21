/**
 * MESSY-HD: Meta-Symbolic Simulation System for Human Design
 * 
 * Based on Sheldon Klein's MESSY architecture:
 * - Semantic structures as objects and relations in relational calculus
 * - Boolean feature vectors with bi-directional inheritance
 * - Script-like world knowledge rules as logical operators
 * - Same rules for generation and recognition
 * - Configurable as multiple grammars
 * 
 * Perspective Isomorphisms (w-dimensions):
 * WHO  = Identity isomorphism (ego-structure, self-concept)
 * WHAT = Object isomorphism (design as pattern/object)
 * WHERE = Spatial/contextual isomorphism (environment, placement)
 * WHEN = Temporal isomorphism (timing, transit, cycle)
 * WHY = Causal/purpose isomorphism (motivation, meaning, purpose)
 * 
 * Each isomorphism is a GRAMMATICAL TRANSFORMATION, not a prompt template.
 * The same semantic structure generates entirely different surface text.
 */

// ============================================================================
// CORE SEMANTIC INFRASTRUCTURE
// ============================================================================

interface BooleanFeatureVector {
  features: Map<string, boolean>;
  inherit(parent: BooleanFeatureVector): void;
}

class FeatureVector implements BooleanFeatureVector {
  features: Map<string, boolean> = new Map();

  set(feature: string, value: boolean): void {
    this.features.set(feature, value);
  }

  get(feature: string): boolean {
    return this.features.get(feature) || false;
  }

  inherit(parent: FeatureVector): void {
    // Bi-directional inheritance: child gets parent's features
    // AND parent can be updated by child's activation (Klein's key insight)
    for (const [key, value] of parent.features) {
      if (!this.features.has(key)) {
        this.features.set(key, value);
      }
    }
  }

  // Bi-directional: child activation can feed back to parent
  activate(feature: string): void {
    this.features.set(feature, true);
  }

  toString(): string {
    return Array.from(this.features.entries())
      .filter(([_, v]) => v)
      .map(([k, _]) => k)
      .join(',');
  }
}

// ============================================================================
// SEMANTIC OBJECTS (HD Concepts as MESSY Objects)
// ============================================================================

enum SemanticObjectType {
  GATE = 'GATE',
  CHANNEL = 'CHANNEL',
  CENTER = 'CENTER',
  TYPE = 'TYPE',
  AUTHORITY = 'AUTHORITY',
  PROFILE = 'PROFILE',
  DEFINITION = 'DEFINITION',
  TRANSIT = 'TRANSIT',
  COMPOSITE = 'COMPOSITE',
  NARRATIVE = 'NARRATIVE'
}

class SemanticObject {
  id: string;
  type: SemanticObjectType;
  features: FeatureVector;
  relations: Map<string, SemanticRelation[]> = new Map();
  content: Map<string, any> = new Map();

  constructor(id: string, type: SemanticObjectType) {
    this.id = id;
    this.type = type;
    this.features = new FeatureVector();
  }

  addRelation(relation: SemanticRelation): void {
    const existing = this.relations.get(relation.type) || [];
    existing.push(relation);
    this.relations.set(relation.type, existing);
  }

  getRelations(type: string): SemanticRelation[] {
    return this.relations.get(type) || [];
  }

  setContent(key: string, value: any): void {
    this.content.set(key, value);
  }

  getContent(key: string): any {
    return this.content.get(key);
  }
}

// ============================================================================
// SEMANTIC RELATIONS (How HD Concepts Interact)
// ============================================================================

enum RelationType {
  DEFINES = 'DEFINES',
  ACTIVATES = 'ACTIVATES',
  CONNECTS = 'CONNECTS',
  RESONATES = 'RESONATES',
  COMPLEMENTS = 'COMPLEMENTS',
  FOLLOWS = 'FOLLOWS',
  CONTAINS = 'CONTAINS',
  MANIFESTS = 'MANIFESTS',
  SHADOWS = 'SHADOWS',
  GIFTS = 'GIFTS',
  SIDDHIS = 'SIDDHIS'
}

class SemanticRelation {
  type: RelationType;
  source: SemanticObject;
  target: SemanticObject;
  features: FeatureVector;
  strength: number;

  constructor(type: RelationType, source: SemanticObject, target: SemanticObject, strength: number = 1.0) {
    this.type = type;
    this.source = source;
    this.target = target;
    this.features = new FeatureVector();
    this.strength = strength;
  }
}

// ============================================================================
// LOGICAL OPERATORS (Script-like World Knowledge Rules)
// ============================================================================

interface LogicalOperator {
  evaluate(context: GenerationContext): boolean;
}

class AndOperator implements LogicalOperator {
  operators: LogicalOperator[];

  constructor(operators: LogicalOperator[]) {
    this.operators = operators;
  }

  evaluate(context: GenerationContext): boolean {
    return this.operators.every(op => op.evaluate(context));
  }
}

class OrOperator implements LogicalOperator {
  operators: LogicalOperator[];

  constructor(operators: LogicalOperator[]) {
    this.operators = operators;
  }

  evaluate(context: GenerationContext): boolean {
    return this.operators.some(op => op.evaluate(context));
  }
}

class FeatureCheck implements LogicalOperator {
  objectId: string;
  feature: string;

  constructor(objectId: string, feature: string) {
    this.objectId = objectId;
    this.feature = feature;
  }

  evaluate(context: GenerationContext): boolean {
    const obj = context.objects.get(this.objectId);
    return obj ? obj.features.get(this.feature) : false;
  }
}

class RelationCheck implements LogicalOperator {
  sourceId: string;
  relationType: RelationType;
  targetId: string;

  constructor(sourceId: string, relationType: RelationType, targetId: string) {
    this.sourceId = sourceId;
    this.relationType = relationType;
    this.targetId = targetId;
  }

  evaluate(context: GenerationContext): boolean {
    const source = context.objects.get(this.sourceId);
    if (!source) return false;
    const relations = source.getRelations(this.relationType);
    return relations.some(r => r.target.id === this.targetId);
  }
}

// ============================================================================
// GENERATION CONTEXT (The State Space for Generation/Recognition)
// ============================================================================

class GenerationContext {
  objects: Map<string, SemanticObject> = new Map();
  activePerspective: PerspectiveIsomorphism = PerspectiveIsomorphism.WHAT;
  userDesign: SemanticObject | null = null;
  transitState: Map<string, boolean> = new Map();
  query: string = '';

  addObject(obj: SemanticObject): void {
    this.objects.set(obj.id, obj);
  }

  getObject(id: string): SemanticObject | undefined {
    return this.objects.get(id);
  }

  setPerspective(perspective: PerspectiveIsomorphism): void {
    this.activePerspective = perspective;
  }

  setUserDesign(design: SemanticObject): void {
    this.userDesign = design;
  }

  activateTransit(gateId: string): void {
    this.transitState.set(gateId, true);
  }
}

// ============================================================================
// PERSPECTIVE ISOMORPHISMS (w-dimensions)
// ============================================================================

enum PerspectiveIsomorphism {
  WHO = 'WHO',
  WHAT = 'WHAT',
  WHERE = 'WHERE',
  WHEN = 'WHEN',
  WHY = 'WHY'
}

interface PerspectiveTransformation {
  transform(semanticStructure: SemanticObject, context: GenerationContext): string;
  getTemplate(): string;
}

class WhoTransformation implements PerspectiveTransformation {
  getTemplate(): string {
    return "IDENTITY_TEMPLATE";
  }

  transform(obj: SemanticObject, context: GenerationContext): string {
    const type = obj.type;

    if (type === SemanticObjectType.GATE) {
      const gateNum = obj.id.replace('GATE_', '');
      const line = obj.getContent('line') || '1';
      return `I experience the ${gateNum}.${line} energy as a core part of my identity. When this gate is activated, I feel it in my very being — it shapes how I move through the world and how I recognize myself.`;
    }

    if (type === SemanticObjectType.CENTER) {
      const centerName = obj.id.replace('CENTER_', '');
      const isDefined = obj.features.get('defined');
      if (isDefined) {
        return `My ${centerName} is defined — this is a consistent, reliable part of who I am. I don't question this energy; it simply is me.`;
      } else {
        return `My ${centerName} is open — this is where I take in and amplify the energy of others. I am not this energy, but I experience it intensely through those around me.`;
      }
    }

    if (type === SemanticObjectType.TYPE) {
      const typeName = obj.id.replace('TYPE_', '');
      return `I am a ${typeName}. This is not something I do; it is something I am. My very life force moves according to this pattern.`;
    }

    return `I am connected to ${obj.id} — this is part of my essential nature.`;
  }
}

class WhatTransformation implements PerspectiveTransformation {
  getTemplate(): string {
    return "OBJECT_TEMPLATE";
  }

  transform(obj: SemanticObject, context: GenerationContext): string {
    const type = obj.type;

    if (type === SemanticObjectType.GATE) {
      const gateNum = obj.id.replace('GATE_', '');
      const keyword = obj.getContent('keyword') || 'power';
      const circuit = obj.getContent('circuit') || 'individual';
      return `Gate ${gateNum} is the ${keyword} gate, located in the ${circuit} circuit. It represents the mechanical pattern of ${keyword} expressed through its specific line and hexagram structure.`;
    }

    if (type === SemanticObjectType.CHANNEL) {
      const gate1 = obj.getContent('gate1');
      const gate2 = obj.getContent('gate2');
      const name = obj.getContent('name') || 'Channel';
      return `The ${name} connects Gate ${gate1} and Gate ${gate2}, forming a defined channel that links two centers and creates a consistent, reliable energy flow.`;
    }

    if (type === SemanticObjectType.CENTER) {
      const centerName = obj.id.replace('CENTER_', '');
      const biological = obj.getContent('biological') || 'system';
      const gates = obj.getRelations(RelationType.CONTAINS).map(r => r.target.id.replace('GATE_', '')).join(', ');
      return `The ${centerName} is a biological ${biological} center containing gates ${gates}. It processes specific frequencies of consciousness and operates according to its definition state.`;
    }

    return `${obj.id} is a ${type} object with features: ${obj.features.toString()}.`;
  }
}

class WhereTransformation implements PerspectiveTransformation {
  getTemplate(): string {
    return "CONTEXTUAL_TEMPLATE";
  }

  transform(obj: SemanticObject, context: GenerationContext): string {
    const type = obj.type;

    if (type === SemanticObjectType.GATE) {
      const gateNum = obj.id.replace('GATE_', '');
      const center = obj.getRelations(RelationType.CONTAINS)[0]?.target.id.replace('CENTER_', '') || 'unknown';
      return `In your environment, Gate ${gateNum} manifests through the ${center} center. You will notice this energy most clearly in situations where ${center} dynamics are active — in relationships, work settings, or creative collaborations that engage this center.`;
    }

    if (type === SemanticObjectType.CENTER) {
      const centerName = obj.id.replace('CENTER_', '');
      const isDefined = obj.features.get('defined');
      if (isDefined) {
        return `In your environment, your defined ${centerName} creates a consistent field. Others experience you as reliably ${centerName}-centered. This is your environmental signature — the space you naturally occupy.`;
      } else {
        return `In your environment, your open ${centerName} takes on the coloring of whatever is around you. You are a ${centerName} chameleon — the space changes you more than you change the space.`;
      }
    }

    return `${obj.id} manifests in your environment through its connections to other elements in your design.`;
  }
}

class WhenTransformation implements PerspectiveTransformation {
  getTemplate(): string {
    return "TEMPORAL_TEMPLATE";
  }

  transform(obj: SemanticObject, context: GenerationContext): string {
    const type = obj.type;
    const transitActive = context.transitState.get(obj.id) || false;

    if (type === SemanticObjectType.GATE) {
      const gateNum = obj.id.replace('GATE_', '');
      if (transitActive) {
        return `Right now, Gate ${gateNum} is activated by transit. This is a temporary window — the energy is available to you now, even if it's not part of your native design. Use this time to experience what ${gateNum} feels like when it's amplified by the planetary field.`;
      } else {
        return `Gate ${gateNum} is not currently in transit. Its energy is available to you through your native definition, or it lies dormant, waiting for the next planetary activation to bring it to the surface.`;
      }
    }

    if (type === SemanticObjectType.TRANSIT) {
      const gateNum = obj.getContent('gate');
      const planet = obj.getContent('planet') || 'a planetary body';
      const date = obj.getContent('date') || 'this period';
      return `During ${date}, ${planet} transits Gate ${gateNum}, activating this energy in the collective field. This is a time when everyone experiences the ${gateNum} frequency, creating a temporary shift in the planetary consciousness.`;
    }

    return `${obj.id} operates according to temporal cycles — its activation depends on planetary movements and your personal biorhythms.`;
  }
}

class WhyTransformation implements PerspectiveTransformation {
  getTemplate(): string {
    return "CAUSAL_TEMPLATE";
  }

  transform(obj: SemanticObject, context: GenerationContext): string {
    const type = obj.type;

    if (type === SemanticObjectType.GATE) {
      const gateNum = obj.id.replace('GATE_', '');
      const purpose = obj.getContent('purpose') || 'evolutionary movement';
      const shadow = obj.getContent('shadow') || 'distraction';
      const gift = obj.getContent('gift') || 'power';
      const siddhi = obj.getContent('siddhi') || 'majesty';
      return `Gate ${gateNum} exists to teach ${purpose}. In its shadow, it becomes ${shadow} — a force that scatters and fragments. In its gift, it becomes ${gift} — a force that concentrates and directs. In its siddhi, it becomes ${siddhi} — the full flowering of its evolutionary purpose. This is why this gate matters: it is a lesson in the transformation of energy from chaos to coherence.`;
    }

    if (type === SemanticObjectType.TYPE) {
      const typeName = obj.id.replace('TYPE_', '');
      const purpose = obj.getContent('purpose') || 'correct action';
      return `You are a ${typeName} because your design requires ${purpose} as your fundamental strategy. This is not random — it is the precise configuration that allows your life force to move correctly through the world without resistance.`;
    }

    if (type === SemanticObjectType.AUTHORITY) {
      const authName = obj.id.replace('AUTHORITY_', '');
      return `Your ${authName} authority exists because your design requires this specific decision-making process to maintain alignment. Without it, you would be lost in the noise of your undefined centers. This is why you must wait, or feel, or speak, or act — because this is the only path that leads to your correct trajectory.`;
    }

    return `${obj.id} serves a purpose in the larger pattern of your design — it is not accidental, but necessary.`;
  }
}

const PERSPECTIVE_TRANSFORMATIONS: Map<PerspectiveIsomorphism, PerspectiveTransformation> = new Map([
  [PerspectiveIsomorphism.WHO, new WhoTransformation()],
  [PerspectiveIsomorphism.WHAT, new WhatTransformation()],
  [PerspectiveIsomorphism.WHERE, new WhereTransformation()],
  [PerspectiveIsomorphism.WHEN, new WhenTransformation()],
  [PerspectiveIsomorphism.WHY, new WhyTransformation()]
]);

// ============================================================================
// DISEMINER: DISTRIBUTIONAL SEMANTICS INFERENCE MAKER
// ============================================================================

class DISEMINER {
  semanticNetwork: Map<string, Map<string, number>> = new Map();
  conceptVectors: Map<string, number[]> = new Map();
  deepStructureRules: SemanticProductionRule[] = [];

  ingest(text: string, windowSize: number = 5): void {
    const words = this.tokenize(text);

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (!this.semanticNetwork.has(word)) {
        this.semanticNetwork.set(word, new Map());
      }

      const start = Math.max(0, i - windowSize);
      const end = Math.min(words.length, i + windowSize + 1);

      for (let j = start; j < end; j++) {
        if (j !== i) {
          const contextWord = words[j];
          const coOccurrences = this.semanticNetwork.get(word)!;
          const current = coOccurrences.get(contextWord) || 0;
          coOccurrences.set(contextWord, current + 1);
        }
      }
    }

    this.buildConceptVectors(words);
    this.inferRules(words);
  }

  tokenize(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);
  }

  buildConceptVectors(words: string[]): void {
    const uniqueWords = [...new Set(words)];
    const vocabSize = uniqueWords.length;

    for (const word of uniqueWords) {
      const vector = new Array(vocabSize).fill(0);
      const coOccurrences = this.semanticNetwork.get(word);
      if (coOccurrences) {
        for (const [contextWord, count] of coOccurrences) {
          const idx = uniqueWords.indexOf(contextWord);
          if (idx >= 0) {
            vector[idx] = count;
          }
        }
      }
      this.conceptVectors.set(word, vector);
    }
  }

  inferRules(words: string[]): void {
    const patterns = this.extractPatterns(words);

    for (const pattern of patterns) {
      if (pattern.frequency > 3) {
        const rule = new SemanticProductionRule(
          pattern.antecedent,
          pattern.consequent,
          pattern.frequency / words.length
        );
        this.deepStructureRules.push(rule);
      }
    }
  }

  extractPatterns(words: string[]): Pattern[] {
    const patterns: Pattern[] = [];
    const ngramCounts: Map<string, number> = new Map();

    for (let n = 2; n <= 5; n++) {
      for (let i = 0; i <= words.length - n; i++) {
        const ngram = words.slice(i, i + n).join(' ');
        ngramCounts.set(ngram, (ngramCounts.get(ngram) || 0) + 1);
      }
    }

    for (const [ngram, count] of ngramCounts) {
      if (count > 3) {
        const parts = ngram.split(' ');
        patterns.push({
          antecedent: parts.slice(0, -1).join(' '),
          consequent: parts[parts.length - 1],
          frequency: count
        });
      }
    }

    return patterns;
  }

  similarity(word1: string, word2: string): number {
    const vec1 = this.conceptVectors.get(word1);
    const vec2 = this.conceptVectors.get(word2);
    if (!vec1 || !vec2) return 0;

    return this.cosineSimilarity(vec1, vec2);
  }

  cosineSimilarity(vec1: number[], vec2: number[]): number {
    let dot = 0, mag1 = 0, mag2 = 0;
    for (let i = 0; i < vec1.length; i++) {
      dot += vec1[i] * vec2[i];
      mag1 += vec1[i] * vec1[i];
      mag2 += vec2[i] * vec2[i];
    }
    return dot / (Math.sqrt(mag1) * Math.sqrt(mag2) + 0.0001);
  }

  getRelated(word: string, threshold: number = 0.1): string[] {
    const related: string[] = [];
    for (const [otherWord, _] of this.conceptVectors) {
      if (otherWord !== word) {
        const sim = this.similarity(word, otherWord);
        if (sim > threshold) {
          related.push(otherWord);
        }
      }
    }
    return related;
  }
}

interface Pattern {
  antecedent: string;
  consequent: string;
  frequency: number;
}

class SemanticProductionRule {
  antecedent: string;
  consequent: string;
  probability: number;

  constructor(antecedent: string, consequent: string, probability: number) {
    this.antecedent = antecedent;
    this.consequent = consequent;
    this.probability = probability;
  }

  matches(context: string[]): boolean {
    const antecedentWords = this.antecedent.split(' ');
    for (let i = 0; i <= context.length - antecedentWords.length; i++) {
      const slice = context.slice(i, i + antecedentWords.length);
      if (slice.join(' ') === this.antecedent) {
        return true;
      }
    }
    return false;
  }
}

// ============================================================================
// AUTOLING: INTERACTIVE HEURISTIC GRAMMAR LEARNER
// ============================================================================

class AUTOLING {
  grammar: Map<string, string[]> = new Map();
  learnedRules: SemanticProductionRule[] = [];

  learnFromDISEMINER(diseMiner: DISEMINER): void {
    for (const rule of diseMiner.deepStructureRules) {
      this.learnedRules.push(rule);

      const expansions = this.grammar.get(rule.antecedent) || [];
      expansions.push(rule.consequent);
      this.grammar.set(rule.antecedent, expansions);
    }
  }

  generate(startSymbol: string, maxDepth: number = 10): string {
    let result = startSymbol;
    let depth = 0;

    while (depth < maxDepth) {
      const tokens = result.split(' ');
      let expanded = false;

      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const expansions = this.grammar.get(token);
        if (expansions && expansions.length > 0) {
          const expansion = expansions[Math.floor(Math.random() * expansions.length)];
          tokens[i] = expansion;
          expanded = true;
          break;
        }
      }

      result = tokens.join(' ');
      if (!expanded) break;
      depth++;
    }

    return result;
  }

  generateWithContext(startSymbol: string, context: string[], maxDepth: number = 10): string {
    const relevantRules = this.learnedRules.filter(r => r.matches(context));

    if (relevantRules.length === 0) {
      return this.generate(startSymbol, maxDepth);
    }

    relevantRules.sort((a, b) => b.probability - a.probability);
    const bestRule = relevantRules[0];

    return bestRule.consequent;
  }
}

// ============================================================================
// MESSY ENGINE: META-SYMBOLIC SIMULATION RUNTIME
// ============================================================================

class MESSYEngine {
  diseMiner: DISEMINER;
  autoLing: AUTOLING;
  context: GenerationContext;

  constructor() {
    this.diseMiner = new DISEMINER();
    this.autoLing = new AUTOLING();
    this.context = new GenerationContext();
  }

  ingestSources(texts: string[]): void {
    for (const text of texts) {
      this.diseMiner.ingest(text);
    }
    this.autoLing.learnFromDISEMINER(this.diseMiner);
  }

  configureUserDesign(design: SemanticObject): void {
    this.context.setUserDesign(design);
    this.context.addObject(design);

    for (const [_, relations] of design.relations) {
      for (const relation of relations) {
        this.context.addObject(relation.target);
      }
    }
  }

  generate(query: string, perspective: PerspectiveIsomorphism): string {
    this.context.setPerspective(perspective);
    this.context.query = query;

    const relevantObjects = this.identifyRelevantObjects(query);

    if (relevantObjects.length === 0) {
      return this.generateFallback(query, perspective);
    }

    const transformation = PERSPECTIVE_TRANSFORMATIONS.get(perspective)!;
    const responses = relevantObjects.map(obj => transformation.transform(obj, this.context));

    const grammarText = this.autoLing.generateWithContext(
      'RESPONSE',
      query.toLowerCase().split(' '),
      5
    );

    return this.composeResponse(responses, grammarText, perspective);
  }

  identifyRelevantObjects(query: string): SemanticObject[] {
    const words = query.toLowerCase().split(/\s+/);
    const relevant: SemanticObject[] = [];

    for (const word of words) {
      for (const [id, obj] of this.context.objects) {
        if (id.toLowerCase().includes(word) || 
            (obj.getContent('keyword') && obj.getContent('keyword').toLowerCase().includes(word))) {
          relevant.push(obj);
        }
      }

      const related = this.diseMiner.getRelated(word, 0.05);
      for (const relatedWord of related) {
        for (const [id, obj] of this.context.objects) {
          if (id.toLowerCase().includes(relatedWord)) {
            relevant.push(obj);
          }
        }
      }
    }

    return [...new Set(relevant)];
  }

  generateFallback(query: string, perspective: PerspectiveIsomorphism): string {
    const transformation = PERSPECTIVE_TRANSFORMATIONS.get(perspective)!;

    if (this.context.userDesign) {
      return transformation.transform(this.context.userDesign, this.context);
    }

    return `I am processing your query about "${query}" from the ${perspective} perspective. Please provide your design data for a more specific response.`;
  }

  composeResponse(parts: string[], grammarText: string, perspective: PerspectiveIsomorphism): string {
    let response = parts.join('\n\n');

    const perspectiveNames: Record<string, string> = {
      'WHO': 'From the perspective of your identity',
      'WHAT': 'Looking at the pattern itself',
      'WHERE': 'In the context of your environment',
      'WHEN': 'Considering the timing and cycles',
      'WHY': 'Understanding the deeper purpose'
    };

    return `${perspectiveNames[perspective] || 'From your design'}:\n\n${response}`;
  }

  generateAllPerspectives(query: string): Record<string, string> {
    const results: Record<string, string> = {};

    for (const perspective of Object.values(PerspectiveIsomorphism)) {
      results[perspective] = this.generate(query, perspective);
    }

    return results;
  }
}

// ============================================================================
// HD SEMANTIC OBJECT BUILDERS
// ============================================================================

class HDObjectFactory {

  static createGate(gateNumber: number, line: number = 1): SemanticObject {
    const gate = new SemanticObject(`GATE_${gateNumber}`, SemanticObjectType.GATE);

    gate.features.set('defined', false);
    gate.features.set('activated', false);
    gate.features.set('transit', false);

    gate.setContent('number', gateNumber);
    gate.setContent('line', line);
    gate.setContent('hexagram', this.getHexagramName(gateNumber));
    gate.setContent('keyword', this.getGateKeyword(gateNumber));
    gate.setContent('circuit', this.getCircuit(gateNumber));
    gate.setContent('shadow', this.getGateShadow(gateNumber));
    gate.setContent('gift', this.getGateGift(gateNumber));
    gate.setContent('siddhi', this.getGateSiddhi(gateNumber));
    gate.setContent('purpose', this.getGatePurpose(gateNumber));

    return gate;
  }

  static createCenter(name: string, biological: string): SemanticObject {
    const center = new SemanticObject(`CENTER_${name}`, SemanticObjectType.CENTER);
    center.setContent('biological', biological);
    center.features.set('defined', false);
    center.features.set('active', false);
    return center;
  }

  static createChannel(gate1: number, gate2: number, name: string): SemanticObject {
    const channel = new SemanticObject(`CHANNEL_${gate1}_${gate2}`, SemanticObjectType.CHANNEL);
    channel.setContent('gate1', gate1);
    channel.setContent('gate2', gate2);
    channel.setContent('name', name);
    channel.features.set('defined', false);
    return channel;
  }

  static createType(typeName: string): SemanticObject {
    const type = new SemanticObject(`TYPE_${typeName}`, SemanticObjectType.TYPE);
    type.setContent('purpose', this.getTypePurpose(typeName));
    type.features.set('active', true);
    return type;
  }

  static createAuthority(authName: string): SemanticObject {
    const auth = new SemanticObject(`AUTHORITY_${authName}`, SemanticObjectType.AUTHORITY);
    auth.features.set('active', true);
    return auth;
  }

  static getHexagramName(gate: number): string {
    const hexagrams: Record<number, string> = {
      1: 'The Creative', 2: 'The Receptive', 3: 'Difficulty at the Beginning',
      4: 'Youthful Folly', 5: 'Waiting', 6: 'Conflict', 7: 'The Army',
      8: 'Holding Together', 9: 'Taming Power of the Small', 10: 'Treading',
      11: 'Peace', 12: 'Standstill', 13: 'Fellowship', 14: 'Possession in Great Measure',
      15: 'Modesty', 16: 'Enthusiasm', 17: 'Following', 18: 'Work on What Has Been Spoiled',
      19: 'Approach', 20: 'Contemplation', 21: 'Biting Through', 22: 'Grace',
      23: 'Splitting Apart', 24: 'Return', 25: 'Innocence', 26: 'The Taming Power of the Great',
      27: 'Nourishment', 28: 'Preponderance of the Great', 29: 'The Abysmal',
      30: 'The Clinging Fire', 31: 'Influence', 32: 'Duration',
      33: 'Retreat', 34: 'The Power of the Great', 35: 'Progress',
      36: 'Darkening of the Light', 37: 'The Family', 38: 'Opposition',
      39: 'Obstruction', 40: 'Deliverance', 41: 'Decrease', 42: 'Increase',
      43: 'Breakthrough', 44: 'Coming to Meet', 45: 'Gathering Together',
      46: 'Pushing Upward', 47: 'Oppression', 48: 'The Well',
      49: 'Revolution', 50: 'The Cauldron', 51: 'The Arousing',
      52: 'Keeping Still', 53: 'Development', 54: 'The Marrying Maiden',
      55: 'Abundance', 56: 'The Wanderer', 57: 'The Gentle',
      58: 'The Joyous', 59: 'Dispersion', 60: 'Limitation',
      61: 'Inner Truth', 62: 'Preponderance of the Small', 63: 'After Completion',
      64: 'Before Completion'
    };
    return hexagrams[gate] || 'Unknown';
  }

  static getGateKeyword(gate: number): string {
    const keywords: Record<number, string> = {
      1: 'creative', 2: 'receptive', 3: 'ordering', 4: 'answers',
      5: 'fixed rhythms', 6: 'conflict', 7: 'role', 8: 'contribution',
      9: 'focus', 10: 'behavior', 11: 'ideas', 12: 'caution',
      13: 'listener', 14: 'power skills', 15: 'extremes', 16: 'skills',
      17: 'opinion', 18: 'correction', 19: 'approach', 20: 'now',
      21: 'control', 22: 'grace', 23: 'assimilation', 24: 'rationalization',
      25: 'innocence', 26: 'taste', 27: 'caring', 28: 'risk',
      29: 'perseverance', 30: 'feelings', 31: 'influence', 32: 'continuity',
      33: 'retreat', 34: 'power', 35: 'change', 36: 'crisis',
      37: 'friendship', 38: 'opposition', 39: 'provocation', 40: 'aloneness',
      41: 'fantasy', 42: 'growth', 43: 'insight', 44: 'alertness',
      45: 'gathering', 46: 'determination', 47: 'realization', 48: 'depth',
      49: 'principles', 50: 'values', 51: 'shock', 52: 'inaction',
      53: 'beginnings', 54: 'ambition', 55: 'spirit', 56: 'wandering',
      57: 'intuitive clarity', 58: 'joy', 59: 'sexuality', 60: 'limitation',
      61: 'mystery', 62: 'details', 63: 'doubt', 64: 'confusion'
    };
    return keywords[gate] || 'energy';
  }

  static getCircuit(gate: number): string {
    const circuits: Record<number, string> = {
      1: 'individual', 2: 'collective', 3: 'collective', 4: 'collective',
      5: 'collective', 6: 'tribal', 7: 'collective', 8: 'collective',
      9: 'individual', 10: 'individual', 11: 'collective', 12: 'individual',
      13: 'collective', 14: 'individual', 15: 'collective', 16: 'tribal',
      17: 'collective', 18: 'collective', 19: 'tribal', 20: 'individual',
      21: 'tribal', 22: 'individual', 23: 'individual', 24: 'individual',
      25: 'individual', 26: 'tribal', 27: 'tribal', 28: 'individual',
      29: 'individual', 30: 'individual', 31: 'collective', 32: 'tribal',
      33: 'individual', 34: 'individual', 35: 'collective', 36: 'tribal',
      37: 'tribal', 38: 'individual', 39: 'individual', 40: 'tribal',
      41: 'collective', 42: 'collective', 43: 'individual', 44: 'tribal',
      45: 'tribal', 46: 'collective', 47: 'individual', 48: 'collective',
      49: 'tribal', 50: 'tribal', 51: 'individual', 52: 'individual',
      53: 'collective', 54: 'tribal', 55: 'tribal', 56: 'individual',
      57: 'individual', 58: 'tribal', 59: 'tribal', 60: 'collective',
      61: 'individual', 62: 'collective', 63: 'collective', 64: 'individual'
    };
    return circuits[gate] || 'unknown';
  }

  static getGateShadow(gate: number): string {
    const shadows: Record<number, string> = {
      34: 'force', 35: 'change for change\'s sake', 36: 'turbulence',
      37: 'interference', 38: 'struggle', 39: 'provocation',
      40: 'loneliness', 41: 'fantasy', 42: 'expectation',
      43: 'deafness', 44: 'interference', 45: 'suppression',
      46: 'seriousness', 47: 'oppression', 48: 'inadequacy',
      49: 'rejection', 50: 'corruption', 51: 'agitation',
      52: 'inaction', 53: 'immaturity', 54: 'greed',
      55: 'victimization', 56: 'distraction', 57: 'unease',
      58: 'dissatisfaction', 59: 'dishonesty', 60: 'limitation',
      61: 'psychosis', 62: 'intellect', 63: 'doubt', 64: 'confusion'
    };
    return shadows[gate] || 'shadow';
  }

  static getGateGift(gate: number): string {
    const gifts: Record<number, string> = {
      34: 'power', 35: 'progress', 36: 'transcendence',
      37: 'community', 38: 'perseverance', 39: 'provocation',
      40: 'deliverance', 41: 'anticipation', 42: 'growth',
      43: 'insight', 44: 'synthesis', 45: 'gathering',
      46: 'determination', 47: 'transmutation', 48: 'resourcefulness',
      49: 'principles', 50: 'values', 51: 'awakening',
      52: 'stillness', 53: 'development', 54: 'asceticism',
      55: 'freedom', 56: 'wandering', 57: 'intuitive clarity',
      58: 'vitality', 59: 'intimacy', 60: 'realism',
      61: 'inspiration', 62: 'precision', 63: 'truth', 64: 'imagination'
    };
    return gifts[gate] || 'gift';
  }

  static getGateSiddhi(gate: number): string {
    const siddhis: Record<number, string> = {
      34: 'majesty', 35: 'boundlessness', 36: 'compassion',
      37: 'tenderness', 38: 'honor', 39: 'liberation',
      40: 'divine aloneness', 41: 'elegance', 42: 'celebration',
      43: 'epiphany', 44: 'synarchy', 45: 'communion',
      46: 'ecstasy', 47: 'transfiguration', 48: 'wisdom',
      49: 'revolution', 50: 'harmony', 51: 'illumination',
      52: 'enlightenment', 53: 'evolution', 54: 'genius',
      55: 'surrender', 56: 'enchantment', 57: 'clarity',
      58: 'bliss', 59: 'transparence', 60: 'justice',
      61: 'sanctity', 62: 'perfection', 63: 'presence', 64: 'will'
    };
    return siddhis[gate] || 'siddhi';
  }

  static getGatePurpose(gate: number): string {
    const purposes: Record<number, string> = {
      34: 'the transformation of force into power',
      35: 'the acceptance of change as natural law',
      36: 'the transcendence of crisis through compassion',
      37: 'the creation of community through friendship',
      38: 'the perseverance of the individual spirit',
      39: 'the liberation through provocation',
      40: 'the deliverance through aloneness',
      41: 'the elegance of anticipation',
      42: 'the celebration of growth',
      43: 'the epiphany of insight',
      44: 'the synthesis of past and future',
      45: 'the communion of gathered resources',
      46: 'the ecstasy of determined action',
      47: 'the transmutation of oppression',
      48: 'the wisdom of depth',
      49: 'the revolution of principles',
      50: 'the harmony of values',
      51: 'the illumination through shock',
      52: 'the enlightenment through stillness',
      53: 'the evolution through beginnings',
      54: 'the genius of asceticism',
      55: 'the surrender to spirit',
      56: 'the enchantment of wandering',
      57: 'the clarity of intuition',
      58: 'the bliss of vitality',
      59: 'the transparence of intimacy',
      60: 'the justice of limitation',
      61: 'the sanctity of inner truth',
      62: 'the perfection of detail',
      63: 'the presence of truth',
      64: 'the will to navigate confusion'
    };
    return purposes[gate] || 'evolutionary development';
  }

  static getTypePurpose(type: string): string {
    const purposes: Record<string, string> = {
      'Generator': 'to respond and build',
      'Manifestor': 'to initiate and impact',
      'Projector': 'to guide and direct',
      'Reflector': 'to reflect and sample'
    };
    return purposes[type] || 'correct action';
  }
}

// ============================================================================
// CONTACT MODEL: User's Design-Shaped Agent
// ============================================================================

class ContactModel {
  id: string;
  userId: string;
  design: SemanticObject;
  engine: MESSYEngine;
  centers: Map<string, SemanticObject> = new Map();
  gates: Map<number, SemanticObject> = new Map();
  channels: Map<string, SemanticObject> = new Map();
  activeTasks: Map<string, any> = new Map();

  constructor(userId: string, design: SemanticObject) {
    this.id = `CONTACT_${userId}`;
    this.userId = userId;
    this.design = design;
    this.engine = new MESSYEngine();

    this.extractComponents();
  }

  extractComponents(): void {
    for (const [type, relations] of this.design.relations) {
      for (const relation of relations) {
        const target = relation.target;
        if (target.type === SemanticObjectType.CENTER) {
          this.centers.set(target.id, target);
        } else if (target.type === SemanticObjectType.GATE) {
          const num = target.getContent('number');
          this.gates.set(num, target);
        } else if (target.type === SemanticObjectType.CHANNEL) {
          this.channels.set(target.id, target);
        }
      }
    }
  }

  activateCenter(centerName: string): void {
    const center = this.centers.get(`CENTER_${centerName}`);
    if (center) {
      center.features.set('active', true);
      this.design.features.set(`${centerName}_active`, true);

      const gateRelations = center.getRelations(RelationType.CONTAINS);
      for (const relation of gateRelations) {
        relation.target.features.set('activated', true);
      }
    }
  }

  deactivateCenter(centerName: string): void {
    const center = this.centers.get(`CENTER_${centerName}`);
    if (center) {
      center.features.set('active', false);
      this.design.features.set(`${centerName}_active`, false);

      const gateRelations = center.getRelations(RelationType.CONTAINS);
      for (const relation of gateRelations) {
        relation.target.features.set('activated', false);
      }
    }
  }

  process(query: string, perspective: PerspectiveIsomorphism = PerspectiveIsomorphism.WHAT): string {
    this.engine.configureUserDesign(this.design);

    for (const [_, center] of this.centers) {
      this.engine.context.addObject(center);
    }
    for (const [_, gate] of this.gates) {
      this.engine.context.addObject(gate);
    }
    for (const [_, channel] of this.channels) {
      this.engine.context.addObject(channel);
    }

    return this.engine.generate(query, perspective);
  }

  processAllPerspectives(query: string): Record<string, string> {
    this.engine.configureUserDesign(this.design);

    for (const [_, center] of this.centers) {
      this.engine.context.addObject(center);
    }
    for (const [_, gate] of this.gates) {
      this.engine.context.addObject(gate);
    }
    for (const [_, channel] of this.channels) {
      this.engine.context.addObject(channel);
    }

    return this.engine.generateAllPerspectives(query);
  }

  research(topic: string): string {
    const activeCenters = Array.from(this.centers.values())
      .filter(c => c.features.get('active'));

    if (activeCenters.length === 0) {
      return `My research on "${topic}" is pending — no centers are currently activated. I will begin when your design indicates readiness.`;
    }

    const primaryCenter = activeCenters[0];
    const centerName = primaryCenter.id.replace('CENTER_', '');

    return `Researching "${topic}" through my ${centerName} center. This is my natural mode of inquiry — I am extracting, analyzing, and synthesizing information according to my defined ${centerName} pattern. I will report findings when the material reaches coherence through my authority.`;
  }

  getCenterStatus(): Record<string, any> {
    const status: Record<string, any> = {};
    for (const [name, center] of this.centers) {
      status[name] = {
        defined: center.features.get('defined'),
        active: center.features.get('active'),
        biological: center.getContent('biological'),
        gates: center.getRelations(RelationType.CONTAINS).map(r => r.target.getContent('number'))
      };
    }
    return status;
  }
}

// ============================================================================
// MCP HUB: Temporal Matching Engine
// ============================================================================

class MCPHub {
  contactModels: Map<string, ContactModel> = new Map();
  connections: Map<string, Connection[]> = new Map();

  registerContactModel(model: ContactModel): void {
    this.contactModels.set(model.userId, model);
  }

  calculateResonance(model1: ContactModel, model2: ContactModel): ResonanceProfile {
    const sharedChannels: string[] = [];
    const complementaryCenters: string[] = [];
    const activatedGates: number[] = [];

    for (const [id, channel] of model1.channels) {
      if (model2.channels.has(id)) {
        sharedChannels.push(id);
      }
    }

    for (const [name, center1] of model1.centers) {
      const center2 = model2.centers.get(name);
      if (center2) {
        const c1Defined = center1.features.get('defined');
        const c2Defined = center2.features.get('defined');
        if (c1Defined !== c2Defined) {
          complementaryCenters.push(name);
        }
      }
    }

    for (const [num, gate1] of model1.gates) {
      const gate2 = model2.gates.get(num);
      if (gate2) {
        if (gate1.features.get('activated') || gate2.features.get('activated')) {
          activatedGates.push(num);
        }
      }
    }

    return {
      sharedChannels,
      complementaryCenters,
      activatedGates,
      resonanceScore: this.calculateScore(sharedChannels, complementaryCenters, activatedGates)
    };
  }

  calculateScore(channels: string[], centers: string[], gates: number[]): number {
    return (channels.length * 3) + (centers.length * 2) + (gates.length * 1);
  }

  findConnections(userId: string, maxResults: number = 5): ConnectionSuggestion[] {
    const userModel = this.contactModels.get(userId);
    if (!userModel) return [];

    const suggestions: ConnectionSuggestion[] = [];

    for (const [otherId, otherModel] of this.contactModels) {
      if (otherId !== userId) {
        const resonance = this.calculateResonance(userModel, otherModel);
        if (resonance.resonanceScore > 0) {
          suggestions.push({
            userId: otherId,
            resonance,
            timing: this.calculateTiming(userModel, otherModel),
            purpose: this.calculatePurpose(userModel, otherModel, resonance)
          });
        }
      }
    }

    suggestions.sort((a, b) => {
      const timingDiff = b.timing.appropriateness - a.timing.appropriateness;
      if (Math.abs(timingDiff) > 0.3) return timingDiff;
      return b.resonance.resonanceScore - a.resonance.resonanceScore;
    });

    return suggestions.slice(0, maxResults);
  }

  calculateTiming(model1: ContactModel, model2: ContactModel): TimingAnalysis {
    const activeTransits1 = Array.from(model1.gates.values())
      .filter(g => g.features.get('transit'));
    const activeTransits2 = Array.from(model2.gates.values())
      .filter(g => g.features.get('transit'));

    const sharedTransitGates = activeTransits1
      .filter(g1 => activeTransits2.some(g2 => g1.getContent('number') === g2.getContent('number')))
      .map(g => g.getContent('number'));

    const appropriateness = sharedTransitGates.length > 0 ? 0.9 : 0.5;

    return {
      appropriateness,
      sharedTransitGates,
      recommendation: sharedTransitGates.length > 0 
        ? 'Strong transit alignment — connection is highly productive now'
        : 'Moderate alignment — connection is available but not transit-amplified'
    };
  }

  calculatePurpose(model1: ContactModel, model2: ContactModel, resonance: ResonanceProfile): string {
    if (resonance.sharedChannels.length > 0) {
      return 'Shared definition creates mutual understanding and consistent energy flow';
    } else if (resonance.complementaryCenters.length > 0) {
      return 'Complementary centers create teaching/learning dynamic';
    } else if (resonance.activatedGates.length > 0) {
      return 'Activated gate resonance creates temporary but intense connection';
    }
    return 'General design compatibility';
  }

  connect(userId1: string, userId2: string): Connection {
    const model1 = this.contactModels.get(userId1);
    const model2 = this.contactModels.get(userId2);

    if (!model1 || !model2) {
      throw new Error('Both users must have registered Contact Models');
    }

    const resonance = this.calculateResonance(model1, model2);
    const timing = this.calculateTiming(model1, model2);

    const connection: Connection = {
      id: `CONN_${userId1}_${userId2}_${Date.now()}`,
      userId1,
      userId2,
      resonance,
      timing,
      createdAt: new Date(),
      status: 'active'
    };

    const user1Conns = this.connections.get(userId1) || [];
    user1Conns.push(connection);
    this.connections.set(userId1, user1Conns);

    const user2Conns = this.connections.get(userId2) || [];
    user2Conns.push(connection);
    this.connections.set(userId2, user2Conns);

    return connection;
  }
}

interface ResonanceProfile {
  sharedChannels: string[];
  complementaryCenters: string[];
  activatedGates: number[];
  resonanceScore: number;
}

interface TimingAnalysis {
  appropriateness: number;
  sharedTransitGates: number[];
  recommendation: string;
}

interface ConnectionSuggestion {
  userId: string;
  resonance: ResonanceProfile;
  timing: TimingAnalysis;
  purpose: string;
}

interface Connection {
  id: string;
  userId1: string;
  userId2: string;
  resonance: ResonanceProfile;
  timing: TimingAnalysis;
  createdAt: Date;
  status: string;
}

// ============================================================================
// EXAMPLE USAGE / DEMO
// ============================================================================

function createSampleDesign(): SemanticObject {
  const design = new SemanticObject('USER_DESIGN_1', SemanticObjectType.COMPOSITE);

  const type = HDObjectFactory.createType('Generator');
  design.addRelation(new SemanticRelation(RelationType.DEFINES, design, type));

  const authority = HDObjectFactory.createAuthority('Sacral');
  design.addRelation(new SemanticRelation(RelationType.DEFINES, design, authority));

  const sacral = HDObjectFactory.createCenter('Sacral', 'reproductive');
  sacral.features.set('defined', true);
  design.addRelation(new SemanticRelation(RelationType.CONTAINS, design, sacral));

  const spleen = HDObjectFactory.createCenter('Spleen', 'immune');
  spleen.features.set('defined', true);
  design.addRelation(new SemanticRelation(RelationType.CONTAINS, design, spleen));

  const root = HDObjectFactory.createCenter('Root', 'adrenal');
  root.features.set('defined', false);
  design.addRelation(new SemanticRelation(RelationType.CONTAINS, design, root));

  const gate34 = HDObjectFactory.createGate(34, 1);
  gate34.features.set('defined', true);
  sacral.addRelation(new SemanticRelation(RelationType.CONTAINS, sacral, gate34));
  design.addRelation(new SemanticRelation(RelationType.DEFINES, design, gate34));

  const gate57 = HDObjectFactory.createGate(57, 1);
  gate57.features.set('defined', true);
  spleen.addRelation(new SemanticRelation(RelationType.CONTAINS, spleen, gate57));
  design.addRelation(new SemanticRelation(RelationType.DEFINES, design, gate57));

  const gate20 = HDObjectFactory.createGate(20, 1);
  gate20.features.set('defined', true);
  sacral.addRelation(new SemanticRelation(RelationType.CONTAINS, sacral, gate20));
  design.addRelation(new SemanticRelation(RelationType.DEFINES, design, gate20));

  const channel34_20 = HDObjectFactory.createChannel(34, 20, 'Channel of Charisma');
  channel34_20.features.set('defined', true);
  design.addRelation(new SemanticRelation(RelationType.CONNECTS, design, channel34_20));

  return design;
}

function createSecondDesign(): SemanticObject {
  const design = new SemanticObject('USER_DESIGN_2', SemanticObjectType.COMPOSITE);

  const type = HDObjectFactory.createType('Projector');
  design.addRelation(new SemanticRelation(RelationType.DEFINES, design, type));

  const authority = HDObjectFactory.createAuthority('Self-Projected');
  design.addRelation(new SemanticRelation(RelationType.DEFINES, design, authority));

  const ajna = HDObjectFactory.createCenter('Ajna', 'cognitive');
  ajna.features.set('defined', true);
  design.addRelation(new SemanticRelation(RelationType.CONTAINS, design, ajna));

  const throat = HDObjectFactory.createCenter('Throat', 'metabolic');
  throat.features.set('defined', true);
  design.addRelation(new SemanticRelation(RelationType.CONTAINS, design, throat));

  const sacral = HDObjectFactory.createCenter('Sacral', 'reproductive');
  sacral.features.set('defined', false);
  design.addRelation(new SemanticRelation(RelationType.CONTAINS, design, sacral));

  const gate43 = HDObjectFactory.createGate(43, 1);
  gate43.features.set('defined', true);
  ajna.addRelation(new SemanticRelation(RelationType.CONTAINS, ajna, gate43));
  design.addRelation(new SemanticRelation(RelationType.DEFINES, design, gate43));

  const gate23 = HDObjectFactory.createGate(23, 1);
  gate23.features.set('defined', true);
  throat.addRelation(new SemanticRelation(RelationType.CONTAINS, throat, gate23));
  design.addRelation(new SemanticRelation(RelationType.DEFINES, design, gate23));

  const channel43_23 = HDObjectFactory.createChannel(43, 23, 'Channel of Structuring');
  channel43_23.features.set('defined', true);
  design.addRelation(new SemanticRelation(RelationType.CONNECTS, design, channel43_23));

  return design;
}

// ============================================================================
// DEMONSTRATION
// ============================================================================

console.log('=== MESSY-HD GENERATIVE SYSTEM ===\n');

const design1 = createSampleDesign();
const design2 = createSecondDesign();

const contact1 = new ContactModel('user_1', design1);
const contact2 = new ContactModel('user_2', design2);

console.log('--- Contact Model 1 (Generator, Sacral Authority) ---');
console.log('Center Status:', JSON.stringify(contact1.getCenterStatus(), null, 2));

console.log('\n--- Contact Model 2 (Projector, Self-Projected Authority) ---');
console.log('Center Status:', JSON.stringify(contact2.getCenterStatus(), null, 2));

console.log('\n=== GENERATIVE QUERIES ===\n');

console.log('--- Query: "What is my Gate 34?" ---');
console.log('WHO:', contact1.process('What is my Gate 34?', PerspectiveIsomorphism.WHO));
console.log('\nWHAT:', contact1.process('What is my Gate 34?', PerspectiveIsomorphism.WHAT));
console.log('\nWHERE:', contact1.process('What is my Gate 34?', PerspectiveIsomorphism.WHERE));
console.log('\nWHEN:', contact1.process('What is my Gate 34?', PerspectiveIsomorphism.WHEN));
console.log('\nWHY:', contact1.process('What is my Gate 34?', PerspectiveIsomorphism.WHY));

console.log('\n--- Query: "Tell me about my type" ---');
console.log('WHO:', contact1.process('Tell me about my type', PerspectiveIsomorphism.WHO));
console.log('\nWHY:', contact1.process('Tell me about my type', PerspectiveIsomorphism.WHY));

console.log('\n--- Query: "What is my Sacral center?" ---');
console.log('WHO:', contact1.process('What is my Sacral center', PerspectiveIsomorphism.WHO));
console.log('\nWHERE:', contact1.process('What is my Sacral center', PerspectiveIsomorphism.WHERE));

console.log('\n=== ALL PERSPECTIVES: "What is my design?" ===\n');
const allPerspectives = contact1.processAllPerspectives('What is my design');
for (const [perspective, response] of Object.entries(allPerspectives)) {
  console.log(`\n${perspective}:`);
  console.log(response);
}

console.log('\n=== AUTONOMOUS RESEARCH ===\n');
contact1.activateCenter('Sacral');
console.log('Research (Sacral active):', contact1.research('career opportunities'));

console.log('\n=== MCP HUB ===\n');
const hub = new MCPHub();
hub.registerContactModel(contact1);
hub.registerContactModel(contact2);

const connections = hub.findConnections('user_1');
console.log('Connection suggestions for user_1:', JSON.stringify(connections, null, 2));

const conn = hub.connect('user_1', 'user_2');
console.log('\nCreated connection:', JSON.stringify(conn, null, 2));

export {
  MESSYEngine,
  DISEMINER,
  AUTOLING,
  ContactModel,
  MCPHub,
  HDObjectFactory,
  SemanticObject,
  SemanticObjectType,
  SemanticRelation,
  RelationType,
  FeatureVector,
  GenerationContext,
  PerspectiveIsomorphism,
  PERSPECTIVE_TRANSFORMATIONS,
  WhoTransformation,
  WhatTransformation,
  WhereTransformation,
  WhenTransformation,
  WhyTransformation,
  LogicalOperator,
  AndOperator,
  OrOperator,
  FeatureCheck,
  RelationCheck,
  ResonanceProfile,
  TimingAnalysis,
  ConnectionSuggestion,
  Connection
};
