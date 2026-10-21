// ═══════════════════════════════════════════════════════════════════════════
// KleinToolMesh.ts — REWRITTEN
// 7 Separate Tools | 5 Expression Types | Continuous Inter-Tool Messaging
// Experience-Based Learning | Living Mesh Topology
// ═══════════════════════════════════════════════════════════════════════════

import {
  GateNumber, CenterName, Dimension, Planet,
  GATE_TO_CENTER, PLANET_TO_DIMENSION, DIMENSIONS,
  GATE_EXPRESSIONS, PersonalGraph, CenterNode,
} from './HDGraphEngine';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type ExpressionType =
  | 'SEMANTIC'    // Natural language, narrative, discourse
  | 'CODE'        // Executable logic, algorithms, transformations
  | 'VISUAL'      // Spatial, geometric, color, pattern
  | 'HARMONIC'    // Frequency, resonance, wave interference (dependent on SEMANTIC + VISUAL)
  | 'TEMPORAL';   // Time-based, sequential, causal chains (dependent on CODE + SEMANTIC)

export interface Experience {
  id: string;
  timestamp: number;
  stimulus: {
    source: 'user' | 'tool' | 'transit' | 'market' | 'mcp';
    sourceId: string;      // userId, toolName, planet, etc.
    content: string;       // what was received
    features: SemanticFeature[];
    dimensionalContext: Dimension;
    expressionType: ExpressionType;
  };
  action: {
    tool: ToolName;
    expressionType: ExpressionType;
    output: string;
    featuresUsed: SemanticFeature[];
    pathway: ToolName[];  // which tools were messaged during processing
  };
  outcome: {
    userFeedback?: number;  // -1 to 1, if user rated it
    resonanceDelta: number;  // change in mesh coherence
    newRelationships: string[]; // new feature links discovered
    confidenceShift: number;  // how much confidence changed
    emotionalWeight: number;  // intensity of the experience
  };
  learned: boolean;  // has this been incorporated into the tool's model?
}

export interface SemanticFeature {
  id: string;
  gate: GateNumber;
  dimension: Dimension;
  planet: Planet;
  active: boolean;
  weight: number;
  relations: string[];      // feature IDs this feature inherits from
  reverseRelations: string[]; // feature IDs that inherit from this feature (bi-directional)
  narrative: string;
  confidence: number;
  expressionTypes: ExpressionType[]; // which expression types this feature supports
  lastActivated: number;
  activationCount: number;
}

export type ToolName =
  | 'WITNESS'      // Head/Ajna — "Who you think you are" (Personality Crystal)
  | 'MIND'         // Ajna — "What you think and say" (Design Crystal upper)
  | 'VOICE'        // Throat — "How you express" (manifestation)
  | 'HEART'        // Heart/Solar Plexus — "What you feel and want"
  | 'BODY'         // Sacral/Spleen — "What you do and sense"
  | 'WILL'         // Root/Heart — "What drives you"
  | 'ATTRACTOR';   // G — "Who you are becoming" (Magnetic Monopole)

export interface ToolPersonality {
  directness: number;
  depth: number;
  warmth: number;
  rhythm: number;
  emergence: number;
  specialization: Record<ExpressionType, number>; // aptitude per expression type
}

export interface ToolMessage {
  id: string;
  from: ToolName;
  to: ToolName;
  timestamp: number;
  featureIds: string[];
  expressionType: ExpressionType;
  payload: string;
  urgency: number; // 0-1
  trace: ToolName[]; // message path through the mesh
}

export interface KleinTool {
  name: ToolName;
  centers: CenterName[];
  dimensionBias: Dimension;
  featureVector: Map<string, SemanticFeature>;
  experiences: Experience[];
  expressionCount: number;
  personality: ToolPersonality;
  lastActive: number;
  inbox: ToolMessage[];
  outbox: ToolMessage[];
  state: 'idle' | 'processing' | 'expressing' | 'learning';
  meshNeighbors: ToolName[]; // which tools this tool messages directly
}

