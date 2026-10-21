
/**
 * ============================================================
 * LANGUAGE CONTACT SIMULATOR — Historical Change & Contact Models
 * ============================================================
 * 
 * Original (Klein 1966, 1974):
 * "A system performing Monte Carlo simulations of group language change.
 * Each member represented by phrase-structure generation-recognition grammar.
 * Birth, death, rule borrowing, frequency modification."
 * 
 * Key insight: "The formal properties of natural languages make language change
 * during the transmission process a logically unavoidable consequence."
 * 
 * Modern: Multi-agent simulation with neural grammar embeddings, social network
 * dynamics, and real-time interaction visualization.
 */

import { GrammarRule, SemanticNetwork, SemanticTriple } from './semantic-network-core';
import { DISEMINER, StemEntry } from './diseminer-engine';

export interface Speaker {
  id: string;
  age: number;
  status: number;                    // Social status 0-1
  grammars: GrammarSystem[];         // May have multiple languages
  semanticNetwork: SemanticNetwork;  // Private universe

  // Klein: "Every production ever heard by the speaker"
  history: UtteranceHistory;

  // Klein: "Learning heuristics that may vary from individual to individual"
  learningHeuristics: LearningHeuristic[];

  // Social connections
  socialNetwork: Set<string>;        // IDs of speakers they interact with

  // Modern: neural embedding of grammar
  grammarEmbedding: Float32Array;
}

export interface GrammarSystem {
  language: string;
  generationRules: GrammarRule[];    // Production rules with weights
  recognitionRules: GrammarRule[];   // Parsing rules
  frequencyParameters: Map<string, number>;

  // Klein: "Phrase-structure generation-recognition grammar"
  // Each rule has probability weight (Style Control 1965)
  ruleProbabilities: Map<string, number>;
}

export interface UtteranceHistory {
  productions: Array<{
    text: string;
    timestamp: number;
    speaker: string;      // Who said it
    auditor: string;      // Who heard it
    context: string;
    semanticTriples: SemanticTriple[];
  }>;

  // Frequency counts for learning
  wordFrequencies: Map<string, number>;
  ruleFrequencies: Map<string, number>;

  // Klein: "The history of every production ever heard by the speaker"
  // This is the data for grammar learning
}

export interface LearningHeuristic {
  name: string;
  weight: number;           // How strongly this heuristic influences learning

  // Klein: "Learning heuristics that may vary from individual to individual"
  // Examples:
  // - "Prefer rules from high-status speakers"
  // - "Prefer rules that match existing grammar"
  // - "Prefer simpler rules"
  // - "Prefer rules heard more frequently"

  apply: (
    candidateRule: GrammarRule,
    speaker: Speaker,
    source: Speaker,
    context: InteractionContext
  ) => number;  // Returns probability of adopting this rule
}

export interface InteractionContext {
  setting: 'formal' | 'informal' | 'family' | 'work' | 'market';
  topic: string;
  emotionalTone: number;  // -1 to 1
  powerDynamic: number;   // Speaker relative to auditor
}

export interface SpeechCommunity {
  id: string;
  members: Speaker[];

  // Klein: "Social structure"
  socialClasses: SocialClass[];

  // Geography
  geography: Geography;

  // Prestige groups (language authorities)
  prestigeGroups: PrestigeGroup[];

  // Language contact settings
  contactSettings: ContactSetting[];
}

export interface SocialClass {
  name: string;
  size: number;             // Percentage of population
  influence: number;        // 0-1 (prestige weight)
  language: string;           // Primary language
  dialectFeatures: string[];  // Distinguishing features
}

export interface Geography {
  type: 'square' | 'linear' | 'clustered';
  barriers: string[];       // Rivers, mountains, etc.
  distances: Map<string, Map<string, number>>; // Speaker-to-speaker distance
}

export interface PrestigeGroup {
  name: string;
  members: string[];        // Speaker IDs
  grammar: GrammarSystem;   // Their "standard" grammar
  influence: number;        // How much their grammar is copied
}

