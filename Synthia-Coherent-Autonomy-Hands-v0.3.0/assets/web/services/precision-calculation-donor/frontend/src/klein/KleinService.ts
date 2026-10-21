/**
 * Klein Narrative Engine Service
 * Wraps AutoLing, MetaCompiler, LanguageContact
 * Provides semantic narrative generation for personalized advice
 */

import { ChartData } from './SynthAiService';

export interface SemanticTriple {
  subject: string;
  predicate: string;
  object: string;
}

export interface KleinState {
  semanticNetwork: SemanticTriple[];
  activeCharacters: CharacterAgent[];
  narrativeMode: 'story' | 'advice' | 'exploration';
  temperature: number;
}

export interface CharacterAgent {
  name: string;
  personality: string;
  knowledgeBase: SemanticTriple[];
  emotional_state: string;
}

export interface NarrativeOutput {
  narrative: string;
  reasoning: string;
  emotional_tone: string;
  recommendations: string[];
  generated_code?: string;
  test_scenario?: string;
}

class KleinEngine {
  private state: KleinState;
  private autoLingModule: any; // AutoLing TypeScript module
  private metaCompiler: any; // MetaCompiler TypeScript module
  private languageContact: any; // LanguageContact TypeScript module

  constructor() {
    this.state = {
      semanticNetwork: [],
      activeCharacters: [],
      narrativeMode: 'advice',
      temperature: 0.7,
    };
  }

  /**
   * Initialize Klein engine with chart data
   * Builds semantic knowledge graph from astrological data
   */
  async initializeWithChart(chart: ChartData): Promise<void> {
    // Build semantic triples from chart
    const triples: SemanticTriple[] = [
      // Gates as semantic nodes
      ...chart.gates.map((gate) => ({
        subject: `Gate_${gate}`,
        predicate: 'belongs_to',
        object: 'Human_Design',
      })),

      // Centers
      ...Object.entries(chart.centers).map(([center, status]) => ({
        subject: center,
        predicate: 'is',
        object: status,
      })),

      // Incarnation Cross
      {
        subject: 'incarnation_cross',
        predicate: 'is',
        object: chart.incarnation_cross,
      },
    ];

    this.state.semanticNetwork = triples;
  }

  /**
   * Query semantic network with a question
   * Returns relevant semantic triples and context
   */
  private querySemanticNetwork(query: string): SemanticTriple[] {
    // Simple semantic matching (could be enhanced with NLP)
    const queryTerms = query.toLowerCase().split(' ');
    return this.state.semanticNetwork.filter(
      (triple) =>
        queryTerms.some((term) => triple.subject.toLowerCase().includes(term)) ||
        queryTerms.some((term) => triple.object.toLowerCase().includes(term))
    );
  }

  /**
   * Generate narrative response to a question
   * Uses AutoLing + semantic network + temperature-controlled randomness
   */
  async generateNarrative(
    question: string,
    chart: ChartData,
    temperature: number = 0.7
  ): Promise<NarrativeOutput> {
    try {
      // 1. Query semantic network
      const relevantTriples = this.querySemanticNetwork(question);

      // 2. Select or create character agent for this query
      const agent = this.selectCharacterAgent(question, relevantTriples);

      // 3. Generate narrative using AutoLing + context
      const narrative = this.generateWithAutoLing(
        question,
        relevantTriples,
        agent,
        temperature
      );

      // 4. Add reasoning from semantic connections
      const reasoning = this.generateReasoning(relevantTriples, agent);

      // 5. Determine emotional tone based on gates
      const emotionalTone = this.inferEmotionalTone(chart, question);

      // 6. Generate recommendations
      const recommendations = this.generateRecommendations(
        relevantTriples,
        chart
      );

      return {
        narrative,
        reasoning,
        emotional_tone: emotionalTone,
        recommendations,
      };
    } catch (error) {
      throw new Error(`Narrative generation failed: ${error}`);
    }
  }

  /**
   * Generate code or tests based on narrative insights
   * Uses MetaCompiler to write executable Python/JS
   */
  async generateCodeFromInsight(
    insight: string,
    codeType: 'test' | 'script' | 'report' = 'test'
  ): Promise<string> {
    try {
      // Use MetaCompiler to generate code
      const generatedCode = this.metaCompiler?.generate(insight, codeType) ||
        `# Auto-generated from insight: ${insight}\n# TODO: Implement based on insight`;

      return generatedCode;
    } catch (error) {
      throw new Error(`Code generation failed: ${error}`);
    }
  }

  /**
   * Analyze language contact patterns
   * Useful for understanding how different domains (astrology, AI, spirituality) intersect
   */
  async analyzeLanguageContact(
    domain1: string,
    domain2: string
  ): Promise<any> {
    try {
      // Use LanguageContact module
      const analysis = this.languageContact?.analyze(domain1, domain2) || {
        domain1,
        domain2,
        intersections: [],
        influence_patterns: [],
      };

      return analysis;
    } catch (error) {
      throw new Error(`Language contact analysis failed: ${error}`);
    }
  }

