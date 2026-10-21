/**
 * roxy-causal-bridge.ts — Roxy API Bridge for Causal Dynamical System
 * 
 * Wraps @roxyapi/sdk to feed Human Design data into the QuantumOracle engine.
 * Transforms Roxy HD data into the engine's Primal Source format.
 */

import { QuantumOracle, DMSCoordinate, CausalGraph, Revelation, MemoryReport } from './QuantumOracle';

// ═══════════════════════════════════════════════════════════════════════════
// ROXY API TYPES (inferred from common HD API patterns)
// ═══════════════════════════════════════════════════════════════════════════

export interface RoxyBodygraph {
  type: string;
  strategy: string;
  authority: string;
  profile: string;
  definedCenters: string[];
  undefinedCenters: string[];
  gates: RoxyGate[];
  channels: RoxyChannel[];
  incarnationCross: string;
  variables?: {
    motivation: string;
    environment: string;
    perspective: string;
    awareness: string;
  };
}

export interface RoxyGate {
  gate: number;
  line: number;
  color?: number;
  tone?: number;
  base?: number;
  center: string;
  activated: boolean;
  planetaryActivation?: string;
}

export interface RoxyChannel {
  gate1: number;
  gate2: number;
  center1: string;
  center2: string;
  activated: boolean;
}

export interface RoxyNatalChart {
  sun: RoxyPlanet;
  earth: RoxyPlanet;
  moon: RoxyPlanet;
  northNode: RoxyPlanet;
  southNode: RoxyPlanet;
  mercury: RoxyPlanet;
  venus: RoxyPlanet;
  mars: RoxyPlanet;
  jupiter: RoxyPlanet;
  saturn: RoxyPlanet;
  uranus: RoxyPlanet;
  neptune: RoxyPlanet;
  pluto: RoxyPlanet;
}

export interface RoxyPlanet {
  sign: string;
  degree: number;
  gate: number;
  line: number;
  color?: number;
  tone?: number;
  base?: number;
}

export interface RoxyVedicKundli {
  ascendant: string;
  moonSign: string;
  sunSign: string;
  nakshatras: RoxyNakshatra[];
  dashas: RoxyDasha[];
  houses: RoxyHouse[];
}

export interface RoxyNakshatra {
  name: string;
  lord: string;
  pada: number;
  startDegree: number;
  endDegree: number;
}

export interface RoxyDasha {
  planet: string;
  startDate: string;
  endDate: string;
  duration: number;
}

export interface RoxyHouse {
  number: number;
  sign: string;
  planets: string[];
  lord: string;
}

export interface RoxyHexagramCatalog {
  hexagrams: RoxyHexagram[];
}

export interface RoxyHexagram {
  number: number;
  name: string;
  trigramAbove: string;
  trigramBelow: string;
  lines: RoxyHexagramLine[];
  judgment: string;
  image: string;
}

export interface RoxyHexagramLine {
  line: number;
  text: string;
  changing: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// PRIMAL SOURCE — The engine's native format
// ═══════════════════════════════════════════════════════════════════════════

export interface PrimalSource {
  design: string;      // Gate.Line.Color.Tone.Base for design (body)
  magnetic: string;    // Gate.Line.Color.Tone.Base for magnetic (mind)
  surface: string;     // Gate.Line.Color.Tone.Base for surface (personality)
  sunGate: number;
  earthGate: number;
  sunLine: number;
  earthLine: number;
  type: string;
  strategy: string;
  authority: string;
  profile: string;
  definedCenters: string[];
  incarnationCross: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// ROXY CAUSAL BRIDGE
// ═══════════════════════════════════════════════════════════════════════════

export class RoxyCausalBridge {
  private apiKey: string;
  private baseUrl: string;
  private oracle: QuantumOracle | null = null;