export interface ContactSetting {
  name: string;
  languages: string[];
  frequency: number;        // How often this contact occurs
  dominance: Map<string, number>; // Language dominance weights
}

export interface InteractionModel {
  // Probability of speaker X talking to auditor Y
  interactionProbability(speaker: Speaker, auditor: Speaker, community: SpeechCommunity): number;

  // Rule adoption probability (Klein's core formula)
  adoptionProbability(
    rule: GrammarRule,
    speaker: Speaker,
    source: Speaker,
    context: InteractionContext
  ): number;

  // Social factors
  parentChildBonus: number;
  spouseBonus: number;
  prestigeBonus: number;
  geographicBarrier: number;

  // Klein: "The probability of adopting a rule is a function of
  // the speaker's learning heuristics, the source's status,
  // and the frequency of exposure"
}

export class DefaultInteractionModel implements InteractionModel {
  parentChildBonus = 0.8;
  spouseBonus = 0.6;
  prestigeBonus = 0.7;
  geographicBarrier = 0.3;

  interactionProbability(speaker: Speaker, auditor: Speaker, community: SpeechCommunity): number {
    // Base probability
    let prob = 0.1;

    // Social network proximity
    if (speaker.socialNetwork.has(auditor.id)) {
      prob += 0.3;
    }

    // Geographic distance
    const distance = community.geography.distances.get(speaker.id)?.get(auditor.id) || 1;
    prob *= (1 - distance * this.geographicBarrier);

    // Social class similarity
    const speakerClass = this.getSocialClass(speaker, community);
    const auditorClass = this.getSocialClass(auditor, community);
    if (speakerClass === auditorClass) {
      prob += 0.2;
    }

    // Age similarity
    const ageDiff = Math.abs(speaker.age - auditor.age);
    prob *= (1 - ageDiff / 100);

    return Math.min(prob, 1.0);
  }

  adoptionProbability(
    rule: GrammarRule,
    speaker: Speaker,
    source: Speaker,
    context: InteractionContext
  ): number {
    // Base probability
    let prob = 0.05;

    // Apply learning heuristics
    for (const heuristic of speaker.learningHeuristics) {
      prob += heuristic.apply(rule, speaker, source, context) * heuristic.weight;
    }

    // Source prestige
    if (source.status > speaker.status) {
      prob += this.prestigeBonus * (source.status - speaker.status);
    }

    // Frequency of exposure (Klein: "frequency modification")
    const exposureCount = speaker.history.ruleFrequencies.get(rule.id) || 0;
    prob += Math.min(exposureCount / 100, 0.3); // Cap at 0.3

    // Context formality
    if (context.setting === 'formal') {
      prob *= 1.2; // More likely to adopt formal rules
    }

    // Age factor (younger speakers learn more easily)
    if (speaker.age < 20) {
      prob *= 1.5;
    } else if (speaker.age > 60) {
      prob *= 0.5;
    }

    return Math.min(prob, 1.0);
  }

  private getSocialClass(speaker: Speaker, community: SpeechCommunity): string {
    // Find which class this speaker belongs to
    // (Simplified — would use actual class assignment)
    return 'working'; // Default
  }
}

export class LanguageContactSimulator {
  communities: SpeechCommunity[];
  interactionModel: InteractionModel;
  diseminer: DISEMINER;

  // Simulation parameters
  birthRate: number;
  deathRate: number;
  maxAge: number;

  // Tracking
  history: SimulationSnapshot[];

  constructor(config: SimulatorConfig) {
    this.communities = config.communities;
    this.interactionModel = config.interactionModel || new DefaultInteractionModel();
    this.diseminer = config.diseminer;
    this.birthRate = config.birthRate || 0.02;
    this.deathRate = config.deathRate || 0.015;
    this.maxAge = config.maxAge || 80;
    this.history = [];
  }

