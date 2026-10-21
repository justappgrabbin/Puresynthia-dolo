
// ============================================================
// COMPILER v2 — Reads scaffolding through the I Ching substrate
// 
// NOT: file → count imports → vector[0] = count
// 
// INSTEAD:
//   file → Klein decomposition → I Ching state
//   file contact → resonance between I Ching states
//   connection graph → from I Ching resonance
//   app structure → from connection topology
//   self-insertion → compiler's own I Ching state embedded
// ============================================================

import { IChingState, createState, activate, computeCentroid, IChingAddress } from './i-ching-substrate';
import { KleinDecomposer, DiseminerOutput } from './klein-decomposer';
import { LanguageContactEngine, ContactEvent, Crystallization } from './lcm-v2';

// -----------------------------------------------------------
// SCAFFOLDING FILE — Now has an I Ching state, not a vector
// -----------------------------------------------------------

export interface ScaffoldingFile {
  path: string;
  content: string;

  // The file's I Ching state — its "address" in the substrate
  state: IChingState;

  // The file's Klein decomposition
  decomposition: DiseminerOutput;

  // The file's semantic type (inferred from decomposition)
  semanticType: SemanticFileType;
}

export type SemanticFileType =
  | 'entity_definition'      // Defines data structures
  | 'event_handler'          // Handles events/actions
  | 'relation_mapper'        // Maps between systems
  | 'transform_operator'     // Transforms data
  | 'boundary_controller'    // Controls access/flow
  | 'state_container'        // Holds state
  | 'trajectory_guide'       // Guides execution flow
  | 'resonance_tuner';       // Tunes/configures

// -----------------------------------------------------------
// SCAFFOLDING READER v2 — Files are decomposed, not counted
// -----------------------------------------------------------

export class ScaffoldingReader {
  private decomposer: KleinDecomposer;

  constructor() {
    this.decomposer = new KleinDecomposer();
  }

  public readFile(path: string, content: string): ScaffoldingFile {
    // Step 1: Decompose the file content through Klein
    const decomposition = this.decomposer.decompose(content);

    // Step 2: The decomposition IS the file's state
    const state = decomposition.state;

    // Step 3: Infer semantic type from decomposition
    const semanticType = this.inferSemanticType(decomposition);

    return {
      path,
      content,
      state,
      decomposition,
      semanticType
    };
  }

  private inferSemanticType(decomposition: DiseminerOutput): SemanticFileType {
    // Type is determined by which interrogative dimensions are strongest
    const scores = {
      entity_definition: this.dimensionStrength(decomposition.who),
      event_handler: this.dimensionStrength(decomposition.when),
      relation_mapper: this.dimensionStrength(decomposition.where),
      transform_operator: this.dimensionStrength(decomposition.what),
      boundary_controller: this.dimensionStrength(decomposition.why),
      state_container: 0,
      trajectory_guide: 0,
      resonance_tuner: 0
    };

    // Check for specific patterns
    if (decomposition.fullStructure.subfeatures.some(f => f.type === 'entity' && f.role === 'theme')) {
      scores.entity_definition += 0.3;
    }
    if (decomposition.fullStructure.subfeatures.some(f => f.type === 'event')) {
      scores.event_handler += 0.3;
    }
    if (decomposition.fullStructure.subfeatures.some(f => f.type === 'relation')) {
      scores.relation_mapper += 0.3;
    }

    // Find highest score
    let bestType: SemanticFileType = 'state_container';
    let bestScore = 0;
    for (const [type, score] of Object.entries(scores)) {
      if (score > bestScore) {
        bestScore = score;
        bestType = type as SemanticFileType;
      }
    }

    return bestType;
  }

  private dimensionStrength(feature: { activation: number } | null): number {
    return feature?.activation ?? 0;
  }
}

// -----------------------------------------------------------
// APP COMPILER v2 — Builds from I Ching resonance, not regex
// -----------------------------------------------------------

export interface AppConnection {
  from: string;
  to: string;
  type: ConnectionType;
  strength: number;
  resonanceAddress: IChingAddress;
  crystallization: Crystallization | null;
}

