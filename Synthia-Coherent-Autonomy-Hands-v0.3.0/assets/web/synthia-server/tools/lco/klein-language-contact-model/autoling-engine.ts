
/**
 * ============================================================
 * AUTOLING — Meta-Linguistic Natural Language Processing System
 * ============================================================
 * 
 * Original (Klein 1968):
 * "A meta-linguistic natural language processing system that can be
 * configured to model a variety of theoretical linguistic models."
 * 
 * Key innovation: The system is not tied to a single linguistic theory.
 * It can be configured to use transformational grammar, case grammar,
 * stratificational grammar, or any other framework by swapping the
 * grammar module.
 * 
 * Modern: Plugin-based grammar engine with neural parsing and generation.
 */

import { GrammarRule, SemanticNetwork, SemanticNode, SemanticRelation, SemanticTriple } from './semantic-network-core';

export interface GrammarFramework {
  name: string;
  version: string;

  // Parse surface structure to deep structure
  parse(input: string, context: SemanticNetwork): ParseTree;

  // Generate surface structure from deep structure
  generate(deepStructure: SemanticTriple[], context: SemanticNetwork, style?: StyleProfile): string;

  // Learn from correction
  learn(input: string, correction: string, speaker: string): GrammarRule[];

  // Get grammar rules
  getRules(): GrammarRule[];

  // Configure grammar parameters
  configure(params: Record<string, any>): void;
}

export interface ParseTree {
  root: ParseNode;
  surfaceStructure: string;
  deepStructure: SemanticTriple[];
  confidence: number;
  ambiguity: number; // Number of alternative parses
  alternatives: ParseTree[];
}

export interface ParseNode {
  label: string; // S, NP, VP, etc.
  children: ParseNode[];
  lexicalItem?: string;
  semanticRole?: string; // Agent, Patient, Instrument, etc.

  // Klein: "Each node maps to a semantic triple"
  semanticMapping?: SemanticTriple;

  // Span in input string
  start: number;
  end: number;
}

export interface StyleProfile {
  // Klein 1965 Style Control parameters
  syntacticWeights: Map<string, number>;  // Rule frequency weights
  vocabularyBias: Map<string, number>;     // Word selection preferences
  pronounFrequency: number;
  sentenceLength: { min: number; max: number; mean: number; std: number };
  dependencyDepth: number; // How deep the parse tree goes
  coordinationPreference: number; // How often to use "and", "but", etc.
  subordinationPreference: number; // How often to use subordinate clauses
}

export class TransformationalGrammar implements GrammarFramework {
  name = 'Transformational Grammar';
  version = '1.0';

  private rules: GrammarRule[];
  private transformations: Transformation[];

  constructor() {
    this.rules = this.initializeRules();
    this.transformations = this.initializeTransformations();
  }

  parse(input: string, context: SemanticNetwork): ParseTree {
    // Step 1: Tokenize
    const tokens = input.split(/\s+/);

    // Step 2: Apply phrase structure rules (bottom-up)
    const chart = this.chartParse(tokens);

    // Step 3: Apply transformations
    const transformed = this.applyTransformations(chart);

    // Step 4: Map to semantic triples
    const deepStructure = this.mapToSemantics(transformed, context);

    return {
      root: transformed,
      surfaceStructure: input,
      deepStructure,
      confidence: 0.8,
      ambiguity: 1,
      alternatives: []
    };
  }

  generate(deepStructure: SemanticTriple[], context: SemanticNetwork, style?: StyleProfile): string {
    // Step 1: Map semantic triples to deep structure tree
    const tree = this.semanticsToTree(deepStructure, context);

    // Step 2: Apply inverse transformations
    const surfaceTree = this.applyInverseTransformations(tree, style);

    // Step 3: Linearize to string
    return this.linearize(surfaceTree, style);
  }

  learn(input: string, correction: string, speaker: string): GrammarRule[] {
    // Learn new rule from correction
    // (Simplified — would need actual learning algorithm)
    return [];
  }

  getRules(): GrammarRule[] {
    return this.rules;
  }

  configure(params: Record<string, any>): void {
    // Adjust grammar parameters
    if (params.ruleWeights) {
      for (const [ruleId, weight] of Object.entries(params.ruleWeights)) {
        const rule = this.rules.find(r => r.id === ruleId);
        if (rule) rule.weight = weight as number;
      }
    }
  }

