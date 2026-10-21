// ============================================================================
// LIFE EPISODE DATASET
// Curated dramatized life scenarios with Human Design annotations
// For training the Design Decision Controller (Phase 2)
// ============================================================================

import { HDChart, Gate, Channel, Center, PlanetPosition } from './hd-types';
import { WorldParameters, DesignToWorldMapper } from './design-to-world-mapper';
import { Tensor } from './tensor-ops';

// ============================================================================
// EPISODE DATA STRUCTURES
// ============================================================================

export interface LifeEpisode {
  id: string;
  title: string;
  description: string;

  // Chart that generated this episode
  chart: HDChart;

  // World parameters derived from chart
  world: WorldParameters;

  // Video data (latent or raw frames)
  videoFrames: Tensor;  // [frames, height, width, channels]

  // Text prompt that generated this episode
  textPrompt: string;

  // Decision points in the episode
  decisionPoints: EpisodeDecisionPoint[];

  // Annotated actions at each frame
  frameAnnotations: FrameAnnotation[];

  // Emotional arc
  emotionalArc: EmotionalArc;

  // Outcome
  outcome: EpisodeOutcome;

  // Metadata
  duration: number;  // seconds
  frameRate: number;
  resolution: { width: number; height: number };

  // Tags for dataset organization
  tags: string[];
  archetypeTags: string[];

  // Quality metrics
  quality: EpisodeQuality;
}

export interface EpisodeDecisionPoint {
  id: string;
  timestamp: number;  // frame index
  gate: number;  // Which HD gate this decision relates to
  line: number;  // Which line expression

  // The decision prompt presented to the user
  prompt: string;

  // Available options
  options: DecisionOption[];

  // The "correct" design-aligned choice
  alignedChoice: string;

  // The not-self choice
  notSelfChoice: string;

  // What actually happened in this episode
  chosenAction: string;

  // Consequence frames (what happens after the decision)
  consequenceFrames: number;  // how many frames show the consequence

  // Emotional impact
  emotionalImpact: string;

  // Design mechanics demonstrated
  mechanicsDemonstrated: string[];
}

export interface DecisionOption {
  id: string;
  text: string;
  action: string;  // DDC discrete action
  alignment: number;  // 0-1, how aligned with design

  // Visual preview (text description of what would happen)
  visualPreview: string;

  // Emotional preview
  emotionalPreview: string;

  // Consequence description
  consequence: string;
}

export interface FrameAnnotation {
  frameIndex: number;

  // What is happening in this frame
  action: string;

  // Which characters are present
  characters: string[];

  // Emotional state
  emotionalState: string;

  // Which HD mechanics are active
  activeMechanics: string[];

  // Gate energies present
  activeGates: number[];

  // Continuous state values
  continuousState: {
    emotional_intensity: number;
    mental_perspective: number;
    body_sensation: number;
    social_distance: number;
    temporal_pressure: number;
    identity_coherence: number;
  };

  // Text description for CLIP embedding
  textDescription: string;
}

export interface EmotionalArc {
  // Emotional trajectory over the episode
  trajectory: { frame: number; emotion: string; intensity: number }[];

  // Key emotional peaks
  peaks: { frame: number; emotion: string; intensity: number }[];

  // Emotional resolution
  resolution: { frame: number; emotion: string; intensity: number };

  // Overall emotional tone
  dominantTone: string;
}

export interface EpisodeOutcome {
  // Design alignment score
  alignmentScore: number;  // 0-1

  // Satisfaction metrics
  satisfaction: number;  // 0-1
  frustration: number;  // 0-1

  // Learning outcomes
  lessonsLearned: string[];

  // Growth indicators
  growthIndicators: string[];

  // Narrative closure
  narrativeClosure: string;

  // Next episode setup
  nextEpisodeSetup: string;
}

export interface EpisodeQuality {
  // Visual quality
  visualCoherence: number;  // 0-1
  styleConsistency: number;  // 0-1

  // Design accuracy
  designAccuracy: number;  // 0-1, how well it reflects the chart

  // Narrative quality
  narrativeCoherence: number;  // 0-1
  emotionalResonance: number;  // 0-1

  // Action control accuracy
  actionControlAccuracy: number;  // 0-1

  // Overall quality
  overallQuality: number;  // 0-1
}

// ============================================================================
// DATASET GENERATOR
// ============================================================================
// Generates synthetic training episodes with HD annotations
// Uses procedural generation + human curation pipeline
// ============================================================================

