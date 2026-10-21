// ============================================================================
// HUMAN DESIGN TYPE DEFINITIONS
// Core data structures for chart data, gates, channels, centers, planets
// ============================================================================

// ============================================================================
// CORE CHART TYPES
// ============================================================================

export interface HDChart {
  id: string;                    // Unique identifier

  // Type and Profile
  type: HDType;                  // Generator, Manifestor, Projector, Reflector
  profile: HDProfile;            // 1/3, 2/4, 3/5, etc.

  // Strategy and Authority
  strategy: HDStrategy;          // To Respond, To Inform, To Wait for the Invitation, To Wait a Lunar Cycle
  authority: HDAuthority;        // Sacral, Emotional, Splenic, Ego, Self-Projected, Mental, Lunar, No Inner Authority

  // Centers
  centers: Center[];             // 9 centers with definition status

  // Gates and Channels
  gates: Gate[];                 // All activated gates (design + personality + transit)
  channels: Channel[];           // All defined channels

  // Planetary Positions
  planets: PlanetPosition[];     // All 13 planetary positions with full HD data

  // Incarnation Cross
  incarnationCross: string;      // e.g., "Cross of the Four Ways"

  // Birth Data
  birthDate: Date;               // Birth date and time
  birthLocation: GeoLocation;    // Birth latitude/longitude

  // Design Date (approx. 88-89 days before birth)
  designDate: Date;              // Design date and time

  // Metadata
  calculatedAt: Date;            // When this chart was calculated
  source: string;                // Calculation source (e.g., "Jovian Archive", "Roxy API")
}

export type HDType = 'Generator' | 'Manifestor' | 'Projector' | 'Reflector';

export type HDProfile = 
  | '1/3' | '1/4' 
  | '2/4' | '2/5' 
  | '3/5' | '3/6' 
  | '4/6' | '4/1' 
  | '5/1' | '5/2' 
  | '6/2' | '6/3';

export type HDStrategy = 
  | 'To Respond' 
  | 'To Inform' 
  | 'To Wait for the Invitation' 
  | 'To Wait a Lunar Cycle';

export type HDAuthority = 
  | 'Sacral' 
  | 'Emotional' 
  | 'Splenic' 
  | 'Ego' 
  | 'Self-Projected' 
  | 'Mental' 
  | 'Lunar' 
  | 'No Inner Authority';

// ============================================================================
// CENTER
// ============================================================================

export interface Center {
  name: CenterName;              // Head, Ajna, Throat, G, Heart, Solar Plexus, Sacral, Spleen, Root
  defined: boolean;              // Whether this center is defined (colored in)

  // Gates in this center
  gates: number[];             // Gate numbers (1-64) that belong to this center

  // Channels connected to this center
  channels: number[];            // Channel IDs connected to this center

  // Definition details
  definitionType: DefinitionType; // Single, Split, Triple, Quadruple definition

  // For undefined centers: conditioning themes
  conditioningThemes?: string[];   // What this center is conditioned by when undefined

  // For defined centers: consistent themes
  consistentThemes?: string[];    // What this center consistently provides
}

export type CenterName = 
  | 'Head' 
  | 'Ajna' 
  | 'Throat' 
  | 'G' 
  | 'Heart' 
  | 'Solar Plexus' 
  | 'Sacral' 
  | 'Spleen' 
  | 'Root';

export type DefinitionType = 'Single' | 'Split' | 'Triple' | 'Quadruple';

// ============================================================================
// GATE
// ============================================================================
// Each gate is a specific position in the I Ching (1-64)
// With line, color, tone, base, degree, minute, second precision
// ============================================================================

export interface Gate {
  number: number;              // 1-64 (I Ching hexagram number)

  // Line (1-6) — expression style
  line: number;                // 1=investigative, 2=intimate, 3=adaptive, 4=opportunistic, 5=heretical, 6=role-model

  // Color (1-6) — motivation
  color: number;               // 1=fear, 2=hope, 3=desire, 4=need, 5=guilt, 6=innocence

  // Tone (1-6) — cognitive style / mind
  tone: number;                // 1=analytical, 2=emotional, 3=intuitive, 4=sensory, 5=abstract, 6=concrete