  private initializeRules(): GrammarRule[] {
    // Classic phrase structure rules
    return [
      {
        id: 'S_NP_VP',
        lhs: 'S',
        rhs: ['NP', 'VP'],
        weight: 1.0,
        dependency: { governor: 'VP', dependent: 'NP', relation: 'subject' },
        semanticMapping: { type: 'proposition' },
        contextMarks: []
      },
      {
        id: 'NP_Det_N',
        lhs: 'NP',
        rhs: ['Det', 'N'],
        weight: 0.8,
        dependency: { governor: 'N', dependent: 'Det', relation: 'determiner' },
        semanticMapping: { type: 'reference' },
        contextMarks: []
      },
      {
        id: 'NP_N',
        lhs: 'NP',
        rhs: ['N'],
        weight: 0.6,
        dependency: { governor: 'N', dependent: '', relation: 'bare' },
        semanticMapping: { type: 'reference' },
        contextMarks: []
      },
      {
        id: 'VP_V_NP',
        lhs: 'VP',
        rhs: ['V', 'NP'],
        weight: 0.7,
        dependency: { governor: 'V', dependent: 'NP', relation: 'object' },
        semanticMapping: { type: 'action' },
        contextMarks: []
      },
      {
        id: 'VP_V',
        lhs: 'VP',
        rhs: ['V'],
        weight: 0.5,
        dependency: { governor: 'V', dependent: '', relation: 'intransitive' },
        semanticMapping: { type: 'action' },
        contextMarks: []
      },
      {
        id: 'VP_V_PP',
        lhs: 'VP',
        rhs: ['V', 'PP'],
        weight: 0.4,
        dependency: { governor: 'V', dependent: 'PP', relation: 'modifier' },
        semanticMapping: { type: 'action' },
        contextMarks: []
      },
      {
        id: 'PP_P_NP',
        lhs: 'PP',
        rhs: ['P', 'NP'],
        weight: 0.9,
        dependency: { governor: 'P', dependent: 'NP', relation: 'object' },
        semanticMapping: { type: 'location' },
        contextMarks: []
      }
    ];
  }

  private initializeTransformations(): Transformation[] {
    // Transformations: passive, question, relative clause, etc.
    return [
      {
        name: 'passive',
        apply: (tree) => {
          // Move object to subject position, add "be" + past participle
          return tree;
        },
        inverse: (tree) => {
          // Convert passive back to active
          return tree;
        }
      },
      {
        name: 'question',
        apply: (tree) => {
          // Move auxiliary to front, add question mark
          return tree;
        },
        inverse: (tree) => {
          // Convert question back to statement
          return tree;
        }
      }
    ];
  }

  private chartParse(tokens: string[]): ParseNode {
    // Chart parsing (Earley or CYK algorithm)
    // Simplified: just build a basic tree
    return {
      label: 'S',
      children: [
        {
          label: 'NP',
          children: [
            { label: 'Det', children: [], lexicalItem: tokens[0], start: 0, end: 1 },
            { label: 'N', children: [], lexicalItem: tokens[1], start: 1, end: 2 }
          ],
          start: 0,
          end: 2
        },
        {
          label: 'VP',
          children: [
            { label: 'V', children: [], lexicalItem: tokens[2], start: 2, end: 3 },
            {
              label: 'NP',
              children: [
                { label: 'Det', children: [], lexicalItem: tokens[3], start: 3, end: 4 },
                { label: 'N', children: [], lexicalItem: tokens[4], start: 4, end: 5 }
              ],
              start: 3,
              end: 5
            }
          ],
          start: 2,
          end: 5
        }
      ],
      start: 0,
      end: tokens.length
    };
  }

  private applyTransformations(tree: ParseNode): ParseNode {
    // Apply transformations in order
    for (const transform of this.transformations) {
      tree = transform.apply(tree);
    }
    return tree;
  }

  private mapToSemantics(tree: ParseNode, context: SemanticNetwork): SemanticTriple[] {
    // Map parse tree to semantic triples
    const triples: SemanticTriple[] = [];

    // Walk tree and extract semantic roles
    const walk = (node: ParseNode) => {
      if (node.semanticMapping) {
        triples.push(node.semanticMapping);
      }
      for (const child of node.children) {
        walk(child);
      }
    };

    walk(tree);
    return triples;
  }

  private semanticsToTree(triples: SemanticTriple[], context: SemanticNetwork): ParseNode {
    // Convert semantic triples back to tree
    // (Simplified — would need proper generation algorithm)
    return {
      label: 'S',
      children: [],
      start: 0,
      end: 0
    };
  }

