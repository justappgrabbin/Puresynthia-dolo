
/**
 * AUTOLING Heuristic Engine
 * Pattern Recognition Compiler implementation of Klein's grammar learning
 * 
 * Heuristic 1: Bootstrap - coin tentative rules from unparsed strings
 * Heuristic 2: Substitution - group morphemes in identical environments
 * Heuristic 3: Class Assignment - add morphemes to existing classes
 * Heuristic 4: Recursive Coining - create recursive rules
 * 
 * Modernized: The "informant" is the Convergence Engine (gate state validation)
 * "CAN YOU SAY" becomes "DOES THIS CONVERGE"
 */

import { MeshAddressingSystem, MeshAddress } from './mesh-addressing-system';
import { WHInterrogativeCore, InterrogationManifest, HContainer } from './wh-interrogative-core';

export interface GrammarRule {
  id: string;
  type: 'bootstrap' | 'substitution' | 'class_assignment' | 'recursive' | 'dimensional';
  lhs: string;           // Left-hand side (non-terminal)
  rhs: string[];         // Right-hand side (production)
  dimension: number;       // Which dimension this rule belongs to
  gate_anchor: number;     // Which gate this rule is anchored to
  confidence: number;      // Rule confidence (0-1)
  tested: boolean;         // Has been validated by informant
  accepted: boolean;       // Accepted by informant
  illegal_counterparts: string[]; // Sentences that failed
  created_at: number;
}

export interface InformantResponse {
  rule_id: string;
  test_production: string;
  response: 'YES' | 'NO' | 'UNCERTAIN';
  convergence_manifest: InterrogationManifest | null;
  confidence: number;
}

export class AUTOLINGHeuristicEngine {
  private mesh: MeshAddressingSystem;
  private interrogator: WHInterrogativeCore;
  private grammar: Map<string, GrammarRule>;
  private illegalSentences: Set<string>;
  private ruleCounter: number;

  constructor(mesh: MeshAddressingSystem, interrogator: WHInterrogativeCore) {
    this.mesh = mesh;
    this.interrogator = interrogator;
    this.grammar = new Map();
    this.illegalSentences = new Set();
    this.ruleCounter = 0;
  }

  /**
   * Heuristic 1: Bootstrap
   * When input cannot be parsed by existing grammar, coin a tentative rule
   */
  bootstrapRule(input: string, dimension: number = 0): GrammarRule {
    const tokens = this.tokenize(input);
    const ruleId = `H1_${this.ruleCounter++}`;

    const rule: GrammarRule = {
      id: ruleId,
      type: 'bootstrap',
      lhs: `S_${dimension}`,
      rhs: tokens,
      dimension,
      gate_anchor: this.hashToGate(input),
      confidence: 0.5,
      tested: false,
      accepted: false,
      illegal_counterparts: [],
      created_at: Date.now()
    };

    this.grammar.set(ruleId, rule);
    return rule;
  }

  /**
   * Heuristic 2: Substitution (Class Grouping)
   * If two morphemes occur in identical environments, group them
   */
  substitutionHeuristic(morpheme1: string, morpheme2: string, context: string): GrammarRule | null {
    // Check if they occur in identical environments
    const env1 = this.getEnvironment(morpheme1, context);
    const env2 = this.getEnvironment(morpheme2, context);

    if (this.environmentsMatch(env1, env2)) {
      const ruleId = `H2_${this.ruleCounter++}`;
      const rule: GrammarRule = {
        id: ruleId,
        type: 'substitution',
        lhs: `S_${this.hashToGate(morpheme1 + morpheme2)}`,
        rhs: [morpheme1, morpheme2],
        dimension: 0,
        gate_anchor: this.hashToGate(morpheme1),
        confidence: 0.6,
        tested: false,
        accepted: false,
        illegal_counterparts: [],
        created_at: Date.now()
      };

      this.grammar.set(ruleId, rule);
      return rule;
    }

    return null;
  }

