import { describe, expect, it } from "vitest";

import { createSynthiaMorphRuntime } from "../lib/synthia-morph-runtime.js";

describe("addressed Synthia morph runtime", () => {
  it("resolves, executes, observes, and persists any addressed object category", async () => {
    const events: string[] = [];
    const runtime = createSynthiaMorphRuntime({
      address: (object: { kind: string; id: string }) => { events.push(`address:${object.kind}`); return `${object.kind}:${object.id}`; },
      resolve: (address: string) => { events.push(`resolve:${address}`); return { address }; },
      execute: (target: { address: string }, input: unknown) => { events.push(`execute:${target.address}`); return { input, target }; },
      observe: ({ morph, address }: { morph: string; address: string }) => { events.push(`observe:${morph}`); return { address, healthy: true }; },
      persist: ({ address }: { address: string }) => { events.push(`persist:${address}`); },
    });
    const result = await runtime.run({ morph: "canvas", object: { kind: "world", id: "world-1" }, input: { action: "move" } } as never);
    expect(result.ok).toBe(true);
    expect(result.address).toBe("world:world-1");
    expect(events).toEqual(["address:world", "resolve:world:world-1", "execute:world:world-1", "observe:canvas", "persist:world:world-1"]);
    expect(runtime.state().find((state) => state.id === "canvas")?.lifecycle).toBe("healthy");
  });
});
