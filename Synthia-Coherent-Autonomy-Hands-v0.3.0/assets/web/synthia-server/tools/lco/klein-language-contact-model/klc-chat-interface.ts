
/**
 * ============================================================
 * KLC CHAT & RESEARCH INTERFACE — Modern LLM Hybrid
 * ============================================================
 * 
 * This is the user-facing interface that combines:
 * 1. Natural language chat (like ChatGPT/Claude)
 * 2. Deep research with DISEMINER inference chains
 * 3. Meta-compiling (natural language → behavioral rules)
 * 4. Language contact simulation
 * 5. Analogical reasoning
 * 6. Style-controlled generation
 * 7. LLM API fallback for naturalness
 * 
 * All built on Klein's semantic network substrate, not just
 * statistical token prediction.
 */

import { 
  KleinLanguageContactModel, 
  SemanticIntent, 
  GenerateOptions,
  CommunitySetup,
  ResearchQuery,
  ResearchResult,
  AnalogicalResult,
  SemanticTriple
} from './klein-language-contact-model-main';

import { SemanticNetwork, SemanticNode, SemanticRelation } from './semantic-network-core';
import { DISEMINER, SemanticQuery as DISeminerQuery, InferenceResult } from './diseminer-engine';
import { MESSY, SimulationRule, RuleGroup, SimulationState } from './messy-simulator';
import { AUTOLING, GrammarFramework, StyleProfile, ParseTree } from './autoling-engine';
import { NovelWriter, StoryConfig, PlotOutline } from './novel-writer';

// ============================================================
// CHAT INTERFACE
// ============================================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'system' | 'assistant' | 'tool';
  content: string;
  timestamp: number;
  metadata?: {
    intent?: SemanticIntent;
    parseTree?: ParseTree;
    semanticTriples?: SemanticTriple[];
    inferenceChain?: InferenceResult[];
    simulationTrace?: SimulationState[];
    confidence?: number;
    source?: string;
  };
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  context: ChatContext;
  createdAt: number;
  updatedAt: number;
}

export interface ChatContext {
  // Persistent semantic network for this conversation
  network: SemanticNetwork;

  // Active rules (meta-compiled from conversation)
  rules: SimulationRule[];

  // User's style profile (learned from conversation)
  userStyle: StyleProfile;

  // Conversation topics
  topics: string[];

  // Current research depth
  researchDepth: 'surface' | 'deep' | 'exhaustive';
}

export class KLCChatInterface {
  klc: KleinLanguageContactModel;
  sessions: Map<string, ChatSession>;
  llmClient?: LLMClient;

  constructor(klc: KleinLanguageContactModel, llmConfig?: LLMConfig) {
    this.klc = klc;
    this.sessions = new Map();

    if (llmConfig) {
      this.llmClient = new LLMClient(llmConfig);
    }
  }

  /**
   * Start a new chat session
   */
  createSession(): ChatSession {
    const session: ChatSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      messages: [],
      context: {
        network: new SemanticNetwork(),
        rules: [],
        userStyle: this.createDefaultStyle(),
        topics: [],
        researchDepth: 'surface'
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.sessions.set(session.id, session);
    return session;
  }

  /**
   * Main chat method — the entry point for all user interaction
   */
  async chat(sessionId: string, userMessage: string): Promise<ChatMessage> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    // 1. Add user message to session
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: Date.now()
    };
    session.messages.push(userMsg);

    // 2. Parse user intent using AUTOLING
    const parseResult = this.klc.autoling.parse(userMessage, session.context.network);

    // 3. Determine intent type
    const intentType = this.classifyIntent(userMessage, parseResult);

    // 4. Route to appropriate handler
    let response: ChatMessage;

    switch (intentType) {
      case 'research':
        response = await this.handleResearch(session, userMessage, parseResult);
        break;
      case 'meta_compile':
        response = await this.handleMetaCompile(session, userMessage, parseResult);
        break;
      case 'simulate':
        response = await this.handleSimulation(session, userMessage, parseResult);
        break;
      case 'analogy':
        response = await this.handleAnalogy(session, userMessage, parseResult);
        break;
      case 'generate':
        response = await this.handleGeneration(session, userMessage, parseResult);
        break;
      case 'style_transfer':
        response = await this.handleStyleTransfer(session, userMessage, parseResult);
        break;
      case 'chat':
      default:
        response = await this.handleChat(session, userMessage, parseResult);
        break;
    }

