/* Archive Instrument reminder: this file is the deterministic substrate. Keep contracts explicit, evidence-backed, and local-first. */

export type StageStatus = "PASS" | "FAIL" | "INCOMPLETE" | "UNSUPPORTED";
export type NodeKind = "artifact" | "component" | "dependency" | "behavior" | "state" | "gap" | "repair";
export type EdgeKind = "contains" | "imports" | "renders" | "triggers" | "changes-state" | "depends-on" | "derived-from";

export type Evidence = {
  id: string;
  kind: "source" | "static-analysis" | "runtime" | "test" | "operator";
  sourceId: string;
  detail: string;
  reproducible: boolean;
  timestamp: number;
};

export type MeshNode = {
  id: string;
  kind: NodeKind;
  name: string;
  sourceArtifactId: string;
  confidence: number;
  evidenceIds: string[];
  properties: Record<string, string | number | boolean>;
};

export type MeshEdge = {
  id: string;
  kind: EdgeKind;
  from: string;
  to: string;
  confidence: number;
  evidenceIds: string[];
  derived: boolean;
};

export type ArtifactRecord = {
  id: string;
  originalPath: string;
  workingPath: string;
  mime: string;
  size: number;
  sha256: string;
  provenance: string;
  support: StageStatus;
};

export type CanonicalMesh = {
  schemaVersion: "1.0.0";
  projectId: string;
  artifacts: ArtifactRecord[];
  nodes: MeshNode[];
  edges: MeshEdge[];
  evidence: Evidence[];
};

export type MutationProposal = {
  id: string;
  problem: string;
  evidenceIds: string[];
  affectedNodeIds: string[];
  sourceDiff: string;
  meshDiff: string;
  confidence: number;
  validation: StageStatus;
  status: "PROPOSED" | "APPROVED" | "REJECTED" | "COMMITTED" | "ROLLED_BACK";
};

export type KleinContract = {
  id: "DISEMINER" | "AUTOLING" | "ATON" | "REPAIR";
  label: string;
  purpose: string;
  status: StageStatus;
  output: string;
};

const now = Date.now();

export const seedMesh: CanonicalMesh = {
  schemaVersion: "1.0.0",
  projectId: "paper-fixture-01",
  artifacts: [
    { id: "artifact-fixture", originalPath: "fixtures/broken-counter/src/App.tsx", workingPath: "workspace/broken-counter/src/App.tsx", mime: "text/tsx", size: 1842, sha256: "6a7e…c4d9", provenance: "Imported from deliberately broken fixture ZIP; original retained", support: "PASS" },
    { id: "artifact-package", originalPath: "fixtures/broken-counter/package.json", workingPath: "workspace/broken-counter/package.json", mime: "application/json", size: 621, sha256: "18af…2d01", provenance: "Imported from deliberately broken fixture ZIP; original retained", support: "PASS" },
    { id: "artifact-style", originalPath: "fixtures/broken-counter/src/styles.css", workingPath: "workspace/broken-counter/src/styles.css", mime: "text/css", size: 908, sha256: "9b20…a8ef", provenance: "Imported from deliberately broken fixture ZIP; original retained", support: "PASS" },
  ],
  nodes: [
    { id: "node-app", kind: "component", name: "App", sourceArtifactId: "artifact-fixture", confidence: 0.98, evidenceIds: ["ev-ast-01"], properties: { role: "root component", lines: 74 } },
    { id: "node-counter", kind: "component", name: "Counter", sourceArtifactId: "artifact-fixture", confidence: 0.96, evidenceIds: ["ev-ast-02"], properties: { role: "interactive component", lines: 31 } },
    { id: "node-state", kind: "state", name: "count", sourceArtifactId: "artifact-fixture", confidence: 0.94, evidenceIds: ["ev-ast-03"], properties: { initial: 0, setter: "setCount" } },
    { id: "node-click", kind: "behavior", name: "increment on click", sourceArtifactId: "artifact-fixture", confidence: 0.91, evidenceIds: ["ev-autoling-01"], properties: { event: "onClick", effect: "setCount(count + 1)" } },
    { id: "node-react", kind: "dependency", name: "react", sourceArtifactId: "artifact-package", confidence: 1, evidenceIds: ["ev-hash-01"], properties: { version: "19.0.0" } },
    { id: "node-gap", kind: "gap", name: "missing key prop", sourceArtifactId: "artifact-fixture", confidence: 0.88, evidenceIds: ["ev-run-01"], properties: { severity: "low", location: "App.tsx:42" } },
  ],
  edges: [
    { id: "edge-app-counter", kind: "renders", from: "node-app", to: "node-counter", confidence: 0.98, evidenceIds: ["ev-ast-02"], derived: false },
    { id: "edge-counter-state", kind: "changes-state", from: "node-counter", to: "node-state", confidence: 0.94, evidenceIds: ["ev-ast-03"], derived: false },
    { id: "edge-click-state", kind: "triggers", from: "node-click", to: "node-state", confidence: 0.91, evidenceIds: ["ev-autoling-01"], derived: false },
    { id: "edge-app-react", kind: "depends-on", from: "node-app", to: "node-react", confidence: 0.99, evidenceIds: ["ev-hash-01"], derived: true },
  ],
  evidence: [
    { id: "ev-hash-01", kind: "source", sourceId: "artifact-package", detail: "SHA-256 recorded at import; dependency surface is reproducible.", reproducible: true, timestamp: now },
    { id: "ev-ast-01", kind: "static-analysis", sourceId: "artifact-fixture", detail: "AST adapter found exported root component App.", reproducible: true, timestamp: now },
    { id: "ev-ast-02", kind: "static-analysis", sourceId: "artifact-fixture", detail: "JSX render edge App → Counter.", reproducible: true, timestamp: now },
    { id: "ev-ast-03", kind: "static-analysis", sourceId: "artifact-fixture", detail: "useState count and setCount extracted from component body.", reproducible: true, timestamp: now },
    { id: "ev-autoling-01", kind: "operator", sourceId: "artifact-fixture", detail: "AUTOLING grammar: click → increment → render.", reproducible: true, timestamp: now },
    { id: "ev-run-01", kind: "runtime", sourceId: "artifact-fixture", detail: "Isolated run captured build failure: list item requires stable key.", reproducible: true, timestamp: now },
  ],
};

