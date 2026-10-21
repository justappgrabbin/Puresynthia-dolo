
/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                    S Y N T H I A   I N T E N T   E N G I N E              ║
 * ║                         (The Adaptive Compiler of Intent)                 ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║  Not a chatbot. Not a prompt wrapper. A living semantic compiler that    ║
 * ║  learns your language, ingests your files, and turns both into           ║
 * ║  executable plans that make the system better at understanding you.      ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { createHash } from 'crypto';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

export interface IntentSignature {
  id: string;
  phrase: string;
  canonicalForm: string;
  semanticVector: number[];
  goalMapping: GoalMapping;
  confidence: number;
  usageCount: number;
  lastUsed: number;
  contexts: string[];
  outcomes: OutcomeRecord[];
}

export interface GoalMapping {
  actionType: ActionType;
  parameters: Record<string, any>;
  constraints: Constraint[];
  expectedOutputs: string[];
  priority: number;
}

export type ActionType =
  | 'MORPH'
  | 'INGEST'
  | 'MERGE'
  | 'EXPOSE'
  | 'GENERATE'
  | 'REFACTOR'
  | 'EXTEND'
  | 'DEPLOY'
  | 'ANALYZE'
  | 'HEAL'
  | 'TEACH'
  | 'CUSTOM';

export interface Constraint {
  type: 'preserve' | 'avoid' | 'require' | 'optimize';
  target: string;
  value?: any;
}

export interface OutcomeRecord {
  timestamp: number;
  success: boolean;
  planId: string;
  feedback?: string;
  deltaScore: number;
}

export interface IngestedArtifact {
  id: string;
  type: ArtifactType;
  source: string;
  content: string;
  metadata: ArtifactMetadata;
  semanticFingerprint: string;
  extractedCapabilities: Capability[];
  timestamp: number;
}

export type ArtifactType =
  | 'typescript' | 'javascript' | 'python' | 'html' | 'css'
  | 'json' | 'yaml' | 'markdown' | 'pdf' | 'image'
  | 'zip' | 'api_spec' | 'conversation' | 'config';

export interface ArtifactMetadata {
  size: number;
  linesOfCode?: number;
  dependencies?: string[];
  exports?: string[];
  classes?: string[];
  functions?: string[];
  complexity?: number;
  domain?: string;
}

export interface Capability {
  id: string;
  name: string;
  description: string;
  inputs: string[];
  outputs: string[];
  dependencies: string[];
  sourceArtifact: string;
  confidence: number;
}

export interface GoalModel {
  id: string;
  name: string;
  description: string;
  currentState: SystemState;
  desiredState: SystemState;
  gap: CapabilityGap[];
  timestamp: number;
}

export interface SystemState {
  capabilities: Capability[];
  interfaces: string[];
  dependencies: string[];
  health: number;
  coverage: number;
}

export interface CapabilityGap {
  capability: string;
  priority: number;
  blocking: boolean;
  estimatedEffort: number;
}

export interface BuildPlan {
  id: string;
  intentId: string;
  goalModelId: string;
  steps: BuildStep[];
  estimatedDuration: number;
  riskLevel: 'low' | 'medium' | 'high';
  rollbackStrategy: string;
  timestamp: number;
}

export interface BuildStep {
  id: string;
  order: number;
  action: ActionType;
  target: string;
  parameters: Record<string, any>;
  dependencies: string[];
  validation: ValidationRule[];
  estimatedDuration: number;
}

export interface ValidationRule {
  type: 'exists' | 'compiles' | 'tests_pass' | 'lints' | 'semantic_check';
  target: string;
  expectedResult: any;
}

export interface SemanticField {
  nodes: SemanticNode[];
  edges: SemanticEdge[];
  attractors: Attractor[];
  lastUpdated: number;
}

export interface SemanticNode {
  id: string;
  label: string;
  type: 'intent' | 'capability' | 'artifact' | 'concept' | 'domain';
  vector: number[];
  weight: number;
  recency: number;
}

export interface SemanticEdge {
  source: string;
  target: string;
  relation: 'triggers' | 'requires' | 'produces' | 'similar_to' | 'part_of' | 'evokes';
  weight: number;
  confidence: number;
}

export interface Attractor {
  id: string;
  center: number[];
  gravity: number;
  radius: number;
  label: string;
  type: 'intent_cluster' | 'capability_domain' | 'user_habit';
}

// ═══════════════════════════════════════════════════════════════════════════
// PERSONAL VOCABULARY ENGINE
// ═══════════════════════════════════════════════════════════════════════════

export class PersonalVocabulary {
  private signatures: Map<string, IntentSignature> = new Map();
  private phraseIndex: Map<string, string[]> = new Map();
  private embeddingDim: number = 128;

  learn(
    phrase: string,
    goalMapping: GoalMapping,
    context?: string[],
    outcome?: OutcomeRecord
  ): IntentSignature {
    const id = this.hash(phrase + Date.now());
    const canonical = this.canonicalize(phrase);
    const vector = this.embed(canonical);

    const existing = this.findSimilar(canonical, 0.85);
    if (existing.length > 0) {
      return this.strengthen(existing[0], phrase, goalMapping, outcome);
    }

    const signature: IntentSignature = {
      id,
      phrase: canonical,
      canonicalForm: canonical,
      semanticVector: vector,
      goalMapping,
      confidence: outcome ? (outcome.success ? 0.6 : 0.3) : 0.5,
      usageCount: 1,
      lastUsed: Date.now(),
      contexts: context || [],
      outcomes: outcome ? [outcome] : [],
    };

    this.signatures.set(id, signature);
    this.indexPhrase(canonical, id);

    return signature;
  }