  // Base (1-5) — archetypal flavor
  base: number;                // 1=alpha, 2=beta, 3=gamma, 4=delta, 5=epsilon

  // Degree precision (0-360)
  degree: number;              // Exact degree within the gate (0-360)
  minute: number;              // Minute precision (0-59)
  second: number;              // Second precision (0-59)

  // Which center this gate belongs to
  center: CenterName;

  // Source of activation
  source: GateSource;          // design, personality, transit, both

  // Planet that activates this gate (if personality)
  planet?: PlanetName;

  // Whether this gate is part of a defined channel
  inDefinedChannel: boolean;

  // Channel partners (if in a defined channel)
  channelPartners?: number[];    // Other gate numbers in the same channel
}

export type GateSource = 'design' | 'personality' | 'transit' | 'both';

// ============================================================================
// CHANNEL
// ============================================================================
// A channel connects two gates, creating a defined circuit
// ============================================================================

export interface Channel {
  id: number;                  // Channel number (1-36)

  // The two gates that form this channel
  gate1: number;               // First gate (1-64)
  gate2: number;               // Second gate (1-64)

  // Which centers these gates belong to
  center1: CenterName;
  center2: CenterName;

  // Channel type
  type: ChannelType;           // generated, individual, collective

  // Circuit type
  circuit: CircuitType;        // individual, collective, tribal, integration

  // Whether both gates are defined (fully defined channel)
  fullyDefined: boolean;

  // Whether this is a core channel (connects to G, Sacral, or Root)
  isCoreChannel: boolean;

  // Channel name (e.g., "1-8 Channel of Inspiration")
  name: string;

  // Harmonic partners
  harmonicPartners?: number[];   // Channels that share harmonic relationship
}

export type ChannelType = 'generated' | 'individual' | 'collective';

export type CircuitType = 'individual' | 'collective' | 'tribal' | 'integration';

// ============================================================================
// PLANETARY POSITION
// ============================================================================
// Each planet's position in the HD chart with full precision
// ============================================================================

export interface PlanetPosition {
  // Planet identity
  name: PlanetName;            // Sun, Earth, Moon, North Node, South Node, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto

  // HD position
  gate: number;                // 1-64
  line: number;                // 1-6
  color: number;               // 1-6
  tone: number;                // 1-6
  base: number;                // 1-5

  // Degree precision
  degree: number;              // 0-360
  minute: number;              // 0-59
  second: number;              // 0-59

  // Astrological position
  zodiac: ZodiacSign;          // Aries, Taurus, Gemini, etc.
  house: number;               // 1-12

  // I Ching axis (line)
  axis: number;                // 1-6 (which I Ching line this position falls on)

  // Whether this is a personality (conscious) or design (unconscious) position
  plane: PlaneType;            // personality, design

  // Whether this planet is retrograde
  retrograde: boolean;

  // Aspect relationships to other planets
  aspects?: PlanetAspect[];      // Conjunction, opposition, trine, square, sextile, etc.
}

export type PlanetName = 
  | 'Sun' 
  | 'Earth' 
  | 'Moon' 
  | 'North Node' 
  | 'South Node' 
  | 'Mercury' 
  | 'Venus' 
  | 'Mars' 
  | 'Jupiter' 
  | 'Saturn' 
  | 'Uranus' 
  | 'Neptune' 
  | 'Pluto';

export type ZodiacSign = 
  | 'Aries' | 'Taurus' | 'Gemini' | 'Cancer' 
  | 'Leo' | 'Virgo' | 'Libra' | 'Scorpio' 
  | 'Sagittarius' | 'Capricorn' | 'Aquarius' | 'Pisces';

export type PlaneType = 'personality' | 'design';

export interface PlanetAspect {
  planet: PlanetName;          // Other planet involved
  aspectType: AspectType;      // Conjunction, Opposition, Trine, Square, Sextile, etc.
  orb: number;                 // Orb in degrees (0-10)
  applying: boolean;           // Whether the aspect is applying or separating
}

export type AspectType = 
  | 'Conjunction' 
  | 'Opposition' 
  | 'Trine' 
  | 'Square' 
  | 'Sextile' 
  | 'Quincunx' 
  | 'Semisextile' 
  | 'Semisquare' 
  | 'Sesquiquadrate';

