// ============================================================================
// DESIGN-TO-WORLD MAPPER
// Converts Human Design chart data into game world parameters
// Maps planetary positions, gates, lines, colors, tones, bases, degrees,
// zodiacs, houses, axes into dramatized life scenario parameters
// ============================================================================

import { HDChart, Gate, Channel, Center, PlanetPosition, Profile } from './hd-types';
import { SemanticField, AttractorNode, ResonancePath, SemanticCharge } from './semantic-field';
import { CognitivePhysicsEngine } from './cognitive-physics-engine';

// ============================================================================
// WORLD PARAMETERS
// ============================================================================
// These define the visual and narrative world generated from a chart
// ============================================================================

export interface WorldParameters {
  // Environment
  environment: EnvironmentParams;

  // Characters (NPCs representing chart components)
  characters: CharacterParams[];

  // Relationships (channels as relationship dynamics)
  relationships: RelationshipParams[];

  // Decision tree (gates as decision points)
  decisionTree: DecisionNode[];

  // Visual style
  visualStyle: VisualStyleParams;

  // Narrative archetype
  narrativeArchetype: NarrativeArchetype;

  // Emotional palette
  emotionalPalette: EmotionalPalette;

  // Temporal dynamics (how time flows in this world)
  temporalDynamics: TemporalDynamics;
}

interface EnvironmentParams {
  setting: string;           // e.g., "coastal town", "urban labyrinth", "forest retreat"
  atmosphere: string;          // e.g., "warm golden hour", "cool blue twilight"
  architecture: string;      // e.g., "organic curves", "geometric precision"
  season: string;            // e.g., "late autumn", "early spring"
  dominantColor: string;       // Derived from defined centers
  secondaryColor: string;    // Derived from undefined centers
  scale: number;             // 0-1, how expansive vs intimate
  density: number;           // 0-1, how crowded vs sparse
}

interface CharacterParams {
  id: string;
  name: string;
  role: string;              // e.g., "The Responder", "The Initiator", "The Observer"
  archetype: string;         // HD gate archetype
  appearance: AppearanceParams;
  personality: PersonalityParams;
  motivation: string;      // Color-based motivation
  cognitiveStyle: string;    // Tone-based cognitive style
  behaviorPattern: string;   // Line-based expression
  definedCenters: string[];  // Which centers this character represents
  planetarySource: string;   // Which planet this character embodies
  zodiacInfluence: string;   // Zodiac sign influence
  houseDomain: string;       // House domain of influence
  degreePrecision: number;   // Exact degree position (affects intensity)
}

interface AppearanceParams {
  bodyType: string;          // Derived from type + profile
  height: number;            // 0-1 normalized
  build: string;             // "slender", "athletic", "robust", etc.
  skinTone: string;          // Color-based
  hairStyle: string;         // Line-based
  clothingStyle: string;     // Tone-based
  dominantFeature: string;   // Most prominent physical trait
  movementStyle: string;     // How they move (strategy-based)
}

interface PersonalityParams {
  openness: number;          // 0-1, derived from head/ajna
  conscientiousness: number; // 0-1, derived from spleen/ego
  extraversion: number;      // 0-1, derived from throat/sacral
  agreeableness: number;     // 0-1, derived from solar plexus/G
  neuroticism: number;       // 0-1, derived from root/head
  dominantTrait: string;     // Most prominent trait
  shadowTrait: string;       // Not-self pattern
  growthEdge: string;        // Where transformation happens
}

interface RelationshipParams {
  id: string;
  characterA: string;
  characterB: string;
  channelType: string;       // generated, individual, collective
  dynamic: string;           // e.g., "magnetic attraction", "tension", "flow"
  intensity: number;           // 0-1
  stability: number;         // 0-1
  growthPotential: number;   // 0-1
  conflictPattern: string;     // How conflicts manifest
  harmonyPattern: string;    // How harmony manifests
  narrativeFunction: string;   // What this relationship does in the story
}

interface DecisionNode {
  id: string;
  gate: number;
  line: number;
  prompt: string;            // What the user is asked
  options: DecisionOption[];
  consequence: string;       // What happens based on choice
  authority: string;         // Which authority should be used
  strategy: string;          // Which strategy applies
  notSelfWarning: string;    // What happens if wrong choice
  correctPath: string;       // Design-aligned choice

  // Visual representation
  setting: string;
  characters: string[];
  emotionalTone: string;
  temporalUrgency: number;   // 0-1, how urgent
}

export interface DecisionOption {
  id: string;
  text: string;
  action: string;            // Maps to DDC discrete action
  alignment: number;         // 0-1, how aligned with design
  consequence: string;
  emotionalImpact: string;
}

interface VisualStyleParams {
  rendering: string;         // "photorealistic", "stylized", "animated"
  colorGrading: string;      // Dominant color palette
  lighting: string;          // "dramatic", "natural", "surreal"
  cameraStyle: string;       // "intimate close-up", "wide establishing", "dynamic"
  pacing: string;            // "slow contemplative", "energetic", "measured"
  simsStyle: boolean;        // Whether to use Sims-like aesthetic
}

interface NarrativeArchetype {
  heroJourney: string;       // Where in the hero's journey
  mythicPattern: string;     // Which mythic pattern
  lifeTheme: string;         // Core life theme from chart
  challenge: string;         // Primary challenge
  gift: string;              // Primary gift
  purpose: string;           // Life purpose from G-center
  incarnationCross: string;  // Incarnation cross theme
}

interface EmotionalPalette {
  primary: string;           // Dominant emotion
  secondary: string;         // Supporting emotion
  tertiary: string;          // Undercurrent emotion
  emotionalWave: string;       // For emotional authority: wave pattern
  emotionalClarity: string;    // When clarity is available
  emotionalChaos: string;      // When chaos is present
}