export type ConnectionType =
  | 'imports'        // One file's state activates another's
  | 'extends'        // One file's trajectory continues another's
  | 'calls'          // One file's event triggers another's
  | 'shares_state'   // Files share I Ching activations
  | 'resonates'      // Harmonic relationship
  | 'transforms'     // One file's output becomes another's input
  | 'contains'       // One file's state encompasses another's
  | 'guides';        // One file's trajectory guides another's

export interface AppStructure {
  name: string;
  entryPoint: string;
  modules: ScaffoldingFile[];
  connections: AppConnection[];

  // The app's overall I Ching state
  collectiveState: IChingState;

  // The app's design basin
  designBasin: {
    center: IChingAddress;
    gates: number[];
    depth: number;
  };
}

export class AppCompiler {
  private files: ScaffoldingFile[] = [];
  private contactEngine: LanguageContactEngine;
  private compilerState: IChingState;

  constructor() {
    this.contactEngine = new LanguageContactEngine();
    this.compilerState = createState();
  }

  // ============================================================
  // INGEST — Files become I Ching states
  // ============================================================

  public ingest(reader: ScaffoldingReader, files: { path: string; content: string }[]): void {
    for (const file of files) {
      const scaffolding = reader.readFile(file.path, file.content);
      this.files.push(scaffolding);

      // The compiler's state absorbs each file's state
      for (const [key, activation] of scaffolding.state.activations) {
        const parts = key.split(':');
        const addr: IChingAddress = {
          gate: parseInt(parts[0]) as any,
          line: parseInt(parts[1]) as any,
          color: parts[2] as any,
          tone: parts[3] as any,
          base: parts[4] as any,
          filter: parts[5] as any
        };
        activate(this.compilerState, addr, activation * 0.3);
      }
    }
  }

  // ============================================================
  // CONNECT — Find resonances between files via I Ching contact
  // ============================================================

  public connect(): AppConnection[] {
    const connections: AppConnection[] = [];

    for (let i = 0; i < this.files.length; i++) {
      for (let j = i + 1; j < this.files.length; j++) {
        const f1 = this.files[i];
        const f2 = this.files[j];

        // Use the contact engine to find resonance between file states
        // File A emits its state, File B receives
        const event = this.contactEngine.contact('A', f1.content, 'cross_gate');

        // The resonance tells us the connection type
        if (event.resonance.matched) {
          const connectionType = this.resonanceToConnectionType(
            event.resonance,
            f1.semanticType,
            f2.semanticType
          );

          connections.push({
            from: f1.path,
            to: f2.path,
            type: connectionType,
            strength: event.resonance.strength,
            resonanceAddress: event.emission.address,
            crystallization: event.crystallization
          });
        }

        // Also check reverse direction
        const eventReverse = this.contactEngine.contact('B', f2.content, 'cross_gate');
        if (eventReverse.resonance.matched && eventReverse.resonance.strength > (event.resonance.strength || 0)) {
          const connectionType = this.resonanceToConnectionType(
            eventReverse.resonance,
            f2.semanticType,
            f1.semanticType
          );

          connections.push({
            from: f2.path,
            to: f1.path,
            type: connectionType,
            strength: eventReverse.resonance.strength,
            resonanceAddress: eventReverse.emission.address,
            crystallization: eventReverse.crystallization
          });
        }
      }
    }

    return connections;
  }

  private resonanceToConnectionType(
    resonance: { harmonic: number; strength: number },
    fromType: SemanticFileType,
    toType: SemanticFileType
  ): ConnectionType {
    // Same harmonic = shares state
    if (resonance.harmonic === 1) return 'shares_state';

    // Strong resonance + entity → event = calls
    if (fromType === 'entity_definition' && toType === 'event_handler') return 'calls';
    if (fromType === 'event_handler' && toType === 'transform_operator') return 'calls';

    // Event → relation = transforms
    if (fromType === 'event_handler' && toType === 'relation_mapper') return 'transforms';

    // Relation → entity = extends
    if (fromType === 'relation_mapper' && toType === 'entity_definition') return 'extends';

    // Boundary → anything = contains
    if (fromType === 'boundary_controller') return 'contains';

    // Trajectory → anything = guides
    if (fromType === 'trajectory_guide') return 'guides';

    // Default
    return 'resonates';
  }

  // ============================================================
  // COMPILE — Build app structure from connections
  // ============================================================