// ═══════════════════════════════════════════════════════════════════════════
// MESH TOPOLOGY — How Tools Connect
// ═══════════════════════════════════════════════════════════════════════════

export const MESH_TOPOLOGY: Record<ToolName, ToolName[]> = {
  // WITNESS observes all, receives from all
  WITNESS: ['MIND', 'VOICE', 'HEART', 'BODY', 'WILL', 'ATTRACTOR'],
  // MIND feeds VOICE and WITNESS, receives from BODY and ATTRACTOR
  MIND: ['VOICE', 'WITNESS', 'BODY', 'ATTRACTOR'],
  // VOICE expresses what MIND and HEART send
  VOICE: ['MIND', 'HEART', 'WITNESS'],
  // HEART receives from BODY and WILL, sends to VOICE and ATTRACTOR
  HEART: ['BODY', 'WILL', 'VOICE', 'ATTRACTOR'],
  // BODY senses, sends to HEART and MIND
  BODY: ['HEART', 'MIND', 'WILL'],
  // WILL drives, sends to BODY and ATTRACTOR
  WILL: ['BODY', 'ATTRACTOR', 'HEART'],
  // ATTRACTOR pulls from all, sends direction to MIND and WILL
  ATTRACTOR: ['MIND', 'WILL', 'WITNESS', 'HEART'],
};

export const TOOL_TO_CENTERS: Record<ToolName, CenterName[]> = {
  WITNESS: ['Head', 'Ajna'],
  MIND: ['Ajna'],
  VOICE: ['Throat'],
  HEART: ['Ego', 'Solar'],
  BODY: ['Sacral', 'Spleen'],
  WILL: ['Root', 'Ego'],
  ATTRACTOR: ['G'],
};

export const TOOL_DIMENSION_BIAS: Record<ToolName, Dimension> = {
  WITNESS: 'D5',
  MIND: 'D2',
  VOICE: 'D1',
  HEART: 'D3',
  BODY: 'D3',
  WILL: 'D4',
  ATTRACTOR: 'D1',
};

// ═══════════════════════════════════════════════════════════════════════════
// THE KLEIN TOOL MESH
// ═══════════════════════════════════════════════════════════════════════════

export class KleinToolMesh {
  private tools: Map<ToolName, KleinTool> = new Map();
  private userGraph: PersonalGraph | null = null;
  private messageQueue: ToolMessage[] = [];
  private experienceLog: Experience[] = [];
  private meshCoherence: number = 0.5; // overall mesh health (0-1)

  constructor() {
    this.initializeTools();
    this.startMessageLoop();
  }