interface TemporalDynamics {
  pace: string;              // "urgent", "patient", "cyclical"
  rhythm: string;            // "steady", "erratic", "pulsing"
  seasonality: string;       // How seasons/time cycles affect the world
  memoryDepth: number;       // How much past affects present
  futureOrientation: number; // How much future is visible
  presentIntensity: number;   // How intense the present moment is
}

// ============================================================================
// DESIGN-TO-WORLD MAPPER CLASS
// ============================================================================

export class DesignToWorldMapper {
  private cognitiveEngine: CognitivePhysicsEngine;
  private semanticField: SemanticField;

  constructor(cognitiveEngine: CognitivePhysicsEngine) {
    this.cognitiveEngine = cognitiveEngine;
    this.semanticField = new SemanticField();
  }

  /**
   * Main entry point: convert full HD chart into playable world parameters
   */
  mapChartToWorld(chart: HDChart): WorldParameters {
    // Build semantic field from chart
    this.buildSemanticField(chart);

    return {
      environment: this.mapEnvironment(chart),
      characters: this.mapCharacters(chart),
      relationships: this.mapRelationships(chart),
      decisionTree: this.mapDecisionTree(chart),
      visualStyle: this.mapVisualStyle(chart),
      narrativeArchetype: this.mapNarrativeArchetype(chart),
      emotionalPalette: this.mapEmotionalPalette(chart),
      temporalDynamics: this.mapTemporalDynamics(chart),
    };
  }

  // ============================================================================
  // ENVIRONMENT MAPPING
  // ============================================================================

  private mapEnvironment(chart: HDChart): EnvironmentParams {
    // Environment is determined by:
    // 1. Type (Generator=abundant, Manifestor=transformative, Projector=observational, Reflector=cyclical)
    // 2. Defined centers (which centers are "lit up" in the world)
    // 3. Profile (how the world presents itself)
    // 4. Planetary positions (which planets dominate the sky)

    const type = chart.type;
    const definedCenters = chart.centers.filter(c => c.defined);
    const profile = chart.profile;
    const sunGate = chart.planets.find(p => p.name === 'Sun')?.gate || 1;

    // Type determines world scale and energy
    let setting: string, atmosphere: string, scale: number, density: number;

    switch (type) {
      case 'Generator':
        setting = 'a vibrant marketplace where every interaction is an opportunity';
        atmosphere = 'warm golden light with the hum of activity';
        scale = 0.7;  // Medium scale, intimate but connected
        density = 0.8;  // Dense, lots of people/activity
        break;
      case 'Manifestor':
        setting = 'a transformative landscape where structures shift and reshape';
        atmosphere = 'dramatic chiaroscuro with sudden illuminations';
        scale = 0.9;  // Large scale, commanding
        density = 0.4;  // Sparse, room to move
        break;
      case 'Projector':
        setting = 'an observatory overlooking a complex social landscape';
        atmosphere = 'cool blue twilight with focused spotlights';
        scale = 0.5;  // Intimate, focused
        density = 0.3;  // Sparse, selective
        break;
      case 'Reflector':
        setting = 'a cyclical landscape that transforms with lunar phases';
        atmosphere = 'shifting silver light that mirrors the surroundings';
        scale = 1.0;  // Full scale, all-encompassing
        density = 0.5;  // Balanced
        break;
      default:
        setting = 'a neutral landscape awaiting definition';
        atmosphere = 'soft diffused light';
        scale = 0.5;
        density = 0.5;
    }

    // Defined centers determine dominant color (what's "lit")
    const dominantColor = this.centersToColor(definedCenters);

    // Undefined centers determine secondary color (what's "shadow")
    const undefinedCenters = chart.centers.filter(c => !c.defined);
    const secondaryColor = this.centersToColor(undefinedCenters, true);

    // Profile determines architecture style
    const profileNum = parseInt(profile.split('/')[0]);
    const architecture = this.profileToArchitecture(profileNum);

    // Sun gate determines season
    const season = this.gateToSeason(sunGate);

    return {
      setting,
      atmosphere,
      architecture,
      season,
      dominantColor,
      secondaryColor,
      scale,
      density,
    };
  }

  // ============================================================================
  // CHARACTER MAPPING
  // ============================================================================

  private mapCharacters(chart: HDChart): CharacterParams[] {
    const characters: CharacterParams[] = [];

    // Each activated gate becomes a character
    // Each planet position adds specificity to that character
    for (const gate of chart.gates) {
      const planet = chart.planets.find(p => p.gate === gate.number);

      const character: CharacterParams = {
        id: `char_${gate.number}`,
        name: this.gateToCharacterName(gate.number),
        role: this.gateToRole(gate.number),
        archetype: this.gateToArchetype(gate.number),
        appearance: this.mapAppearance(gate, chart),
        personality: this.mapPersonality(gate, chart),
        motivation: this.colorToMotivation(gate.color),
        cognitiveStyle: this.toneToCognitiveStyle(gate.tone),
        behaviorPattern: this.lineToBehavior(gate.line, gate.number),
        definedCenters: this.gateToCenters(gate.number, chart),
        planetarySource: planet?.name || 'Unknown',
        zodiacInfluence: planet?.zodiac || 'Unknown',
        houseDomain: planet?.house ? `House ${planet.house}` : 'Unknown',
        degreePrecision: planet ? planet.degree + planet.minute/60 + planet.second/3600 : 0,
      };

      characters.push(character);
    }

    // Add composite characters for defined channels
    for (const channel of chart.channels) {
      const char1 = characters.find(c => c.id === `char_${channel.gate1}`);
      const char2 = characters.find(c => c.id === `char_${channel.gate2}`);

      if (char1 && char2) {
        const compositeChar: CharacterParams = {
          id: `composite_${channel.gate1}_${channel.gate2}`,
          name: `${char1.name} & ${char2.name}`,
          role: 'The Bridge',
          archetype: this.channelToArchetype(channel),
          appearance: this.compositeAppearance(char1.appearance, char2.appearance),
          personality: this.compositePersonality(char1.personality, char2.personality),
          motivation: 'Connection',
          cognitiveStyle: 'Integrated',
          behaviorPattern: 'Relational',
          definedCenters: [...new Set([...char1.definedCenters, ...char2.definedCenters])],
          planetarySource: 'Composite',
          zodiacInfluence: 'Composite',
          houseDomain: 'Composite',
          degreePrecision: (char1.degreePrecision + char2.degreePrecision) / 2,
        };

        characters.push(compositeChar);
      }
    }

    return characters;
  }