  private applyInverseTransformations(tree: ParseNode, style?: StyleProfile): ParseNode {
    // Apply inverse transformations in reverse order
    for (const transform of [...this.transformations].reverse()) {
      tree = transform.inverse(tree);
    }
    return tree;
  }

  private linearize(tree: ParseNode, style?: StyleProfile): string {
    // Convert tree to string
    const tokens: string[] = [];

    const walk = (node: ParseNode) => {
      if (node.lexicalItem) {
        tokens.push(node.lexicalItem);
      }
      for (const child of node.children) {
        walk(child);
      }
    };

    walk(tree);
    return tokens.join(' ');
  }
}

export class CaseGrammar implements GrammarFramework {
  name = 'Case Grammar';
  version = '1.0';

  // Case grammar: focuses on semantic roles (Agent, Patient, Instrument, etc.)
  // rather than syntactic positions

  parse(input: string, context: SemanticNetwork): ParseTree {
    // Parse with case roles
    return {
      root: { label: 'S', children: [], start: 0, end: 0 },
      surfaceStructure: input,
      deepStructure: [],
      confidence: 0.7,
      ambiguity: 1,
      alternatives: []
    };
  }

  generate(deepStructure: SemanticTriple[], context: SemanticNetwork, style?: StyleProfile): string {
    // Generate from case roles
    return '';
  }

  learn(input: string, correction: string, speaker: string): GrammarRule[] {
    return [];
  }

  getRules(): GrammarRule[] {
    return [];
  }

  configure(params: Record<string, any>): void {}
}

export class StratificationalGrammar implements GrammarFramework {
  name = 'Stratificational Grammar';
  version = '1.0';

  // Stratificational: multiple levels (phonology, morphology, lexology, etc.)

  parse(input: string, context: SemanticNetwork): ParseTree {
    return {
      root: { label: 'S', children: [], start: 0, end: 0 },
      surfaceStructure: input,
      deepStructure: [],
      confidence: 0.6,
      ambiguity: 1,
      alternatives: []
    };
  }

  generate(deepStructure: SemanticTriple[], context: SemanticNetwork, style?: StyleProfile): string {
    return '';
  }

  learn(input: string, correction: string, speaker: string): GrammarRule[] {
    return [];
  }

  getRules(): GrammarRule[] {
    return [];
  }

  configure(params: Record<string, any>): void {}
}

export class AUTOLING {
  grammars: Map<string, GrammarFramework>;
  activeGrammar: string;

  constructor() {
    this.grammars = new Map();
    this.activeGrammar = 'transformational';

    // Register built-in grammars
    this.registerGrammar('transformational', new TransformationalGrammar());
    this.registerGrammar('case', new CaseGrammar());
    this.registerGrammar('stratificational', new StratificationalGrammar());
  }

  registerGrammar(name: string, grammar: GrammarFramework): void {
    this.grammars.set(name, grammar);
  }

  setActiveGrammar(name: string): void {
    if (this.grammars.has(name)) {
      this.activeGrammar = name;
    }
  }

  getGrammar(name?: string): GrammarFramework {
    return this.grammars.get(name || this.activeGrammar) || this.grammars.get('transformational')!;
  }

  parse(input: string, context: SemanticNetwork, grammarName?: string): ParseTree {
    const grammar = this.getGrammar(grammarName);
    return grammar.parse(input, context);
  }

  generate(deepStructure: SemanticTriple[], context: SemanticNetwork, style?: StyleProfile, grammarName?: string): string {
    const grammar = this.getGrammar(grammarName);
    return grammar.generate(deepStructure, context, style);
  }

  // Meta-compilation: parse in one grammar, generate in another
  translate(input: string, fromGrammar: string, toGrammar: string, context: SemanticNetwork): string {
    // Parse with source grammar
    const parseResult = this.parse(input, context, fromGrammar);

    // Generate with target grammar
    return this.generate(parseResult.deepStructure, context, undefined, toGrammar);
  }

  // Compare outputs across grammars
  compareGrammars(input: string, context: SemanticNetwork): Map<string, ParseTree> {
    const results = new Map<string, ParseTree>();

    for (const [name, grammar] of this.grammars) {
      results.set(name, grammar.parse(input, context));
    }

    return results;
  }
}

interface Transformation {
  name: string;
  apply: (tree: ParseNode) => ParseNode;
  inverse: (tree: ParseNode) => ParseNode;
}
