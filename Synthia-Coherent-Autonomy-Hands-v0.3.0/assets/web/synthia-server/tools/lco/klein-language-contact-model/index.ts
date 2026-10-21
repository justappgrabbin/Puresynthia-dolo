
/**
 * ============================================================
 * KLEIN LANGUAGE CONTACT MODEL — Complete Index
 * ============================================================
 * 
 * This is the master export file for the entire KLC system.
 * Import this to get everything.
 * 
 * Complete toolkit synthesis:
 * 1. Grammar Coder (1963) — JACM computational grammar coding
 * 2. AUTOLING (1968) — Meta-linguistic grammar engine
 * 3. DISEMINER (1968) — Distributional semantics inference
 * 4. MESSY (1971-1976) — Meta-symbolic simulation system
 * 5. Style Control (1965) — Weighted probabilistic grammar
 * 6. Automatic Novel Writing (1973) — Semantic discourse generation
 * 7. Historical Language Change (1966) — Monte Carlo simulation
 * 8. Language Contact (1974) — Multi-lingual community dynamics
 * 9. Propp & Lévi-Strauss (1976) — Mythological narrative generation
 * 10. Analogical Foundations (1999/2002) — Boolean group creativity
 * 11. Automatic Paraphrasing — Essay format generation
 * 
 * Modern enhancements:
 * - Neural embedding layers
 * - Transformer-based generation
 * - LLM API hybrid integration
 * - Real-time chat interface
 * - Deep research capabilities
 * - Meta-compiling (natural language → rules)
 */

// Core semantic infrastructure
export { 
  SemanticNetwork, 
  SemanticNode, 
  SemanticRelation, 
  SemanticTriple,
  LexicalExpressionList,
  Vector
} from './semantic-network-core';

// Grammar Coder (1963) — The foundational parser
export { 
  ComputationalGrammarCoder,
  GrammarCode,
  WordAnalysis,
  ContextFrameResult,
  SuffixEntry
} from './grammar-coder';

// AUTOLING (1968) — Meta-linguistic engine
export {
  AUTOLING,
  GrammarFramework,
  TransformationalGrammar,
  CaseGrammar,
  StratificationalGrammar,
  ParseTree,
  ParseNode
} from './autoling-engine';

// DISEMINER (1968) — Distributional semantics inference
export {
  DISEMINER,
  StemEntry,
  DependencyLink,
  SemanticQuery,
  InferenceResult
} from './diseminer-engine';

// MESSY (1971-1976) — Meta-symbolic simulation
export {
  MESSY,
  SimulationRule,
  RuleGroup,
  Subrule,
  NetworkTest,
  RuleAction,
  RuleContext,
  RuleResult,
  SimulationClock,
  SimulationState,
  SimulationEvent,
  SimulationTrace,
  SpeakerState,
  BehavioralIntent
} from './messy-simulator';

// Novel Writer (1973) — Automatic discourse generation
export {
  NovelWriter,
  StoryConfig,
  PlotOutline,
  Character,
  Act,
  Scene,
  StoryEvent,
  ProductionRule,
  SurfaceSemanticLink,
  GenerationContext,
  StyleController
} from './novel-writer';

// Language Contact Simulator (1966/1974)
export {
  LanguageContactSimulator,
  SpeechCommunity,
  Speaker,
  GrammarSystem,
  UtteranceHistory,
  LearningHeuristic,
  InteractionModel,
  DefaultInteractionModel,
  SocialClass,
  Geography,
  PrestigeGroup,
  ContactSetting,
  SimulatorConfig,
  SimulationResult,
  SimulationSnapshot,
  Dialect,
  ChangeTrajectory,
  IntelligibilityMatrix
} from './language-contact-simulator';

// Propp & Lévi-Strauss Myth Generator (1976)
export {
  ProppMythGenerator,
  ProppFunction,
  MythCharacter,
  MythEvent,
  MythStructure,
  MythConfig,
  LeviStraussConfig
} from './propp-myth-generator';

// Analogical Reasoning Engine (1999/2002)
export {
  AnalogicalReasoningEngine,
  ATO,
  Klein4Vector,
  AnalogicalMapping,
  AnalogicalTransformationOperator,
  BooleanVector,
  DomainSpace
} from './analogical-engine';