// ============================================================================
// GEOLOCATION
// ============================================================================

export interface GeoLocation {
  latitude: number;            // -90 to 90
  longitude: number;           // -180 to 180
  timezone: string;            // e.g., "America/New_York"
  city?: string;
  country?: string;
}

// ============================================================================
// CHART CALCULATION INPUT
// ============================================================================

export interface ChartCalculationInput {
  birthDate: Date;
  birthTime: string;           // HH:MM:SS
  birthLocation: GeoLocation;

  // Optional: pre-calculated data (from Roxy API, etc.)
  preCalculatedData?: PreCalculatedChartData;
}

export interface PreCalculatedChartData {
  // If the chart is already calculated (e.g., from Roxy API)
  // Include all the raw data here
  rawJson: string;
  source: string;
  calculatedAt: Date;
}

// ============================================================================
// CHART METADATA
// ============================================================================

export interface ChartMetadata {
  // Definition type
  definitionType: DefinitionType;

  // Number of defined centers
  definedCentersCount: number;

  // Number of defined channels
  definedChannelsCount: number;

  // Number of activated gates
  activatedGatesCount: number;

  // Variable (determined by bottom 4 arrows)
  variable: string;            // e.g., "Left/Right", "Right/Left", etc.

  // Determination
  determination: string;         // e.g., "Environment", "Thirst", "Taste", etc.

  // Cognition
  cognition: string;             // e.g., "Smell", "Outer Vision", "Inner Vision", etc.

  // Motivation
  motivation: string;            // e.g., "Fear", "Hope", "Desire", etc.

  // Transference
  transference: string;          // e.g., "Fear to Hope", etc.

  // Sense
  sense: string;                 // e.g., "Outer Vision", etc.

  // Environment
  environment: string;           // e.g., "Caves", "Markets", etc.

  // View
  view: string;                  // e.g., "Survival", "Possibility", etc.
}

// ============================================================================
// TRANSIT DATA
// ============================================================================

export interface TransitData {
  date: Date;

  // Current planetary positions
  planets: PlanetPosition[];

  // Transit gates (gates activated by current planetary positions)
  transitGates: Gate[];

  // Transit channels (channels activated by current transits)
  transitChannels: Channel[];

  // Which centers are conditioned by transits
  conditionedCenters: CenterName[];

  // Key transit themes
  themes: string[];

  // Major transit events
  events: TransitEvent[];
}

export interface TransitEvent {
  date: Date;
  planet: PlanetName;
  gate: number;
  line: number;
  eventType: string;             // e.g., "ingress", "station", "conjunction"
  description: string;
}

// ============================================================================
// COMPOSITE CHART (for relationships)
// ============================================================================

export interface CompositeChart {
  // Two charts being compared
  chart1: HDChart;
  chart2: HDChart;

  // Shared gates (both charts have this gate defined)
  sharedGates: Gate[];

  // Shared channels (both charts have this channel defined)
  sharedChannels: Channel[];

  // Electromagnetic connections (one person's gate connects to another's)
  electromagneticConnections: ElectromagneticConnection[];

  // Dominance (one person's defined center dominates another's undefined)
  dominanceConnections: DominanceConnection[];

  // Compromise (both have same gate but different lines)
  compromiseConnections: CompromiseConnection[];

  // Companionship (same gate, same line, different colors)
  companionshipConnections: CompanionshipConnection[];

  // Resonance (same gate, same line, same color, different tones)
  resonanceConnections: ResonanceConnection[];
}

export interface ElectromagneticConnection {
  gate1: number;               // Gate in chart1
  gate2: number;               // Gate in chart2
  channel: number;             // Channel that would be formed
  center1: CenterName;
  center2: CenterName;
}

export interface DominanceConnection {
  center: CenterName;
  dominantChart: 'chart1' | 'chart2';
  description: string;
}

export interface CompromiseConnection {
  gate: number;
  line1: number;
  line2: number;
  description: string;
}

export interface CompanionshipConnection {
  gate: number;
  line: number;
  color1: number;
  color2: number;
  description: string;
}

export interface ResonanceConnection {
  gate: number;
  line: number;
  color: number;
  tone1: number;
  tone2: number;
  description: string;
}

// ============================================================================
// EXPORT
// ============================================================================

export default HDChart;