    // 5. Update session context
    session.context.topics = this.extractTopics(session.messages);
    session.updatedAt = Date.now();

    // 6. Add response to session
    session.messages.push(response);

    return response;
  }

  // ==========================================================
  // INTENT CLASSIFICATION
  // ==========================================================

  private classifyIntent(message: string, parseResult: ParseTree): string {
    const lower = message.toLowerCase();

    // Research patterns
    if (lower.match(/\b(research|investigate|find out|is it possible|what about|how does|why does|explain)\b/)) {
      return 'research';
    }

    // Meta-compile patterns
    if (lower.match(/\b(don't|never|always|if.*then|rule|behavior|policy)\b/)) {
      return 'meta_compile';
    }

    // Simulation patterns
    if (lower.match(/\b(simulate|model|what if|predict|forecast|scenario)\b/)) {
      return 'simulate';
    }

    // Analogy patterns
    if (lower.match(/\b(like|similar to|analogous|compare|metaphor|just as)\b/)) {
      return 'analogy';
    }

    // Generation patterns
    if (lower.match(/\b(write|generate|create|story|essay|poem|text)\b/)) {
      return 'generate';
    }

    // Style transfer patterns
    if (lower.match(/\b(rewrite|rephrase|style|tone|formal|informal|academic|casual)\b/)) {
      return 'style_transfer';
    }

    return 'chat';
  }

  // ==========================================================
  // HANDLERS
  // ==========================================================

  /**
   * Handle research queries
   * Uses DISEMINER's transitive closure inference + LLM synthesis
   */
  private async handleResearch(
    session: ChatSession, 
    message: string, 
    parseResult: ParseTree
  ): Promise<ChatMessage> {
    // Build research query from parsed intent
    const query: ResearchQuery = {
      question: message,
      domain: this.inferDomain(session.context.topics),
      evidenceRequired: 'all',
      constraints: session.context.topics
    };

    // Run DISEMINER research
    const researchResult = await this.klc.research(query);

    // Synthesize response
    let responseText: string;

    if (this.llmClient) {
      // Use LLM to synthesize natural explanation from research results
      responseText = await this.llmClient.synthesizeResearch(researchResult, message);
    } else {
      // Native synthesis
      responseText = this.synthesizeResearchNative(researchResult);
    }

    return {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: responseText,
      timestamp: Date.now(),
      metadata: {
        inferenceChain: researchResult.sources,
        confidence: researchResult.confidence,
        source: 'DISEMINER'
      }
    };
  }

  /**
   * Handle meta-compiling
   * Converts natural language to simulation rules
   */
  private async handleMetaCompile(
    session: ChatSession,
    message: string,
    parseResult: ParseTree
  ): Promise<ChatMessage> {
    // Extract the rule-like portion of the message
    const ruleText = this.extractRuleText(message);

    // Meta-compile to rules
    const rules = await this.klc.metaCompile(ruleText, 'user');

    // Add rules to session context
    session.context.rules.push(...rules);

    // Create response
    const ruleDescriptions = rules.map(r => 
      `• **${r.name}** (probability: ${(r.probability * 100).toFixed(1)}%)`
    ).join('\n');

    return {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: `I've compiled your statement into ${rules.length} behavioral rule(s):\n\n${ruleDescriptions}\n\nThese rules are now active in our conversation context. They will influence how I respond to future messages.`,
      timestamp: Date.now(),
      metadata: {
        semanticTriples: parseResult.deepStructure,
        source: 'MESSY-meta-compile'
      }
    };
  }

  /**
   * Handle simulation requests
   */
  private async handleSimulation(
    session: ChatSession,
    message: string,
    parseResult: ParseTree
  ): Promise<ChatMessage> {
    // Extract simulation parameters from message
    const params = this.extractSimulationParams(message);

    // Build community setup
    const setup: CommunitySetup = {
      population: params.population || 100,
      languages: params.languages || ['english'],
      socialClasses: params.socialClasses || [
        { name: 'general', size: 100, influence: 0.5 }
      ]
    };

    // Run simulation
    const result = await this.klc.simulateCommunity(setup, params.years || 50);

    // Format results
    const summary = this.formatSimulationResults(result);

    return {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: summary,
      timestamp: Date.now(),
      metadata: {
        source: 'LanguageContactSimulator'
      }
    };
  }

  /**
   * Handle analogical reasoning
   */
  private async handleAnalogy(
    session: ChatSession,
    message: string,
    parseResult: ParseTree
  ): Promise<ChatMessage> {
    // Extract source and target from message
    const { source, target } = this.extractAnalogyParams(message);

    // Run analogical reasoning
    const results = await this.klc.analogicalReasoning(source, target);

    // Format response
    const analogies = results.map((r, i) => 
      `${i + 1}. **${r.concept}** (confidence: ${(r.confidence * 100).toFixed(1)}%)\n   ${r.explanation}`
    ).join('\n\n');

    return {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: `Analogical mappings from "${source}" to "${target}":\n\n${analogies}`,
      timestamp: Date.now(),
      metadata: {
        source: 'AnalogicalEngine'
      }
    };
  }

  /**
   * Handle text generation
   */
  private async handleGeneration(
    session: ChatSession,
    message: string,
    parseResult: ParseTree
  ): Promise<ChatMessage> {
    // Extract generation parameters
    const params = this.extractGenerationParams(message);

    // Build intent
    const intent: SemanticIntent = {
      subject: params.subject || 'narrator',
      verb: params.verb || 'narrates',
      object: params.object || 'story',
      description: params.description || message,
      tone: params.tone || 'neutral',
      length: params.length || 500
    };

    // Generate options
    const options: GenerateOptions = {
      grammarFramework: params.grammar || 'transformational',
      style: session.context.userStyle,
      maxLength: params.length || 500
    };

    // Generate text
    const generated = await this.klc.generateDiscourse(intent, options);

    return {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: generated,
      timestamp: Date.now(),
      metadata: {
        intent,
        source: 'NovelWriter'
      }
    };
  }

  /**
   * Handle style transfer
   */
  private async handleStyleTransfer(
    session: ChatSession,
    message: string,
    parseResult: ParseTree
  ): Promise<ChatMessage> {
    // Extract text and target style
    const { text, targetStyle } = this.extractStyleParams(message);

    // Apply style transfer
    const transferred = await this.klc.styleTransfer(
      text,
      session.context.userStyle,
      targetStyle
    );

    return {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: transferred,
      timestamp: Date.now(),
      metadata: {
        source: 'StyleController'
      }
    };
  }

  /**
   * Handle general chat
   * Falls back to LLM if available, otherwise uses semantic network reasoning
   */
  private async handleChat(
    session: ChatSession,
    message: string,
    parseResult: ParseTree
  ): Promise<ChatMessage> {
    let responseText: string;

    if (this.llmClient) {
      // Use LLM for natural conversation, but augment with semantic context
      const context = this.buildChatContext(session);
      responseText = await this.llmClient.chat(message, context);
    } else {
      // Use semantic network reasoning
      responseText = await this.semanticChatResponse(session, message, parseResult);
    }

    return {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: responseText,
      timestamp: Date.now(),
      metadata: {
        parseTree: parseResult,
        semanticTriples: parseResult.deepStructure,
        source: this.llmClient ? 'LLM-hybrid' : 'Semantic-network'
      }
    };
  }

  // ==========================================================
  // HELPER METHODS
  // ==========================================================

  private createDefaultStyle(): StyleProfile {
    return {
      syntacticWeights: new Map([
        ['S→NP VP', 0.8],
        ['NP→Det N', 0.6],
        ['VP→V NP', 0.7]
      ]),
      vocabularyBias: new Map(),
      pronounFrequency: 0.3,
      sentenceLength: { min: 5, max: 25, mean: 12, std: 4 },
      dependencyDepth: 3,
      coordinationPreference: 0.2,
      subordinationPreference: 0.3
    };
  }

  private inferDomain(topics: string[]): string {
    if (topics.length === 0) return 'general';
    // Return most recent topic
    return topics[topics.length - 1];
  }

  private extractTopics(messages: ChatMessage[]): string[] {
    const topics: string[] = [];
    for (const msg of messages) {
      // Simple topic extraction (would use NLP in production)
      const words = msg.content.toLowerCase().split(/\s+/);
      const keyWords = words.filter(w => w.length > 5);
      topics.push(...keyWords.slice(0, 3));
    }
    return [...new Set(topics)].slice(-10);
  }

  private extractRuleText(message: string): string {
    // Extract the imperative/rule portion
    return message;
  }

  private extractSimulationParams(message: string): any {
    // Extract parameters from natural language
    const population = message.match(/(\d+)\s*(people|speakers|members)/i);
    const years = message.match(/(\d+)\s*(years|decades|centuries)/i);
    const languages = message.match(/(english|spanish|french|german|chinese|etc)/gi);

    return {
      population: population ? parseInt(population[1]) : 100,
      years: years ? parseInt(years[1]) : 50,
      languages: languages || ['english']
    };
  }

  private extractAnalogyParams(message: string): { source: string; target: string } {
    // Extract source and target from analogy request
    const match = message.match(/(?:like|similar to|analogous to)\s+(.+?)\s+(?:is|are|would be)\s+(.+)/i);
    if (match) {
      return { source: match[1].trim(), target: match[2].trim() };
    }
    return { source: message, target: 'general' };
  }

  private extractGenerationParams(message: string): any {
    const length = message.match(/(\d+)\s*(words|sentences|paragraphs)/i);
    const genre = message.match(/(story|essay|poem|article|report)/i);

    return {
      length: length ? parseInt(length[1]) : 500,
      genre: genre ? genre[1].toLowerCase() : 'text',
      description: message
    };
  }

  private extractStyleParams(message: string): { text: string; targetStyle: StyleProfile } {
    // Extract text and target style
    const parts = message.split(/\b(?:in|to|as)\b/);
    const text = parts[0].trim();
    const styleName = parts[1]?.trim() || 'formal';

    const targetStyle = this.createStyleFromName(styleName);

    return { text, targetStyle };
  }

  private createStyleFromName(name: string): StyleProfile {
    const styles: Record<string, StyleProfile> = {
      formal: {
        syntacticWeights: new Map([['S→NP VP', 0.9]]),
        vocabularyBias: new Map(),
        pronounFrequency: 0.1,
        sentenceLength: { min: 10, max: 40, mean: 20, std: 5 },
        dependencyDepth: 5,
        coordinationPreference: 0.1,
        subordinationPreference: 0.5
      },
      informal: {
        syntacticWeights: new Map([['S→NP VP', 0.7]]),
        vocabularyBias: new Map(),
        pronounFrequency: 0.5,
        sentenceLength: { min: 3, max: 15, mean: 8, std: 3 },
        dependencyDepth: 2,
        coordinationPreference: 0.4,
        subordinationPreference: 0.1
      },
      academic: {
        syntacticWeights: new Map([['S→NP VP', 0.9], ['NP→Det Adj N', 0.8]]),
        vocabularyBias: new Map([['however', 0.8], ['therefore', 0.8], ['furthermore', 0.7]]),
        pronounFrequency: 0.05,
        sentenceLength: { min: 15, max: 50, mean: 25, std: 8 },
        dependencyDepth: 6,
        coordinationPreference: 0.05,
        subordinationPreference: 0.7
      }
    };

    return styles[name.toLowerCase()] || styles.formal;
  }

  private synthesizeResearchNative(result: ResearchResult): string {
    const parts: string[] = [];

    parts.push(`**Answer:** ${result.answer}`);
    parts.push(`\n**Confidence:** ${(result.confidence * 100).toFixed(1)}%`);

    if (result.sources.length > 0) {
      parts.push(`\n**Sources:**`);
      for (const source of result.sources) {
        const path = source.path.map(p => p.relation).join(' → ');
        parts.push(`- ${path} (confidence: ${(source.confidence * 100).toFixed(1)}%)`);
      }
    }

    if (result.anomalies.length > 0) {
      parts.push(`\n**Anomalies detected:**`);
      for (const anomaly of result.anomalies) {
        parts.push(`- ${anomaly}`);
      }
    }

    return parts.join('\n');
  }

  private formatSimulationResults(result: any): string {
    const parts: string[] = [];

    parts.push(`**Simulation Results**`);
    parts.push(`\nPopulation: ${result.finalState.population}`);
    parts.push(`Dialects identified: ${result.dialects.length}`);
    parts.push(`Grammar diversity: ${(result.diversity * 100).toFixed(1)}%`);

    if (result.dialects.length > 0) {
      parts.push(`\n**Dialects:**`);
      for (const dialect of result.dialects) {
        parts.push(`- ${dialect.language}: ${dialect.speakers.length} speakers`);
      }
    }

    return parts.join('\n');
  }

  private buildChatContext(session: ChatSession): string {
    const recentMessages = session.messages.slice(-5);
    return recentMessages.map(m => `${m.role}: ${m.content}`).join('\n');
  }

  private async semanticChatResponse(
    session: ChatSession,
    message: string,
    parseResult: ParseTree
  ): Promise<string> {
    // Use semantic network to generate response
    // 1. Find relevant triples in network
    const relevant = this.findRelevantTriples(session.context.network, parseResult.deepStructure);

    // 2. Generate response from triples
    const response = this.generateFromTriples(relevant);

    return response || "I'm processing your message through the semantic network.";
  }

  private findRelevantTriples(network: SemanticNetwork, queryTriples: SemanticTriple[]): SemanticTriple[] {
    const relevant: SemanticTriple[] = [];

    for (const qt of queryTriples) {
      for (const [id, triple] of network.triples) {
        if (triple.isActive(network.clock)) {
          // Check if triple is related to query
          if (triple.subject.id === qt.subject.id || 
              triple.object.id === qt.object.id ||
              triple.relation.id === qt.relation.id) {
            relevant.push(triple);
          }
        }
      }
    }

    return relevant;
  }

  private generateFromTriples(triples: SemanticTriple[]): string {
    if (triples.length === 0) return '';

    const statements = triples.map(t => 
      `${t.subject.id} ${t.relation.id} ${t.object.id}`
    );

    return statements.join('. ') + '.';
  }

  // ==========================================================
  // SESSION MANAGEMENT
  // ==========================================================

  getSession(sessionId: string): ChatSession | undefined {
    return this.sessions.get(sessionId);
  }

  getAllSessions(): ChatSession[] {
    return Array.from(this.sessions.values());
  }

  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  exportSession(sessionId: string): object {
    const session = this.sessions.get(sessionId);
    if (!session) return {};

    return {
      id: session.id,
      messages: session.messages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp
      })),
      topics: session.context.topics,
      ruleCount: session.context.rules.length,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    };
  }
}

