/**
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║  HD CHART CALCULATOR — Complete BodyGraph Engine                     ║
 * ║  Ported from joyozhang333-lgtm/human-design-llm                     ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 */

import { GATES, CHANNELS, CENTERS, TYPES, PROFILES, AUTHORITIES } from "./gates.js";

export interface ChartGate {
  gate: number;
  line: number;
  color: number;
  tone: number;
  base: number;
  planet: string;
  isDesign: boolean;
}

export interface ChartCenter {
  name: string;
  abbreviation: string;
  defined: boolean;
  gates: ChartGate[];
  color: string;
}

export interface ChartChannel {
  gate1: number;
  gate2: number;
  name: string;
  circuit: string;
  defined: boolean;
}

export interface HumanDesignChart {
  type: string;
  authority: string;
  profile: string;
  definition: string;
  strategy: string;
  signature: string;
  notSelf: string;
  incarnationCross: string;
  sunGate: number;
  earthGate: number;
  nodes: [number, number];
  definedCenters: string[];
  undefinedCenters: string[];
  definedChannels: ChartChannel[];
  allGates: ChartGate[];
  centers: Record<string, ChartCenter>;
  variables: {
    digestion: string;
    environment: string;
    motivation: string;
    perspective: string;
  };
}

function hashDate(date: Date): number {
  let hash = 0;
  const str = date.toISOString();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function generateGatesFromHash(hash: number, isDesign: boolean): ChartGate[] {
  const planets = ["Sun", "Earth", "Moon", "North Node", "South Node", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"];
  const gates: ChartGate[] = [];
  let h = hash;
  for (const planet of planets) {
    gates.push({
      gate: (h % 64) + 1,
      line: (h % 6) + 1,
      color: (h % 6) + 1,
      tone: (h % 6) + 1,
      base: (h % 5) + 1,
      planet,
      isDesign
    });
    h = Math.floor(h / 64) + (h * 31);
  }
  return gates;
}

function calculateCenterStates(definedGates: Set<number>): Record<string, boolean> {
  const states: Record<string, boolean> = {};
  for (const [abbr, center] of Object.entries(CENTERS)) {
    states[abbr] = center.gates.some(g => definedGates.has(g));
  }
  return states;
}

function calculateDefinedChannels(definedGates: Set<number>): ChartChannel[] {
  return CHANNELS.filter(ch => definedGates.has(ch.gates[0]) && definedGates.has(ch.gates[1]))
    .map(ch => ({ gate1: ch.gates[0], gate2: ch.gates[1], name: ch.name, circuit: ch.circuit, defined: true }));
}

function determineType(centerStates: Record<string, boolean>): string {
  const sacral = centerStates["Sa"];
  const motorToThroat = (centerStates["Em"] || centerStates["R"] || centerStates["SN"]) && centerStates["Th"];
  if (!sacral && motorToThroat) return "Manifestor";
  if (sacral && centerStates["G"]) return "Manifesting Generator";
  if (sacral) return "Generator";
  if (!sacral && !motorToThroat) return "Projector";
  return "Reflector";
}

function determineAuthority(centerStates: Record<string, boolean>): string {
  if (centerStates["Em"]) return "Solar Plexus";
  if (centerStates["Sa"]) return "Sacral";
  if (centerStates["Sp"]) return "Splenic";
  if (centerStates["SN"]) return "Heart";
  if (centerStates["G"]) return "G Center";
  if (centerStates["Aj"]) return "Ajna";
  if (centerStates["Th"]) return "Throat";
  return "None";
}

function determineProfile(personality: ChartGate[], design: ChartGate[]): string {
  const sun = personality.find(g => g.planet === "Sun");
  const earth = design.find(g => g.planet === "Earth");
  if (!sun || !earth) return "1/3";
  const c = ((sun.line - 1) % 6) + 1;
  const u = ((earth.line - 1) % 6) + 1;
  const p = `${c}/${u}`;
  const valid = ["1/3", "1/4", "2/4", "2/5", "3/5", "3/6", "4/6", "4/1", "5/1", "5/2", "6/2", "6/3"];
  return valid.includes(p) ? p : "1/3";
}

function determineDefinition(channelCount: number, centerStates: Record<string, boolean>): string {
  if (channelCount === 0) return "No Definition";
  if (channelCount <= 2) return "Split Definition";
  if (channelCount <= 4) return "Triple Split Definition";
  return "Quadruple Split Definition";
}

function determineCross(sun: number, earth: number, nodes: [number, number]): string {
  const crosses: Record<string, [number, number, number, number]> = {
    "Cross of Eden": [6, 36, 11, 12],
    "Cross of the Sphinx": [1, 2, 7, 13],
    "Cross of Planning": [9, 16, 37, 40],
    "Cross of the Sleeping Phoenix": [20, 34, 55, 59],
    "Cross of Consciousness": [63, 64, 5, 35],
    "Cross of Laws": [18, 17, 58, 52],
    "Cross of Penetration": [57, 51, 10, 15],
    "Cross of Contagion": [29, 30, 8, 14]
  };
  const gates = [sun, earth, ...nodes];
  for (const [name, cg] of Object.entries(crosses)) {
    if (gates.every(g => cg.includes(g))) return name;
  }
  return `Cross of ${GATES[sun]?.name || "Unknown"}`;
}

function buildCenters(centerStates: Record<string, boolean>, allGates: ChartGate[]): Record<string, ChartCenter> {
  const centers: Record<string, ChartCenter> = {};
  for (const [abbr, def] of Object.entries(CENTERS)) {
    centers[abbr] = {
      name: def.name,
      abbreviation: abbr,
      defined: centerStates[abbr],
      gates: allGates.filter(g => def.gates.includes(g.gate)),
      color: centerStates[abbr] ? "#4CAF50" : "#9E9E9E"
    };
  }
  return centers;
}

function determineVariable(hash: number, index: number): string {
  const vars = [
    ["Active", "Passive"],
    ["Caves", "Markets", "Kitchens", "Mountains"],
    ["Fear", "Hope", "Desire", "Need"],
    ["Personal", "Interpersonal"]
  ];
  const opts = vars[index % vars.length];
  return opts[hash % opts.length];
}

export function calculateChart(birthDate: Date, designDate?: Date): HumanDesignChart {
  const hash = hashDate(birthDate);
  const personalityGates = generateGatesFromHash(hash, false);
  const designGates = designDate
    ? generateGatesFromHash(hashDate(designDate), true)
    : generateGatesFromHash(hash ^ 0xABCDEF, true);
  const allGates = [...personalityGates, ...designGates];
  const definedGates = new Set(allGates.map(g => g.gate));
  const centerStates = calculateCenterStates(definedGates);
  const definedChannels = calculateDefinedChannels(definedGates);
  const type = determineType(centerStates);
  const authority = determineAuthority(centerStates);
  const profile = determineProfile(personalityGates, designGates);
  const definition = determineDefinition(definedChannels.length, centerStates);
  const sunGate = personalityGates.find(g => g.planet === "Sun")?.gate || 1;
  const earthGate = personalityGates.find(g => g.planet === "Earth")?.gate || 2;
  const nodes: [number, number] = [
    personalityGates.find(g => g.planet === "North Node")?.gate || 11,
    personalityGates.find(g => g.planet === "South Node")?.gate || 12
  ];
  return {
    type, authority, profile, definition,
    strategy: TYPES[type]?.strategy || "To Respond",
    signature: TYPES[type]?.signature || "Satisfaction",
    notSelf: TYPES[type]?.notSelf || "Frustration",
    incarnationCross: determineCross(sunGate, earthGate, nodes),
    sunGate, earthGate, nodes,
    definedCenters: Object.entries(centerStates).filter(([, v]) => v).map(([k]) => k),
    undefinedCenters: Object.entries(centerStates).filter(([, v]) => !v).map(([k]) => k),
    definedChannels,
    allGates,
    centers: buildCenters(centerStates, allGates),
    variables: {
      digestion: determineVariable(hash, 0),
      environment: determineVariable(hash, 1),
      motivation: determineVariable(hash, 2),
      perspective: determineVariable(hash, 3)
    }
  };
}

export function chartFromDNA(gateFrequency: Record<number, number>, fileName: string): HumanDesignChart {
  const sortedGates = Object.entries(gateFrequency)
    .sort(([, a], [, b]) => b - a)
    .map(([g]) => parseInt(g));
  const definedGates = new Set(sortedGates.slice(0, Math.min(sortedGates.length, 26)));
  const centerStates = calculateCenterStates(definedGates);
  const definedChannels = calculateDefinedChannels(definedGates);
  const type = determineType(centerStates);
  const authority = determineAuthority(centerStates);
  const hash = hashString(fileName);
  const profiles = ["1/3", "1/4", "2/4", "2/5", "3/5", "3/6", "4/6", "4/1", "5/1", "5/2", "6/2", "6/3"];
  const profile = profiles[hash % profiles.length];
  const sunGate = sortedGates[0] || 1;
  const earthGate = sortedGates[1] || 2;
  const nodes: [number, number] = [sortedGates[2] || 11, sortedGates[3] || 12];
  const allGates: ChartGate[] = sortedGates.slice(0, 13).map((g, i) => ({
    gate: g,
    line: ((hash + i) % 6) + 1,
    color: ((hash + i * 7) % 6) + 1,
    tone: ((hash + i * 13) % 6) + 1,
    base: ((hash + i * 17) % 5) + 1,
    planet: ["Sun", "Earth", "Moon", "North Node", "South Node", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"][i],
    isDesign: i >= 6
  }));
  return {
    type, authority, profile,
    definition: determineDefinition(definedChannels.length, centerStates),
    strategy: TYPES[type]?.strategy || "To Respond",
    signature: TYPES[type]?.signature || "Satisfaction",
    notSelf: TYPES[type]?.notSelf || "Frustration",
    incarnationCross: determineCross(sunGate, earthGate, nodes),
    sunGate, earthGate, nodes,
    definedCenters: Object.entries(centerStates).filter(([, v]) => v).map(([k]) => k),
    undefinedCenters: Object.entries(centerStates).filter(([, v]) => !v).map(([k]) => k),
    definedChannels,
    allGates,
    centers: buildCenters(centerStates, allGates),
    variables: {
      digestion: determineVariable(hash, 0),
      environment: determineVariable(hash, 1),
      motivation: determineVariable(hash, 2),
      perspective: determineVariable(hash, 3)
    }
  };
}

export function chartToJSON(chart: HumanDesignChart): object {
  return {
    type: chart.type,
    authority: chart.authority,
    profile: chart.profile,
    definition: chart.definition,
    strategy: chart.strategy,
    signature: chart.signature,
    notSelf: chart.notSelf,
    incarnationCross: chart.incarnationCross,
    sunGate: chart.sunGate,
    earthGate: chart.earthGate,
    nodes: chart.nodes,
    definedCenters: chart.definedCenters,
    undefinedCenters: chart.undefinedCenters,
    definedChannels: chart.definedChannels.map(c => ({ name: c.name, gates: [c.gate1, c.gate2], circuit: c.circuit })),
    allGates: chart.allGates.map(g => ({ gate: g.gate, line: g.line, planet: g.planet, isDesign: g.isDesign })),
    variables: chart.variables
  };
}

export function chartToMarkdown(chart: HumanDesignChart): string {
  return `# Human Design Chart

## Core Identity
- **Type:** ${chart.type}
- **Strategy:** ${chart.strategy}
- **Authority:** ${chart.authority}
- **Profile:** ${chart.profile}
- **Definition:** ${chart.definition}
- **Signature:** ${chart.signature}
- **Not-Self:** ${chart.notSelf}

## Incarnation Cross
- **Cross:** ${chart.incarnationCross}
- **Sun Gate:** ${chart.sunGate} — ${GATES[chart.sunGate]?.name || "Unknown"}
- **Earth Gate:** ${chart.earthGate} — ${GATES[chart.earthGate]?.name || "Unknown"}

## Defined Centers (${chart.definedCenters.length})
${chart.definedCenters.map(c => `- **${CENTERS[c]?.name || c}**`).join("\n")}

## Undefined Centers (${chart.undefinedCenters.length})
${chart.undefinedCenters.map(c => `- **${CENTERS[c]?.name || c}**`).join("\n")}

## Defined Channels (${chart.definedChannels.length})
${chart.definedChannels.map(c => `- **${c.name}** (${c.gate1}-${c.gate2}) — ${c.circuit}`).join("\n")}

## Variables
- **Digestion:** ${chart.variables.digestion}
- **Environment:** ${chart.variables.environment}
- **Motivation:** ${chart.variables.motivation}
- **Perspective:** ${chart.variables.perspective}
`;
}

export default { calculateChart, chartFromDNA, chartToJSON, chartToMarkdown };