  constructor(apiKey: string, baseUrl: string = 'https://api.roxyapi.com/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  private async fetchRoxy<T>(endpoint: string, params: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Roxy API error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Fetch bodygraph from Roxy API
   */
  async fetchBodygraph(date: string, time: string, location: string): Promise<RoxyBodygraph> {
    return this.fetchRoxy<RoxyBodygraph>('/bodygraph', {
      date,
      time,
      location
    });
  }

  /**
   * Fetch natal chart from Roxy API
   */
  async fetchNatalChart(date: string, time: string, location: string): Promise<RoxyNatalChart> {
    return this.fetchRoxy<RoxyNatalChart>('/natal-chart', {
      date,
      time,
      location
    });
  }

  /**
   * Fetch Vedic kundli from Roxy API
   */
  async fetchVedicKundli(date: string, time: string, location: string): Promise<RoxyVedicKundli> {
    return this.fetchRoxy<RoxyVedicKundli>('/vedic-kundli', {
      date,
      time,
      location
    });
  }

  /**
   * Fetch hexagram catalog from Roxy API
   */
  async fetchHexagramCatalog(): Promise<RoxyHexagramCatalog> {
    return this.fetchRoxy<RoxyHexagramCatalog>('/hexagrams', {});
  }

  /**
   * Transform Roxy bodygraph data into Primal Source format
   */
  buildNatalPlacementMap(bodygraph: RoxyBodygraph, natal: RoxyNatalChart): PrimalSource {
    // Find design gate (body) — typically the unconscious Sun
    const designGate = natal.sun.gate;
    const designLine = natal.sun.line || 1;
    const designColor = natal.sun.color || 1;
    const designTone = natal.sun.tone || 1;
    const designBase = natal.sun.base || 1;

    // Find magnetic gate (mind) — typically the unconscious Moon
    const magGate = natal.moon.gate;
    const magLine = natal.moon.line || 1;
    const magColor = natal.moon.color || 1;
    const magTone = natal.moon.tone || 1;
    const magBase = natal.moon.base || 1;

    // Find surface gate (personality) — typically the conscious Sun
    const surfGate = natal.earth.gate;
    const surfLine = natal.earth.line || 1;
    const surfColor = natal.earth.color || 1;
    const surfTone = natal.earth.tone || 1;
    const surfBase = natal.earth.base || 1;

    return {
      design: `${designGate}.${designLine}.${designColor}.${designTone}.${designBase}`,
      magnetic: `${magGate}.${magLine}.${magColor}.${magTone}.${magBase}`,
      surface: `${surfGate}.${surfLine}.${surfColor}.${surfTone}.${surfBase}`,
      sunGate: natal.sun.gate,
      earthGate: natal.earth.gate,
      sunLine: natal.sun.line || 1,
      earthLine: natal.earth.line || 1,
      type: bodygraph.type,
      strategy: bodygraph.strategy,
      authority: bodygraph.authority,
      profile: bodygraph.profile,
      definedCenters: bodygraph.definedCenters,
      incarnationCross: bodygraph.incarnationCross
    };
  }

  /**
   * Build Primal Source from bodygraph alone (fallback)
   */
  buildPrimalFromBodygraph(bodygraph: RoxyBodygraph): PrimalSource {
    // Use first defined gate as design, second as magnetic, third as surface
    const definedGates = bodygraph.gates.filter(g => g.activated);
    const g1 = definedGates[0] || { gate: 1, line: 1, color: 1, tone: 1, base: 1 };
    const g2 = definedGates[1] || { gate: 10, line: 1, color: 1, tone: 1, base: 1 };
    const g3 = definedGates[2] || { gate: 25, line: 1, color: 1, tone: 1, base: 1 };

    return {
      design: `${g1.gate}.${g1.line}.${g1.color || 1}.${g1.tone || 1}.${g1.base || 1}`,
      magnetic: `${g2.gate}.${g2.line}.${g2.color || 1}.${g2.tone || 1}.${g2.base || 1}`,
      surface: `${g3.gate}.${g3.line}.${g3.color || 1}.${g3.tone || 1}.${g3.base || 1}`,
      sunGate: 10,
      earthGate: 15,
      sunLine: 1,
      earthLine: 1,
      type: bodygraph.type,
      strategy: bodygraph.strategy,
      authority: bodygraph.authority,
      profile: bodygraph.profile,
      definedCenters: bodygraph.definedCenters,
      incarnationCross: bodygraph.incarnationCross
    };
  }

  /**
   * Initialize the QuantumOracle with Primal Source data
   */
  initializeOracle(primal: PrimalSource): QuantumOracle {
    this.oracle = new QuantumOracle(
      primal.design,
      primal.magnetic,
      primal.surface,
      primal.sunGate,
      primal.earthGate
    );
    return this.oracle;
  }

  /**
   * Orchestrate parallel API calls and build complete causal graph
   */
  async generateCausalGraph(
    date: string, time: string, location: string
  ): Promise<{ primal: PrimalSource; graph: CausalGraph; oracle: QuantumOracle }> {
    // Parallel API calls
    const [bodygraph, natal] = await Promise.all([
      this.fetchBodygraph(date, time, location),
      this.fetchNatalChart(date, time, location)
    ]);

    // Build Primal Source
    const primal = this.buildNatalPlacementMap(bodygraph, natal);

    // Initialize Oracle
    const oracle = this.initializeOracle(primal);

    // Run initial cycles to populate graph
    oracle.query("Initialize causal graph", "init", 5);

    // Get causal graph
    const graph = oracle.getCausalGraph();

    return { primal, graph, oracle };
  }

  /**
   * Get the current oracle instance
   */
  getOracle(): QuantumOracle | null {
    return this.oracle;
  }

  /**
   * Run a query through the initialized oracle
   */
  runQuery(query: string, fieldKey: string = "general", cycles: number = 1): Revelation[] {
    if (!this.oracle) {
      throw new Error('Oracle not initialized. Call initializeOracle() first.');
    }
    return this.oracle.query(query, fieldKey, cycles);
  }

  /**
   * Get memory report from the oracle
   */
  getMemoryReport(): MemoryReport {
    if (!this.oracle) {
      throw new Error('Oracle not initialized. Call initializeOracle() first.');
    }
    return this.oracle.getMemoryReport();
  }
}

export default RoxyCausalBridge;