  recognize(input: string, context?: string[]): IntentSignature | null {
    const canonical = this.canonicalize(input);
    const vector = this.embed(canonical);

    const exact = this.phraseIndex.get(canonical);
    if (exact && exact.length > 0) {
      const sig = this.signatures.get(exact[0])!;
      sig.usageCount++;
      sig.lastUsed = Date.now();
      return sig;
    }

    const similar = this.findSimilar(canonical, 0.7);
    if (similar.length > 0) {
      const best = similar[0];
      best.usageCount++;
      best.lastUsed = Date.now();
      return best;
    }

    const partial = this.findPartialMatch(canonical);
    if (partial) {
      partial.usageCount++;
      partial.lastUsed = Date.now();
      return partial;
    }

    return null;
  }

  feedback(intentId: string, success: boolean, planId: string, feedback?: string): void {
    const sig = this.signatures.get(intentId);
    if (!sig) return;

    const delta = success ? 0.1 : -0.15;
    const record: OutcomeRecord = {
      timestamp: Date.now(),
      success,
      planId,
      feedback,
      deltaScore: delta,
    };

    sig.outcomes.push(record);
    sig.confidence = Math.max(0, Math.min(1, sig.confidence + delta));
  }

  getVocabulary(): IntentSignature[] {
    return Array.from(this.signatures.values())
      .sort((a, b) => b.confidence - a.confidence);
  }

  getByActionType(type: ActionType): IntentSignature[] {
    return this.getVocabulary().filter(s => s.goalMapping.actionType === type);
  }

  private canonicalize(phrase: string): string {
    return phrase
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private embed(phrase: string): number[] {
    const vector = new Array(this.embeddingDim).fill(0);
    const words = phrase.split(' ');
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      for (let j = 0; j < word.length; j++) {
        const idx = (word.charCodeAt(j) + i * 31 + j * 17) % this.embeddingDim;
        vector[idx] += 1 / words.length;
      }
    }
    const magnitude = Math.sqrt(vector.reduce((a, b) => a + b * b, 0));
    return magnitude > 0 ? vector.map(v => v / magnitude) : vector;
  }