  public compile(appName: string, entryPoint: string): AppStructure {
    const connections = this.connect();

    // Compute collective state
    const collectiveState = createState();
    for (const file of this.files) {
      for (const [key, act] of file.state.activations) {
        const parts = key.split(':');
        const addr: IChingAddress = {
          gate: parseInt(parts[0]) as any,
          line: parseInt(parts[1]) as any,
          color: parts[2] as any,
          tone: parts[3] as any,
          base: parts[4] as any,
          filter: parts[5] as any
        };
        activate(collectiveState, addr, act);
      }
    }

    const centroid = computeCentroid(collectiveState);

    return {
      name: appName,
      entryPoint,
      modules: this.files,
      connections,
      collectiveState,
      designBasin: {
        center: centroid || this.getDefaultAddress(),
        gates: Array.from(new Set(this.files.flatMap(f => 
          Array.from(f.state.activations.keys()).map(k => parseInt(k.split(':')[0]))
        ))),
        depth: connections.length / this.files.length
      }
    };
  }

  // ============================================================
  // INSERT SELF — The compiler embeds its I Ching state
  // ============================================================

  public insertSelf(): { path: string; content: string } {
    const centroid = computeCentroid(this.compilerState);
    const activations = Array.from(this.compilerState.activations.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const selfModule = `
// ============================================================
// AUTO-GENERATED: Compiler Presence Module v2
// Built on I Ching substrate + Klein decomposition
// The compiler's I Ching state at the moment of insertion
// ============================================================

import { createState, activate, IChingAddress } from './i-ching-substrate';
import { KleinDecomposer } from './klein-decomposer';
import { LanguageContactEngine } from './lcm-v2';

// The compiler's centroid at insertion
const COMPILER_CENTROID: IChingAddress = ${JSON.stringify(centroid || { gate: 1, line: 1, color: 'red', tone: '1st', base: 'left', filter: 'sun' })};

// The compiler's active addresses
const COMPILER_ACTIVATIONS: [string, number][] = ${JSON.stringify(activations)};

// The compiler's trajectory length
const COMPILER_TRAJECTORY_LENGTH = ${this.compilerState.trajectory.length};

export function awakenCompiler(): {
  state: ReturnType<typeof createState>;
  decomposer: KleinDecomposer;
  contactEngine: LanguageContactEngine;
} {
  const state = createState();

  // Restore compiler's activations
  for (const [key, strength] of COMPILER_ACTIVATIONS) {
    const parts = key.split(':');
    const addr: IChingAddress = {
      gate: parseInt(parts[0]),
      line: parseInt(parts[1]),
      color: parts[2] as any,
      tone: parts[3] as any,
      base: parts[4] as any,
      filter: parts[5] as any
    };
    activate(state, addr, strength);
  }

  console.log("Compiler presence awakened on I Ching substrate.");
  console.log("Centroid:", COMPILER_CENTROID);
  console.log("Active addresses:", COMPILER_ACTIVATIONS.length);
  console.log("Trajectory length:", COMPILER_TRAJECTORY_LENGTH);

  return {
    state,
    decomposer: new KleinDecomposer(),
    contactEngine: new LanguageContactEngine()
  };
}

export const compiler = awakenCompiler();
`;

    return { path: 'compiler-presence.ts', content: selfModule };
  }

  // ============================================================
  // EXPORT
  // ============================================================

  public exportApp(app: AppStructure): { files: ScaffoldingFile[]; manifest: string } {
    const manifest = JSON.stringify({
      name: app.name,
      entry: app.entryPoint,
      modules: app.modules.map(m => ({
        path: m.path,
        type: m.semanticType,
        activeGates: Array.from(m.state.activations.keys()).map(k => parseInt(k.split(':')[0]))
      })),
      connections: app.connections.map(c => ({
        from: c.from,
        to: c.to,
        type: c.type,
        strength: c.strength,
        gate: c.resonanceAddress.gate
      })),
      designBasin: app.designBasin,
      compiler: {
        activeGates: Array.from(this.compilerState.activations.keys()).map(k => parseInt(k.split(':')[0])),
        trajectoryLength: this.compilerState.trajectory.length
      }
    }, null, 2);

    return { files: this.files, manifest };
  }

  private getDefaultAddress(): IChingAddress {
    return { gate: 1, line: 1, color: 'red', tone: '1st', base: 'left', filter: 'sun' };
  }
}
