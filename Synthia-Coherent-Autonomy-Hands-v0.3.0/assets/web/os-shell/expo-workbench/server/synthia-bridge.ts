import {
  bridgeUnavailable,
  SYNTHIA_RELEASE,
  type BridgeArtifact,
  type BridgeCommand,
  type BridgeProject,
  type BridgeResult,
  type SynthiaRuntimeAdapter,
} from "../shared/synthia-bridge";

let runtime: SynthiaRuntimeAdapter | null = null;

export function attachSynthiaRuntime(adapter: SynthiaRuntimeAdapter | null) {
  runtime = adapter;
  return runtime;
}

const safelyCall = async (operation: BridgeResult["operation"], action: (() => Promise<unknown> | unknown) | undefined): Promise<BridgeResult> => {
  if (!action) return bridgeUnavailable(operation);
  try {
    return { ok: true, release: SYNTHIA_RELEASE, operation, data: await action() };
  } catch (error) {
    return { ok: false, release: SYNTHIA_RELEASE, operation, error: { code: "SYNTHIA_RUNTIME_ERROR", message: error instanceof Error ? error.message : String(error) } };
  }
};

export const synthiaBridge = {
  openProject: (project: BridgeProject) => safelyCall("openProject", runtime?.openProject ? () => runtime!.openProject!(project) : undefined),
  inspect: (artifact: BridgeArtifact) => safelyCall("inspect", runtime?.inspect ? () => runtime!.inspect!(artifact) : undefined),
  execute: (artifact: BridgeArtifact, input: unknown) => safelyCall("execute", runtime?.execute ? () => runtime!.execute!(artifact, input) : undefined),
  applyMutation: (project: BridgeProject, change: unknown) => safelyCall("applyMutation", runtime?.applyMutation ? () => runtime!.applyMutation!(project, change) : undefined),
  getState: () => safelyCall("getState", runtime?.getState ? () => runtime!.getState!() : undefined),
  getTools: (artifact?: BridgeArtifact) => safelyCall("getTools", runtime?.getTools ? () => runtime!.getTools!(artifact) : undefined),
  validate: (project: BridgeProject) => safelyCall("validate", runtime?.validate ? () => runtime!.validate!(project) : undefined),
  command: (command: BridgeCommand) => {
    switch (command.kind) {
      case "openProject": return synthiaBridge.openProject(command.project);
      case "inspect": return synthiaBridge.inspect(command.artifact);
      case "execute": return synthiaBridge.execute(command.artifact, command.input);
      case "applyMutation": return synthiaBridge.applyMutation(command.project, command.change);
      case "validate": return synthiaBridge.validate(command.project);
      case "getState": return synthiaBridge.getState();
      case "getTools": return synthiaBridge.getTools(command.artifact);
    }
  },
};
