import type { BridgeArtifact, BridgeCommand, BridgeProject, BridgeResult, SynthiaRuntimeAdapter } from "./synthia-bridge";

export type MorphId = "zip" | "canvas" | "inspector" | "preview" | "source" | "gallery" | "runtime";
export type MorphLifecycle = "dormant" | "mounted" | "active" | "healthy" | "failing";

export type MorphState = {
  id: MorphId;
  lifecycle: MorphLifecycle;
  identity: string;
  lastOperation: string | null;
  lastError: string | null;
  invocationCount: number;
};

export type MorphCommand =
  | { morph: "zip"; operation: "openProject"; project: BridgeProject }
  | { morph: "canvas" | "inspector" | "preview" | "source" | "gallery" | "runtime"; operation: "inspect" | "execute" | "applyMutation" | "getState" | "getTools" | "validate"; artifact?: BridgeArtifact; project?: BridgeProject; input?: unknown; change?: unknown };

export type MountedMorph = {
  id: MorphId;
  identity: string;
  lifecycle: MorphLifecycle;
  accepts: string[];
};

export const MORPH_IDENTITIES: Record<MorphId, string> = {
  zip: "synthia.morph.zip",
  canvas: "synthia.morph.canvas",
  inspector: "synthia.morph.inspector",
  preview: "synthia.morph.preview",
  source: "synthia.morph.source",
  gallery: "synthia.morph.gallery",
  runtime: "synthia.morph.runtime",
};

export const MORPH_ACCEPTS: Record<MorphId, string[]> = {
  zip: ["openProject"],
  canvas: ["inspect", "execute", "applyMutation"],
  inspector: ["inspect", "applyMutation"],
  preview: ["execute", "getState"],
  source: ["inspect", "applyMutation", "validate"],
  gallery: ["getTools", "execute"],
  runtime: ["execute", "getState", "validate"],
};

export function mountedMorphs(): MountedMorph[] {
  return (Object.keys(MORPH_IDENTITIES) as MorphId[]).map((id) => ({ id, identity: MORPH_IDENTITIES[id], lifecycle: "dormant", accepts: MORPH_ACCEPTS[id] }));
}

export function commandForMorph(command: MorphCommand): BridgeCommand {
  if (command.morph === "zip") return { kind: "openProject", project: command.project } as BridgeCommand;
  if (command.operation === "inspect") return { kind: "inspect", artifact: command.artifact! };
  if (command.operation === "execute") return { kind: "execute", artifact: command.artifact!, input: command.input };
  if (command.operation === "applyMutation") return { kind: "applyMutation", project: command.project!, change: command.change };
  if (command.operation === "validate") return { kind: "validate", project: command.project! };
  return { kind: command.operation } as BridgeCommand;
}

export type InternalMorphRuntime = {
  mounted: () => MountedMorph[];
  state: () => MorphState[];
  invoke: (command: MorphCommand) => Promise<BridgeResult>;
};

export type MorphRuntimeBinding = SynthiaRuntimeAdapter;