  // ============================================================================
  // RELATIONSHIP MAPPING
  // ============================================================================

  private mapRelationships(chart: HDChart): RelationshipParams[] {
    const relationships: RelationshipParams[] = [];

    for (const channel of chart.channels) {
      const char1 = `char_${channel.gate1}`;
      const char2 = `char_${channel.gate2}`;

      const gate1 = chart.gates.find(g => g.number === channel.gate1);
      const gate2 = chart.gates.find(g => g.number === channel.gate2);

      const relationship: RelationshipParams = {
        id: `rel_${channel.gate1}_${channel.gate2}`,
        characterA: char1,
        characterB: char2,
        channelType: channel.type,
        dynamic: this.channelToDynamic(channel, gate1, gate2),
        intensity: this.calculateChannelIntensity(channel, chart),
        stability: this.calculateChannelStability(channel, chart),
        growthPotential: this.calculateGrowthPotential(channel, chart),
        conflictPattern: this.channelToConflictPattern(channel),
        harmonyPattern: this.channelToHarmonyPattern(channel),
        narrativeFunction: this.channelToNarrativeFunction(channel),
      };

      relationships.push(relationship);
    }

    return relationships;
  }

  // ============================================================================
  // DECISION TREE MAPPING
  // ============================================================================

  private mapDecisionTree(chart: HDChart): DecisionNode[] {
    const nodes: DecisionNode[] = [];

    // Each activated gate is a decision point
    // The decision is about how to express that gate's energy
    for (const gate of chart.gates) {
      const node: DecisionNode = {
        id: `decision_${gate.number}`,
        gate: gate.number,
        line: gate.line,
        prompt: this.gateToDecisionPrompt(gate.number),
        options: this.generateOptions(gate, chart),
        consequence: this.gateToConsequence(gate.number),
        authority: chart.authority,
        strategy: chart.strategy,
        notSelfWarning: this.gateToNotSelfWarning(gate.number),
        correctPath: this.gateToCorrectPath(gate, chart),
        setting: this.gateToSetting(gate.number),
        characters: this.gateToCharacters(gate.number, chart),
        emotionalTone: this.gateToEmotionalTone(gate.number),
        temporalUrgency: this.calculateUrgency(gate, chart),
      };

      nodes.push(node);
    }

    // Sort by urgency (most urgent first)
    nodes.sort((a, b) => b.temporalUrgency - a.temporalUrgency);

    return nodes;
  }

  // ============================================================================
  // VISUAL STYLE MAPPING
  // ============================================================================

  private mapVisualStyle(chart: HDChart): VisualStyleParams {
    const type = chart.type;
    const profile = chart.profile;

    // Type determines rendering style
    let rendering: string;
    switch (type) {
      case 'Generator':
        rendering = 'warm photorealistic with rich textures';
        break;
      case 'Manifestor':
        rendering = 'dramatic stylized with bold contrasts';
        break;
      case 'Projector':
        rendering = 'cool observational with selective focus';
        break;
      case 'Reflector':
        rendering = 'shifting animated with reflective surfaces';
        break;
      default:
        rendering = 'neutral balanced';
    }

    // Profile determines camera and pacing
    const profileNum = parseInt(profile.split('/')[0]);
    const cameraStyle = this.profileToCameraStyle(profileNum);
    const pacing = this.profileToPacing(profileNum);

    // Defined centers determine color grading
    const definedCenters = chart.centers.filter(c => c.defined);
    const colorGrading = this.centersToColorGrading(definedCenters);

    // Lighting from authority
    const lighting = this.authorityToLighting(chart.authority);

    return {
      rendering,
      colorGrading,
      lighting,
      cameraStyle,
      pacing,
      simsStyle: true,  // Always use Sims-like aesthetic as requested
    };
  }

  // ============================================================================
  // NARRATIVE ARCHETYPE MAPPING
  // ============================================================================

  private mapNarrativeArchetype(chart: HDChart): NarrativeArchetype {
    const type = chart.type;
    const profile = chart.profile;
    const incarnationCross = chart.incarnationCross;

    // Type determines hero's journey position
    const heroJourney = this.typeToHeroJourney(type);

    // Profile determines mythic pattern
    const mythicPattern = this.profileToMythicPattern(profile);

    // Incarnation cross determines life theme
    const lifeTheme = this.incarnationCrossToTheme(incarnationCross);

    // Challenge and gift from defined/undefined centers
    const challenge = this.centersToChallenge(chart.centers);
    const gift = this.centersToGift(chart.centers);

    // Purpose from G-center
    const gCenter = chart.centers.find(c => c.name === 'G');
    const purpose = gCenter?.defined 
      ? 'Self-directed purpose and identity' 
      : 'Purpose discovered through relationships and environment';

    return {
      heroJourney,
      mythicPattern,
      lifeTheme,
      challenge,
      gift,
      purpose,
      incarnationCross: incarnationCross || 'Unknown',
    };
  }