// ============================================================
// LLM CLIENT (Optional Hybrid)
// ============================================================

export interface LLMConfig {
  apiKey: string;
  model: string;
  endpoint: string;
  temperature?: number;
  maxTokens?: number;
}

export class LLMClient {
  config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  async chat(message: string, context: string): Promise<string> {
    // Would make actual API call to OpenAI, Anthropic, etc.
    // For now, return placeholder
    return `[LLM Hybrid Response]\n\nBased on the conversation context and semantic network analysis:\n\n${message}`;
  }

  async synthesizeResearch(result: ResearchResult, query: string): Promise<string> {
    // Synthesize research results into natural language
    const prompt = `Synthesize the following research findings into a coherent response:\n\nQuery: ${query}\n\nFindings: ${result.answer}\n\nConfidence: ${(result.confidence * 100).toFixed(1)}%\n\nSources: ${result.sources.map(s => s.path.map(p => p.relation).join(' → ')).join('; ')}`;

    // Would call LLM API
    return `Based on the DISEMINER inference analysis:\n\n${result.answer}\n\nThis conclusion was reached through transitive closure over ${result.sources.length} semantic inference chains, with an overall confidence of ${(result.confidence * 100).toFixed(1)}%.`;
  }

  async generateAnalogy(source: string, target: string): Promise<string> {
    const prompt = `Create an analogical mapping from "${source}" to "${target}" using structural correspondence.`;
    return `[Analogical reasoning via LLM]\n\n${source} is to X as ${target} is to Y...`;
  }
}

// ============================================================
// EXPORTS
// ============================================================

export {
  KLCChatInterface,
  LLMClient,
  ChatMessage,
  ChatSession,
  ChatContext
};

export type {
  LLMConfig
};