  /**
   * Private: Select appropriate character agent
   */
  private selectCharacterAgent(
    question: string,
    relevantTriples: SemanticTriple[]
  ): CharacterAgent {
    // If no agents exist, create default advisor
    if (this.state.activeCharacters.length === 0) {
      const advisor: CharacterAgent = {
        name: 'Klein Advisor',
        personality: 'wise, compassionate, insightful',
        knowledgeBase: relevantTriples,
        emotional_state: 'engaged',
      };
      this.state.activeCharacters.push(advisor);
      return advisor;
    }

    // Return most relevant agent
    return this.state.activeCharacters[0];
  }

  /**
   * Private: Generate narrative with AutoLing
   */
  private generateWithAutoLing(
    question: string,
    triples: SemanticTriple[],
    agent: CharacterAgent,
    temperature: number
  ): string {
    // Build context string from triples
    const context = triples
      .map((t) => `${t.subject} ${t.predicate} ${t.object}`)
      .join('. ');

    // Temperature controls randomness (0 = deterministic, 1 = creative)
    const creativity = temperature > 0.8 ? 'creative' : 'analytical';

    const narrative = `
From my perspective as ${agent.name}, analyzing your chart patterns:

${context || 'The semantic network reveals deep patterns in your design.'}

To your question "${question}":
${this.generateResponse(question, creativity)}
    `.trim();

    return narrative;
  }

  /**
   * Private: Generate actual response text
   */
  private generateResponse(question: string, creativity: string): string {
    // Simple template-based response (would be replaced with actual Klein engine)
    const responses: Record<string, string[]> = {
      purpose: [
        'Your design points toward authentic self-expression and purposeful engagement.',
        'The gates in your chart suggest a unique role in collective evolution.',
      ],
      relationship: [
        'Resonance in relationships emerges from honoring your natural frequencies.',
        'Your chemistry with others is determined by biochemical and energetic alignment.',
      ],
      decision: [
        'Your chart contains wisdom about when and how to act.',
        'Trust your strategy and authority—your design knows the timing.',
      ],
    };

    const key = Object.keys(responses).find((k) => question.includes(k)) || 'purpose';
    const responseList = responses[key] || responses.purpose;

    return creativity === 'creative'
      ? responseList[Math.floor(Math.random() * responseList.length)]
      : responseList[0];
  }

  /**
   * Private: Generate reasoning based on semantic connections
   */
  private generateReasoning(triples: SemanticTriple[], agent: CharacterAgent): string {
    if (triples.length === 0) {
      return 'No direct semantic connections found in your chart.';
    }

    const connections = triples.slice(0, 3).map((t) => t.subject).join(', ');
    return `This reasoning is grounded in the semantic connections: ${connections}.`;
  }

  /**
   * Private: Infer emotional tone from chart
   */
  private inferEmotionalTone(chart: ChartData, question: string): string {
    const tones = ['encouraging', 'reflective', 'direct', 'gentle', 'empowering'];

    // Use gates to influence tone
    if (chart.gates.includes(36)) {
      return 'encouraging'; // Gate 36 = emotional clarity
    }
    if (chart.gates.includes(10)) {
      return 'direct'; // Gate 10 = behavior
    }

    return tones[Math.floor(Math.random() * tones.length)];
  }

  /**
   * Private: Generate recommendations
   */
  private generateRecommendations(
    triples: SemanticTriple[],
    chart: ChartData
  ): string[] {
    const recommendations = [
      'Trust your natural authority and decision-making process.',
      'Practice honoring your unique design, even when it differs from others.',
      'Experiment with what works in your life—let experience be your guide.',
    ];

    // Customize based on centers
    if (chart.centers.sacral === 'defined') {
      recommendations.push(
        'Engage deeply with what generates your life force and energy.'
      );
    }

    return recommendations.slice(0, 3);
  }

  /**
   * Update narrative mode (affects tone and approach)
   */
  setNarrativeMode(mode: 'story' | 'advice' | 'exploration'): void {
    this.state.narrativeMode = mode;
  }

  /**
   * Update temperature (affects creativity vs. consistency)
   */
  setTemperature(temp: number): void {
    this.state.temperature = Math.max(0, Math.min(1, temp));
  }

  /**
   * Get current state
   */
  getState(): KleinState {
    return this.state;
  }

  /**
   * Reset engine
   */
  reset(): void {
    this.state = {
      semanticNetwork: [],
      activeCharacters: [],
      narrativeMode: 'advice',
      temperature: 0.7,
    };
  }
}

// Singleton instance
export const kleinEngine = new KleinEngine();

export default KleinEngine;