// Main integration class
export {
  KleinLanguageContactModel,
  SemanticIntent,
  GenerateOptions,
  CommunitySetup,
  ResearchQuery,
  ResearchResult,
  AnalogicalResult
} from './klein-language-contact-model-main';

// Chat & Research Interface
export {
  KLCChatInterface,
  LLMClient,
  ChatMessage,
  ChatSession,
  ChatContext,
  LLMConfig
} from './klc-chat-interface';

// Style system
export {
  StyleProfile
} from './autoling-engine';

// ============================================================
// QUICK START
// ============================================================

/**
 * Example 1: Basic chat with research
 */
export async function exampleChat() {
  const { KleinLanguageContactModel, KLCChatInterface } = await import('./index');

  const klc = new KleinLanguageContactModel({
    embeddingDimension: 768,
    enableNeuralEmbeddings: true
  });

  const chat = new KLCChatInterface(klc);
  const session = chat.createSession();

  // Research query
  const response1 = await chat.chat(session.id, 
    "Is it possible that language contact accelerates grammatical simplification?"
  );
  console.log(response1.content);

  // Meta-compile a rule
  const response2 = await chat.chat(session.id,
    "Don't talk to strangers unless someone you know is with you"
  );
  console.log(response2.content);

  // Generate a story
  const response3 = await chat.chat(session.id,
    "Write a 500-word murder mystery about a detective at a house party"
  );
  console.log(response3.content);

  return chat.getSession(session.id);
}

/**
 * Example 2: Language contact simulation
 */
export async function exampleSimulation() {
  const { KleinLanguageContactModel } = await import('./index');

  const klc = new KleinLanguageContactModel();

  const result = await klc.simulateCommunity({
    population: 100,
    languages: ['english', 'spanish'],
    socialClasses: [
      { name: 'prestige', size: 20, influence: 0.8 },
      { name: 'working', size: 80, influence: 0.3 }
    ]
  }, 100);

  console.log('Dialects:', result.dialects.length);
  console.log('Diversity:', result.diversity);
  console.log('Intelligibility:', result.intelligibilityMatrix);

  return result;
}

/**
 * Example 3: Myth generation
 */
export async function exampleMyth() {
  const { ProppMythGenerator, MESSY, AUTOLING } = await import('./index');

  const messy = new MESSY({});
  const autoling = new AUTOLING();
  const generator = new ProppMythGenerator(messy, autoling);

  const myth = generator.generateMyth({
    title: 'The Hero and the Dragon',
    culture: 'slavic',
    moves: 1
  });

  console.log('Characters:', myth.characters.map(c => `${c.name} (${c.role})`).join(', '));
  console.log('Events:', myth.events.length);

  return myth;
}

/**
 * Example 4: Analogical reasoning
 */
export async function exampleAnalogy() {
  const { KleinLanguageContactModel } = await import('./index');

  const klc = new KleinLanguageContactModel();

  const results = await klc.analogicalReasoning(
    "boy_loves_light",
    "mythology"
  );

  console.log('Analogies:', results);

  return results;
}

/**
 * Example 5: Grammar coding
 */
export async function exampleGrammarCoding() {
  const { ComputationalGrammarCoder } = await import('./index');

  const coder = new ComputationalGrammarCoder();

  const analysis = coder.codeSentence(
    "The quick brown fox jumps over the lazy dog."
  );

  for (const word of analysis) {
    console.log(`${word.word}: ${word.codes.map(c => c.label).join(', ')} (${word.tests.join(', ')})`);
  }

  return analysis;
}

/**
 * Example 6: LLM Hybrid chat
 */
export async function exampleLLMHybrid() {
  const { KleinLanguageContactModel, KLCChatInterface, LLMConfig } = await import('./index');

  const klc = new KleinLanguageContactModel({
    enableLLMHybrid: true,
    llmApiKey: process.env.OPENAI_API_KEY,
    llmModel: 'gpt-4'
  });

  const chat = new KLCChatInterface(klc, {
    apiKey: process.env.OPENAI_API_KEY!,
    model: 'gpt-4',
    endpoint: 'https://api.openai.com/v1'
  });

  const session = chat.createSession();

  // This will use LLM for natural language, KLC for semantic structure
  const response = await chat.chat(session.id,
    "What do you think about the relationship between language and thought?"
  );

  console.log(response.content);
  console.log('Metadata:', response.metadata);

  return response;
}