  // ============================================================================
  // EMOTIONAL PALETTE MAPPING
  // ============================================================================

  private mapEmotionalPalette(chart: HDChart): EmotionalPalette {
    const solarPlexus = chart.centers.find(c => c.name === 'Solar Plexus');
    const sacral = chart.centers.find(c => c.name === 'Sacral');
    const spleen = chart.centers.find(c => c.name === 'Spleen');

    // Primary emotion from dominant defined center
    let primary: string;
    if (solarPlexus?.defined) {
      primary = 'passionate intensity';
    } else if (sacral?.defined) {
      primary = 'satisfaction and frustration';
    } else if (spleen?.defined) {
      primary = 'instinctive awareness';
    } else {
      primary = 'mental clarity';
    }

    // Secondary from undefined centers (amplified)
    let secondary: string;
    if (!solarPlexus?.defined) {
      secondary = 'amplified emotional waves';
    } else if (!sacral?.defined) {
      secondary = 'amplified work pressure';
    } else if (!spleen?.defined) {
      secondary = 'amplified fear and intuition';
    } else {
      secondary = 'amplified mental anxiety';
    }

    // Tertiary from profile
    const profileNum = parseInt(chart.profile.split('/')[0]);
    const tertiary = this.profileToEmotion(profileNum);

    // Emotional wave for emotional authority
    const emotionalWave = solarPlexus?.defined 
      ? this.calculateEmotionalWave(chart) 
      : 'not applicable';

    return {
      primary,
      secondary,
      tertiary,
      emotionalWave,
      emotionalClarity: solarPlexus?.defined ? 'after the wave completes' : 'immediate',
      emotionalChaos: solarPlexus?.defined ? 'during the wave peak' : 'when overwhelmed',
    };
  }

  // ============================================================================
  // TEMPORAL DYNAMICS MAPPING
  // ============================================================================