export const seedContracts: KleinContract[] = [
  { id: "DISEMINER", label: "DISEMINER", purpose: "Dependency reachability from direct and derived edges", status: "PASS", output: "4 direct · 1 derived path" },
  { id: "AUTOLING", label: "AUTOLING", purpose: "Behavioral grammar from observed evidence", status: "PASS", output: "click → increment → render" },
  { id: "ATON", label: "ATO episodic memory", purpose: "Persist project, Mesh, evidence, and recipe locally", status: "PASS", output: "Local snapshot ready" },
  { id: "REPAIR", label: "Repair proposal", purpose: "Smallest source + Mesh mutation, approval-gated", status: "INCOMPLETE", output: "1 proposal awaiting approval" },
];

export const seedProposal: MutationProposal = {
  id: "proposal-001",
  problem: "The isolated build fails because the mapped list render is missing a stable key.",
  evidenceIds: ["ev-run-01", "ev-ast-02"],
  affectedNodeIds: ["node-app", "node-gap"],
  sourceDiff: "<li>{item.label}</li>\n→ <li key={item.id}>{item.label}</li>",
  meshDiff: "gap:missing-key → resolved; confidence 0.88 → 0.99",
  confidence: 0.93,
  validation: "INCOMPLETE",
  status: "PROPOSED",
};

export function analyzeText(input: string): CanonicalMesh {
  const normalized = input.trim() || "Counter with a list of items";
  const hasList = /list|map|items/i.test(normalized);
  const hasState = /state|count|toggle|input/i.test(normalized);
  const base = structuredClone(seedMesh);
  base.projectId = `paper-local-${normalized.length}`;
  base.nodes = base.nodes.map((node) => ({ ...node, evidenceIds: [...node.evidenceIds] }));
  if (!hasList) base.nodes = base.nodes.filter((node) => node.id !== "node-gap");
  if (!hasState) base.nodes = base.nodes.filter((node) => node.kind !== "state" && node.kind !== "behavior");
  return base;
}

export function exportRecipe(mesh: CanonicalMesh, proposal: MutationProposal | null): string {
  return JSON.stringify({ paper: "1.0", projectId: mesh.projectId, schemaVersion: mesh.schemaVersion, mesh, proposal, generatedAt: new Date().toISOString() }, null, 2);
}
