import { createTRPCClient } from "@/lib/trpc";
import type { BridgeArtifact, BridgeProject } from "@/shared/synthia-bridge";

export function createSynthiaBridgeClient(client = createTRPCClient()) {
  return {
    release: () => client.synthia.release.query(),
    openProject: (project: BridgeProject) => client.synthia.openProject.mutate({ project: project as Record<string, unknown> }),
    inspect: (artifact: BridgeArtifact) => client.synthia.inspect.mutate({ artifact: artifact as Record<string, unknown> }),
    execute: (artifact: BridgeArtifact, input: unknown) => client.synthia.execute.mutate({ artifact: artifact as Record<string, unknown>, input }),
    applyMutation: (project: BridgeProject, change: unknown) => client.synthia.applyMutation.mutate({ project: project as Record<string, unknown>, change }),
    getState: () => client.synthia.getState.query(),
    getTools: (artifact?: BridgeArtifact) => client.synthia.getTools.query(artifact ? { artifact: artifact as Record<string, unknown> } : undefined),
    validate: (project: BridgeProject) => client.synthia.validate.mutate({ project: project as Record<string, unknown> }),
  };
}
