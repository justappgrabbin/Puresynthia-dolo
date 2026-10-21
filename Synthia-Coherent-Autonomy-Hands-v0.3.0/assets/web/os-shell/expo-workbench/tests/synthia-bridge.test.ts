import { afterEach, describe, expect, it } from "vitest";

import { attachSynthiaRuntime, synthiaBridge } from "../server/synthia-bridge";
import type { BridgeArtifact, BridgeProject } from "../shared/synthia-bridge";

afterEach(() => attachSynthiaRuntime(null));

describe("optional Synthia transport adapter", () => {
  it("fails safely when no runtime is attached without removing the contract", async () => {
    const result = await synthiaBridge.getState();
    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe("SYNTHIA_RUNTIME_UNAVAILABLE");
    expect(result.release.canonicalLabel).toContain("r21.19");
  });

  it("delegates to injected authoritative runtime functions", async () => {
    const calls: string[] = [];
    attachSynthiaRuntime({
      inspect: (artifact: BridgeArtifact) => { calls.push(`inspect:${artifact.nodeId}`); return { inspected: true }; },
      validate: (project: BridgeProject) => { calls.push(`validate:${project.id}`); return { valid: true }; },
    });
    const inspection = await synthiaBridge.inspect({ projectId: "p1", nodeId: "n1", kind: "node", payload: {} });
    const validation = await synthiaBridge.validate({ id: "p1", name: "Project" });
    expect(inspection.data).toEqual({ inspected: true });
    expect(validation.data).toEqual({ valid: true });
    expect(calls).toEqual(["inspect:n1", "validate:p1"]);
  });
});