export class LifeEpisodeDataset {
  private episodes: LifeEpisode[] = [];
  private mapper: DesignToWorldMapper;

  constructor(mapper: DesignToWorldMapper) {
    this.mapper = mapper;
  }

  /**
   * Generate a synthetic episode from a chart
   * This is used for automated dataset generation
   */
  generateEpisode(
    chart: HDChart,
    scenario: string,
    numFrames: number = 120
  ): LifeEpisode {
    const world = this.mapper.mapChartToWorld(chart);

    // Generate decision points from the chart's decision tree
    const decisionPoints = this.generateDecisionPoints(world, numFrames);

    // Generate frame annotations
    const frameAnnotations = this.generateFrameAnnotations(
      world, decisionPoints, numFrames
    );

    // Generate emotional arc
    const emotionalArc = this.generateEmotionalArc(decisionPoints, frameAnnotations);

    // Generate outcome
    const outcome = this.generateOutcome(decisionPoints, chart);

    // Generate text prompt for the episode
    const textPrompt = this.generateTextPrompt(world, scenario);

    // Create episode
    const episode: LifeEpisode = {
      id: `episode_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: this.generateTitle(world, scenario),
      description: this.generateDescription(world, scenario),
      chart,
      world,
      videoFrames: this.generatePlaceholderFrames(numFrames),  // Placeholder
      textPrompt,
      decisionPoints,
      frameAnnotations,
      emotionalArc,
      outcome,
      duration: numFrames / 24,  // 24fps
      frameRate: 24,
      resolution: { width: 360, height: 640 },
      tags: this.generateTags(chart, scenario),
      archetypeTags: this.generateArchetypeTags(chart),
      quality: {
        visualCoherence: 0.8,
        styleConsistency: 0.8,
        designAccuracy: 0.9,
        narrativeCoherence: 0.85,
        emotionalResonance: 0.8,
        actionControlAccuracy: 0.85,
        overallQuality: 0.83,
      },
    };

    return episode;
  }

  /**
   * Generate decision points from the world parameters
   */
  private generateDecisionPoints(
    world: WorldParameters,
    numFrames: number
  ): EpisodeDecisionPoint[] {
    const points: EpisodeDecisionPoint[] = [];

    // Use the decision tree from world parameters
    const decisionTree = world.decisionTree;

    // Distribute decision points across the episode
    const interval = Math.floor(numFrames / (decisionTree.length + 1));

    for (let i = 0; i < decisionTree.length; i++) {
      const node = decisionTree[i];
      const frameIndex = (i + 1) * interval;

      const point: EpisodeDecisionPoint = {
        id: `dp_${i}`,
        timestamp: frameIndex,
        gate: node.gate,
        line: node.line,
        prompt: node.prompt,
        options: node.options.map(opt => ({
          id: opt.id,
          text: opt.text,
          action: opt.action,
          alignment: opt.alignment,
          visualPreview: this.generateVisualPreview(opt, world),
          emotionalPreview: this.generateEmotionalPreview(opt, world),
          consequence: opt.consequence,
        })),
        alignedChoice: node.options.find(o => o.alignment >= 0.9)?.id || 'aligned',
        notSelfChoice: node.options.find(o => o.alignment <= 0.3)?.id || 'notself',
        chosenAction: node.options[0].action,  // Default to first option for synthetic data
        consequenceFrames: 30,  // 1.25 seconds of consequence
        emotionalImpact: node.options[0].emotionalImpact,
        mechanicsDemonstrated: [node.strategy, node.authority],
      };

      points.push(point);
    }

    return points;
  }

  /**
   * Generate frame annotations
   */
  private generateFrameAnnotations(
    world: WorldParameters,
    decisionPoints: EpisodeDecisionPoint[],
    numFrames: number
  ): FrameAnnotation[] {
    const annotations: FrameAnnotation[] = [];

    for (let i = 0; i < numFrames; i++) {
      // Find which decision point is closest
      const closestDP = decisionPoints.reduce((closest, dp) => {
        const dist = Math.abs(dp.timestamp - i);
        const closestDist = Math.abs(closest.timestamp - i);
        return dist < closestDist ? dp : closest;
      }, decisionPoints[0]);

      const distToDP = Math.abs(closestDP.timestamp - i);
      const isNearDP = distToDP < 10;  // Within 10 frames of a decision point

      // Generate emotional state based on proximity to decision point
      let emotionalState: string;
      let emotionalIntensity: number;

      if (isNearDP) {
        emotionalState = 'anticipatory tension';
        emotionalIntensity = 0.7 + (1 - distToDP / 10) * 0.3;
      } else {
        emotionalState = 'flow state';
        emotionalIntensity = 0.3 + Math.random() * 0.3;
      }

      // Get active characters from world
      const activeCharacters = world.characters
        .slice(0, 2 + Math.floor(Math.random() * 3))
        .map(c => c.id);

      const annotation: FrameAnnotation = {
        frameIndex: i,
        action: isNearDP ? 'approaching decision point' : 'ongoing interaction',
        characters: activeCharacters,
        emotionalState,
        activeMechanics: isNearDP ? closestDP.mechanicsDemonstrated : ['strategy'],
        activeGates: [closestDP.gate],
        continuousState: {
          emotional_intensity: emotionalIntensity,
          mental_perspective: Math.random() * 2 - 1,  // -1 to 1
          body_sensation: 0.3 + Math.random() * 0.4,
          social_distance: 0.2 + Math.random() * 0.6,
          temporal_pressure: isNearDP ? 0.7 : 0.2,
          identity_coherence: 0.5 + Math.random() * 0.3,
        },
        textDescription: this.generateFrameDescription(world, i, isNearDP, closestDP),
      };

      annotations.push(annotation);
    }

    return annotations;
  }

  /**
   * Generate emotional arc
   */
  private generateEmotionalArc(
    decisionPoints: EpisodeDecisionPoint[],
    annotations: FrameAnnotation[]
  ): EmotionalArc {
    const trajectory: { frame: number; emotion: string; intensity: number }[] = [];
    const peaks: { frame: number; emotion: string; intensity: number }[] = [];

    // Build trajectory from annotations
    for (const ann of annotations) {
      trajectory.push({
        frame: ann.frameIndex,
        emotion: ann.emotionalState,
        intensity: ann.continuousState.emotional_intensity,
      });
    }

    // Find peaks (local maxima in emotional intensity)
    for (let i = 1; i < trajectory.length - 1; i++) {
      if (trajectory[i].intensity > trajectory[i - 1].intensity && 
          trajectory[i].intensity > trajectory[i + 1].intensity &&
          trajectory[i].intensity > 0.7) {
        peaks.push(trajectory[i]);
      }
    }

    // Resolution is the last frame
    const resolution = trajectory[trajectory.length - 1];

    // Dominant tone is the most frequent emotion
    const emotionCounts: Record<string, number> = {};
    for (const t of trajectory) {
      emotionCounts[t.emotion] = (emotionCounts[t.emotion] || 0) + 1;
    }
    const dominantTone = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])[0][0];

    return {
      trajectory,
      peaks,
      resolution,
      dominantTone,
    };
  }

  /**
   * Generate episode outcome
   */
  private generateOutcome(
    decisionPoints: EpisodeDecisionPoint[],
    chart: HDChart
  ): EpisodeOutcome {
    // Calculate alignment score based on chosen actions
    const alignmentScores = decisionPoints.map(dp => {
      const chosen = dp.options.find(o => o.action === dp.chosenAction);
      return chosen?.alignment || 0.5;
    });

    const avgAlignment = alignmentScores.reduce((a, b) => a + b, 0) / alignmentScores.length;

    // Satisfaction and frustration based on alignment
    const satisfaction = avgAlignment;
    const frustration = 1 - avgAlignment;

    // Lessons learned from each decision point
    const lessonsLearned = decisionPoints.map(dp => {
      const aligned = dp.options.find(o => o.id === dp.alignedChoice);
      return `When facing ${dp.prompt}, following your ${chart.strategy} leads to ${aligned?.consequence || 'alignment'}.`;
    });

    // Growth indicators
    const growthIndicators = [
      `Increased awareness of ${chart.authority} authority`,
      `Deeper understanding of ${chart.strategy} strategy`,
      `Recognition of ${chart.type} type patterns`,
    ];

    return {
      alignmentScore: avgAlignment,
      satisfaction,
      frustration,
      lessonsLearned,
      growthIndicators,
      narrativeClosure: `The episode concludes with ${satisfaction > 0.7 ? 'satisfaction' : 'learning'} through ${chart.strategy}.`,
      nextEpisodeSetup: `The next episode will explore ${chart.gates[0]?.number ? `Gate ${chart.gates[0].number}` : 'new design territory'}.`,
    };
  }

  /**
   * Generate text prompt for the episode
   */
  private generateTextPrompt(world: WorldParameters, scenario: string): string {
    const { environment, visualStyle, narrativeArchetype } = world;

    return `
      A dramatized life scenario in ${environment.setting}.
      The atmosphere is ${environment.atmosphere}.
      Visual style: ${visualStyle.rendering}, ${visualStyle.colorGrading}, ${visualStyle.lighting}.
      Camera: ${visualStyle.cameraStyle}, ${visualStyle.pacing}.
      Narrative theme: ${narrativeArchetype.lifeTheme}.
      The protagonist is a ${narrativeArchetype.heroJourney}.
      Current challenge: ${narrativeArchetype.challenge}.
      The scene involves ${scenario}.
      Sims-like aesthetic with human characters and emotional depth.
      No mystical elements — grounded human drama based on personality design.
    `.trim().replace(/\s+/g, ' ');
  }

  /**
   * Generate episode title
   */
  private generateTitle(world: WorldParameters, scenario: string): string {
    const { narrativeArchetype } = world;
    return `${narrativeArchetype.heroJourney}: ${scenario}`;
  }

  /**
   * Generate episode description
   */
  private generateDescription(world: WorldParameters, scenario: string): string {
    const { environment, narrativeArchetype } = world;
    return `
      In ${environment.setting}, a ${narrativeArchetype.heroJourney} 
      faces ${narrativeArchetype.challenge} while navigating ${scenario}.
      The world reflects their design: ${narrativeArchetype.lifeTheme}.
    `.trim();
  }

  /**
   * Generate tags
   */
  private generateTags(chart: HDChart, scenario: string): string[] {
    return [
      chart.type,
      chart.profile,
      chart.authority,
      scenario,
      ...chart.centers.filter(c => c.defined).map(c => c.name),
    ];
  }

  /**
   * Generate archetype tags
   */
  private generateArchetypeTags(chart: HDChart): string[] {
    const tags: string[] = [];

    // Type archetype
    tags.push(`${chart.type.toLowerCase()}_archetype`);

    // Profile archetype
    tags.push(`profile_${chart.profile.replace('/', '_')}`);

    // Authority archetype
    tags.push(`${chart.authority.toLowerCase().replace(/\s+/g, '_')}_authority`);

    // Defined center archetypes
    for (const center of chart.centers.filter(c => c.defined)) {
      tags.push(`${center.name.toLowerCase().replace(/\s+/g, '_')}_defined`);
    }

    // Gate archetypes
    for (const gate of chart.gates) {
      tags.push(`gate_${gate.number}`);
    }

    return tags;
  }

  /**
   * Generate visual preview for a decision option
   */
  private generateVisualPreview(option: any, world: WorldParameters): string {
    const alignment = option.alignment;

    if (alignment >= 0.9) {
      return `The scene brightens. Characters align with their design. The environment responds positively.`;
    } else if (alignment >= 0.5) {
      return `The scene shifts subtly. Mixed signals from the environment. Some characters respond, others hesitate.`;
    } else {
      return `The scene darkens. Characters move against their design. The environment creates resistance and friction.`;
    }
  }

  /**
   * Generate emotional preview for a decision option
   */
  private generateEmotionalPreview(option: any, world: WorldParameters): string {
    const alignment = option.alignment;

    if (alignment >= 0.9) {
      return `A sense of satisfaction and alignment. The body relaxes. Energy flows correctly.`;
    } else if (alignment >= 0.5) {
      return `Uncertainty and mixed feelings. Some satisfaction, some doubt. The body sends mixed signals.`;
    } else {
      return `Frustration, bitterness, anger, or disappointment. The body tightens. Energy meets resistance.`;
    }
  }

  /**
   * Generate frame description for CLIP embedding
   */
  private generateFrameDescription(
    world: WorldParameters,
    frameIndex: number,
    isNearDP: boolean,
    decisionPoint: EpisodeDecisionPoint
  ): string {
    const { environment, characters } = world;
    const activeChars = characters.slice(0, 3).map(c => c.name).join(', ');

    if (isNearDP) {
      return `
        ${activeChars} in ${environment.setting}.
        Approaching a decision: ${decisionPoint.prompt}.
        Emotional tone: anticipatory tension.
        ${environment.atmosphere}.
      `.trim().replace(/\s+/g, ' ');
    } else {
      return `
        ${activeChars} interacting in ${environment.setting}.
        Ongoing life scenario with natural flow.
        ${environment.atmosphere}.
      `.trim().replace(/\s+/g, ' ');
    }
  }

  /**
   * Generate placeholder frames (for dataset structure)
   * In production, these would be actual video frames
   */
  private generatePlaceholderFrames(numFrames: number): Tensor {
    // Placeholder: random noise frames
    // In production: actual video frames [numFrames, 360, 640, 3]
    return Tensor.zeros([numFrames, 360, 640, 3]);
  }

  // ============================================================================
  // DATASET OPERATIONS
  // ============================================================================

  /**
   * Add episode to dataset
   */
  addEpisode(episode: LifeEpisode): void {
    this.episodes.push(episode);
  }

  /**
   * Get episodes by archetype tag
   */
  getEpisodesByTag(tag: string): LifeEpisode[] {
    return this.episodes.filter(e => 
      e.tags.includes(tag) || e.archetypeTags.includes(tag)
    );
  }

  /**
   * Get episodes by chart type
   */
  getEpisodesByType(type: string): LifeEpisode[] {
    return this.episodes.filter(e => e.chart.type === type);
  }

  /**
   * Get episodes by profile
   */
  getEpisodesByProfile(profile: string): LifeEpisode[] {
    return this.episodes.filter(e => e.chart.profile === profile);
  }

  /**
   * Get episodes by authority
   */
  getEpisodesByAuthority(authority: string): LifeEpisode[] {
    return this.episodes.filter(e => e.chart.authority === authority);
  }

  /**
   * Get episodes by quality threshold
   */
  getHighQualityEpisodes(threshold: number = 0.8): LifeEpisode[] {
    return this.episodes.filter(e => e.quality.overallQuality >= threshold);
  }

  /**
   * Get all episodes
   */
  getAllEpisodes(): LifeEpisode[] {
    return this.episodes;
  }

  /**
   * Get dataset size
   */
  get size(): number {
    return this.episodes.length;
  }

  /**
   * Create training batches for DDC Phase 2
   */
  *batches(batchSize: number = 4): Generator<EpisodeBatch> {
    for (let i = 0; i < this.episodes.length; i += batchSize) {
      const batch = this.episodes.slice(i, i + batchSize);

      yield {
        videos: this.batchVideos(batch),
        charts: batch.map(e => e.chart),
        textEmbeddings: this.batchTextEmbeddings(batch),
        decisions: this.batchDecisions(batch),
        size: batch.length,
      };
    }
  }

  private batchVideos(episodes: LifeEpisode[]): Tensor {
    // Stack video frames from all episodes in batch
    // In production: actual video tensors
    return Tensor.zeros([episodes.length, 120, 360, 640, 3]);
  }

  private batchTextEmbeddings(episodes: LifeEpisode[]): Tensor {
    // In production: use CLIP or T5 text encoder
    return Tensor.zeros([episodes.length, 768]);
  }

  private batchDecisions(episodes: LifeEpisode[]): any[] {
    return episodes.map(e => ({
      discrete: e.decisionPoints.map(dp => ({
        action: dp.chosenAction,
        confidence: 0.8,
        timestamp: dp.timestamp,
      })),
      continuous: e.frameAnnotations.map(fa => fa.continuousState),
      history: {
        decisions: e.decisionPoints.map(dp => ({
          action: dp.chosenAction,
          effect: Tensor.zeros([768]),
          timestamp: dp.timestamp,
        })),
      },
    }));
  }

  /**
   * Export dataset to JSON for external use
   */
  exportToJSON(): string {
    return JSON.stringify(this.episodes, (key, value) => {
      if (value instanceof Tensor) {
        return { type: 'Tensor', shape: value.shape };
      }
      return value;
    }, 2);
  }

  /**
   * Import dataset from JSON
   */
  importFromJSON(json: string): void {
    const data = JSON.parse(json);
    this.episodes = data.map((e: any) => ({
      ...e,
      videoFrames: Tensor.zeros(e.videoFrames.shape),
    }));
  }
}

// ============================================================================
// EPISODE BATCH TYPE
// ============================================================================

interface EpisodeBatch {
  videos: Tensor;
  charts: HDChart[];
  textEmbeddings: Tensor;
  decisions: any[];
  size: number;
}

// ============================================================================
// EXPORT
// ============================================================================

export { EpisodeBatch };
export default LifeEpisodeDataset;