  /**
   * Heuristic 3: Class Assignment
   * If a morpheme and a class occur in identical environments, add morpheme to class
   */
  classAssignmentHeuristic(morpheme: string, classId: string, context: string): GrammarRule | null {
    const classRule = this.grammar.get(classId);
    if (!classRule) return null;

    const envM = this.getEnvironment(morpheme, context);
    const envC = this.getEnvironment(classRule.rhs[0], context);

    if (this.environmentsMatch(envM, envC)) {
      const ruleId = `H3_${this.ruleCounter++}`;
      const newRhs = [...new Set([...classRule.rhs, morpheme])];

      const rule: GrammarRule = {
        id: ruleId,
        type: 'class_assignment',
        lhs: classRule.lhs,
        rhs: newRhs,
        dimension: classRule.dimension,
        gate_anchor: classRule.gate_anchor,
        confidence: 0.7,
        tested: false,
        accepted: false,
        illegal_counterparts: [],
        created_at: Date.now()
      };

      this.grammar.set(ruleId, rule);
      return rule;
    }

    return null;
  }

  /**
   * Heuristic 4: Recursive Coining
   * Create recursive rules (S -> S + A pattern)
   */
  recursiveHeuristic(nonTerminal: string, appendage: string, dimension: number): GrammarRule {
    const ruleId = `H4_${this.ruleCounter++}`;

    const rule: GrammarRule = {
      id: ruleId,
      type: 'recursive',
      lhs: nonTerminal,
      rhs: [nonTerminal, appendage],
      dimension,
      gate_anchor: this.hashToGate(nonTerminal + appendage),
      confidence: 0.4,
      tested: false,
      accepted: false,
      illegal_counterparts: [],
      created_at: Date.now()
    };

    this.grammar.set(ruleId, rule);
    return rule;
  }

  /**
   * Dimensional Mapping Heuristic (NEW - not in original Klein)
   * Maps a production to a specific dimension in the 5-base ontology
   */
  dimensionalMappingHeuristic(production: string, dimension: number): GrammarRule {
    const ruleId = `HD_${this.ruleCounter++}`;
    const tokens = this.tokenize(production);

    const rule: GrammarRule = {
      id: ruleId,
      type: 'dimensional',
      lhs: `D_${dimension}`,
      rhs: tokens,
      dimension,
      gate_anchor: this.hashToGate(production),
      confidence: 0.8,
      tested: false,
      accepted: false,
      illegal_counterparts: [],
      created_at: Date.now()
    };

    this.grammar.set(ruleId, rule);
    return rule;
  }

  /**
   * The "Informant Query" - modernized
   * Instead of "CAN YOU SAY: [sentence]?" we ask "DOES THIS CONVERGE?"
   * The informant is the W-H Interrogative Core + Mesh Resonance
   */
  async queryInformant(rule: GrammarRule): Promise<InformantResponse> {
    const testProduction = this.generateTestSentence(rule);

    // Use the W-H interrogator as the informant
    const manifest = await this.interrogator.interrogate(testProduction);

    let response: 'YES' | 'NO' | 'UNCERTAIN';
    let confidence = 0;

    if (manifest.convergence.is_locked) {
      response = 'YES';
      confidence = manifest.convergence.confidence_score;
      rule.accepted = true;
      rule.confidence = confidence;

      // Activate the rule's gate in the mesh
      this.mesh.activate(
        this.mesh.pack({
          dimension: rule.dimension,
          gate: rule.gate_anchor,
          line: 0, color: 0, tone: 0, base: 0
        }),
        confidence
      );
    } else if (manifest.convergence.recursive_depth >= 6) {
      response = 'NO';
      confidence = 0.1;
      rule.accepted = false;
      this.illegalSentences.add(testProduction);
      rule.illegal_counterparts.push(testProduction);
    } else {
      response = 'UNCERTAIN';
      confidence = 0.3;
    }

    rule.tested = true;

    return {
      rule_id: rule.id,
      test_production: testProduction,
      response,
      convergence_manifest: manifest,
      confidence
    };
  }

  /**
   * Recycling: When a rule fails, use the failure data to rebuild
   */
  recycle(rule: GrammarRule): GrammarRule[] {
    const newRules: GrammarRule[] = [];

    for (const illegal of rule.illegal_counterparts) {
      // Re-segment the illegal sentence
      const segments = this.resegment(illegal);

      for (const segment of segments) {
        const newRule = this.bootstrapRule(segment, rule.dimension);
        newRule.gate_anchor = this.hashToGate(segment);
        newRules.push(newRule);
      }
    }

    return newRules;
  }