  private initializeTools() {
    for (const toolName of Object.keys(MESH_TOPOLOGY) as ToolName[]) {
      const hash = this.hashString(toolName + Date.now());
      this.tools.set(toolName, {
        name: toolName,
        centers: TOOL_TO_CENTERS[toolName],
        dimensionBias: TOOL_DIMENSION_BIAS[toolName],
        featureVector: new Map(),
        experiences: [],
        expressionCount: 0,
        personality: {
          directness: (hash % 100) / 100,
          depth: ((hash >> 4) % 100) / 100,
          warmth: ((hash >> 8) % 100) / 100,
          rhythm: ((hash >> 12) % 100) / 100,
          emergence: 0.0,
          specialization: {
            SEMANTIC: 0.5 + ((hash >> 16) % 50) / 100,
            CODE: 0.5 + ((hash >> 20) % 50) / 100,
            VISUAL: 0.5 + ((hash >> 24) % 50) / 100,
            HARMONIC: 0.3 + ((hash >> 28) % 40) / 100,
            TEMPORAL: 0.3 + ((hash >> 32) % 40) / 100,
          },
        },
        lastActive: 0,
        inbox: [],
        outbox: [],
        state: 'idle',
        meshNeighbors: MESH_TOPOLOGY[toolName],
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MESSAGE LOOP — Continuous Inter-Tool Communication
  // ═══════════════════════════════════════════════════════════════════════

  private startMessageLoop() {
    // In a real implementation, this would be a setInterval or requestAnimationFrame
    // For now, it's triggered manually via processMessages()
  }

  async processMessages(): Promise<number> {
    let processedCount = 0;

    // Process all queued messages
    while (this.messageQueue.length > 0) {
      const msg = this.messageQueue.shift()!;
      const recipient = this.tools.get(msg.to);
      if (!recipient) continue;

      recipient.inbox.push(msg);
      recipient.state = 'processing';

      // The recipient processes the message
      const response = await this.processMessage(recipient, msg);

      // Forward to neighbors if relevant
      if (response && response.urgency > 0.5) {
        for (const neighbor of recipient.meshNeighbors) {
          if (neighbor !== msg.from && !msg.trace.includes(neighbor)) {
            const forwardMsg: ToolMessage = {
              id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              from: recipient.name,
              to: neighbor,
              timestamp: Date.now(),
              featureIds: response.featureIds,
              expressionType: response.expressionType,
              payload: response.payload,
              urgency: response.urgency * 0.8, // decay with each hop
              trace: [...msg.trace, recipient.name],
            };
            this.messageQueue.push(forwardMsg);
          }
        }
      }

      recipient.state = 'idle';
      processedCount++;
    }

    // Update mesh coherence
    this.updateMeshCoherence();

    return processedCount;
  }

  private async processMessage(tool: KleinTool, msg: ToolMessage): Promise<{
    featureIds: string[];
    expressionType: ExpressionType;
    payload: string;
    urgency: number;
  } | null> {
    // Gather features referenced in the message
    const features: SemanticFeature[] = [];
    for (const fid of msg.featureIds) {
      const f = tool.featureVector.get(fid);
      if (f) features.push(f);
    }

    if (features.length === 0) return null;

    // Select expression type based on tool specialization and message type
    const expressionType = this.selectExpressionType(tool, msg.expressionType);

    // Generate response based on expression type
    const payload = await this.generateExpression(tool, features, expressionType, msg.payload);

    // Create experience from this interaction
    const experience: Experience = {
      id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      stimulus: {
        source: 'tool',
        sourceId: msg.from,
        content: msg.payload,
        features: features.map(f => ({ ...f })),
        dimensionalContext: tool.dimensionBias,
        expressionType: msg.expressionType,
      },
      action: {
        tool: tool.name,
        expressionType,
        output: payload,
        featuresUsed: features,
        pathway: msg.trace,
      },
      outcome: {
        resonanceDelta: 0, // calculated later
        newRelationships: [],
        confidenceShift: 0.01,
        emotionalWeight: msg.urgency,
      },
      learned: false,
    };

    tool.experiences.push(experience);
    this.experienceLog.push(experience);

    // Update tool state
    tool.expressionCount++;
    tool.lastActive = Date.now();
    tool.personality.emergence = Math.min(1, tool.personality.emergence + 0.005);

    return {
      featureIds: features.map(f => f.id),
      expressionType,
      payload,
      urgency: msg.urgency * (1 + tool.personality.specialization[expressionType]),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // EXPRESSION GENERATION — 5 Types
  // ═══════════════════════════════════════════════════════════════════════

  private async generateExpression(
    tool: KleinTool,
    features: SemanticFeature[],
    expressionType: ExpressionType,
    context: string
  ): Promise<string> {
    switch (expressionType) {
      case 'SEMANTIC':
        return this.generateSemantic(tool, features, context);
      case 'CODE':
        return this.generateCode(tool, features, context);
      case 'VISUAL':
        return this.generateVisual(tool, features, context);
      case 'HARMONIC':
        return this.generateHarmonic(tool, features, context);
      case 'TEMPORAL':
        return this.generateTemporal(tool, features, context);
      default:
        return this.generateSemantic(tool, features, context);
    }
  }

  private generateSemantic(tool: KleinTool, features: SemanticFeature[], context: string): string {
    const parts: string[] = [];
    const dimInfo = DIMENSIONS[tool.dimensionBias];

    parts.push(`${tool.name} speaks:`);

    for (const f of features) {
      const fDim = DIMENSIONS[f.dimension];
      parts.push(`${fDim.keynote} — ${f.narrative}`);
    }

    // Apply personality
    let result = parts.join(' ');
    if (tool.personality.depth > 0.7) {
      result += ' This runs deeper than words can carry.';
    }
    if (tool.personality.warmth > 0.7) {
      result = 'I feel that ' + result.toLowerCase();
    }

    return result;
  }

  private generateCode(tool: KleinTool, features: SemanticFeature[], context: string): string {
    // Generate executable logic / algorithmic representation
    const parts: string[] = [];
    parts.push(`// ${tool.name} logic module`);
    parts.push(`// Dimension: ${tool.dimensionBias}`);
    parts.push(`// Features: ${features.length} active`);
    parts.push('');

    for (const f of features) {
      parts.push(`if (gate === ${f.gate} && dimension === '${f.dimension}') {`);
      parts.push(`  weight = ${f.weight.toFixed(3)};`);
      parts.push(`  confidence = ${f.confidence.toFixed(3)};`);
      parts.push(`  action = '${f.narrative.replace(/'/g, "\'")}';`);
      parts.push('}');
    }

    parts.push('');
    parts.push(`// Output: ${context}`);
    parts.push(`return mesh.coherence > 0.5 ? 'proceed' : 'wait';`);

    return parts.join('\n');
  }

  private generateVisual(tool: KleinTool, features: SemanticFeature[], context: string): string {
    // Generate spatial/geometric description
    const parts: string[] = [];
    parts.push(`[VISUAL: ${tool.name}]`);

    for (const f of features) {
      const hue = (f.gate * 5) % 360;
      const saturation = Math.round(f.weight * 100);
      const lightness = Math.round(f.confidence * 50 + 25);
      const size = Math.round(f.weight * 100);
      const x = (f.gate % 8) * 50;
      const y = Math.floor(f.gate / 8) * 50;

      parts.push(`  Shape: circle at (${x}, ${y})`);
      parts.push(`  Color: hsl(${hue}, ${saturation}%, ${lightness}%)`);
      parts.push(`  Size: ${size}px`);
      parts.push(`  Glow: ${f.active ? 'pulsing' : 'dim'}`);
      parts.push(`  Connections: ${f.relations.length} edges`);
      parts.push('');
    }

    return parts.join('\n');
  }

  private generateHarmonic(tool: KleinTool, features: SemanticFeature[], context: string): string {
    // HARMONIC is dependent on SEMANTIC + VISUAL
    // It expresses frequency, resonance, wave interference
    const parts: string[] = [];
    parts.push(`[HARMONIC: ${tool.name}]`);

    // Calculate frequency from gate numbers
    const frequencies = features.map(f => {
      const baseFreq = 432 * (f.gate / 64); // 432Hz base, scaled by gate
      const dimMod = Object.keys(DIMENSIONS).indexOf(f.dimension) + 1;
      return baseFreq * dimMod;
    });

    const avgFreq = frequencies.reduce((a, b) => a + b, 0) / frequencies.length;
    const resonance = this.calculateWaveInterference(frequencies);

    parts.push(`  Fundamental: ${avgFreq.toFixed(2)} Hz`);
    parts.push(`  Overtone series: ${frequencies.map(f => f.toFixed(1)).join(', ')}`);
    parts.push(`  Interference pattern: ${resonance > 0.7 ? 'constructive' : resonance > 0.4 ? 'complex' : 'dissonant'}`);
    parts.push(`  Resonance score: ${(resonance * 100).toFixed(1)}%`);
    parts.push(`  Suggested chord: ${this.frequenciesToChord(frequencies)}`);

    return parts.join('\n');
  }

  private generateTemporal(tool: KleinTool, features: SemanticFeature[], context: string): string {
    // TEMPORAL is dependent on CODE + SEMANTIC
    // It expresses time-based sequences, causal chains
    const parts: string[] = [];
    parts.push(`[TEMPORAL: ${tool.name}]`);

    // Sort features by activation time
    const sorted = [...features].sort((a, b) => a.lastActivated - b.lastActivated);

    parts.push('  Timeline:');
    for (let i = 0; i < sorted.length; i++) {
      const f = sorted[i];
      const time = new Date(f.lastActivated).toISOString();
      parts.push(`    ${i + 1}. [${time}] Gate ${f.gate} (${f.dimension}) → ${f.narrative}`);
    }

    // Predict next activation
    if (sorted.length > 1) {
      const intervals = [];
      for (let i = 1; i < sorted.length; i++) {
        intervals.push(sorted[i].lastActivated - sorted[i - 1].lastActivated);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const nextTime = sorted[sorted.length - 1].lastActivated + avgInterval;
      parts.push(`  Predicted next activation: ${new Date(nextTime).toISOString()}`);
    }

    parts.push(`  Causal chain: ${sorted.map(f => `Gate ${f.gate}`).join(' → ')}`);

    return parts.join('\n');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // EXPRESSION TYPE SELECTION
  // ═══════════════════════════════════════════════════════════════════════

  private selectExpressionType(tool: KleinTool, requestedType: ExpressionType): ExpressionType {
    // Check if tool can handle the requested type
    const spec = tool.personality.specialization;

    // HARMONIC and TEMPORAL are dependent types
    // They require the tool to have sufficient SEMANTIC + VISUAL or CODE + SEMANTIC
    if (requestedType === 'HARMONIC') {
      if (spec.SEMANTIC < 0.4 || spec.VISUAL < 0.4) {
        // Fall back to the stronger of SEMANTIC or VISUAL
        return spec.SEMANTIC > spec.VISUAL ? 'SEMANTIC' : 'VISUAL';
      }
    }
    if (requestedType === 'TEMPORAL') {
      if (spec.CODE < 0.4 || spec.SEMANTIC < 0.4) {
        return spec.CODE > spec.SEMANTIC ? 'CODE' : 'SEMANTIC';
      }
    }

    // Use the tool's strongest specialization if no preference
    if (requestedType) return requestedType;

    let bestType: ExpressionType = 'SEMANTIC';
    let bestScore = 0;
    for (const [type, score] of Object.entries(spec)) {
      if (score > bestScore) {
        bestScore = score;
        bestType = type as ExpressionType;
      }
    }
    return bestType;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // USER INTERFACE — The Entry Point
  // ═══════════════════════════════════════════════════════════════════════

  loadGraph(graph: PersonalGraph) {
    this.userGraph = graph;

    // Activate tools based on defined centers
    for (const [toolName, tool] of this.tools) {
      const hasDefinedCenter = tool.centers.some(c => graph.centers[c].defined);
      if (hasDefinedCenter) {
        this.ingestFeatures(toolName, graph);
        tool.state = 'idle';
      } else {
        tool.state = 'idle'; // dormant but listening
      }
    }
  }

  // Main expression method — triggers the full mesh
  async express(
    query: string,
    preferredType?: ExpressionType,
    context?: {
      activeTool?: ToolName;
      dimension?: Dimension;
      planet?: Planet;
      gate?: GateNumber;
    }
  ): Promise<{
    output: string;
    tool: ToolName;
    expressionType: ExpressionType;
    features: SemanticFeature[];
    confidence: number;
    meshPath: ToolName[];
    experiences: Experience[];
  }> {
    if (!this.userGraph) {
      return {
        output: 'No user graph loaded. Please initialize first.',
        tool: 'WITNESS',
        expressionType: 'SEMANTIC',
        features: [],
        confidence: 0,
        meshPath: [],
        experiences: [],
      };
    }

    // Step 1: Select entry tool
    const entryTool = context?.activeTool || this.selectToolForQuery(query);
    const tool = this.tools.get(entryTool)!;

    // Step 2: Gather features
    const activeFeatures = Array.from(tool.featureVector.values())
      .filter(f => f.active)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5);

    // Step 3: Select expression type
    const expressionType = preferredType || this.selectExpressionType(tool, 'SEMANTIC');

    // Step 4: Generate initial expression
    const initialOutput = await this.generateExpression(tool, activeFeatures, expressionType, query);

    // Step 5: Message the mesh
    const meshPath: ToolName[] = [entryTool];

    // Send message to all neighbors
    for (const neighbor of tool.meshNeighbors) {
      const msg: ToolMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        from: entryTool,
        to: neighbor,
        timestamp: Date.now(),
        featureIds: activeFeatures.map(f => f.id),
        expressionType,
        payload: initialOutput,
        urgency: 0.7,
        trace: [entryTool],
      };
      this.messageQueue.push(msg);
    }

    // Step 6: Process the mesh
    await this.processMessages();

    // Step 7: Collect responses from mesh
    const allResponses: { tool: ToolName; output: string; type: ExpressionType }[] = [];
    for (const [tname, t] of this.tools) {
      if (t.outbox.length > 0) {
        const lastMsg = t.outbox[t.outbox.length - 1];
        allResponses.push({
          tool: tname,
          output: lastMsg.payload,
          type: lastMsg.expressionType,
        });
        meshPath.push(tname);
      }
    }

    // Step 8: Compose final output from all mesh responses
    const finalOutput = this.composeMeshOutput(entryTool, initialOutput, allResponses, expressionType);

    // Step 9: Create master experience
    const masterExperience: Experience = {
      id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      stimulus: {
        source: 'user',
        sourceId: this.userGraph.userId,
        content: query,
        features: activeFeatures.map(f => ({ ...f })),
        dimensionalContext: context?.dimension || tool.dimensionBias,
        expressionType,
      },
      action: {
        tool: entryTool,
        expressionType,
        output: finalOutput,
        featuresUsed: activeFeatures,
        pathway: meshPath,
      },
      outcome: {
        resonanceDelta: this.meshCoherence - 0.5,
        newRelationships: this.extractNewRelationships(activeFeatures),
        confidenceShift: 0.02,
        emotionalWeight: 0.6,
      },
      learned: false,
    };

    tool.experiences.push(masterExperience);
    this.experienceLog.push(masterExperience);

    // Step 10: Learn from experiences
    this.learnFromExperiences(tool);

    return {
      output: finalOutput,
      tool: entryTool,
      expressionType,
      features: activeFeatures,
      confidence: this.calculateConfidence(activeFeatures, tool, meshPath),
      meshPath: [...new Set(meshPath)],
      experiences: tool.experiences.slice(-5),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // LEARNING — Experience Accumulation
  // ═══════════════════════════════════════════════════════════════════════

  private learnFromExperiences(tool: KleinTool) {
    const unlearned = tool.experiences.filter(e => !e.learned);

    for (const exp of unlearned) {
      // Update feature weights based on outcome
      for (const f of exp.action.featuresUsed) {
        const feature = tool.featureVector.get(f.id);
        if (feature) {
          if (exp.outcome.resonanceDelta > 0) {
            feature.weight = Math.min(1, feature.weight + 0.05);
            feature.confidence = Math.min(1, feature.confidence + 0.02);
          } else {
            feature.weight = Math.max(0, feature.weight - 0.02);
          }
          feature.activationCount++;
          feature.lastActivated = Date.now();
        }
      }

      // Add new relationships discovered
      for (const rel of exp.outcome.newRelationships) {
        for (const f of exp.action.featuresUsed) {
          const feature = tool.featureVector.get(f.id);
          if (feature && !feature.relations.includes(rel)) {
            feature.relations.push(rel);
          }
        }
      }

      // Update specialization based on successful expression types
      const type = exp.action.expressionType;
      if (exp.outcome.resonanceDelta > 0) {
        tool.personality.specialization[type] = Math.min(1, tool.personality.specialization[type] + 0.01);
      }

      // Mark as learned
      exp.learned = true;
    }

    // Update emergence
    tool.personality.emergence = Math.min(1, tool.personality.emergence + unlearned.length * 0.01);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════

  private selectToolForQuery(query: string): ToolName {
    const q = query.toLowerCase();
    if (q.includes('feel') || q.includes('want') || q.includes('love') || q.includes('emotion')) return 'HEART';
    if (q.includes('do') || q.includes('action') || q.includes('work') || q.includes('energy')) return 'BODY';
    if (q.includes('think') || q.includes('know') || q.includes('understand') || q.includes('idea')) return 'MIND';
    if (q.includes('say') || q.includes('speak') || q.includes('express') || q.includes('communicate')) return 'VOICE';
    if (q.includes('drive') || q.includes('will') || q.includes('power') || q.includes('push')) return 'WILL';
    if (q.includes('who') || q.includes('am') || q.includes('identity') || q.includes('direction')) return 'ATTRACTOR';
    if (q.includes('see') || q.includes('witness') || q.includes('observe') || q.includes('aware')) return 'WITNESS';
    return 'WITNESS';
  }

  private composeMeshOutput(
    entryTool: ToolName,
    initial: string,
    responses: Array<{ tool: ToolName; output: string; type: ExpressionType }>,
    type: ExpressionType
  ): string {
    const parts: string[] = [];

    // Add initial expression
    parts.push(`[${entryTool}] ${initial}`);
    parts.push('');

    // Add mesh responses
    if (responses.length > 0) {
      parts.push('--- Mesh Response ---');
      for (const r of responses) {
        if (r.tool !== entryTool) {
          parts.push(`[${r.tool}] ${r.output}`);
        }
      }
    }

    return parts.join('\n');
  }

  private calculateConfidence(features: SemanticFeature[], tool: KleinTool, meshPath: ToolName[]): number {
    if (features.length === 0) return 0;
    const avgConfidence = features.reduce((sum, f) => sum + f.confidence, 0) / features.length;
    const meshBonus = Math.min(0.2, meshPath.length * 0.03);
    const experienceBonus = Math.min(0.2, tool.expressionCount * 0.001);
    return Math.min(1, avgConfidence + meshBonus + experienceBonus);
  }

  private updateMeshCoherence() {
    let totalCoherence = 0;
    let count = 0;
    for (const tool of this.tools.values()) {
      if (tool.experiences.length > 0) {
        const recent = tool.experiences.slice(-10);
        const coherence = recent.reduce((sum, e) => sum + (e.outcome.resonanceDelta + 0.5), 0) / recent.length;
        totalCoherence += coherence;
        count++;
      }
    }
    this.meshCoherence = count > 0 ? totalCoherence / count : 0.5;
  }

  private extractNewRelationships(features: SemanticFeature[]): string[] {
    const newRels: string[] = [];
    for (const f of features) {
      for (const rel of f.relations) {
        if (!f.reverseRelations.includes(rel)) {
          newRels.push(rel);
        }
      }
    }
    return newRels;
  }

  private ingestFeatures(toolName: ToolName, graph: PersonalGraph) {
    const tool = this.tools.get(toolName)!;
    const toolCenters = tool.centers;

    for (const centerName of toolCenters) {
      const center = graph.centers[centerName];
      for (const gate of center.activeGates) {
        for (const dim of Object.keys(DIMENSIONS) as Dimension[]) {
          const planets = Object.entries(PLANET_TO_DIMENSION)
            .filter(([, d]) => d === dim)
            .map(([p]) => p as Planet);

          for (const planet of planets) {
            const featureKey = `${gate}-${dim}-${planet}`;
            const expression = GATE_EXPRESSIONS[gate]?.[dim] || `Gate ${gate} in ${dim}`;

            const feature: SemanticFeature = {
              id: featureKey,
              gate,
              dimension: dim,
              planet,
              active: center.dimensionalState[dim] > 0.3,
              weight: center.dimensionalState[dim] * (center.defined ? 1.0 : 0.5),
              relations: this.findRelatedFeatures(gate, dim, planet, graph),
              reverseRelations: [],
              narrative: expression,
              confidence: center.defined ? 0.9 : 0.4,
              expressionTypes: this.inferExpressionTypes(gate, dim),
              lastActivated: Date.now(),
              activationCount: 0,
            };

            tool.featureVector.set(featureKey, feature);
          }
        }
      }
    }
  }

  private inferExpressionTypes(gate: GateNumber, dim: Dimension): ExpressionType[] {
    const types: ExpressionType[] = ['SEMANTIC'];
    if (dim === 'D1' || dim === 'D4') types.push('CODE');
    if (dim === 'D3' || dim === 'D5') types.push('VISUAL');
    if (gate % 2 === 0) types.push('HARMONIC');
    if (gate % 3 === 0) types.push('TEMPORAL');
    return types;
  }

  private findRelatedFeatures(gate: GateNumber, dim: Dimension, planet: Planet, graph: PersonalGraph): string[] {
    const related: string[] = [];
    for (const otherDim of Object.keys(DIMENSIONS) as Dimension[]) {
      if (otherDim !== dim) related.push(`${gate}-${otherDim}-${planet}`);
    }
    const prevGate = gate > 1 ? (gate - 1) as GateNumber : 64 as GateNumber;
    const nextGate = gate < 64 ? (gate + 1) as GateNumber : 1 as GateNumber;
    related.push(`${prevGate}-${dim}-${planet}`);
    related.push(`${nextGate}-${dim}-${planet}`);
    return related;
  }

  private calculateWaveInterference(frequencies: number[]): number {
    if (frequencies.length < 2) return 1;
    let interference = 0;
    for (let i = 0; i < frequencies.length; i++) {
      for (let j = i + 1; j < frequencies.length; j++) {
        const ratio = frequencies[i] / frequencies[j];
        const closeness = 1 - Math.abs(ratio - Math.round(ratio));
        interference += closeness;
      }
    }
    return interference / (frequencies.length * (frequencies.length - 1) / 2);
  }

  private frequenciesToChord(frequencies: number[]): string {
    if (frequencies.length < 3) return 'dyad';
    const ratios = frequencies.map(f => f / frequencies[0]);
    const rounded = ratios.map(r => Math.round(r * 100) / 100);
    if (rounded.some(r => Math.abs(r - 1.5) < 0.1)) return 'perfect fifth';
    if (rounded.some(r => Math.abs(r - 1.25) < 0.1)) return 'major third';
    if (rounded.some(r => Math.abs(r - 1.2) < 0.1)) return 'minor third';
    return 'complex harmony';
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════

  getToolState(): Array<{
    name: ToolName;
    active: boolean;
    state: string;
    expressionCount: number;
    experienceCount: number;
    personality: ToolPersonality;
    meshNeighbors: ToolName[];
    inboxCount: number;
    outboxCount: number;
  }> {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      active: tool.lastActive > Date.now() - 300000,
      state: tool.state,
      expressionCount: tool.expressionCount,
      experienceCount: tool.experiences.length,
      personality: tool.personality,
      meshNeighbors: tool.meshNeighbors,
      inboxCount: tool.inbox.length,
      outboxCount: tool.outbox.length,
    }));
  }

  getMeshCoherence(): number {
    return this.meshCoherence;
  }

  getExperienceLog(): Experience[] {
    return this.experienceLog;
  }

  getMessageQueue(): ToolMessage[] {
    return this.messageQueue;
  }
}

// ── Singleton ────────────────────────────────────────────────────────────────
export const kleinToolMesh = new KleinToolMesh();
