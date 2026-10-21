/**
 * UNIFIED TRIPLE SCHEMA v1.0
 * Canonical contract for all MESSY Modern surfaces.
 * Every component (JS, Python, React, Shadow DOM) must implement this exactly.
 * 
 * Derived from:
 * - Klein 1976 MESSY Manual (rv, h, created, deleted, STIME)
 * - MESSY Modern spatial extensions (position, velocity, archetype)
 * - Self-modification requirements (source, version, checksum)
 */

// ============================================================
// CORE TYPES
// ============================================================

export type Archetype = 
  | "STRUCTURAL_GATE"   // Classes, components, types
  | "FUNCTIONAL_VECTOR" // Functions, methods, routines  
  | "ATOMIC_SIGNAL"     // Variables, constants, literals
  | "META";             // System-describing triples

export type Surface = 
  | "frontend"    // Browser Three.js visualization
  | "backend"     // Python FastAPI server
  | "ingestor"    // Paper Kernel file parser
  | "selfmod"     // SelfModificationController
  | "neural"      // experimental_neural_v2
  | "user";       // Human assertion

export type TripleOp = 
  | "ASSERT"   // New triple entering mesh
  | "NEGATE"   // Triple marked deleted
  | "MODIFY";  // Triple value changed

// ============================================================
// UNIFIED TRIPLE
// ============================================================

export interface UnifiedTriple {
  // Core identity (Klein 1976 subject-relation-object)
  subject: string;
  relation: string;
  object: string | null;

  // Historical parameters (Klein 1976, MESSY manual pp. 276-290)
  rv: number;        // Reality Value [0.0, 1.0]. 1.0 = absolute truth
  h: number;         // Frequency/Probability [0.0, 1.0]. Rule activation weight
  value: number;     // Scalar magnitude (strength, intensity, count)

  // Temporal tracking (Klein 1976 DUR function)
  created: number;    // STIME when triple entered network
  deleted: number | null;  // STIME when triple left (null = active)

  // Spatial parameters (MESSY Modern extension)
  position: [number, number, number];  // 3D coordinates
  velocity: [number, number, number];  // Current velocity vector

  // Metadata (extensible but validated)
  archetype: Archetype;
  source: Surface;
  version: number;    // Schema version for migration
}

// ============================================================
// RELATION REGISTRY
// ============================================================

export interface RelationPhysics {
  length: number;      // Target distance in 3D space
  stiffness: number;   // Spring constant (Hooke's law)
  transitive: boolean; // Whether relation propagates through intermediaries
  maxDistance: number; // Maximum effective distance (beyond = no force)
  minDistance: number; // Minimum effective distance (prevents singularity)
}

export interface RelationRegistry {
  [relation: string]: RelationPhysics;
}

// ============================================================
// NODE
// ============================================================

export interface UnifiedNode {
  id: string;
  position: [number, number, number];
  velocity: [number, number, number];
  mass: number;       // Inertial mass for physics
  charge: number;     // Electric charge for repulsion
  archetype: Archetype;
  traits: Record<string, unknown>;
}

// ============================================================
// MESH STATE
// ============================================================

export interface MeshState {
  triples: UnifiedTriple[];
  nodes: Map<string, UnifiedNode>;
  relations: RelationRegistry;
  stime: number;      // Simulation time (monotonic, Klein 1976)
  version: number;    // State version for sync
  checksum: string;   // Hash of triples for integrity verification
}

// ============================================================
// SYNC PROTOCOL
// ============================================================

export type SyncType = "SYNC" | "DELTA" | "FULL" | "ACK" | "ERROR";

export interface TripleDelta {
  op: TripleOp;
  triple: UnifiedTriple;
  priorChecksum?: string;  // For conflict detection
}

export interface MeshSyncMessage {
  type: SyncType;
  sequence: number;     // Monotonic sequence number
  timestamp: number;      // Wall-clock time (not STIME)
  stime: number;         // Simulation time at sender
  payload: {
    triples?: UnifiedTriple[];
    deltas?: TripleDelta[];
    checksum?: string;
    error?: string;
  };
  surface: Surface;
}

// ============================================================
// VALIDATION RESULTS
// ============================================================

export interface ValidationResult {
  valid: boolean;
  stage: string;         // Which validator caught it
  violations: string[];
  confidence: number;
  recommendation: "approve" | "reject" | "retry";
}

// ============================================================
// DEFAULT VALUES (Klein 1976 defaults)
// ============================================================

export const DEFAULTS = {
  RV: 1.0,           // Assume true until proven otherwise
  H: 1.0,            // Assume frequent until measured
  STIME: 0.0,        // Start at simulation epoch
  SCHEMA_VERSION: 1, // Current schema version
  MASS: 1.5,         // Default node mass
  CHARGE: 0.0,       // Neutral by default
  DAMPING: 0.9,      // Velocity decay per step
  DT: 0.016,         // 60fps timestep
  REPULSION: 100.0,  // Node-node repulsion strength
} as const;

// ============================================================
// RELATION PHYSICS DEFAULTS
// ============================================================

