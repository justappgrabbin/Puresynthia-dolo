// ============================================================================
// SYNTHIA LIFE ENGINE — MAIN ENTRY POINT
// GameFactory Architecture for Human Design Interactive Video Generation
// ============================================================================
// 
// Based on: GameFactory (arXiv:2501.08325) by Yu et al., ICCV 2025
// Adapted for: Human Design dramatized life scenarios
// 
// Architecture:
// 1. Design-to-World Mapper — converts HD chart into game world parameters
// 2. Design Decision Controller (DDC) — action control module for life decisions
// 3. Video Diffusion Backbone — transformer-based latent video generation
// 4. Life Episode Dataset — annotated training data with HD labels
// 5. React UI — interactive dramatized life experience interface
// 6. Orchestrator — coordinates all components with multi-phase training
//
// Multi-Phase Training:
// Phase 0: Pretrain on open-domain life drama video (no actions)
// Phase 1: Fine-tune with LoRA for HD archetype visual style
// Phase 2: Freeze all, train DDC with annotated life episodes
// Phase 3: Inference — remove LoRA, use original model + DDC for any chart
//
// The 5-Dimensional Cognitive Stack Applied:
// D1 (Impulse): User's design impulse — what their body wants
// D2 (Polarity): Defined vs undefined centers, active vs passive gates
// D3 (Witness): Coordinate where design meets experience — the "player" position
// D4 (Context): Current life situation, planetary transits, environment
// D5 (Meaning): Emergent narrative from the interaction
// ============================================================================

// Core Types
export { 
  HDChart, HDType, HDProfile, HDStrategy, HDAuthority,
  Center, CenterName, DefinitionType,
  Gate, GateSource,
  Channel, ChannelType, CircuitType,
  PlanetPosition, PlanetName, ZodiacSign, PlaneType, AspectType, PlanetAspect,
  GeoLocation, ChartCalculationInput, PreCalculatedChartData,
  ChartMetadata, TransitData, TransitEvent,
  CompositeChart, ElectromagneticConnection, DominanceConnection,
  CompromiseConnection, CompanionshipConnection, ResonanceConnection,
} from './hd-types';

// Design-to-World Mapper
export { 
  DesignToWorldMapper, 
  WorldParameters, 
  EnvironmentParams, 
  CharacterParams, 
  AppearanceParams, 
  PersonalityParams,
  RelationshipParams,
  DecisionNode,
  DecisionOption,
  VisualStyleParams,
  NarrativeArchetype,
  EmotionalPalette,
  TemporalDynamics,
} from './design-to-world-mapper';

// Design Decision Controller
export { 
  DesignDecisionController,
  DDC_CONFIG,
  DiscreteDecision,
  ContinuousState,
  DecisionHistory,
  LifeDecisions,
  ValidDecisionSpace,
  DesignToActionEncoder,
} from './design-decision-controller';

// Video Diffusion Backbone
export { 
  LifeVideoDiffusionModel,
  VideoVAE,
  NoiseScheduler,
  VIDEO_CONFIG,
  DiTTransformer,
  DiTBlock,
} from './video-diffusion-backbone';

// Life Episode Dataset
export { 
  LifeEpisodeDataset,
  LifeEpisode,
  EpisodeDecisionPoint,
  DecisionOption as EpisodeDecisionOption,
  FrameAnnotation,
  EmotionalArc,
  EpisodeOutcome,
  EpisodeQuality,
} from './life-episode-dataset';

// React UI Components
export { 
  SynthiaLifeEngine,
  CharacterDetailModal,
  EpisodeSummary,
} from './synthia-life-engine-ui';

// Orchestrator
export { 
  SynthiaLifeEngineOrchestrator,
  ORCHESTRATOR_CONFIG,
} from './synthia-life-engine-orchestrator';

// Semantic Field (assumed existing from previous builds)
export { SemanticField, AttractorNode, ResonancePath, SemanticCharge } from './semantic-field';

// Cognitive Physics Engine (assumed existing from previous builds)
export { CognitivePhysicsEngine } from './cognitive-physics-engine';

// Tensor Operations (assumed existing or using standard library)
export { Tensor, matMul, softmax, layerNorm, gelu, conv3d } from './tensor-ops';

// ============================================================================
// QUICK START
// ============================================================================
// 
// 1. Calculate or load HD chart
//    const chart = await calculateChart(birthDate, birthTime, birthLocation);
//
// 2. Initialize the engine
//    const engine = new SynthiaLifeEngineOrchestrator();
//    const world = await engine.initialize(chart);
//
// 3. Generate an episode
//    const episode = await engine.generateEpisode(chart, 'workplace challenge');
//
// 4. Play interactively
//    const result = await engine.playEpisodeInteractive(
//      episode,
//      async (decision) => {
//        // Show decision to user, get their choice
//        return await showDecisionToUser(decision);
//      },
//      (frame, total, state) => {
//        // Update UI with current frame state
//        updateVideoFrame(frame, total, state);
//      }
//    );
//
// 5. Training (multi-phase)
//    await engine.trainPhase0('open_domain_life_drama', (progress) => {
//      console.log(`Phase 0: ${(progress * 100).toFixed(1)}%`);
//    });
//    await engine.trainPhase1('hd_archetype_videos', (progress) => {
//      console.log(`Phase 1: ${(progress * 100).toFixed(1)}%`);
//    });
//    await engine.trainPhase2('annotated_life_episodes', (progress) => {
//      console.log(`Phase 2: ${(progress * 100).toFixed(1)}%`);
//    });
//
// ============================================================================

// Default export
export { SynthiaLifeEngineOrchestrator as default } from './synthia-life-engine-orchestrator';