  /**
   * Run Monte Carlo simulation
   * Klein: "The system performs Monte Carlo simulations of group language change"
   */
  run(years: number): SimulationResult {
    for (let year = 0; year < years; year++) {
      // 1. Population dynamics (birth/death)
      this.updatePopulation(year);

      // 2. Social interactions (conversation)
      this.runInteractions(year);

      // 3. Grammar learning (rule adoption)
      this.updateGrammars(year);

      // 4. Record snapshot
      if (year % 5 === 0) {
        this.history.push(this.snapshot(year));
      }
    }

    return {
      finalState: this.snapshot(years),
      history: this.history,
      dialects: this.identifyDialects(),
      changeTrajectory: this.computeTrajectory(),
      intelligibilityMatrix: this.computeIntelligibility(),
      diversity: this.computeDiversity()
    };
  }

  private updatePopulation(year: number): void {
    for (const community of this.communities) {
      // Births
      const expectedBirths = community.members.length * this.birthRate;
      const births = Math.floor(expectedBirths + (Math.random() < (expectedBirths % 1) ? 1 : 0));

      for (let i = 0; i < births; i++) {
        const newSpeaker = this.createSpeaker(0, community);
        community.members.push(newSpeaker);
      }

      // Deaths
      const survivors = community.members.filter(s => {
        const deathProb = this.deathRate * (s.age / this.maxAge) ** 2;
        s.age++;
        return Math.random() > deathProb;
      });

      community.members = survivors;
    }
  }

  private runInteractions(year: number): void {
    for (const community of this.communities) {
      // Pairwise interactions
      for (const speaker of community.members) {
        for (const auditor of community.members) {
          if (speaker.id === auditor.id) continue;

          const prob = this.interactionModel.interactionProbability(speaker, auditor, community);

          if (Math.random() < prob) {
            // They interact!
            this.converse(speaker, auditor, community);
          }
        }
      }
    }
  }

  private converse(speaker: Speaker, auditor: Speaker, community: SpeechCommunity): void {
    // Select a grammar (language) to use
    const grammar = this.selectGrammar(speaker, auditor);

    // Generate utterance
    const utterance = this.generateUtterance(speaker, grammar);

    // Record in both histories
    const interaction: UtteranceHistory['productions'][0] = {
      text: utterance,
      timestamp: Date.now(),
      speaker: speaker.id,
      auditor: auditor.id,
      context: 'conversation',
      semanticTriples: [] // Would be filled by semantic parser
    };

    speaker.history.productions.push(interaction);
    auditor.history.productions.push(interaction);

    // Update frequencies
    for (const word of utterance.split(' ')) {
      auditor.history.wordFrequencies.set(
        word,
        (auditor.history.wordFrequencies.get(word) || 0) + 1
      );
    }

    // Grammar learning opportunity
    this.attemptLearning(auditor, speaker, grammar, interaction);
  }

  private selectGrammar(speaker: Speaker, auditor: Speaker): GrammarSystem {
    // If speaker has multiple languages, choose based on context
    if (speaker.grammars.length === 1) return speaker.grammars[0];

    // Prefer shared language
    const shared = speaker.grammars.filter(g => 
      auditor.grammars.some(ag => ag.language === g.language)
    );

    if (shared.length > 0) {
      return shared[Math.floor(Math.random() * shared.length)];
    }

    // Default to first grammar
    return speaker.grammars[0];
  }

  private generateUtterance(speaker: Speaker, grammar: GrammarSystem): string {
    // Use weighted probabilistic grammar (Klein 1965 Style Control)
    const rules = grammar.generationRules;

    // Start with S (sentence)
    let current = 'S';
    const tokens: string[] = [];

    // Expand using production rules
    const expand = (symbol: string): string[] => {
      const applicable = rules.filter(r => r.lhs === symbol);
      if (applicable.length === 0) return [symbol];

      // Weighted selection
      const totalWeight = applicable.reduce((sum, r) => sum + (grammar.ruleProbabilities.get(r.id) || r.weight), 0);
      let rand = Math.random() * totalWeight;

      for (const rule of applicable) {
        const weight = grammar.ruleProbabilities.get(rule.id) || rule.weight;
        rand -= weight;
        if (rand <= 0) {
          return rule.rhs.flatMap(expand);
        }
      }

      return applicable[0].rhs.flatMap(expand);
    };

    return expand(current).join(' ');
  }

