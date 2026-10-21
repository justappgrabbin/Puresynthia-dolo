export type SynthiaReleaseIdentity = {
  suppliedLabel: string;
  archiveName: string;
  readmeLabel: string;
  internalMarkers: string[];
  canonicalLabel: string;
};

export type BridgeProject = {
  id: string;
  name: string;
  entryFile?: string;
  files?: Array<{ path: string; content?: string }>;
  model?: unknown;
};

export type BridgeArtifact = {
  projectId: string;
  nodeId?: string;
  filePath?: string;
  kind: "project" | "node" | "tool" | "automaton" | "artifact";
  payload: unknown;
};

export type BridgeCommand =
  | { kind: "openProject"; project: BridgeProject }
  | { kind: "inspect"; artifact: BridgeArtifact }
  | { kind: "execute"; artifact: BridgeArtifact; input: unknown }
  | { kind: "applyMutation"; project: BridgeProject; change: unknown }
  | { kind: "validate"; project: BridgeProject }
  | { kind: "getState" }
  | { kind: "getTools"; artifact?: BridgeArtifact };

export type BridgeResult = {
  ok: boolean;
  release: SynthiaReleaseIdentity;
  operation: BridgeCommand["kind"] | "openProject" | "getState" | "getTools";
  data?: unknown;
  error?: { code: string; message: string; details?: unknown };
};

export type SynthiaRuntimeAdapter = {
  openProject?: (project: BridgeProject) => Promise<unknown> | unknown;
  inspect?: (artifact: BridgeArtifact) => Promise<unknown> | unknown;
  execute?: (artifact: BridgeArtifact, input: unknown) => Promise<unknown> | unknown;
  applyMutation?: (project: BridgeProject, change: unknown) => Promise<unknown> | unknown;
  getState?: () => Promise<unknown> | unknown;
  getTools?: (artifact?: BridgeArtifact) => Promise<unknown> | unknown;
  validate?: (project: BridgeProject) => Promise<unknown> | unknown;
};

export const SYNTHIA_RELEASE: SynthiaReleaseIdentity = {
  suppliedLabel: "Synthia Organism OS",
  archiveName: "Synthia-Organism-OS-r22.0-MERGED.zip",
  readmeLabel: "r22.0 direct-assembly checkpoint",
  internalMarkers: ["r21.22", "unified-state-space", "direct-integration"],
  canonicalLabel: "Synthia Organism OS r22.0 — r21.22 chassis + explicit unique donor organs",
};

export const bridgeUnavailable = (operation: BridgeResult["operation"], message = "Synthia runtime adapter is not attached") : BridgeResult => ({
  ok: false,
  release: SYNTHIA_RELEASE,
  operation,
  error: { code: "SYNTHIA_RUNTIME_UNAVAILABLE", message },
});