  /**
   * Full learning cycle: parse, coin, test, refine
   */
  async learn(input: string, dimension: number = 0): Promise<{
    rules: GrammarRule[];
    responses: InformantResponse[];
  }> {
    const rules: GrammarRule[] = [];
    const responses: InformantResponse[] = [];

    // Try to parse with existing grammar
    const parseResult = this.parse(input);

    if (!parseResult.success) {
      // Heuristic 1: Bootstrap
      const bootstrap = this.bootstrapRule(input, dimension);
      rules.push(bootstrap);

      // Query informant
      const response = await this.queryInformant(bootstrap);
      responses.push(response);

      if (response.response === 'NO') {
        // Recycle failed rule
        const recycled = this.recycle(bootstrap);
        for (const r of recycled) {
          const rResponse = await this.queryInformant(r);
          responses.push(rResponse);
          if (rResponse.response === 'YES') {
            rules.push(r);
          }
        }
      }
    } else {
      // Try Heuristic 2: Substitution
      const tokens = this.tokenize(input);
      for (let i = 0; i < tokens.length - 1; i++) {
        const sub = this.substitutionHeuristic(tokens[i], tokens[i + 1], input);
        if (sub) {
          const response = await this.queryInformant(sub);
          responses.push(response);
          if (response.response === 'YES') rules.push(sub);
        }
      }
    }

    return { rules, responses };
  }

  private tokenize(input: string): string[] {
    return input.toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .split(/\s+/)
      .filter(t => t.length > 0);
  }

  private hashToGate(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash) % 64;
  }

  private getEnvironment(morpheme: string, context: string): string {
    const tokens = this.tokenize(context);
    const idx = tokens.indexOf(morpheme.toLowerCase());
    if (idx === -1) return '';

    const left = idx > 0 ? tokens[idx - 1] : '_';
    const right = idx < tokens.length - 1 ? tokens[idx + 1] : '_';
    return `${left}_${right}`;
  }

  private environmentsMatch(env1: string, env2: string): boolean {
    return env1 === env2 && env1 !== '';
  }

  private generateTestSentence(rule: GrammarRule): string {
    return rule.rhs.join(' ');
  }

  private resegment(sentence: string): string[] {
    // Split at conjunctions and prepositions
    const splitters = /\b(and|or|but|because|when|where|who|what|how)\b/gi;
    return sentence.split(splitters).filter(s => s.trim().length > 3);
  }

  private parse(input: string): { success: boolean; matchedRules: GrammarRule[] } {
    const tokens = this.tokenize(input);
    const matched: GrammarRule[] = [];

    for (const rule of this.grammar.values()) {
      if (rule.accepted && this.matches(rule.rhs, tokens)) {
        matched.push(rule);
      }
    }

    return { success: matched.length > 0, matchedRules: matched };
  }

  private matches(ruleTokens: string[], inputTokens: string[]): boolean {
    const ruleStr = ruleTokens.join(' ');
    const inputStr = inputTokens.join(' ');
    return inputStr.includes(ruleStr) || ruleStr.includes(inputStr);
  }

  getGrammar(): GrammarRule[] {
    return Array.from(this.grammar.values());
  }

  getAcceptedRules(): GrammarRule[] {
    return Array.from(this.grammar.values()).filter(r => r.accepted);
  }

  getGrammarStats(): {
    total: number;
    accepted: number;
    rejected: number;
    untested: number;
    byType: Record<string, number>;
  } {
    const rules = this.getGrammar();
    return {
      total: rules.length,
      accepted: rules.filter(r => r.accepted).length,
      rejected: rules.filter(r => !r.accepted && r.tested).length,
      untested: rules.filter(r => !r.tested).length,
      byType: {
        bootstrap: rules.filter(r => r.type === 'bootstrap').length,
        substitution: rules.filter(r => r.type === 'substitution').length,
        class_assignment: rules.filter(r => r.type === 'class_assignment').length,
        recursive: rules.filter(r => r.type === 'recursive').length,
        dimensional: rules.filter(r => r.type === 'dimensional').length
      }
    };
  }
}

export default AUTOLINGHeuristicEngine;