  private attemptLearning(
    auditor: Speaker,
    speaker: Speaker,
    grammar: GrammarSystem,
    context: InteractionContext
  ): void {
    // Try to learn each rule from speaker's grammar
    for (const rule of grammar.generationRules) {
      const prob = this.interactionModel.adoptionProbability(rule, auditor, speaker, context);

      if (Math.random() < prob) {
        // Adopt rule!
        const auditorGrammar = auditor.grammars.find(g => g.language === grammar.language);
        if (auditorGrammar) {
          // Check if rule already exists
          const exists = auditorGrammar.generationRules.some(r => r.lhs === rule.lhs && r.rhs.join('') === rule.rhs.join(''));

          if (!exists) {
            // Add new rule
            auditorGrammar.generationRules.push({
              ...rule,
              id: `${rule.id}_learned_${auditor.id}_${Date.now()}`,
              weight: 0.1 // Start with low weight
            });
          } else {
            // Increase frequency of existing rule
            const existing = auditorGrammar.generationRules.find(r => r.lhs === rule.lhs && r.rhs.join('') === rule.rhs.join(''));
            if (existing) {
              auditorGrammar.ruleProbabilities.set(existing.id, 
                (auditorGrammar.ruleProbabilities.get(existing.id) || existing.weight) + 0.01
              );
            }
          }
        }
      }
    }
  }

  private updateGrammars(year: number): void {
    // Apply frequency modifications (Klein: "frequency modification")
    for (const community of this.communities) {
      for (const speaker of community.members) {
        for (const grammar of speaker.grammars) {
          // Decay unused rules
          for (const [ruleId, freq] of grammar.ruleProbabilities) {
            const newFreq = freq * 0.999; // Slow decay
            grammar.ruleProbabilities.set(ruleId, newFreq);
          }

          // Normalize probabilities
          const total = Array.from(grammar.ruleProbabilities.values()).reduce((a, b) => a + b, 0);
          for (const [ruleId, freq] of grammar.ruleProbabilities) {
            grammar.ruleProbabilities.set(ruleId, freq / total);
          }
        }
      }
    }
  }

  private snapshot(year: number): SimulationSnapshot {
    return {
      year,
      population: this.communities.reduce((sum, c) => sum + c.members.length, 0),
      grammars: this.communities.flatMap(c => c.members.map(m => ({
        speaker: m.id,
        language: m.grammars[0].language,
        ruleCount: m.grammars[0].generationRules.length,
        averageRuleWeight: this.computeAverageWeight(m.grammars[0])
      }))),
      dialectFeatures: this.extractDialectFeatures()
    };
  }

  private computeAverageWeight(grammar: GrammarSystem): number {
    const weights = Array.from(grammar.ruleProbabilities.values());
    return weights.reduce((a, b) => a + b, 0) / weights.length;
  }

  private identifyDialects(): Dialect[] {
    // Cluster speakers by grammar similarity
    const allSpeakers = this.communities.flatMap(c => c.members);
    const dialects: Dialect[] = [];

    // Simple clustering: group by language + similar grammar features
    const byLanguage = new Map<string, Speaker[]>();
    for (const speaker of allSpeakers) {
      const lang = speaker.grammars[0].language;
      if (!byLanguage.has(lang)) byLanguage.set(lang, []);
      byLanguage.get(lang)!.push(speaker);
    }

    for (const [language, speakers] of byLanguage) {
      // Compute pairwise grammar distances
      const distances = this.computeDistanceMatrix(speakers);

      // Cluster (simplified — would use proper clustering algorithm)
      dialects.push({
        language,
        speakers: speakers.map(s => s.id),
        features: this.extractCommonFeatures(speakers),
        center: this.computeDialectCenter(speakers)
      });
    }

    return dialects;
  }

