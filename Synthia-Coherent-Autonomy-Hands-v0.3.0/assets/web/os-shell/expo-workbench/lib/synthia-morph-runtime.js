const MORPHS = Object.freeze([
  "zip",
  "canvas",
  "inspector",
  "preview",
  "source",
  "gallery",
  "runtime",
]);

export const MORPH_IDENTITIES = Object.freeze(Object.fromEntries(MORPHS.map((id) => [id, `synthia.morph.${id}`])));

export function createSynthiaMorphRuntime({ address, resolve, execute, observe, persist, mesh } = {}) {
  const states = new Map(MORPHS.map((id) => [id, { id, identity: MORPH_IDENTITIES[id], lifecycle: "dormant", invocationCount: 0, lastAddress: null, lastResult: null, lastError: null }]));

  const update = (morph, patch) => {
    const current = states.get(morph) || states.get("runtime");
    states.set(morph, { ...current, ...patch });
  };

  const run = async ({ morph = "runtime", object, input, operation = "execute" } = {}) => {
    if (!MORPHS.includes(morph)) throw new Error(`Unknown morph: ${morph}`);
    update(morph, { lifecycle: "active", lastError: null, invocationCount: states.get(morph).invocationCount + 1 });
    try {
      const addressed = address ? await address(object, { morph, operation }) : object?.address || object?.id || null;
      if (!addressed) throw new Error("Addressing required before execution");
      const target = resolve ? await resolve(addressed, { morph, operation }) : object;
      if (!target) throw new Error(`Unable to resolve addressed object: ${String(addressed)}`);
      const result = execute ? await execute(target, input, { morph, operation, address: addressed }) : target;
      const observation = observe ? await observe({ morph, address: addressed, input, result }) : { result };
      if (persist) await persist({ morph, address: addressed, observation });
      update(morph, { lifecycle: "healthy", lastAddress: addressed, lastResult: observation });
      return { ok: true, morph, identity: MORPH_IDENTITIES[morph], address: addressed, result, observation };
    } catch (error) {
      update(morph, { lifecycle: "failing", lastError: error instanceof Error ? error.message : String(error) });
      return { ok: false, morph, identity: MORPH_IDENTITIES[morph], error: { code: "MORPH_EXECUTION_FAILED", message: error instanceof Error ? error.message : String(error) } };
    }
  };

  return {
    morphs: () => MORPHS.map((id) => ({ ...states.get(id), mounted: Boolean(mesh?.has?.(id) ?? true) })),
    state: () => MORPHS.map((id) => ({ ...states.get(id) })),
    run,
    mount: (morph, automaton) => { if (!MORPHS.includes(morph)) throw new Error(`Unknown morph: ${morph}`); mesh?.set?.(morph, automaton); update(morph, { lifecycle: "mounted" }); return automaton; },
  };
}

export default createSynthiaMorphRuntime;