  private mapTemporalDynamics(chart: HDChart): TemporalDynamics {
    const type = chart.type;
    const root = chart.centers.find(c => c.name === 'Root');
    const sacral = chart.centers.find(c => c.name === 'Sacral');

    // Pace from type and root center
    let pace: string;
    if (type === 'Generator' && sacral?.defined) {
      pace = 'responsive — wait for the impulse, then act';
    } else if (type === 'Manifestor') {
      pace = 'initiatory — act when the impulse arises';
    } else if (type === 'Projector') {
      pace = 'patient — wait for the invitation, then guide';
    } else if (type === 'Reflector') {
      pace = 'cyclical — wait a lunar cycle for clarity';
    } else {
      pace = root?.defined ? 'pressure-driven' : 'flow-based';
    }

    // Rhythm from defined centers
    const rhythm = this.centersToRhythm(chart.centers);

    // Seasonality from planetary positions
    const seasonality = this.planetsToSeasonality(chart.planets);

    // Memory depth from head/ajna
    const head = chart.centers.find(c => c.name === 'Head');
    const ajna = chart.centers.find(c => c.name === 'Ajna');
    const memoryDepth = (head?.defined ? 0.3 : 0) + (ajna?.defined ? 0.3 : 0);

    // Future orientation from head/ajna
    const futureOrientation = head?.defined ? 0.8 : 0.4;

    // Present intensity from solar plexus/root
    const solarPlexus = chart.centers.find(c => c.name === 'Solar Plexus');
    const presentIntensity = (solarPlexus?.defined ? 0.4 : 0) + (root?.defined ? 0.4 : 0);

    return {
      pace,
      rhythm,
      seasonality,
      memoryDepth,
      futureOrientation,
      presentIntensity,
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private buildSemanticField(chart: HDChart): void {
    // Use the existing cognitive physics engine to build the semantic field
    this.cognitiveEngine.processChart(chart);
  }

  private centersToColor(centers: Center[], shadow: boolean = false): string {
    const colorMap: Record<string, string> = {
      'Head': shadow ? 'pale blue' : 'deep blue',
      'Ajna': shadow ? 'pale purple' : 'deep purple',
      'Throat': shadow ? 'pale brown' : 'deep brown',
      'G': shadow ? 'pale yellow' : 'golden yellow',
      'Heart': shadow ? 'pale red' : 'deep red',
      'Solar Plexus': shadow ? 'pale orange' : 'deep orange',
      'Sacral': shadow ? 'pale red' : 'deep red',
      'Spleen': shadow ? 'pale brown' : 'deep brown',
      'Root': shadow ? 'pale red' : 'deep red',
    };

    if (centers.length === 0) return 'neutral gray';

    // Blend colors of all centers
    const colors = centers.map(c => colorMap[c.name] || 'gray');
    return colors.join(' blended with ');
  }

  private profileToArchitecture(profile: number): string {
    const architectures: Record<number, string> = {
      1: 'investigative — layered and analytical',
      2: 'intimate — cozy and personal',
      3: 'adaptive — flexible and resilient',
      4: 'opportunistic — networked and connected',
      5: 'heretical — unconventional and transformative',
      6: 'role-model — exemplary and visionary',
    };
    return architectures[profile] || 'balanced';
  }

  private gateToSeason(gate: number): string {
    // Map gates to seasons (8 gates per season)
    const seasons = [
      'early spring', 'mid spring', 'late spring', 'early summer',
      'mid summer', 'late summer', 'early autumn', 'mid autumn',
      'late autumn', 'early winter', 'mid winter', 'late winter',
    ];
    return seasons[Math.floor((gate - 1) / 5.33)] || 'transitional';
  }

  private gateToCharacterName(gate: number): string {
    const names: Record<number, string> = {
      1: 'The Creative', 2: 'The Receptive', 3: 'The Difficult',
      4: 'Youthful Folly', 5: 'Waiting', 6: 'Conflict',
      7: 'The Army', 8: 'Holding Together', 9: 'The Taming Power',
      10: 'Treading', 11: 'Peace', 12: 'Standstill',
      // ... all 64 gates
    };
    return names[gate] || `Gate ${gate}`;
  }

  private gateToRole(gate: number): string {
    const roles: Record<number, string> = {
      1: 'The Visionary', 2: 'The Receptor', 3: 'The Experimenter',
      4: 'The Student', 5: 'The Pattern-Seeker', 6: 'The Mediator',
      // ... all 64 gates
    };
    return roles[gate] || 'The Explorer';
  }

  private gateToArchetype(gate: number): string {
    // Use the cognitive physics engine's gate archetypes
    return this.cognitiveEngine.getGateArchetype(gate);
  }

  private mapAppearance(gate: Gate, chart: HDChart): AppearanceParams {
    const type = chart.type;
    const profile = chart.profile;

    return {
      bodyType: this.typeToBodyType(type),
      height: 0.5 + (gate.line / 12),  // Line affects height perception
      build: this.lineToBuild(gate.line),
      skinTone: this.colorToSkinTone(gate.color),
      hairStyle: this.lineToHairStyle(gate.line),
      clothingStyle: this.toneToClothingStyle(gate.tone),
      dominantFeature: this.gateToFeature(gate.number),
      movementStyle: this.typeToMovement(type),
    };
  }

  private mapPersonality(gate: Gate, chart: HDChart): PersonalityParams {
    const head = chart.centers.find(c => c.name === 'Head');
    const ajna = chart.centers.find(c => c.name === 'Ajna');
    const spleen = chart.centers.find(c => c.name === 'Spleen');
    const ego = chart.centers.find(c => c.name === 'Heart');
    const throat = chart.centers.find(c => c.name === 'Throat');
    const sacral = chart.centers.find(c => c.name === 'Sacral');
    const solarPlexus = chart.centers.find(c => c.name === 'Solar Plexus');
    const g = chart.centers.find(c => c.name === 'G');
    const root = chart.centers.find(c => c.name === 'Root');

    return {
      openness: (head?.defined ? 0.3 : 0) + (ajna?.defined ? 0.3 : 0) + 0.4,
      conscientiousness: (spleen?.defined ? 0.3 : 0) + (ego?.defined ? 0.3 : 0) + 0.4,
      extraversion: (throat?.defined ? 0.3 : 0) + (sacral?.defined ? 0.3 : 0) + 0.4,
      agreeableness: (solarPlexus?.defined ? 0.3 : 0) + (g?.defined ? 0.3 : 0) + 0.4,
      neuroticism: (root?.defined ? 0.3 : 0) + (head?.defined ? 0.3 : 0) + 0.4,
      dominantTrait: this.gateToTrait(gate.number),
      shadowTrait: this.gateToShadow(gate.number),
      growthEdge: this.gateToGrowth(gate.number),
    };
  }

  private colorToMotivation(color: number): string {
    const motivations = [
      'fear-driven', 'hope-driven', 'desire-driven', 
      'need-driven', 'guilt-driven', 'innocence-driven'
    ];
    return motivations[color - 1] || 'neutral';
  }

  private toneToCognitiveStyle(tone: number): string {
    const styles = [
      'analytical', 'emotional', 'intuitive', 
      'sensory', 'abstract', 'concrete'
    ];
    return styles[tone - 1] || 'balanced';
  }

  private lineToBehavior(line: number, gate: number): string {
    const behaviors: Record<number, string> = {
      1: 'investigative and probing',
      2: 'intimate and receptive',
      3: 'adaptive and experimental',
      4: 'opportunistic and networked',
      5: 'heretical and transformative',
      6: 'role-model and exemplary',
    };
    return behaviors[line] || 'balanced';
  }

  private gateToCenters(gate: number, chart: HDChart): string[] {
    const centerMap: Record<string, number[]> = {
      'Head': [64, 63, 61],
      'Ajna': [47, 24, 4, 11],
      'Throat': [62, 23, 56, 35, 12, 45, 33, 8, 31, 20, 16],
      'G': [1, 13, 25, 46, 2, 15, 10, 7],
      'Heart': [21, 40, 51, 26],
      'Solar Plexus': [36, 22, 6, 37, 49, 55, 30, 41],
      'Sacral': [5, 14, 29, 59, 9, 3, 42, 27, 34, 53],
      'Spleen': [48, 57, 44, 28, 50, 32, 18],
      'Root': [58, 38, 54, 19, 39, 52, 41, 60],
    };

    return Object.entries(centerMap)
      .filter(([_, gates]) => gates.includes(gate))
      .map(([center, _]) => center);
  }

  private compositeAppearance(a1: AppearanceParams, a2: AppearanceParams): AppearanceParams {
    return {
      bodyType: `${a1.bodyType} with ${a2.bodyType} elements`,
      height: (a1.height + a2.height) / 2,
      build: `${a1.build} transitioning to ${a2.build}`,
      skinTone: `${a1.skinTone} blended with ${a2.skinTone}`,
      hairStyle: `${a1.hairStyle} and ${a2.hairStyle}`,
      clothingStyle: `${a1.clothingStyle} meets ${a2.clothingStyle}`,
      dominantFeature: `${a1.dominantFeature} and ${a2.dominantFeature}`,
      movementStyle: `${a1.movementStyle} flowing into ${a2.movementStyle}`,
    };
  }

  private compositePersonality(p1: PersonalityParams, p2: PersonalityParams): PersonalityParams {
    return {
      openness: (p1.openness + p2.openness) / 2,
      conscientiousness: (p1.conscientiousness + p2.conscientiousness) / 2,
      extraversion: (p1.extraversion + p2.extraversion) / 2,
      agreeableness: (p1.agreeableness + p2.agreeableness) / 2,
      neuroticism: (p1.neuroticism + p2.neuroticism) / 2,
      dominantTrait: `${p1.dominantTrait} and ${p2.dominantTrait}`,
      shadowTrait: `${p1.shadowTrait} or ${p2.shadowTrait}`,
      growthEdge: `${p1.growthEdge} through ${p2.growthEdge}`,
    };
  }

  private channelToDynamic(channel: Channel, gate1?: Gate, gate2?: Gate): string {
    // Use the cognitive physics engine for channel dynamics
    return this.cognitiveEngine.getChannelDynamic(channel.gate1, channel.gate2);
  }

  private calculateChannelIntensity(channel: Channel, chart: HDChart): number {
    const gate1 = chart.gates.find(g => g.number === channel.gate1);
    const gate2 = chart.gates.find(g => g.number === channel.gate2);

    let intensity = 0.5;
    if (gate1 && gate2) intensity += 0.2;
    if (channel.type === 'generated') intensity += 0.2;
    if (gate1?.source === 'both' || gate2?.source === 'both') intensity += 0.1;

    return Math.min(intensity, 1.0);
  }

  private calculateChannelStability(channel: Channel, chart: HDChart): number {
    // Generated channels are most stable, individual least
    const stabilityMap: Record<string, number> = {
      'generated': 0.9,
      'individual': 0.5,
      'collective': 0.7,
    };
    return stabilityMap[channel.type] || 0.5;
  }

  private calculateGrowthPotential(channel: Channel, chart: HDChart): number {
    // Growth potential is highest in undefined center channels (learning)
    const center1 = this.gateToCenters(channel.gate1, chart)[0];
    const center2 = this.gateToCenters(channel.gate2, chart)[0];

    const c1 = chart.centers.find(c => c.name === center1);
    const c2 = chart.centers.find(c => c.name === center2);

    if (!c1?.defined || !c2?.defined) return 0.8;  // High growth in undefined
    return 0.5;  // Moderate growth in defined
  }

  private channelToConflictPattern(channel: Channel): string {
    return this.cognitiveEngine.getChannelConflictPattern(channel.gate1, channel.gate2);
  }

  private channelToHarmonyPattern(channel: Channel): string {
    return this.cognitiveEngine.getChannelHarmonyPattern(channel.gate1, channel.gate2);
  }

  private channelToNarrativeFunction(channel: Channel): string {
    return this.cognitiveEngine.getChannelNarrativeFunction(channel.gate1, channel.gate2);
  }

  private gateToDecisionPrompt(gate: number): string {
    const prompts: Record<number, string> = {
      1: 'A new creative impulse arises. How do you respond?',
      2: 'An opportunity for receptivity presents itself. What do you do?',
      3: 'A difficult situation requires experimentation. How do you proceed?',
      4: 'You encounter a situation that challenges your understanding. What is your approach?',
      5: 'A pattern is emerging that needs patience. How do you wait?',
      6: 'Conflict arises between two perspectives. How do you mediate?',
      // ... all 64 gates
    };
    return prompts[gate] || `Gate ${gate} presents a decision. How do you respond?`;
  }

  private generateOptions(gate: Gate, chart: HDChart): DecisionOption[] {
    const strategy = chart.strategy;
    const authority = chart.authority;

    // Generate 3-4 options based on strategy and authority
    const options: DecisionOption[] = [];

    // Option 1: Design-aligned (follow strategy + authority)
    options.push({
      id: 'aligned',
      text: this.strategyToOptionText(strategy, authority, gate),
      action: this.strategyToAction(strategy),
      alignment: 1.0,
      consequence: this.gateToAlignedConsequence(gate),
      emotionalImpact: 'satisfaction and alignment',
    });

    // Option 2: Not-self (ignore strategy)
    options.push({
      id: 'notself',
      text: this.notSelfOptionText(strategy, gate),
      action: this.notSelfAction(strategy),
      alignment: 0.2,
      consequence: this.gateToNotSelfConsequence(gate),
      emotionalImpact: 'frustration and resistance',
    });

    // Option 3: Partial alignment
    options.push({
      id: 'partial',
      text: this.partialOptionText(strategy, authority, gate),
      action: 'OBSERVE',
      alignment: 0.6,
      consequence: 'mixed results with learning opportunity',
      emotionalImpact: 'confusion with potential clarity',
    });

    // Option 4: Wait (always available for Projectors/Reflectors)
    if (chart.type === 'Projector' || chart.type === 'Reflector') {
      options.push({
        id: 'wait',
        text: 'Wait for the right moment. Observe without acting.',
        action: 'WAIT',
        alignment: 0.9,
        consequence: 'clarity emerges through patience',
        emotionalImpact: 'peace and readiness',
      });
    }

    return options;
  }

  private strategyToOptionText(strategy: string, authority: string, gate: Gate): string {
    const texts: Record<string, string> = {
      'To Respond': 'Wait for the impulse, then respond with your sacral sound or gesture.',
      'To Inform': 'Initiate the action, but first inform those who will be affected.',
      'To Wait for the Invitation': 'Wait for recognition and invitation before engaging.',
      'To Wait a Lunar Cycle': 'Observe the full lunar cycle before making a decision.',
    };
    return texts[strategy] || 'Follow your design.';
  }

  private strategyToAction(strategy: string): string {
    const actions: Record<string, string> = {
      'To Respond': 'RESPOND',
      'To Inform': 'INITIATE',
      'To Wait for the Invitation': 'WAIT',
      'To Wait a Lunar Cycle': 'WAIT',
    };
    return actions[strategy] || 'OBSERVE';
  }

  private notSelfOptionText(strategy: string, gate: Gate): string {
    return 'Act immediately without waiting — push through resistance.';
  }

  private notSelfAction(strategy: string): string {
    return 'INITIATE';  // Always wrong for non-Manifestors
  }

  private partialOptionText(strategy: string, authority: string, gate: Gate): string {
    return 'Consider the situation but feel uncertain about the right path.';
  }

  private gateToConsequence(gate: number): string {
    return `The energy of Gate ${gate} flows through your life, creating its natural expression.`;
  }

  private gateToAlignedConsequence(gate: number): string {
    return `Gate ${gate} expresses authentically, bringing satisfaction and correct alignment.`;
  }

  private gateToNotSelfConsequence(gate: number): string {
    return `Gate ${gate} expresses through not-self, creating frustration and resistance.`;
  }

  private gateToNotSelfWarning(gate: number): string {
    return `Warning: Acting from not-self with Gate ${gate} leads to bitterness, anger, frustration, or disappointment.`;
  }

  private gateToCorrectPath(gate: Gate, chart: HDChart): string {
    return `Follow your ${chart.strategy} and honor your ${chart.authority} authority.`;
  }

  private gateToSetting(gate: number): string {
    const settings: Record<number, string> = {
      1: 'a creative studio with infinite possibilities',
      2: 'a receptive garden where things grow naturally',
      3: 'an experimental laboratory with trial and error',
      4: 'a learning hall with teachers and students',
      5: 'a waiting room with a view of patterns',
      6: 'a mediation chamber with two opposing views',
      // ... all 64 gates
    };
    return settings[gate] || 'a neutral space for exploration';
  }

  private gateToCharacters(gate: number, chart: HDChart): string[] {
    const relatedGates = this.getRelatedGates(gate);
    return relatedGates.map(g => `char_${g}`);
  }

  private gateToEmotionalTone(gate: number): string {
    const tones: Record<number, string> = {
      1: 'contemplative and creative',
      2: 'receptive and nurturing',
      3: 'tense and experimental',
      4: 'curious and learning',
      5: 'patient and pattern-seeking',
      6: 'conflicted but resolving',
      // ... all 64 gates
    };
    return tones[gate] || 'neutral and exploratory';
  }

  private calculateUrgency(gate: Gate, chart: HDChart): number {
    // Urgency depends on:
    // 1. Root center definition (pressure)
    // 2. Gate position (some gates are more urgent)
    // 3. Planetary activation (transits increase urgency)

    let urgency = 0.3;  // Base urgency

    const root = chart.centers.find(c => c.name === 'Root');
    if (root?.defined) urgency += 0.3;

    if (gate.source === 'transit') urgency += 0.2;

    // Root gates are more urgent
    const rootGates = [58, 38, 54, 19, 39, 52, 41, 60];
    if (rootGates.includes(gate.number)) urgency += 0.2;

    return Math.min(urgency, 1.0);
  }

  private profileToCameraStyle(profile: number): string {
    const styles: Record<number, string> = {
      1: 'analytical close-up with detailed examination',
      2: 'intimate medium shot with personal connection',
      3: 'dynamic handheld with adaptive framing',
      4: 'networked multi-angle with social context',
      5: 'dramatic wide shot with transformative scale',
      6: 'exemplary elevated shot with role-model perspective',
    };
    return styles[profile] || 'balanced standard framing';
  }

  private profileToPacing(profile: number): string {
    const pacing: Record<number, string> = {
      1: 'slow and investigative with pauses for reflection',
      2: 'gentle and intimate with natural rhythms',
      3: 'erratic and experimental with sudden shifts',
      4: 'social and connected with conversational pace',
      5: 'dramatic and transformative with climactic builds',
      6: 'measured and exemplary with visionary scope',
    };
    return pacing[profile] || 'moderate and balanced';
  }

  private centersToColorGrading(centers: Center[]): string {
    return this.centersToColor(centers) + ' with warm highlights';
  }

  private authorityToLighting(authority: string): string {
    const lighting: Record<string, string> = {
      'Sacral': 'warm responsive lighting that pulses with energy',
      'Emotional': 'shifting colored lighting that follows emotional waves',
      'Splenic': 'sharp instinctive lighting with sudden illuminations',
      'Ego': 'confident directional lighting with strong shadows',
      'Self-Projected': 'inner glow lighting that radiates from the character',
      'Mental': 'cool analytical lighting with clear edges',
      'Lunar': 'cyclical moonlight that shifts with phases',
      'No Inner Authority': 'neutral even lighting awaiting external reflection',
    };
    return lighting[authority] || 'balanced natural lighting';
  }

  private typeToHeroJourney(type: string): string {
    const journeys: Record<string, string> = {
      'Generator': 'The Responder — finding satisfaction through correct response',
      'Manifestor': 'The Initiator — transforming through informed action',
      'Projector': 'The Guide — finding success through recognition',
      'Reflector': 'The Mirror — discovering truth through cycles',
    };
    return journeys[type] || 'The Explorer';
  }

  private profileToMythicPattern(profile: string): string {
    const patterns: Record<string, string> = {
      '1/3': 'The Investigator-Martyr — learning through trial and error',
      '1/4': 'The Investigator-Opportunist — finding opportunities through investigation',
      '2/4': 'The Hermit-Opportunist — being discovered while in retreat',
      '2/5': 'The Hermit-Heretic — transforming through natural talent',
      '3/5': 'The Martyr-Heretic — experimenting to find transformation',
      '3/6': 'The Martyr-Role Model — learning through experience to become exemplary',
      '4/6': 'The Opportunist-Role Model — networking to achieve vision',
      '4/1': 'The Opportunist-Investigator — finding foundation through connections',
      '5/1': 'The Heretic-Investigator — transforming through deep investigation',
      '5/2': 'The Heretic-Hermit — being called to transform through natural gifts',
      '6/2': 'The Role Model-Hermit — becoming exemplary while in natural retreat',
      '6/3': 'The Role Model-Martyr — achieving vision through experiential learning',
    };
    return patterns[profile] || 'The Balanced Path';
  }

  private incarnationCrossToTheme(cross: string): string {
    // Full implementation would map all 64 incarnation crosses
    return cross || 'The Path of Self-Discovery';
  }

  private centersToChallenge(centers: Center[]): string {
    const undefined = centers.filter(c => !c.defined);
    if (undefined.length === 0) return 'The challenge of consistency without amplification';
    return `The challenge of ${undefined.map(c => c.name).join(', ')} amplification and conditioning`;
  }

  private centersToGift(centers: Center[]): string {
    const defined = centers.filter(c => c.defined);
    if (defined.length === 0) return 'The gift of total openness and wisdom';
    return `The gift of ${defined.map(c => c.name).join(', ')} consistency and reliability`;
  }

  private profileToEmotion(profile: number): string {
    const emotions: Record<number, string> = {
      1: 'curious wonder',
      2: 'intimate warmth',
      3: 'resilient hope',
      4: 'social joy',
      5: 'transformative awe',
      6: 'exemplary peace',
    };
    return emotions[profile] || 'balanced contentment';
  }

  private calculateEmotionalWave(chart: HDChart): string {
    // Calculate emotional wave pattern based on solar plexus gates
    const solarPlexusGates = chart.gates.filter(g => 
      this.gateToCenters(g.number, chart).includes('Solar Plexus')
    );

    if (solarPlexusGates.length === 0) return 'no emotional wave — mental clarity';
    if (solarPlexusGates.length <= 2) return 'tribal wave — collective emotional rhythm';
    if (solarPlexusGates.length <= 4) return 'individual wave — personal emotional intensity';
    return 'collective wave — universal emotional connection';
  }

  private centersToRhythm(centers: Center[]): string {
    const root = centers.find(c => c.name === 'Root');
    const sacral = centers.find(c => c.name === 'Sacral');

    if (root?.defined && sacral?.defined) return 'pulsing — pressure-driven with responsive bursts';
    if (root?.defined) return 'erratic — pressure spikes with irregular rhythm';
    if (sacral?.defined) return 'steady — continuous responsive flow';
    return 'flow-based — following external rhythms';
  }

  private planetsToSeasonality(planets: PlanetPosition[]): string {
    // Map planetary positions to seasonal influences
    const sun = planets.find(p => p.name === 'Sun');
    if (!sun) return 'neutral seasonality';

    return `solar cycle influenced by ${sun.zodiac} with ${sun.house} house emphasis`;
  }

  private typeToBodyType(type: string): string {
    const types: Record<string, string> = {
      'Generator': 'energetic and responsive',
      'Manifestor': 'compact and impactful',
      'Projector': 'focused and penetrating',
      'Reflector': 'reflective and cyclical',
    };
    return types[type] || 'balanced';
  }

  private lineToBuild(line: number): string {
    const builds: Record<number, string> = {
      1: 'slender and investigative',
      2: 'soft and receptive',
      3: 'athletic and adaptive',
      4: 'social and approachable',
      5: 'commanding and dramatic',
      6: 'exemplary and balanced',
    };
    return builds[line] || 'balanced';
  }

  private colorToSkinTone(color: number): string {
    const tones: Record<number, string> = {
      1: 'warm olive',
      2: 'cool porcelain',
      3: 'rich amber',
      4: 'deep bronze',
      5: 'golden honey',
      6: 'pale ivory',
    };
    return tones[color] || 'neutral';
  }

  private lineToHairStyle(line: number): string {
    const styles: Record<number, string> = {
      1: 'structured and analytical',
      2: 'soft and natural',
      3: 'experimental and changing',
      4: 'social and styled',
      5: 'dramatic and transformative',
      6: 'exemplary and iconic',
    };
    return styles[line] || 'balanced';
  }

  private toneToClothingStyle(tone: number): string {
    const styles: Record<number, string> = {
      1: 'analytical and functional',
      2: 'emotional and expressive',
      3: 'intuitive and flowing',
      4: 'sensory and textured',
      5: 'abstract and avant-garde',
      6: 'concrete and classic',
    };
    return styles[tone] || 'balanced';
  }

  private gateToFeature(gate: number): string {
    const features: Record<number, string> = {
      1: 'creative eyes',
      2: 'receptive posture',
      3: 'experimental gestures',
      4: 'curious expression',
      5: 'pattern-seeking gaze',
      6: 'mediating stance',
      // ... all 64 gates
    };
    return features[gate] || 'balanced features';
  }

  private typeToMovement(type: string): string {
    const movements: Record<string, string> = {
      'Generator': 'responsive and energetic',
      'Manifestor': 'initiatory and impactful',
      'Projector': 'focused and penetrating',
      'Reflector': 'cyclical and reflective',
    };
    return movements[type] || 'balanced';
  }

  private gateToTrait(gate: number): string {
    return this.cognitiveEngine.getGateTrait(gate);
  }

  private gateToShadow(gate: number): string {
    return this.cognitiveEngine.getGateShadow(gate);
  }

  private gateToGrowth(gate: number): string {
    return this.cognitiveEngine.getGateGrowth(gate);
  }

  private getRelatedGates(gate: number): number[] {
    // Get harmonically related gates
    return this.cognitiveEngine.getHarmonicPartners(gate);
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export default DesignToWorldMapper;