export const RELATION_DEFAULTS: RelationRegistry = {
  "LOVES":         { length: 2.0,  stiffness: 0.5,  transitive: false, maxDistance: 10.0, minDistance: 0.5 },
  "HATES":         { length: -5.0, stiffness: 0.3,  transitive: false, maxDistance: 15.0, minDistance: 2.0 },
  "MARRIED":       { length: 1.0,  stiffness: 2.0,  transitive: false, maxDistance: 5.0,  minDistance: 0.3 },
  "AT":            { length: 0.0,  stiffness: 10.0, transitive: false, maxDistance: 0.1, minDistance: 0.0 },
  "CONTAINS":      { length: 1.5,  stiffness: 0.4,  transitive: true,  maxDistance: 8.0,  minDistance: 0.5 },
  "DEPENDS_ON":    { length: 3.5,  stiffness: 0.25, transitive: true,  maxDistance: 12.0, minDistance: 1.0 },
  "IS_A":          { length: 2.0,  stiffness: 0.6,  transitive: true,  maxDistance: 6.0,  minDistance: 0.5 },
  "DEFINES":       { length: 1.5,  stiffness: 0.5,  transitive: false, maxDistance: 5.0,  minDistance: 0.3 },
  "WRITTEN_IN":    { length: 2.5,  stiffness: 0.2,  transitive: false, maxDistance: 8.0,  minDistance: 0.5 },
  "TRIGGERS":      { length: 2.5,  stiffness: 0.2,  transitive: true,  maxDistance: 10.0, minDistance: 0.5 },
  "CONTAINS_FLAW": { length: 8.0,  stiffness: 0.1,  transitive: false, maxDistance: 20.0, minDistance: 3.0 },
  "RESOLVED_STATE":{ length: 1.0,  stiffness: 1.0,  transitive: false, maxDistance: 3.0,  minDistance: 0.2 },
};

// ============================================================
// VALIDATION FUNCTIONS
// ============================================================

export function validateTriple(triple: Partial<UnifiedTriple>): ValidationResult {
  const violations: string[] = [];

  // E1.1: Missing subject
  if (!triple.subject || triple.subject.trim() === '') {
    violations.push('E1.1: missing_subject');
  }

  // E1.2: Missing relation
  if (!triple.relation || triple.relation.trim() === '') {
    violations.push('E1.2: missing_relation');
  }

  // E1.3: Invalid RV range
  if (triple.rv !== undefined && (triple.rv < 0 || triple.rv > 1 || isNaN(triple.rv))) {
    violations.push('E1.3: invalid_rv_range');
  }

  // E1.4: Invalid h range
  if (triple.h !== undefined && (triple.h < 0 || triple.h > 1 || isNaN(triple.h))) {
    violations.push('E1.4: invalid_h_range');
  }

  // E1.5: Null object on non-unary relation (heuristic: most relations need objects)
  if (triple.object === null && triple.relation && 
      !['ASSERT', 'EXISTS', 'DECLARE'].includes(triple.relation)) {
    violations.push('E1.6: suspicious_null_object');
  }

  // E1.7: Invalid archetype
  const validArchetypes: Archetype[] = ['STRUCTURAL_GATE', 'FUNCTIONAL_VECTOR', 'ATOMIC_SIGNAL', 'META'];
  if (triple.archetype && !validArchetypes.includes(triple.archetype)) {
    violations.push('E1.7: invalid_archetype');
  }

  return {
    valid: violations.length === 0,
    stage: 'schema_validator',
    violations,
    confidence: violations.length === 0 ? 1.0 : Math.max(0, 1.0 - violations.length * 0.2),
    recommendation: violations.length === 0 ? 'approve' : 'reject'
  };
}

export function sanitizeIdentifier(name: string): string {
  const clean = name.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_');
  if (clean.match(/^\d/)) return 'node_' + clean;
  return clean || 'anonymous_entity';
}

export function computeChecksum(triples: UnifiedTriple[]): string {
  // Simple but deterministic checksum for integrity
  const data = triples
    .filter(t => t.deleted === null)
    .sort((a, b) => a.created - b.created)
    .map(t => `${t.subject}:${t.relation}:${t.object}:${t.rv}:${t.h}:${t.created}`)
    .join('|');

  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}

export function createTriple(
  subject: string,
  relation: string,
  object: string | null,
  options: Partial<Omit<UnifiedTriple, 'subject' | 'relation' | 'object'>> = {}
): UnifiedTriple {
  const now = options.created ?? Date.now() / 1000;

  return {
    subject,
    relation,
    object,
    rv: options.rv ?? DEFAULTS.RV,
    h: options.h ?? DEFAULTS.H,
    value: options.value ?? 0,
    created: now,
    deleted: options.deleted ?? null,
    position: options.position ?? [0, 0, 0],
    velocity: options.velocity ?? [0, 0, 0],
    archetype: options.archetype ?? 'ATOMIC_SIGNAL',
    source: options.source ?? 'user',
    version: options.version ?? DEFAULTS.SCHEMA_VERSION,
  };
}