  private similarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }
    return dot / (Math.sqrt(magA) * Math.sqrt(magB) + 1e-10);
  }

  private findSimilar(phrase: string, threshold: number): IntentSignature[] {
    const vector = this.embed(phrase);
    const results: [IntentSignature, number][] = [];

    for (const sig of this.signatures.values()) {
      const sim = this.similarity(vector, sig.semanticVector);
      if (sim >= threshold) {
        results.push([sig, sim]);
      }
    }

    return results
      .sort((a, b) => b[1] - a[1])
      .map(r => r[0]);
  }

  private findPartialMatch(phrase: string): IntentSignature | null {
    const words = phrase.split(' ');
    let bestMatch: IntentSignature | null = null;
    let bestScore = 0;

    for (const sig of this.signatures.values()) {
      const sigWords = sig.canonicalForm.split(' ');
      let matches = 0;
      for (const w of words) {
        if (sigWords.includes(w)) matches++;
      }
      const score = matches / Math.max(words.length, sigWords.length);
      if (score > 0.5 && score > bestScore) {
        bestScore = score;
        bestMatch = sig;
      }
    }

    return bestMatch;
  }

  private strengthen(
    existing: IntentSignature,
    newPhrase: string,
    goalMapping: GoalMapping,
    outcome?: OutcomeRecord
  ): IntentSignature {
    existing.usageCount++;
    existing.lastUsed = Date.now();

    if (JSON.stringify(existing.goalMapping) !== JSON.stringify(goalMapping)) {
      if (outcome && outcome.success) {
        existing.goalMapping = goalMapping;
      }
    }

    if (outcome) {
      existing.outcomes.push(outcome);
      const delta = outcome.success ? 0.05 : -0.1;
      existing.confidence = Math.max(0, Math.min(1, existing.confidence + delta));
    }

    return existing;
  }

  private indexPhrase(phrase: string, id: string): void {
    const existing = this.phraseIndex.get(phrase) || [];
    existing.push(id);
    this.phraseIndex.set(phrase, existing);
  }

  private hash(input: string): string {
    return createHash('sha256').update(input).digest('hex').slice(0, 16);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ARTIFACT INGESTION & CAPABILITY EXTRACTION
// ═══════════════════════════════════════════════════════════════════════════

export class ArtifactIngestor {
  private artifacts: Map<string, IngestedArtifact> = new Map();
  private capabilityRegistry: Map<string, Capability> = new Map();

  ingest(source: string, content: string, type: ArtifactType): IngestedArtifact {
    const id = this.hash(source + Date.now());
    const metadata = this.extractMetadata(content, type);
    const capabilities = this.extractCapabilities(content, type, metadata);
    const fingerprint = this.semanticFingerprint(content);

    const artifact: IngestedArtifact = {
      id,
      type,
      source,
      content,
      metadata,
      semanticFingerprint: fingerprint,
      extractedCapabilities: capabilities,
      timestamp: Date.now(),
    };

    this.artifacts.set(id, artifact);

    for (const cap of capabilities) {
      this.capabilityRegistry.set(cap.id, cap);
    }

    return artifact;
  }

  findByCapability(capabilityName: string): IngestedArtifact[] {
    const results: IngestedArtifact[] = [];
    for (const artifact of this.artifacts.values()) {
      if (artifact.extractedCapabilities.some(c =>
        c.name.toLowerCase().includes(capabilityName.toLowerCase())
      )) {
        results.push(artifact);
      }
    }
    return results;
  }

  getCapabilities(): Capability[] {
    return Array.from(this.capabilityRegistry.values());
  }

  findSimilar(fingerprint: string, threshold: number = 0.9): IngestedArtifact[] {
    return Array.from(this.artifacts.values())
      .filter(a => a.semanticFingerprint === fingerprint);
  }

  private extractMetadata(content: string, type: ArtifactType): ArtifactMetadata {
    const metadata: ArtifactMetadata = { size: content.length };

    if (type === 'typescript' || type === 'javascript' || type === 'python') {
      metadata.linesOfCode = content.split('\n').length;
      metadata.functions = this.extractFunctions(content);
      metadata.classes = this.extractClasses(content);
      metadata.exports = this.extractExports(content);
      metadata.dependencies = this.extractDependencies(content, type);
      metadata.complexity = this.estimateComplexity(content);
      metadata.domain = this.inferDomain(content);
    }

    if (type === 'json' || type === 'yaml') {
      metadata.domain = 'config';
    }

    if (type === 'markdown') {
      metadata.domain = 'documentation';
    }

    return metadata;
  }

  private extractCapabilities(content: string, type: ArtifactType, meta: ArtifactMetadata): Capability[] {
    const capabilities: Capability[] = [];

    if (type === 'typescript' || type === 'javascript') {
      for (const cls of meta.classes || []) {
        capabilities.push({
          id: this.hash(cls),
          name: cls,
          description: `Class ${cls} providing structured functionality`,
          inputs: this.extractInputs(content, cls),
          outputs: this.extractOutputs(content, cls),
          dependencies: meta.dependencies || [],
          sourceArtifact: this.hash(content),
          confidence: 0.8,
        });
      }

      for (const fn of meta.functions || []) {
        capabilities.push({
          id: this.hash(fn),
          name: fn,
          description: `Function ${fn} providing operational capability`,
          inputs: this.extractFunctionInputs(content, fn),
          outputs: this.extractFunctionOutputs(content, fn),
          dependencies: meta.dependencies || [],
          sourceArtifact: this.hash(content),
          confidence: 0.7,
        });
      }
    }

    if (type === 'api_spec') {
      capabilities.push({
        id: this.hash(content),
        name: 'API Integration',
        description: 'External API connectivity capability',
        inputs: ['api_key', 'endpoint', 'payload'],
        outputs: ['response', 'data'],
        dependencies: ['http_client'],
        sourceArtifact: this.hash(content),
        confidence: 0.9,
      });
    }

    return capabilities;
  }

  private extractFunctions(content: string): string[] {
    const matches = content.match(/(?:function|const|let|var)\s+(\w+)\s*\(/g) || [];
    return matches.map(m => m.replace(/(?:function|const|let|var)\s+/, '').replace('\s*(', '').trim());
  }

  private extractClasses(content: string): string[] {
    const matches = content.match(/class\s+(\w+)/g) || [];
    return matches.map(m => m.replace('class ', '').trim());
  }

  private extractExports(content: string): string[] {
    const matches = content.match(/export\s+(?:default\s+)?(?:class|function|const|interface)\s+(\w+)/g) || [];
    return matches.map(m => m.replace(/export\s+(?:default\s+)?/, '').trim());
  }

  private extractDependencies(content: string, type: string): string[] {
    const deps: string[] = [];
    if (type === 'typescript' || type === 'javascript') {
      const imports = content.match(/from\s+['"]([^'"]+)['"]/g) || [];
      for (const imp of imports) {
        const match = imp.match(/from\s+['"]([^'"]+)['"]/);
        if (match && !match[1].startsWith('.')) {
          deps.push(match[1]);
        }
      }
    }
    if (type === 'python') {
      const imports = content.match(/(?:import|from)\s+(\w+)/g) || [];
      for (const imp of imports) {
        const match = imp.match(/(?:import|from)\s+(\w+)/);
        if (match) deps.push(match[1]);
      }
    }
    return deps;
  }

  private estimateComplexity(content: string): number {
    const branches = (content.match(/if|switch|\?\?/g) || []).length;
    const loops = (content.match(/for|while|do\s*\{/g) || []).length;
    const callbacks = (content.match(/=>|callback|then/g) || []).length;
    return Math.min(100, (branches + loops * 2 + callbacks) / 10);
  }

  private inferDomain(content: string): string {
    const lower = content.toLowerCase();
    if (lower.includes('cognitive') || lower.includes('neural') || lower.includes('intent')) return 'cognitive';
    if (lower.includes('ui') || lower.includes('component') || lower.includes('render')) return 'ui';
    if (lower.includes('deploy') || lower.includes('server') || lower.includes('docker')) return 'deployment';
    if (lower.includes('api') || lower.includes('route') || lower.includes('endpoint')) return 'api';
    if (lower.includes('data') || lower.includes('database') || lower.includes('store')) return 'data';
    return 'general';
  }

  private extractInputs(content: string, symbol: string): string[] {
    const pattern = new RegExp(`(?:class|function)\s+${symbol}\s*[^{]*{([^}]*)}`, 's');
    const match = content.match(pattern);
    if (match) {
      const params = match[1].match(/constructor\s*\(([^)]*)\)/);
      if (params) {
        return params[1].split(',').map(p => p.trim().split(':')[0]).filter(Boolean);
      }
    }
    return ['unknown'];
  }

  private extractOutputs(content: string, symbol: string): string[] {
    return [`${symbol} instance`];
  }

  private extractFunctionInputs(content: string, fn: string): string[] {
    const pattern = new RegExp(`(?:function|const)\s+${fn}\s*\(([^)]*)\)`, 'g');
    const match = pattern.exec(content);
    if (match) {
      return match[1].split(',').map(p => p.trim().split(/[:=]/)[0]).filter(Boolean);
    }
    return ['unknown'];
  }

  private extractFunctionOutputs(content: string, fn: string): string[] {
    const pattern = new RegExp(`function\s+${fn}\s*\([^)]*\)\s*(?::\s*(\w+))?`, 'g');
    const match = pattern.exec(content);
    if (match && match[1]) return [match[1]];
    return ['any'];
  }

  private semanticFingerprint(content: string): string {
    const normalized = content
      .replace(/\s+/g, ' ')
      .replace(/\/\/.*/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .trim();
    return createHash('sha256').update(normalized).digest('hex').slice(0, 16);
  }

  private hash(input: string): string {
    return createHash('sha256').update(input).digest('hex').slice(0, 16);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// GOAL MODEL BUILDER
// ═══════════════════════════════════════════════════════════════════════════

export class GoalModelBuilder {
  private models: Map<string, GoalModel> = new Map();
  private currentModelId: string | null = null;

  build(
    intent: IntentSignature,
    currentCapabilities: Capability[],
    ingestedArtifacts: IngestedArtifact[]
  ): GoalModel {
    const id = this.hash(intent.id + Date.now());

    const currentState: SystemState = {
      capabilities: currentCapabilities,
      interfaces: this.extractInterfaces(currentCapabilities),
      dependencies: this.extractDependencies(currentCapabilities),
      health: this.calculateHealth(currentCapabilities),
      coverage: this.calculateCoverage(currentCapabilities, intent.goalMapping),
    };

    const desiredState = this.projectDesiredState(intent, currentState, ingestedArtifacts);
    const gap = this.calculateGap(currentState, desiredState);

    const model: GoalModel = {
      id,
      name: `Goal from: ${intent.phrase}`,
      description: this.describeGoal(intent, gap),
      currentState,
      desiredState,
      gap,
      timestamp: Date.now(),
    };

    this.models.set(id, model);
    this.currentModelId = id;

    return model;
  }

  getCurrentModel(): GoalModel | null {
    return this.currentModelId ? this.models.get(this.currentModelId) || null : null;
  }

  getModel(id: string): GoalModel | null {
    return this.models.get(id) || null;
  }

  private projectDesiredState(
    intent: IntentSignature,
    current: SystemState,
    artifacts: IngestedArtifact[]
  ): SystemState {
    const newCapabilities = [...current.capabilities];
    const newInterfaces = [...current.interfaces];

    for (const artifact of artifacts) {
      for (const cap of artifact.extractedCapabilities) {
        if (!newCapabilities.some(c => c.name === cap.name)) {
          newCapabilities.push(cap);
        }
      }
    }

    switch (intent.goalMapping.actionType) {
      case 'MORPH':
        newInterfaces.push('unified_interface');
        break;
      case 'INGEST':
        newInterfaces.push('ingestion_api');
        break;
      case 'MERGE':
        newInterfaces.push('merged_api');
        break;
      case 'EXPOSE':
        newInterfaces.push('exposed_interface');
        break;
      case 'GENERATE':
        newInterfaces.push('generated_module');
        break;
    }

    return {
      capabilities: newCapabilities,
      interfaces: [...new Set(newInterfaces)],
      dependencies: current.dependencies,
      health: current.health,
      coverage: Math.min(1, current.coverage + 0.2),
    };
  }

  private calculateGap(current: SystemState, desired: SystemState): CapabilityGap[] {
    const gaps: CapabilityGap[] = [];

    for (const desiredCap of desired.capabilities) {
      if (!current.capabilities.some(c => c.name === desiredCap.name)) {
        gaps.push({
          capability: desiredCap.name,
          priority: desiredCap.confidence > 0.8 ? 10 : 5,
          blocking: desiredCap.confidence > 0.9,
          estimatedEffort: desiredCap.description.length / 50,
        });
      }
    }

    for (const desiredInterface of desired.interfaces) {
      if (!current.interfaces.includes(desiredInterface)) {
        gaps.push({
          capability: desiredInterface,
          priority: 7,
          blocking: false,
          estimatedEffort: 5,
        });
      }
    }

    return gaps.sort((a, b) => b.priority - a.priority);
  }

  private extractInterfaces(caps: Capability[]): string[] {
    const interfaces: string[] = [];
    for (const cap of caps) {
      if (cap.name.includes('Interface') || cap.name.includes('API')) {
        interfaces.push(cap.name);
      }
    }
    return interfaces;
  }

  private extractDependencies(caps: Capability[]): string[] {
    const deps = new Set<string>();
    for (const cap of caps) {
      for (const d of cap.dependencies) deps.add(d);
    }
    return Array.from(deps);
  }

  private calculateHealth(caps: Capability[]): number {
    if (caps.length === 0) return 0;
    const avgConfidence = caps.reduce((a, c) => a + c.confidence, 0) / caps.length;
    return avgConfidence;
  }

  private calculateCoverage(caps: Capability[], goal: GoalMapping): number {
    const needed = goal.expectedOutputs.length;
    if (needed === 0) return 1;
    const available = caps.filter(c =>
      goal.expectedOutputs.some(o => c.outputs.includes(o))
    ).length;
    return Math.min(1, available / needed);
  }

  private describeGoal(intent: IntentSignature, gap: CapabilityGap[]): string {
    const action = intent.goalMapping.actionType;
    const gaps = gap.map(g => g.capability).join(', ');
    return `${action}: ${intent.phrase}. Needs: ${gaps || 'nothing new'}`;
  }

  private hash(input: string): string {
    return createHash('sha256').update(input).digest('hex').slice(0, 16);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PLAN GENERATOR
// ═══════════════════════════════════════════════════════════════════════════

export class PlanGenerator {
  generate(intent: IntentSignature, goalModel: GoalModel): BuildPlan {
    const id = this.hash(intent.id + goalModel.id);
    const steps = this.buildSteps(intent, goalModel);

    const totalDuration = steps.reduce((a, s) => a + s.estimatedDuration, 0);
    const riskLevel = this.assessRisk(steps, goalModel);

    return {
      id,
      intentId: intent.id,
      goalModelId: goalModel.id,
      steps,
      estimatedDuration: totalDuration,
      riskLevel,
      rollbackStrategy: this.generateRollback(steps),
      timestamp: Date.now(),
    };
  }

  private buildSteps(intent: IntentSignature, goalModel: GoalModel): BuildStep[] {
    const steps: BuildStep[] = [];
    let order = 0;

    const action = intent.goalMapping.actionType;
    const gaps = goalModel.gap;

    steps.push({
      id: `step-${order}`,
      order: order++,
      action: 'ANALYZE',
      target: 'current_system',
      parameters: { depth: 'full' },
      dependencies: [],
      validation: [{ type: 'exists', target: 'system_manifest', expectedResult: true }],
      estimatedDuration: 2,
    });

    switch (action) {
      case 'MORPH':
        steps.push(...this.planMorphSteps(gaps, order));
        break;
      case 'INGEST':
        steps.push(...this.planIngestSteps(intent, order));
        break;
      case 'MERGE':
        steps.push(...this.planMergeSteps(gaps, order));
        break;
      case 'EXPOSE':
        steps.push(...this.planExposeSteps(gaps, order));
        break;
      case 'GENERATE':
        steps.push(...this.planGenerateSteps(intent, order));
        break;
      case 'REFACTOR':
        steps.push(...this.planRefactorSteps(gaps, order));
        break;
      case 'EXTEND':
        steps.push(...this.planExtendSteps(gaps, order));
        break;
      case 'DEPLOY':
        steps.push(...this.planDeploySteps(order));
        break;
      case 'HEAL':
        steps.push(...this.planHealSteps(order));
        break;
      case 'TEACH':
        steps.push(...this.planTeachSteps(intent, order));
        break;
      default:
        steps.push(...this.planCustomSteps(intent, order));
    }

    const lastStep = steps[steps.length - 1];
    steps.push({
      id: `step-${steps.length}`,
      order: steps.length,
      action: 'ANALYZE',
      target: 'build_result',
      parameters: { validate: true },
      dependencies: lastStep ? [lastStep.id] : [],
      validation: [
        { type: 'compiles', target: 'output', expectedResult: true },
        { type: 'semantic_check', target: 'intent_alignment', expectedResult: true },
      ],
      estimatedDuration: 3,
    });

    return steps;
  }

  private planMorphSteps(gaps: CapabilityGap[], startOrder: number): BuildStep[] {
    const steps: BuildStep[] = [];
    let order = startOrder;

    for (const gap of gaps) {
      steps.push({
        id: `step-${order}`,
        order: order++,
        action: 'REFACTOR',
        target: gap.capability,
        parameters: { preserve: true, reorganize: true },
        dependencies: order > startOrder ? [`step-${order - 1}`] : [],
        validation: [{ type: 'exists', target: gap.capability, expectedResult: true }],
        estimatedDuration: gap.estimatedEffort * 2,
      });
    }

    steps.push({
      id: `step-${order}`,
      order: order++,
      action: 'EXPOSE',
      target: 'unified_interface',
      parameters: { integrate: true },
      dependencies: steps.map(s => s.id),
      validation: [{ type: 'exists', target: 'unified_interface', expectedResult: true }],
      estimatedDuration: 5,
    });

    return steps;
  }

  private planIngestSteps(intent: IntentSignature, startOrder: number): BuildStep[] {
    const sources = intent.goalMapping.parameters.sources || ['unknown'];
    const steps: BuildStep[] = [];
    let order = startOrder;

    for (const source of sources) {
      steps.push({
        id: `step-${order}`,
        order: order++,
        action: 'INGEST',
        target: source,
        parameters: { classify: true, extract: true },
        dependencies: order > startOrder ? [`step-${order - 1}`] : [],
        validation: [{ type: 'exists', target: `ingested_${source}`, expectedResult: true }],
        estimatedDuration: 3,
      });
    }

    steps.push({
      id: `step-${order}`,
      order: order++,
      action: 'ANALYZE',
      target: 'ingested_capabilities',
      parameters: { deduplicate: true },
      dependencies: steps.map(s => s.id),
      validation: [{ type: 'semantic_check', target: 'no_duplicates', expectedResult: true }],
      estimatedDuration: 2,
    });

    return steps;
  }

  private planMergeSteps(gaps: CapabilityGap[], startOrder: number): BuildStep[] {
    const steps: BuildStep[] = [];
    let order = startOrder;

    steps.push({
      id: `step-${order}`,
      order: order++,
      action: 'ANALYZE',
      target: 'capability_overlap',
      parameters: { find_duplicates: true },
      dependencies: [],
      validation: [{ type: 'semantic_check', target: 'overlap_map', expectedResult: true }],
      estimatedDuration: 2,
    });

    for (const gap of gaps) {
      steps.push({
        id: `step-${order}`,
        order: order++,
        action: 'MERGE',
        target: gap.capability,
        parameters: { deduplicate: true },
        dependencies: [`step-${startOrder}`],
        validation: [{ type: 'exists', target: gap.capability, expectedResult: true }],
        estimatedDuration: gap.estimatedEffort * 1.5,
      });
    }

    return steps;
  }

  private planExposeSteps(gaps: CapabilityGap[], startOrder: number): BuildStep[] {
    const steps: BuildStep[] = [];
    let order = startOrder;

    steps.push({
      id: `step-${order}`,
      order: order++,
      action: 'ANALYZE',
      target: 'all_interfaces',
      parameters: { catalog: true },
      dependencies: [],
      validation: [{ type: 'exists', target: 'interface_catalog', expectedResult: true }],
      estimatedDuration: 2,
    });

    steps.push({
      id: `step-${order}`,
      order: order++,
      action: 'EXPOSE',
      target: 'unified_api',
      parameters: { aggregate: true },
      dependencies: [`step-${startOrder}`],
      validation: [{ type: 'exists', target: 'unified_api', expectedResult: true }],
      estimatedDuration: 5,
    });

    return steps;
  }

  private planGenerateSteps(intent: IntentSignature, startOrder: number): BuildStep[] {
    const spec = intent.goalMapping.parameters.specification || 'unknown';
    return [{
      id: `step-${startOrder}`,
      order: startOrder,
      action: 'GENERATE',
      target: spec,
      parameters: intent.goalMapping.parameters,
      dependencies: [],
      validation: [
        { type: 'compiles', target: 'generated_output', expectedResult: true },
        { type: 'semantic_check', target: 'spec_alignment', expectedResult: true },
      ],
      estimatedDuration: 10,
    }];
  }

  private planRefactorSteps(gaps: CapabilityGap[], startOrder: number): BuildStep[] {
    const steps: BuildStep[] = [];
    let order = startOrder;

    for (const gap of gaps) {
      steps.push({
        id: `step-${order}`,
        order: order++,
        action: 'REFACTOR',
        target: gap.capability,
        parameters: { preserve_behavior: true },
        dependencies: order > startOrder ? [`step-${order - 1}`] : [],
        validation: [
          { type: 'compiles', target: gap.capability, expectedResult: true },
          { type: 'tests_pass', target: gap.capability, expectedResult: true },
        ],
        estimatedDuration: gap.estimatedEffort * 2,
      });
    }

    return steps;
  }

  private planExtendSteps(gaps: CapabilityGap[], startOrder: number): BuildStep[] {
    const steps: BuildStep[] = [];
    let order = startOrder;

    for (const gap of gaps) {
      steps.push({
        id: `step-${order}`,
        order: order++,
        action: 'EXTEND',
        target: gap.capability,
        parameters: { add_capability: true },
        dependencies: order > startOrder ? [`step-${order - 1}`] : [],
        validation: [
          { type: 'compiles', target: gap.capability, expectedResult: true },
          { type: 'exists', target: gap.capability, expectedResult: true },
        ],
        estimatedDuration: gap.estimatedEffort * 3,
      });
    }

    return steps;
  }

  private planDeploySteps(startOrder: number): BuildStep[] {
    return [{
      id: `step-${startOrder}`,
      order: startOrder,
      action: 'DEPLOY',
      target: 'production',
      parameters: { target: 'netlify', verify: true },
      dependencies: [],
      validation: [
        { type: 'exists', target: 'deployment_url', expectedResult: true },
        { type: 'semantic_check', target: 'live', expectedResult: true },
      ],
      estimatedDuration: 8,
    }];
  }

  private planHealSteps(startOrder: number): BuildStep[] {
    return [
      {
        id: `step-${startOrder}`,
        order: startOrder,
        action: 'ANALYZE',
        target: 'system_health',
        parameters: { diagnose: true },
        dependencies: [],
        validation: [{ type: 'semantic_check', target: 'diagnosis', expectedResult: true }],
        estimatedDuration: 3,
      },
      {
        id: `step-${startOrder + 1}`,
        order: startOrder + 1,
        action: 'HEAL',
        target: 'broken_components',
        parameters: { auto_fix: true },
        dependencies: [`step-${startOrder}`],
        validation: [
          { type: 'compiles', target: 'fixed_output', expectedResult: true },
          { type: 'tests_pass', target: 'fixed_output', expectedResult: true },
        ],
        estimatedDuration: 10,
      },
    ];
  }

  private planTeachSteps(intent: IntentSignature, startOrder: number): BuildStep[] {
    return [{
      id: `step-${startOrder}`,
      order: startOrder,
      action: 'TEACH',
      target: 'vocabulary',
      parameters: intent.goalMapping.parameters,
      dependencies: [],
      validation: [{ type: 'semantic_check', target: 'vocabulary_updated', expectedResult: true }],
      estimatedDuration: 2,
    }];
  }

  private planCustomSteps(intent: IntentSignature, startOrder: number): BuildStep[] {
    return [{
      id: `step-${startOrder}`,
      order: startOrder,
      action: 'CUSTOM',
      target: intent.goalMapping.parameters.target || 'unknown',
      parameters: intent.goalMapping.parameters,
      dependencies: [],
      validation: [{ type: 'semantic_check', target: 'custom_complete', expectedResult: true }],
      estimatedDuration: 5,
    }];
  }

  private assessRisk(steps: BuildStep[], goalModel: GoalModel): 'low' | 'medium' | 'high' {
    const hasBlocking = goalModel.gap.some(g => g.blocking);
    const hasExternalDeps = steps.some(s =>
      s.action === 'DEPLOY' || s.action === 'INGEST'
    );
    const complexity = steps.reduce((a, s) => a + s.estimatedDuration, 0);

    if (hasBlocking && hasExternalDeps) return 'high';
    if (hasBlocking || complexity > 20) return 'medium';
    return 'low';
  }

  private generateRollback(steps: BuildStep[]): string {
    const criticalSteps = steps.filter(s =>
      s.action === 'DEPLOY' || s.action === 'MERGE' || s.action === 'REFACTOR'
    );
    if (criticalSteps.length === 0) return 'git revert last commit';
    return `git revert ${criticalSteps.map(s => s.id).join(' ')}`;
  }

  private hash(input: string): string {
    return createHash('sha256').update(input).digest('hex').slice(0, 16);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SEMANTIC FIELD ENGINE
// ═══════════════════════════════════════════════════════════════════════════

export class SemanticFieldEngine {
  private field: SemanticField = {
    nodes: [],
    edges: [],
    attractors: [],
    lastUpdated: Date.now(),
  };

  private embeddingDim: number = 128;

  addNode(label: string, type: SemanticNode['type'], vector?: number[]): SemanticNode {
    const id = this.hash(label + type + Date.now());
    const node: SemanticNode = {
      id,
      label,
      type,
      vector: vector || this.embed(label),
      weight: 1.0,
      recency: Date.now(),
    };

    this.field.nodes.push(node);
    this.field.lastUpdated = Date.now();
    return node;
  }

  connect(
    sourceId: string,
    targetId: string,
    relation: SemanticEdge['relation'],
    weight: number = 1.0
  ): void {
    const edge: SemanticEdge = {
      source: sourceId,
      target: targetId,
      relation,
      weight,
      confidence: 0.5,
    };
    this.field.edges.push(edge);
    this.field.lastUpdated = Date.now();
  }

  findNear(attractorId: string, radius: number = 0.5): SemanticNode[] {
    const attractor = this.field.attractors.find(a => a.id === attractorId);
    if (!attractor) return [];

    return this.field.nodes.filter(node => {
      const dist = this.distance(node.vector, attractor.center);
      return dist <= radius;
    });
  }

  createAttractor(
    label: string,
    type: Attractor['type'],
    nodeIds: string[]
  ): Attractor {
    const nodes = nodeIds.map(id => this.field.nodes.find(n => n.id === id)).filter(Boolean) as SemanticNode[];
    if (nodes.length === 0) {
      throw new Error('No valid nodes for attractor');
    }

    const center = this.centroid(nodes.map(n => n.vector));
    const id = this.hash(label + Date.now());

    const attractor: Attractor = {
      id,
      center,
      gravity: nodes.length * 0.1,
      radius: this.estimateRadius(center, nodes.map(n => n.vector)),
      label,
      type,
    };

    this.field.attractors.push(attractor);
    this.field.lastUpdated = Date.now();
    return attractor;
  }

  evolve(): void {
    for (const node of this.field.nodes) {
      const age = (Date.now() - node.recency) / (1000 * 60 * 60 * 24);
      node.weight *= Math.exp(-age * 0.1);
    }

    for (const edge of this.field.edges) {
      const source = this.field.nodes.find(n => n.id === edge.source);
      const target = this.field.nodes.find(n => n.id === edge.target);
      if (source && target) {
        const sim = this.similarity(source.vector, target.vector);
        edge.confidence = Math.min(1, edge.confidence + sim * 0.1);
      }
    }

    for (const attractor of this.field.attractors) {
      const nearby = this.findNear(attractor.id, attractor.radius);
      attractor.gravity = nearby.length * 0.1;
    }

    this.field.lastUpdated = Date.now();
  }

  query(label: string, depth: number = 2): { node: SemanticNode; path: string[] }[] {
    const startNode = this.field.nodes.find(n => n.label === label);
    if (!startNode) return [];

    const results: { node: SemanticNode; path: string[] }[] = [];
    const visited = new Set<string>();
    const queue: { node: SemanticNode; path: string[]; depth: number }[] =
      [{ node: startNode, path: [label], depth: 0 }];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current.node.id)) continue;
      visited.add(current.node.id);

      if (current.depth > 0) {
        results.push({ node: current.node, path: current.path });
      }

      if (current.depth < depth) {
        const neighbors = this.field.edges
          .filter(e => e.source === current.node.id || e.target === current.node.id)
          .map(e => {
            const neighborId = e.source === current.node.id ? e.target : e.source;
            return this.field.nodes.find(n => n.id === neighborId);
          })
          .filter(Boolean) as SemanticNode[];

        for (const neighbor of neighbors) {
          queue.push({
            node: neighbor,
            path: [...current.path, neighbor.label],
            depth: current.depth + 1,
          });
        }
      }
    }

    return results;
  }

  getField(): SemanticField {
    return this.field;
  }

  private embed(text: string): number[] {
    const vector = new Array(this.embeddingDim).fill(0);
    const words = text.toLowerCase().split(/\s+/);
    for (let i = 0; i < words.length; i++) {
      for (let j = 0; j < words[i].length; j++) {
        const idx = (words[i].charCodeAt(j) + i * 31) % this.embeddingDim;
        vector[idx] += 1 / words.length;
      }
    }
    const magnitude = Math.sqrt(vector.reduce((a, b) => a + b * b, 0));
    return magnitude > 0 ? vector.map(v => v / magnitude) : vector;
  }

  private distance(a: number[], b: number[]): number {
    return Math.sqrt(a.reduce((sum, val, i) => sum + (val - b[i]) ** 2, 0));
  }

  private similarity(a: number[], b: number[]): number {
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }
    return dot / (Math.sqrt(magA) * Math.sqrt(magB) + 1e-10);
  }

  private centroid(vectors: number[][]): number[] {
    const dim = vectors[0].length;
    const center = new Array(dim).fill(0);
    for (const v of vectors) {
      for (let i = 0; i < dim; i++) center[i] += v[i];
    }
    return center.map(c => c / vectors.length);
  }

  private estimateRadius(center: number[], vectors: number[][]): number {
    let maxDist = 0;
    for (const v of vectors) {
      const d = this.distance(center, v);
      if (d > maxDist) maxDist = d;
    }
    return maxDist * 1.2;
  }

  private hash(input: string): string {
    return createHash('sha256').update(input).digest('hex').slice(0, 16);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN INTENT ENGINE ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════════════════

export class IntentEngine {
  vocabulary: PersonalVocabulary;
  ingestor: ArtifactIngestor;
  goalBuilder: GoalModelBuilder;
  planGenerator: PlanGenerator;
  semanticField: SemanticFieldEngine;

  private conversationHistory: { role: 'user' | 'system'; content: string; timestamp: number }[] = [];
  private currentContext: string[] = [];

  constructor() {
    this.vocabulary = new PersonalVocabulary();
    this.ingestor = new ArtifactIngestor();
    this.goalBuilder = new GoalModelBuilder();
    this.planGenerator = new PlanGenerator();
    this.semanticField = new SemanticFieldEngine();
  }

  async process(
    input: string,
    files?: { source: string; content: string; type: ArtifactType }[]
  ): Promise<{
    recognizedIntent: IntentSignature | null;
    goalModel: GoalModel | null;
    plan: BuildPlan | null;
    response: string;
  }> {
    this.conversationHistory.push({
      role: 'user',
      content: input,
      timestamp: Date.now(),
    });

    const ingestedArtifacts: IngestedArtifact[] = [];
    if (files) {
      for (const file of files) {
        const artifact = this.ingestor.ingest(file.source, file.content, file.type);
        ingestedArtifacts.push(artifact);
        this.currentContext.push(file.type);
      }
    }

    const recognizedIntent = this.vocabulary.recognize(input, this.currentContext);

    let goalModel: GoalModel | null = null;
    let plan: BuildPlan | null = null;

    if (recognizedIntent) {
      const allCapabilities = this.ingestor.getCapabilities();
      goalModel = this.goalBuilder.build(recognizedIntent, allCapabilities, ingestedArtifacts);
      plan = this.planGenerator.generate(recognizedIntent, goalModel);
      this.updateSemanticField(recognizedIntent, goalModel, ingestedArtifacts);
    } else {
      const inferredGoal = this.inferGoalFromContext(input, ingestedArtifacts);
      if (inferredGoal) {
        const newIntent = this.vocabulary.learn(
          input,
          inferredGoal,
          this.currentContext
        );
        goalModel = this.goalBuilder.build(newIntent, this.ingestor.getCapabilities(), ingestedArtifacts);
        plan = this.planGenerator.generate(newIntent, goalModel);
      }
    }

    const response = this.generateResponse(recognizedIntent, goalModel, plan);

    this.conversationHistory.push({
      role: 'system',
      content: response,
      timestamp: Date.now(),
    });

    return { recognizedIntent, goalModel, plan, response };
  }

  feedback(planId: string, intentId: string, success: boolean, feedback?: string): void {
    this.vocabulary.feedback(intentId, success, planId, feedback);

    const intent = this.vocabulary.getVocabulary().find(i => i.id === intentId);
    if (intent) {
      const intentNode = this.semanticField.getField().nodes.find(
        n => n.label === intent.phrase && n.type === 'intent'
      );
      if (intentNode) {
        intentNode.weight += success ? 0.2 : -0.1;
      }
    }
  }

  teach(phrase: string, actionType: ActionType, parameters: Record<string, any>): IntentSignature {
    const goalMapping: GoalMapping = {
      actionType,
      parameters,
      constraints: [],
      expectedOutputs: [],
      priority: 5,
    };

    return this.vocabulary.learn(phrase, goalMapping, this.currentContext);
  }

  getSemanticField(): SemanticField {
    return this.semanticField.getField();
  }

  getVocabulary(): IntentSignature[] {
    return this.vocabulary.getVocabulary();
  }

  getHistory(): typeof this.conversationHistory {
    return this.conversationHistory;
  }

  private updateSemanticField(
    intent: IntentSignature,
    goalModel: GoalModel,
    artifacts: IngestedArtifact[]
  ): void {
    const intentNode = this.semanticField.addNode(intent.phrase, 'intent', intent.semanticVector);
    const goalNode = this.semanticField.addNode(goalModel.name, 'concept');
    this.semanticField.connect(intentNode.id, goalNode.id, 'triggers', intent.confidence);

    for (const artifact of artifacts) {
      const artNode = this.semanticField.addNode(artifact.source, 'artifact');
      this.semanticField.connect(goalNode.id, artNode.id, 'requires', 0.7);

      for (const cap of artifact.extractedCapabilities) {
        const capNode = this.semanticField.addNode(cap.name, 'capability');
        this.semanticField.connect(artNode.id, capNode.id, 'produces', cap.confidence);
      }
    }

    for (const cap of goalModel.currentState.capabilities) {
      const domainNode = this.semanticField.addNode(cap.name, 'domain');
      this.semanticField.connect(goalNode.id, domainNode.id, 'evokes', 0.5);
    }

    this.semanticField.evolve();
  }

  private inferGoalFromContext(
    input: string,
    artifacts: IngestedArtifact[]
  ): GoalMapping | null {
    const lower = input.toLowerCase();

    if (lower.includes('build') || lower.includes('create') || lower.includes('make')) {
      return {
        actionType: 'GENERATE',
        parameters: { specification: input },
        constraints: [{ type: 'preserve', target: 'existing' }],
        expectedOutputs: ['new_component'],
        priority: 7,
      };
    }

    if (lower.includes('fix') || lower.includes('repair') || lower.includes('broken')) {
      return {
        actionType: 'HEAL',
        parameters: { target: 'broken' },
        constraints: [],
        expectedOutputs: ['fixed_component'],
        priority: 10,
      };
    }

    if (lower.includes('merge') || lower.includes('combine') || lower.includes('integrate')) {
      return {
        actionType: 'MERGE',
        parameters: { sources: artifacts.map(a => a.source) },
        constraints: [{ type: 'avoid', target: 'duplication' }],
        expectedOutputs: ['merged_system'],
        priority: 6,
      };
    }

    if (artifacts.length > 0) {
      return {
        actionType: 'INGEST',
        parameters: { sources: artifacts.map(a => a.source) },
        constraints: [],
        expectedOutputs: ['classified_capabilities'],
        priority: 5,
      };
    }

    return null;
  }

  private generateResponse(
    intent: IntentSignature | null,
    goalModel: GoalModel | null,
    plan: BuildPlan | null
  ): string {
    if (!intent) {
      return `I don't recognize that intent yet. I can learn it if you tell me what you want to build. Try saying something like "make it morph" or "eat this project" — or just upload files and I'll figure it out.`;
    }

    const confidence = Math.round(intent.confidence * 100);
    const action = intent.goalMapping.actionType;
    const gaps = goalModel?.gap.length || 0;
    const steps = plan?.steps.length || 0;

    return `Recognized intent: "${intent.phrase}" -> ${action} (confidence: ${confidence}%).\n` +
           `Goal model has ${gaps} capability gaps to close.\n` +
           `Generated plan with ${steps} steps. Estimated duration: ${plan?.estimatedDuration || 0} units.\n` +
           `Risk level: ${plan?.riskLevel || 'unknown'}. Ready to execute.`;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export {
  IntentEngine,
  PersonalVocabulary,
  ArtifactIngestor,
  GoalModelBuilder,
  PlanGenerator,
  SemanticFieldEngine,
};

export default IntentEngine;