  private computeDistanceMatrix(speakers: Speaker[]): number[][] {
    const n = speakers.length;
    const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        matrix[i][j] = this.computeDialectDistance(speakers[i], speakers[j]);
      }
    }

    return matrix;
  }

  private computeDialectDistance(speakerA: Speaker, speakerB: Speaker): number {
    // Klein: "The distance between two dialects is the number of rules
    // that differ between their grammars"

    const grammarA = speakerA.grammars[0];
    const grammarB = speakerB.grammars[0];

    if (grammarA.language !== grammarB.language) return 1.0; // Different languages

    // Count differing rules
    const rulesA = new Set(grammarA.generationRules.map(r => `${r.lhs}→${r.rhs.join('')}`));
    const rulesB = new Set(grammarB.generationRules.map(r => `${r.lhs}→${r.rhs.join('')}`));

    const union = new Set([...rulesA, ...rulesB]);
    const intersection = new Set([...rulesA].filter(x => rulesB.has(x)));

    return 1 - (intersection.size / union.size);
  }

  private computeTrajectory(): ChangeTrajectory {
    // Analyze how grammars changed over time
    const trajectories: ChangeTrajectory = {
      ruleBirths: [],
      ruleDeaths: [],
      frequencyShifts: [],
      overallDirection: 'stable'
    };

    for (let i = 1; i < this.history.length; i++) {
      const prev = this.history[i - 1];
      const curr = this.history[i];

      // Compare grammars
      for (const grammar of curr.grammars) {
        const prevGrammar = prev.grammars.find(g => g.speaker === grammar.speaker);
        if (prevGrammar) {
          if (grammar.ruleCount > prevGrammar.ruleCount) {
            trajectories.ruleBirths.push({ year: curr.year, speaker: grammar.speaker });
          }
          if (grammar.ruleCount < prevGrammar.ruleCount) {
            trajectories.ruleDeaths.push({ year: curr.year, speaker: grammar.speaker });
          }
        }
      }
    }

    return trajectories;
  }

  private computeIntelligibility(): IntelligibilityMatrix {
    // Klein: "Mutual intelligibility between dialects"
    const allSpeakers = this.communities.flatMap(c => c.members);
    const matrix: IntelligibilityMatrix = {};

    for (const speakerA of allSpeakers) {
      matrix[speakerA.id] = {};
      for (const speakerB of allSpeakers) {
        const distance = this.computeDialectDistance(speakerA, speakerB);
        // Intelligibility decreases with distance
        matrix[speakerA.id][speakerB.id] = Math.max(0, 1 - distance * 2);
      }
    }

    return matrix;
  }

  private computeDiversity(): number {
    // Klein: "Every grammar of every living speaker would be different"
    // Measure diversity as average pairwise distance
    const allSpeakers = this.communities.flatMap(c => c.members);
    let totalDistance = 0;
    let count = 0;

    for (let i = 0; i < allSpeakers.length; i++) {
      for (let j = i + 1; j < allSpeakers.length; j++) {
        totalDistance += this.computeDialectDistance(allSpeakers[i], allSpeakers[j]);
        count++;
      }
    }

    return count > 0 ? totalDistance / count : 0;
  }

  private createSpeaker(age: number, community: SpeechCommunity): Speaker {
    // Inherit from parents (simplified)
    const grammar = community.prestigeGroups[0]?.grammar || this.createDefaultGrammar();

    return {
      id: `speaker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      age,
      status: Math.random(),
      grammars: [JSON.parse(JSON.stringify(grammar))], // Deep copy
      semanticNetwork: new SemanticNetwork(),
      history: {
        productions: [],
        wordFrequencies: new Map(),
        ruleFrequencies: new Map()
      },
      learningHeuristics: this.createDefaultHeuristics(),
      socialNetwork: new Set(),
      grammarEmbedding: new Float32Array(128)
    };
  }

  private createDefaultGrammar(): GrammarSystem {
    return {
      language: 'english',
      generationRules: [
        { id: 'S_NP_VP', lhs: 'S', rhs: ['NP', 'VP'], weight: 1, dependency: { governor: 'VP', dependent: 'NP', relation: 'subject' }, semanticMapping: { type: 'proposition' }, contextMarks: [] },
        { id: 'NP_Det_N', lhs: 'NP', rhs: ['Det', 'N'], weight: 0.8, dependency: { governor: 'N', dependent: 'Det', relation: 'determiner' }, semanticMapping: { type: 'reference' }, contextMarks: [] },
        { id: 'VP_V_NP', lhs: 'VP', rhs: ['V', 'NP'], weight: 0.7, dependency: { governor: 'V', dependent: 'NP', relation: 'object' }, semanticMapping: { type: 'action' }, contextMarks: [] }
      ],
      recognitionRules: [],
      frequencyParameters: new Map(),
      ruleProbabilities: new Map([
        ['S_NP_VP', 1.0],
        ['NP_Det_N', 0.8],
        ['VP_V_NP', 0.7]
      ])
    };
  }

  private createDefaultHeuristics(): LearningHeuristic[] {
    return [
      {
        name: 'prestige_preference',
        weight: 0.3,
        apply: (rule, speaker, source) => source.status > speaker.status ? 0.2 : 0
      },
      {
        name: 'frequency_preference',
        weight: 0.4,
        apply: (rule, speaker) => {
          const freq = speaker.history.ruleFrequencies.get(rule.id) || 0;
          return Math.min(freq / 50, 0.3);
        }
      },
      {
        name: 'simplicity_preference',
        weight: 0.2,
        apply: (rule) => rule.rhs.length <= 2 ? 0.1 : 0
      },
      {
        name: 'consistency_preference',
        weight: 0.1,
        apply: (rule, speaker) => {
          // Prefer rules that match existing grammar
          const similar = speaker.grammars[0].generationRules.some(r => r.lhs === rule.lhs);
          return similar ? 0.1 : 0;
        }
      }
    ];
  }

  private extractDialectFeatures(): string[] {
    // Extract features that distinguish dialects
    return ['feature_extraction_not_implemented'];
  }

  private extractCommonFeatures(speakers: Speaker[]): string[] {
    return ['common_feature_extraction_not_implemented'];
  }

  private computeDialectCenter(speakers: Speaker[]): any {
    return null;
  }
}

export interface SimulatorConfig {
  communities: SpeechCommunity[];
  interactionModel?: InteractionModel;
  diseminer: DISEMINER;
  birthRate?: number;
  deathRate?: number;
  maxAge?: number;
}

export interface SimulationResult {
  finalState: SimulationSnapshot;
  history: SimulationSnapshot[];
  dialects: Dialect[];
  changeTrajectory: ChangeTrajectory;
  intelligibilityMatrix: IntelligibilityMatrix;
  diversity: number;
}

export interface SimulationSnapshot {
  year: number;
  population: number;
  grammars: Array<{
    speaker: string;
    language: string;
    ruleCount: number;
    averageRuleWeight: number;
  }>;
  dialectFeatures: string[];
}

export interface Dialect {
  language: string;
  speakers: string[];
  features: string[];
  center: any;
}

export interface ChangeTrajectory {
  ruleBirths: Array<{ year: number; speaker: string }>;
  ruleDeaths: Array<{ year: number; speaker: string }>;
  frequencyShifts: Array<{ year: number; rule: string; oldFreq: number; newFreq: number }>;
  overallDirection: 'stable' | 'changing' | 'diverging' | 'converging';
}

export interface IntelligibilityMatrix {
  [speakerA: string]: {
    [speakerB: string]: number;
  };
}
