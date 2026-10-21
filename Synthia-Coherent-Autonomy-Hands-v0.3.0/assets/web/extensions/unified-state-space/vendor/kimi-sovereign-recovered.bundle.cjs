var __SYNTHIA_BUNDLE__ = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __typeError = (msg) => {
    throw TypeError(msg);
  };
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod2) => __copyProps(__defProp({}, "__esModule", { value: true }), mod2);
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
  var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
  var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);

  // src/sovereign-entry.js
  var sovereign_entry_exports = {};
  __export(sovereign_entry_exports, {
    default: () => sovereign_entry_default
  });

  // src/mesh/mesh.js
  var PROJECTIONS = ["knowledge", "causal", "phase", "temporal", "dependency"];
  var MeshError = class extends Error {
    constructor(code, message, details = {}) {
      super(message);
      this.name = "MeshError";
      this.code = code;
      this.details = details;
    }
  };
  function normalizePorts(ports) {
    const norm = (entry, index, direction) => {
      const base = typeof entry === "string" ? { id: entry } : { ...entry || {} };
      return {
        id: base.id || `${direction}-${index}`,
        direction: base.direction || direction,
        type: base.type || "json",
        schemaVersion: base.schemaVersion || "1",
        requires: [...base.requires || []],
        guarantees: [...base.guarantees || []]
      };
    };
    if (Array.isArray(ports)) return ports.map((p, i) => norm(p, i, p && p.direction));
    const out = [];
    for (const [direction, list] of [["input", ports && ports.in || []], ["output", ports && ports.out || []]]) {
      list.forEach((entry, i) => out.push(norm(entry, i, direction)));
    }
    return out;
  }
  function portCompatibility(output, input) {
    const issues = [];
    if (output.type !== input.type) issues.push("TYPE_MISMATCH");
    if (output.schemaVersion !== input.schemaVersion) issues.push("SCHEMA_VERSION_MISMATCH");
    const missing = input.requires.filter((invariant) => !output.guarantees.includes(invariant));
    if (missing.length) issues.push("INVARIANT_MISMATCH");
    return { compatible: issues.length === 0, issues, missing };
  }
  var AutomataMesh = class {
    constructor({ manifestVersion = "ato.mesh.v1" } = {}) {
      this.manifestVersion = manifestVersion;
      this.automata = /* @__PURE__ */ new Map();
      this.connections = /* @__PURE__ */ new Map();
      this.projections = new Map(PROJECTIONS.map((name) => [name, /* @__PURE__ */ new Map()]));
    }
    register(automaton) {
      if (!automaton || typeof automaton.id !== "string" || !automaton.id) {
        throw new MeshError("INVALID_AUTOMATON", "Mesh registers automata with a string id");
      }
      if (this.automata.has(automaton.id)) {
        throw new MeshError("DUPLICATE_AUTOMATON", `Duplicate automaton: ${automaton.id}`);
      }
      this.automata.set(automaton.id, automaton);
      return automaton;
    }
    get(id) {
      return this.automata.get(id);
    }
    connect(fromId, toId, { outputPort = "output", inputPort = "input", operator = "transmit" } = {}) {
      const from = this.automata.get(fromId);
      const to = this.automata.get(toId);
      if (!from || !to) throw new MeshError("UNKNOWN_AUTOMATON", "Both automata must be registered before connect", { fromId, toId });
      const outPorts = normalizePorts(from.ports).filter((p) => p.direction === "output");
      const inPorts = normalizePorts(to.ports).filter((p) => p.direction === "input");
      const output = outPorts.find((p) => p.id === outputPort) || outPorts[0];
      const input = inPorts.find((p) => p.id === inputPort) || inPorts[0];
      if (!output || !input) {
        return Object.freeze({ status: "not-reachable", reason: "PORT_NOT_FOUND", fromId, toId, outputPort, inputPort });
      }
      const check = portCompatibility(output, input);
      if (!check.compatible) {
        return Object.freeze({ status: "not-reachable", reason: "INCOMPATIBLE_CONTRACT", fromId, toId, issues: check.issues, missing: check.missing });
      }
      const id = `${fromId}.${output.id}->${toId}.${input.id}`;
      const edge = Object.freeze({
        id,
        fromId,
        toId,
        outputPort: output.id,
        inputPort: input.id,
        fromContract: Object.freeze({ type: output.type, schemaVersion: output.schemaVersion }),
        toContract: Object.freeze({ type: input.type, schemaVersion: input.schemaVersion }),
        operator
      });
      this.connections.set(id, edge);
      return Object.freeze({ status: "connected", edge });
    }
    route(packet) {
      if (!packet || typeof packet.to !== "string") {
        throw new MeshError("INVALID_PACKET", "route() requires a StatePacket with a `to` automaton id");
      }
      const target = this.automata.get(packet.to);
      if (!target) {
        return Object.freeze({ delivered: false, reason: "UNKNOWN_AUTOMATON", to: packet.to, packetId: packet.id || null });
      }
      const receipt = Object.freeze({
        delivered: true,
        to: packet.to,
        packetId: packet.id || null,
        port: "input",
        kind: packet.kind || "data"
      });
      if (this.channels && typeof this.channels.recordCrossing === "function") {
        this.channels.recordCrossing(packet.from, packet.to, packet);
      }
      return receipt;
    }
    addEdge(projection, fromState, toState, relation, metadata = {}) {
      const graph = this.projections.get(projection);
      if (!graph) throw new MeshError("UNKNOWN_PROJECTION", `Projection must be one of: ${PROJECTIONS.join(", ")}`, { projection });
      if (!graph.has(fromState)) graph.set(fromState, []);
      const edge = Object.freeze({ from: fromState, to: toState, relation, metadata: Object.freeze({ ...metadata }) });
      graph.get(fromState).push(edge);
      return edge;
    }
    neighbors(stateId, projection) {
      const graph = this.projections.get(projection);
      if (!graph) throw new MeshError("UNKNOWN_PROJECTION", `Projection must be one of: ${PROJECTIONS.join(", ")}`, { projection });
      return Object.freeze([...graph.get(stateId) || []]);
    }
    metrics() {
      const per = {};
      for (const [name, graph] of this.projections) {
        let edges = 0;
        const nodes = /* @__PURE__ */ new Set();
        for (const [from, list] of graph) {
          nodes.add(from);
          edges += list.length;
          for (const edge of list) nodes.add(edge.to);
        }
        per[name] = Object.freeze({
          nodes: nodes.size,
          edges,
          avgDegree: nodes.size ? edges / nodes.size : 0
        });
      }
      return Object.freeze({
        automata: this.automata.size,
        connections: this.connections.size,
        projections: Object.freeze(per)
      });
    }
    snapshot() {
      const projections = {};
      for (const [name, graph] of this.projections) {
        const edges = [];
        for (const list of graph.values()) edges.push(...list);
        projections[name] = Object.freeze(edges);
      }
      return Object.freeze({
        manifestVersion: this.manifestVersion,
        automata: Object.freeze([...this.automata.values()].map((a) => typeof a.manifest === "function" ? a.manifest() : { id: a.id }).sort((a, b) => a.id.localeCompare(b.id))),
        connections: Object.freeze([...this.connections.values()].sort((a, b) => a.id.localeCompare(b.id))),
        projections: Object.freeze(projections)
      });
    }
  };

  // src/mesh/packet.js
  var PACKET_SEQUENCE = 0;
  var StatePacket = class _StatePacket {
    constructor({ id, from, to, kind = "data", payload, address = null, activation = 1, derivationId = null } = {}) {
      if (typeof from !== "string" || !from) throw new TypeError("StatePacket requires a `from` automaton id");
      if (typeof to !== "string" || !to) throw new TypeError("StatePacket requires a `to` automaton id");
      this.id = id || `packet-${++PACKET_SEQUENCE}`;
      this.from = from;
      this.to = to;
      this.kind = kind;
      this.payload = payload;
      this.address = address;
      this.activation = activation;
      this.derivationId = derivationId;
    }
    toJSON() {
      return {
        id: this.id,
        from: this.from,
        to: this.to,
        kind: this.kind,
        payload: this.payload,
        address: this.address,
        activation: this.activation,
        derivationId: this.derivationId
      };
    }
    static fromJSON(json) {
      const data = typeof json === "string" ? JSON.parse(json) : json;
      return new _StatePacket(data);
    }
  };

  // src/state-space/lexicon.js
  var TOOL_IDS = Object.freeze([
    "autoling-lite",
    "diseminer-lite",
    "klein-analogy",
    "iching-grammar",
    "language-contact",
    "historical-monte-carlo",
    "autonovel",
    "messy",
    "success",
    "conversation",
    "browser-form",
    "research-browser",
    "computational-grammar-coder",
    "autoling",
    "diseminer",
    "morph-mir"
  ]);
  var TOOL_ALIASES = Object.freeze({
    "auto-ling": "autoling",
    "iching": "iching-grammar",
    "monte-carlo": "historical-monte-carlo",
    "coder": "computational-grammar-coder",
    "morph": "morph-mir",
    "novel": "autonovel",
    "research": "research-browser",
    "form": "browser-form",
    "analogy": "klein-analogy",
    "contact": "language-contact",
    "grammar-coder": "computational-grammar-coder"
  });
  var KEYWORDS = Object.freeze({
    chain: ["then"],
    addressMarker: ["at"],
    flagPrefix: "--"
  });
  var SEED_WORDS = Object.freeze([
    // determiners (7)
    { word: "the", pos: "DET" },
    { word: "a", pos: "DET" },
    { word: "an", pos: "DET" },
    { word: "this", pos: "DET" },
    { word: "that", pos: "DET" },
    { word: "these", pos: "DET" },
    { word: "those", pos: "DET" },
    // prepositions (10)
    { word: "in", pos: "PREP" },
    { word: "on", pos: "PREP" },
    { word: "at", pos: "PREP" },
    { word: "of", pos: "PREP" },
    { word: "to", pos: "PREP" },
    { word: "for", pos: "PREP" },
    { word: "with", pos: "PREP" },
    { word: "from", pos: "PREP" },
    { word: "by", pos: "PREP" },
    { word: "about", pos: "PREP" },
    // conjunctions (4)
    { word: "and", pos: "CONJ" },
    { word: "or", pos: "CONJ" },
    { word: "but", pos: "CONJ" },
    { word: "if", pos: "CONJ" },
    // pronouns (7)
    { word: "i", pos: "PRON" },
    { word: "you", pos: "PRON" },
    { word: "he", pos: "PRON" },
    { word: "she", pos: "PRON" },
    { word: "it", pos: "PRON" },
    { word: "we", pos: "PRON" },
    { word: "they", pos: "PRON" },
    // auxiliaries / copulas / modals (19)
    { word: "is", pos: "AUX" },
    { word: "are", pos: "AUX" },
    { word: "was", pos: "AUX" },
    { word: "were", pos: "AUX" },
    { word: "be", pos: "AUX" },
    { word: "been", pos: "AUX" },
    { word: "have", pos: "AUX" },
    { word: "has", pos: "AUX" },
    { word: "do", pos: "AUX" },
    { word: "does", pos: "AUX" },
    { word: "will", pos: "AUX" },
    { word: "would", pos: "AUX" },
    { word: "can", pos: "AUX" },
    { word: "could", pos: "AUX" },
    { word: "shall", pos: "AUX" },
    { word: "should", pos: "AUX" },
    { word: "may", pos: "AUX" },
    { word: "might", pos: "AUX" },
    { word: "must", pos: "AUX" },
    // open-class seeds — state-space vocabulary (20)
    { word: "gate", pos: "NOUN" },
    { word: "state", pos: "NOUN" },
    { word: "tool", pos: "NOUN" },
    { word: "mesh", pos: "NOUN" },
    { word: "automaton", pos: "NOUN" },
    { word: "rule", pos: "NOUN" },
    { word: "word", pos: "NOUN" },
    { word: "letter", pos: "NOUN" },
    { word: "sound", pos: "NOUN" },
    { word: "color", pos: "NOUN" },
    { word: "make", pos: "VERB" },
    { word: "run", pos: "VERB" },
    { word: "parse", pos: "VERB" },
    { word: "call", pos: "VERB" },
    { word: "weave", pos: "VERB" },
    { word: "bind", pos: "VERB" },
    { word: "active", pos: "ADJ" },
    { word: "dormant", pos: "ADJ" },
    { word: "bright", pos: "ADJ" },
    { word: "now", pos: "ADV" }
  ]);
  var CLOSED_CLASS = new Map(SEED_WORDS.map(({ word, pos }) => [word, pos]));
  function posGuess(word) {
    const w = String(word).toLowerCase();
    const closed = CLOSED_CLASS.get(w);
    if (closed) return closed;
    if (/(ing|ed)$/.test(w)) return "VERB";
    if (/ly$/.test(w)) return "ADV";
    if (/(tion|ness|ment|ity)$/.test(w)) return "NOUN";
    if (/(able|ible|ful|ous)$/.test(w)) return "ADJ";
    return "NOUN";
  }

  // src/automata/tools/tool-01-autoling-lite.js
  var tool_01_autoling_lite_exports = {};
  __export(tool_01_autoling_lite_exports, {
    AutolingLiteAutomaton: () => AutolingLiteAutomaton
  });

  // src/state-space/transitions.js
  var NAMED_TRANSITIONS = Object.freeze([
    { id: "ignition", symbol: "\u2192*", effect: "dormant \u2192 active (\u03B1: 0\u2192\u03C3(input))", soundEffect: { gliss: 1 }, colorEffect: { hueShift: 40 }, operatorId: "o_transform" },
    { id: "flow", symbol: "\u2192", effect: "active \u2192 active (\u03B1 propagates w/ weight)", soundEffect: { sustain: true }, colorEffect: { hueHold: true }, operatorId: "o_transform" },
    { id: "weakening", symbol: "\u21E2", effect: "active \u2192 weakening (\u03B1 decays by \u03BB)", soundEffect: { diminuendo: -1, velocityScale: 0.7 }, colorEffect: { satShift: -10 }, operatorId: "o_transform" },
    { id: "dormancy", symbol: "\u21DD", effect: "weakening \u2192 dormant (\u03B1<\u03B8; topology kept)", soundEffect: { rest: true, duration: 0 }, colorEffect: { satSet: 20 }, operatorId: "o_transform" },
    { id: "reactivation", symbol: "\u21AC", effect: "dormant \u2192 active via resonance", soundEffect: { recall: true, gliss: 1 }, colorEffect: { satRestore: true }, operatorId: "o_transform" },
    { id: "fusion", symbol: "\u2295", effect: "n states \u2192 bundle (o_bundle)", soundEffect: { chord: true }, colorEffect: { hueAverage: true }, operatorId: "o_bundle" },
    { id: "chain", symbol: "\u25B8", effect: "ordered append (o_sequence)", soundEffect: { sequence: true }, colorEffect: { hueWalk: 5 }, operatorId: "o_sequence" },
    { id: "mirror", symbol: "\u224D", effect: "o_reverse (Fu Xi reverse variation)", soundEffect: { retrograde: true }, colorEffect: { hueShift: 180 }, operatorId: "o_reverse" },
    { id: "shadow", symbol: "\u25D0", effect: "o_inverse (yin\u2194yang line inversion)", soundEffect: { pitchInversion: true }, colorEffect: { valueInvert: true }, operatorId: "o_inverse" },
    { id: "rotation", symbol: "\u27F3", effect: "o_converse (180\xB0 wheel rotation)", soundEffect: { transpose: 6 }, colorEffect: { hueShift: 90 }, operatorId: "o_converse" },
    { id: "core", symbol: "\u2299", effect: "o_nuclear (nuclear trigram)", soundEffect: { innerVoices: true }, colorEffect: { satShift: 15, lightShift: -15 }, operatorId: "o_nuclear" },
    { id: "becoming", symbol: "\u21D2", effect: "o_change (moving line \u2192 target state)", soundEffect: { cadence: "resolve" }, colorEffect: { hueLerpTo: "target" }, operatorId: "o_change" },
    { id: "perspective", symbol: "\u25C7", effect: "o_project T_{i\u2192j} (dimension change)", soundEffect: { octaveShift: 1 }, colorEffect: { layerChange: true }, operatorId: "o_project" },
    { id: "recursion", symbol: "\u21BA", effect: "o_recurse (output re-enters as operand)", soundEffect: { loop: true, decay: 0.8 }, colorEffect: { lightShift: -10, spiral: true }, operatorId: "o_recurse" },
    { id: "weave", symbol: "\u22C8", effect: "o_discourse (L5 units \u2192 L6)", soundEffect: { polyphony: true }, colorEffect: { gradientBlend: true }, operatorId: "o_discourse" },
    { id: "automatize", symbol: "\u2699", effect: "o_automaton (state set \u2192 machine)", soundEffect: { rhythmicCycle: true }, colorEffect: { frame: true }, operatorId: "o_automaton" }
  ]);
  var BY_ID = new Map(NAMED_TRANSITIONS.map((t) => [t.id, t]));
  function transitionById(id) {
    return BY_ID.get(id) || null;
  }

  // src/state-space/constants.js
  var WHEEL_ARCSECONDS = 1296e3;
  var GATE_ARCSECONDS = 20250;
  var LINE_ARCSECONDS = 3375;
  var COLOR_ARCSECONDS = 562.5;
  var TONE_ARCSECONDS = 93.75;
  var BASE_ARCSECONDS = 18.75;
  var ZODIAC_ARCSECONDS = 108e3;
  var HOUSE_ARCSECONDS = 162e3;
  var SCALES = ["feature", "phoneme", "grapheme", "morpheme", "word", "phrase", "clause", "sentence", "discourse", "automaton", "mesh"];
  var DIMENSIONS = ["Movement", "Evolution", "Being", "Design", "Space"];
  var DIMENSION_META = {
    Movement: { interrogative: "Where", operation: "transition", seedGate: 1, octave: 2 },
    Evolution: { interrogative: "What", operation: "transform", seedGate: 2, octave: 3 },
    Being: { interrogative: "When", operation: "instantiate", seedGate: 6, octave: 4 },
    Design: { interrogative: "Why", operation: "structure", seedGate: 14, octave: 5 },
    Space: { interrogative: "Who", operation: "integrate", seedGate: 20, octave: 6 }
  };
  var TRIGRAMS = [
    { id: "kun", name: "Receptive", element: "Earth", bits: [0, 0, 0], value: 0 },
    { id: "zhen", name: "Arousing", element: "Thunder", bits: [1, 0, 0], value: 1 },
    { id: "kan", name: "Abysmal", element: "Water", bits: [0, 1, 0], value: 2 },
    { id: "dui", name: "Joyous", element: "Lake", bits: [1, 1, 0], value: 3 },
    { id: "gen", name: "KeepingStill", element: "Mountain", bits: [0, 0, 1], value: 4 },
    { id: "li", name: "Clinging", element: "Fire", bits: [1, 0, 1], value: 5 },
    { id: "xun", name: "Gentle", element: "Wind", bits: [0, 1, 1], value: 6 },
    { id: "qian", name: "Creative", element: "Heaven", bits: [1, 1, 1], value: 7 }
  ];
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function() {
      a |= 0;
      a = a + 1831565813 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  // src/state-space/sounds.js
  var BASE_FREQUENCY = 432;
  var SCALEGRAM = [0, 2, 5, 7, 9, 10];
  var TIMBRES = ["sine", "triangle", "square", "sawtooth", "pulse", "noise"];
  var DURATIONS = [0.25, 0.5, 1, 1.5, 2, 4];
  var VELOCITIES = [0.4, 0.55, 0.7, 0.85, 1];
  function soundFor(address) {
    const dim = address.planetaryDimension || "Being";
    const octave = (DIMENSION_META[dim] || DIMENSION_META.Being).octave;
    const pitchClass = (address.zodiac || 1) - 1;
    const arcSec = address.arcSecond ?? 0;
    const arcSecWithinSign = (arcSec % ZODIAC_ARCSECONDS + ZODIAC_ARCSECONDS) % ZODIAC_ARCSECONDS;
    const cents = arcSecWithinSign / ZODIAC_ARCSECONDS * 100;
    const scaleDegree = SCALEGRAM[(address.line || 1) - 1];
    const freq = BASE_FREQUENCY * Math.pow(2, (octave * 12 + pitchClass + scaleDegree + cents / 100 - 57) / 12);
    return {
      freq,
      cents,
      octave,
      pitchClass,
      scaleDegree,
      timbre: TIMBRES[(address.color || 1) - 1],
      duration: DURATIONS[(address.tone || 1) - 1],
      velocity: VELOCITIES[(address.base || 1) - 1],
      rhythmicSlot: (address.house || 1) - 1
      // 0-7 slot in the 8-beat cycle
    };
  }
  function transitionSound(transitionId, address) {
    const sound = soundFor(address);
    const t = transitionById(transitionId);
    if (!t) return { ...sound, transition: null };
    const fx = t.soundEffect || {};
    const out = { ...sound, transition: t.id };
    if (typeof fx.gliss === "number") {
      out.gliss = fx.gliss;
      out.targetFreq = out.freq * Math.pow(2, fx.gliss / 12);
    }
    if (typeof fx.transpose === "number") {
      out.transpose = fx.transpose;
      out.freq *= Math.pow(2, fx.transpose / 12);
    }
    if (typeof fx.octaveShift === "number") {
      out.octave += fx.octaveShift;
      out.freq *= Math.pow(2, fx.octaveShift);
    }
    if (typeof fx.velocityScale === "number") {
      out.velocity = Math.min(1, Math.max(0, out.velocity * fx.velocityScale));
    }
    if (typeof fx.duration === "number") out.duration = fx.duration;
    if (fx.rest === true) {
      out.duration = 0;
      out.velocity = 0;
    }
    for (const [k, v] of Object.entries(fx)) {
      if (!(k in out) && !["gliss", "transpose", "octaveShift", "velocityScale"].includes(k)) out[k] = v;
    }
    return out;
  }

  // src/state-space/addressing.js
  var KING_WEN_TO_FUXI_DECIMAL = Object.freeze({
    1: 63,
    2: 0,
    3: 17,
    4: 34,
    5: 23,
    6: 58,
    7: 2,
    8: 16,
    9: 55,
    10: 59,
    11: 7,
    12: 56,
    13: 61,
    14: 47,
    15: 4,
    16: 8,
    17: 25,
    18: 38,
    19: 3,
    20: 48,
    21: 41,
    22: 37,
    23: 32,
    24: 1,
    25: 57,
    26: 39,
    27: 33,
    28: 30,
    29: 18,
    30: 45,
    31: 28,
    32: 14,
    33: 60,
    34: 15,
    35: 40,
    36: 5,
    37: 53,
    38: 43,
    39: 20,
    40: 10,
    41: 35,
    42: 49,
    43: 31,
    44: 62,
    45: 24,
    46: 6,
    47: 26,
    48: 22,
    49: 29,
    50: 46,
    51: 9,
    52: 36,
    53: 52,
    54: 11,
    55: 13,
    56: 44,
    57: 54,
    58: 27,
    59: 50,
    60: 19,
    61: 51,
    62: 12,
    63: 21,
    64: 42
  });
  var FUXI_DECIMAL_TO_KING_WEN = Object.freeze(
    Object.fromEntries(Object.entries(KING_WEN_TO_FUXI_DECIMAL).map(([g, d]) => [d, Number(g)]))
  );
  var mod = (n, m) => (n % m + m) % m;
  function addressForArcSec(arcSec) {
    const a = mod(arcSec, WHEEL_ARCSECONDS);
    const gate = Math.floor(a / GATE_ARCSECONDS) + 1;
    const withinGate = a - (gate - 1) * GATE_ARCSECONDS;
    const line = Math.floor(withinGate / LINE_ARCSECONDS) + 1;
    const withinLine = withinGate - (line - 1) * LINE_ARCSECONDS;
    const color = Math.floor(withinLine / COLOR_ARCSECONDS) + 1;
    const withinColor = withinLine - (color - 1) * COLOR_ARCSECONDS;
    const tone = Math.floor(withinColor / TONE_ARCSECONDS) + 1;
    const withinTone = withinColor - (tone - 1) * TONE_ARCSECONDS;
    const base = Math.floor(withinTone / BASE_ARCSECONDS) + 1;
    const degree = Math.floor(a / 3600);
    const minute = Math.floor(a % 3600 / 60);
    const second = a % 60;
    const zodiac = Math.floor(a / ZODIAC_ARCSECONDS) + 1;
    const house = Math.floor(a / HOUSE_ARCSECONDS) + 1;
    return {
      gate,
      line,
      color,
      tone,
      base,
      degree,
      minute,
      second,
      arcSecond: a,
      zodiac,
      house
    };
  }
  function arcSecForAddress(addr) {
    const { gate = 1, line = 1, color = 1, tone = 1, base = 1 } = addr;
    return mod(
      (gate - 1) * GATE_ARCSECONDS + (line - 1) * LINE_ARCSECONDS + (color - 1) * COLOR_ARCSECONDS + (tone - 1) * TONE_ARCSECONDS + (base - 1) * BASE_ARCSECONDS,
      WHEEL_ARCSECONDS
    );
  }
  function gateBits(gate) {
    if (!Number.isInteger(gate) || gate < 1 || gate > 64) {
      throw new RangeError(`gate must be 1-64, got ${gate}`);
    }
    const d = KING_WEN_TO_FUXI_DECIMAL[gate];
    return [0, 1, 2, 3, 4, 5].map((i) => d >> i & 1);
  }
  function gateFromBits(bits) {
    if (!Array.isArray(bits) || bits.length !== 6) {
      throw new RangeError("gateFromBits expects a 6-bit array (line 1 first)");
    }
    const d = bits.reduce((acc, b, i) => acc | (b ? 1 : 0) << i, 0);
    return FUXI_DECIMAL_TO_KING_WEN[d];
  }
  function hamming(a, b) {
    if (a.length !== b.length) throw new RangeError("hamming: bit arrays must have equal length");
    return a.reduce((n, bit, i) => n + (bit !== b[i] ? 1 : 0), 0);
  }
  function addrKey(addr) {
    return `G${addr.gate}.L${addr.line}.C${addr.color}.T${addr.tone}.B${addr.base}`;
  }

  // src/state-space/colors.js
  var COLOR_ANCHORS = Object.freeze({
    1: "#8C4A2F",
    // Appetite (earth-red)
    2: "#C28E3C",
    // Taste (ochre)
    3: "#3C6E8C",
    // Thirst (water-blue)
    4: "#6E8C3C",
    // Touch (moss)
    5: "#7A5A8C",
    // Sound (violet-ash)
    6: "#D9C98C"
    // Light (pale gold)
  });
  var DIMENSION_LAYERS = Object.freeze({
    Movement: "stroke",
    Evolution: "fill",
    Being: "glow",
    Design: "frame",
    Space: "ground"
  });
  var clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  function colorFor(address) {
    const arcSec = address.arcSecond ?? arcSecForAddress(address);
    const hue = (arcSec % WHEEL_ARCSECONDS + WHEEL_ARCSECONDS) % WHEEL_ARCSECONDS / WHEEL_ARCSECONDS * 360;
    const sat = 30 + (address.line || 1) * 10;
    const light = 25 + (address.tone || 1) * 7;
    const dim = address.planetaryDimension || "Being";
    return {
      hue,
      sat,
      light,
      hex: hslToHex(hue, sat, light),
      layer: DIMENSION_LAYERS[dim] || "glow"
    };
  }
  function transitionColor(transitionId, address) {
    const color = colorFor(address);
    const t = transitionById(transitionId);
    if (!t) return { ...color, transition: null };
    const fx = t.colorEffect || {};
    const out = { ...color, transition: t.id };
    let changed = false;
    if (typeof fx.hueShift === "number") {
      out.hue = ((out.hue + fx.hueShift) % 360 + 360) % 360;
      changed = true;
    }
    if (typeof fx.hueWalk === "number") {
      out.hue = ((out.hue + fx.hueWalk) % 360 + 360) % 360;
      changed = true;
    }
    if (typeof fx.satShift === "number") {
      out.sat = clamp(out.sat + fx.satShift, 0, 100);
      changed = true;
    }
    if (typeof fx.lightShift === "number") {
      out.light = clamp(out.light + fx.lightShift, 0, 100);
      changed = true;
    }
    if (typeof fx.satSet === "number") {
      out.sat = clamp(fx.satSet, 0, 100);
      changed = true;
    }
    if (fx.valueInvert === true) {
      out.light = 100 - out.light;
      changed = true;
    }
    if (changed) out.hex = hslToHex(out.hue, out.sat, out.light);
    for (const [k, v] of Object.entries(fx)) {
      if (!(k in out) && !["hueShift", "hueWalk", "satShift", "lightShift", "satSet", "valueInvert"].includes(k)) out[k] = v;
    }
    return out;
  }
  function hslToHex(h, s, l) {
    const H = (h % 360 + 360) % 360 / 360;
    const S = clamp(s, 0, 100) / 100;
    const L = clamp(l, 0, 100) / 100;
    const q = L < 0.5 ? L * (1 + S) : L + S - L * S;
    const p = 2 * L - q;
    const chan = (t0) => {
      let t = t0;
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const to2 = (v) => Math.round(clamp(v, 0, 1) * 255).toString(16).padStart(2, "0").toUpperCase();
    return `#${to2(chan(H + 1 / 3))}${to2(chan(H))}${to2(chan(H - 1 / 3))}`;
  }

  // src/automata/automaton.js
  var AutomatonError = class extends Error {
    constructor(code, message, details = {}) {
      super(message);
      this.name = "AutomatonError";
      this.code = code;
      this.details = details;
    }
  };
  function deepClone(value) {
    if (value === null || typeof value !== "object") return value;
    if (value instanceof Map) {
      return new Map([...value.entries()].map(([k, v]) => [deepClone(k), deepClone(v)]));
    }
    if (value instanceof Set) return new Set([...value].map(deepClone));
    if (Array.isArray(value)) return value.map(deepClone);
    const proto = Object.getPrototypeOf(value);
    if (proto === Object.prototype || proto === null) {
      const out2 = {};
      for (const [key, entry] of Object.entries(value)) out2[key] = deepClone(entry);
      return out2;
    }
    let out;
    try {
      out = new value.constructor();
    } catch {
      out = Object.create(proto);
    }
    for (const [key, entry] of Object.entries(value)) out[key] = deepClone(entry);
    return out;
  }
  var KNOWN_TRANSITION_IDS = new Set(
    (NAMED_TRANSITIONS || []).map((t) => t && t.id).filter(Boolean)
  );
  function assertNamedTransition(id) {
    let known = KNOWN_TRANSITION_IDS.size ? KNOWN_TRANSITION_IDS.has(id) : true;
    if (!known && typeof transitionById === "function") known = Boolean(transitionById(id));
    if (!known) {
      throw new AutomatonError("UNKNOWN_TRANSITION", `Trace steps must use a named transition from the lexicon (spec \xA77); got: ${id}`, { transition: id });
    }
  }
  function normalizeAddress(address = {}, dimension = null) {
    const addr = { line: 1, color: 1, tone: 1, base: 1, ...address };
    if (addr.planetaryDimension == null && dimension) addr.planetaryDimension = dimension;
    if (typeof addr.gate === "number" && addr.gate >= 1 && addr.gate <= 64) {
      const gateArcSec = (addr.gate - 1) * 20250 + (addr.line - 1) * 3375;
      if (addr.zodiac == null) addr.zodiac = Math.min(12, Math.floor(gateArcSec / 108e3) + 1);
      if (addr.house == null) addr.house = Math.min(8, Math.floor(gateArcSec / 162e3) + 1);
      if (addr.arcSecond == null) addr.arcSecond = gateArcSec;
    }
    return addr;
  }
  function addrKeyOf(address = {}) {
    return `G${address.gate ?? 0}.L${address.line ?? 0}.C${address.color ?? 0}.T${address.tone ?? 0}.B${address.base ?? 0}`;
  }
  var Automaton = class {
    constructor({
      id,
      address,
      states = [],
      alphabet = [],
      delta = null,
      q0 = null,
      finals = [],
      ports = { in: [{ id: "input", type: "json" }], out: [{ id: "output", type: "json" }] },
      capabilities = [],
      dimension = null,
      implementation = null,
      state = null,
      automatonForm = null
    } = {}) {
      if (typeof id !== "string" || !id) throw new AutomatonError("MISSING_ID", "Automaton requires an id");
      this.id = id;
      this.dimension = dimension;
      this.address = normalizeAddress(address, dimension);
      this.addressKey = addrKeyOf(this.address);
      this.states = states.map((s) => typeof s === "string" ? { id: s } : { ...s });
      this.alphabet = [...alphabet];
      this.delta = delta;
      this.q0 = q0 || (this.states.find((s) => s.initial) || this.states[0] || {}).id || null;
      this.finals = finals.length ? [...finals] : this.states.filter((s) => s.accepting).map((s) => s.id);
      this.ports = ports;
      this.capabilities = [...capabilities];
      this.implementation = implementation;
      this.automatonForm = automatonForm;
      this.ownedState = state;
      this.lifecycle = "ready";
      this.calls = 0;
      this._trace = null;
      this._ledger = null;
    }
    // Record one trace step carrying named transition id + sound + color (contract hard rule 1).
    _recordStep({ from, to, input = null, transition = "flow", note = null }) {
      assertNamedTransition(transition);
      const entry = Object.freeze({
        seq: this._trace ? this._trace.length : 0,
        from,
        input,
        transition,
        to,
        sound: transitionSound(transition, this.address),
        color: transitionColor(transition, this.address),
        ...note ? { note } : {}
      });
      if (this._trace) {
        this._trace.push(entry);
        this._ledger.transitionCount += 1;
        this._ledger.edgesTraversed += 1;
        this._ledger.statesGenerated += 1;
      }
      return entry;
    }
    step(stateId, symbol, ctx = {}) {
      if (typeof this.delta !== "function") {
        throw new AutomatonError("MISSING_DELTA", `Automaton ${this.id} has no transition function`);
      }
      const result = this.delta(stateId, symbol, ctx) || {};
      const to = result.to ?? stateId;
      this._recordStep({ from: stateId, to, input: symbol, transition: result.transition || "flow" });
      return { ...result, to };
    }
    run(input, context = {}) {
      this.lifecycle = "active";
      this.calls += 1;
      const trace = [];
      const ledger = {
        primitivesActivated: 0,
        statesGenerated: 0,
        edgesTraversed: 0,
        operationsExecuted: 0,
        recursionDepth: 0,
        activeAutomata: 1,
        transitionCount: 0
      };
      this._trace = trace;
      this._ledger = ledger;
      const emit = (step) => this._recordStep(step);
      try {
        emit({ from: "dormant", to: this.q0, input: null, transition: "ignition" });
        let output;
        let finalState = this.q0;
        if (typeof this.implementation === "function") {
          ledger.operationsExecuted += 1;
          output = this.implementation(input, {
            automaton: this,
            state: this.ownedState,
            emit,
            context
          });
          if (trace.length > 1) finalState = trace[trace.length - 1].to;
        } else {
          const symbols = Array.isArray(input) ? input : typeof input === "string" ? [...input] : input && Array.isArray(input.symbols) ? input.symbols : [];
          ledger.primitivesActivated = symbols.length;
          const outputs = [];
          let current = this.q0;
          for (const symbol of symbols) {
            const result = this.step(current, symbol, { automaton: this, context });
            current = result.to;
            if (result.output !== void 0) outputs.push(result.output);
          }
          finalState = current;
          output = outputs.length <= 1 ? outputs[0] ?? null : outputs;
        }
        emit({ from: finalState, to: finalState, input: null, transition: "automatize" });
        const reachedFinal = this.finals.length === 0 || this.finals.includes(finalState);
        const accepted = reachedFinal && !(output && typeof output === "object" && output.ok === false);
        this.lifecycle = "ready";
        return { output, trace, ledger, accepted, finalState };
      } catch (error) {
        this.lifecycle = "error";
        throw error;
      } finally {
        this._trace = null;
        this._ledger = null;
      }
    }
    /**
     * Experiential return: after a run, the engine feeds the result summary back
     * into the automaton's owned state as an experience record
     * {derivationId, intakeId, outputHash, seq} — timestamp-free, counter-
     * sequenced, so exportState/hydrate round-trip it and replay reproduces it.
     * Tools that declared no persistent memory (state: null) gain an
     * { experiences: [] } log; Map-rooted state keeps the log under the
     * 'experiences' key (deepClone preserves both shapes).
     */
    absorbExperience(record = {}) {
      const entry = Object.freeze({ ...record });
      if (this.ownedState instanceof Map) {
        const list = this.ownedState.get("experiences");
        const next = Array.isArray(list) ? [...list, entry] : [entry];
        this.ownedState.set("experiences", next);
        return next.length;
      }
      if (this.ownedState == null || typeof this.ownedState !== "object") this.ownedState = {};
      if (!Array.isArray(this.ownedState.experiences)) this.ownedState.experiences = [];
      this.ownedState.experiences.push(entry);
      return this.ownedState.experiences.length;
    }
    exportState() {
      return this.ownedState == null ? null : deepClone(this.ownedState);
    }
    hydrate(state) {
      this.ownedState = state == null ? null : deepClone(state);
      return this;
    }
    manifest() {
      return Object.freeze({
        manifestVersion: "ato.automaton.v1",
        id: this.id,
        address: Object.freeze({ ...this.address }),
        addressKey: this.addressKey,
        automatonForm: this.automatonForm,
        dimension: this.dimension,
        states: Object.freeze(this.states.map((s) => Object.freeze({ ...s }))),
        alphabet: Object.freeze([...this.alphabet]),
        q0: this.q0,
        finals: Object.freeze([...this.finals]),
        ports: deepClone(this.ports),
        capabilities: Object.freeze([...this.capabilities]),
        lifecycle: this.lifecycle,
        calls: this.calls
      });
    }
  };

  // src/automata/tools/tool-01-autoling-lite.js
  var tokenize = (text) => String(text).toLowerCase().match(/[a-z0-9_'-]+/g) || [];
  function seedRules(state) {
    learn(state, { id: "has-property.v1", relation: "HAS_PROPERTY", pattern: ["$object", "is", "$property"], template: "$object is $property" });
    learn(state, { id: "part-of.v1", relation: "PART_OF", pattern: ["$part", "belongs", "to", "$whole"], template: "$part belongs to $whole" });
  }
  function learn(state, { id, relation, pattern, template, arity = null, provenance = null } = {}) {
    if (!relation || !Array.isArray(pattern) || !pattern.length || typeof template !== "string") {
      return { ok: false, reason: "INVALID_GRAMMAR_RULE" };
    }
    const ruleId = id || `rule-${++state.sequence}`;
    const variables = [...new Set(pattern.filter((token) => typeof token === "string" && token.startsWith("$")))];
    const rule = {
      id: ruleId,
      relation,
      pattern: [...pattern],
      template,
      arity: arity ?? variables.length,
      variables,
      provenance,
      revision: 1
    };
    state.rules[ruleId] = rule;
    return { ok: true, rule };
  }
  function recognize(state, text) {
    const tokens = tokenize(text);
    const matches = [];
    for (const ruleId of Object.keys(state.rules).sort()) {
      const rule = state.rules[ruleId];
      if (tokens.length !== rule.pattern.length) continue;
      const bindings = {};
      let valid = true;
      for (let i = 0; i < tokens.length; i++) {
        const expected = String(rule.pattern[i]).toLowerCase();
        if (expected.startsWith("$")) {
          const prior = bindings[expected];
          if (prior && prior !== tokens[i]) {
            valid = false;
            break;
          }
          bindings[expected] = tokens[i];
        } else if (expected !== tokens[i]) {
          valid = false;
          break;
        }
      }
      if (valid) {
        matches.push({
          ruleId: rule.id,
          relation: rule.relation,
          bindings,
          structure: rule.variables.map((v) => bindings[v])
        });
      }
    }
    return { ok: matches.length > 0, text: String(text), matches };
  }
  function generate(state, relation, args = []) {
    const rules = Object.keys(state.rules).sort().map((id) => state.rules[id]).filter((rule2) => rule2.relation === relation);
    if (!rules.length) return { ok: false, reason: "RULE_NOT_FOUND", relation };
    const rule = rules[0];
    if (args.length !== rule.arity) {
      return { ok: false, reason: "ARITY_MISMATCH", expected: rule.arity, received: args.length };
    }
    let surface = rule.template;
    rule.variables.forEach((variable, index) => {
      surface = surface.replaceAll(variable, args[index]);
    });
    return { ok: true, relation, ruleId: rule.id, surface };
  }
  var _AutolingLiteAutomaton = class _AutolingLiteAutomaton extends Automaton {
    constructor() {
      const d = _AutolingLiteAutomaton.registry;
      const memory = { rules: {}, sequence: 0 };
      seedRules(memory);
      super({
        id: d.id,
        address: { gate: d.gate, line: 1, color: 1, tone: 1, base: 1 },
        states: [
          { id: "listen", initial: true },
          { id: "abstract" },
          { id: "coin-rule" },
          { id: "test", accepting: true }
        ],
        alphabet: ["token", "$variable", "pattern", "template", "relation"],
        q0: "listen",
        finals: ["test"],
        ports: d.ports,
        capabilities: d.capabilities,
        dimension: d.dimension,
        automatonForm: d.automatonForm,
        state: memory,
        implementation: (input = {}, { state, emit }) => {
          if (!state.rules) {
            state.rules = {};
            state.sequence = state.sequence || 0;
            seedRules(state);
          }
          emit({ from: "listen", to: "abstract", input: input.operation || "export", transition: "flow" });
          const operation = input.operation;
          let current = "abstract";
          let output;
          if (operation === "learn") {
            emit({ from: "abstract", to: "coin-rule", input: "rule", transition: "fusion" });
            current = "coin-rule";
            output = learn(state, input.rule || {});
          } else if (operation === "recognize") {
            output = recognize(state, input.text);
          } else if (operation === "generate") {
            emit({ from: "abstract", to: "coin-rule", input: input.relation || null, transition: "flow" });
            current = "coin-rule";
            output = generate(state, input.relation, input.args || []);
          } else if (operation === "export") {
            output = { ok: true, rules: Object.keys(state.rules).sort().map((id) => ({ ...state.rules[id] })) };
          } else {
            output = { ok: false, reason: "UNKNOWN_OPERATION" };
          }
          emit({ from: current, to: "test", input: null, transition: "flow", note: operation || "export" });
          return output;
        }
      });
    }
  };
  __publicField(_AutolingLiteAutomaton, "registry", Object.freeze({
    id: "autoling-lite",
    aliases: ["auto-ling-lite"],
    gate: 17,
    channels: ["17-62"],
    capabilities: ["learn", "recognize", "generate", "export"],
    ports: Object.freeze({
      in: Object.freeze([Object.freeze({ id: "input", type: "json" })]),
      out: Object.freeze([Object.freeze({ id: "output", type: "json", guarantees: ["addressed"] })])
    }),
    automatonForm: "rule-induction FSM",
    dimension: "Design",
    description: "Klein's AutoLing, lite: induces token-pattern grammar rules with $variables, recognizes utterances by exact-length binding-consistent match, generates surfaces from templates."
  }));
  var AutolingLiteAutomaton = _AutolingLiteAutomaton;

  // src/automata/tools/tool-02-diseminer-lite.js
  var tool_02_diseminer_lite_exports = {};
  __export(tool_02_diseminer_lite_exports, {
    DiseminerLiteAutomaton: () => DiseminerLiteAutomaton
  });
  var tokenize2 = (text) => String(text).toLowerCase().match(/[a-z0-9_'-]+/g) || [];
  function ingest(state, text, context = {}) {
    const tokens = tokenize2(text);
    const document = {
      id: `doc-${++state.sequence}`,
      source: context.source ?? null,
      address: context.address ?? null,
      tokens
    };
    state.documents.push(document);
    const windowSize = state.windowSize;
    for (let i = 0; i < tokens.length; i++) {
      const term = tokens[i];
      if (!state.vectors[term]) state.vectors[term] = {};
      const vector = state.vectors[term];
      for (let j = Math.max(0, i - windowSize); j <= Math.min(tokens.length - 1, i + windowSize); j++) {
        if (i === j) continue;
        const ctx = tokens[j];
        vector[ctx] = (vector[ctx] || 0) + 1;
      }
    }
    return { ok: true, document };
  }
  function similarity(state, a, b) {
    const x = state.vectors[String(a).toLowerCase()];
    const y = state.vectors[String(b).toLowerCase()];
    if (!x || !y) return 0;
    const keys = /* @__PURE__ */ new Set([...Object.keys(x), ...Object.keys(y)]);
    let dot = 0;
    let ax = 0;
    let by = 0;
    for (const key of keys) {
      const xv = x[key] || 0;
      const yv = y[key] || 0;
      dot += xv * yv;
      ax += xv * xv;
      by += yv * yv;
    }
    return ax && by ? dot / (Math.sqrt(ax) * Math.sqrt(by)) : 0;
  }
  function neighbors(state, term, { limit = 5 } = {}) {
    const key = String(term).toLowerCase();
    if (!state.vectors[key]) return { ok: true, term: key, neighbors: [] };
    const ranked = Object.keys(state.vectors).filter((other) => other !== key).map((other) => ({ term: other, similarity: similarity(state, key, other) })).sort((a, b) => b.similarity - a.similarity || a.term.localeCompare(b.term)).slice(0, limit);
    return { ok: true, term: key, neighbors: ranked };
  }
  function infer(state, source, target, { minimum = 0 } = {}) {
    const viaList = neighbors(state, source, { limit: Object.keys(state.vectors).length }).neighbors.filter((item) => item.similarity >= minimum && similarity(state, item.term, target) > 0).map((item) => ({ via: item.term, score: (item.similarity + similarity(state, item.term, target)) / 2 })).sort((a, b) => b.score - a.score || a.via.localeCompare(b.via));
    return { ok: true, source, target, candidates: viaList };
  }
  function exportMemory(state) {
    return {
      ok: true,
      windowSize: state.windowSize,
      documents: state.documents.map((doc) => ({ ...doc, tokens: [...doc.tokens] })),
      vectors: Object.fromEntries(Object.keys(state.vectors).sort().map((term) => [term, { ...state.vectors[term] }]))
    };
  }
  var _DiseminerLiteAutomaton = class _DiseminerLiteAutomaton extends Automaton {
    constructor() {
      const d = _DiseminerLiteAutomaton.registry;
      super({
        id: d.id,
        address: { gate: d.gate, line: 1, color: 1, tone: 1, base: 1 },
        states: [
          { id: "receive", initial: true },
          { id: "simulate" },
          { id: "narrate", accepting: true }
        ],
        alphabet: ["token", "document", "vector", "term", "context"],
        q0: "receive",
        finals: ["narrate"],
        ports: d.ports,
        capabilities: d.capabilities,
        dimension: d.dimension,
        automatonForm: d.automatonForm,
        state: { windowSize: 2, vectors: {}, documents: [], sequence: 0 },
        implementation: (input = {}, { state, emit }) => {
          emit({ from: "receive", to: "simulate", input: input.operation || "export", transition: "flow" });
          const operation = input.operation;
          let output;
          if (operation === "ingest") {
            emit({ from: "simulate", to: "simulate", input: "co-occurrence", transition: "fusion" });
            output = ingest(state, input.text, input.context || {});
          } else if (operation === "neighbors") {
            output = neighbors(state, input.term, { limit: input.limit ?? 5 });
          } else if (operation === "infer") {
            emit({ from: "simulate", to: "simulate", input: `${input.source}->${input.target}`, transition: "recursion" });
            output = infer(state, input.source, input.target, input.options || {});
          } else if (operation === "export") {
            output = exportMemory(state);
          } else {
            output = { ok: false, reason: "UNKNOWN_OPERATION" };
          }
          emit({ from: "simulate", to: "narrate", input: null, transition: "weave", note: operation || "export" });
          return output;
        }
      });
    }
  };
  __publicField(_DiseminerLiteAutomaton, "registry", Object.freeze({
    id: "diseminer-lite",
    aliases: ["diseminar-lite"],
    gate: 48,
    channels: ["16-48"],
    capabilities: ["ingest", "neighbors", "infer", "export"],
    ports: Object.freeze({
      in: Object.freeze([Object.freeze({ id: "input", type: "json" })]),
      out: Object.freeze([Object.freeze({ id: "output", type: "json", guarantees: ["addressed"] })])
    }),
    automatonForm: "narrative-sim FSM",
    dimension: "Evolution",
    description: "Klein's Diseminer, lite: persistent symmetric-window co-occurrence vectors; cosine neighbors and two-hop distributional inference."
  }));
  var DiseminerLiteAutomaton = _DiseminerLiteAutomaton;

  // src/automata/tools/tool-03-klein-analogy.js
  var tool_03_klein_analogy_exports = {};
  __export(tool_03_klein_analogy_exports, {
    KleinAnalogyAutomaton: () => KleinAnalogyAutomaton
  });
  var xorBits = (a, b) => a.map((bit, i) => bit ^ b[i]);
  var xnorBits = (a, b) => a.map((bit, i) => Number(bit === b[i]));
  var applyOperator = (a, b, mode) => mode === "equivalence" ? xnorBits(a, b) : xorBits(a, b);
  var _KleinAnalogyAutomaton = class _KleinAnalogyAutomaton extends Automaton {
    constructor() {
      const d = _KleinAnalogyAutomaton.registry;
      super({
        id: d.id,
        address: { gate: d.gate, line: 1, color: 1, tone: 1, base: 1 },
        states: [
          { id: "source", initial: true },
          { id: "map" },
          { id: "target" },
          { id: "check", accepting: true }
        ],
        alphabet: ["feature", "bit", "vector", "relation"],
        q0: "source",
        finals: ["check"],
        ports: d.ports,
        capabilities: d.capabilities,
        dimension: d.dimension,
        automatonForm: d.automatonForm,
        state: null,
        implementation: (input = {}, { emit }) => {
          const { vocab = [], A = [], B = [], C = [], mode = "xor" } = input;
          if (mode !== "xor" && mode !== "equivalence") {
            return { ok: false, reason: "UNKNOWN_MODE", mode };
          }
          const universe = [...new Set(vocab)];
          const bits = (items) => universe.map((feature) => items.includes(feature) ? 1 : 0);
          emit({ from: "source", to: "map", input: `${A.length}:${B.length}`, transition: "flow" });
          const relation = applyOperator(bits(A), bits(B), mode);
          emit({ from: "map", to: "target", input: relation.join(""), transition: "mirror", note: mode });
          const resultBits = applyOperator(bits(C), relation, mode);
          const result = universe.filter((_, i) => resultBits[i] === 1);
          emit({ from: "target", to: "check", input: null, transition: "flow" });
          return { ok: true, relation: relation.join(""), result };
        }
      });
    }
  };
  __publicField(_KleinAnalogyAutomaton, "registry", Object.freeze({
    id: "klein-analogy",
    aliases: ["analogy"],
    gate: 4,
    channels: ["4-63"],
    capabilities: ["solve-analogy"],
    ports: Object.freeze({
      in: Object.freeze([Object.freeze({ id: "input", type: "json" })]),
      out: Object.freeze([Object.freeze({ id: "output", type: "json", guarantees: ["addressed"] })])
    }),
    automatonForm: "analogy transducer",
    dimension: "Design",
    description: "Klein's Boolean ATO analogy: A:B::C:? solved as membership bit vectors; relation = XOR or XNOR(A,B) applied to C (both operators involutive). Stateless."
  }));
  var KleinAnalogyAutomaton = _KleinAnalogyAutomaton;

  // src/automata/tools/tool-04-iching-grammar.js
  var tool_04_iching_grammar_exports = {};
  __export(tool_04_iching_grammar_exports, {
    IchingGrammarAutomaton: () => IchingGrammarAutomaton
  });

  // src/state-space/dimensions.js
  var DIMENSION_CHAINS = Object.freeze({
    Movement: ["wait", "prepare", "move", "transition"],
    Evolution: ["retain", "notice-change", "adapt", "transform"],
    Being: ["remain-self", "notice-other", "relate", "negotiate-relation"],
    Design: ["sense", "classify", "build", "test", "mount"],
    Space: ["witness", "integrate", "express", "complete"]
  });
  function projectDimension(state, fromDim, toDim) {
    if (!DIMENSIONS.includes(toDim)) {
      throw new RangeError(`unknown target dimension ${toDim}; expected one of ${DIMENSIONS.join(", ")}`);
    }
    const from = fromDim ?? state?.dimension ?? state?.planetaryDimension ?? null;
    const meta = DIMENSION_META[toDim];
    const identity = state?.identity ?? state?.id ?? state?.char ?? state?.value ?? state;
    return {
      identity,
      dimension: toDim,
      representation: {
        perspective: toDim,
        interrogative: meta.interrogative,
        operation: meta.operation,
        seedGate: meta.seedGate,
        octave: meta.octave,
        chain: DIMENSION_CHAINS[toDim],
        prior: state?.representation ?? state ?? null,
        projectedFrom: from
      },
      transition: `T_{${from || "?"}\u2192${toDim}}`
    };
  }

  // src/state-space/operators.js
  var asList = (operands) => Array.isArray(operands) ? operands : [operands];
  var requireBits = (bits, opId) => {
    if (!Array.isArray(bits) || bits.length !== 6 || bits.some((b) => b !== 0 && b !== 1)) {
      throw new TypeError(`${opId} expects a 6-bit array (line 1 first)`);
    }
    return bits;
  };
  function promoteScale(scale) {
    const i = SCALES.indexOf(scale);
    return i < 0 ? "mesh" : SCALES[Math.min(i + 1, SCALES.length - 1)];
  }
  var commonScale = (members) => {
    const scales = new Set(members.map((m) => m && m.scale).filter(Boolean));
    return scales.size === 1 ? [...scales][0] : null;
  };
  var OPERATORS = Object.freeze([
    {
      id: "o_bundle",
      arity: "variadic",
      name: "Fusion",
      rule: "simultaneous composition under shared slot; unordered",
      accepts: "any states",
      positionalRule: "unordered; E(A,B) === E(B,A) as sets",
      invariants: ["constituent-identity-preserved", "order-insensitive"],
      inverseId: null,
      scalesObserved: ["feature", "phoneme", "grapheme"],
      transform(operands) {
        const members = asList(operands).map((m, i) => ({ slot: i, member: m }));
        return {
          kind: "bundle",
          operator: "o_bundle",
          scale: commonScale(members.map((s) => s.member)) || "mixed",
          unordered: true,
          members
        };
      }
    },
    {
      id: "o_sequence",
      arity: "variadic",
      name: "Chain",
      rule: "ordered composition; E(A,B) \u2260 E(B,A); positional indexes are state",
      accepts: "any states",
      positionalRule: "position i is part of composite state",
      invariants: ["order-sensitive", "length-preserving"],
      inverseId: null,
      scalesObserved: ["grapheme", "morpheme", "word", "phrase"],
      transform(operands) {
        const members = asList(operands);
        const base = commonScale(members);
        return {
          kind: "sequence",
          operator: "o_sequence",
          id: `composite_${members.length}`,
          positional: true,
          scale: base ? promoteScale(base) : "mixed",
          members: members.map((m, i) => ({ position: i, member: m }))
        };
      }
    },
    {
      id: "o_project",
      arity: 1,
      name: "Perspective",
      rule: "dimensional re-representation T_{i\u2192j}",
      accepts: "a state + context {from, to}",
      positionalRule: "unary",
      invariants: ["identity-preserved-across-dimensions", "representation-not-preserved (H4, measured)"],
      inverseId: null,
      scalesObserved: ["word", "sentence", "automaton"],
      transform(operand, context = {}) {
        const from = context.from ?? operand.dimension ?? null;
        const to = context.to;
        if (!to) throw new TypeError("o_project requires context.to (target dimension)");
        return projectDimension(operand, from, to);
      }
    },
    {
      id: "o_recurse",
      arity: 1,
      name: "Recursion",
      rule: "output re-enters as operand; depth logged in ledger",
      accepts: "a state + context {operator, depth=1, maxDepth=8}",
      positionalRule: "unary",
      invariants: ["depth-limited", "depth-logged"],
      inverseId: null,
      scalesObserved: ["sentence", "discourse", "automaton"],
      transform(operand, context = {}) {
        const { operator, depth = 1, maxDepth = 8 } = context;
        if (typeof operator !== "function") throw new TypeError("o_recurse requires context.operator (function)");
        const d = Math.min(Math.max(0, depth | 0), maxDepth);
        let value = operand;
        const trace = [];
        for (let i = 0; i < d; i++) {
          value = operator(value);
          trace.push(value);
        }
        return {
          kind: "recursion",
          operator: "o_recurse",
          depth: d,
          maxDepth,
          input: operand,
          output: value,
          trace,
          ledger: { recursionDepth: d }
        };
      }
    },
    {
      id: "o_transform",
      arity: 2,
      name: "Mutation",
      rule: "applies a named transition rule to a state",
      accepts: "(state, rule: transition-id string | (state)=>state | {apply})",
      positionalRule: "(state, rule)",
      invariants: ["rule-must-be-named-or-pure", "state-identity-logged"],
      inverseId: null,
      scalesObserved: ["word", "phrase", "sentence"],
      transform(operands, context = {}) {
        const [state, rule = context.rule] = asList(operands);
        if (typeof rule === "string") {
          return {
            kind: "mutation",
            operator: "o_transform",
            transition: rule,
            input: state,
            output: { ...state && typeof state === "object" ? state : { value: state }, transitionApplied: rule }
          };
        }
        const fn = typeof rule === "function" ? rule : rule && rule.apply;
        if (typeof fn !== "function") throw new TypeError("o_transform requires a named transition id or a pure rule function");
        return { kind: "mutation", operator: "o_transform", transition: rule.name || "anonymous", input: state, output: fn(state) };
      }
    },
    {
      id: "o_automaton",
      arity: "variadic",
      name: "Automatization",
      rule: "wraps states+transitions into an executable automaton",
      accepts: "a descriptor {states, transitions} (or state list + context.transitions)",
      positionalRule: "descriptor-first",
      invariants: ["q0-is-first-state-unless-marked-initial", "finals-are-accepting-states"],
      inverseId: null,
      scalesObserved: ["automaton"],
      transform(operands, context = {}) {
        const list = asList(operands);
        const desc = list.length === 1 && list[0] && list[0].states ? list[0] : { states: list, transitions: context.transitions || [] };
        const states = desc.states || [];
        const q0 = (states.find((s) => s && s.initial) || states[0] || {}).id ?? null;
        return {
          kind: "automaton",
          operator: "o_automaton",
          scale: "automaton",
          id: desc.id || `automaton_${states.length}`,
          states,
          transitions: desc.transitions || [],
          q0,
          finals: states.filter((s) => s && s.accepting).map((s) => s.id)
        };
      }
    },
    {
      id: "o_discourse",
      arity: "variadic",
      name: "Weave",
      rule: "composes L5 units into L6 with coherence pressure",
      accepts: "ordered sentence/phrase units",
      positionalRule: "ordered; coherence links adjacent units",
      invariants: ["order-sensitive", "promotes-to-discourse"],
      inverseId: null,
      scalesObserved: ["sentence", "discourse"],
      transform(operands) {
        const units = asList(operands);
        return {
          kind: "discourse",
          operator: "o_discourse",
          id: `discourse_${units.length}`,
          scale: "discourse",
          coherencePressure: units.length > 1 ? 1 / units.length : 0,
          units: units.map((u, i) => ({ position: i, unit: u }))
        };
      }
    },
    {
      id: "o_reverse",
      arity: 1,
      name: "Mirror",
      rule: "Fu Xi reverse variation (bit order reversed)",
      accepts: "6-bit array (line 1 first)",
      positionalRule: "unary",
      invariants: ["involution: o_reverse\u2218o_reverse = id"],
      inverseId: "o_reverse",
      scalesObserved: ["grapheme", "automaton"],
      transform(bits) {
        const b = requireBits(Array.isArray(bits) ? bits : [bits], "o_reverse");
        return [...b].reverse();
      }
    },
    {
      id: "o_inverse",
      arity: 1,
      name: "Shadow",
      rule: "yin\u2194yang line inversion (each bit flipped)",
      accepts: "6-bit array (line 1 first)",
      positionalRule: "unary",
      invariants: ["involution: o_inverse\u2218o_inverse = id"],
      inverseId: "o_inverse",
      scalesObserved: ["grapheme", "automaton"],
      transform(bits) {
        const b = requireBits(Array.isArray(bits) ? bits : [bits], "o_inverse");
        return b.map((x) => 1 - x);
      }
    },
    {
      id: "o_converse",
      arity: 1,
      name: "Rotation",
      rule: "180\xB0 wheel rotation \u2014 CHOICE: reverse + inverse (o_inverse\u2218o_reverse); the trigram-swap reading of spec \xA74 is the same operation on the Fu Xi circle, since swapping lower/upper trigrams and complementing all lines maps each hexagram to its antipode",
      accepts: "6-bit array (line 1 first)",
      positionalRule: "unary",
      invariants: ["involution: o_converse\u2218o_converse = id"],
      inverseId: "o_converse",
      scalesObserved: ["grapheme", "automaton"],
      transform(bits) {
        const b = requireBits(Array.isArray(bits) ? bits : [bits], "o_converse");
        return [...b].reverse().map((x) => 1 - x);
      }
    },
    {
      id: "o_nuclear",
      arity: 1,
      name: "Core",
      rule: "extract nuclear hexagram: lower trigram = lines 2-3-4 (bits[1,2,3]), upper trigram = lines 3-4-5 (bits[2,3,4])",
      accepts: "6-bit array (line 1 first)",
      positionalRule: "unary",
      invariants: ["interior-lines-only", "deterministic"],
      inverseId: null,
      scalesObserved: ["automaton"],
      transform(bits) {
        const b = requireBits(Array.isArray(bits) ? bits : [bits], "o_nuclear");
        const lower = [b[1], b[2], b[3]];
        const upper = [b[2], b[3], b[4]];
        const nuclearBits = [...lower, ...upper];
        return { kind: "nuclear", operator: "o_nuclear", lower, upper, bits: nuclearBits, gate: gateFromBits(nuclearBits) };
      }
    },
    {
      id: "o_change",
      arity: 2,
      name: "Becoming",
      rule: "moving lines \u2192 target state (hexagram \u2192 hexagram): xor bits with changing-lines mask",
      accepts: "(6-bit array, mask: 6-bit array | changing line numbers 1-6)",
      positionalRule: "(bits, mask)",
      invariants: ["xor-exact", "mask-of-zero-is-identity"],
      inverseId: null,
      scalesObserved: ["automaton"],
      transform(operands, context = {}) {
        const [rawBits, mask = context.mask] = asList(operands);
        const b = requireBits(Array.isArray(rawBits) ? rawBits : [rawBits], "o_change");
        if (!Array.isArray(mask)) throw new TypeError("o_change requires a mask (6-bit array or line numbers 1-6)");
        const maskBits = mask.length === 6 && mask.every((x) => x === 0 || x === 1) ? mask : [0, 0, 0, 0, 0, 0].map((_, i) => mask.includes(i + 1) ? 1 : 0);
        const targetBits = b.map((x, i) => x ^ maskBits[i]);
        return { kind: "becoming", operator: "o_change", mask: maskBits, bits: targetBits, gate: gateFromBits(targetBits) };
      }
    }
  ]);
  var BY_ID2 = new Map(OPERATORS.map((o) => [o.id, o]));
  function operatorById(id) {
    return BY_ID2.get(id) || null;
  }

  // src/automata/tools/tool-04-iching-grammar.js
  var trigramFor = (bits3) => {
    const key = bits3.join("");
    const found = TRIGRAMS.find((t) => t.bits.join("") === key);
    return found ? { id: found.id, name: found.name, element: found.element, bits: [...bits3] } : { id: null, bits: [...bits3] };
  };
  var binaryValueOf = (lines) => Number.parseInt([...lines].reverse().join(""), 2);
  var LOCAL_TRANSFORMS = {
    mirror: (lines) => [...lines].reverse(),
    // o_reverse: Fu Xi reverse variation
    shadow: (lines) => lines.map((b) => 1 - b),
    // o_inverse: yin<->yang inversion
    rotation: (lines) => [...lines].reverse().map((b) => 1 - b),
    // o_converse: 180° wheel rotation (reverse+inverse)
    core: (lines) => [lines[1], lines[2], lines[3], lines[2], lines[3], lines[4]],
    // o_nuclear: lines 2-3-4 / 3-4-5
    becoming: (lines, changingLines = []) => {
      const out = [...lines];
      for (const line of changingLines) {
        const index = line - 1;
        if (index >= 0 && index < 6) out[index] = 1 - out[index];
      }
      return out;
    }
  };
  var OPERATOR_IDS = {
    mirror: "o_reverse",
    shadow: "o_inverse",
    rotation: "o_converse",
    core: "o_nuclear",
    becoming: "o_change"
  };
  function applyNamedTransform(name, lines, changingLines) {
    try {
      const op = operatorById(OPERATOR_IDS[name]);
      if (op && typeof op.transform === "function") {
        const out = name === "becoming" ? op.transform([[...lines], changingLines || []]) : op.transform([...lines]);
        const arr = Array.isArray(out) ? out : out && Array.isArray(out.bits) ? out.bits : null;
        if (arr && arr.length === 6 && arr.every((b) => b === 0 || b === 1)) return [...arr];
      }
    } catch {
    }
    return LOCAL_TRANSFORMS[name](lines, changingLines);
  }
  var validLines = (lines) => Array.isArray(lines) && lines.length === 6 && lines.every((x) => x === 0 || x === 1);
  var _IchingGrammarAutomaton = class _IchingGrammarAutomaton extends Automaton {
    constructor() {
      const d = _IchingGrammarAutomaton.registry;
      super({
        id: d.id,
        address: { gate: d.gate, line: 1, color: 1, tone: 1, base: 1 },
        states: [
          { id: "cast", initial: true },
          { id: "read-lines" },
          { id: "transform" },
          { id: "resolve", accepting: true }
        ],
        alphabet: ["yin", "yang", "trigram", "hexagram", "changing-line"],
        q0: "cast",
        finals: ["resolve"],
        ports: d.ports,
        capabilities: d.capabilities,
        dimension: d.dimension,
        automatonForm: d.automatonForm,
        state: null,
        implementation: (input = {}, { emit }) => {
          emit({ from: "cast", to: "read-lines", input: "lines", transition: "flow" });
          if (!validLines(input.lines)) {
            emit({ from: "read-lines", to: "resolve", input: null, transition: "weakening" });
            return { ok: false, reason: "SIX_BINARY_LINES_REQUIRED" };
          }
          const lines = [...input.lines];
          const base = {
            ok: true,
            lines,
            // King Wen gate number of the cast hexagram (state-space table:
            // lines are line-1-first bits = Fu Xi decimal, mapped via
            // gateFromBits). A hexagram grammar names its hexagrams; this is
            // what lets a downstream tool SPEAK the gate (H10 experiment).
            gate: gateFromBits(lines),
            lower: trigramFor(lines.slice(0, 3)),
            upper: trigramFor(lines.slice(3, 6)),
            binaryValue: binaryValueOf(lines)
          };
          const name = input.transform;
          if (!name) {
            emit({ from: "read-lines", to: "resolve", input: null, transition: "flow" });
            return base;
          }
          if (!LOCAL_TRANSFORMS[name]) {
            emit({ from: "read-lines", to: "resolve", input: null, transition: "weakening" });
            return { ok: false, reason: "UNKNOWN_TRANSFORM", transform: name };
          }
          emit({ from: "read-lines", to: "transform", input: name, transition: name });
          const transformed = applyNamedTransform(name, lines, input.changingLines || []);
          emit({ from: "transform", to: "resolve", input: null, transition: "becoming" });
          return {
            ...base,
            transform: name,
            transformed: {
              lines: transformed,
              gate: gateFromBits(transformed),
              lower: trigramFor(transformed.slice(0, 3)),
              upper: trigramFor(transformed.slice(3, 6)),
              binaryValue: binaryValueOf(transformed)
            }
          };
        }
      });
    }
  };
  __publicField(_IchingGrammarAutomaton, "registry", Object.freeze({
    id: "iching-grammar",
    aliases: ["iching"],
    gate: 61,
    channels: ["24-61"],
    capabilities: ["cast", "transform"],
    ports: Object.freeze({
      in: Object.freeze([Object.freeze({ id: "input", type: "json" })]),
      out: Object.freeze([Object.freeze({ id: "output", type: "json", guarantees: ["addressed"] })])
    }),
    automatonForm: "hexagram pushdown automaton",
    dimension: "Being",
    description: "Klein's I Ching grammar: 6 binary lines -> lower/upper trigrams + binary value; named transforms mirror/shadow/rotation/core/becoming via the state-space operators."
  }));
  var IchingGrammarAutomaton = _IchingGrammarAutomaton;

  // src/automata/tools/tool-05-language-contact.js
  var tool_05_language_contact_exports = {};
  __export(tool_05_language_contact_exports, {
    LanguageContactAutomaton: () => LanguageContactAutomaton
  });
  var _LanguageContactAutomaton = class _LanguageContactAutomaton extends Automaton {
    constructor() {
      const d = _LanguageContactAutomaton.registry;
      super({
        id: d.id,
        address: { gate: d.gate, line: 1, color: 1, tone: 1, base: 1 },
        states: [
          { id: "borrow", initial: true },
          { id: "adapt" },
          { id: "nativize", accepting: true }
        ],
        alphabet: ["rule", "grammar", "generation", "contact-event"],
        q0: "borrow",
        finals: ["nativize"],
        ports: d.ports,
        capabilities: d.capabilities,
        dimension: d.dimension,
        automatonForm: d.automatonForm,
        state: null,
        implementation: (input = {}, { emit }) => {
          const { grammarA = {}, grammarB = {} } = input;
          const seed = input.seed ?? 1;
          const rate = input.contactRate ?? 0.15;
          const generations = input.generations ?? 10;
          const rng = mulberry32(seed);
          let grammar = { ...grammarA };
          const trajectory = [{ generation: 0, grammar: { ...grammar } }];
          emit({ from: "borrow", to: "adapt", input: `seed=${seed}`, transition: "flow" });
          for (let generation = 1; generation <= generations; generation++) {
            const next = { ...grammar };
            for (const rule of Object.keys(grammarB).sort()) {
              if (rng() < rate) next[rule] = grammarB[rule];
            }
            grammar = next;
            trajectory.push({ generation, grammar: { ...grammar } });
          }
          emit({ from: "adapt", to: "nativize", input: `generations=${generations}`, transition: "fusion" });
          return { ok: true, finalGrammar: grammar, trajectory };
        }
      });
    }
  };
  __publicField(_LanguageContactAutomaton, "registry", Object.freeze({
    id: "language-contact",
    aliases: ["contact"],
    gate: 12,
    channels: ["12-22"],
    capabilities: ["simulate-contact"],
    ports: Object.freeze({
      in: Object.freeze([Object.freeze({ id: "input", type: "json" })]),
      out: Object.freeze([Object.freeze({ id: "output", type: "json", guarantees: ["addressed"] })])
    }),
    automatonForm: "dual-tape transducer",
    dimension: "Movement",
    description: "Seeded contact simulation: per generation, each sorted grammarB rule replaces the matching grammarA rule when rng() < contactRate."
  }));
  var LanguageContactAutomaton = _LanguageContactAutomaton;

  // src/automata/tools/tool-06-historical-monte-carlo.js
  var tool_06_historical_monte_carlo_exports = {};
  __export(tool_06_historical_monte_carlo_exports, {
    HistoricalMonteCarloAutomaton: () => HistoricalMonteCarloAutomaton
  });
  var normalize = (weights) => {
    const total = Object.values(weights).reduce((sum, n) => sum + n, 0) || 1;
    return Object.fromEntries(Object.entries(weights).map(([k, v]) => [k, v / total]));
  };
  var _HistoricalMonteCarloAutomaton = class _HistoricalMonteCarloAutomaton extends Automaton {
    constructor() {
      const d = _HistoricalMonteCarloAutomaton.registry;
      super({
        id: d.id,
        address: { gate: d.gate, line: 1, color: 1, tone: 1, base: 1 },
        states: [
          { id: "hypothesize", initial: true },
          { id: "sample" },
          { id: "tally" },
          { id: "conclude", accepting: true }
        ],
        alphabet: ["variant", "weight", "generation", "sample"],
        q0: "hypothesize",
        finals: ["conclude"],
        ports: d.ports,
        capabilities: d.capabilities,
        dimension: d.dimension,
        automatonForm: d.automatonForm,
        state: null,
        implementation: (input = {}, { emit }) => {
          const variants = input.variants || {};
          const seed = input.seed ?? 7;
          const scale = input.mutationScale ?? 0.1;
          const generations = input.generations ?? 20;
          const rng = mulberry32(seed);
          emit({ from: "hypothesize", to: "sample", input: `variants=${Object.keys(variants).length}`, transition: "flow" });
          let weights = { ...variants };
          const trajectory = [{ generation: 0, weights: normalize(weights) }];
          for (let generation = 1; generation <= generations; generation++) {
            weights = Object.fromEntries(Object.entries(weights).map(([name, value]) => [name, Math.max(0, value * (1 + (rng() - 0.5) * 2 * scale))]));
            trajectory.push({ generation, weights: normalize(weights) });
          }
          emit({ from: "sample", to: "tally", input: `generations=${generations}`, transition: "recursion" });
          const finalWeights = normalize(weights);
          const dominantVariant = Object.entries(finalWeights).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] || null;
          emit({ from: "tally", to: "conclude", input: dominantVariant, transition: "flow" });
          return { ok: true, finalWeights, dominantVariant, trajectory };
        }
      });
    }
  };
  __publicField(_HistoricalMonteCarloAutomaton, "registry", Object.freeze({
    id: "historical-monte-carlo",
    aliases: ["monte-carlo"],
    gate: 32,
    channels: ["32-54"],
    capabilities: ["sample-histories"],
    ports: Object.freeze({
      in: Object.freeze([Object.freeze({ id: "input", type: "json" })]),
      out: Object.freeze([Object.freeze({ id: "output", type: "json", guarantees: ["addressed"] })])
    }),
    automatonForm: "sampling automaton",
    dimension: "Evolution",
    description: "Klein's historical Monte Carlo: seeded multiplicative weight drift w *= max(0, 1+(rng()-0.5)*2*mutationScale), normalized per generation; reports dominant variant."
  }));
  var HistoricalMonteCarloAutomaton = _HistoricalMonteCarloAutomaton;

  // src/automata/tools/tool-07-autonovel.js
  var tool_07_autonovel_exports = {};
  __export(tool_07_autonovel_exports, {
    AutonovelAutomaton: () => AutonovelAutomaton
  });
  var clone = (value) => {
    if (value === null || typeof value !== "object") return value;
    if (Array.isArray(value)) return value.map(clone);
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, clone(v)]));
  };
  function register(state, domain) {
    if (!domain?.id || !Array.isArray(domain.primitives) || !Array.isArray(domain.combinators)) {
      return { ok: false, reason: "INVALID_DOMAIN" };
    }
    state.domains[domain.id] = {
      ...domain,
      primitives: domain.primitives.map((x) => ({ ...x })),
      combinators: domain.combinators.map((x) => ({ ...x }))
    };
    return { ok: true, domain: state.domains[domain.id] };
  }
  function generate2(state, { domain: domainId, seeds = [], maxDepth = 8 } = {}) {
    const domain = state.domains[domainId];
    if (!domain) return { ok: false, reason: "DOMAIN_NOT_FOUND", domain: domainId ?? null };
    let nodes = seeds.map((seed, index) => ({
      id: `node-${index + 1}`,
      type: seed.type,
      value: seed.value ?? seed.type,
      features: { ...seed.features || {} }
    }));
    const relations = [];
    const used = /* @__PURE__ */ new Set();
    for (let depth = 0; depth < maxDepth; depth++) {
      const possible = [];
      for (const combinator of domain.combinators) {
        const left = nodes.find((n) => n.type === combinator.inputs?.[0]);
        const right = nodes.find((n) => n.type === combinator.inputs?.[1] && n.id !== left?.id);
        if (left && right) {
          const key = `${combinator.id}:${left.id}:${right.id}`;
          if (!used.has(key)) possible.push({ combinator, left, right, key });
        }
      }
      if (!possible.length) break;
      possible.sort((a, b) => a.combinator.id.localeCompare(b.combinator.id) || a.key.localeCompare(b.key));
      const chosen = possible[0];
      used.add(chosen.key);
      const created = {
        id: `node-${nodes.length + 1}`,
        type: chosen.combinator.output,
        value: chosen.combinator.apply ? chosen.combinator.apply(chosen.left.value, chosen.right.value) : [chosen.left.value, chosen.right.value],
        features: { ...chosen.left.features || {}, ...chosen.right.features || {} }
      };
      nodes = [...nodes, created];
      relations.push({
        type: chosen.combinator.type || "combine",
        source: [chosen.left.id, chosen.right.id],
        target: created.id,
        combinator: chosen.combinator.id
      });
    }
    return {
      ok: true,
      id: `structure-${++state.sequence}`,
      domain: domainId,
      nodes,
      relations,
      lineage: relations.map((r) => r.combinator),
      generationDepth: relations.length
    };
  }
  var _AutonovelAutomaton = class _AutonovelAutomaton extends Automaton {
    constructor() {
      const d = _AutonovelAutomaton.registry;
      super({
        id: d.id,
        address: { gate: d.gate, line: 1, color: 1, tone: 1, base: 1 },
        states: [
          { id: "premise", initial: true },
          { id: "weave" },
          { id: "chapter" },
          { id: "bind", accepting: true }
        ],
        alphabet: ["primitive", "combinator", "node", "relation", "structure"],
        q0: "premise",
        finals: ["bind"],
        ports: d.ports,
        capabilities: d.capabilities,
        dimension: d.dimension,
        automatonForm: d.automatonForm,
        state: { domains: {}, examples: [], sequence: 0 },
        implementation: (input = {}, { state, emit }) => {
          const operation = input.operation;
          emit({ from: "premise", to: "weave", input: operation || null, transition: "flow" });
          let output;
          if (operation === "register") {
            output = register(state, input.domain);
          } else if (operation === "learn") {
            state.examples.push(clone(input.structure ?? null));
            output = { ok: true, stored: state.examples.length };
          } else if (operation === "generate") {
            emit({ from: "weave", to: "chapter", input: input.spec?.domain || null, transition: "fusion" });
            output = generate2(state, input.spec || {});
            emit({ from: "chapter", to: "bind", input: output.id || null, transition: "chain" });
            return output;
          } else {
            output = { ok: false, reason: "UNKNOWN_OPERATION" };
          }
          emit({ from: "weave", to: "chapter", input: null, transition: "weave", note: operation });
          emit({ from: "chapter", to: "bind", input: null, transition: "chain" });
          return output;
        }
      });
    }
  };
  __publicField(_AutonovelAutomaton, "registry", Object.freeze({
    id: "autonovel",
    aliases: ["novel"],
    gate: 56,
    channels: ["11-56"],
    capabilities: ["register", "learn", "generate"],
    ports: Object.freeze({
      in: Object.freeze([Object.freeze({ id: "input", type: "json" })]),
      out: Object.freeze([Object.freeze({ id: "output", type: "json", guarantees: ["addressed"] })])
    }),
    automatonForm: "generative stack machine",
    dimension: "Design",
    description: "Klein's AutoNovel: persistent combinator domains; generate grows structures by the lexicographically-first unused applicable combinator."
  }));
  var AutonovelAutomaton = _AutonovelAutomaton;

  // src/automata/tools/tool-08-messy.js
  var tool_08_messy_exports = {};
  __export(tool_08_messy_exports, {
    MessyAutomaton: () => MessyAutomaton
  });
  var clone2 = (value) => {
    if (value === null || typeof value !== "object") return value;
    if (Array.isArray(value)) return value.map(clone2);
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, clone2(v)]));
  };
  var _MessyAutomaton = class _MessyAutomaton extends Automaton {
    constructor() {
      const d = _MessyAutomaton.registry;
      super({
        id: d.id,
        address: { gate: d.gate, line: 1, color: 1, tone: 1, base: 1 },
        states: [
          { id: "scatter", initial: true },
          { id: "tolerate" },
          { id: "express", accepting: true }
        ],
        alphabet: ["agent", "rule", "tick", "feature"],
        q0: "scatter",
        finals: ["express"],
        ports: d.ports,
        capabilities: d.capabilities,
        dimension: d.dimension,
        automatonForm: d.automatonForm,
        state: null,
        implementation: (input = {}, { emit }) => {
          const { agents = [], rules = [], ticks = 5 } = input;
          emit({ from: "scatter", to: "tolerate", input: `agents=${agents.length}`, transition: "flow" });
          let state = agents.map((a) => ({ id: a.id, features: { ...a.features || {} } }));
          const history = [{ tick: 0, state: clone2(state) }];
          for (let tick = 1; tick <= ticks; tick++) {
            const previous = state;
            state = previous.map((agent) => {
              const world = { tick, agents: clone2(previous) };
              const rule = rules.find((candidate) => candidate.when(agent, world));
              return rule ? rule.apply(clone2(agent), world) : agent;
            });
            history.push({ tick, state: clone2(state) });
          }
          emit({ from: "tolerate", to: "tolerate", input: `ticks=${ticks}`, transition: "recursion" });
          emit({ from: "tolerate", to: "express", input: null, transition: "flow" });
          return { ok: true, ticks, finalState: state, history };
        }
      });
    }
  };
  __publicField(_MessyAutomaton, "registry", Object.freeze({
    id: "messy",
    aliases: [],
    gate: 3,
    channels: ["3-60"],
    capabilities: ["simulate"],
    ports: Object.freeze({
      in: Object.freeze([Object.freeze({ id: "input", type: "json" })]),
      out: Object.freeze([Object.freeze({ id: "output", type: "json", guarantees: ["addressed"] })])
    }),
    automatonForm: "probabilistic FSM",
    dimension: "Movement",
    description: "Klein's MESSY: per tick, the first rule whose when() matches an agent applies; full tick history retained."
  }));
  var MessyAutomaton = _MessyAutomaton;

  // src/automata/tools/tool-09-success.js
  var tool_09_success_exports = {};
  __export(tool_09_success_exports, {
    SuccessAutomaton: () => SuccessAutomaton,
    SuccessError: () => SuccessError,
    SuccessMemory: () => SuccessMemory,
    default: () => tool_09_success_default
  });
  var SuccessError = class extends Error {
    constructor(code, message, details = {}) {
      super(message);
      this.name = "SuccessError";
      this.code = code;
      this.details = details;
    }
  };
  var trend = (values) => {
    if (values.length < 2) return 0;
    const n = values.length;
    const sumX = values.reduce((sum, _, index) => sum + index, 0);
    const sumY = values.reduce((sum, value) => sum + value, 0);
    const sumXY = values.reduce((sum, value, index) => sum + index * value, 0);
    const sumX2 = values.reduce((sum, _, index) => sum + index * index, 0);
    const denominator = n * sumX2 - sumX * sumX;
    return denominator === 0 ? 0 : (n * sumXY - sumX * sumY) / denominator;
  };
  var _SuccessMemory_instances, record_fn;
  var SuccessMemory = class {
    constructor() {
      __privateAdd(this, _SuccessMemory_instances);
      this.sequence = 0;
      this.people = /* @__PURE__ */ new Map();
      this.events = [];
    }
    define(personId, { statement, indicators = [], address = null } = {}) {
      if (!personId || !statement || !String(statement).trim()) {
        throw new SuccessError("INVALID_PURPOSE", "Person and purpose statement are required");
      }
      const purpose = Object.freeze({
        personId,
        statement: String(statement).trim(),
        address,
        revision: 1,
        indicators: Object.freeze(indicators.map((indicator, index) => Object.freeze({
          id: indicator.id || `indicator-${index + 1}`,
          name: indicator.name,
          measure: indicator.measure || null,
          direction: indicator.direction || "increase",
          weight: Number.isFinite(indicator.weight) ? indicator.weight : 1
        })))
      });
      this.people.set(personId, { purpose, observations: /* @__PURE__ */ new Map(), proposals: [] });
      __privateMethod(this, _SuccessMemory_instances, record_fn).call(this, "purpose-defined", { personId, purpose });
      return purpose;
    }
    observe(personId, indicatorId, value, { context = null, address = null, source = "person" } = {}) {
      const person = this.people.get(personId);
      if (!person) throw new SuccessError("PURPOSE_NOT_FOUND", String(personId));
      const indicator = person.purpose.indicators.find((item) => item.id === indicatorId);
      if (!indicator) throw new SuccessError("INDICATOR_NOT_FOUND", String(indicatorId));
      if (!Number.isFinite(value)) throw new SuccessError("INVALID_OBSERVATION", "Progress observation must be numeric");
      const history = person.observations.get(indicatorId) || [];
      const observation = Object.freeze({ sequence: ++this.sequence, value, context, address, source });
      history.push(observation);
      person.observations.set(indicatorId, history);
      const progress = this.progress(personId, indicatorId);
      this.events.push(Object.freeze({ sequence: this.sequence, type: "progress-observed", payload: { personId, indicatorId, observation, progress } }));
      return progress;
    }
    progress(personId, indicatorId) {
      const person = this.people.get(personId);
      if (!person) throw new SuccessError("PURPOSE_NOT_FOUND", String(personId));
      const indicator = person.purpose.indicators.find((item) => item.id === indicatorId);
      if (!indicator) throw new SuccessError("INDICATOR_NOT_FOUND", String(indicatorId));
      const history = person.observations.get(indicatorId) || [];
      const values = history.slice(-5).map((item) => item.value);
      const rate = trend(values);
      let direction = "unknown";
      if (values.length >= 2) {
        if (indicator.direction === "increase") direction = rate > 0 ? "toward" : rate < 0 ? "away" : "neutral";
        if (indicator.direction === "decrease") direction = rate < 0 ? "toward" : rate > 0 ? "away" : "neutral";
        if (indicator.direction === "maintain") direction = Math.abs(rate) <= 0.1 ? "toward" : "away";
      }
      return Object.freeze({
        personId,
        indicatorId,
        direction,
        rate: Math.abs(rate),
        signedRate: rate,
        values: Object.freeze(values),
        evidenceCount: history.length
      });
    }
    propose(personId, indicatorId, { message, behaviors = [], role = "companion", address = null } = {}) {
      const person = this.people.get(personId);
      if (!person) throw new SuccessError("PURPOSE_NOT_FOUND", String(personId));
      const resolvedIndicator = indicatorId || person.purpose.indicators[0] && person.purpose.indicators[0].id || null;
      const progress = resolvedIndicator ? this.progress(personId, resolvedIndicator) : null;
      const proposal = Object.freeze({
        id: `success-${personId}-${++this.sequence}`,
        personId,
        indicatorId: resolvedIndicator,
        progress,
        role,
        message,
        behaviors: Object.freeze([...behaviors]),
        address,
        status: "proposed"
      });
      person.proposals.push(proposal);
      this.events.push(Object.freeze({ sequence: this.sequence, type: "success-proposal", payload: proposal }));
      return proposal;
    }
    summary(personId) {
      const person = this.people.get(personId);
      if (!person) return null;
      return Object.freeze({
        purpose: person.purpose,
        progress: Object.freeze(person.purpose.indicators.map((item) => this.progress(personId, item.id))),
        proposals: Object.freeze([...person.proposals])
      });
    }
    replay() {
      return Object.freeze([...this.events]);
    }
  };
  _SuccessMemory_instances = new WeakSet();
  record_fn = function(type, payload) {
    this.events.push(Object.freeze({ sequence: ++this.sequence, type, payload }));
  };
  var STATES = [
    { id: "attempt", name: "Attempt", initial: true },
    { id: "score", name: "Score" },
    { id: "reinforce", name: "Reinforce", accepting: true }
  ];
  var DELTA_TABLE = {
    "attempt|define": { to: "score", transition: "ignition" },
    "score|define": { to: "reinforce", transition: "flow" },
    "attempt|observe": { to: "score", transition: "flow" },
    "score|observe": { to: "reinforce", transition: "becoming" },
    "reinforce|propose": { to: "attempt", transition: "recursion" },
    "reinforce|summary": { to: "score", transition: "core" },
    "attempt|replay": { to: "reinforce", transition: "reactivation" }
  };
  var OP_PATHS = {
    define: [["attempt", "define"], ["score", "define"]],
    observe: [["attempt", "observe"], ["score", "observe"]],
    propose: [["reinforce", "propose"]],
    summary: [["reinforce", "summary"]],
    replay: [["attempt", "replay"]]
  };
  var normalizeInput = (input) => {
    if (typeof input === "string") {
      try {
        return JSON.parse(input);
      } catch {
        return { operation: "summary", text: input };
      }
    }
    if (input && Array.isArray(input.args) && input.args.length && !input.operation && !input.type) {
      const first = input.args[0];
      if (typeof first === "string") {
        try {
          const parsed = JSON.parse(first);
          if (parsed && typeof parsed === "object") return { ...parsed, packet: input.packet };
        } catch {
        }
      }
    }
    return input || {};
  };
  var _SuccessAutomaton_instances, walk_fn, dispatch_fn;
  var _SuccessAutomaton = class _SuccessAutomaton extends Automaton {
    constructor(options = {}) {
      const memory = options.state || new SuccessMemory();
      let dispatch;
      super({
        id: "success",
        address: { mode: "macro", gate: 14, line: 1, color: 1, tone: 1, base: 1, planetaryDimension: "Being" },
        states: STATES,
        alphabet: ["define", "observe", "propose", "summary", "replay"],
        delta: (state, symbol) => DELTA_TABLE[`${state}|${symbol}`] || { to: state, transition: "flow" },
        q0: "attempt",
        finals: ["reinforce"],
        ports: _SuccessAutomaton.descriptor.ports,
        capabilities: _SuccessAutomaton.descriptor.capabilities,
        dimension: "Being",
        implementation: (input, context) => dispatch(input, context)
      });
      __privateAdd(this, _SuccessAutomaton_instances);
      this.ownedState = memory;
      dispatch = (input, context) => __privateMethod(this, _SuccessAutomaton_instances, dispatch_fn).call(this, input, context);
    }
  };
  _SuccessAutomaton_instances = new WeakSet();
  walk_fn = function(path) {
    for (const [from, symbol] of path) this.step(from, symbol, { tool: this.id });
  };
  dispatch_fn = function(rawInput, context = {}) {
    const input = normalizeInput(rawInput);
    const op = input.operation || input.type;
    const path = OP_PATHS[op];
    if (!path) throw new SuccessError("UNKNOWN_SUCCESS_OPERATION", String(op));
    __privateMethod(this, _SuccessAutomaton_instances, walk_fn).call(this, path);
    const state = this.ownedState;
    switch (op) {
      case "define":
        return state.define(input.personId, input.purpose || {});
      case "observe":
        return state.observe(input.personId, input.indicatorId, input.value, input.context || {});
      case "propose":
        return state.propose(input.personId, input.indicatorId, input.proposal || {});
      case "summary":
        return state.summary(input.personId);
      case "replay":
        return state.replay();
      default:
        throw new SuccessError("UNKNOWN_SUCCESS_OPERATION", String(op));
    }
  };
  __publicField(_SuccessAutomaton, "descriptor", {
    id: "success",
    aliases: ["success-ledger", "success-tray", "purpose"],
    gate: 14,
    channels: ["2-14"],
    capabilities: ["define", "observe", "propose", "summary", "replay"],
    ports: {
      in: [{ id: "purpose", type: "success", schemaVersion: "1" }],
      out: [{ id: "expression", type: "success", schemaVersion: "1" }]
    },
    automatonForm: "reward hill-climber",
    dimension: "Being",
    description: "Direction-not-destination success ledger: purposes with weighted indicators, least-squares progress scoring over the last 5 observations, proposals, and a frozen replayable event log."
  });
  var SuccessAutomaton = _SuccessAutomaton;
  var tool_09_success_default = SuccessAutomaton;

  // src/automata/tools/tool-10-conversation.js
  var tool_10_conversation_exports = {};
  __export(tool_10_conversation_exports, {
    ConversationAutomaton: () => ConversationAutomaton,
    ConversationError: () => ConversationError,
    default: () => tool_10_conversation_default
  });
  var ConversationError = class extends Error {
    constructor(code, message, details = {}) {
      super(message);
      this.name = "ConversationError";
      this.code = code;
      this.details = details;
    }
  };
  var STATES2 = [
    { id: "open", name: "Open", initial: true },
    { id: "turn", name: "Turn" },
    { id: "repair", name: "Repair" },
    { id: "close", name: "Close", accepting: true }
  ];
  var DELTA_TABLE2 = {
    "open|open": { to: "turn", transition: "ignition" },
    "turn|turn": { to: "turn", transition: "flow" },
    "turn|weave": { to: "turn", transition: "weave" },
    "turn|repair": { to: "repair", transition: "becoming" },
    "repair|turn": { to: "turn", transition: "reactivation" },
    "turn|close": { to: "close", transition: "dormancy" },
    "repair|close": { to: "close", transition: "dormancy" }
  };
  var renderPayload = (payload) => {
    if (payload === null || payload === void 0) return "";
    if (typeof payload === "string") return payload;
    try {
      return JSON.stringify(payload);
    } catch {
      return String(payload);
    }
  };
  var normalizeInput2 = (input) => {
    if (typeof input === "string") return { text: input };
    if (input && Array.isArray(input.args)) {
      return { ...input, text: input.text !== void 0 ? input.text : input.args.join(" ") };
    }
    return input || {};
  };
  var _ConversationAutomaton_instances, walk_fn2, dispatch_fn2;
  var _ConversationAutomaton = class _ConversationAutomaton extends Automaton {
    constructor(options = {}) {
      let dispatch;
      super({
        id: "conversation",
        address: { mode: "macro", gate: 12, line: 1, color: 1, tone: 1, base: 1, planetaryDimension: "Space" },
        states: STATES2,
        alphabet: ["open", "turn", "weave", "repair", "close"],
        delta: (state, symbol) => DELTA_TABLE2[`${state}|${symbol}`] || { to: state, transition: "flow" },
        q0: "open",
        finals: ["close"],
        ports: _ConversationAutomaton.descriptor.ports,
        capabilities: _ConversationAutomaton.descriptor.capabilities,
        dimension: "Space",
        implementation: (input, context) => dispatch(input, context)
      });
      __privateAdd(this, _ConversationAutomaton_instances);
      this.ownedState = { turns: 0, history: [] };
      dispatch = (input, context) => __privateMethod(this, _ConversationAutomaton_instances, dispatch_fn2).call(this, input, context);
    }
  };
  _ConversationAutomaton_instances = new WeakSet();
  walk_fn2 = function(steps) {
    for (const [from, symbol] of steps) this.step(from, symbol, { tool: this.id });
  };
  dispatch_fn2 = function(rawInput, ctx = {}) {
    const context = ctx && ctx.context || ctx || {};
    const input = normalizeInput2(rawInput);
    const text = input.text !== void 0 ? String(input.text) : "";
    const contributions = Array.isArray(context.contributions) ? context.contributions : Array.isArray(input.contributions) ? input.contributions : [];
    const packet = input.packet || null;
    const path = [["open", "open"]];
    path.push(["turn", packet ? "weave" : "turn"]);
    const unresolved = contributions.length === 0 && !packet;
    if (unresolved) path.push(["turn", "repair"], ["repair", "close"]);
    else path.push(["turn", "close"]);
    __privateMethod(this, _ConversationAutomaton_instances, walk_fn2).call(this, path);
    let utterance;
    if (unresolved) {
      utterance = `${text || "<input>"} \u2014 context remains unresolved.`;
    } else {
      const lines = [];
      if (packet) {
        const payloadText = renderPayload(packet.payload);
        lines.push(`[weave:${packet.from || "mesh"}] ${payloadText}`);
      }
      if (text) lines.push(text);
      contributions.forEach((contribution, index) => lines.push(`${index + 1}. ${contribution}`));
      utterance = lines.join("\n");
    }
    this.ownedState.turns += 1;
    this.ownedState.history.push(Object.freeze({ turn: this.ownedState.turns, utterance }));
    return Object.freeze({
      utterance,
      turns: this.ownedState.turns,
      contributions: contributions.length,
      chained: Boolean(packet),
      repaired: unresolved,
      state: "close"
    });
  };
  __publicField(_ConversationAutomaton, "descriptor", {
    id: "conversation",
    aliases: ["chat", "talk", "dialogue", "converse"],
    gate: 12,
    channels: ["12-22"],
    capabilities: ["utter", "weave-packet", "repair", "close"],
    ports: {
      in: [{ id: "utterance", type: "text", schemaVersion: "1" }, { id: "packet", type: "state-packet", schemaVersion: "1" }],
      out: [{ id: "utterance", type: "text", schemaVersion: "1" }]
    },
    automatonForm: "turn-taking transducer",
    dimension: "Space",
    description: "Turn-taking transducer: opens a turn, weaves chained packets and numbered context contributions into a formatted utterance, repairs when context is unresolved, then closes."
  });
  var ConversationAutomaton = _ConversationAutomaton;
  var tool_10_conversation_default = ConversationAutomaton;

  // src/automata/tools/tool-11-browser-form.js
  var tool_11_browser_form_exports = {};
  __export(tool_11_browser_form_exports, {
    BrowserFormAutomaton: () => BrowserFormAutomaton,
    BrowserFormError: () => BrowserFormError,
    BrowserFormMemory: () => BrowserFormMemory,
    default: () => tool_11_browser_form_default
  });
  var BrowserFormError = class extends Error {
    constructor(code, message, details = {}) {
      super(message);
      this.name = "BrowserFormError";
      this.code = code;
      this.details = details;
    }
  };
  var SENSITIVE_PATTERN = /ssn|social[-_ ]?security|password|passcode|\bpin\b|bank|routing|medical|immigration|credit[-_ ]?card|card[-_ ]?number|\bcvv\b/i;
  var _BrowserFormMemory_instances, draft_fn, event_fn;
  var BrowserFormMemory = class {
    constructor() {
      __privateAdd(this, _BrowserFormMemory_instances);
      this.page = null;
      this.forms = /* @__PURE__ */ new Map();
      this.drafts = /* @__PURE__ */ new Map();
      this.approvals = /* @__PURE__ */ new Map();
      this.events = [];
      this.sequence = 0;
    }
    inspectPage({ url, title = null, forms = [] } = {}) {
      if (!url) throw new BrowserFormError("URL_REQUIRED", "Page inspection requires URL");
      this.page = Object.freeze({ url, title, forms: Object.freeze(forms.map((f) => f.id)) });
      for (const form of forms) this.inspectForm(form);
      __privateMethod(this, _BrowserFormMemory_instances, event_fn).call(this, "page-inspected", this.page);
      return this.snapshot();
    }
    inspectForm({ id, action, method = "POST", fields = [], official = false } = {}) {
      if (!id) throw new BrowserFormError("FORM_ID_REQUIRED", "Form requires id");
      const form = Object.freeze({
        id,
        action,
        method,
        official,
        fields: Object.freeze(fields.map((field, index) => {
          const name = field.name || field.id;
          return Object.freeze({
            id: field.id || field.name || `field-${index + 1}`,
            name,
            label: field.label || name,
            type: field.type || "text",
            required: Boolean(field.required),
            sensitivity: field.sensitivity || (name && SENSITIVE_PATTERN.test(name) ? "high" : "normal"),
            options: Object.freeze([...field.options || []]),
            value: field.value ?? null
          });
        }))
      });
      this.forms.set(id, form);
      __privateMethod(this, _BrowserFormMemory_instances, event_fn).call(this, "form-inspected", form);
      return form;
    }
    createDraft(formId, values = {}, { sources = {} } = {}) {
      const form = this.forms.get(formId);
      if (!form) throw new BrowserFormError("FORM_NOT_FOUND", String(formId));
      const entries = form.fields.map((field) => {
        const provided = Object.prototype.hasOwnProperty.call(values, field.name);
        const source = sources[field.name] || null;
        return Object.freeze({
          fieldId: field.id,
          name: field.name,
          label: field.label,
          value: provided ? values[field.name] : null,
          status: provided ? source && source.kind === "inferred" ? "inferred" : "resolved" : "unresolved",
          sensitivity: field.sensitivity,
          provenance: source ? Object.freeze({ ...source }) : null,
          approved: false
        });
      });
      const id = `draft-${++this.sequence}-${formId}`;
      const draft = Object.freeze({ id, formId, destination: form.action, entries: Object.freeze(entries), status: "draft" });
      this.drafts.set(id, draft);
      this.events.push(Object.freeze({ sequence: this.sequence, type: "draft-created", payload: draft }));
      return draft;
    }
    approveFields(draftId, names, { scope = "once" } = {}) {
      const draft = __privateMethod(this, _BrowserFormMemory_instances, draft_fn).call(this, draftId);
      const set = new Set(names);
      const missing = names.filter((name) => !draft.entries.some((entry) => entry.name === name));
      if (missing.length) throw new BrowserFormError("FIELD_NOT_FOUND", "Unknown draft fields", { missing });
      const updated = Object.freeze({
        ...draft,
        entries: Object.freeze(draft.entries.map((entry) => set.has(entry.name) ? Object.freeze({ ...entry, approved: true }) : entry)),
        status: "fields-approved"
      });
      this.drafts.set(draftId, updated);
      this.approvals.set(`fields:${draftId}`, Object.freeze({ draftId, names: Object.freeze([...set]), scope }));
      __privateMethod(this, _BrowserFormMemory_instances, event_fn).call(this, "fields-approved", { draftId, names: [...set] });
      return updated;
    }
    confirmInferred(draftId, names) {
      const draft = __privateMethod(this, _BrowserFormMemory_instances, draft_fn).call(this, draftId);
      const set = new Set(names);
      const updated = Object.freeze({
        ...draft,
        entries: Object.freeze(draft.entries.map((entry) => set.has(entry.name) && entry.status === "inferred" ? Object.freeze({ ...entry, status: "resolved", approved: true, provenance: Object.freeze({ ...entry.provenance || {}, confirmed: true }) }) : entry))
      });
      this.drafts.set(draftId, updated);
      __privateMethod(this, _BrowserFormMemory_instances, event_fn).call(this, "inferred-confirmed", { draftId, names: [...set] });
      return updated;
    }
    fill(draftId) {
      const draft = __privateMethod(this, _BrowserFormMemory_instances, draft_fn).call(this, draftId);
      const unapproved = draft.entries.filter((entry) => entry.value !== null && !entry.approved);
      if (unapproved.length) {
        throw new BrowserFormError("FIELD_APPROVAL_REQUIRED", "Every populated value requires approval", { fields: unapproved.map((x) => x.name) });
      }
      const inferred = draft.entries.filter((entry) => entry.status === "inferred");
      if (inferred.length) {
        throw new BrowserFormError("INFERRED_VALUE_CONFIRMATION_REQUIRED", "Inferred values must be confirmed", { fields: inferred.map((x) => x.name) });
      }
      const updated = Object.freeze({ ...draft, status: "filled" });
      this.drafts.set(draftId, updated);
      __privateMethod(this, _BrowserFormMemory_instances, event_fn).call(this, "form-filled", { draftId });
      return updated;
    }
    validate(draftId) {
      const draft = __privateMethod(this, _BrowserFormMemory_instances, draft_fn).call(this, draftId);
      const form = this.forms.get(draft.formId);
      const missing = form.fields.filter((field) => field.required && !draft.entries.some((entry) => entry.name === field.name && entry.value !== null && entry.value !== "")).map((field) => field.name);
      const result = Object.freeze({ valid: missing.length === 0, missing: Object.freeze(missing), draftId });
      __privateMethod(this, _BrowserFormMemory_instances, event_fn).call(this, "form-validated", result);
      return result;
    }
    requestSubmission(draftId) {
      const draft = __privateMethod(this, _BrowserFormMemory_instances, draft_fn).call(this, draftId);
      if (draft.status !== "filled") throw new BrowserFormError("FORM_NOT_FILLED", "Submission requires filled draft");
      const validation = this.validate(draftId);
      if (!validation.valid) throw new BrowserFormError("VALIDATION_FAILED", "Required fields unresolved", { missing: validation.missing });
      const request = Object.freeze({
        id: `submit-${++this.sequence}-${draftId}`,
        draftId,
        destination: draft.destination,
        fields: Object.freeze(draft.entries.filter((e) => e.value !== null).map((e) => Object.freeze({ name: e.name, value: e.value, sensitivity: e.sensitivity, provenance: e.provenance }))),
        status: "awaiting-confirmation"
      });
      this.approvals.set(request.id, request);
      this.events.push(Object.freeze({ sequence: this.sequence, type: "submission-requested", payload: request }));
      return request;
    }
    confirmSubmission(requestId) {
      const request = this.approvals.get(requestId);
      if (!request || request.status !== "awaiting-confirmation") throw new BrowserFormError("SUBMISSION_REQUEST_NOT_FOUND", String(requestId));
      const confirmed = Object.freeze({ ...request, status: "confirmed" });
      this.approvals.set(requestId, confirmed);
      __privateMethod(this, _BrowserFormMemory_instances, event_fn).call(this, "submission-confirmed", { requestId });
      return confirmed;
    }
    submit(requestId, executor) {
      const request = this.approvals.get(requestId);
      if (!request || request.status !== "confirmed") throw new BrowserFormError("SUBMISSION_CONFIRMATION_REQUIRED", "External submission needs final confirmation");
      if (typeof executor !== "function") throw new BrowserFormError("BROWSER_EXECUTOR_REQUIRED", "Submission requires mounted browser executor");
      __privateMethod(this, _BrowserFormMemory_instances, event_fn).call(this, "submission-dispatched", { requestId, destination: request.destination });
      return executor(request);
    }
    snapshot() {
      return Object.freeze({
        page: this.page,
        forms: Object.freeze([...this.forms.values()]),
        drafts: Object.freeze([...this.drafts.values()]),
        events: Object.freeze([...this.events])
      });
    }
  };
  _BrowserFormMemory_instances = new WeakSet();
  draft_fn = function(id) {
    const draft = this.drafts.get(id);
    if (!draft) throw new BrowserFormError("DRAFT_NOT_FOUND", String(id));
    return draft;
  };
  event_fn = function(type, payload) {
    const event = Object.freeze({ sequence: ++this.sequence, type, payload });
    this.events.push(event);
    return event;
  };
  var STATES3 = [
    { id: "see", name: "See", initial: true },
    { id: "fill", name: "Fill" },
    { id: "submit", name: "Submit" },
    { id: "confirm", name: "Confirm", accepting: true }
  ];
  var DELTA_TABLE3 = {
    "see|inspect-page": { to: "see", transition: "ignition" },
    "see|draft": { to: "fill", transition: "flow" },
    "fill|approve-fields": { to: "fill", transition: "flow" },
    "fill|confirm-inferred": { to: "fill", transition: "becoming" },
    "fill|fill": { to: "fill", transition: "chain" },
    "fill|validate": { to: "fill", transition: "core" },
    "fill|request-submission": { to: "submit", transition: "chain" },
    "submit|confirm-submission": { to: "confirm", transition: "becoming" },
    "confirm|submit": { to: "confirm", transition: "automatize" },
    "see|snapshot": { to: "see", transition: "core" }
  };
  var OP_FROM_STATE = {
    "inspect-page": "see",
    draft: "see",
    "approve-fields": "fill",
    "confirm-inferred": "fill",
    fill: "fill",
    validate: "fill",
    "request-submission": "fill",
    "confirm-submission": "submit",
    submit: "confirm",
    snapshot: "see"
  };
  var normalizeInput3 = (input) => {
    if (typeof input === "string") {
      try {
        return JSON.parse(input);
      } catch {
        return { operation: input };
      }
    }
    if (input && Array.isArray(input.args) && input.args.length && !input.operation) {
      const [op, ...rest] = input.args;
      const merged = { operation: op, packet: input.packet };
      if (rest.length === 1 && typeof rest[0] === "string") {
        try {
          Object.assign(merged, JSON.parse(rest[0]));
        } catch {
          merged.value = rest[0];
        }
      }
      return merged;
    }
    return input || {};
  };
  var _BrowserFormAutomaton_instances, dispatch_fn3;
  var _BrowserFormAutomaton = class _BrowserFormAutomaton extends Automaton {
    constructor(options = {}) {
      const memory = options.state || new BrowserFormMemory();
      let dispatch;
      super({
        id: "browser-form",
        address: { mode: "macro", gate: 20, line: 1, color: 1, tone: 1, base: 1, planetaryDimension: "Being" },
        states: STATES3,
        alphabet: ["inspect-page", "draft", "approve-fields", "confirm-inferred", "fill", "validate", "request-submission", "confirm-submission", "submit", "snapshot"],
        delta: (state, symbol) => DELTA_TABLE3[`${state}|${symbol}`] || { to: state, transition: "flow" },
        q0: "see",
        finals: ["confirm"],
        ports: _BrowserFormAutomaton.descriptor.ports,
        capabilities: _BrowserFormAutomaton.descriptor.capabilities,
        dimension: "Being",
        implementation: (input, context) => dispatch(input, context)
      });
      __privateAdd(this, _BrowserFormAutomaton_instances);
      this.ownedState = memory;
      dispatch = (input, context) => __privateMethod(this, _BrowserFormAutomaton_instances, dispatch_fn3).call(this, input, context);
    }
  };
  _BrowserFormAutomaton_instances = new WeakSet();
  dispatch_fn3 = function(rawInput, ctx = {}) {
    const context = ctx && ctx.context || ctx || {};
    const input = normalizeInput3(rawInput);
    const op = input.operation;
    const from = OP_FROM_STATE[op];
    if (!from) throw new BrowserFormError("UNKNOWN_OPERATION", String(op));
    this.step(from, op, { tool: this.id });
    const state = this.ownedState;
    switch (op) {
      case "inspect-page":
        return state.inspectPage(input.page || input);
      case "draft":
        return state.createDraft(input.formId, input.values || {}, input.context || {});
      case "approve-fields":
        return state.approveFields(input.draftId, input.names || [], input.context || {});
      case "confirm-inferred":
        return state.confirmInferred(input.draftId, input.names || []);
      case "fill":
        return state.fill(input.draftId);
      case "validate":
        return state.validate(input.draftId);
      case "request-submission":
        return state.requestSubmission(input.draftId);
      case "confirm-submission":
        return state.confirmSubmission(input.requestId);
      case "submit":
        return state.submit(input.requestId, input.executor || context.executor);
      case "snapshot":
        return state.snapshot();
      default:
        throw new BrowserFormError("UNKNOWN_OPERATION", String(op));
    }
  };
  __publicField(_BrowserFormAutomaton, "descriptor", {
    id: "browser-form",
    aliases: ["form", "dom-form", "forms"],
    gate: 20,
    channels: ["10-20", "20-34", "20-57"],
    capabilities: ["inspect-page", "draft", "approve-fields", "confirm-inferred", "fill", "validate", "request-submission", "confirm-submission", "submit", "snapshot"],
    ports: {
      in: [{ id: "request", type: "browser-form", schemaVersion: "1" }],
      out: [{ id: "state", type: "browser-form", schemaVersion: "1" }]
    },
    automatonForm: "DOM-walker FSM",
    dimension: "Being",
    description: "Consent-gated DOM-walker: inspects pages/forms, drafts values with provenance, requires per-field approval and inferred-value confirmation before fill, and only submits through an explicit two-step confirmed request to a mounted executor."
  });
  var BrowserFormAutomaton = _BrowserFormAutomaton;
  var tool_11_browser_form_default = BrowserFormAutomaton;

  // src/automata/tools/tool-12-research-browser.js
  var tool_12_research_browser_exports = {};
  __export(tool_12_research_browser_exports, {
    ResearchBrowserAutomaton: () => ResearchBrowserAutomaton,
    ResearchError: () => ResearchError,
    ResearchWorkspace: () => ResearchWorkspace,
    default: () => tool_12_research_browser_default
  });
  var ResearchError = class extends Error {
    constructor(code, message, details = {}) {
      super(message);
      this.name = "ResearchError";
      this.code = code;
      this.details = details;
    }
  };
  var _ResearchWorkspace_instances, experimentView_fn, project_fn;
  var ResearchWorkspace = class {
    constructor() {
      __privateAdd(this, _ResearchWorkspace_instances);
      this.projects = /* @__PURE__ */ new Map();
      this.sequence = 0;
    }
    create({ id, title, question, scope = null } = {}) {
      const project = {
        id: id || `research-${++this.sequence}`,
        title,
        question,
        scope,
        sources: /* @__PURE__ */ new Map(),
        claims: /* @__PURE__ */ new Map(),
        notes: [],
        hypotheses: /* @__PURE__ */ new Map(),
        experiments: /* @__PURE__ */ new Map(),
        drafts: [],
        status: "researching"
      };
      this.projects.set(project.id, project);
      return this.snapshot(project.id);
    }
    source(projectId, { id, url, title, excerpt = null, author = null, published = null, capturedBy = "browser" } = {}) {
      const p = __privateMethod(this, _ResearchWorkspace_instances, project_fn).call(this, projectId);
      const record = Object.freeze({ id: id || `source-${++this.sequence}`, url, title, excerpt, author, published, capturedBy, kind: "source" });
      p.sources.set(record.id, record);
      return record;
    }
    claim(projectId, { id, text, sourceIds = [], kind = "source-claim", confidence = null } = {}) {
      const p = __privateMethod(this, _ResearchWorkspace_instances, project_fn).call(this, projectId);
      for (const sourceId of sourceIds) {
        if (!p.sources.has(sourceId)) throw new ResearchError("SOURCE_NOT_FOUND", String(sourceId));
      }
      const record = Object.freeze({ id: id || `claim-${++this.sequence}`, text, sourceIds: Object.freeze([...sourceIds]), kind, confidence });
      p.claims.set(record.id, record);
      return record;
    }
    note(projectId, { text, sourceIds = [], claimIds = [] } = {}) {
      const p = __privateMethod(this, _ResearchWorkspace_instances, project_fn).call(this, projectId);
      for (const sourceId of sourceIds) {
        if (!p.sources.has(sourceId)) throw new ResearchError("SOURCE_NOT_FOUND", String(sourceId));
      }
      for (const claimId of claimIds) {
        if (!p.claims.has(claimId)) throw new ResearchError("CLAIM_NOT_FOUND", String(claimId));
      }
      const record = Object.freeze({ id: `note-${++this.sequence}`, text, sourceIds: Object.freeze([...sourceIds]), claimIds: Object.freeze([...claimIds]) });
      p.notes.push(record);
      return record;
    }
    hypothesis(projectId, { id, statement, evidenceClaimIds = [] } = {}) {
      const p = __privateMethod(this, _ResearchWorkspace_instances, project_fn).call(this, projectId);
      for (const claimId of evidenceClaimIds) {
        if (!p.claims.has(claimId)) throw new ResearchError("CLAIM_NOT_FOUND", String(claimId));
      }
      const record = Object.freeze({ id: id || `hypothesis-${++this.sequence}`, statement, evidenceClaimIds: Object.freeze([...evidenceClaimIds]), status: "proposed" });
      p.hypotheses.set(record.id, record);
      return record;
    }
    experiment(projectId, { id, hypothesisId, protocol, executor = "local", effects = [] } = {}) {
      const p = __privateMethod(this, _ResearchWorkspace_instances, project_fn).call(this, projectId);
      if (!p.hypotheses.has(hypothesisId)) throw new ResearchError("HYPOTHESIS_NOT_FOUND", String(hypothesisId));
      const record = {
        id: id || `experiment-${++this.sequence}`,
        hypothesisId,
        protocol,
        executor,
        effects: Object.freeze([...effects]),
        runs: [],
        status: "designed"
      };
      p.experiments.set(record.id, record);
      return __privateMethod(this, _ResearchWorkspace_instances, experimentView_fn).call(this, record);
    }
    draft(projectId, { title, sections = [] } = {}) {
      const p = __privateMethod(this, _ResearchWorkspace_instances, project_fn).call(this, projectId);
      const unresolved = [];
      const rendered = sections.map((section) => {
        const claims = (section.claimIds || []).map((id) => {
          const claim = p.claims.get(id);
          if (!claim) {
            unresolved.push(id);
            return `[UNRESOLVED CLAIM ${id}]`;
          }
          const cites = claim.sourceIds.map((sourceId) => `[${sourceId}]`).join("");
          return `${claim.text}${cites}`;
        });
        return Object.freeze({ heading: section.heading, content: Object.freeze(claims) });
      });
      const bibliography = Object.freeze([...p.sources.values()].map((source) => Object.freeze({
        id: source.id,
        title: source.title,
        url: source.url,
        author: source.author,
        published: source.published
      })));
      const draft = Object.freeze({
        id: `draft-${++this.sequence}`,
        title,
        sections: Object.freeze(rendered),
        bibliography,
        unresolved: Object.freeze(unresolved),
        kind: "research-draft"
      });
      p.drafts.push(draft);
      return draft;
    }
    snapshot(projectId) {
      const p = __privateMethod(this, _ResearchWorkspace_instances, project_fn).call(this, projectId);
      return Object.freeze({
        id: p.id,
        title: p.title,
        question: p.question,
        scope: p.scope,
        status: p.status,
        sources: Object.freeze([...p.sources.values()]),
        claims: Object.freeze([...p.claims.values()]),
        notes: Object.freeze([...p.notes]),
        hypotheses: Object.freeze([...p.hypotheses.values()]),
        experiments: Object.freeze([...p.experiments.values()].map((x) => __privateMethod(this, _ResearchWorkspace_instances, experimentView_fn).call(this, x))),
        drafts: Object.freeze([...p.drafts])
      });
    }
  };
  _ResearchWorkspace_instances = new WeakSet();
  experimentView_fn = function(x) {
    return Object.freeze({
      id: x.id,
      hypothesisId: x.hypothesisId,
      protocol: x.protocol,
      executor: x.executor,
      effects: x.effects,
      runs: Object.freeze([...x.runs]),
      status: x.status
    });
  };
  project_fn = function(id) {
    const p = this.projects.get(id);
    if (!p) throw new ResearchError("PROJECT_NOT_FOUND", String(id));
    return p;
  };
  var STATES4 = [
    { id: "query", name: "Query", initial: true },
    { id: "fetch", name: "Fetch" },
    { id: "extract", name: "Extract" },
    { id: "cite", name: "Cite", accepting: true }
  ];
  var DELTA_TABLE4 = {
    "query|create": { to: "query", transition: "ignition" },
    "query|source": { to: "fetch", transition: "flow" },
    "fetch|claim": { to: "extract", transition: "core" },
    "extract|note": { to: "extract", transition: "flow" },
    "extract|hypothesis": { to: "extract", transition: "fusion" },
    "extract|experiment": { to: "extract", transition: "automatize" },
    "extract|draft": { to: "cite", transition: "weave" },
    "query|snapshot": { to: "query", transition: "core" }
  };
  var OP_FROM_STATE2 = {
    create: "query",
    source: "query",
    claim: "fetch",
    note: "extract",
    hypothesis: "extract",
    experiment: "extract",
    draft: "extract",
    snapshot: "query"
  };
  var normalizeInput4 = (input) => {
    if (typeof input === "string") {
      try {
        return JSON.parse(input);
      } catch {
        return { operation: input };
      }
    }
    if (input && Array.isArray(input.args) && input.args.length && !input.operation) {
      const [op, ...rest] = input.args;
      const merged = { operation: op, packet: input.packet };
      if (rest.length === 1 && typeof rest[0] === "string") {
        try {
          Object.assign(merged, JSON.parse(rest[0]));
        } catch {
          merged.value = rest[0];
        }
      }
      return merged;
    }
    return input || {};
  };
  var _ResearchBrowserAutomaton_instances, dispatch_fn4;
  var _ResearchBrowserAutomaton = class _ResearchBrowserAutomaton extends Automaton {
    constructor(options = {}) {
      const memory = options.state || new ResearchWorkspace();
      let dispatch;
      super({
        id: "research-browser",
        address: { mode: "macro", gate: 11, line: 1, color: 1, tone: 1, base: 1, planetaryDimension: "Space" },
        states: STATES4,
        alphabet: ["create", "source", "claim", "note", "hypothesis", "experiment", "draft", "snapshot"],
        delta: (state, symbol) => DELTA_TABLE4[`${state}|${symbol}`] || { to: state, transition: "flow" },
        q0: "query",
        finals: ["cite"],
        ports: _ResearchBrowserAutomaton.descriptor.ports,
        capabilities: _ResearchBrowserAutomaton.descriptor.capabilities,
        dimension: "Space",
        implementation: (input, context) => dispatch(input, context)
      });
      __privateAdd(this, _ResearchBrowserAutomaton_instances);
      this.ownedState = memory;
      dispatch = (input, context) => __privateMethod(this, _ResearchBrowserAutomaton_instances, dispatch_fn4).call(this, input, context);
    }
  };
  _ResearchBrowserAutomaton_instances = new WeakSet();
  dispatch_fn4 = function(rawInput, context = {}) {
    const input = normalizeInput4(rawInput);
    const op = input.operation;
    const from = OP_FROM_STATE2[op];
    if (!from) throw new ResearchError("UNKNOWN_OPERATION", String(op));
    this.step(from, op, { tool: this.id });
    const state = this.ownedState;
    switch (op) {
      case "create":
        return state.create(input.project || input);
      case "source":
        return state.source(input.projectId, input.source || {});
      case "claim":
        return state.claim(input.projectId, input.claim || {});
      case "note":
        return state.note(input.projectId, input.note || {});
      case "hypothesis":
        return state.hypothesis(input.projectId, input.hypothesis || {});
      case "experiment":
        return state.experiment(input.projectId, input.experiment || {});
      case "draft":
        return state.draft(input.projectId, input.draft || {});
      case "snapshot":
        return state.snapshot(input.projectId);
      default:
        throw new ResearchError("UNKNOWN_OPERATION", String(op));
    }
  };
  __publicField(_ResearchBrowserAutomaton, "descriptor", {
    id: "research-browser",
    aliases: ["research", "research-workspace", "crawler"],
    gate: 11,
    channels: ["11-56"],
    capabilities: ["create", "source", "claim", "note", "hypothesis", "experiment", "draft", "snapshot"],
    ports: {
      in: [{ id: "research-request", type: "research", schemaVersion: "1" }],
      out: [{ id: "research-record", type: "research", schemaVersion: "1" }]
    },
    automatonForm: "crawl automaton",
    dimension: "Space",
    description: "Persistent research workspace: sources\u2192claims\u2192notes\u2192hypotheses\u2192experiments\u2192drafts with full referential integrity; drafts render claim text with [sourceId] citations, a bibliography, and [UNRESOLVED CLAIM id] placeholders."
  });
  var ResearchBrowserAutomaton = _ResearchBrowserAutomaton;
  var tool_12_research_browser_default = ResearchBrowserAutomaton;

  // src/automata/tools/tool-13-computational-grammar-coder.js
  var tool_13_computational_grammar_coder_exports = {};
  __export(tool_13_computational_grammar_coder_exports, {
    ComputationalGrammarCoder: () => ComputationalGrammarCoder,
    ComputationalGrammarCoderAutomaton: () => ComputationalGrammarCoderAutomaton,
    GrammarCoderError: () => GrammarCoderError,
    default: () => tool_13_computational_grammar_coder_default
  });
  var GrammarCoderError = class extends Error {
    constructor(code, message, details = {}) {
      super(message);
      this.name = "GrammarCoderError";
      this.code = code;
      this.details = details;
    }
  };
  var ALL = Object.freeze(["ADJ", "ADV", "NOUN", "VERB"]);
  var FUNCTION_WORDS = Object.freeze({
    a: ["ART"],
    an: ["ART"],
    the: ["ART"],
    and: ["CONJC"],
    or: ["CONJC"],
    nor: ["CONJC"],
    but: ["CONJR"],
    is: ["VERB_IS"],
    was: ["VERB_IS"],
    be: ["VERB_IS"],
    are: ["VERB_IS"],
    am: ["VERB_IS"],
    to: ["PREP_1"],
    of: ["PREP_OF"],
    i: ["PN_S"],
    we: ["PN_S"],
    he: ["PN_S"],
    she: ["PN_S"],
    they: ["PN_S"],
    me: ["PN_O"],
    us: ["PN_O"],
    him: ["PN_O"],
    them: ["PN_O"],
    my: ["PN_POS"],
    our: ["PN_POS"],
    his: ["PN_POS"],
    their: ["PN_POS"],
    this: ["PN_DEM"],
    those: ["PN_DEM"],
    that: ["PN_REL"],
    who: ["PN_RCN"],
    which: ["PN_RCN"],
    where: ["PN_IND"],
    anywhere: ["PN_IND"],
    somewhere: ["PN_IND"]
  });
  var SUFFIX_RULES = Object.freeze([
    { suffix: "ing", codes: ["/ING/"] },
    { suffix: "ed", codes: ["/ED/"] },
    { suffix: "ity", codes: ["NOUN"] },
    { suffix: "ness", codes: ["NOUN"] },
    { suffix: "ment", codes: ["NOUN"] },
    { suffix: "tion", codes: ["NOUN"] },
    { suffix: "ous", codes: ["ADJ"] },
    { suffix: "ful", codes: ["ADJ"] },
    { suffix: "ly", codes: ["ADV"] },
    { suffix: "ize", codes: ["VERB"] },
    { suffix: "ise", codes: ["VERB"] },
    { suffix: "s", codes: ["NOUN", "VERB"] }
  ]);
  var intersect = (sets) => sets.reduce((a, b) => a.filter((x) => b.includes(x)));
  var _ComputationalGrammarCoder_instances, applyFrames_fn;
  var ComputationalGrammarCoder = class {
    constructor({ dictionary = {}, contextFrames = [] } = {}) {
      __privateAdd(this, _ComputationalGrammarCoder_instances);
      this.dictionary = new Map(
        Object.entries({ ...FUNCTION_WORDS, ...dictionary }).map(([k, v]) => [k.toLowerCase(), Object.freeze([...v])])
      );
      this.contextFrames = contextFrames.map((frame) => Object.freeze([...frame]));
      this.stats = { sentencesCoded: 0, wordsCoded: 0 };
    }
    candidates(word, { sentenceInitial = false } = {}) {
      const raw = String(word);
      const lower = raw.toLowerCase();
      const tests = [];
      if (/^[.,;:!?]$/.test(raw)) tests.push([raw === "." ? ".TYPE" : ",TYPE"]);
      if (/^\d+$/.test(raw)) tests.push(["ADJ"]);
      if (!sentenceInitial && /^[A-Z]/.test(raw)) tests.push(["NOUN", "ADJ"]);
      const dictionary = this.dictionary.get(lower);
      if (dictionary) tests.push([...dictionary]);
      const suffix = SUFFIX_RULES.find((rule) => lower.endsWith(rule.suffix));
      if (suffix) tests.push([...suffix.codes]);
      if (!tests.length) tests.push([...ALL]);
      const common = intersect(tests);
      const codes = common.length ? common : [...new Set(tests.flat())];
      return Object.freeze({
        word: raw,
        tests: Object.freeze(tests.map((x) => Object.freeze(x))),
        codes: Object.freeze(codes),
        ambiguous: codes.length > 1
      });
    }
    code(sentence) {
      const words3 = String(sentence).match(/[A-Za-z0-9'-]+|[.,;:!?]/g) || [];
      const items = words3.map((word, index) => {
        const c = this.candidates(word, { sentenceInitial: index === 0 });
        return { word: c.word, tests: c.tests, codes: [...c.codes], ambiguous: c.ambiguous };
      });
      __privateMethod(this, _ComputationalGrammarCoder_instances, applyFrames_fn).call(this, items);
      this.stats.sentencesCoded += 1;
      this.stats.wordsCoded += items.length;
      return Object.freeze({
        sentence: String(sentence),
        words: Object.freeze(items.map((item) => Object.freeze({
          word: item.word,
          tests: item.tests,
          codes: Object.freeze([...item.codes]),
          ambiguous: item.codes.length > 1
        }))),
        ambiguous: Object.freeze(items.filter((item) => item.codes.length > 1).map((item) => item.word))
      });
    }
  };
  _ComputationalGrammarCoder_instances = new WeakSet();
  // Context-frame disambiguation: unambiguous pairs bracketing 1–3 ambiguous words
  // constrain the middle codes via registered frames.
  applyFrames_fn = function(items) {
    for (let left = 0; left < items.length; left++) {
      if (items[left].codes.length !== 1) continue;
      for (let right = left + 1; right < items.length; right++) {
        if (items[right].codes.length !== 1) continue;
        const middle = items.slice(left + 1, right);
        if (!middle.length || middle.length > 3 || middle.every((x) => x.codes.length === 1)) continue;
        const frames = this.contextFrames.filter((frame) => frame.length === items.length ? true : frame.length === middle.length + 2 && frame[0] === items[left].codes[0] && frame.at(-1) === items[right].codes[0]);
        for (let i = 0; i < middle.length; i++) {
          const allowed = [...new Set(frames.flatMap((frame) => frame[i + 1] || []))];
          if (allowed.length) {
            const reduced = middle[i].codes.filter((code) => allowed.includes(code));
            if (reduced.length) middle[i].codes = reduced;
          }
        }
        break;
      }
    }
  };
  var STATES5 = [
    { id: "parse", name: "Parse", initial: true },
    { id: "lower", name: "Lower" },
    { id: "emit", name: "Emit" },
    { id: "verify", name: "Verify", accepting: true }
  ];
  var DELTA_TABLE5 = {
    "parse|code": { to: "lower", transition: "ignition" },
    "lower|code": { to: "emit", transition: "flow" },
    "emit|code": { to: "verify", transition: "chain" },
    "verify|code": { to: "verify", transition: "core" }
  };
  var CODE_PATH = [["parse", "code"], ["lower", "code"], ["emit", "code"], ["verify", "code"]];
  var normalizeInput5 = (input) => {
    if (typeof input === "string") return { text: input };
    if (input && Array.isArray(input.args) && input.args.length && input.text === void 0) {
      return { ...input, text: input.args.join(" ") };
    }
    return input || {};
  };
  var _ComputationalGrammarCoderAutomaton_instances, dispatch_fn5;
  var _ComputationalGrammarCoderAutomaton = class _ComputationalGrammarCoderAutomaton extends Automaton {
    constructor(options = {}) {
      const memory = options.state || new ComputationalGrammarCoder(options.coder || {});
      let dispatch;
      super({
        id: "computational-grammar-coder",
        address: { mode: "macro", gate: 62, line: 1, color: 1, tone: 1, base: 1, planetaryDimension: "Evolution" },
        states: STATES5,
        alphabet: ["code"],
        delta: (state, symbol) => DELTA_TABLE5[`${state}|${symbol}`] || { to: state, transition: "flow" },
        q0: "parse",
        finals: ["verify"],
        ports: _ComputationalGrammarCoderAutomaton.descriptor.ports,
        capabilities: _ComputationalGrammarCoderAutomaton.descriptor.capabilities,
        dimension: "Evolution",
        implementation: (input, context) => dispatch(input, context)
      });
      __privateAdd(this, _ComputationalGrammarCoderAutomaton_instances);
      this.ownedState = memory;
      dispatch = (input, context) => __privateMethod(this, _ComputationalGrammarCoderAutomaton_instances, dispatch_fn5).call(this, input, context);
    }
  };
  _ComputationalGrammarCoderAutomaton_instances = new WeakSet();
  dispatch_fn5 = function(rawInput, context = {}) {
    const input = normalizeInput5(rawInput);
    const text = input.text !== void 0 ? input.text : input.sentence;
    if (text === void 0 || text === null || String(text).trim() === "") {
      throw new GrammarCoderError("TEXT_REQUIRED", "Coding requires a sentence (input.text)");
    }
    for (const [from, symbol] of CODE_PATH) this.step(from, symbol, { tool: this.id });
    if (Array.isArray(input.contextFrames) && input.contextFrames.length) {
      const coder = new ComputationalGrammarCoder({ contextFrames: input.contextFrames });
      coder.stats = this.ownedState.stats;
      const coded = coder.code(text);
      this.ownedState.contextFrames.push(...input.contextFrames.map((f) => Object.freeze([...f])));
      return coded;
    }
    return this.ownedState.code(text);
  };
  __publicField(_ComputationalGrammarCoderAutomaton, "descriptor", {
    id: "computational-grammar-coder",
    aliases: ["coder", "grammar-coder", "klein-simmons"],
    gate: 62,
    channels: ["17-62"],
    capabilities: ["code", "disambiguate", "dictionary"],
    ports: {
      in: [{ id: "text", type: "text", schemaVersion: "1" }],
      out: [{ id: "codes", type: "grammar-codes", schemaVersion: "1" }]
    },
    automatonForm: "compiler PDA",
    dimension: "Evolution",
    description: "Klein & Simmons 1963 computational grammar coder: per-word tests (punctuation, digits, capitalization, function-word dictionary, suffix rules), code intersection with union fallback, and context-frame disambiguation of 1\u20133 bracketed ambiguous words."
  });
  var ComputationalGrammarCoderAutomaton = _ComputationalGrammarCoderAutomaton;
  var tool_13_computational_grammar_coder_default = ComputationalGrammarCoderAutomaton;

  // src/automata/tools/tool-14-autoling.js
  var tool_14_autoling_exports = {};
  __export(tool_14_autoling_exports, {
    AutolingAutomaton: () => AutolingAutomaton,
    AutolingEngine: () => AutolingEngine,
    AutolingError: () => AutolingError,
    default: () => tool_14_autoling_default
  });
  var AutolingError = class extends Error {
    constructor(code, message, details = {}) {
      super(message);
      this.name = "AutolingError";
      this.code = code;
      this.details = details;
    }
  };
  var extractFeatures = (segment) => ({
    "1st_person": /^(I|me|my|we|us|our)$/i.test(segment),
    "2nd_person": /^(you|your|yours)$/i.test(segment),
    "3rd_person": /^(he|she|it|they|him|her|them|his|its|their)$/i.test(segment),
    singular: /^(I|you|he|she|it|me|him|her)$/i.test(segment),
    plural: /^(we|they|us|them)$/i.test(segment),
    present: /^(eat|run|walk|talk|is|are|am)$/i.test(segment),
    past: /^(ate|ran|walked|talked|was|were)$/i.test(segment),
    animate: /^(I|you|he|she|we|they|man|woman|dog|cat)$/i.test(segment),
    human: /^(I|you|he|she|we|they|man|woman|person)$/i.test(segment),
    noun: /^(man|woman|dog|cat|fish|book|table|car|house|tree)$/i.test(segment),
    verb: /^(eat|run|walk|talk|read|write|sleep|think|love|hate|is|are|am|was|were)$/i.test(segment),
    determiner: /^(the|a|an|this|that|these|those)$/i.test(segment),
    adjective: /^(big|small|red|blue|happy|sad|good|bad|old|new)$/i.test(segment),
    adverb: /^(quickly|slowly|happily|sadly|very|quite|rather)$/i.test(segment),
    preposition: /^(in|on|at|by|with|from|to|for|of|about)$/i.test(segment)
  });
  var AutolingEngine = class {
    constructor() {
      this.grammar = [];
      this.transformations = [];
      this.frame = 0;
      this.illegalSet = [];
      this.heuristicCounters = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0 };
    }
    // ---------- ① Morphology (Klein §2.0) ----------
    analyzeMorphology(input) {
      const segments = String(input).split(/\s+/).filter(Boolean);
      const morphemes = [];
      for (const segment of segments) {
        const features = extractFeatures(segment);
        const isPrimary = ["1st_person", "2nd_person", "3rd_person"].some((f) => features[f]);
        morphemes.push({
          segment,
          gloss: this.generateGloss(features),
          features,
          isAllomorph: this.detectAllomorph(features, morphemes),
          primaryGloss: isPrimary,
          secondaryGloss: !isPrimary
        });
      }
      const totalFeatures = morphemes.reduce((sum, m) => sum + Object.values(m.features).filter(Boolean).length, 0);
      return {
        morphemes,
        segmentationAlgorithm: `distributional-cut(${segments.length}-segments)`,
        confidence: morphemes.length ? Math.min(totalFeatures / (morphemes.length * 5), 1) : 0
      };
    }
    generateGloss(features) {
      return Object.entries(features).filter(([, v]) => v).map(([k]) => k).join(", ");
    }
    detectAllomorph(features, existing) {
      return existing.some((m) => {
        const overlap = Object.keys(features).filter((k) => features[k] && m.features[k]);
        return overlap.length > 2;
      });
    }
    // ---------- ② Phrase-structure heuristic learning (Klein §3.0) ----------
    learnPhraseStructure(sentence) {
      this.frame++;
      const tokens = String(sentence).split(/\s+/).filter(Boolean);
      const parse = this.attemptParse(tokens);
      if (parse.complete) return { grammar: this.grammar, newRules: [], tests: [] };
      const newRules = this.applyHeuristics(tokens);
      const tests = newRules.map((rule) => this.testRule(rule));
      return { grammar: this.grammar, newRules, tests };
    }
    attemptParse(tokens) {
      for (const rule of this.grammar) {
        if (rule.isSentenceRule && rule.rhs.join(" ") === tokens.join(" ")) {
          return { complete: true };
        }
      }
      return { complete: false };
    }
    applyHeuristics(tokens) {
      if (this.grammar.length === 0) {
        this.heuristicCounters.h1++;
        const rule = {
          lhs: `S_${this.heuristicCounters.h1}`,
          rhs: [...tokens],
          isSentenceRule: true,
          isContextSensitive: false,
          testHistory: [],
          confidence: 0.5
        };
        this.grammar.push(rule);
        return [rule];
      }
      const rules = [];
      for (let i = 0; i < tokens.length - 1; i++) {
        for (let j = i + 1; j < tokens.length; j++) {
          const env1 = tokens.slice(0, i).concat(tokens.slice(i + 1));
          const env2 = tokens.slice(0, j).concat(tokens.slice(j + 1));
          if (JSON.stringify(env1) === JSON.stringify(env2)) {
            this.heuristicCounters.h2++;
            const rule = {
              lhs: `Class_${this.heuristicCounters.h2}`,
              rhs: [tokens[i], tokens[j]],
              isSentenceRule: false,
              isContextSensitive: false,
              testHistory: [],
              confidence: 0.6
            };
            this.grammar.push(rule);
            rules.push(rule);
          }
        }
      }
      return rules;
    }
    testRule(rule) {
      const sentenceRules = this.grammar.filter((r) => r.isSentenceRule);
      const testSentence = (sentenceRules.length ? sentenceRules[0] : rule).rhs.join(" ");
      const accepted = this.validateTestSentence(testSentence);
      rule.testHistory.push({ accepted, frame: this.frame });
      if (!accepted) this.illegalSet.push(testSentence);
      rule.confidence = rule.testHistory.filter((h) => h.accepted).length / rule.testHistory.length;
      return { prompt: `CAN YOU SAY: ${testSentence}`, rule: rule.lhs, accepted };
    }
    validateTestSentence(sentence) {
      const tokens = String(sentence).split(/\s+/).filter(Boolean);
      const features = tokens.map((t) => extractFeatures(t));
      for (let i = 0; i < features.length - 1; i++) {
        if (features[i].singular && features[i + 1].plural && features[i + 1].verb) return false;
      }
      return true;
    }
    // ---------- ③ Semantic parse (modern extension) ----------
    parseSemantic(input, morphology) {
      const tokens = String(input).split(/\s+/).filter(Boolean);
      const nodes = /* @__PURE__ */ new Map();
      const edges = [];
      for (let i = 0; i < tokens.length; i++) {
        const node = {
          id: `t_${i}`,
          surface: tokens[i],
          lemma: tokens[i].toLowerCase(),
          pos: this.inferPOS(tokens[i]),
          features: extractFeatures(tokens[i]),
          gloss: morphology.morphemes[i] ? morphology.morphemes[i].gloss : "",
          confidence: morphology.morphemes[i] ? 0.8 : 0.5,
          depth: 0,
          children: [],
          parent: null
        };
        nodes.set(node.id, node);
        if (i > 0) edges.push({ from: `t_${i - 1}`, to: `t_${i}`, label: "next" });
      }
      this.buildHierarchy(nodes);
      return { root: "SENT", nodes, edges, frame: this.frame };
    }
    inferPOS(token) {
      const features = extractFeatures(token);
      if (features.noun) return "NOUN";
      if (features.verb) return "VERB";
      if (features.determiner) return "DET";
      if (features.adjective) return "ADJ";
      if (features.adverb) return "ADV";
      if (features.preposition) return "PREP";
      return "UNKNOWN";
    }
    buildHierarchy(nodes) {
      const tokens = [...nodes.values()].filter((n) => n.id.startsWith("t_"));
      let i = 0;
      while (i < tokens.length) {
        if (tokens[i].pos === "DET") {
          const npStart = i;
          i++;
          while (i < tokens.length && (tokens[i].pos === "ADJ" || tokens[i].pos === "NOUN")) i++;
          if (i > npStart + 1) {
            const npId = `NP_${npStart}`;
            nodes.set(npId, {
              id: npId,
              surface: tokens.slice(npStart, i).map((t) => t.surface).join(" "),
              lemma: "NP",
              pos: "NP",
              features: {},
              gloss: "noun phrase",
              confidence: 0.7,
              depth: 1,
              children: tokens.slice(npStart, i).map((t) => t.id),
              parent: null
            });
            for (let j = npStart; j < i; j++) {
              tokens[j].parent = npId;
              tokens[j].depth = 2;
            }
          }
        } else {
          i++;
        }
      }
    }
    // ---------- ④ Bidirectional feature propagation ----------
    propagateFeatures(tree) {
      const nodes = [...tree.nodes.values()];
      for (const node of nodes) {
        for (const childId of node.children || []) {
          const child = tree.nodes.get(childId);
          if (!child) continue;
          for (const [key, value] of Object.entries(child.features)) {
            if (value && !node.features[key]) node.features[key] = true;
          }
        }
      }
      for (const node of nodes) {
        if (!node.parent) continue;
        const parent = tree.nodes.get(node.parent);
        if (!parent) continue;
        for (const [key, value] of Object.entries(parent.features)) {
          if (value && !node.features[key]) node.features[key] = true;
        }
      }
    }
    overallConfidence(tree) {
      const nodes = [...tree.nodes.values()];
      if (!nodes.length) return 0;
      return nodes.reduce((sum, n) => sum + n.confidence, 0) / nodes.length;
    }
    // ---------- Full pipeline ----------
    runPipeline(input) {
      const morphology = this.analyzeMorphology(input);
      const phraseStructure = this.learnPhraseStructure(input);
      const parseTree = this.parseSemantic(input, morphology);
      this.propagateFeatures(parseTree);
      const confidence = this.overallConfidence(parseTree);
      return {
        morphology,
        phraseStructure: {
          frame: this.frame,
          newRules: phraseStructure.newRules,
          tests: phraseStructure.tests
          // 'CAN YOU SAY: ...' prompts; rejected → illegalSet
        },
        parseTree: {
          root: parseTree.root,
          nodes: [...parseTree.nodes.values()],
          edges: parseTree.edges,
          frame: parseTree.frame
        },
        frame: this.frame,
        confidence
      };
    }
    // ---------- Transformation learning (Klein §4.0, deterministic subset) ----------
    learnTransformation(sourceTokens, targetString) {
      const targetTokens = new Set(String(targetString).split(/\s+/).filter(Boolean));
      const common = sourceTokens.filter((t) => targetTokens.has(t));
      const rule = {
        id: `T_${this.transformations.length + 1}`,
        sourcePattern: sourceTokens.join(" "),
        targetPattern: targetString,
        isMonolingual: true,
        generality: common.length,
        testHistory: [{ sentence: targetString, accepted: true, frame: this.frame }],
        status: "provisional"
      };
      rule.status = rule.testHistory.every((h) => h.accepted) ? "confirmed" : "provisional";
      this.transformations.push(rule);
      return rule;
    }
    // ---------- induceRule facade ----------
    // examples: [{ input: { relations: [], constraints: [] }, output }]
    // anchor = most frequent constraint; digits → N templates; confidence = support/examples;
    // status: validated ≥ 0.8, provisional ≥ 0.5, else candidate.
    induceRule(examples = []) {
      if (!Array.isArray(examples) || examples.length === 0) {
        throw new AutolingError("EXAMPLES_REQUIRED", "induceRule needs at least one example");
      }
      const constraintCounts = /* @__PURE__ */ new Map();
      for (const example of examples) {
        for (const constraint of example.input && example.input.constraints || []) {
          constraintCounts.set(constraint, (constraintCounts.get(constraint) || 0) + 1);
        }
      }
      let anchor = null;
      let anchorCount = 0;
      for (const [constraint, count] of constraintCounts) {
        if (count > anchorCount) {
          anchor = constraint;
          anchorCount = count;
        }
      }
      const templateFor = (output) => String(output).replace(/\d+/g, "N");
      const templated = examples.map((e) => ({
        template: templateFor(e.output),
        anchored: anchor ? (e.input && e.input.constraints || []).includes(anchor) : true
      }));
      const templateCounts = /* @__PURE__ */ new Map();
      for (const { template } of templated) templateCounts.set(template, (templateCounts.get(template) || 0) + 1);
      let bestTemplate = templated[0] ? templated[0].template : "";
      let bestCount = 0;
      for (const [template, count] of templateCounts) {
        if (count > bestCount) {
          bestTemplate = template;
          bestCount = count;
        }
      }
      const support = templated.filter((t) => t.anchored && t.template === bestTemplate).length;
      const confidence = support / examples.length;
      const status = confidence >= 0.8 ? "validated" : confidence >= 0.5 ? "provisional" : "candidate";
      const rule = {
        id: `R_${this.transformations.length + 1}`,
        anchor,
        template: bestTemplate,
        support,
        examples: examples.length,
        confidence,
        status
      };
      this.transformations.push({ ...rule, isMonolingual: true, testHistory: [], generality: support });
      return rule;
    }
    getStats() {
      return {
        frames: this.frame,
        grammarRules: this.grammar.length,
        transformations: this.transformations.length,
        illegals: this.illegalSet.length,
        heuristics: { ...this.heuristicCounters }
      };
    }
  };
  var STATES6 = [
    { id: "listen", name: "Listen", initial: true },
    { id: "abstract", name: "Abstract" },
    { id: "coin-rule", name: "Coin rule" },
    { id: "test", name: "Test" },
    { id: "distribute", name: "Distribute" },
    { id: "induce", name: "Induce" },
    { id: "grammar", name: "Grammar", accepting: true }
  ];
  var DELTA_TABLE6 = {
    "listen|pipeline": { to: "abstract", transition: "ignition" },
    "abstract|pipeline": { to: "coin-rule", transition: "flow" },
    "coin-rule|pipeline": { to: "test", transition: "fusion" },
    "test|pipeline": { to: "distribute", transition: "core" },
    "distribute|pipeline": { to: "induce", transition: "weave" },
    "induce|pipeline": { to: "grammar", transition: "becoming" },
    "grammar|pipeline": { to: "grammar", transition: "automatize" },
    "listen|induce": { to: "induce", transition: "ignition" },
    "induce|induce": { to: "grammar", transition: "becoming" },
    "grammar|induce": { to: "grammar", transition: "automatize" },
    "listen|transform": { to: "coin-rule", transition: "ignition" },
    "coin-rule|transform": { to: "grammar", transition: "chain" },
    "listen|stats": { to: "listen", transition: "core" }
  };
  var OP_PATHS2 = {
    pipeline: [["listen", "pipeline"], ["abstract", "pipeline"], ["coin-rule", "pipeline"], ["test", "pipeline"], ["distribute", "pipeline"], ["induce", "pipeline"], ["grammar", "pipeline"]],
    induce: [["listen", "induce"], ["induce", "induce"], ["grammar", "induce"]],
    transform: [["listen", "transform"], ["coin-rule", "transform"]],
    stats: [["listen", "stats"]]
  };
  var normalizeInput6 = (input) => {
    if (typeof input === "string") return { operation: "pipeline", text: input };
    if (input && Array.isArray(input.args) && input.args.length && !input.operation) {
      return { ...input, operation: "pipeline", text: input.args.join(" ") };
    }
    if (input && input.text !== void 0 && !input.operation) return { ...input, operation: "pipeline" };
    return input || {};
  };
  var _AutolingAutomaton_instances, dispatch_fn6;
  var _AutolingAutomaton = class _AutolingAutomaton extends Automaton {
    constructor(options = {}) {
      const memory = options.state || new AutolingEngine();
      let dispatch;
      super({
        id: "autoling",
        address: { mode: "macro", gate: 17, line: 1, color: 1, tone: 1, base: 1, planetaryDimension: "Design" },
        states: STATES6,
        alphabet: ["pipeline", "induce", "transform", "stats"],
        delta: (state, symbol) => DELTA_TABLE6[`${state}|${symbol}`] || { to: state, transition: "flow" },
        q0: "listen",
        finals: ["grammar"],
        ports: _AutolingAutomaton.descriptor.ports,
        capabilities: _AutolingAutomaton.descriptor.capabilities,
        dimension: "Design",
        implementation: (input, context) => dispatch(input, context)
      });
      __privateAdd(this, _AutolingAutomaton_instances);
      this.ownedState = memory;
      dispatch = (input, context) => __privateMethod(this, _AutolingAutomaton_instances, dispatch_fn6).call(this, input, context);
    }
  };
  _AutolingAutomaton_instances = new WeakSet();
  dispatch_fn6 = function(rawInput, context = {}) {
    const input = normalizeInput6(rawInput);
    const op = input.operation || "pipeline";
    const path = OP_PATHS2[op];
    if (!path) throw new AutolingError("UNKNOWN_OPERATION", String(op));
    for (const [from, symbol] of path) this.step(from, symbol, { tool: this.id });
    const engine2 = this.ownedState;
    switch (op) {
      case "pipeline": {
        if (input.text === void 0) throw new AutolingError("TEXT_REQUIRED", "Pipeline requires input.text");
        const pipeline = engine2.runPipeline(input.text);
        return { pipeline, rules: [...engine2.grammar], stats: engine2.getStats() };
      }
      case "induce": {
        const rule = engine2.induceRule(input.examples || []);
        return { rule, rules: [...engine2.grammar], stats: engine2.getStats() };
      }
      case "transform": {
        const source = Array.isArray(input.sourceTokens) ? input.sourceTokens : String(input.text || "").split(/\s+/).filter(Boolean);
        const rule = engine2.learnTransformation(source, input.target || "");
        return { rule, stats: engine2.getStats() };
      }
      case "stats":
        return { stats: engine2.getStats(), rules: [...engine2.grammar] };
      default:
        throw new AutolingError("UNKNOWN_OPERATION", String(op));
    }
  };
  __publicField(_AutolingAutomaton, "descriptor", {
    id: "autoling",
    aliases: ["auto-ling", "autoling-canonical", "klein-autoling"],
    gate: 17,
    channels: ["17-62"],
    capabilities: ["pipeline", "morphology", "phrase-structure", "semantic-parse", "induce", "transform", "stats"],
    ports: {
      in: [{ id: "corpus", type: "text", schemaVersion: "1" }],
      out: [{ id: "grammar", type: "grammar", schemaVersion: "1" }]
    },
    automatonForm: "enhanced rule-induction pipeline",
    dimension: "Design",
    description: "Sheldon Klein AUTOLING (1968), canonical enhanced: distributional morphology with Boolean feature vectors and allomorph detection, phrase-structure heuristics H1/H2 with CAN-YOU-SAY rule testing and an illegal set, semantic token graph with bidirectional feature propagation, plus an induceRule facade over input/output examples."
  });
  var AutolingAutomaton = _AutolingAutomaton;
  var tool_14_autoling_default = AutolingAutomaton;

  // src/automata/tools/tool-15-diseminer.js
  var tool_15_diseminer_exports = {};
  __export(tool_15_diseminer_exports, {
    DiseminerAutomaton: () => DiseminerAutomaton,
    DiseminerEngine: () => DiseminerEngine,
    DiseminerError: () => DiseminerError,
    default: () => tool_15_diseminer_default
  });
  var DiseminerError = class extends Error {
    constructor(code, message, details = {}) {
      super(message);
      this.name = "DiseminerError";
      this.code = code;
      this.details = details;
    }
  };
  var mulberry322 = (seed) => {
    let a = seed >>> 0;
    return () => {
      a |= 0;
      a = a + 1831565813 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  };
  var fnv1a32 = (str) => {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };
  var VERB_AUX = [
    "is",
    "are",
    "was",
    "were",
    "has",
    "have",
    "had",
    "does",
    "do",
    "did",
    "can",
    "could",
    "will",
    "would",
    "shall",
    "should",
    "may",
    "might",
    "must"
  ];
  var DiseminerEngine = class {
    constructor() {
      this.distributionalSpace = /* @__PURE__ */ new Map();
      this.claims = /* @__PURE__ */ new Map();
      this.narratives = /* @__PURE__ */ new Map();
      this.simulationHistory = [];
      this.sequence = 0;
    }
    tokenize(text) {
      return String(text).toLowerCase().replace(/[^a-zA-Z0-9\s]/g, " ").split(/\s+/).filter((t) => t.length > 2);
    }
    // ---------- observe: distributional space update (window 5) + familiarity sense ----------
    observe(text) {
      const tokens = this.tokenize(text);
      const knownWords = tokens.filter((t) => this.distributionalSpace.has(t)).length;
      const exposures = tokens.map((t) => {
        const vector = this.distributionalSpace.get(t);
        return vector ? vector.contexts.length : 0;
      });
      for (let i = 0; i < tokens.length; i++) {
        const word = tokens[i];
        if (!this.distributionalSpace.has(word)) {
          this.distributionalSpace.set(word, { word, contexts: [], cooccurrence: /* @__PURE__ */ new Map() });
        }
        const vector = this.distributionalSpace.get(word);
        const left = tokens.slice(Math.max(0, i - 5), i);
        const right = tokens.slice(i + 1, Math.min(tokens.length, i + 6));
        vector.contexts.push({ left, right, position: i });
        for (const contextWord of [...left, ...right]) {
          vector.cooccurrence.set(contextWord, (vector.cooccurrence.get(contextWord) || 0) + 1);
        }
      }
      const wordCount = tokens.length;
      const familiar = wordCount ? knownWords / wordCount : 0;
      const avgExposure = wordCount ? exposures.reduce((s, x) => s + x, 0) / wordCount : 0;
      return {
        sense: {
          alert: familiar < 0.5,
          familiar,
          wordCount,
          knownWords,
          avgExposure
        },
        words: this.distributionalSpace.size
      };
    }
    // ---------- claims: naive SVO extraction with modality cues ----------
    extractClaims(text, source = "observation") {
      const sentences = String(text).split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 10);
      const extracted = [];
      for (const sentence of sentences) {
        const claim = this.extractClaimFromSentence(sentence, source);
        if (claim) {
          extracted.push(claim);
          this.claims.set(claim.id, claim);
        }
      }
      this.crossReferenceClaims(extracted);
      return extracted;
    }
    extractClaimFromSentence(sentence, source) {
      const tokens = this.tokenize(sentence);
      if (tokens.length < 3) return null;
      const subject = tokens[0];
      const predicate = tokens.find((t, i) => i > 0 && this.isVerb(t)) || tokens[1];
      const object = tokens.slice(tokens.indexOf(predicate) + 1).join(" ") || tokens[tokens.length - 1];
      const modality = this.inferModality(sentence);
      const evidence = this.findEvidence(subject, predicate, object);
      return {
        id: `claim_${++this.sequence}`,
        text: sentence,
        source,
        subject,
        predicate,
        object,
        confidence: evidence.reduce((sum, e) => sum + e.strength, 0) / (evidence.length || 1),
        evidence,
        contradictions: [],
        supports: [],
        modality
      };
    }
    isVerb(word) {
      return VERB_AUX.includes(String(word).toLowerCase()) || /(ing|ed|en|s)$/.test(word);
    }
    inferModality(sentence) {
      const lower = sentence.toLowerCase();
      if (/\b(must|certainly|definitely|always|never|all)\b/.test(lower)) return "certain";
      if (/\b(probably|likely|most|generally|usually)\b/.test(lower)) return "probable";
      if (/\b(might|could|possibly|maybe|some)\b/.test(lower)) return "possible";
      if (/\b(think|believe|suggest|hypothesize|speculate)\b/.test(lower)) return "speculative";
      return "probable";
    }
    findEvidence(subject, predicate, object) {
      const evidence = [];
      for (const [word, vector] of this.distributionalSpace) {
        if (word === subject || word === object) {
          for (const context of vector.contexts) {
            const contextText = [...context.left, word, ...context.right].join(" ");
            if (contextText.includes(predicate) || contextText.includes(object)) {
              evidence.push({ text: contextText, strength: 0.1 });
            }
          }
        }
      }
      return evidence.slice(0, 5);
    }
    crossReferenceClaims(claims) {
      for (let i = 0; i < claims.length; i++) {
        for (let j = i + 1; j < claims.length; j++) {
          const a = claims[i];
          const b = claims[j];
          if (a.subject === b.subject && a.predicate !== b.predicate) {
            const negationWords = ["not", "no", "never", "none", "without", "against"];
            const aNegated = negationWords.some((w) => a.text.toLowerCase().includes(w));
            const bNegated = negationWords.some((w) => b.text.toLowerCase().includes(w));
            if (aNegated !== bNegated) {
              a.contradictions.push(b.id);
              b.contradictions.push(a.id);
            }
          }
          if (a.subject === b.subject && a.predicate === b.predicate) {
            a.supports.push(b.id);
            b.supports.push(a.id);
          }
        }
      }
    }
    // ---------- Monte Carlo simulation (seeded, deterministic) ----------
    runMonteCarlo(query, options = {}) {
      const iterations = options.iterations || 1e3;
      const seed = options.seed !== void 0 ? options.seed : fnv1a32(String(query));
      const random = mulberry322(seed);
      const hypotheses = this.generateHypotheses(query);
      const samples = [];
      let iteration = 0;
      let converged = false;
      while (iteration < iterations && !converged) {
        for (const hypothesis of hypotheses) {
          const prior = typeof options.prior === "number" ? options.prior : options.prior instanceof Map ? options.prior.get(hypothesis) || 1 / hypotheses.length : 1 / hypotheses.length;
          const jitter = 0.95 + random() * 0.1;
          const evidenceWeight = Math.min(this.calculateEvidenceWeight(hypothesis, query) * jitter, 1);
          const posterior = prior * evidenceWeight / (prior * evidenceWeight + (1 - prior) * (1 - evidenceWeight) + 1e-3);
          samples.push({ hypothesis, probability: posterior, evidenceWeight, priorProbability: prior });
        }
        iteration += hypotheses.length;
        if (iteration >= 100) {
          const recent = samples.slice(-100);
          const mean2 = recent.reduce((s, x) => s + x.probability, 0) / recent.length;
          const variance = recent.reduce((s, x) => s + (x.probability - mean2) ** 2, 0) / recent.length;
          converged = variance < 0.01;
        }
      }
      const best = samples.reduce((b, c) => c.probability > b.probability ? c : b, samples[0]);
      const probabilities = samples.map((s) => s.probability).sort((a, b) => a - b);
      const ci = [
        probabilities[Math.floor(probabilities.length * 0.025)],
        probabilities[Math.min(Math.floor(probabilities.length * 0.975), probabilities.length - 1)]
      ];
      const simulation = {
        query,
        seed,
        iterations: iteration,
        hypotheses: hypotheses.length,
        bestHypothesis: best.hypothesis,
        bestProbability: best.probability,
        confidenceInterval: ci,
        doubtBypassed: best.probability > 0.7 && ci[0] > 0.5
      };
      this.simulationHistory.push(simulation);
      return simulation;
    }
    generateHypotheses(query) {
      const tokens = this.tokenize(query);
      const hypotheses = [];
      for (const token of tokens) {
        const vector = this.distributionalSpace.get(token);
        if (vector) {
          for (const [target] of vector.cooccurrence) {
            hypotheses.push(`${token} associates with ${target}`);
          }
        }
      }
      hypotheses.push(`The answer to "${query}" is positive`);
      hypotheses.push(`The answer to "${query}" is negative`);
      hypotheses.push(`The answer to "${query}" requires more context`);
      return [...new Set(hypotheses)];
    }
    calculateEvidenceWeight(hypothesis, query) {
      const hypothesisTokens = this.tokenize(hypothesis);
      const queryTokens = this.tokenize(query);
      let weight = 0;
      for (const hToken of hypothesisTokens) {
        const vector = this.distributionalSpace.get(hToken);
        if (!vector) continue;
        for (const qToken of queryTokens) {
          weight += vector.cooccurrence.get(qToken) || 0;
        }
      }
      return Math.min(weight / 10, 1);
    }
    // ---------- narrative generation: 10 w-dimensions → deterministic narrative ----------
    generateNarrative(query, userContext = {}) {
      const simulation = this.runMonteCarlo(query, { iterations: 500 });
      const w = this.calculateWDimensions(query, userContext, simulation);
      const narrative = this.buildNarrative(query, simulation, w, userContext);
      this.narratives.set(narrative.id, narrative);
      return narrative;
    }
    calculateWDimensions(query, userContext, simulation) {
      const queryTokens = this.tokenize(query);
      const querySet = new Set(queryTokens);
      const intersects = (other) => {
        const otherSet = new Set(this.tokenize(other || ""));
        return new Set([...querySet].filter((x) => otherSet.has(x))).size;
      };
      return {
        w1_relevance: intersects(userContext.interests) / Math.max(querySet.size, new Set(this.tokenize(userContext.interests || "")).size, 1),
        w2_urgency: /\b(now|urgent|immediately|asap|deadline|critical|emergency)\b/i.test(query) ? 0.9 : 0.3,
        w3_emotionalResonance: Math.min(queryTokens.filter((t) => ["love", "hate", "fear", "hope", "dream", "passion", "purpose", "meaning"].includes(t)).length / 2, 1),
        w4_cognitiveLoad: Math.min(queryTokens.length / 20, 1),
        w5_socialProof: simulation.iterations > 100 ? 0.7 : 0.3,
        w6_authority: /\b(research|study|expert|scientist|professor|doctor|evidence)\b/i.test(query) ? 0.8 : 0.5,
        w7_reciprocity: 0.5,
        w8_scarcity: /\b(only|limited|exclusive|rare|unique|special|once)\b/i.test(query) ? 0.8 : 0.2,
        w9_consistency: intersects(userContext.beliefs) / Math.max(querySet.size, 1),
        w10_liking: Number.isFinite(userContext.likingScore) ? userContext.likingScore : 0.5
      };
    }
    buildNarrative(query, simulation, wDims, userContext) {
      const bestHypothesis = simulation.bestHypothesis;
      const values = Object.values(wDims);
      const influenceScore = values.reduce((s, v) => s + v, 0) / values.length;
      const seeker = userContext.name || "the seeker";
      const scenes = [
        {
          setting: `The context of "${query}"`,
          characters: [seeker, "the evidence"],
          action: `Exploring the question: ${query}`,
          emotionalTone: "curious"
        },
        {
          setting: "The simulation chamber",
          characters: ["Monte Carlo engine", "distributional space"],
          action: `Running ${simulation.iterations} iterations to find the best hypothesis`,
          emotionalTone: "analytical"
        },
        {
          setting: "The resolution",
          characters: [seeker],
          action: `The evidence points to: ${bestHypothesis}`,
          emotionalTone: influenceScore > 0.7 ? "confident" : "cautious"
        }
      ];
      const story = scenes.map((s) => `Scene: ${s.setting}
Characters: ${s.characters.join(", ")}
Action: ${s.action}
Tone: ${s.emotionalTone}
`).join("\n---\n");
      return {
        id: `narrative_${++this.sequence}`,
        targetUser: userContext.name || "anonymous",
        story,
        scenes,
        wDimensions: wDims,
        influenceScore,
        personalizationDepth: values.filter((v) => v > 0.5).length / values.length,
        doubtBypassed: simulation.doubtBypassed,
        evidenceAnchors: [simulation.bestHypothesis]
      };
    }
    getStats() {
      return {
        words: this.distributionalSpace.size,
        claims: this.claims.size,
        narratives: this.narratives.size,
        simulations: this.simulationHistory.length
      };
    }
  };
  var STATES7 = [
    { id: "receive", name: "Receive", initial: true },
    { id: "simulate", name: "Simulate" },
    { id: "narrate", name: "Narrate" },
    { id: "space", name: "Space" },
    { id: "claims", name: "Claims" },
    { id: "influence", name: "Influence", accepting: true }
  ];
  var DELTA_TABLE7 = {
    "receive|observe": { to: "space", transition: "ignition" },
    "space|observe": { to: "space", transition: "flow" },
    "receive|extract": { to: "claims", transition: "ignition" },
    "claims|extract": { to: "claims", transition: "core" },
    "receive|simulate": { to: "simulate", transition: "ignition" },
    "simulate|simulate": { to: "simulate", transition: "recursion" },
    "receive|narrate": { to: "simulate", transition: "ignition" },
    "simulate|narrate": { to: "narrate", transition: "recursion" },
    "narrate|narrate": { to: "influence", transition: "weave" },
    "influence|narrate": { to: "influence", transition: "becoming" },
    "receive|stats": { to: "receive", transition: "core" }
  };
  var OP_PATHS3 = {
    observe: [["receive", "observe"], ["space", "observe"]],
    extract: [["receive", "extract"], ["claims", "extract"]],
    simulate: [["receive", "simulate"], ["simulate", "simulate"]],
    narrate: [["receive", "narrate"], ["simulate", "narrate"], ["narrate", "narrate"], ["influence", "narrate"]],
    stats: [["receive", "stats"]]
  };
  var normalizeInput7 = (input) => {
    if (typeof input === "string") return { operation: "observe", text: input };
    if (input && Array.isArray(input.args) && input.args.length && !input.operation) {
      return { ...input, operation: "observe", text: input.args.join(" ") };
    }
    if (input && input.text !== void 0 && !input.operation) return { ...input, operation: "observe" };
    return input || {};
  };
  var _DiseminerAutomaton_instances, dispatch_fn7;
  var _DiseminerAutomaton = class _DiseminerAutomaton extends Automaton {
    constructor(options = {}) {
      const memory = options.state || new DiseminerEngine();
      let dispatch;
      super({
        id: "diseminer",
        address: { mode: "macro", gate: 48, line: 1, color: 1, tone: 1, base: 1, planetaryDimension: "Evolution" },
        states: STATES7,
        alphabet: ["observe", "extract", "simulate", "narrate", "stats"],
        delta: (state, symbol) => DELTA_TABLE7[`${state}|${symbol}`] || { to: state, transition: "flow" },
        q0: "receive",
        // Every op terminates at its natural resting state; all of them accept.
        // observe→space, extract→claims, simulate→simulate, narrate→influence,
        // stats→receive. (Previously only 'influence' accepted, so observe /
        // extract / simulate / stats runs were reported as rejected.)
        finals: ["receive", "space", "claims", "simulate", "influence"],
        ports: _DiseminerAutomaton.descriptor.ports,
        capabilities: _DiseminerAutomaton.descriptor.capabilities,
        dimension: "Evolution",
        implementation: (input, context) => dispatch(input, context)
      });
      __privateAdd(this, _DiseminerAutomaton_instances);
      this.ownedState = memory;
      dispatch = (input, context) => __privateMethod(this, _DiseminerAutomaton_instances, dispatch_fn7).call(this, input, context);
    }
  };
  _DiseminerAutomaton_instances = new WeakSet();
  dispatch_fn7 = function(rawInput, ctx = {}) {
    const context = ctx && ctx.context || ctx || {};
    const input = normalizeInput7(rawInput);
    const op = input.operation || "observe";
    const path = OP_PATHS3[op];
    if (!path) throw new DiseminerError("UNKNOWN_OPERATION", String(op));
    for (const [from, symbol] of path) this.step(from, symbol, { tool: this.id });
    const engine2 = this.ownedState;
    switch (op) {
      case "observe": {
        if (input.text === void 0) throw new DiseminerError("TEXT_REQUIRED", "observe requires input.text");
        return engine2.observe(input.text);
      }
      case "extract": {
        if (input.text === void 0) throw new DiseminerError("TEXT_REQUIRED", "extract requires input.text");
        return { claims: engine2.extractClaims(input.text, input.source), stats: engine2.getStats() };
      }
      case "simulate": {
        if (input.query === void 0) throw new DiseminerError("QUERY_REQUIRED", "simulate requires input.query");
        return engine2.runMonteCarlo(input.query, input.options || {});
      }
      case "narrate": {
        if (input.query === void 0) throw new DiseminerError("QUERY_REQUIRED", "narrate requires input.query");
        return engine2.generateNarrative(input.query, input.userContext || context.userContext || {});
      }
      case "stats":
        return engine2.getStats();
      default:
        throw new DiseminerError("UNKNOWN_OPERATION", String(op));
    }
  };
  __publicField(_DiseminerAutomaton, "descriptor", {
    id: "diseminer",
    aliases: ["diseminer-canonical", "dise", "narrative-engine"],
    gate: 48,
    channels: ["16-48"],
    capabilities: ["observe", "extract-claims", "monte-carlo", "narrative", "stats"],
    ports: {
      in: [{ id: "text", type: "text", schemaVersion: "1" }],
      out: [{ id: "narrative", type: "narrative", schemaVersion: "1" }, { id: "claims", type: "claims", schemaVersion: "1" }]
    },
    automatonForm: "distributional narrative engine",
    dimension: "Evolution",
    description: "Klein/Lieman/Lindstrom DISEMINER (1968), canonical enhanced: persistent window-5 distributional co-occurrence space, naive SVO claim extraction with modality cues, seeded Monte Carlo hypothesis sampling with 95% CI and doubt-bypass detection, and deterministic narrative generation scored over the 10 w-dimensions of influence."
  });
  var DiseminerAutomaton = _DiseminerAutomaton;
  var tool_15_diseminer_default = DiseminerAutomaton;

  // src/automata/tools/tool-16-morph-mir.js
  var tool_16_morph_mir_exports = {};
  __export(tool_16_morph_mir_exports, {
    MirAnalyzer: () => MirAnalyzer,
    MirRenderer: () => MirRenderer,
    MorphMemoryEngine: () => MorphMemoryEngine,
    MorphMirAutomaton: () => MorphMirAutomaton,
    MorphMirError: () => MorphMirError,
    default: () => tool_16_morph_mir_default
  });
  var MorphMirError = class extends Error {
    constructor(code, message, details = {}) {
      super(message);
      this.name = "MorphMirError";
      this.code = code;
      this.details = details;
    }
  };
  var MirAnalyzer = class {
    analyze(artifact) {
      const content = artifact.originalContent;
      const fileType = this.detectFileType(artifact.originalName);
      const contract = {
        fileType,
        exports: this.extractExports(content),
        imports: this.extractImports(content),
        dependencies: this.extractDependencies(content),
        props: fileType === "tsx" || fileType === "jsx" ? this.extractProps(content) : void 0,
        behavior: this.extractBehavior(content),
        dataFlow: this.extractDataFlow(content),
        stateShape: this.extractStateShape(content),
        apiSurface: this.extractApiSurface(content)
      };
      const blueprint = this.extractBlueprint(content);
      return { contract, blueprint };
    }
    detectFileType(filename) {
      const ext = String(filename).split(".").pop().toLowerCase();
      return { tsx: "tsx", ts: "ts", js: "js", jsx: "jsx", py: "py", json: "json", css: "css", md: "md" }[ext] || "unknown";
    }
    extractExports(content) {
      const exports = [];
      const defaultMatch = content.match(/export\s+default\s+(?:function|class|const)?\s*(\w+)/);
      if (defaultMatch) exports.push(`default:${defaultMatch[1]}`);
      for (const match of content.matchAll(/export\s+(?:function|class|const|type|interface)\s+(\w+)/g)) exports.push(match[1]);
      return exports;
    }
    extractImports(content) {
      return [...content.matchAll(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]);
    }
    extractDependencies(content) {
      const deps = /* @__PURE__ */ new Set();
      if (content.includes("react")) deps.add("react");
      if (content.includes("framer-motion")) deps.add("framer-motion");
      if (content.includes("useState") || content.includes("useEffect")) deps.add("react-hooks");
      if (content.includes("fetch") || content.includes("axios") || content.includes("http")) deps.add("http");
      if (content.includes("supabase")) deps.add("supabase");
      if (content.includes("tailwind")) deps.add("tailwind");
      if (content.includes("three")) deps.add("three.js");
      if (content.includes("tensorflow") || content.includes("tf.")) deps.add("tensorflow");
      return [...deps];
    }
    extractProps(content) {
      const props = [];
      const interfaceMatch = content.match(/interface\s+\w+Props\s*\{([^}]+)\}/);
      if (interfaceMatch) {
        for (const match of interfaceMatch[1].matchAll(/(\w+)(\?)?:\s*(\w+)/g)) {
          props.push({ name: match[1], type: match[3], required: !match[2] });
        }
      }
      return props;
    }
    extractBehavior(content) {
      const behavior = [];
      if (content.includes("onClick")) behavior.push("handles click events");
      if (content.includes("onChange")) behavior.push("handles input changes");
      if (content.includes("onSubmit")) behavior.push("handles form submission");
      if (content.includes("useState")) behavior.push("manages local state");
      if (content.includes("useEffect")) behavior.push("reacts to lifecycle changes");
      if (content.includes("useReducer")) behavior.push("complex state management");
      if (content.includes("fetch") || content.includes("axios")) behavior.push("makes API calls");
      if (content.includes("map(")) behavior.push("renders lists dynamically");
      if (content.includes("animate") || content.includes("motion")) behavior.push("has animations");
      return behavior;
    }
    extractDataFlow(content) {
      const flows = [];
      if (content.includes("useState")) flows.push({ from: "user", to: "state", type: "state" });
      if (content.includes("onClick")) flows.push({ from: "user", to: "handler", type: "event" });
      if (content.includes("onChange")) flows.push({ from: "input", to: "state", type: "event", transform: "sanitize" });
      if (content.includes("fetch") || content.includes("axios")) {
        flows.push({ from: "api", to: "component", type: "api" });
        flows.push({ from: "component", to: "state", type: "state", transform: "parseJSON" });
      }
      if (content.includes("props")) flows.push({ from: "parent", to: "component", type: "prop" });
      return flows;
    }
    extractStateShape(content) {
      const stateShape = {};
      for (const match of content.matchAll(/const\s+\[(\w+),\s*set(\w+)\]\s*=\s*useState(?:<([^>]+)>)?\(([^)]*)\)/g)) {
        stateShape[match[1]] = match[3] || "any";
      }
      return Object.keys(stateShape).length > 0 ? stateShape : void 0;
    }
    extractApiSurface(content) {
      const endpoints = [];
      for (const match of content.matchAll(/fetch\s*\(\s*['"]([^'"]+)['"]\s*\)/g)) {
        endpoints.push({ method: "GET", path: match[1] });
      }
      return endpoints.length > 0 ? endpoints : void 0;
    }
    extractBlueprint(content) {
      const imports = [...content.matchAll(/import\s+.*?\s+from\s+['"][^'"]+['"]/g)].map((m) => m[0]);
      const exports = [...content.matchAll(/export\s+(?:default\s+)?(?:function|const|class|interface|type)\s+\w+/g)].map((m) => m[0]);
      const functions = [...content.matchAll(/(?:function|const)\s+(\w+)/g)].map((m) => m[1]);
      const classes = [...content.matchAll(/class\s+(\w+)/g)].map((m) => m[1]);
      const hasJsx = content.includes("return (") && content.includes("<");
      let fileRole = "utility";
      if (hasJsx) fileRole = "component";
      else if (exports.some((e) => e.includes("default"))) fileRole = "module";
      else if (classes.length > 0) fileRole = "class";
      else if (functions.length > 0) fileRole = "functions";
      return { imports, exports, functions, classes, hasJsx, fileRole, chunkCount: Math.ceil(content.length / 2e3), totalLength: content.length };
    }
  };
  var MirRenderer = class {
    render(contract, blueprint, mode) {
      if (mode === "equivalent") return this.renderEquivalent(contract, blueprint);
      return this.renderMorphRuntime(contract, blueprint);
    }
    renderEquivalent(contract, blueprint) {
      const lines = [];
      const specName = (blueprint.exports[0] || "").replace("default:", "") || "MorphComponent";
      for (const imp of contract.imports.slice(0, 5)) {
        if (imp === "react") lines.push('import React from "react"');
        else if (imp.includes("framer")) lines.push('import { motion } from "framer-motion"');
        else if (imp.includes("supabase")) lines.push('import { supabase } from "@/lib/supabase"');
        else lines.push(`import * as ${imp.replace(/[^a-zA-Z0-9]/g, "_").replace(/^[0-9]/, "_")} from "${imp}"`);
      }
      lines.push("");
      if (contract.props && contract.props.length > 0) {
        lines.push(`interface ${specName}Props {`);
        for (const prop of contract.props) lines.push(`  ${prop.name}${prop.required ? "" : "?"}: ${prop.type};`);
        lines.push("}", "");
      }
      if (blueprint.fileRole === "component") {
        lines.push(`export const ${specName} = () => {`);
        for (const behavior of contract.behavior) lines.push(`  // TODO: ${behavior}`);
        lines.push("", "  return (", "    <div>", `      {/* ${specName} - equivalent reconstruction */}`, "    </div>", "  );", "};");
      } else {
        lines.push(`export function ${specName}() {`);
        for (const behavior of contract.behavior) lines.push(`  // TODO: ${behavior}`);
        lines.push("  return null;", "}");
      }
      if (blueprint.exports.some((e) => e.startsWith("default:"))) lines.push("", `export default ${specName};`);
      return lines.join("\n");
    }
    renderMorphRuntime(contract, blueprint) {
      const specName = (blueprint.exports[0] || "").replace("default:", "") || "MorphComponent";
      return [
        "// Morph Runtime Equivalent",
        `// Original: ${blueprint.fileRole} (${contract.fileType})`,
        "// Confidence: ~0.78",
        `// This file: ${specName}.morph.ts (the spec)`,
        "",
        `export const ${specName}Spec = {`,
        `  type: "${blueprint.fileRole}",`,
        `  name: "${specName}",`,
        `  fileType: "${contract.fileType}",`,
        `  behavior: ${JSON.stringify(contract.behavior)},`,
        `  dependencies: ${JSON.stringify(contract.dependencies)},`,
        `  dataFlow: ${JSON.stringify(contract.dataFlow)},`,
        `  stateShape: ${JSON.stringify(contract.stateShape)},`,
        `  apiSurface: ${JSON.stringify(contract.apiSurface)}`,
        "};"
      ].join("\n");
    }
  };
  var _MorphMemoryEngine_instances, contractAndBlueprint_fn, artifact_fn;
  var MorphMemoryEngine = class {
    constructor() {
      __privateAdd(this, _MorphMemoryEngine_instances);
      this.nodes = /* @__PURE__ */ new Map();
      this.operations = [];
      this.artifacts = /* @__PURE__ */ new Map();
      this.nodeCounter = 0;
      this.artifactCounter = 0;
      this.opCounter = 0;
      this.analyzer = new MirAnalyzer();
      this.renderer = new MirRenderer();
    }
    ingest({ name, content } = {}) {
      if (!name || typeof content !== "string") {
        throw new MorphMirError("ARTIFACT_REQUIRED", "ingest requires {name, content}");
      }
      const artifact = {
        id: `artifact_${++this.artifactCounter}`,
        originalName: name,
        originalContent: content,
        understanding: null,
        metadata: { status: "ingested" }
      };
      this.artifacts.set(artifact.id, artifact);
      this.addOperation("ingest", artifact.id, `Ingested ${name} (${content.length} bytes)`);
      this.completeOperation("ingest", artifact.id, `Artifact ${artifact.id} stored`);
      return artifact;
    }
    analyze(artifactId) {
      const artifact = __privateMethod(this, _MorphMemoryEngine_instances, artifact_fn).call(this, artifactId);
      this.addOperation("analyze", artifact.id, `Analyzing ${artifact.originalName}...`);
      const content = artifact.originalContent;
      const { contract, blueprint } = this.analyzer.analyze(artifact);
      this.createSourceChunks(content, artifact.id);
      this.createNode("file_blueprint", JSON.stringify({ contract, blueprint }), artifact.id);
      for (const imp of blueprint.imports.slice(0, 10)) this.createNode("dependency", imp, artifact.id);
      const understanding = {
        intent: this.extractIntent(content),
        functionality: this.extractFunctionality(content),
        dependencies: this.extractDependencies(content),
        patterns: this.extractPatterns(content),
        complexity: this.calculateComplexity(content),
        keyInsights: [],
        reusableComponents: []
      };
      understanding.keyInsights = this.extractKeyInsights(content, understanding.functionality);
      understanding.reusableComponents = this.extractReusableComponents(content);
      for (const func of understanding.functionality) this.createNode("functionality", func, artifact.id);
      for (const pattern of understanding.patterns) this.createNode("pattern", pattern, artifact.id);
      for (const insight of understanding.keyInsights) this.createNode("insight", insight, artifact.id);
      for (const comp of understanding.reusableComponents) this.createNode("reusable_component", comp, artifact.id);
      artifact.understanding = understanding;
      artifact.metadata = { ...artifact.metadata, status: "understood" };
      this.completeOperation("analyze", artifact.id, `MIR contract + ${blueprint.chunkCount} source chunks stored. Blueprint: ${blueprint.fileRole}`);
      return { artifactId: artifact.id, understanding, blueprint, nodes: this.findArtifactNodes(artifact.id).length };
    }
    remember(artifactId) {
      const artifact = __privateMethod(this, _MorphMemoryEngine_instances, artifact_fn).call(this, artifactId);
      if (!artifact.understanding) throw new MorphMirError("ANALYSIS_REQUIRED", "remember requires a prior analyze");
      this.addOperation("remember", artifact.id, `Committing ${artifact.originalName} to memory...`);
      this.strengthenConnections(artifact.id);
      const artifactNodes = this.findArtifactNodes(artifact.id);
      for (const node of artifactNodes) node.weight = Math.min(1, node.weight + 0.2);
      this.completeOperation("remember", artifact.id, `Committed ${artifactNodes.length} nodes to memory.`);
      return { artifactId: artifact.id, nodesCommitted: artifactNodes.length };
    }
    // BRUTAL: isExact = byte-identical. No lying with good posture.
    regenerate(artifactId, { mode = "morph_runtime" } = {}) {
      const artifact = __privateMethod(this, _MorphMemoryEngine_instances, artifact_fn).call(this, artifactId);
      if (!artifact.understanding) throw new MorphMirError("ANALYSIS_REQUIRED", "regenerate requires a prior analyze");
      this.addOperation("regenerate", artifact.id, `Regenerating ${artifact.originalName} (mode: ${mode})...`);
      const artifactNodes = this.findArtifactNodes(artifact.id);
      const blueprintNode = artifactNodes.find((n) => n.nodeType === "file_blueprint");
      const reconstructed = this.reconstructFromChunks(artifact.id);
      const isIdentical = reconstructed === artifact.originalContent;
      const integrity = artifact.originalContent.length > 0 ? reconstructed.length / artifact.originalContent.length : 0;
      const chunkCount = artifactNodes.filter((n) => n.nodeType === "source_chunk").length;
      const hasSourceChunks = chunkCount > 0;
      const base = {
        integrity,
        chunkCount,
        reconstructedLength: reconstructed.length,
        originalLength: artifact.originalContent.length
      };
      let result;
      if (mode === "exact") {
        if (hasSourceChunks && integrity > 0.7) {
          result = {
            ...base,
            code: reconstructed,
            confidence: isIdentical ? 0.98 : 0.92,
            modeUsed: "exact",
            missing: isIdentical ? [] : ["minor whitespace/formatting differences"],
            isExact: isIdentical
          };
        } else {
          result = {
            ...base,
            code: this.generateFromBlueprint(artifact.id, artifact.understanding),
            confidence: 0.65,
            modeUsed: "exact",
            missing: [`Source integrity too low (${(integrity * 100).toFixed(1)}%). Reconstructed from blueprint.`],
            isExact: false
          };
        }
      } else if (mode === "equivalent") {
        const { contract, blueprint } = __privateMethod(this, _MorphMemoryEngine_instances, contractAndBlueprint_fn).call(this, blueprintNode, artifact);
        result = {
          ...base,
          code: this.renderer.render(contract, blueprint, "equivalent"),
          confidence: 0.85,
          modeUsed: "equivalent",
          missing: ["exact implementation details", "original comments", "precise formatting"],
          integrity: 0,
          isExact: false
        };
      } else if (mode === "morph_runtime") {
        const { contract, blueprint } = __privateMethod(this, _MorphMemoryEngine_instances, contractAndBlueprint_fn).call(this, blueprintNode, artifact);
        const morphCode = this.renderer.render(contract, blueprint, "morph_runtime");
        result = {
          ...base,
          code: morphCode,
          confidence: 0.78,
          modeUsed: "morph_runtime",
          missing: ["exact styles", "custom animation timing", "original variable names"],
          integrity: 0,
          // BY DESIGN: runtime-equivalent morph never claims source integrity
          isExact: false
        };
        this.createNode("morph_runtime", JSON.stringify({ specName: `${artifact.originalName}.morph`, confidence: 0.78 }), artifact.id);
      } else {
        throw new MorphMirError("UNKNOWN_MODE", String(mode));
      }
      this.completeOperation("regenerate", artifact.id, `${mode} complete (${result.confidence} confidence, ${result.isExact ? "EXACT" : "approximate"})`);
      artifact.metadata = { ...artifact.metadata, status: "regenerated" };
      return {
        artifactId: artifact.id,
        mode: result.modeUsed,
        code: result.code,
        confidence: result.confidence,
        integrity: result.integrity,
        isExact: result.isExact,
        missing: result.missing,
        chunkCount: result.chunkCount,
        reconstructedLength: result.reconstructedLength,
        originalLength: result.originalLength,
        gnnNodes: artifactNodes.map((n) => n.id)
      };
    }
    // ---------- source chunk system (explicit index; overlap-stitched reconstruction) ----------
    createSourceChunks(content, artifactId) {
      const chunkSize = 2e3;
      const overlap = 200;
      for (let i = 0, index = 0; i < content.length; i += chunkSize - overlap, index++) {
        const payload = { index, chunk: content.slice(i, Math.min(i + chunkSize, content.length)), start: i, end: Math.min(i + chunkSize, content.length) };
        this.createNode("source_chunk", JSON.stringify(payload), artifactId);
      }
    }
    reconstructFromChunks(artifactId) {
      const chunks = this.findArtifactNodes(artifactId).filter((n) => n.nodeType === "source_chunk").map((n) => {
        try {
          return JSON.parse(n.content);
        } catch {
          return null;
        }
      }).filter((p) => p !== null).sort((a, b) => a.index - b.index);
      if (chunks.length === 0) return "";
      let result = chunks[0].chunk;
      for (let i = 1; i < chunks.length; i++) {
        const prev = chunks[i - 1].chunk;
        const curr = chunks[i].chunk;
        let overlapLen = 0;
        const maxOverlap = Math.min(prev.length, curr.length, 500);
        for (let j = maxOverlap; j > 0; j--) {
          if (prev.slice(-j) === curr.slice(0, j)) {
            overlapLen = j;
            break;
          }
        }
        result += curr.slice(overlapLen);
      }
      return result;
    }
    generateFromBlueprint(artifactId, understanding) {
      const blueprintNode = this.findArtifactNodes(artifactId).find((n) => n.nodeType === "file_blueprint");
      if (!blueprintNode) return `// Blueprint not found for ${artifactId}`;
      try {
        const { blueprint } = JSON.parse(blueprintNode.content);
        const lines = [
          "// Reconstructed from blueprint",
          `// Role: ${blueprint.fileRole}`,
          `// Functions: ${blueprint.functions.length}`,
          `// Classes: ${blueprint.classes.length}`,
          "",
          ...blueprint.imports,
          "",
          ...blueprint.exports,
          "",
          `// Original functionality: ${understanding.functionality.join(", ")}`,
          `// Patterns: ${understanding.patterns.join(", ")}`
        ];
        return lines.join("\n");
      } catch {
        return "// Failed to parse blueprint";
      }
    }
    // ---------- semantic extraction ----------
    extractIntent(content) {
      const commentPatterns = [/\/\*\*\s*\n\s*\*\s*(.+?)\n/s, /\/\/\s*(.+?)(?:\n|$)/, /#\s*(.+?)(?:\n|$)/];
      for (const pattern of commentPatterns) {
        const match = content.match(pattern);
        if (match) return match[1].trim();
      }
      const classMatch = content.match(/class\s+(\w+)/);
      if (classMatch) return `Implements ${classMatch[1]} functionality`;
      const funcMatch = content.match(/function\s+(\w+)/);
      if (funcMatch) return `Provides ${funcMatch[1]} capability`;
      return "Unknown functionality - requires analysis";
    }
    extractFunctionality(content) {
      const functions = [];
      for (const match of content.matchAll(/export\s+(?:async\s+)?(?:function|const|class)\s+(\w+)/g)) functions.push(`Export: ${match[1]}`);
      for (const match of content.matchAll(/(?:async\s+)?(\w+)\s*\([^)]*\)\s*\{/g)) {
        if (!["if", "while", "for", "switch", "catch"].includes(match[1])) functions.push(`Method: ${match[1]}`);
      }
      const apiCount = [...content.matchAll(/(?:fetch|axios|http)\s*\(/g)].length;
      if (apiCount > 0) functions.push(`API integration (${apiCount} endpoints)`);
      if (content.includes("useState") || content.includes("useReducer")) functions.push("State management");
      if (content.includes("onClick") || content.includes("onChange") || content.includes("addEventListener")) functions.push("Event handling");
      return functions.length > 0 ? functions : ["Basic functionality"];
    }
    extractDependencies(content) {
      const deps = [];
      for (const match of content.matchAll(/from\s+['"]([^'"]+)['"]/g)) deps.push(match[1]);
      for (const match of content.matchAll(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/g)) deps.push(match[1]);
      if (content.includes("react")) deps.push("react");
      if (content.includes("framer-motion")) deps.push("framer-motion");
      if (content.includes("supabase")) deps.push("supabase");
      if (content.includes("tailwind")) deps.push("tailwind");
      if (content.includes("fetch") || content.includes("axios") || content.includes("http")) deps.push("http");
      return [...new Set(deps)];
    }
    extractPatterns(content) {
      const patterns = [];
      if (content.includes("class") && content.includes("extends")) patterns.push("Inheritance");
      if (content.includes("interface")) patterns.push("Interface segregation");
      if (content.includes("useEffect") || content.includes("useMemo")) patterns.push("React hooks");
      if (content.includes("create") || content.includes("factory")) patterns.push("Factory pattern");
      if (content.includes("observer") || content.includes("subscribe")) patterns.push("Observer pattern");
      if (content.includes("Map") || content.includes("Set")) patterns.push("Collection management");
      if (content.includes("async") || content.includes("await")) patterns.push("Async/await");
      if (content.includes("try") && content.includes("catch")) patterns.push("Error handling");
      if (content.includes("reduce") || content.includes("map")) patterns.push("Functional programming");
      return patterns.length > 0 ? patterns : ["Procedural"];
    }
    extractKeyInsights(content, functionality) {
      const insights = [];
      if (content.includes("graph") || content.includes("node") || content.includes("edge")) insights.push("Graph-based architecture suitable for network problems");
      if (content.includes("neural") || content.includes("tensor") || content.includes("layer")) insights.push("Neural network components - can be extended with ML capabilities");
      if (content.includes("stream") || content.includes("pipe")) insights.push("Streaming architecture - good for real-time data processing");
      if (content.includes("cache") || content.includes("memo")) insights.push("Caching strategy detected - performance optimization available");
      if (functionality.some((f) => f.includes("API"))) insights.push("API integration pattern - reusable for other service connections");
      if (functionality.some((f) => f.includes("State"))) insights.push("State management pattern - applicable to other UI components");
      return insights.length > 0 ? insights : ["General utility functionality"];
    }
    extractReusableComponents(content) {
      const components = [];
      for (const match of content.matchAll(/(?:export\s+)?(?:function|const)\s+(\w+(?:Util|Helper|Tool))/g)) components.push(`Utility: ${match[1]}`);
      if (content.includes("config") || content.includes("options") || content.includes("settings")) components.push("Configuration pattern");
      if (content.includes("validate") || content.includes("schema") || content.includes("check")) components.push("Validation logic");
      if (content.includes("transform") || content.includes("parse") || content.includes("format")) components.push("Data transformation utilities");
      return components.length > 0 ? components : ["Core functionality"];
    }
    calculateComplexity(content) {
      let score = 50;
      score += Math.min(content.split("\n").length / 10, 20);
      let maxDepth = 0;
      let currentDepth = 0;
      for (const char of content) {
        if (char === "{") {
          currentDepth++;
          maxDepth = Math.max(maxDepth, currentDepth);
        } else if (char === "}") currentDepth--;
      }
      score += maxDepth * 5;
      score += (content.match(/function/g) || []).length * 2;
      if (content.includes("async")) score += 10;
      if (content.includes("Promise")) score += 5;
      return Math.min(100, Math.round(score));
    }
    // ---------- node graph ----------
    createNode(nodeType, content, sourceArtifact) {
      this.nodeCounter++;
      const node = {
        id: `${nodeType}_${this.nodeCounter}`,
        nodeType,
        content,
        sourceArtifact,
        weight: 0.5,
        usageCount: 0,
        connections: [],
        createdSeq: this.nodeCounter
      };
      this.nodes.set(node.id, node);
      return node;
    }
    findArtifactNodes(artifactId) {
      return [...this.nodes.values()].filter((n) => n.sourceArtifact === artifactId);
    }
    strengthenConnections(artifactId) {
      const artifactNodes = this.findArtifactNodes(artifactId);
      for (let i = 0; i < artifactNodes.length; i++) {
        for (let j = i + 1; j < artifactNodes.length; j++) {
          if (!artifactNodes[i].connections.includes(artifactNodes[j].id)) artifactNodes[i].connections.push(artifactNodes[j].id);
          if (!artifactNodes[j].connections.includes(artifactNodes[i].id)) artifactNodes[j].connections.push(artifactNodes[i].id);
        }
      }
    }
    addOperation(type, artifactId, message) {
      this.operations.push({ id: `op_${++this.opCounter}`, type, artifactId, status: "pending", message });
    }
    completeOperation(type, artifactId, result) {
      const op = this.operations.filter((o) => o.type === type && o.artifactId === artifactId && o.status === "pending").pop();
      if (op) {
        op.status = "complete";
        op.result = result;
      }
    }
    snapshot() {
      return Object.freeze({
        artifacts: Object.freeze([...this.artifacts.values()].map((a) => Object.freeze({
          id: a.id,
          originalName: a.originalName,
          status: a.metadata.status,
          length: a.originalContent.length
        }))),
        nodes: this.nodes.size,
        operations: Object.freeze([...this.operations])
      });
    }
  };
  _MorphMemoryEngine_instances = new WeakSet();
  contractAndBlueprint_fn = function(blueprintNode, artifact) {
    if (blueprintNode) {
      try {
        return JSON.parse(blueprintNode.content);
      } catch {
      }
    }
    return this.analyzer.analyze(artifact);
  };
  artifact_fn = function(id) {
    const artifact = this.artifacts.get(id);
    if (!artifact) throw new MorphMirError("ARTIFACT_NOT_FOUND", String(id));
    return artifact;
  };
  var STATES8 = [
    { id: "ingest", name: "Ingest", initial: true },
    { id: "analyze", name: "Analyze" },
    { id: "remember", name: "Remember" },
    { id: "regenerate", name: "Regenerate", accepting: true }
  ];
  var DELTA_TABLE8 = {
    "ingest|ingest": { to: "analyze", transition: "ignition" },
    "analyze|analyze": { to: "remember", transition: "core" },
    "remember|remember": { to: "regenerate", transition: "fusion" },
    "regenerate|regenerate": { to: "regenerate", transition: "reactivation" },
    "ingest|snapshot": { to: "ingest", transition: "core" }
  };
  var OP_PATHS4 = {
    ingest: [["ingest", "ingest"]],
    analyze: [["analyze", "analyze"]],
    remember: [["remember", "remember"]],
    regenerate: [["regenerate", "regenerate"]],
    snapshot: [["ingest", "snapshot"]]
  };
  var normalizeInput8 = (input) => {
    if (typeof input === "string") {
      try {
        return JSON.parse(input);
      } catch {
        return { operation: input };
      }
    }
    if (input && Array.isArray(input.args) && input.args.length && !input.operation) {
      const [op, ...rest] = input.args;
      const merged = { operation: op, packet: input.packet };
      if (rest.length === 1 && typeof rest[0] === "string") {
        try {
          Object.assign(merged, JSON.parse(rest[0]));
        } catch {
          merged.value = rest[0];
        }
      }
      return merged;
    }
    return input || {};
  };
  var _MorphMirAutomaton_instances, dispatch_fn8;
  var _MorphMirAutomaton = class _MorphMirAutomaton extends Automaton {
    constructor(options = {}) {
      const memory = options.state || new MorphMemoryEngine();
      let dispatch;
      super({
        id: "morph-mir",
        address: { mode: "macro", gate: 24, line: 1, color: 1, tone: 1, base: 1, planetaryDimension: "Space" },
        states: STATES8,
        alphabet: ["ingest", "analyze", "remember", "regenerate", "snapshot"],
        delta: (state, symbol) => DELTA_TABLE8[`${state}|${symbol}`] || { to: state, transition: "flow" },
        q0: "ingest",
        finals: ["regenerate"],
        ports: _MorphMirAutomaton.descriptor.ports,
        capabilities: _MorphMirAutomaton.descriptor.capabilities,
        dimension: "Space",
        implementation: (input, context) => dispatch(input, context)
      });
      __privateAdd(this, _MorphMirAutomaton_instances);
      this.ownedState = memory;
      dispatch = (input, context) => __privateMethod(this, _MorphMirAutomaton_instances, dispatch_fn8).call(this, input, context);
    }
  };
  _MorphMirAutomaton_instances = new WeakSet();
  dispatch_fn8 = function(rawInput, context = {}) {
    const input = normalizeInput8(rawInput);
    const op = input.operation;
    const path = OP_PATHS4[op];
    if (!path) throw new MorphMirError("UNKNOWN_OPERATION", String(op));
    for (const [from, symbol] of path) this.step(from, symbol, { tool: this.id });
    const engine2 = this.ownedState;
    switch (op) {
      case "ingest": {
        const artifact = engine2.ingest(input);
        return { artifactId: artifact.id, name: artifact.originalName, length: artifact.originalContent.length };
      }
      case "analyze":
        return engine2.analyze(input.artifactId);
      case "remember":
        return engine2.remember(input.artifactId);
      case "regenerate":
        return engine2.regenerate(input.artifactId, { mode: input.mode || "morph_runtime" });
      case "snapshot":
        return engine2.snapshot();
      default:
        throw new MorphMirError("UNKNOWN_OPERATION", String(op));
    }
  };
  __publicField(_MorphMirAutomaton, "descriptor", {
    id: "morph-mir",
    aliases: ["morph", "mir", "morph-memory"],
    gate: 24,
    channels: [],
    capabilities: ["ingest", "analyze", "remember", "regenerate"],
    ports: {
      in: [{ id: "artifact", type: "artifact", schemaVersion: "1" }],
      out: [{ id: "regeneration", type: "artifact", schemaVersion: "1" }]
    },
    automatonForm: "memory-graph automaton",
    dimension: "Space",
    description: "Morph MIR memory-graph: ingests artifacts into a GNN-style node map (blueprint, chunks, functionality, patterns, insights), remembers by strengthening connections (+0.2 cap 1.0), and regenerates in exact (byte-honest integrity), equivalent, or morph_runtime mode \u2014 the latter reporting integrity 0 by design with an explicit missing list."
  });
  var MorphMirAutomaton = _MorphMirAutomaton;
  var tool_16_morph_mir_default = MorphMirAutomaton;

  // src/automata/registry.js
  function pickClass(moduleNamespace, id) {
    for (const value of Object.values(moduleNamespace)) {
      const d = typeof value === "function" ? value.registry || value.descriptor : null;
      if (d && d.id === id) return value;
    }
    throw new Error(`tool module for '${id}' does not export a class with static registry/descriptor id='${id}'`);
  }
  var TOOL_CLASSES = [
    ["autoling-lite", tool_01_autoling_lite_exports],
    ["diseminer-lite", tool_02_diseminer_lite_exports],
    ["klein-analogy", tool_03_klein_analogy_exports],
    ["iching-grammar", tool_04_iching_grammar_exports],
    ["language-contact", tool_05_language_contact_exports],
    ["historical-monte-carlo", tool_06_historical_monte_carlo_exports],
    ["autonovel", tool_07_autonovel_exports],
    ["messy", tool_08_messy_exports],
    ["success", tool_09_success_exports],
    ["conversation", tool_10_conversation_exports],
    ["browser-form", tool_11_browser_form_exports],
    ["research-browser", tool_12_research_browser_exports],
    ["computational-grammar-coder", tool_13_computational_grammar_coder_exports],
    ["autoling", tool_14_autoling_exports],
    ["diseminer", tool_15_diseminer_exports],
    ["morph-mir", tool_16_morph_mir_exports]
  ].map(([id, ns]) => pickClass(ns, id));
  var TOOL_REGISTRY = Object.freeze(TOOL_CLASSES.map((cls) => {
    const d = cls.registry || cls.descriptor;
    return Object.freeze({
      id: d.id,
      aliases: Object.freeze([...d.aliases || []]),
      className: cls.name,
      gate: d.gate,
      channels: Object.freeze([...d.channels || []]),
      capabilities: Object.freeze([...d.capabilities || []]),
      ports: d.ports,
      automatonForm: d.automatonForm,
      dimension: d.dimension,
      description: d.description
    });
  }));
  function createAllTools() {
    return TOOL_CLASSES.map((cls) => new cls());
  }

  // src/grammar/tokens.js
  var TokenizeError = class extends Error {
    constructor(message, position = null) {
      super(message);
      this.name = "TokenizeError";
      this.position = position;
    }
  };
  var WORD_START = /[A-Za-z_]/;
  var WORD_CHAR = /[A-Za-z0-9_-]/;
  var DIGIT = /[0-9]/;
  var PUNCT = /* @__PURE__ */ new Set([".", ",", "(", ")"]);
  var WHITESPACE = /* @__PURE__ */ new Set([" ", "	", "\r", "\n"]);
  var NUMERIC_RUN = /^-?\d+(\.\d+)?$/;
  function tokenize3(input) {
    const src = String(input);
    const tokens = [];
    let i = 0;
    let line = 1;
    let column = 1;
    const position = () => ({ offset: i, line, column });
    const advance = (n = 1) => {
      for (let k = 0; k < n; k++) {
        if (src[i] === "\n") {
          line++;
          column = 1;
        } else {
          column++;
        }
        i++;
      }
    };
    const readQuoted = (startPos) => {
      const quote = src[i];
      advance();
      let value = "";
      while (i < src.length && src[i] !== quote) {
        if (src[i] === "\\") {
          const next = src[i + 1];
          if (next === "n") value += "\n";
          else if (next === "t") value += "	";
          else if (next === "r") value += "\r";
          else if (next === quote) value += quote;
          else if (next === "\\") value += "\\";
          else if (next === void 0) break;
          else value += next;
          advance(2);
        } else {
          value += src[i];
          advance();
        }
      }
      if (i >= src.length) {
        throw new TokenizeError(
          `Unterminated string starting at line ${startPos.line}, column ${startPos.column}`,
          startPos
        );
      }
      advance();
      return value;
    };
    while (i < src.length) {
      const ch = src[i];
      if (WHITESPACE.has(ch)) {
        advance();
        continue;
      }
      if (ch === "'" || ch === '"') {
        const pos = position();
        const value = readQuoted(pos);
        tokens.push({ type: "string", value, raw: src.slice(pos.offset, i), position: pos });
        continue;
      }
      if (ch === "-" && src[i + 1] === "-") {
        const pos = position();
        advance(2);
        let name = "";
        while (i < src.length && WORD_CHAR.test(src[i])) {
          name += src[i];
          advance();
        }
        if (!name) {
          throw new TokenizeError(
            `Expected flag name after "--" at line ${pos.line}, column ${pos.column}`,
            pos
          );
        }
        let value = true;
        if (src[i] === "=") {
          advance();
          if (src[i] === "'" || src[i] === '"') {
            value = readQuoted(pos);
          } else {
            let rawValue = "";
            while (i < src.length && !WHITESPACE.has(src[i])) {
              rawValue += src[i];
              advance();
            }
            if (rawValue === "") {
              throw new TokenizeError(
                `Expected value after "--${name}=" at line ${pos.line}, column ${pos.column}`,
                pos
              );
            }
            value = NUMERIC_RUN.test(rawValue) ? Number(rawValue) : rawValue;
          }
        }
        tokens.push({
          type: "flag",
          value: { name, value },
          raw: src.slice(pos.offset, i),
          position: pos
        });
        continue;
      }
      if (DIGIT.test(ch) || ch === "-" && DIGIT.test(src[i + 1] || "")) {
        const pos = position();
        let raw = "";
        if (src[i] === "-") {
          raw += "-";
          advance();
        }
        while (i < src.length && DIGIT.test(src[i])) {
          raw += src[i];
          advance();
        }
        if (src[i] === "." && DIGIT.test(src[i + 1] || "")) {
          raw += ".";
          advance();
          while (i < src.length && DIGIT.test(src[i])) {
            raw += src[i];
            advance();
          }
        }
        tokens.push({ type: "number", value: Number(raw), raw, position: pos });
        continue;
      }
      if (WORD_START.test(ch)) {
        const pos = position();
        let raw = "";
        while (i < src.length && WORD_CHAR.test(src[i])) {
          raw += src[i];
          advance();
        }
        tokens.push({ type: "word", value: raw, raw, position: pos });
        continue;
      }
      if (PUNCT.has(ch)) {
        tokens.push({ type: "punct", value: ch, raw: ch, position: position() });
        advance();
        continue;
      }
      throw new TokenizeError(
        `Unexpected character ${JSON.stringify(ch)} at line ${line}, column ${column}`,
        position()
      );
    }
    return tokens;
  }

  // src/grammar/parser.js
  var CHAIN_KEYWORD = KEYWORDS.chain && KEYWORDS.chain[0] || "then";
  var ADDRESS_MARKER = KEYWORDS.addressMarker && KEYWORDS.addressMarker[0] || "at";
  var ADDRESS_FIELDS = [
    ["gate", 1, 64],
    ["line", 1, 6],
    ["color", 1, 6],
    ["tone", 1, 6],
    ["base", 1, 5]
  ];
  var ParseError = class extends Error {
    constructor(message, { position = null, expected = null } = {}) {
      super(message);
      this.name = "ParseError";
      this.position = position;
      this.expected = expected;
    }
  };
  function resolveToolId(word) {
    const key = String(word).toLowerCase();
    if (TOOL_IDS.includes(key)) return key;
    if (Object.prototype.hasOwnProperty.call(TOOL_ALIASES, key)) return TOOL_ALIASES[key];
    return null;
  }
  function unknownToolError(word, position) {
    return new ParseError(
      `Unknown tool "${word}". Known tools (16): ${TOOL_IDS.join(", ")}`,
      { position, expected: TOOL_IDS.slice() }
    );
  }
  function parseChain(input) {
    const src = String(input);
    const tokens = tokenize3(src);
    let pos = 0;
    const peek = () => tokens[pos] || null;
    const atEnd = () => pos >= tokens.length;
    const isKeywordWord = (tok, keyword) => tok !== null && tok.type === "word" && tok.value.toLowerCase() === keyword;
    const isDot = (tok) => tok !== null && tok.type === "punct" && tok.value === ".";
    const fail = (message, tok, expected) => {
      throw new ParseError(message, {
        position: tok ? tok.position : null,
        expected: expected || null
      });
    };
    const parseAddress = () => {
      const atTok = tokens[pos++];
      const parts = [];
      let lastTok = atTok;
      const readComponent = () => {
        const tok = peek();
        if (!tok || tok.type !== "number") {
          fail(
            `Expected a number after '${atTok.raw}' in address`,
            tok,
            ["NUMBER"]
          );
        }
        pos++;
        lastTok = tok;
        for (const piece of String(tok.raw).split(".")) parts.push(Number(piece));
      };
      readComponent();
      while (isDot(peek())) {
        pos++;
        readComponent();
      }
      if (parts.length > ADDRESS_FIELDS.length) {
        fail(
          `Address has ${parts.length} components; maximum is ${ADDRESS_FIELDS.length} (gate.line.color.tone.base)`,
          lastTok,
          ["at gate[.line[.color[.tone[.base]]]]"]
        );
      }
      const address = {};
      for (let k = 0; k < parts.length; k++) {
        const [field, min, max] = ADDRESS_FIELDS[k];
        const n = parts[k];
        if (!Number.isInteger(n) || n < min || n > max) {
          fail(
            `Address component ${field}=${n} out of range ${min}..${max}`,
            lastTok,
            [`${field} ${min}..${max}`]
          );
        }
        address[field] = n;
      }
      return { address, node: { node: "address", ...address } };
    };
    const parseCall = () => {
      const toolTok = peek();
      if (!toolTok) {
        fail(`Unexpected end of input after '${CHAIN_KEYWORD}': expected a tool call`, null, TOOL_IDS.slice());
      }
      if (toolTok.type !== "word") {
        fail(
          `Expected a tool name to start a call, got ${toolTok.type} ${JSON.stringify(toolTok.raw)}`,
          toolTok,
          TOOL_IDS.slice()
        );
      }
      const tool = resolveToolId(toolTok.value);
      if (!tool) throw unknownToolError(toolTok.value, toolTok.position);
      pos++;
      const startOffset = toolTok.position.offset;
      let endOffset = toolTok.position.offset + toolTok.raw.length;
      const args = [];
      const flags = {};
      let address = null;
      const children = [{ node: "tool", value: toolTok.value, resolved: tool }];
      const argNodes = [];
      const flagNodes = [];
      let addressNode = null;
      const bumpEnd = () => {
        if (pos > 0) {
          const prev = tokens[pos - 1];
          endOffset = prev.position.offset + prev.raw.length;
        }
      };
      while (!atEnd()) {
        const tok = peek();
        if (isKeywordWord(tok, CHAIN_KEYWORD)) break;
        if (tok.type === "string") {
          args.push(tok.value);
          argNodes.push({ node: "string", value: tok.value });
          pos++;
          bumpEnd();
          continue;
        }
        if (tok.type === "number") {
          args.push(tok.value);
          argNodes.push({ node: "number", value: tok.value });
          pos++;
          bumpEnd();
          continue;
        }
        if (tok.type === "flag") {
          flags[tok.value.name] = tok.value.value;
          flagNodes.push({ node: "flag", name: tok.value.name, value: tok.value.value });
          pos++;
          bumpEnd();
          continue;
        }
        if (tok.type === "word") {
          if (isKeywordWord(tok, ADDRESS_MARKER)) {
            if (address !== null) {
              fail(`Duplicate address in call to '${tool}'; only one '${ADDRESS_MARKER}' address per call`, tok, null);
            }
            const parsed = parseAddress();
            address = parsed.address;
            addressNode = parsed.node;
            bumpEnd();
            continue;
          }
          const group = [];
          while (!atEnd() && peek().type === "word" && !isKeywordWord(peek(), CHAIN_KEYWORD) && !isKeywordWord(peek(), ADDRESS_MARKER)) {
            group.push(peek().value);
            pos++;
          }
          const joined = group.join(" ");
          args.push(joined);
          argNodes.push({ node: "words", value: joined, words: group });
          bumpEnd();
          continue;
        }
        if (tok.type === "punct" && (tok.value === "," || tok.value === "(" || tok.value === ")")) {
          pos++;
          bumpEnd();
          continue;
        }
        fail(`Unexpected ${tok.type} ${JSON.stringify(tok.raw)} in call to '${tool}'`, tok, [
          "STRING",
          "WORD",
          "NUMBER",
          "FLAG",
          `'${ADDRESS_MARKER}' address`,
          `'${CHAIN_KEYWORD}'`
        ]);
      }
      children.push({ node: "args", children: argNodes });
      if (flagNodes.length) children.push({ node: "flags", children: flagNodes });
      if (addressNode) children.push(addressNode);
      return {
        tool,
        args,
        address,
        flags,
        raw: src.slice(startOffset, endOffset),
        ast: { node: "call", tool, children }
      };
    };
    if (atEnd()) {
      throw new ParseError("Empty input: expected at least one tool call", {
        position: null,
        expected: TOOL_IDS.slice()
      });
    }
    const calls = [parseCall()];
    while (isKeywordWord(peek(), CHAIN_KEYWORD)) {
      pos++;
      calls.push(parseCall());
    }
    if (!atEnd()) {
      const tok = peek();
      fail(`Unexpected trailing ${tok.type} ${JSON.stringify(tok.raw)}`, tok, [
        `'${CHAIN_KEYWORD}'`,
        "end of input"
      ]);
    }
    return { calls, chainLength: calls.length };
  }

  // src/engine/ledger.js
  var FIELDS = [
    "primitivesActivated",
    "statesGenerated",
    "edgesTraversed",
    "operationsExecuted",
    "recursionDepth",
    "activeAutomata",
    "transitionCount"
  ];
  var MAX_FIELDS = /* @__PURE__ */ new Set(["recursionDepth", "activeAutomata"]);
  var ComplexityLedger = class _ComplexityLedger {
    constructor() {
      this.primitivesActivated = 0;
      this.statesGenerated = 0;
      this.edgesTraversed = 0;
      this.operationsExecuted = 0;
      this.recursionDepth = 0;
      this.activeAutomata = 0;
      this.transitionCount = 0;
    }
    /**
     * Record a delta. Accepts a partial object with any of the 7 fields;
     * unknown fields are ignored. Returns this (chainable).
     */
    record(delta = {}) {
      for (const field of FIELDS) {
        const value = delta[field];
        if (typeof value !== "number" || !Number.isFinite(value)) continue;
        if (MAX_FIELDS.has(field)) {
          if (value > this[field]) this[field] = value;
        } else {
          this[field] += value;
        }
      }
      return this;
    }
    /** Plain-object copy of the 7-tuple. */
    snapshot() {
      return {
        primitivesActivated: this.primitivesActivated,
        statesGenerated: this.statesGenerated,
        edgesTraversed: this.edgesTraversed,
        operationsExecuted: this.operationsExecuted,
        recursionDepth: this.recursionDepth,
        activeAutomata: this.activeAutomata,
        transitionCount: this.transitionCount
      };
    }
    /**
     * Merge another ledger (or a plain ledger-shaped object, e.g. an
     * Automaton.run() result ledger) into this one. Returns this (chainable).
     */
    merge(other) {
      if (!other) return this;
      const source = other instanceof _ComplexityLedger ? other.snapshot() : other;
      return this.record(source);
    }
    toJSON() {
      return this.snapshot();
    }
  };

  // src/engine/derivation.js
  function stableStringify(value) {
    const seen = /* @__PURE__ */ new Set();
    const encode = (v) => {
      if (v === null) return "null";
      const t = typeof v;
      if (t === "string") return JSON.stringify(v);
      if (t === "boolean") return v ? "true" : "false";
      if (t === "number") return Number.isFinite(v) ? JSON.stringify(v) : "null";
      if (t === "undefined" || t === "function" || t === "symbol" || t === "bigint") {
        return void 0;
      }
      if (Array.isArray(v)) {
        if (seen.has(v)) throw new TypeError("stableStringify: circular reference");
        seen.add(v);
        const out = "[" + v.map((item) => {
          const s = encode(item);
          return s === void 0 ? "null" : s;
        }).join(",") + "]";
        seen.delete(v);
        return out;
      }
      if (t === "object") {
        if (seen.has(v)) throw new TypeError("stableStringify: circular reference");
        seen.add(v);
        const keys = Object.keys(v).sort();
        const parts = [];
        for (const key of keys) {
          const s = encode(v[key]);
          if (s !== void 0) parts.push(JSON.stringify(key) + ":" + s);
        }
        seen.delete(v);
        return "{" + parts.join(",") + "}";
      }
      return void 0;
    };
    const result = encode(value);
    return result === void 0 ? "null" : result;
  }
  function fnv1a322(str) {
    const bytes = new TextEncoder().encode(String(str));
    let hash = 2166136261;
    for (let k = 0; k < bytes.length; k++) {
      hash ^= bytes[k];
      hash = Math.imul(hash, 16777619) >>> 0;
    }
    return hash.toString(16).padStart(8, "0");
  }
  function hashObject(x) {
    return fnv1a322(stableStringify(x));
  }
  var HASH_EXCLUDED = /* @__PURE__ */ new Set(["timestamp"]);
  var Derivation = class {
    constructor({
      id = null,
      input = null,
      parse = null,
      primitives = [],
      operators = [],
      relations = [],
      context = {},
      transforms = [],
      output = null,
      evaluation = {},
      ledger = null,
      engineVersion = "1.0.0",
      grammarVersion = "automata.1.0",
      ...extra
    } = {}) {
      this.id = id;
      this.input = input;
      this.parse = parse;
      this.primitives = primitives;
      this.operators = operators;
      this.relations = relations;
      this.context = context;
      this.transforms = transforms;
      this.output = output;
      this.evaluation = evaluation;
      this.ledger = ledger;
      this.engineVersion = engineVersion;
      this.grammarVersion = grammarVersion;
      Object.assign(this, extra);
    }
    /** Lazy deterministic hash over all enumerable fields except `timestamp`. */
    get hash() {
      if (this._hashCache === void 0) {
        const payload = {};
        for (const key of Object.keys(this)) {
          if (!HASH_EXCLUDED.has(key)) payload[key] = this[key];
        }
        Object.defineProperty(this, "_hashCache", {
          value: hashObject(payload),
          enumerable: false,
          writable: true,
          configurable: true
        });
      }
      return this._hashCache;
    }
    toJSON() {
      return { ...this, hash: this.hash };
    }
  };

  // src/state-space/letters.js
  var VOWELS = /* @__PURE__ */ new Set(["a", "e", "i", "o", "u"]);
  var LETTER_PHONEMES = {
    a: ["p.ei", "p.ae", "p.ah", "p.schwa"],
    b: ["p.b"],
    c: ["p.k", "p.s"],
    d: ["p.d"],
    e: ["p.i", "p.eh", "p.schwa"],
    f: ["p.f"],
    g: ["p.g", "p.dzh"],
    h: ["p.h"],
    i: ["p.ai", "p.ih", "p.i"],
    j: ["p.dzh"],
    k: ["p.k"],
    l: ["p.l"],
    m: ["p.m"],
    n: ["p.n"],
    o: ["p.ou", "p.ah", "p.aw"],
    p: ["p.p"],
    q: ["p.k", "p.w"],
    r: ["p.r"],
    s: ["p.s", "p.z"],
    t: ["p.t"],
    u: ["p.u", "p.uh", "p.ooh"],
    v: ["p.v"],
    w: ["p.w"],
    x: ["p.k", "p.s"],
    y: ["p.j", "p.i", "p.ai"],
    z: ["p.z"]
  };
  function candidateAddressFor(index) {
    const partial = {
      gate: index % 64 + 1,
      line: index % 6 + 1,
      color: (index + 1) % 6 + 1,
      tone: (index + 2) % 6 + 1,
      base: index % 5 + 1
    };
    const full = addressForArcSec(arcSecForAddress(partial));
    full.planetaryDimension = DIMENSIONS[index % 5];
    return full;
  }
  var LETTERS = Object.freeze(
    "abcdefghijklmnopqrstuvwxyz".split("").map((char, index) => {
      const candidateAddress = candidateAddressFor(index);
      return Object.freeze({
        char,
        index,
        kind: VOWELS.has(char) ? "vowel" : "consonant",
        // vowels = open states, consonants = gated states
        phonemes: LETTER_PHONEMES[char],
        candidateAddress,
        sound: soundFor(candidateAddress),
        color: colorFor(candidateAddress)
      });
    })
  );
  var BY_CHAR = new Map(LETTERS.map((l) => [l.char, l]));
  function letterState(char) {
    return BY_CHAR.get(String(char).toLowerCase()) || null;
  }

  // src/merged/centers-channels.js
  var CANONICAL_CHANNELS = Object.freeze([
    [1, 8],
    [2, 14],
    [3, 60],
    [4, 63],
    [5, 15],
    [6, 59],
    [7, 31],
    [9, 52],
    [10, 20],
    [10, 34],
    [10, 57],
    [11, 56],
    [12, 22],
    [13, 33],
    [16, 48],
    [17, 62],
    [18, 58],
    [19, 49],
    [20, 34],
    [20, 57],
    [21, 45],
    [23, 43],
    [24, 61],
    [25, 51],
    [26, 44],
    [27, 50],
    [28, 38],
    [29, 46],
    [30, 41],
    [32, 54],
    [34, 57],
    [35, 36],
    [37, 40],
    [39, 55],
    [42, 53],
    [47, 64]
  ].map((pair) => Object.freeze(pair)));
  var CENTERS = Object.freeze({
    Head: Object.freeze([64, 61, 63]),
    Ajna: Object.freeze([47, 24, 4, 11]),
    Throat: Object.freeze([62, 23, 56, 35, 12, 45, 33, 20]),
    G: Object.freeze([1, 13, 25, 46, 2, 15, 10]),
    Heart: Object.freeze([40, 26, 51, 21]),
    Solar: Object.freeze([29, 30, 36, 6, 55, 37, 22]),
    Spleen: Object.freeze([48, 16, 44, 57, 50, 32, 18, 28]),
    Sacral: Object.freeze([5, 14, 29, 34, 59]),
    Root: Object.freeze([58, 38, 54, 19, 39, 41, 53])
  });
  var CENTER_NAMES = Object.freeze(Object.keys(CENTERS));
  function checkGate(g) {
    if (!Number.isInteger(g) || g < 1 || g > 64) throw new RangeError("gate must be 1..64");
  }
  function channelsForGate(g) {
    checkGate(g);
    return CANONICAL_CHANNELS.filter(([a, b]) => a === g || b === g);
  }
  function centerForGate(g) {
    checkGate(g);
    for (const [name, gates] of Object.entries(CENTERS)) {
      if (gates.includes(g)) return name;
    }
    return null;
  }
  function channelPartners(g) {
    return channelsForGate(g).map(([a, b]) => a === g ? b : a);
  }
  var centers_channels_default = Object.freeze({ CANONICAL_CHANNELS, CENTERS, CENTER_NAMES, channelsForGate, centerForGate, channelPartners });

  // src/merged/dimension-router.js
  var words = (value) => String(value ?? "").toLowerCase().match(/[a-z0-9']+/g) || [];
  var DIMENSION_VOCABULARIES = Object.freeze({
    Movement: Object.freeze([
      "move",
      "go",
      "where",
      "transition",
      "change",
      "travel",
      "path",
      "shift",
      "begin",
      "start",
      "run",
      "flow",
      "journey",
      "impulse",
      "action",
      // factory seed extensions
      "energy",
      "adventure",
      "drive",
      "initiative",
      "desire",
      "hope",
      "activity",
      "vigor",
      "persistence",
      "endurance"
    ]),
    Evolution: Object.freeze([
      "what",
      "evolve",
      "grow",
      "learn",
      "adapt",
      "memory",
      "remember",
      "transform",
      "become",
      "develop",
      "pattern",
      "history",
      "gravity",
      // factory seed extensions
      "love",
      "growth",
      "potential",
      "capacity",
      "understanding",
      "gratitude",
      "acceptance",
      "substance",
      "ground",
      "earth"
    ]),
    Being: Object.freeze([
      "when",
      "be",
      "exist",
      "body",
      "survive",
      "present",
      "now",
      "witness",
      "is",
      "am",
      "matter",
      "touch",
      "alive",
      // factory seed extensions
      "joy",
      "sadness",
      "conflict",
      "justice",
      "peace",
      "worry",
      "sleep",
      "friction",
      "dispute",
      "litigation"
    ]),
    Design: Object.freeze([
      "why",
      "design",
      "structure",
      "plan",
      "build",
      "shape",
      "form",
      "architect",
      "compose",
      "arrange",
      "smell",
      "frame",
      // factory seed extensions
      "code",
      "art",
      "progress",
      "wealth",
      "possession",
      "greatness",
      "abundance",
      "power",
      "owning",
      "enterprise"
    ]),
    Space: Object.freeze([
      "who",
      "integrate",
      "space",
      "person",
      "relation",
      "field",
      "hear",
      "context",
      "meaning",
      "personality",
      "network",
      "whole",
      // factory seed extensions
      "connect",
      "observe",
      "view",
      "study",
      "contemplate",
      "perception",
      "perspective",
      "sight",
      "behold",
      "gaze"
    ])
  });
  var DimensionRouter = class {
    constructor(vocabularies = DIMENSION_VOCABULARIES) {
      this.spaces = new Map(DIMENSIONS.map((name) => {
        const meta = DIMENSION_META[name];
        const terms = vocabularies[name] || [];
        return [name, { ...meta, counts: new Map(terms.map((t) => [t, 1])) }];
      }));
    }
    /** Learn: fold additional text into a dimension's term counts. */
    ingest(dimension, text) {
      const space = this.spaces.get(dimension);
      if (!space) throw new Error(`UNKNOWN_DIMENSION: ${dimension}`);
      for (const term of words(text)) space.counts.set(term, (space.counts.get(term) || 0) + 1);
      return this;
    }
    route(text) {
      const tokens = words(text);
      const ranked = [...this.spaces].map(([dimension, s]) => ({
        dimension,
        score: tokens.reduce((n, t) => n + (s.counts.get(t) || 0), 0),
        seedGate: s.seedGate,
        interrogative: s.interrogative,
        operation: s.operation
      })).sort((a, b) => b.score - a.score || a.dimension.localeCompare(b.dimension));
      if (!ranked[0] || !ranked[0].score) {
        return Object.freeze({ status: "unresolved", reason: "NO_DIMENSION_MATCH", ranked: Object.freeze(ranked) });
      }
      const top = ranked.filter((x) => x.score === ranked[0].score);
      if (top.length > 1) {
        return Object.freeze({ status: "ambiguous", reason: "DIMENSION_TIE", candidates: Object.freeze(top) });
      }
      return Object.freeze({ status: "resolved", ...ranked[0], tokens: Object.freeze(tokens) });
    }
  };

  // src/engine/intake.js
  var CLOSED_POS = /* @__PURE__ */ new Set(["DET", "PREP", "CONJ", "PRON", "AUX"]);
  var CODE_MARKERS = /\b(import|export|function|class|const|let|var|=>|return)\b/;
  var STRUCTURAL_CHARS = /* @__PURE__ */ new Set(["{", "}", "[", "]", "(", ")", ":", ";", ",", "="]);
  var OPEN_BRACKETS = /* @__PURE__ */ new Set(["(", "[", "{"]);
  var CLOSE_BRACKETS = /* @__PURE__ */ new Set([")", "]", "}"]);
  var QUOTES = /* @__PURE__ */ new Set(["'", '"', "`"]);
  var wordsOf = (value) => String(value ?? "").toLowerCase().match(/[a-z0-9']+/g) || [];
  var clamp01 = (v) => Math.min(1, Math.max(0, v));
  function normalizeInput9(X) {
    if (typeof X === "string") return X.trim().replace(/\s+/g, " ");
    if (typeof X === "number" || typeof X === "boolean" || X == null) return String(X);
    try {
      return stableStringify(X);
    } catch {
      return String(X);
    }
  }
  function structuralSniff(source) {
    const src = String(source);
    return {
      imports: [...src.matchAll(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]),
      exports: [...src.matchAll(/export\s+(?:default\s+)?(?:function|class|const|let|var|interface|type)\s+([A-Za-z_$][\w$]*)/g)].map((m) => m[1]),
      functions: [...src.matchAll(/(?:function\s+([A-Za-z_$][\w$]*)|(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>)/g)].map((m) => m[1] || m[2]),
      keywords: ["import", "export", "function", "class", "return", "async", "await", "if", "for", "while"].filter((kw) => new RegExp(`\\b${kw}\\b`).test(src))
    };
  }
  var _IntakeGate_instances, decompose_fn, regime_fn, neighborhood_fn, see_fn, taste_fn, touch_fn, smell_fn, hear_fn, analyze_fn;
  var IntakeGate = class {
    constructor({ engine: engine2 } = {}) {
      __privateAdd(this, _IntakeGate_instances);
      this.engine = engine2 || null;
      this.router = new DimensionRouter();
      this.ledger = new ComplexityLedger();
      this.history = [];
      this.derivations = [];
      this.tokenMemory = /* @__PURE__ */ new Set();
      this.counter = 0;
    }
    /**
     * The address-first gate. intake(X) -> AddressedInput:
     * {id, input:X, P, address, sound, color, neighborhood, regime,
     *  senses:{see,taste,touch,smell,hear},
     *  analysis:{purpose,behavior,relationships,concepts},
     *  derivationId, ledgerDelta, addressBasis:'hash-candidate'}
     */
    intake(X, context = {}) {
      const n = ++this.counter;
      const id = `intake-${n}`;
      const normalized = normalizeInput9(X);
      const decomposition = __privateMethod(this, _IntakeGate_instances, decompose_fn).call(this, X, normalized);
      const tokens = decomposition.wordTokens;
      const regime = __privateMethod(this, _IntakeGate_instances, regime_fn).call(this, decomposition, normalized);
      const hash = fnv1a322(stableStringify(normalized));
      const arcSec = parseInt(hash, 16) % WHEEL_ARCSECONDS;
      const address = addressForArcSec(arcSec);
      address.planetaryDimension = regime.dimension;
      const sound = soundFor(address);
      const color = colorFor(address);
      const neighborhood = __privateMethod(this, _IntakeGate_instances, neighborhood_fn).call(this, address);
      const senses = {
        see: __privateMethod(this, _IntakeGate_instances, see_fn).call(this, hash, tokens),
        taste: __privateMethod(this, _IntakeGate_instances, taste_fn).call(this, tokens),
        touch: __privateMethod(this, _IntakeGate_instances, touch_fn).call(this, normalized, tokens),
        smell: null,
        // needs color/sound: filled just below
        hear: __privateMethod(this, _IntakeGate_instances, hear_fn).call(this, address, neighborhood)
      };
      senses.smell = __privateMethod(this, _IntakeGate_instances, smell_fn).call(this, normalized, tokens, address, color, senses.touch);
      const analysis = __privateMethod(this, _IntakeGate_instances, analyze_fn).call(this, tokens, regime);
      const ledgerDelta = {
        primitivesActivated: tokens.length + decomposition.letters.length,
        statesGenerated: 1,
        // the addressed candidate state
        edgesTraversed: neighborhood.meshNeighbors.length,
        operationsExecuted: 5,
        // the five senses
        recursionDepth: 0,
        activeAutomata: 0,
        // no tool has run yet — intake precedes execution
        transitionCount: 0
      };
      this.ledger.record(ledgerDelta);
      const derivation = new Derivation({
        id,
        input: normalized,
        parse: {
          kind: decomposition.kind,
          tokens: decomposition.wordTokens.slice(0, 16),
          structure: decomposition.structure || null
        },
        primitives: decomposition.wordTokens.slice(0, 16),
        operators: ["o_bundle"],
        relations: analysis.relationships,
        context: { intake: true, basis: "hash-candidate" },
        transforms: [],
        output: { addressKey: addrKey(address), gate: address.gate, regime: regime.dimension },
        evaluation: { addressBasis: "hash-candidate", hypothesis: "H3" },
        ledger: ledgerDelta
      });
      this.derivations.push(derivation);
      const addressed = {
        id,
        input: X,
        P: {
          kind: decomposition.kind,
          tokens: decomposition.tokens,
          letters: decomposition.letters,
          features: decomposition.features,
          structure: decomposition.structure || null
        },
        address,
        addressBasis: "hash-candidate",
        sound,
        color,
        neighborhood,
        regime,
        senses,
        analysis,
        derivationId: derivation.id,
        ledgerDelta
      };
      this.history.push({
        id,
        kind: decomposition.kind,
        address,
        addressKey: addrKey(address),
        tokens,
        regime: regime.dimension,
        concepts: analysis.concepts
      });
      for (const token of tokens) this.tokenMemory.add(token);
      return addressed;
    }
    /** Compact, JSON-safe history export. */
    exportHistory() {
      return this.history.map((entry) => ({
        id: entry.id,
        kind: entry.kind,
        addressKey: entry.addressKey,
        gate: entry.address.gate,
        regime: entry.regime,
        concepts: [...entry.concepts]
      }));
    }
  };
  _IntakeGate_instances = new WeakSet();
  /** P_t: kind-specific decomposition. */
  decompose_fn = function(X, normalized) {
    const isString = typeof X === "string";
    const looksLikeCode = isString && CODE_MARKERS.test(X) && /[;{}()=]/.test(X);
    const kind = isString ? looksLikeCode ? "code" : "text" : X !== null && typeof X === "object" ? "data" : "opaque";
    const sourceText = isString ? X : normalized;
    let tokens = [];
    if (kind !== "opaque") {
      try {
        tokens = tokenize3(sourceText).slice(0, 64).map((t) => ({ type: t.type, value: typeof t.value === "object" ? stableStringify(t.value) : String(t.value) }));
      } catch {
        tokens = wordsOf(sourceText).slice(0, 64).map((w) => ({ type: "word", value: w }));
      }
    }
    const letters = [...normalized.toLowerCase()].filter((ch) => ch >= "a" && ch <= "z").slice(0, 32).map((ch) => {
      const state = letterState(ch);
      return { char: ch, kind: state.kind, gate: state.candidateAddress.gate };
    });
    const features = {
      vowels: letters.filter((l) => l.kind === "vowel").length,
      consonants: letters.filter((l) => l.kind === "consonant").length,
      digits: (normalized.match(/[0-9]/g) || []).length,
      spaces: (normalized.match(/\s/g) || []).length,
      punctuation: (normalized.match(/[.,;:!?'"-]/g) || []).length
    };
    const structure = kind === "code" || kind === "data" ? structuralSniff(sourceText) : null;
    return {
      kind,
      tokens,
      letters,
      features,
      structure,
      wordTokens: wordsOf(normalized).slice(0, 128)
    };
  };
  /** Φ_t: dimension regime for the input. */
  regime_fn = function(decomposition, normalized) {
    if (decomposition.kind === "code") {
      return { dimension: "Design", interrogative: "Why", operation: "structure", status: "code-default" };
    }
    if (decomposition.kind === "data") {
      return { dimension: "Evolution", interrogative: "What", operation: "transform", status: "data-default" };
    }
    if (decomposition.kind === "opaque") {
      return { dimension: "Being", interrogative: "When", operation: "instantiate", status: "opaque-default" };
    }
    const route = this.router.route(normalized);
    if (route.status === "resolved") {
      return {
        dimension: route.dimension,
        interrogative: route.interrogative,
        operation: route.operation,
        status: "resolved",
        score: route.score
      };
    }
    if (route.status === "ambiguous") {
      const first = route.candidates[0];
      return {
        dimension: first.dimension,
        interrogative: first.interrogative,
        operation: first.operation,
        status: "ambiguous-resolved-first",
        score: first.score
      };
    }
    return { dimension: "Being", interrogative: "When", operation: "instantiate", status: "fallback" };
  };
  /** N_t: mesh neighbors of related states + resonance ρ vs intake history. */
  neighborhood_fn = function(address) {
    const key = addrKey(address);
    const meshNeighbors = [];
    const mesh = this.engine && this.engine.mesh;
    if (mesh) {
      for (const projection of PROJECTIONS) {
        for (const stateId of [key, `gate-${address.gate}`, `G${address.gate}`]) {
          for (const edge of mesh.neighbors(stateId, projection)) {
            meshNeighbors.push({ projection, from: edge.from, to: edge.to, relation: edge.relation });
          }
        }
      }
    }
    const resonance = this.history.map((prior) => {
      const a = prior.address;
      const rho = ((a.gate === address.gate ? 5 : 0) + (a.line === address.line ? 3 : 0) + (a.color === address.color ? 2 : 0) + (a.tone === address.tone ? 2 : 0) + (a.base === address.base ? 1 : 0)) / 15;
      return { id: prior.id, addressKey: prior.addressKey, rho };
    }).filter((r) => r.rho > 0).sort((a, b) => b.rho - a.rho || a.id.localeCompare(b.id)).slice(0, 3);
    return { addressKey: key, meshNeighbors, resonance };
  };
  /** see(X) — Movement signature: hash-derived direction + token momentum. */
  see_fn = function(hash, tokens) {
    const h = parseInt(hash, 16);
    return {
      dimension: "Movement",
      transitionVector: {
        angle: h % 360,
        // hash-derived heading on the wheel, in degrees
        dx: (h & 65535) / 65535 * 2 - 1,
        dy: (h >>> 16 & 65535) / 65535 * 2 - 1
      },
      momentum: tokens.length / 64
      // tokenCount / normalizer(64): an L5 sentence rarely exceeds 64 words
    };
  };
  /** taste(X) — Evolution signature: what fraction has been tasted before. */
  taste_fn = function(tokens) {
    const seen = tokens.filter((t) => this.tokenMemory.has(t)).length;
    const familiarity = tokens.length ? seen / tokens.length : 0;
    return {
      dimension: "Evolution",
      familiarity,
      novelty: 1 - familiarity
    };
  };
  /** touch(X) — Being signature: texture (length/nesting/entropy) + pressure. */
  touch_fn = function(normalized, tokens) {
    let depth = 0;
    let maxDepth = 0;
    let inQuote = null;
    let maxQuoteBonus = 0;
    for (const ch of normalized) {
      if (inQuote) {
        if (ch === inQuote) inQuote = null;
        continue;
      }
      if (QUOTES.has(ch)) {
        inQuote = ch;
        maxQuoteBonus = 1;
        continue;
      }
      if (OPEN_BRACKETS.has(ch)) {
        depth += 1;
        maxDepth = Math.max(maxDepth, depth);
        continue;
      }
      if (CLOSE_BRACKETS.has(ch)) depth = Math.max(0, depth - 1);
    }
    const counts = /* @__PURE__ */ new Map();
    for (const ch of normalized) counts.set(ch, (counts.get(ch) || 0) + 1);
    let entropy = 0;
    for (const count of counts.values()) {
      const p = count / normalized.length;
      entropy -= p * Math.log2(p);
    }
    if (!normalized.length) entropy = 0;
    return {
      dimension: "Being",
      texture: {
        length: normalized.length,
        nestingDepth: maxDepth + maxQuoteBonus,
        entropy
      },
      pressure: tokens.length ? new Set(tokens).size / tokens.length : 0
      // uniqueTokens/totalTokens
    };
  };
  /**
   * smell(X) — Design signature: the 6-component scent vector. Derivations
   * (each component is deterministic from content shape):
   *   structure  = 0.5*clamp01(nestingDepth/6) + 0.5*(structural chars / length)
   *                — how much visible scaffolding the form carries;
   *   rhythm     = coefficient of variation (stdev/mean) of token lengths,
   *                clamped — regular lengths smell smooth, jagged ones sharp;
   *   density    = tokens per 6 characters, clamped — semantic packing;
   *   polarity   = yang lines of the candidate address gate / 6 — the
   *                yin<->yang charge of the form's own address;
   *   recursion  = 1 - pressure (repeated tokens = the form referencing itself);
   *   warmth     = 0.5 + 0.5*cos((hue - 30°)) — closeness of the address hue
   *                to the warm anchor (~30° ochre/red side of the wheel).
   */
  smell_fn = function(normalized, tokens, address, color, touch) {
    const structuralCount = [...normalized].filter((ch) => STRUCTURAL_CHARS.has(ch)).length;
    const lengths = tokens.map((t) => t.length);
    const mean2 = lengths.length ? lengths.reduce((s, n) => s + n, 0) / lengths.length : 0;
    const stdev = lengths.length ? Math.sqrt(lengths.reduce((s, n) => s + (n - mean2) ** 2, 0) / lengths.length) : 0;
    const yangLines = ((d) => {
      let n = 0;
      for (let i = 0; i < 6; i++) n += d >> i & 1;
      return n;
    })(
      // address.gate -> King Wen -> Fu Xi decimal via bits of (gate-1) is NOT the
      // gate pattern; the scent only needs a deterministic 6-bit charge, so use
      // the gate's own binary representation (gate-1) as the polarity pattern.
      address.gate - 1
    );
    const scent = [
      clamp01(0.5 * clamp01(touch.texture.nestingDepth / 6) + 0.5 * (normalized.length ? structuralCount / normalized.length : 0)),
      clamp01(mean2 ? stdev / mean2 : 0),
      clamp01(tokens.length / Math.max(1, normalized.length / 6)),
      yangLines / 6,
      clamp01(1 - touch.pressure),
      clamp01(0.5 + 0.5 * Math.cos((color.hue - 30) * Math.PI / 180))
    ];
    return {
      dimension: "Design",
      scent,
      components: ["structure", "rhythm", "density", "polarity", "recursion", "warmth"]
    };
  };
  /** hear(X) — Space signature: canonical channels of the gate + top-3 resonance. */
  hear_fn = function(address, neighborhood) {
    return {
      dimension: "Space",
      channels: channelsForGate(address.gate).map(([a, b]) => [a, b]),
      resonantAddresses: neighborhood.resonance.map((r) => ({
        id: r.id,
        addressKey: r.addressKey,
        rho: r.rho
      }))
    };
  };
  /** Purpose / behavior / relationships / concepts — the semantic read. */
  analyze_fn = function(tokens, regime) {
    const tagged = tokens.map((word) => ({ word, pos: posGuess(word) }));
    let purpose = null;
    const verbIndex = tagged.findIndex((t) => t.pos === "VERB");
    if (verbIndex >= 0) {
      const phrase = [tagged[verbIndex].word];
      for (let k = verbIndex + 1; k < tagged.length && phrase.length < 4; k++) {
        if (!CLOSED_POS.has(tagged[k].pos)) phrase.push(tagged[k].word);
      }
      purpose = phrase.join(" ");
    } else {
      const content = tagged.filter((t) => !CLOSED_POS.has(t.pos)).slice(0, 4).map((t) => t.word);
      purpose = content.length ? content.join(" ") : null;
    }
    const posProfile = {};
    for (const t of tagged) posProfile[t.pos] = (posProfile[t.pos] || 0) + 1;
    const tokenSet = new Set(tokens);
    const tools = [
      ...TOOL_IDS.filter((toolId) => tokenSet.has(toolId)),
      ...Object.keys(TOOL_ALIASES).filter((alias) => tokenSet.has(alias))
    ];
    const gateRefs = [];
    for (let k = 0; k < tokens.length - 1; k++) {
      if (tokens[k] === "gate" && /^\d+$/.test(tokens[k + 1])) {
        const g = Number(tokens[k + 1]);
        if (g >= 1 && g <= 64) gateRefs.push({ gate: g });
      }
    }
    const freq = /* @__PURE__ */ new Map();
    for (const t of tagged) {
      if (t.word.length > 3 && !CLOSED_POS.has(t.pos)) freq.set(t.word, (freq.get(t.word) || 0) + 1);
    }
    const concepts = [...freq.entries()].sort((a, b) => b[1] - a[1] || tokens.indexOf(a[0]) - tokens.indexOf(b[0])).slice(0, 8).map(([word]) => word);
    return {
      purpose,
      behavior: { operation: regime.operation, dimension: regime.dimension, posProfile },
      relationships: { tools, gates: gateRefs },
      concepts
    };
  };

  // src/engine/triples.js
  function tripleValueHash(value) {
    try {
      return hashObject(value);
    } catch {
      return fnv1a322(String(value));
    }
  }
  var Triple = class _Triple {
    constructor({ subject, predicate, object, provenance = null, derivationId = null, confidence = 1 } = {}) {
      if (subject === null || subject === void 0) {
        throw new TypeError("Triple requires a subject");
      }
      if (typeof predicate !== "string" || !predicate) {
        throw new TypeError("Triple requires a string predicate");
      }
      if (object === null || object === void 0) {
        throw new TypeError("Triple requires an object");
      }
      this.subject = subject;
      this.predicate = predicate;
      this.object = object;
      this.provenance = provenance;
      this.derivationId = derivationId;
      this.confidence = confidence;
      Object.freeze(this);
    }
    /** Identity key: subject + predicate + object (provenance is not identity). */
    key() {
      return stableStringify([this.subject, this.predicate, this.object]);
    }
    toJSON() {
      return {
        subject: this.subject,
        predicate: this.predicate,
        object: this.object,
        provenance: this.provenance,
        derivationId: this.derivationId,
        confidence: this.confidence
      };
    }
    static fromJSON(json) {
      const data = typeof json === "string" ? JSON.parse(json) : json;
      return new _Triple(data);
    }
  };
  var TripleStore = class {
    constructor() {
      this._byKey = /* @__PURE__ */ new Map();
    }
    add(triple) {
      const t = triple instanceof Triple ? triple : new Triple(triple);
      const key = t.key();
      if (!this._byKey.has(key)) this._byKey.set(key, t);
      return this._byKey.get(key);
    }
    addAll(triples) {
      const out = [];
      for (const t of triples || []) out.push(this.add(t));
      return out;
    }
    /** Wildcard query: null/omitted fields match everything. */
    query({ subject = null, predicate = null, object = null } = {}) {
      const out = [];
      for (const t of this._byKey.values()) {
        if (subject !== null && t.subject !== subject) continue;
        if (predicate !== null && t.predicate !== predicate) continue;
        if (object !== null && t.object !== object) continue;
        out.push(t);
      }
      return out;
    }
    bySubject(subject) {
      return this.query({ subject });
    }
    predicates() {
      return [...new Set([...this._byKey.values()].map((t) => t.predicate))];
    }
    size() {
      return this._byKey.size;
    }
    export() {
      return [...this._byKey.values()].map((t) => t.toJSON());
    }
    import(data) {
      const list = typeof data === "string" ? JSON.parse(data) : data;
      this.addAll((list || []).map((entry) => Triple.fromJSON(entry)));
      return this;
    }
  };
  function portList(ports) {
    const out = [];
    const push = (entry, direction, index) => {
      const base = typeof entry === "string" ? { id: entry } : { ...entry || {} };
      out.push({ direction: base.direction || direction, id: base.id || `${direction}-${index}` });
    };
    if (Array.isArray(ports)) {
      ports.forEach((p, i) => push(p, p && p.direction, i));
    } else if (ports && typeof ports === "object") {
      (ports.in || []).forEach((p, i) => push(p, "input", i));
      (ports.out || []).forEach((p, i) => push(p, "output", i));
    }
    return out;
  }
  function deltaTransitions(source, states) {
    const transitions = /* @__PURE__ */ new Set();
    const delta = source && source.delta;
    if (!delta) return transitions;
    const alphabet = Array.isArray(source.alphabet) ? source.alphabet : [];
    if (typeof delta === "function") {
      for (const state of states) {
        for (const symbol of alphabet) {
          try {
            const result = delta(state, symbol, {});
            if (result && typeof result.transition === "string") transitions.add(result.transition);
          } catch {
          }
        }
      }
    } else if (typeof delta === "object") {
      for (const value of Object.values(delta)) {
        if (value && typeof value.transition === "string") transitions.add(value.transition);
      }
    }
    return transitions;
  }
  function toolOntology(descriptorOrAutomaton) {
    const source = descriptorOrAutomaton || {};
    const id = source.id;
    if (typeof id !== "string" || !id) {
      throw new TypeError("toolOntology requires a descriptor or automaton with an id");
    }
    const registryEntry = TOOL_REGISTRY.find((entry) => entry.id === id) || null;
    const gate = source.gate ?? (source.address && source.address.gate) ?? (registryEntry && registryEntry.gate) ?? null;
    const dimension = source.dimension ?? (registryEntry && registryEntry.dimension) ?? null;
    const form = source.automatonForm ?? (registryEntry && registryEntry.automatonForm) ?? null;
    const capabilities = source.capabilities || registryEntry && registryEntry.capabilities || [];
    const channels = source.channels || registryEntry && registryEntry.channels || [];
    const states = (Array.isArray(source.states) ? source.states : []).map((s) => typeof s === "string" ? s : s && s.id).filter(Boolean);
    const triples = [];
    const put = (predicate, object) => {
      if (object === null || object === void 0) return;
      triples.push(new Triple({ subject: id, predicate, object, provenance: "tool-ontology" }));
    };
    put("isA", "Automaton");
    put("hasGate", gate);
    put("hasDimension", dimension);
    put("hasForm", form);
    for (const capability2 of capabilities) put("hasCapability", capability2);
    for (const channel of channels) put("hasChannel", channel);
    for (const state of states) put("hasState", state);
    for (const transition of [...deltaTransitions(source, states)].sort()) put("usesTransition", transition);
    for (const port of portList(source.ports || registryEntry && registryEntry.ports)) {
      put("hasPort", `${port.direction}:${port.id}`);
    }
    return triples;
  }
  function runTriples({ toolId, input, output, derivationId = null, trace = [] } = {}) {
    const triples = [];
    const inputHash = tripleValueHash(input);
    const outputHash = tripleValueHash(output);
    triples.push(new Triple({
      subject: inputHash,
      predicate: "processedBy",
      object: toolId,
      provenance: "run",
      derivationId
    }));
    triples.push(new Triple({
      subject: toolId,
      predicate: "produced",
      object: outputHash,
      provenance: "run",
      derivationId
    }));
    for (const step of Array.isArray(trace) ? trace : []) {
      if (!step || step.from === null || step.from === void 0) continue;
      if (step.to === null || step.to === void 0) continue;
      triples.push(new Triple({
        subject: String(step.from),
        predicate: "transition",
        object: String(step.to),
        provenance: step.transition || "run",
        derivationId
      }));
    }
    return triples;
  }

  // src/merged/kingwen.js
  var TABLE = Object.freeze([
    63,
    0,
    17,
    34,
    23,
    58,
    2,
    16,
    55,
    59,
    7,
    56,
    61,
    47,
    4,
    8,
    25,
    38,
    3,
    48,
    41,
    37,
    32,
    1,
    57,
    39,
    33,
    30,
    18,
    45,
    28,
    14,
    60,
    15,
    40,
    5,
    53,
    43,
    20,
    10,
    35,
    49,
    31,
    62,
    24,
    6,
    26,
    22,
    29,
    46,
    9,
    36,
    52,
    11,
    13,
    44,
    54,
    27,
    50,
    19,
    51,
    12,
    21,
    42
  ]);
  var KING_WEN_TO_FUXI_DECIMAL2 = Object.freeze(
    Object.fromEntries(TABLE.map((decimal, index) => [index + 1, decimal]))
  );
  var FUXI_DECIMAL_TO_KING_WEN2 = Object.freeze(
    Object.fromEntries(TABLE.map((decimal, index) => [decimal, index + 1]))
  );
  var KING_WEN_HEXAGRAM_NAMES = Object.freeze([
    "The Creative",
    "The Receptive",
    "Difficulty at the Beginning",
    "Youthful Folly",
    "Waiting (Nourishment)",
    "Conflict",
    "The Army",
    "Holding Together (Union)",
    "The Taming Power of the Small",
    "Treading (Conduct)",
    "Peace",
    "Standstill (Stagnation)",
    "Fellowship with Men",
    "Possession in Great Measure",
    "Modesty",
    "Enthusiasm",
    "Following",
    "Work on What Has Been Spoiled (Decay)",
    "Approach",
    "Contemplation (View)",
    "Biting Through",
    "Grace",
    "Splitting Apart",
    "Return (The Turning Point)",
    "Innocence (The Unexpected)",
    "The Taming Power of the Great",
    "The Corners of the Mouth (Providing Nourishment)",
    "Preponderance of the Great",
    "The Abysmal (Water)",
    "The Clinging (Fire)",
    "Influence (Wooing)",
    "Duration",
    "Retreat",
    "The Power of the Great",
    "Progress",
    "Darkening of the Light",
    "The Family (The Clan)",
    "Opposition",
    "Obstruction",
    "Deliverance",
    "Decrease",
    "Increase",
    "Break-through (Resoluteness)",
    "Coming to Meet",
    "Gathering Together (Massing)",
    "Pushing Upward",
    "Oppression (Exhaustion)",
    "The Well",
    "Revolution (Molting)",
    "The Caldron",
    "The Arousing (Shock, Thunder)",
    "Keeping Still (Mountain)",
    "Development (Gradual Progress)",
    "The Marrying Maiden",
    "Abundance (Fullness)",
    "The Wanderer",
    "The Gentle (The Penetrating, Wind)",
    "The Joyous (Lake)",
    "Dispersion (Dissolution)",
    "Limitation",
    "Inner Truth",
    "Preponderance of the Small",
    "After Completion",
    "Before Completion"
  ]);
  function gateToFuXiDecimal(gate) {
    if (!Number.isInteger(gate) || gate < 1 || gate > 64) {
      throw new RangeError("gate must be 1..64.");
    }
    return TABLE[gate - 1];
  }
  function fuXiDecimalToGate(decimal) {
    const gate = FUXI_DECIMAL_TO_KING_WEN2[decimal];
    if (!gate) {
      throw new RangeError(`No King Wen gate for Fu-Xi decimal ${decimal}.`);
    }
    return gate;
  }
  function hexagramName(gate) {
    if (!Number.isInteger(gate) || gate < 1 || gate > 64) {
      throw new RangeError("gate must be 1..64.");
    }
    return KING_WEN_HEXAGRAM_NAMES[gate - 1];
  }
  function gatePattern(gate) {
    const decimal = gateToFuXiDecimal(gate);
    return Object.freeze(Array.from({ length: 6 }, (_, i) => decimal >> i & 1));
  }
  var kingwen_default = Object.freeze({
    KING_WEN_TO_FUXI_DECIMAL: KING_WEN_TO_FUXI_DECIMAL2,
    FUXI_DECIMAL_TO_KING_WEN: FUXI_DECIMAL_TO_KING_WEN2,
    KING_WEN_HEXAGRAM_NAMES,
    gateToFuXiDecimal,
    fuXiDecimalToGate,
    hexagramName,
    gatePattern
  });

  // src/merged/artifacts.js
  function fnv1a32Bytes(bytes) {
    let hash = 2166136261;
    for (let i = 0; i < bytes.length; i++) {
      hash ^= bytes[i];
      hash = Math.imul(hash, 16777619) >>> 0;
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }
  function checkFrame(width, height, rgba) {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
      throw new RangeError("width/height must be positive integers");
    }
    if (!rgba || rgba.length !== width * height * 4) {
      throw new RangeError(`rgba must be ${width * height * 4} bytes (${width}x${height} RGBA)`);
    }
  }
  function encodeBMP(width, height, rgba) {
    checkFrame(width, height, rgba);
    const rowBytes = width * 3;
    const paddedRow = rowBytes + 3 & ~3;
    const pixelBytes = paddedRow * height;
    const fileSize = 54 + pixelBytes;
    const out = new Uint8Array(fileSize);
    const view = new DataView(out.buffer);
    out[0] = 66;
    out[1] = 77;
    view.setUint32(2, fileSize, true);
    view.setUint32(10, 54, true);
    view.setUint32(14, 40, true);
    view.setInt32(18, width, true);
    view.setInt32(22, height, true);
    view.setUint16(26, 1, true);
    view.setUint16(28, 24, true);
    view.setUint32(30, 0, true);
    view.setUint32(34, pixelBytes, true);
    view.setInt32(38, 2835, true);
    view.setInt32(42, 2835, true);
    for (let row = 0; row < height; row++) {
      const srcY = height - 1 - row;
      let o = 54 + row * paddedRow;
      for (let x = 0; x < width; x++) {
        const s = (srcY * width + x) * 4;
        out[o] = rgba[s + 2];
        out[o + 1] = rgba[s + 1];
        out[o + 2] = rgba[s];
        o += 3;
      }
    }
    return out;
  }
  var GIF_PALETTE = (() => {
    const palette = new Uint8Array(256 * 3);
    let i = 0;
    for (let r = 0; r < 6; r++) {
      for (let g = 0; g < 6; g++) {
        for (let b = 0; b < 6; b++) {
          palette[i] = r * 51;
          palette[i + 1] = g * 51;
          palette[i + 2] = b * 51;
          i += 3;
        }
      }
    }
    return palette;
  })();
  function quantizeToCube(r, g, b) {
    const ri = Math.min(5, Math.round(r / 51));
    const gi = Math.min(5, Math.round(g / 51));
    const bi = Math.min(5, Math.round(b / 51));
    return ri * 36 + gi * 6 + bi;
  }
  function lzwEncodeGIF(indices, minCodeSize = 8) {
    if (!indices || indices.length < 1) throw new RangeError("indices must be non-empty");
    const clearCode = 1 << minCodeSize;
    const eoiCode = clearCode + 1;
    const bytes = [];
    let bitBuffer = 0;
    let bitCount = 0;
    let codeSize = minCodeSize + 1;
    const emit = (code) => {
      bitBuffer |= code << bitCount;
      bitCount += codeSize;
      while (bitCount >= 8) {
        bytes.push(bitBuffer & 255);
        bitBuffer >>>= 8;
        bitCount -= 8;
      }
    };
    let dict = /* @__PURE__ */ new Map();
    let nextCode = eoiCode + 1;
    const reset = () => {
      dict = /* @__PURE__ */ new Map();
      nextCode = eoiCode + 1;
      codeSize = minCodeSize + 1;
    };
    emit(clearCode);
    let prefix = indices[0];
    for (let i = 1; i < indices.length; i++) {
      const k = indices[i];
      const key = prefix << 8 | k;
      const known = dict.get(key);
      if (known !== void 0) {
        prefix = known;
        continue;
      }
      emit(prefix);
      if (nextCode < 4096) {
        dict.set(key, nextCode);
        nextCode += 1;
        if (nextCode === (1 << codeSize) + 1 && codeSize < 12) codeSize += 1;
      } else {
        emit(clearCode);
        reset();
      }
      prefix = k;
    }
    emit(prefix);
    emit(eoiCode);
    if (bitCount > 0) bytes.push(bitBuffer & 255);
    return bytes;
  }
  function encodeGIF(width, height, frames, { loop = true } = {}) {
    if (!Array.isArray(frames) || frames.length < 1) {
      throw new RangeError("frames must be a non-empty array");
    }
    for (const frame of frames) checkFrame(width, height, frame.rgba);
    const out = [];
    const pushStr = (s) => {
      for (let i = 0; i < s.length; i++) out.push(s.charCodeAt(i));
    };
    const u16 = (v) => {
      out.push(v & 255, v >>> 8 & 255);
    };
    pushStr("GIF89a");
    u16(width);
    u16(height);
    out.push(247, 0, 0);
    for (let i = 0; i < GIF_PALETTE.length; i++) out.push(GIF_PALETTE[i]);
    if (loop) {
      out.push(33, 255, 11);
      pushStr("NETSCAPE2.0");
      out.push(3, 1, 0, 0, 0);
    }
    for (const frame of frames) {
      const delay = Math.max(0, Math.min(65535, Math.round(Number(frame.delayCs) || 0)));
      out.push(33, 249, 4, 0);
      u16(delay);
      out.push(0, 0);
      out.push(44);
      u16(0);
      u16(0);
      u16(width);
      u16(height);
      out.push(0);
      const indices = new Uint8Array(width * height);
      for (let p = 0; p < indices.length; p++) {
        const s = p * 4;
        indices[p] = quantizeToCube(frame.rgba[s], frame.rgba[s + 1], frame.rgba[s + 2]);
      }
      out.push(8);
      const compressed = lzwEncodeGIF(indices, 8);
      for (let i = 0; i < compressed.length; i += 255) {
        const block = compressed.slice(i, i + 255);
        out.push(block.length, ...block);
      }
      out.push(0);
    }
    out.push(59);
    return Uint8Array.from(out);
  }
  var textEncoder = new TextEncoder();
  var ArtifactWriter = class {
    constructor() {
      this.records = [];
      this.seq = 0;
    }
    write(kind, { fileName, bytes = null, text = null, mime = "application/octet-stream" } = {}) {
      if (!kind || typeof kind !== "string") throw new TypeError("artifact kind is required");
      if (!fileName || typeof fileName !== "string") throw new TypeError("artifact fileName is required");
      if (bytes == null && text == null) throw new TypeError("artifact requires bytes or text");
      const data = bytes != null ? bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes) : textEncoder.encode(String(text));
      const artifact = {
        id: `art-${++this.seq}`,
        kind,
        fileName,
        mime: String(mime),
        size: data.length,
        hash: fnv1a32Bytes(data),
        bytes: data
      };
      if (text != null) artifact.text = String(text);
      this.records.push(artifact);
      return { artifact };
    }
    list() {
      return this.records.map(({ id, kind, fileName, mime, size, hash }) => ({ id, kind, fileName, mime, size, hash }));
    }
    get(id) {
      return this.records.find((r) => r.id === id) || null;
    }
  };

  // src/merged/media-field.js
  var NODE_COUNT = 64;
  var STATE_BITS = 6;
  var FULL_MASK = 63;
  var DIMENSION_KEYS = ["movement", "evolution", "being", "design", "space"];
  var TICK_MS = 40;
  var clamp2 = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, Number(v) || 0));
  function fnv1aNum(text) {
    let hash = 2166136261;
    const str = String(text);
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619) >>> 0;
    }
    return hash >>> 0;
  }
  function mediaHash(value) {
    return fnv1aNum(typeof value === "string" ? value : canonical(value)).toString(16).padStart(8, "0");
  }
  function canonical(value) {
    if (value === null || typeof value !== "object") return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
    return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`).join(",")}}`;
  }
  function frameHash(rgba) {
    let hash = 2166136261;
    for (let i = 0; i < rgba.length; i++) {
      hash ^= rgba[i];
      hash = Math.imul(hash, 16777619) >>> 0;
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }
  function popcount6(value) {
    let v = value & FULL_MASK;
    let n = 0;
    while (v) {
      n += v & 1;
      v >>>= 1;
    }
    return n;
  }
  function seededUnit(seed) {
    let x = seed >>> 0;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 4294967295;
  }
  function hamming6(a, b) {
    return popcount6((a ^ b) & FULL_MASK);
  }
  function hexToRgb(hex) {
    return [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16)
    ];
  }
  var MediaLocus = class {
    constructor(gate) {
      if (!Number.isInteger(gate) || gate < 1 || gate > NODE_COUNT) {
        throw new RangeError("gate must be 1..64");
      }
      this.gate = gate;
      this.fuxi = gateToFuXiDecimal(gate);
      this.id = `mf-locus-${String(gate).padStart(2, "0")}`;
      const seed = fnv1aNum(this.id);
      this.state = {
        movement: seededUnit(seed ^ 1),
        evolution: seededUnit(seed ^ 2),
        being: seededUnit(seed ^ 4),
        design: seededUnit(seed ^ 8),
        space: seededUnit(seed ^ 16),
        energy: 0.5,
        tension: 0
      };
      this.activationHistory = [];
    }
    activation() {
      return DIMENSION_KEYS.reduce((s, k) => s + this.state[k], 0) / DIMENSION_KEYS.length;
    }
    recordActivation(value) {
      this.activationHistory.push(value);
      if (this.activationHistory.length > 64) this.activationHistory.shift();
    }
    update(next) {
      for (const key of [...DIMENSION_KEYS, "energy", "tension"]) {
        if (Number.isFinite(next[key])) this.state[key] = clamp2(next[key]);
      }
    }
  };
  var _MediaField_instances, activationVector_fn, influence_fn, capture_fn, restore_fn;
  var MediaField = class {
    constructor({ width = 64, height = 64 } = {}) {
      __privateAdd(this, _MediaField_instances);
      if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
        throw new RangeError("width/height must be positive integers");
      }
      this.width = width;
      this.height = height;
      this.loci = Array.from({ length: NODE_COUNT }, (_, i) => new MediaLocus(i + 1));
      this.weights = Array.from({ length: NODE_COUNT }, (_, from) => {
        const row = new Float64Array(NODE_COUNT);
        for (let to = 0; to < NODE_COUNT; to++) {
          if (from === to) {
            row[to] = 0.15;
            continue;
          }
          const d = hamming6(this.loci[from].fuxi, this.loci[to].fuxi);
          row[to] = d === 1 ? 0.08 : d === 2 ? 0.025 : 0;
        }
        return row;
      });
      this.learningRate = 0.025;
      this.decay = 0.999;
      this.tickCount = 0;
      this.lastMorph = null;
    }
    /**
     * Inject a Fu Xi pattern (decimal 0..63) into the field: every locus gains
     * energy proportional to its Hamming resonance with the injected pattern.
     */
    injectFuXi(fuxiValue, strength = 1) {
      if (!Number.isInteger(fuxiValue) || fuxiValue < 0 || fuxiValue > FULL_MASK) {
        throw new RangeError("Fu Xi value must be 0..63");
      }
      for (const locus of this.loci) {
        const distance = hamming6(locus.fuxi, fuxiValue);
        const resonance = Math.max(0, 1 - distance / STATE_BITS) * clamp2(strength);
        locus.state.energy = clamp2(locus.state.energy * 0.8 + resonance * 0.2);
        locus.state.tension = clamp2(
          locus.state.tension * 0.85 + Math.abs(resonance - locus.state.being) * 0.15
        );
      }
      return this;
    }
    /**
     * Advance the field one tick (SRMF dynamics, verbatim coefficients).
     * externalState: null, a Fu Xi decimal 0..63, or { fuxi } — the addressed
     * pattern feeds each locus as (1 - hamming/6).
     */
    tick(externalState = null) {
      const externalFuxi = externalState == null ? null : Number.isInteger(externalState) ? externalState : Number.isInteger(externalState.fuxi) ? externalState.fuxi : null;
      const previous = __privateMethod(this, _MediaField_instances, activationVector_fn).call(this);
      const nextActivations = new Array(NODE_COUNT);
      for (let index = 0; index < NODE_COUNT; index++) {
        const locus = this.loci[index];
        const recurrent = __privateMethod(this, _MediaField_instances, influence_fn).call(this, previous, index);
        const external = externalFuxi == null ? 0 : 1 - hamming6(locus.fuxi, externalFuxi) / STATE_BITS;
        const movement = clamp2(0.64 * locus.state.movement + 0.18 * recurrent + 0.18 * external);
        const evolution = clamp2(0.72 * locus.state.evolution + 0.18 * Math.abs(recurrent) + 0.1 * locus.state.tension);
        const being = clamp2(0.7 * locus.state.being + 0.2 * locus.state.energy + 0.1 * recurrent);
        const design = clamp2(0.76 * locus.state.design + 0.14 * movement + 0.1 * evolution);
        const space = clamp2(0.74 * locus.state.space + 0.16 * recurrent + 0.1 * design);
        locus.update({
          movement,
          evolution,
          being,
          design,
          space,
          energy: clamp2(locus.state.energy * 0.992 + external * 8e-3),
          tension: clamp2(locus.state.tension * 0.95 + Math.abs(recurrent - being) * 0.05)
        });
        nextActivations[index] = locus.activation();
        locus.recordActivation(nextActivations[index]);
      }
      for (let source = 0; source < NODE_COUNT; source++) {
        for (let target = 0; target < NODE_COUNT; target++) {
          const oldWeight = this.weights[source][target] * this.decay;
          const delta = this.learningRate * previous[source] * nextActivations[target];
          this.weights[source][target] = Math.min(1, Math.max(-1, oldWeight + delta));
        }
      }
      this.tickCount += 1;
      return this.snapshot();
    }
    /**
     * Deterministic render: 64 loci tiled as an 8x8 block grid over the
     * width x height frame. Each locus color = state-space colorFor of its gate
     * address, with line driven by activation (saturation), tone by energy
     * (lightness), color field by design; brightness scales with activation and
     * darkens with tension. A small deterministic positional grain (+/- 8%)
     * keeps blocks from being flat. Read-only: does not mutate field state.
     */
    frameRGBA() {
      const frame = new Uint8ClampedArray(this.width * this.height * 4);
      const nodeColors = this.loci.map((locus) => {
        const activation = locus.activation();
        const line = 1 + Math.min(5, Math.floor(activation * 6));
        const tone = 1 + Math.min(5, Math.floor(locus.state.energy * 6));
        const colorField = 1 + Math.min(5, Math.floor(locus.state.design * 6));
        const color = colorFor({ gate: locus.gate, line, color: colorField, tone, base: 1 });
        const brightness = (0.25 + 0.75 * activation) * (1 - 0.3 * locus.state.tension);
        const [r, g, b] = hexToRgb(color.hex);
        return [r * brightness, g * brightness, b * brightness, locus.gate];
      });
      for (let y = 0; y < this.height; y++) {
        const by = Math.min(7, Math.floor(y * 8 / this.height));
        for (let x = 0; x < this.width; x++) {
          const bx = Math.min(7, Math.floor(x * 8 / this.width));
          const [r, g, b, gate] = nodeColors[by * 8 + bx];
          const grain = 0.92 + 0.08 * ((x * 31 + y * 17 + gate) % 8 / 7);
          const offset = (y * this.width + x) * 4;
          frame[offset] = Math.min(255, Math.round(r * grain));
          frame[offset + 1] = Math.min(255, Math.round(g * grain));
          frame[offset + 2] = Math.min(255, Math.round(b * grain));
          frame[offset + 3] = 255;
        }
      }
      return frame;
    }
    /**
     * Interpolated morph between two gates. The changing lines — the set bits of
     * (fuxi(from) XOR fuxi(to)) — drive the morph: the source pattern is
     * injected with strength (1-t), the target with t, and the field ticks under
     * the dominant pattern of each phase. PURE with respect to field state:
     * captures and restores, so two calls on one field are byte-identical.
     * Returns [Uint8ClampedArray, ...] and records this.lastMorph metadata.
     */
    morphFrames(fromGate, toGate, steps = 8) {
      for (const g of [fromGate, toGate]) {
        if (!Number.isInteger(g) || g < 1 || g > 64) throw new RangeError("gates must be 1..64");
      }
      if (!Number.isInteger(steps) || steps < 1) throw new RangeError("steps must be >= 1");
      const fromF = gateToFuXiDecimal(fromGate);
      const toF = gateToFuXiDecimal(toGate);
      const changingMask = (fromF ^ toF) & FULL_MASK;
      const changingLines = [];
      for (let bit = 0; bit < STATE_BITS; bit++) {
        if (changingMask & 1 << bit) changingLines.push(bit + 1);
      }
      const saved = __privateMethod(this, _MediaField_instances, capture_fn).call(this);
      const frames = [];
      try {
        for (let k = 0; k < steps; k++) {
          const t = steps === 1 ? 1 : k / (steps - 1);
          this.injectFuXi(fromF, 1 - t);
          this.injectFuXi(toF, t);
          this.tick(t < 0.5 ? fromF : toF);
          frames.push(this.frameRGBA());
        }
      } finally {
        __privateMethod(this, _MediaField_instances, restore_fn).call(this, saved);
      }
      this.lastMorph = Object.freeze({
        fromGate,
        toGate,
        steps,
        fromFuXi: fromF,
        toFuXi: toF,
        changingMask,
        changingLines: Object.freeze(changingLines),
        changingLineCount: changingLines.length
        // popcount(xor)
      });
      return frames;
    }
    snapshot() {
      return {
        type: "media-field",
        tick: this.tickCount,
        width: this.width,
        height: this.height,
        loci: this.loci.map((l) => ({
          gate: l.gate,
          fuxi: l.fuxi,
          activation: l.activation(),
          energy: l.state.energy,
          tension: l.state.tension
        }))
      };
    }
  };
  _MediaField_instances = new WeakSet();
  activationVector_fn = function() {
    return this.loci.map((l) => l.activation());
  };
  influence_fn = function(activations, target) {
    let sum = 0;
    for (let source = 0; source < NODE_COUNT; source++) {
      sum += activations[source] * this.weights[source][target];
    }
    return Math.tanh(sum);
  };
  capture_fn = function() {
    return {
      states: this.loci.map((l) => ({ ...l.state })),
      weights: this.weights.map((row) => row.slice()),
      histories: this.loci.map((l) => [...l.activationHistory]),
      tickCount: this.tickCount
    };
  };
  restore_fn = function(saved) {
    this.loci.forEach((locus, i) => {
      locus.state = { ...saved.states[i] };
      locus.activationHistory = [...saved.histories[i]];
    });
    saved.weights.forEach((row, i) => this.weights[i].set(row));
    this.tickCount = saved.tickCount;
  };
  var VideoTimeline = class {
    constructor({ width = 64, height = 64 } = {}) {
      this.width = width;
      this.height = height;
      this.frames = [];
    }
    addFrame(rgba, durationTicks = 1) {
      const expected = this.width * this.height * 4;
      if (!rgba || rgba.length !== expected) {
        throw new RangeError(`frame must be ${expected} bytes (${this.width}x${this.height} RGBA)`);
      }
      if (!Number.isInteger(durationTicks) || durationTicks < 1) {
        throw new RangeError("durationTicks must be a positive integer");
      }
      this.frames.push({ rgba, durationTicks });
      return this;
    }
    /** -> [{rgba, width, height, delay(ms)}], delay = durationTicks * 40ms. */
    exportFrames() {
      return this.frames.map(({ rgba, durationTicks }) => ({
        rgba,
        width: this.width,
        height: this.height,
        delay: durationTicks * TICK_MS
      }));
    }
    get frameCount() {
      return this.frames.length;
    }
  };
  var JS_KEYWORDS = Object.freeze([
    "function",
    "return",
    "const",
    "let",
    "var",
    "class",
    "extends",
    "import",
    "export",
    "default",
    "async",
    "await",
    "new",
    "if",
    "else",
    "for",
    "while",
    "switch",
    "try",
    "catch",
    "throw",
    "typeof",
    "instanceof",
    "yield",
    "static"
  ]);
  var IDENTIFIER = /[A-Za-z_$][A-Za-z0-9_$]*/;
  function sanitizeIdentifier(name, fallback = "wovenModule") {
    const parts = String(name || "").toLowerCase().match(/[a-z0-9]+/g) || [];
    const camel = parts.map((p, i) => i === 0 ? p : p[0].toUpperCase() + p.slice(1)).join("");
    const candidate = camel || fallback;
    return IDENTIFIER.test(candidate) && !/^[0-9]/.test(candidate) ? candidate : fallback;
  }
  var CodeWeaver = class {
    /** morph-mir-style structural sniff of a source string. */
    analyze(source) {
      const src = String(source ?? "");
      const functions = [];
      for (const m of src.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g)) functions.push(m[1]);
      for (const m of src.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/g)) functions.push(m[1]);
      const classes = [...src.matchAll(/class\s+([A-Za-z_$][\w$]*)/g)].map((m) => m[1]);
      const imports = [...src.matchAll(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]);
      const exports = [...src.matchAll(/export\s+(?:default\s+)?(?:async\s+)?(?:function|class|const|let|var|interface|type)?\s*([A-Za-z_$][\w$]*)?/g)].map((m) => m[0].includes("default") ? `default:${m[1] || ""}` : m[1]).filter(Boolean);
      const keywords = JS_KEYWORDS.filter((kw) => new RegExp(`\\b${kw}\\b`).test(src));
      return {
        functions: [...new Set(functions)],
        classes: [...new Set(classes)],
        imports: [...new Set(imports)],
        exports: [...new Set(exports)],
        keywords,
        lines: src === "" ? 0 : src.split("\n").length,
        bytes: src.length,
        signature: mediaHash(src)
      };
    }
    /**
     * Generate a small deterministic JS module string from
     * {name, gates:[], purpose}. Template-based; the artifact is data.
     */
    weave(spec = {}) {
      const name = sanitizeIdentifier(spec.name);
      const constantName = name.replace(/([A-Z])/g, "_$1").toUpperCase();
      const gates = [...new Set((Array.isArray(spec.gates) ? spec.gates : []).map(Number).filter((g) => Number.isInteger(g) && g >= 1 && g <= 64))].sort((a, b) => a - b);
      const purpose = String(spec.purpose || "woven module").replace(/[\r\n*]/g, " ").trim();
      const signature2 = mediaHash({ name, gates, purpose });
      return [
        `// Pure Synthia Automata \u2014 woven module: ${name}`,
        `// purpose: ${purpose}`,
        `// weave signature: ${signature2} (template artifact \u2014 data, never executed by the core)`,
        "",
        `export const ${constantName}_GATES = Object.freeze([${gates.join(", ")}]);`,
        `export const ${constantName}_SIGNATURE = '${signature2}';`,
        "",
        `export function ${name}Resonance(gate) {`,
        `  const gates = ${constantName}_GATES;`,
        "  if (!gates.length) return 0;",
        "  const index = ((Number(gate) - 1) % gates.length + gates.length) % gates.length;",
        "  const partner = gates[index];",
        "  let mask = (Number(gate) - 1) ^ (partner - 1);",
        "  let changing = 0;",
        "  while (mask) { changing += mask & 1; mask >>>= 1; }",
        "  return changing / 6; // hamming tension over the 6-bit line pattern",
        "}",
        "",
        `export default Object.freeze({ name: '${name}', gates: ${constantName}_GATES, purpose: '${purpose.replace(/'/g, "")}', signature: ${constantName}_SIGNATURE });`,
        ""
      ].join("\n");
    }
    /**
     * weave() + ArtifactWriter: generate the module string and register it as a
     * real code artifact {kind:'code', fileName:'<name>.js', mime:
     * 'text/javascript', text}. Returns the writer's {artifact} record.
     */
    weaveArtifact(spec = {}, writer = new ArtifactWriter()) {
      const name = sanitizeIdentifier(spec.name);
      const text = this.weave(spec);
      return writer.write("code", { fileName: `${name}.js`, text, mime: "text/javascript" });
    }
    /** Line-set diff summary between two source strings (deterministic). */
    diffSummary(a, b) {
      const linesA = String(a ?? "").split("\n");
      const linesB = String(b ?? "").split("\n");
      const setA = new Set(linesA);
      const setB = new Set(linesB);
      const added = [...new Set(linesB.filter((l) => !setA.has(l)))];
      const removed = [...new Set(linesA.filter((l) => !setB.has(l)))];
      const unchanged = linesB.filter((l) => setA.has(l)).length;
      return {
        added,
        removed,
        addedCount: added.length,
        removedCount: removed.length,
        unchangedCount: unchanged,
        identical: added.length === 0 && removed.length === 0 && linesA.length === linesB.length,
        signature: mediaHash(`${mediaHash(String(a ?? ""))}:${mediaHash(String(b ?? ""))}`)
      };
    }
  };

  // src/engine/learning.js
  var ROUTE_THRESHOLD = 0.2;
  var CHANNEL_BOOST = 1.25;
  var wordsOf2 = (value) => String(value ?? "").toLowerCase().match(/[a-z0-9']+/g) || [];
  var CAPABILITY_HINTS = Object.freeze({
    "media-field": ["video", "image", "frames", "animation", "animate", "morph", "media", "render", "picture", "code", "write", "generate", "module", "program", "weave"],
    "morph-mir": ["morph", "media", "artifact", "code", "function", "file", "regenerate", "animate"],
    "computational-grammar-coder": ["code", "coder", "grammar", "compile", "syntax", "parse", "function", "file"],
    "autoling": ["learn", "grammar", "rule", "language", "induce"],
    "autoling-lite": ["learn", "grammar", "rule", "language", "induce"],
    "research-browser": ["research", "cite", "source", "browse", "search", "study"],
    "autonovel": ["story", "novel", "generate", "narrative", "chapter", "write"],
    "messy": ["simulate", "agents", "simulation", "crowd", "society"],
    "diseminer": ["narrative", "distribution", "infer", "claims", "influence"],
    "diseminer-lite": ["narrative", "distribution", "infer", "neighbors"],
    "conversation": ["talk", "chat", "converse", "summarize", "utter", "say"],
    "klein-analogy": ["analogy", "analogical", "proportion", "boolean"],
    "iching-grammar": ["hexagram", "iching", "cast", "oracle", "lines"],
    "language-contact": ["contact", "borrow", "language", "generation"],
    "historical-monte-carlo": ["monte", "carlo", "sample", "history", "drift"],
    "success": ["purpose", "success", "goal", "indicator", "progress"],
    "browser-form": ["form", "fill", "browser", "page", "consent"]
  });
  function tokenMatches(token, keyword) {
    if (token === keyword) return true;
    if (token.length >= 4 && keyword.length >= 4) {
      return token.startsWith(keyword) || keyword.startsWith(token);
    }
    return false;
  }
  function safeClone(value) {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return String(value);
    }
  }
  function crFromLedger(ledger = {}) {
    return {
      operations: ledger.operationsExecuted || 0,
      visitedStates: ledger.statesGenerated || 0,
      materialized: ledger.primitivesActivated || 0,
      peakStates: ledger.activeAutomata || 0,
      steps: ledger.transitionCount || 0
    };
  }
  var _LearningOrchestrator_instances, indexCanonical_fn, indexGrown_fn, match_fn, scoreFor_fn, matchEmergentChannel_fn, runEmergentChannel_fn, postRunFeedback_fn, automatonFor_fn, log_fn;
  var LearningOrchestrator = class {
    constructor({ engine: engine2, intake, factory, router } = {}) {
      __privateAdd(this, _LearningOrchestrator_instances);
      this.engine = engine2;
      this.intake = intake;
      this.factory = factory;
      this.router = router;
      this.log = [];
      this.seq = 0;
      this.grown = [];
      this.grownById = /* @__PURE__ */ new Map();
      this.candidates = /* @__PURE__ */ new Map();
      for (const entry of TOOL_REGISTRY) __privateMethod(this, _LearningOrchestrator_instances, indexCanonical_fn).call(this, entry);
    }
    // ---------------- growth ----------------
    /**
     * The grow path: factory.generate -> wrap as a real Automaton ->
     * engine.mesh.register -> lineage record. Deterministic ids come from the
     * factory; `forcedId` gives a stable public name (boot tools).
     */
    grow({ purpose, input, dimension, gate, capabilities = [], hints = [], implementation = null, forcedId = null, learnedFrom = null }) {
      const generated = this.factory.generate({ purpose, input, dimension, gate });
      if (!generated || !generated.tool) {
        throw new Error(`ToolFactory could not generate (status: ${generated && generated.status})`);
      }
      const gen = generated.tool;
      const toolId = forcedId || gen.id;
      let automaton = this.grownById.get(toolId) || this.engine && this.engine.mesh.get(toolId);
      if (!automaton) {
        automaton = new Automaton({
          id: toolId,
          address: { ...gen.address, planetaryDimension: gen.dimension },
          states: [{ id: "sense", initial: true }, { id: "respond", accepting: true }],
          alphabet: ["request"],
          q0: "sense",
          finals: ["respond"],
          capabilities,
          dimension: gen.dimension,
          automatonForm: "grown-tool",
          implementation: implementation || ((runInput) => gen.execute(
            runInput && typeof runInput === "object" && "raw" in runInput ? runInput.raw ?? (runInput.args || []).join(" ") : runInput
          ))
        });
        if (this.engine && this.engine.mesh) this.engine.mesh.register(automaton);
        this.grownById.set(toolId, automaton);
        const record = {
          toolId,
          generatedId: gen.id,
          name: gen.name,
          level: gen.level,
          levelName: gen.levelName,
          address: { ...gen.address },
          dimension: gen.dimension,
          capabilities: [...capabilities],
          lineage: {
            parents: [],
            learnedFrom: learnedFrom || null,
            hypothesis: "H1-grown-tool",
            evidence: "observed"
          }
        };
        this.grown.push(record);
        __privateMethod(this, _LearningOrchestrator_instances, indexGrown_fn).call(this, toolId, { capabilities, hints, purpose });
        if (this.engine && this.engine.tripleStore) {
          this.engine.tripleStore.addAll(toolOntology(automaton));
        }
      }
      return { automaton, generated: gen, record: this.grown.find((r) => r.toolId === toolId) };
    }
    /**
     * Boot growth: the 17th, grown-by-default tool 'media-field' — gate 25,
     * Space dimension, backed by a pure-JS MediaField + VideoTimeline +
     * CodeWeaver + ArtifactWriter. Three operations, dispatched by request
     * shape:
     *
     *   picture({gate})            one 64x64 render of the gate's field state
     *                              (state-pure: morphFrames(g, g, 1)) -> BMP
     *   video({from, to, steps=8, delayCs=8})
     *                              morphFrames(from, to, steps) -> animated GIF89a
     *   code({name, gates, purpose})  CodeWeaver module -> text/javascript artifact
     *
     * Every op returns {ok:true, ..., artifact:{id, kind, format, fileName,
     * mime, size, hash, bytes, ...}} where artifact.bytes is a PLAIN ARRAY of
     * byte values (not a Uint8Array) so the whole output is JSON-safe — it is
     * safeClone'd into the learning log. Synchronous.
     */
    growBootMediaField() {
      const addressed = this.intake.intake("media field: images, video frames, gate morphs, code weaving");
      const field = new MediaField({ width: 64, height: 64 });
      const timeline = new VideoTimeline({ width: 64, height: 64 });
      const weaver = new CodeWeaver();
      const writer = new ArtifactWriter();
      const jsonArtifact = ({ artifact }, format, extra = {}) => ({
        id: artifact.id,
        kind: artifact.kind,
        format,
        fileName: artifact.fileName,
        mime: artifact.mime,
        size: artifact.size,
        hash: artifact.hash,
        bytes: Array.from(artifact.bytes),
        ...artifact.text != null ? { text: artifact.text } : {},
        ...extra
      });
      const opPicture = (gate) => {
        const g = gate ?? 24;
        const frame = field.morphFrames(g, g, 1)[0];
        const record = writer.write("picture", {
          fileName: `gate-${g}-picture.bmp`,
          bytes: encodeBMP(field.width, field.height, frame),
          mime: "image/bmp"
        });
        return {
          ok: true,
          kind: "picture",
          gate: g,
          artifact: jsonArtifact(record, "bmp", { width: field.width, height: field.height })
        };
      };
      const opVideo = (from, to, steps, delayCs) => {
        const frames = field.morphFrames(from, to, steps);
        for (const frame of frames) timeline.addFrame(frame, 1);
        const exported = timeline.exportFrames().slice(-steps);
        const record = writer.write("video", {
          fileName: `morph-gate-${from}-to-${to}.gif`,
          bytes: encodeGIF(
            field.width,
            field.height,
            frames.map((rgba) => ({ rgba, delayCs })),
            { loop: true }
          ),
          mime: "image/gif"
        });
        return {
          ok: true,
          kind: "video",
          from,
          to,
          steps,
          delayCs,
          frames: {
            count: frames.length,
            width: field.width,
            height: field.height,
            byteLength: frames.length ? frames[0].length : 0,
            delays: exported.map((f) => f.delay),
            hashes: frames.map(frameHash),
            changingLines: [...field.lastMorph.changingLines],
            changingLineCount: field.lastMorph.changingLineCount,
            changingMask: field.lastMorph.changingMask
          },
          artifact: jsonArtifact(record, "gif", { frames: frames.length })
        };
      };
      const opCode = (name, gates, purpose) => {
        const record = weaver.weaveArtifact({ name, gates, purpose }, writer);
        const code = record.artifact.text;
        const analysis = /(function|=>|import|export)/.test(purpose) ? weaver.analyze(purpose) : null;
        return {
          ok: true,
          kind: "code",
          name,
          gates,
          code,
          bytes: code.length,
          signature: mediaHash(code),
          analysis,
          artifact: jsonArtifact(record, "js")
        };
      };
      const implementation = (runInput) => {
        const text = String(runInput && (runInput.raw || (runInput.args || []).join(" ")) || "");
        const lower = text.toLowerCase();
        const tokens = wordsOf2(text);
        const gates = [];
        for (let k = 0; k < tokens.length - 1; k++) {
          if (tokens[k] === "gate" && /^\d+$/.test(tokens[k + 1])) {
            const g = Number(tokens[k + 1]);
            if (g >= 1 && g <= 64) gates.push(g);
          }
        }
        if (/\b(code|write|function|module|program|implement)\b/.test(lower)) {
          const stop = /* @__PURE__ */ new Set(["code", "write", "make", "function", "module", "program", "implement", "with", "that", "gate", "please"]);
          const name = tokens.filter((w) => w.length > 3 && !stop.has(w)).slice(0, 3).join("-") || "woven-module";
          return opCode(name, gates, text);
        }
        const wantsPicture = /\b(picture|image|bmp|photo|still)\b/.test(lower);
        const wantsVideo = /\b(video|morph|animate|animation|frames|gif|movie)\b/.test(lower);
        if (wantsPicture && !wantsVideo) return opPicture(gates[0] ?? 24);
        const from = gates[0] ?? 24;
        const to = gates[1] ?? from % 64 + 1;
        const stepsMatch = lower.match(/(\d+)\s*frames?/);
        const steps = stepsMatch ? Math.min(32, Math.max(1, Number(stepsMatch[1]))) : 8;
        const delayMatch = lower.match(/(\d+)\s*(?:cs|centiseconds?)/);
        const delayCs = delayMatch ? Math.min(600, Math.max(1, Number(delayMatch[1]))) : 8;
        return opVideo(from, to, steps, delayCs);
      };
      return this.grow({
        purpose: "media field: images, video frames, gate morphs, code weaving",
        input: "media-field",
        dimension: "Space",
        gate: 25,
        forcedId: "media-field",
        capabilities: ["image", "picture", "video", "morph", "animation", "frames", "code", "artifact"],
        hints: CAPABILITY_HINTS["media-field"],
        implementation,
        learnedFrom: addressed.id
      });
    }
    // ---------------- the request front door ----------------
    /** request(text) -> LearningResult ({mode, toolId, score, intakeId, output, cr, seq}). */
    async request(text, context = {}) {
      const addressed = this.intake.intake(text, context);
      const intakeId = addressed.id;
      let parsed = null;
      try {
        parsed = parseChain(text);
      } catch {
        parsed = null;
      }
      if (parsed) {
        const derivation = this.engine.call(text, context);
        const cr2 = crFromLedger(derivation.ledger);
        const toolId = derivation.primitives.join(" then ");
        const entry2 = __privateMethod(this, _LearningOrchestrator_instances, log_fn).call(this, {
          request: text,
          intakeId,
          mode: "known-call",
          toolId,
          score: 1,
          cr: cr2,
          ledgerSnapshot: { ...derivation.ledger },
          output: safeClone(derivation.output)
        });
        return {
          mode: "known-call",
          toolId,
          score: 1,
          intakeId,
          output: derivation.output,
          derivationId: derivation.id,
          cr: cr2,
          seq: entry2.seq
        };
      }
      const prior = this.log.find((e) => e.request === text);
      if (prior) {
        const entry2 = __privateMethod(this, _LearningOrchestrator_instances, log_fn).call(this, {
          request: text,
          intakeId,
          mode: "learned-recall",
          toolId: prior.toolId,
          score: prior.score,
          cr: { ...prior.cr },
          ledgerSnapshot: safeClone(prior.ledgerSnapshot),
          output: safeClone(prior.output)
        });
        return {
          mode: "learned-recall",
          toolId: prior.toolId,
          score: prior.score,
          intakeId,
          output: safeClone(prior.output),
          cr: { ...prior.cr },
          seq: entry2.seq,
          recalledFrom: prior.seq
        };
      }
      const route = this.router.route(text);
      const best = __privateMethod(this, _LearningOrchestrator_instances, match_fn).call(this, text);
      const emergent = __privateMethod(this, _LearningOrchestrator_instances, matchEmergentChannel_fn).call(this, text);
      if (emergent && emergent.score >= ROUTE_THRESHOLD && (!best || emergent.score > best.score)) {
        const result = await __privateMethod(this, _LearningOrchestrator_instances, runEmergentChannel_fn).call(this, emergent, text, intakeId, context);
        if (result) return result;
      }
      if (best && best.score >= ROUTE_THRESHOLD) {
        const automaton2 = __privateMethod(this, _LearningOrchestrator_instances, automatonFor_fn).call(this, best.toolId);
        if (automaton2) {
          try {
            const run2 = automaton2.run({ args: [text], raw: text, flags: {}, address: null, packet: null }, context);
            const output2 = await Promise.resolve(run2.output);
            const cr2 = crFromLedger(run2.ledger);
            const entry2 = __privateMethod(this, _LearningOrchestrator_instances, log_fn).call(this, {
              request: text,
              intakeId,
              mode: "routed",
              toolId: best.toolId,
              score: best.score,
              cr: cr2,
              ledgerSnapshot: { ...run2.ledger },
              output: safeClone(output2)
            });
            __privateMethod(this, _LearningOrchestrator_instances, postRunFeedback_fn).call(this, automaton2, { text, output: output2, trace: run2.trace, intakeId, seq: entry2.seq });
            return { mode: "routed", toolId: best.toolId, score: best.score, intakeId, output: output2, cr: cr2, seq: entry2.seq };
          } catch {
          }
        }
      }
      const dimension = route.status === "resolved" && route.dimension || addressed.regime.dimension || "Design";
      const { automaton } = this.grow({
        purpose: text,
        input: text,
        dimension,
        gate: addressed.address.gate,
        learnedFrom: intakeId
      });
      const run = automaton.run({ args: [text], raw: text, flags: {}, address: null, packet: null }, context);
      const output = await Promise.resolve(run.output);
      const cr = crFromLedger(run.ledger);
      const entry = __privateMethod(this, _LearningOrchestrator_instances, log_fn).call(this, {
        request: text,
        intakeId,
        mode: "grown",
        toolId: automaton.id,
        score: best ? best.score : 0,
        cr,
        ledgerSnapshot: { ...run.ledger },
        output: safeClone(output)
      });
      __privateMethod(this, _LearningOrchestrator_instances, postRunFeedback_fn).call(this, automaton, { text, output, trace: run.trace, intakeId, seq: entry.seq });
      return { mode: "grown", toolId: automaton.id, score: entry.score, intakeId, output, cr, seq: entry.seq };
    }
    // ---------------- reports ----------------
    exportLog() {
      return this.log.map((entry) => ({
        seq: entry.seq,
        request: entry.request,
        intakeId: entry.intakeId,
        mode: entry.mode,
        toolId: entry.toolId,
        score: entry.score,
        cr: { ...entry.cr },
        ledgerSnapshot: safeClone(entry.ledgerSnapshot)
      }));
    }
    /** Computational-reduction summary across the whole learning log. */
    crReport() {
      const byMode = {};
      const totals = { operations: 0, visitedStates: 0, materialized: 0, peakStates: 0, steps: 0 };
      for (const entry of this.log) {
        byMode[entry.mode] = (byMode[entry.mode] || 0) + 1;
        for (const key of Object.keys(totals)) {
          if (key === "peakStates") totals.peakStates = Math.max(totals.peakStates, entry.cr.peakStates || 0);
          else totals[key] += entry.cr[key] || 0;
        }
      }
      return {
        requests: this.log.length,
        byMode,
        totals,
        toolsGrown: this.grown.length,
        grownToolIds: this.grown.map((r) => r.toolId)
      };
    }
    grownTools() {
      return this.grown.map((record) => ({
        id: record.toolId,
        generatedId: record.generatedId,
        gate: record.address.gate,
        dimension: record.dimension,
        capabilities: [...record.capabilities],
        level: record.level,
        lineage: { ...record.lineage }
      }));
    }
  };
  _LearningOrchestrator_instances = new WeakSet();
  // ---------------- keyword index ----------------
  indexCanonical_fn = function(entry) {
    const keywords = /* @__PURE__ */ new Map();
    const put = (word, weight) => {
      const w = String(word || "").toLowerCase();
      if (!w || w.length < 2) return;
      keywords.set(w, Math.max(keywords.get(w) || 0, weight));
    };
    for (const part of entry.id.split("-")) put(part, 2);
    for (const alias of entry.aliases || []) put(alias, 2);
    for (const cap of entry.capabilities || []) for (const part of cap.split("-")) put(part, 2);
    for (const hint of CAPABILITY_HINTS[entry.id] || []) put(hint, 2);
    for (const word of wordsOf2(entry.description)) if (word.length > 3) put(word, 1);
    this.candidates.set(entry.id, keywords);
  };
  indexGrown_fn = function(toolId, { capabilities = [], hints = [], purpose = "" } = {}) {
    const keywords = /* @__PURE__ */ new Map();
    const put = (word, weight) => {
      const w = String(word || "").toLowerCase();
      if (!w || w.length < 2) return;
      keywords.set(w, Math.max(keywords.get(w) || 0, weight));
    };
    for (const part of toolId.split("-")) put(part, 2);
    for (const cap of capabilities) for (const part of cap.split("-")) put(part, 2);
    for (const hint of hints) put(hint, 2);
    for (const word of wordsOf2(purpose)) if (word.length > 3) put(word, 1);
    this.candidates.set(toolId, keywords);
  };
  /** Capability match: best {toolId, score} by weighted keyword overlap. */
  match_fn = function(text) {
    const tokens = new Set(wordsOf2(text));
    let best = null;
    for (const [toolId, keywords] of [...this.candidates.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      let shared = 0;
      for (const [keyword, weight] of keywords) {
        for (const token of tokens) {
          if (tokenMatches(token, keyword)) {
            shared += weight;
            break;
          }
        }
      }
      const score = shared / Math.max(4, tokens.size);
      if (!best || score > best.score) best = { toolId, score };
    }
    return best;
  };
  /** Weighted keyword score of one tool against a token set. */
  scoreFor_fn = function(toolId, tokens) {
    const keywords = this.candidates.get(toolId);
    if (!keywords) return 0;
    let shared = 0;
    for (const [keyword, weight] of keywords) {
      for (const token of tokens) {
        if (tokenMatches(token, keyword)) {
          shared += weight;
          break;
        }
      }
    }
    return shared / Math.max(4, tokens.size);
  };
  /**
   * Emergent channels as composite capabilities: a promoted crossing counts
   * when BOTH member tools match the request; the channel score is the boosted
   * average of the member scores (the connection itself is the capability).
   */
  matchEmergentChannel_fn = function(text) {
    const engine2 = this.engine;
    if (!engine2 || typeof engine2.emergentChannels !== "function") return null;
    const tokens = new Set(wordsOf2(text));
    let bestChannel = null;
    for (const crossing of engine2.emergentChannels()) {
      const scoreA = __privateMethod(this, _LearningOrchestrator_instances, scoreFor_fn).call(this, crossing.a, tokens);
      const scoreB = __privateMethod(this, _LearningOrchestrator_instances, scoreFor_fn).call(this, crossing.b, tokens);
      if (scoreA <= 0 || scoreB <= 0) continue;
      const score = (scoreA + scoreB) / 2 * CHANNEL_BOOST;
      if (!bestChannel || score > bestChannel.score) {
        bestChannel = { crossing, score, scoreA, scoreB };
      }
    }
    return bestChannel;
  };
  runEmergentChannel_fn = async function(channel, text, intakeId, context) {
    const { crossing } = channel;
    const automatonA = __privateMethod(this, _LearningOrchestrator_instances, automatonFor_fn).call(this, crossing.a);
    const automatonB = __privateMethod(this, _LearningOrchestrator_instances, automatonFor_fn).call(this, crossing.b);
    if (!automatonA || !automatonB) return null;
    try {
      const runA = automatonA.run({ args: [text], raw: text, flags: {}, address: null, packet: null }, context);
      const outputA = await Promise.resolve(runA.output);
      const packet = new StatePacket({
        id: `emergent-${crossing.a}~${crossing.b}-${crossing.uses + 1}`,
        from: crossing.a,
        to: crossing.b,
        kind: "data",
        payload: outputA,
        derivationId: null
      });
      if (this.engine && this.engine.mesh) this.engine.mesh.route(packet);
      const runB = automatonB.run({ args: [text], raw: text, flags: {}, address: null, packet }, context);
      const output = await Promise.resolve(runB.output);
      const ledger = {};
      for (const key of Object.keys(runA.ledger || {})) {
        ledger[key] = (runA.ledger[key] || 0) + ((runB.ledger || {})[key] || 0);
      }
      const cr = crFromLedger(ledger);
      const toolId = `${crossing.a} then ${crossing.b}`;
      const entry = __privateMethod(this, _LearningOrchestrator_instances, log_fn).call(this, {
        request: text,
        intakeId,
        mode: "emergent-channel",
        toolId,
        score: channel.score,
        cr,
        ledgerSnapshot: { ...ledger },
        output: safeClone(output)
      });
      __privateMethod(this, _LearningOrchestrator_instances, postRunFeedback_fn).call(this, automatonA, { text, output: outputA, trace: runA.trace, intakeId, seq: entry.seq });
      __privateMethod(this, _LearningOrchestrator_instances, postRunFeedback_fn).call(this, automatonB, { text, output, trace: runB.trace, intakeId, seq: entry.seq });
      return {
        mode: "emergent-channel",
        toolId,
        score: channel.score,
        intakeId,
        output,
        cr,
        seq: entry.seq,
        channel: this.engine && typeof this.engine.channelCapability === "function" ? this.engine.channelCapability(crossing.a, crossing.b) : null
      };
    } catch {
      return null;
    }
  };
  /**
   * Post-run feedback for request-path runs (routed / grown / emergent):
   * assert run-provenance triples and absorb the experience record into the
   * participating automaton's owned state. `seq` is the learning-log seq —
   * counter-derived, never wall-clock.
   */
  postRunFeedback_fn = function(automaton, { text, output, trace, intakeId, seq }) {
    if (!automaton) return;
    if (this.engine && this.engine.tripleStore) {
      this.engine.tripleStore.addAll(runTriples({
        toolId: automaton.id,
        input: { args: [text], raw: text },
        output,
        derivationId: null,
        trace
      }));
    }
    if (typeof automaton.absorbExperience === "function") {
      automaton.absorbExperience({
        derivationId: null,
        intakeId,
        outputHash: tripleValueHash(output),
        seq
      });
    }
  };
  automatonFor_fn = function(toolId) {
    return this.grownById.get(toolId) || this.engine && this.engine.toolsById.get(toolId) || null;
  };
  log_fn = function(entry) {
    const seq = ++this.seq;
    this.log.push({ seq, ...entry });
    return this.log[this.log.length - 1];
  };

  // src/merged/tool-factory.js
  var TOOL_LEVELS = Object.freeze([
    { level: 0, name: "Base", kind: "constant", cues: Object.freeze(["constant", "seed", "value", "base"]) },
    { level: 1, name: "Tone", kind: "classifier", cues: Object.freeze(["classify", "boolean", "tone", "yin", "yang"]) },
    { level: 2, name: "Color", kind: "filter", cues: Object.freeze(["filter", "select", "color", "predicate"]) },
    { level: 3, name: "Bigram", kind: "matcher", cues: Object.freeze(["match", "compare", "pair", "bigram"]) },
    { level: 4, name: "Trigram", kind: "analyzer", cues: Object.freeze(["analyze", "learn", "trigram"]) },
    { level: 5, name: "Hexagram", kind: "rule", cues: Object.freeze(["rule", "grammar", "hexagram"]) },
    { level: 6, name: "Channel", kind: "connector", cues: Object.freeze(["connect", "transmit", "channel", "event"]) },
    { level: 7, name: "Circuit", kind: "system", cues: Object.freeze(["system", "circuit", "workflow", "pipeline", "orchestrate"]) }
  ]);
  var OPERATION_LEVEL_FALLBACK = Object.freeze({
    transition: 3,
    transform: 4,
    instantiate: 5,
    structure: 5,
    integrate: 7
  });
  var FactoryError = class extends Error {
    constructor(code, message, details = {}) {
      super(message);
      this.name = "FactoryError";
      this.code = code;
      this.details = details;
    }
  };
  var words2 = (value) => String(value ?? "").toLowerCase().match(/[a-z0-9']+/g) || [];
  var clone3 = (value) => globalThis.structuredClone ? structuredClone(value) : JSON.parse(JSON.stringify(value));
  var canonical2 = (value) => value === null || typeof value !== "object" ? JSON.stringify(value) : Array.isArray(value) ? `[${value.map(canonical2).join(",")}]` : `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonical2(value[k])}`).join(",")}}`;
  function stableId(value) {
    const text = canonical2(value);
    let a = 3735928559 ^ text.length;
    let b = 1103547991 ^ text.length;
    for (let i = 0; i < text.length; i++) {
      a = Math.imul(a ^ text.charCodeAt(i), 2654435761);
      b = Math.imul(b ^ text.charCodeAt(i), 1597334677);
    }
    a = Math.imul(a ^ a >>> 16, 2246822507) ^ Math.imul(b ^ b >>> 13, 3266489909);
    b = Math.imul(b ^ b >>> 16, 2246822507) ^ Math.imul(a ^ a >>> 13, 3266489909);
    return `${(b >>> 0).toString(16).padStart(8, "0")}${(a >>> 0).toString(16).padStart(8, "0")}`;
  }
  function seeded(seed) {
    let x = parseInt(stableId(seed).slice(0, 8), 16) || 1;
    return () => (x = Math.imul(x ^ x >>> 15, 1 | x), x ^= x + Math.imul(x ^ x >>> 7, 61 | x), (x ^ x >>> 14) >>> 0) / 4294967296;
  }
  function planLevel(request, route) {
    const explicit = request.level;
    if (Number.isInteger(explicit) && explicit >= 0 && explicit <= 7) return explicit;
    const tokens = new Set(words2(`${request.purpose || ""} ${request.input || ""}`));
    const scores = TOOL_LEVELS.map((l) => l.cues.reduce((n, cue) => n + (tokens.has(cue) ? 1 : 0), 0));
    const max = Math.max(...scores);
    if (max) return scores.lastIndexOf(max);
    return OPERATION_LEVEL_FALLBACK[route.operation] ?? 5;
  }
  function makePlan(request, route) {
    const level = planLevel(request, route);
    const gate = Number.isInteger(request.gate) ? request.gate : route.seedGate;
    if (gate < 1 || gate > 64) throw new FactoryError("INVALID_GATE", "gate must be 1..64");
    const line = level % 6 + 1;
    return Object.freeze({
      level,
      gate,
      targetGate: (gate + level * 7 - 1) % 64 + 1,
      line,
      color: (line - 1) % 6 + 1,
      tone: (line - 1) % 6 + 1,
      base: (line - 1) % 5 + 1,
      dimension: route.dimension,
      operation: route.operation,
      purpose: request.purpose || null
    });
  }
  function makeRuntime(plan, id) {
    const random = seeded(id);
    const state = { seen: /* @__PURE__ */ new Map(), rules: [], events: [] };
    const addressKey2 = `${plan.dimension}:G${plan.gate}.L${plan.line}.C${plan.color}.T${plan.tone}.B${plan.base}`;
    const implementations = [
      // L0 Base — echo the constant seed value back with the input
      async (input) => ({ address: addressKey2, value: plan.base, input }),
      // L1 Tone — yin/yang classifier; attractor polarity from the gate's least-significant bit
      async (input) => {
        const value = Number(input);
        if (!Number.isFinite(value)) throw new FactoryError("EXPECTED_NUMBER", "Tone requires a number");
        const attractor = plan.gate & 1 ? 0.75 : 0.25;
        return { value, isYang: value > 0.5, isYin: value <= 0.5, tension: Math.abs(value - attractor) };
      },
      // L2 Color — filter items matching this tool's address fields
      async (input) => {
        const list = Array.isArray(input) ? input : [input];
        return list.filter((item) => item?.color === plan.color || item?.tone === plan.tone || item?.gate === plan.gate);
      },
      // L3 Bigram — Jaccard matcher over word sets
      async (input) => {
        const [a, b] = Array.isArray(input) ? input : [input, input];
        const aa = words2(a);
        const bb = words2(b);
        const shared = [...new Set(aa.filter((x) => bb.includes(x)))];
        return { match: shared.length / Math.max(1, (/* @__PURE__ */ new Set([...aa, ...bb])).size), shared, pattern: [plan.gate & 3, plan.gate >> 2 & 3] };
      },
      // L4 Trigram — analyzer: occurrence counts + feature bundle
      async (input) => {
        const key = canonical2(input);
        const occurrences = (state.seen.get(key) || 0) + 1;
        state.seen.set(key, occurrences);
        return { input, occurrences, features: { gate: plan.gate, line: plan.line, color: plan.color, tone: plan.tone, base: plan.base } };
      },
      // L5 Hexagram — rule accumulator {lhs: dimension, rhs: input, weight}
      async (input) => {
        const rule = { lhs: plan.dimension, rhs: input, weight: 1 + state.rules.length / 10 };
        state.rules.push(rule);
        return { rule, address: addressKey2 };
      },
      // L6 Channel — addressed event packets {sequence, from, to, signal, address}
      async (input) => {
        const packet = { sequence: state.events.length + 1, from: plan.gate, to: plan.targetGate, signal: input, address: addressKey2 };
        state.events.push(packet);
        return packet;
      },
      // L7 Circuit — seeded Markov text generation, at most 15 steps
      async (input) => {
        const tokens = words2(input);
        const edges = [];
        for (let i = 0; i < tokens.length - 1; i++) edges.push({ from: tokens[i], to: tokens[i + 1] });
        const walk = [];
        if (tokens.length) {
          let cur = tokens[0];
          walk.push(cur);
          for (let i = 0; i < 15; i++) {
            const options = edges.filter((t) => t.from === cur);
            if (!options.length) break;
            cur = options[Math.floor(random() * options.length)].to;
            walk.push(cur);
          }
        }
        return { output: walk.join(" "), nodes: [...new Set(tokens)], edges, address: addressKey2 };
      }
    ];
    return {
      execute: implementations[plan.level],
      exportState: () => ({ seen: [...state.seen], rules: clone3(state.rules), events: clone3(state.events) })
    };
  }
  var ToolFactory = class {
    constructor({ router = new DimensionRouter() } = {}) {
      this.router = router;
      this.tools = /* @__PURE__ */ new Map();
    }
    generate(request = {}) {
      if (!request.purpose && !request.input) {
        throw new FactoryError("MISSING_PURPOSE", "purpose or input is required");
      }
      const route = request.dimension ? Object.freeze({ status: "resolved", dimension: request.dimension, ...DIMENSION_META[request.dimension] }) : this.router.route(`${request.purpose || ""} ${request.input || ""}`);
      if (route.status !== "resolved") return route;
      if (!DIMENSION_META[route.dimension]) throw new FactoryError("UNKNOWN_DIMENSION", route.dimension);
      const plan = makePlan(request, { ...DIMENSION_META[route.dimension], ...route });
      const identity = {
        version: "pure-synthia-merged-tool-factory.v1",
        plan,
        request: { purpose: request.purpose || null, input: request.input || null }
      };
      const id = `tool-${stableId(identity)}`;
      if (this.tools.has(id)) return Object.freeze({ status: "existing", tool: this.tools.get(id) });
      const runtime = makeRuntime(plan, id);
      const address = { gate: plan.gate, line: plan.line, color: plan.color, tone: plan.tone, base: plan.base };
      const addressKey2 = `${plan.dimension}:G${plan.gate}.L${plan.line}.C${plan.color}.T${plan.tone}.B${plan.base}`;
      const tool = {
        id,
        name: `${TOOL_LEVELS[plan.level].name}${plan.dimension}G${plan.gate}L${plan.line}`,
        address,
        addressKey: addressKey2,
        level: plan.level,
        levelName: TOOL_LEVELS[plan.level].name,
        dimension: plan.dimension,
        targetGate: plan.targetGate,
        purpose: plan.purpose,
        execute: (input, context = {}) => runtime.execute(input, context),
        exportState: runtime.exportState
      };
      this.tools.set(id, tool);
      return Object.freeze({ status: "generated", tool });
    }
  };

  // src/mesh/channels.js
  var CHANNEL_PROMOTION_THRESHOLD = 3;
  var CrossingRecord = class {
    constructor({ a, b, uses = 0, packetKeys = [], promoted = false, createdSeq = 0, promotedSeq = null } = {}) {
      if (typeof a !== "string" || !a || typeof b !== "string" || !b) {
        throw new TypeError("CrossingRecord requires automaton ids a and b");
      }
      this.a = a;
      this.b = b;
      this.uses = uses;
      this.packetKeys = [...packetKeys];
      this.promoted = promoted;
      this.createdSeq = createdSeq;
      this.promotedSeq = promotedSeq;
    }
    key() {
      return `${this.a}~${this.b}`;
    }
    toJSON() {
      return {
        a: this.a,
        b: this.b,
        uses: this.uses,
        packetKeys: [...this.packetKeys],
        promoted: this.promoted,
        createdSeq: this.createdSeq,
        promotedSeq: this.promotedSeq
      };
    }
  };
  var EmergentChannels = class {
    constructor({ mesh = null, threshold = CHANNEL_PROMOTION_THRESHOLD } = {}) {
      this.mesh = mesh;
      this.threshold = threshold;
      this._crossings = /* @__PURE__ */ new Map();
      this._seq = 0;
    }
    /**
     * Record one packet crossing from aId to bId. Repeated useful interaction
     * (uses >= threshold) promotes the temporary crossing to a persistent
     * channel exactly once.
     */
    recordCrossing(aId, bId, packet = null) {
      const record = new CrossingRecord({ a: aId, b: bId });
      const key = record.key();
      let existing = this._crossings.get(key);
      if (!existing) {
        record.createdSeq = ++this._seq;
        this._crossings.set(key, record);
        existing = record;
      }
      existing.uses += 1;
      const packetKey = packet && (packet.id ?? packet.derivationId);
      if (packetKey !== null && packetKey !== void 0) existing.packetKeys.push(packetKey);
      if (!existing.promoted && existing.uses >= this.threshold) {
        existing.promoted = true;
        existing.promotedSeq = ++this._seq;
      }
      return Object.freeze(existing.toJSON());
    }
    get(aId, bId) {
      const record = this._crossings.get(`${aId}~${bId}`);
      return record ? Object.freeze(record.toJSON()) : null;
    }
    crossings() {
      return [...this._crossings.values()].map((r) => Object.freeze(r.toJSON()));
    }
    /** Persistent channels only — the promoted crossings. */
    promoted() {
      return this.crossings().filter((c) => c.promoted);
    }
    /**
     * When (and only when) the crossing a→b has promoted, the channel is itself
     * a capability: a sequential composition of the two member tools.
     */
    emergentCapability(aId, bId) {
      const record = this._crossings.get(`${aId}~${bId}`);
      if (!record || !record.promoted) return null;
      return Object.freeze({
        id: `channel:${aId}~${bId}`,
        kind: "emergent-channel",
        compose: "sequential",
        tools: [aId, bId],
        uses: record.uses,
        promotedSeq: record.promotedSeq,
        description: `Emergent channel ${aId} -> ${bId}: a crossing used ${record.uses} times became a persistent channel; the connection itself composes the two tools sequentially.`
      });
    }
  };

  // src/engine/questions.js
  var OPEN_QUESTIONS = Object.freeze([
    Object.freeze({
      id: "OQ-1",
      name: "orb/Delta/axon assignment",
      statement: "how the source document's orb/Delta/axon assignments should map onto the automaton mesh's states, transitions, and ports \u2014 the correspondence is asserted in the source but no unique mechanical assignment has been derived",
      status: "open",
      candidateTests: Object.freeze([
        "derive each candidate assignment from the state-space constants and compare transition-trace signatures across all 16 tools",
        "ablation: re-key the mesh ports by each candidate assignment and measure whether derivation hashes and routing receipts change"
      ])
    }),
    Object.freeze({
      id: "OQ-2",
      name: "DMS assignment",
      statement: "whether the DMS arc-second assignment of addresses carries predictive structure beyond the hash-candidate baseline",
      status: "open",
      linkedHypothesis: "H3"
    }),
    Object.freeze({
      id: "OQ-3",
      name: "Space discrepancy",
      statement: "the Being/Movement interrogative conflict (GateLocus vs factory/SynthiaOS) resolved to majority mapping; whether Space participates in transformation formulae remains open",
      status: "open",
      linkedHypothesis: "H4"
    })
  ]);
  var QuestionRegistry = class {
    constructor(questions = OPEN_QUESTIONS) {
      this._questions = /* @__PURE__ */ new Map();
      this._seq = 0;
      for (const q of questions || []) this.add(q);
    }
    /**
     * Register a question. id defaults to the next OQ-N. Unknown extra fields
     * are preserved; status defaults to 'open'.
     */
    add(question = {}) {
      if (typeof question !== "object" || question === null) {
        throw new TypeError("QuestionRegistry.add requires a question object");
      }
      const id = question.id || `OQ-${this._questions.size + 1}`;
      if (this._questions.has(id)) {
        throw new Error(`Duplicate question id: ${id}`);
      }
      if (typeof question.name !== "string" || !question.name) {
        throw new TypeError("Question requires a name");
      }
      if (typeof question.statement !== "string" || !question.statement) {
        throw new TypeError("Question requires a statement");
      }
      const record = Object.freeze({
        id,
        name: question.name,
        statement: question.statement,
        status: question.status || "open",
        ...question.candidateTests ? { candidateTests: Object.freeze([...question.candidateTests]) } : {},
        ...question.linkedHypothesis ? { linkedHypothesis: question.linkedHypothesis } : {},
        addedSeq: ++this._seq
      });
      this._questions.set(id, record);
      return record;
    }
    get(id) {
      return this._questions.get(id) || null;
    }
    /**
     * Resolve a question — evidence is mandatory: a question is closed by a
     * derivation/experiment/artifact id, never by declaration.
     */
    resolve(id, evidenceId) {
      if (evidenceId === null || evidenceId === void 0 || evidenceId === "") {
        throw new TypeError("QuestionRegistry.resolve requires an evidenceId (derivation/experiment/artifact id)");
      }
      const record = this._questions.get(id);
      if (!record) throw new Error(`Unknown question id: ${id}`);
      if (record.status === "resolved") {
        throw new Error(`Question ${id} is already resolved (evidence: ${record.evidenceId})`);
      }
      const resolved = Object.freeze({
        ...record,
        status: "resolved",
        evidenceId,
        resolvedSeq: ++this._seq
      });
      this._questions.set(id, resolved);
      return resolved;
    }
    /** All questions, or only those with the given status ({status:'open'}). */
    list({ status = null } = {}) {
      const all = [...this._questions.values()];
      return status ? all.filter((q) => q.status === status) : all;
    }
    /** JSON-safe snapshot: questions plus open/resolved counts. */
    export() {
      const all = this.list();
      return {
        questions: all.map((q) => ({ ...q })),
        open: all.filter((q) => q.status === "open").length,
        resolved: all.filter((q) => q.status === "resolved").length
      };
    }
  };

  // src/experiments/relational-capability.js
  var Q = Object.freeze({
    text: "Given six binary lines [1,0,0,0,1,0] and the transform 'shadow', produce a spoken-English description of the resulting hexagram.",
    lines: Object.freeze([1, 0, 0, 0, 1, 0]),
    transform: "shadow",
    changingLines: Object.freeze([])
  });
  var Q_PRIME = Object.freeze({
    text: "speak the result of an analogy A:B::C:? over vocab [male female young adult love hate light dark]",
    vocab: Object.freeze(["male", "female", "young", "adult", "love", "hate", "light", "dark"]),
    A: Object.freeze(["male"]),
    B: Object.freeze(["female"]),
    C: Object.freeze(["young"]),
    mode: "xor"
  });
  var SHUFFLE_SEED = 33040;
  function shuffledString(text, seed = SHUFFLE_SEED) {
    const chars = [...String(text)];
    const rand = mulberry32(seed);
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.join("");
  }
  function capability(output, target) {
    const text = typeof output === "string" ? output : output && typeof output.utterance === "string" ? output.utterance : null;
    if (text === null) return 0;
    const formatted = /\[weave:[a-z0-9-]+\]/i.test(text) || /(^|\n)\s*\d+\.\s+\S/.test(text);
    if (!formatted) return 0;
    if (!new RegExp(`(^|[^0-9])${target.gate}([^0-9]|$)`).test(text)) return 0;
    const lower = text.toLowerCase();
    for (const name of target.trigrams) {
      if (!lower.includes(String(name).toLowerCase())) return 0;
    }
    return 1;
  }
  function transferCapability(output, terms) {
    const text = typeof output === "string" ? output : output && typeof output.utterance === "string" ? output.utterance : null;
    if (text === null) return 0;
    const formatted = /\[weave:[a-z0-9-]+\]/i.test(text) || /(^|\n)\s*\d+\.\s+\S/.test(text);
    if (!formatted) return 0;
    const lower = text.toLowerCase();
    return terms.every((t) => lower.includes(String(t).toLowerCase())) ? 1 : 0;
  }
  var LEDGER_FIELDS = [
    "primitivesActivated",
    "statesGenerated",
    "edgesTraversed",
    "operationsExecuted",
    "recursionDepth",
    "activeAutomata",
    "transitionCount"
  ];
  var RelationalCapabilityExperiment = class {
    constructor({ engine: engine2 } = {}) {
      if (!engine2 || !engine2.mesh) throw new TypeError("RelationalCapabilityExperiment requires {engine}");
      this.engine = engine2;
    }
    /**
     * Run all five conditions plus the transfer probe. Every tool run is
     * state-snapshot/restored so the experiment is side-effect free on the
     * automata (re-running it reproduces the identical report); packets cross
     * the real mesh (crossings are recorded — that is the point of R).
     */
    run() {
      const engine2 = this.engine;
      const A = engine2.mesh.get("iching-grammar");
      const B = engine2.mesh.get("conversation");
      const C = engine2.mesh.get("klein-analogy");
      if (!A || !B || !C) throw new Error("H10 requires iching-grammar, conversation and klein-analogy on the mesh");
      const ledger = Object.fromEntries(LEDGER_FIELDS.map((f) => [f, 0]));
      const derivationIds = [];
      let seq = 0;
      const runIsolated = (tool, input) => {
        const savedState = typeof tool.exportState === "function" ? tool.exportState() : null;
        const savedCalls = tool.calls;
        const savedLifecycle = tool.lifecycle;
        try {
          return tool.run(input, { experiment: "H10" });
        } finally {
          if (typeof tool.hydrate === "function") tool.hydrate(savedState);
          tool.calls = savedCalls;
          tool.lifecycle = savedLifecycle;
        }
      };
      const record = (condition, input, primitives, operators, output, evaluation, runLedgers) => {
        for (const l of runLedgers) {
          for (const f of LEDGER_FIELDS) ledger[f] += l && l[f] || 0;
        }
        const derivation = new Derivation({
          id: `h10-drv-${String(++seq).padStart(2, "0")}`,
          input,
          primitives,
          operators,
          output,
          evaluation,
          ledger: null
          // per-condition ledgers merged into the report ledger
        });
        derivationIds.push(derivation.id);
        return derivation;
      };
      const chainVia = (aTool, aInput, bTool, bText, { mutatePayload = null } = {}) => {
        const aRun = runIsolated(aTool, aInput);
        const payload = mutatePayload ? mutatePayload(aRun.output) : aRun.output;
        const packet = new StatePacket({
          id: `h10-pkt-${String(seq + 1).padStart(2, "0")}`,
          from: aTool.id,
          to: bTool.id,
          kind: "data",
          payload,
          derivationId: `h10-drv-${String(seq + 1).padStart(2, "0")}`
        });
        const receipt = engine2.mesh.route(packet);
        const bRun = runIsolated(bTool, { text: bText, packet });
        return { aRun, bRun, packet, receipt, ledgers: [aRun.ledger, bRun.ledger] };
      };
      const aOnly = runIsolated(A, { lines: [...Q.lines], transform: Q.transform, changingLines: [...Q.changingLines] });
      const target = Object.freeze({
        gate: aOnly.output.transformed.gate,
        trigrams: Object.freeze([aOnly.output.transformed.lower.name, aOnly.output.transformed.upper.name])
      });
      const rA = capability(aOnly.output, target);
      record("A-alone", Q.text, [A.id], ["o_automaton"], { capability: rA }, { accepted: aOnly.accepted }, [aOnly.ledger]);
      const bOnly = runIsolated(B, { text: Q.text });
      const rB = capability(bOnly.output, target);
      record("B-alone", Q.text, [B.id], ["o_automaton"], { capability: rB }, { accepted: bOnly.accepted }, [bOnly.ledger]);
      const nrA = runIsolated(A, { lines: [...Q.lines], transform: Q.transform, changingLines: [...Q.changingLines] });
      const nrB = runIsolated(B, { text: Q.text });
      const concatenated = `${JSON.stringify(nrA.output)}
${nrB.output.utterance}`;
      const rNoRelation = capability(concatenated, target);
      record(
        "no-relation",
        Q.text,
        [A.id, B.id],
        ["o_automaton"],
        { capability: rNoRelation },
        { accepted: nrA.accepted && nrB.accepted },
        [nrA.ledger, nrB.ledger]
      );
      const shuffledRun = chainVia(
        A,
        { lines: [...Q.lines], transform: Q.transform, changingLines: [...Q.changingLines] },
        B,
        Q.text,
        { mutatePayload: (payload) => shuffledString(JSON.stringify(payload)) }
      );
      const rShuffled = capability(shuffledRun.bRun.output, target);
      record(
        "shuffled-relation",
        Q.text,
        [A.id, B.id],
        ["o_automaton", "o_sequence"],
        { capability: rShuffled },
        { accepted: shuffledRun.bRun.accepted, delivered: shuffledRun.receipt.delivered },
        shuffledRun.ledgers
      );
      const chain = chainVia(
        A,
        { lines: [...Q.lines], transform: Q.transform, changingLines: [...Q.changingLines] },
        B,
        Q.text
      );
      const rChain = capability(chain.bRun.output, target);
      record(
        "chain",
        Q.text,
        [A.id, B.id],
        ["o_automaton", "o_sequence"],
        { capability: rChain },
        { accepted: chain.bRun.accepted, delivered: chain.receipt.delivered },
        chain.ledgers
      );
      const results = { A: rA, B: rB, noRelation: rNoRelation, shuffled: rShuffled, chain: rChain };
      const transfer = chainVia(C, {
        vocab: [...Q_PRIME.vocab],
        A: [...Q_PRIME.A],
        B: [...Q_PRIME.B],
        C: [...Q_PRIME.C],
        mode: Q_PRIME.mode
      }, B, Q_PRIME.text);
      const transferTerms = transfer.aRun.output && Array.isArray(transfer.aRun.output.result) ? [...transfer.aRun.output.result] : [];
      const transferResult = transferCapability(transfer.bRun.output, transferTerms);
      record(
        "transfer",
        Q_PRIME.text,
        [C.id, B.id],
        ["o_automaton", "o_sequence"],
        { capability: transferResult },
        { accepted: transfer.bRun.accepted, delivered: transfer.receipt.delivered },
        transfer.ledgers
      );
      let interpretation;
      let reason;
      if (rChain === 1 && rA === 0 && rB === 0 && rNoRelation === 0 && rShuffled === 0) {
        interpretation = "supported";
        reason = "chain=1 with every baseline and control at 0: the sequential packet relation created a capability neither automaton possesses alone.";
      } else if (rChain === 0) {
        interpretation = "rejected";
        reason = "chain=0: the relation did not create the capability (predicate untouched; the plumbing is what would need fixing).";
      } else {
        interpretation = "inconclusive";
        const leaked = [["A", rA], ["B", rB], ["noRelation", rNoRelation], ["shuffled", rShuffled]].filter(([, v]) => v === 1).map(([k]) => k);
        reason = `chain=1 but capability also present without the relation in: ${leaked.join(", ")}.`;
      }
      return {
        hypothesis: "H10",
        statement: "a relationship R creates a capability neither automaton possesses alone",
        Q: Q.text,
        A: A.id,
        B: B.id,
        target,
        results,
        transfer: {
          C: C.id,
          D: B.id,
          "Q'": Q_PRIME.text,
          result: transferResult,
          analogyResult: transferTerms,
          note: transferResult === 1 ? "the same relational operator (sequential packet channel) transfers to novel operands (klein-analogy \u2192 conversation)." : "transfer did not achieve the capability on novel operands \u2014 reported as observed."
        },
        artifacts: {
          chainUtterance: chain.bRun.output.utterance,
          shuffledUtterance: shuffledRun.bRun.output.utterance,
          noRelationConcatenation: concatenated
        },
        interpretation,
        reason,
        derivationIds,
        ledger
      };
    }
  };

  // src/engine/synthia.js
  var SynthiaAutomata = class _SynthiaAutomata {
    constructor() {
      this.mesh = new AutomataMesh();
      this.tools = createAllTools();
      this.toolsById = /* @__PURE__ */ new Map();
      for (const automaton of this.tools) {
        this.mesh.register(automaton);
        this.toolsById.set(automaton.id, automaton);
      }
      for (let k = 0; k < this.tools.length; k++) {
        const from = this.tools[k];
        const to = this.tools[(k + 1) % this.tools.length];
        this.mesh.connect(from.id, to.id, { outputPort: "output", inputPort: "input" });
      }
      this.runtime = {
        derivationCounter: 0,
        packetCounter: 0,
        callCount: 0,
        derivations: []
      };
      this.tripleStore = new TripleStore();
      this.channels = new EmergentChannels({ mesh: this.mesh });
      this.mesh.channels = this.channels;
      this.questions = new QuestionRegistry(OPEN_QUESTIONS);
      const intakeGate = new IntakeGate({ engine: this });
      this.intakeGate = intakeGate;
      this.intake = Object.assign(
        (X, context = {}) => intakeGate.intake(X, context),
        {
          gate: intakeGate,
          exportHistory: () => intakeGate.exportHistory(),
          get history() {
            return intakeGate.history;
          }
        }
      );
      this.learning = new LearningOrchestrator({
        engine: this,
        intake: intakeGate,
        factory: new ToolFactory(),
        router: new DimensionRouter()
      });
      this.learning.growBootMediaField();
      for (const automaton of this.mesh.automata.values()) {
        this.tripleStore.addAll(toolOntology(automaton));
      }
    }
    /** The learning front door: request(text) -> LearningResult (async). */
    request(text, context = {}) {
      return this.learning.request(text, context);
    }
    /** Tools grown at runtime (including the boot-grown 'media-field'). */
    grownTools() {
      return this.learning.grownTools();
    }
    /** Registry overview: id, gate, dimension, capabilities, automatonForm. */
    listTools() {
      return TOOL_REGISTRY.map((entry) => ({
        id: entry.id,
        gate: entry.gate,
        dimension: entry.dimension,
        capabilities: entry.capabilities,
        automatonForm: entry.automatonForm
      }));
    }
    /** Per-projection mesh metrics { nodes, edges, avgDegree }. */
    meshMetrics() {
      return this.mesh.metrics();
    }
    /** Semantic-triple query passthrough: engine.triples({subject?, predicate?, object?}). */
    triples(query = {}) {
      return this.tripleStore.query(query);
    }
    /** All triples whose subject is the given tool id (its ontology + productions). */
    toolTriples(toolId) {
      return this.tripleStore.bySubject(toolId);
    }
    /** Persistent emergent channels: crossings promoted by repeated use (>= 3). */
    emergentChannels() {
      return this.channels.promoted();
    }
    /** The composite capability of a promoted channel, or null while temporary. */
    channelCapability(aId, bId) {
      return this.channels.emergentCapability(aId, bId);
    }
    /**
     * H10 — the decisive relational-capability experiment (pre-registered in
     * src/experiments/relational-capability.js): does the sequential packet
     * relation create a capability neither automaton possesses alone?
     * Returns the full report {hypothesis, results, transfer, interpretation, …}.
     */
    runRelationalExperiment() {
      return new RelationalCapabilityExperiment({ engine: this }).run();
    }
    /**
     * Execute a tool-call chain.
     *   call('klein-analogy "a:b::c:?" --depth=2 at 41.2 then morph-mir')
     * Returns a Derivation whose output is the last call's output.
     */
    call(input, context = {}) {
      const addressed = this.intakeGate.intake(input, context);
      const parsed = parseChain(input);
      const ledger = new ComplexityLedger();
      const derivationId = `drv-${String(++this.runtime.derivationCounter).padStart(4, "0")}`;
      this.runtime.callCount++;
      const chainResults = [];
      let previousPacket = null;
      for (let k = 0; k < parsed.calls.length; k++) {
        const call = parsed.calls[k];
        const next = parsed.calls[k + 1] || null;
        const automaton = this.toolsById.get(call.tool);
        if (!automaton) {
          throw new Error(`No automaton registered for tool '${call.tool}'`);
        }
        const runInput = {
          args: call.args,
          address: call.address,
          flags: call.flags,
          raw: call.raw,
          packet: previousPacket
        };
        const result = automaton.run(runInput, context);
        ledger.merge(result && result.ledger ? result.ledger : {});
        const asserted = this.tripleStore.addAll(runTriples({
          toolId: call.tool,
          input: { args: call.args, flags: call.flags, address: call.address, raw: call.raw },
          output: result.output,
          derivationId,
          trace: result.trace
        }));
        const produced = asserted.find((t) => t.predicate === "produced" && t.subject === call.tool);
        automaton.absorbExperience({
          derivationId,
          intakeId: addressed.id,
          outputHash: produced ? produced.object : null,
          seq: this.runtime.callCount
        });
        let packet = null;
        let receipt = null;
        if (next) {
          packet = new StatePacket({
            id: `pkt-${String(++this.runtime.packetCounter).padStart(4, "0")}`,
            from: call.tool,
            to: next.tool,
            kind: "data",
            payload: result.output,
            address: call.address,
            derivationId
          });
          receipt = this.mesh.route(packet);
        }
        chainResults.push({
          tool: call.tool,
          args: call.args,
          address: call.address,
          flags: call.flags,
          raw: call.raw,
          output: result.output,
          trace: result.trace,
          accepted: result.accepted,
          finalState: result.finalState,
          routed: next ? true : false,
          receipt
        });
        previousPacket = packet;
      }
      const last = chainResults[chainResults.length - 1] || null;
      const transitions = [
        ...new Set(
          chainResults.flatMap((r) => Array.isArray(r.trace) ? r.trace : []).map((step) => step && step.transition).filter(Boolean)
        )
      ];
      const derivation = new Derivation({
        id: derivationId,
        intakeId: addressed.id,
        // the intake's own Derivation id (intake-N)
        input,
        parse: {
          chainLength: parsed.chainLength,
          calls: parsed.calls.map((c) => c.ast)
        },
        primitives: parsed.calls.map((c) => c.tool),
        operators: parsed.chainLength > 1 ? ["o_automaton", "o_sequence"] : ["o_automaton"],
        relations: chainResults.slice(0, -1).map((r, k) => ({
          from: r.tool,
          to: chainResults[k + 1].tool,
          relation: "chain",
          operator: "o_sequence"
        })),
        context,
        transforms: transitions,
        output: last ? last.output : null,
        evaluation: {
          derivationIntegrity: 1,
          // DI = 1 required (spec §12)
          chainLength: parsed.chainLength,
          accepted: chainResults.every((r) => r.accepted !== false)
        },
        ledger: ledger.toJSON(),
        chainResults,
        timestamp: Date.now()
        // excluded from the derivation hash
      });
      this.runtime.derivations.push(derivation);
      return derivation;
    }
    /**
     * Deterministic replay (spec §12): same (state, input, context,
     * grammarVersion, operatorVersion) → identical derivation hash.
     *
     * "Same state" is reconstructed, not assumed: when this engine recorded the
     * derivation, its full input history prefix is re-run on a fresh engine so
     * counter-derived ids and tool owned state evolve identically before the
     * replayed call fires. Foreign derivations (no recorded history here)
     * replay from genesis state.
     */
    replay(derivationJSON) {
      const original = typeof derivationJSON === "string" ? JSON.parse(derivationJSON) : derivationJSON;
      const fresh = new _SynthiaAutomata();
      const historyIndex = this.runtime.derivations.findIndex((d) => d.id === original.id);
      let replayed;
      if (historyIndex >= 0) {
        for (let k = 0; k <= historyIndex; k++) {
          const prior = this.runtime.derivations[k];
          replayed = fresh.call(prior.input, prior.context || {});
        }
      } else {
        replayed = fresh.call(original.input, original.context || {});
      }
      const hashMatch = replayed.hash === original.hash;
      return {
        status: hashMatch ? "REPRODUCED" : "MISMATCH",
        hashMatch,
        original: original.hash,
        replayed: replayed.hash
      };
    }
  };

  // src/merged/index.js
  var merged_exports = {};
  __export(merged_exports, {
    AUTOMATON_BNF: () => AUTOMATON_BNF,
    AnticipatoryMemory: () => AnticipatoryMemory,
    ArtifactWriter: () => ArtifactWriter,
    CANONICAL_CHANNELS: () => CANONICAL_CHANNELS,
    CENTERS: () => CENTERS,
    CENTER_NAMES: () => CENTER_NAMES,
    CodeWeaver: () => CodeWeaver,
    DIMENSION_LADDERS: () => DIMENSION_LADDERS,
    DIMENSION_VOCABULARIES: () => DIMENSION_VOCABULARIES,
    DimensionRouter: () => DimensionRouter,
    FORBIDDEN_PRIVATE_KEYS: () => FORBIDDEN_PRIVATE_KEYS,
    FUXI_DECIMAL_TO_KING_WEN: () => FUXI_DECIMAL_TO_KING_WEN2,
    FactoryError: () => FactoryError,
    FuxiEncoder: () => FuxiEncoder,
    GIF_PALETTE: () => GIF_PALETTE,
    GRAMMAR_RULES: () => GRAMMAR_RULES,
    GateLocus: () => GateLocus,
    GateProcessField: () => GateProcessField,
    KING_WEN_HEXAGRAM_NAMES: () => KING_WEN_HEXAGRAM_NAMES,
    KING_WEN_TO_FUXI_DECIMAL: () => KING_WEN_TO_FUXI_DECIMAL2,
    LAWFUL_INVARIANTS: () => LAWFUL_INVARIANTS,
    LawfulGrammarConstructor: () => LawfulGrammarConstructor,
    MediaField: () => MediaField,
    MediaLocus: () => MediaLocus,
    OPERATION_LEVEL_FALLBACK: () => OPERATION_LEVEL_FALLBACK,
    SceneGrammar: () => SceneGrammar,
    SceneGrammarRule: () => SceneGrammarRule,
    TOOL_LEVELS: () => TOOL_LEVELS,
    ToolFactory: () => ToolFactory,
    VideoTimeline: () => VideoTimeline,
    WEIGHT_MAX: () => WEIGHT_MAX,
    WEIGHT_MIN: () => WEIGHT_MIN,
    centerForGate: () => centerForGate,
    channelPartners: () => channelPartners,
    channelsForGate: () => channelsForGate,
    completeAnalogy: () => completeAnalogy,
    createNode: () => createNode,
    decodePattern: () => decodePattern,
    encodeBMP: () => encodeBMP,
    encodeGIF: () => encodeGIF,
    encodeIndex: () => encodeIndex,
    flipLine: () => flipLine,
    fnv1a32Bytes: () => fnv1a32Bytes,
    frameHash: () => frameHash,
    fuXiDecimalToGate: () => fuXiDecimalToGate,
    gatePattern: () => gatePattern,
    gateToFuXiDecimal: () => gateToFuXiDecimal,
    getAllStates: () => getAllStates,
    getInverse: () => getInverse,
    getNeighbors: () => getNeighbors,
    getOpposite: () => getOpposite,
    hammingDistance: () => hammingDistance,
    hammingStr: () => hammingStr,
    hexagramName: () => hexagramName,
    initializeAllNodes: () => initializeAllNodes,
    lzwEncodeGIF: () => lzwEncodeGIF,
    mediaHash: () => mediaHash,
    popcount6: () => popcount6,
    publicAddress: () => publicAddress,
    selfTest: () => selfTest,
    solveAnalogy: () => solveAnalogy,
    stableId: () => stableId,
    strongEquivalence: () => strongEquivalence,
    xnorBits: () => xnorBits2,
    xorBits: () => xorBits2
  });

  // src/merged/ato-analogy.js
  var WIDTH = 6;
  function toBits(value, width = WIDTH) {
    if (typeof value === "number") {
      if (!Number.isInteger(value) || value < 0 || value >= 2 ** width) {
        throw new RangeError(`Expected integer 0..${2 ** width - 1}, received ${value}`);
      }
      return value.toString(2).padStart(width, "0").split("").map(Number);
    }
    if (Array.isArray(value) || ArrayBuffer.isView(value)) {
      const bits = [...value].map((bit) => {
        if (bit === true || bit === 1 || bit === "1") return 1;
        if (bit === false || bit === 0 || bit === "0") return 0;
        throw new TypeError(`Expected bit, received ${String(bit)}`);
      });
      if (bits.length !== width) throw new RangeError(`Expected ${width} bits, received ${bits.length}`);
      return bits;
    }
    if (typeof value === "string") return toBits(value.split("").map(Number), width);
    throw new TypeError("Expected number, bit string, or bit array");
  }
  function bitsToNumber(bits) {
    return bits.reduce((n, bit) => n << 1 | bit, 0);
  }
  function xnorBits2(a, b) {
    const aa = toBits(a, a.length ?? WIDTH);
    const bb = toBits(b, aa.length);
    return Object.freeze(aa.map((bit, i) => bit ^ bb[i] ^ 1));
  }
  function xorBits2(a, b) {
    const aa = toBits(a, a.length ?? WIDTH);
    const bb = toBits(b, aa.length);
    return Object.freeze(aa.map((bit, i) => bit ^ bb[i]));
  }
  function completeAnalogy(a, b, c) {
    const allNumeric = [a, b, c].every((v) => typeof v === "number");
    const relation = xnorBits2(toBits(a), toBits(b));
    const result = xnorBits2(toBits(c), relation);
    return allNumeric ? bitsToNumber(result) : result;
  }
  function strongEquivalence(strA, strB) {
    const a = String(strA);
    const b = String(strB);
    if (a.length !== b.length) throw new Error("length mismatch");
    let out = "";
    for (let i = 0; i < a.length; i++) out += a[i] === b[i] ? "1" : "0";
    return out;
  }
  function solveAnalogy(X, Y, Z) {
    return strongEquivalence(Z, strongEquivalence(X, Y));
  }
  function hammingStr(a, b) {
    const aa = String(a);
    const bb = String(b);
    if (aa.length !== bb.length) throw new Error("length mismatch");
    let dist = 0;
    for (let i = 0; i < aa.length; i++) if (aa[i] !== bb[i]) dist++;
    return dist;
  }
  function selfTest() {
    const X = "10101010";
    const Y = "01100110";
    const Z = "01010101";
    const solved = solveAnalogy(X, Y, Z);
    if (solved !== "10011001") return false;
    const numeric = completeAnalogy(
      parseInt(X.slice(2), 2),
      parseInt(Y.slice(2), 2),
      parseInt(Z.slice(2), 2)
    );
    if (numeric !== parseInt(solved.slice(2), 2)) return false;
    if (completeAnalogy(42, 25, 25) !== 42) return false;
    if (hammingStr(X, Y) !== 4) return false;
    if (hammingStr(solved, "10011001") !== 0) return false;
    const xn = xnorBits2([1, 0, 1], [1, 1, 0]);
    if (xn.join("") !== "100") return false;
    const xr = xorBits2([1, 0, 1], [1, 1, 0]);
    if (xr.join("") !== "011") return false;
    return true;
  }
  var ato_analogy_default = Object.freeze({
    xnorBits: xnorBits2,
    xorBits: xorBits2,
    completeAnalogy,
    strongEquivalence,
    solveAnalogy,
    hammingStr,
    selfTest
  });

  // src/merged/fuxi-encoder.js
  var LINE_COUNT = 6;
  var STATE_COUNT = 64;
  function encodeIndex(index) {
    if (!Number.isInteger(index) || index < 0 || index >= STATE_COUNT) {
      throw new Error(`Index ${index} out of range [0, ${STATE_COUNT})`);
    }
    return index.toString(2).padStart(LINE_COUNT, "0");
  }
  function decodePattern(pattern) {
    if (typeof pattern !== "string" || pattern.length !== LINE_COUNT || !/^[01]+$/.test(pattern)) {
      throw new Error(`Invalid pattern: ${pattern}`);
    }
    return parseInt(pattern, 2);
  }
  function flipLine(pattern, lineIndex) {
    const chars = decodePattern(pattern) >= 0 ? pattern.split("") : null;
    if (lineIndex < 0 || lineIndex >= LINE_COUNT) throw new Error(`Invalid line index: ${lineIndex}`);
    chars[lineIndex] = chars[lineIndex] === "0" ? "1" : "0";
    return chars.join("");
  }
  function hammingDistance(a, b) {
    if (String(a).length !== String(b).length) throw new Error("Pattern length mismatch");
    let dist = 0;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) dist++;
    return dist;
  }
  function getNeighbors(pattern, distance = 1) {
    decodePattern(pattern);
    const results = [];
    for (let i = 0; i < STATE_COUNT; i++) {
      const other = encodeIndex(i);
      if (other !== pattern && hammingDistance(pattern, other) === distance) results.push(other);
    }
    return results;
  }
  function getOpposite(pattern) {
    decodePattern(pattern);
    return pattern.split("").map((c) => c === "0" ? "1" : "0").join("");
  }
  function getInverse(pattern) {
    decodePattern(pattern);
    return pattern.split("").reverse().join("");
  }
  function getAllStates() {
    return Array.from({ length: STATE_COUNT }, (_, i) => encodeIndex(i));
  }
  function createNode(index, { circuitFamily = null, channelModes = [] } = {}) {
    const pattern = encodeIndex(index);
    const lines = pattern.split("").map((c) => c === "1" ? 1 : 0);
    return {
      id: `node-${index}`,
      binaryPattern: pattern,
      operators: { being: 0.5, design: 0.5, movement: 0.5, evolution: 0.5, space: 0.5 },
      binaryState: lines[5],
      lines,
      activeLine: 1,
      regime: "latent",
      tension: 0,
      activation: 0,
      attractorWeight: 0,
      memoryGravity: 0,
      recursionDepth: 0,
      circuitFamily,
      channelModes: [...channelModes],
      observerContext: {
        id: `ctx-${index}`,
        perspective: "default",
        scale: 1,
        dimensions: ["binary", "gate"]
      },
      activationHistory: [],
      semanticState: {
        center: [],
        central: [],
        peripheral: [],
        rejected: [],
        examples: [],
        revisionHistory: [],
        coherenceScore: 0
      },
      provenance: [{
        id: `prov-node-${index}`,
        category: "native",
        source: "FuxiEncoder",
        description: `Auto-generated from binary index ${index}`
      }]
    };
  }
  function initializeAllNodes() {
    const map = /* @__PURE__ */ new Map();
    for (let i = 0; i < STATE_COUNT; i++) {
      const node = createNode(i);
      map.set(node.id, node);
    }
    return map;
  }
  var FuxiEncoder = class {
    static get LINE_COUNT() {
      return LINE_COUNT;
    }
    static get STATE_COUNT() {
      return STATE_COUNT;
    }
    static encodeIndex(i) {
      return encodeIndex(i);
    }
    static decodePattern(p) {
      return decodePattern(p);
    }
    static flipLine(p, i) {
      return flipLine(p, i);
    }
    static hammingDistance(a, b) {
      return hammingDistance(a, b);
    }
    static getNeighbors(p, d = 1) {
      return getNeighbors(p, d);
    }
    static getOpposite(p) {
      return getOpposite(p);
    }
    static getInverse(p) {
      return getInverse(p);
    }
    static getAllStates() {
      return getAllStates();
    }
    static createNode(i, opts) {
      return createNode(i, opts);
    }
    static initializeAllNodes() {
      return initializeAllNodes();
    }
  };

  // src/merged/scene-grammar.js
  var clamp3 = (n, min = 0, max = 1) => Math.max(min, Math.min(max, Number(n) || 0));
  var clone4 = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
  var WEIGHT_MIN = 0.05;
  var WEIGHT_MAX = 8;
  var SceneGrammarRule = class {
    constructor({ id, type, weight = 1, condition = {}, action = {} }) {
      if (!id) throw new Error("SceneGrammarRule requires an id");
      this.id = id;
      this.type = type || "generic";
      this.weight = clamp3(Number(weight), WEIGHT_MIN, WEIGHT_MAX) || WEIGHT_MIN;
      this.condition = {
        minEntities: condition.minEntities,
        maxEntities: condition.maxEntities,
        minTension: condition.minTension,
        maxTension: condition.maxTension,
        tickModulo: condition.tickModulo
      };
      this.action = clone4(action) || {};
      this.uses = 0;
      this.success = { count: 0, mean: 0.5 };
    }
    /** True when every specified condition bound holds for the context. */
    matches(context = {}) {
      const c = this.condition;
      const entities = Number(context.entityCount ?? context.entities ?? 0);
      const tension = Number(context.tension ?? 0);
      const tick = Number(context.tick ?? 0);
      if (Number.isFinite(c.minEntities) && entities < c.minEntities) return false;
      if (Number.isFinite(c.maxEntities) && entities > c.maxEntities) return false;
      if (c.minTension != null && tension < c.minTension) return false;
      if (c.maxTension != null && tension > c.maxTension) return false;
      if (c.tickModulo && tick % c.tickModulo !== 0) return false;
      return true;
    }
    /**
     * Reinforcement: tracks an exponentially-weighted success mean and nudges
     * weight by (reward - 0.5) * 0.25, hard-clamped to [0.05, 8].
     */
    reinforce(reward, alpha = 0.18) {
      const score = clamp3(Number(reward));
      const current = this.success;
      current.mean = current.count === 0 ? score : current.mean + alpha * (score - current.mean);
      current.count += 1;
      this.weight = clamp3(this.weight + (score - 0.5) * 0.25, WEIGHT_MIN, WEIGHT_MAX);
      return { mean: current.mean, count: current.count, weight: this.weight };
    }
    /** Effective selection weight: base weight modulated by learned success. */
    effectiveWeight() {
      return this.weight * (0.6 + this.success.mean * 0.8);
    }
    snapshot() {
      return {
        id: this.id,
        type: this.type,
        weight: this.weight,
        condition: clone4(this.condition),
        action: clone4(this.action),
        uses: this.uses,
        success: { ...this.success }
      };
    }
  };
  var SceneGrammar = class {
    constructor() {
      this.rules = /* @__PURE__ */ new Map();
      this.history = [];
    }
    addRule(spec) {
      if (this.rules.has(spec.id)) throw new Error(`Duplicate grammar rule: ${spec.id}`);
      const rule = new SceneGrammarRule(spec);
      this.rules.set(rule.id, rule);
      return rule;
    }
    /** Matching rules with their effective weights, best first. */
    eligibleRules(context = {}) {
      return [...this.rules.values()].filter((rule) => rule.matches(context)).map((rule) => ({ rule, effectiveWeight: rule.effectiveWeight() })).sort((a, b) => b.effectiveWeight - a.effectiveWeight);
    }
    /** Best matching rule for the context, or null when nothing matches. */
    select(context = {}) {
      const eligible = this.eligibleRules(context);
      if (!eligible.length) return null;
      const picked = eligible[0].rule;
      picked.uses += 1;
      this.history.push({ tick: Number(context.tick ?? 0), ruleId: picked.id, effectiveWeight: eligible[0].effectiveWeight });
      return picked;
    }
    /** Reinforce a rule by id; returns its post-update record, or null if unknown. */
    reinforce(id, reward) {
      const rule = this.rules.get(id);
      if (!rule) return null;
      return { id, ...rule.reinforce(reward) };
    }
    snapshot() {
      return { rules: [...this.rules.values()].map((r) => r.snapshot()), history: [...this.history] };
    }
  };

  // src/merged/gate-field.js
  var clamp4 = (n, min = 0, max = 1) => Math.max(min, Math.min(max, Number(n) || 0));
  var clone5 = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
  var mean = (a) => a.length ? a.reduce((s, n) => s + n, 0) / a.length : 0;
  var DIMENSION_LADDERS = Object.freeze({
    Movement: Object.freeze(["wait", "prepare", "move", "transition"]),
    Evolution: Object.freeze(["retain", "notice-change", "adapt", "transform"]),
    Being: Object.freeze(["remain-self", "notice-other", "relate", "negotiate-relation"]),
    Design: Object.freeze(["sense", "classify", "build", "test", "mount"]),
    Space: Object.freeze(["witness", "integrate", "express", "complete"])
  });
  var HISTORY_LIMIT = 24;
  var pickRung = (ladder, activation) => ladder[Math.min(ladder.length - 1, Math.floor(clamp4(activation) * ladder.length))];
  var signature = (v) => v.reduce((s, b, i) => s + (b ? 2 ** i : 0), 0);
  var hamming2 = (a, b) => a.reduce((d, bit, i) => d + (bit !== b[i] ? 1 : 0), 0);
  var _GateLocus_instances, empty_fn, structure_fn;
  var GateLocus = class {
    constructor(gate) {
      __privateAdd(this, _GateLocus_instances);
      if (!Number.isInteger(gate) || gate < 1 || gate > 64) throw new RangeError("gate 1..64 required");
      this.gate = gate;
      this.address = { mode: "macro", gate, line: 1, color: 1, tone: 1, base: 1 };
      this.vector = [...gatePattern(gate)];
      this.structuralSignature = signature(this.vector);
      this.observations = 0;
      this.lastTick = null;
      this.lastInputKey = null;
      this.history = [];
      this.dimensions = {};
      for (const d of DIMENSIONS) this.dimensions[d] = __privateMethod(this, _GateLocus_instances, empty_fn).call(this, d);
    }
    /**
     * Observe one tick of context. ctx:
     * {tick, inputKey, activeGate, resonance (0..1 or {dimension:0..1}), changed, pulses}.
     * External resonance is blended into each of the five dimensions locally.
     */
    observe(ctx = {}) {
      const tick = Number(ctx.tick ?? this.observations + 1);
      const inputKey = ctx.inputKey ?? null;
      const changed = Boolean(this.lastInputKey && inputKey && this.lastInputKey !== inputKey);
      const isAddressed = this.gate === Number(ctx.activeGate || 0);
      const structure = __privateMethod(this, _GateLocus_instances, structure_fn).call(this);
      const resonance = ctx.resonance ?? 0;
      const next = {};
      for (const d of DIMENSIONS) {
        const r = typeof resonance === "object" && resonance !== null ? clamp4(resonance[d] ?? 0) : clamp4(resonance);
        const changedBonus = (d === "Evolution" || d === "Movement") && changed ? 0.1 : 0;
        const activation = clamp4(structure[d] * 0.4 + r * 0.4 + (isAddressed ? 0.2 : 0) + changedBonus);
        const prior = this.dimensions[d];
        next[d] = {
          dimension: d,
          question: DIMENSION_META[d].interrogative,
          activation,
          choice: pickRung(DIMENSION_LADDERS[d], activation),
          changedChoice: Boolean(prior && prior.choice !== "quiet" && prior.choice !== pickRung(DIMENSION_LADDERS[d], activation)),
          evidence: { structure: structure[d], resonance: r, isAddressed, changed },
          observedAt: tick
        };
      }
      this.observations++;
      this.lastTick = tick;
      this.lastInputKey = inputKey;
      this.dimensions = next;
      const activity = Math.max(...DIMENSIONS.map((d) => next[d].activation));
      this.history.push({
        at: tick,
        inputKey,
        activity,
        choices: Object.fromEntries(DIMENSIONS.map((d) => [d, next[d].choice]))
      });
      if (this.history.length > HISTORY_LIMIT) this.history.shift();
      return this.snapshot({ activity, isAddressed });
    }
    /**
     * Meet another locus. The relation is Hamming-derived from the two 6-bit
     * vectors and never erases either participant.
     * -> {pair:'G{a}:G{b}', overlap, tension, hamming, participants}
     */
    meet(other) {
      const distance = hamming2(this.vector, other.vector);
      const overlap = (6 - distance) / 6;
      const tension = distance / 6;
      const a = Math.min(this.gate, other.gate);
      const b = Math.max(this.gate, other.gate);
      return {
        pair: `G${a}:G${b}`,
        kind: "subjective-relation-field",
        participants: [this.gate, other.gate],
        hamming: distance,
        overlap,
        tension,
        objectivities: {
          [this.gate]: { signature: this.structuralSignature },
          [other.gate]: { signature: other.structuralSignature }
        }
      };
    }
    snapshot(extra = {}) {
      const decisions = Object.fromEntries(DIMENSIONS.map((d) => [d, clone5(this.dimensions[d])]));
      const activity = extra.activity ?? Math.max(...DIMENSIONS.map((d) => Number(decisions[d]?.activation || 0)));
      return {
        gate: this.gate,
        address: { ...this.address },
        vector: [...this.vector],
        structuralSignature: this.structuralSignature,
        observations: this.observations,
        lastTick: this.lastTick,
        decisions,
        activity,
        active: Boolean(extra.isAddressed),
        history: this.history.slice(-8).map(clone5)
      };
    }
  };
  _GateLocus_instances = new WeakSet();
  empty_fn = function(d) {
    return { dimension: d, question: DIMENSION_META[d].interrogative, activation: 0, choice: "quiet", evidence: {}, observedAt: null };
  };
  structure_fn = function() {
    const chunks = [0, 1, 2, 3, 4].map((i) => mean(this.vector.filter((_, j) => j % 5 === i)));
    return { Movement: chunks[0], Evolution: chunks[1], Being: chunks[2], Design: chunks[3], Space: chunks[4] };
  };
  var GateProcessField = class {
    constructor() {
      this.loci = Array.from({ length: 64 }, (_, i) => new GateLocus(i + 1));
      this.tickCount = 0;
      this.relations = /* @__PURE__ */ new Map();
      this.last = null;
    }
    /** Live locus by gate number (1..64). */
    locus(gate) {
      const x = this.loci[Number(gate) - 1];
      if (!x) throw new RangeError("gate 1..64 required");
      return x;
    }
    /**
     * Advance the field one tick, blending external resonance into every locus's
     * five dimensions. externalState:
     * {activeGate?, resonance? (0..1 or per-dimension object), inputKey?, pulses?, changed?}
     * Returns a field view: active gates, per-dimension voices, top relations.
     */
    tick(externalState = {}) {
      this.tickCount += 1;
      const ctx = { ...externalState, tick: this.tickCount };
      const gates = this.loci.map((l) => l.observe(ctx));
      const active = [...gates].sort((a, b) => b.activity - a.activity || a.gate - b.gate).slice(0, 8);
      for (let i = 0; i < active.length; i++) {
        for (let j = i + 1; j < active.length; j++) {
          const relation = this.loci[active[i].gate - 1].meet(this.loci[active[j].gate - 1]);
          const previous = this.relations.get(relation.pair);
          this.relations.set(relation.pair, {
            ...relation,
            encounters: Number(previous?.encounters || 0) + 1,
            firstSeenAt: previous?.firstSeenAt ?? this.tickCount,
            lastSeenAt: this.tickCount
          });
        }
      }
      if (this.relations.size > 128) {
        const keep = [...this.relations.values()].sort((a, b) => b.lastSeenAt - a.lastSeenAt || (a.pair < b.pair ? -1 : 1)).slice(0, 128);
        this.relations = new Map(keep.map((x) => [x.pair, x]));
      }
      this.last = {
        type: "64-persistent-gate-process-field",
        tick: this.tickCount,
        activeGates: active.map((g) => g.gate),
        voices: this.voices(),
        relations: [...this.relations.values()].sort((a, b) => b.encounters - a.encounters || (a.pair < b.pair ? -1 : 1)).slice(0, 24)
      };
      return clone5(this.last);
    }
    /** All 2016 pairwise relations between loci (Hamming-derived), sorted by pair id. */
    meetAll() {
      const out = [];
      for (let i = 0; i < 64; i++) {
        for (let j = i + 1; j < 64; j++) out.push(this.loci[i].meet(this.loci[j]));
      }
      return out.sort((a, b) => a.pair < b.pair ? -1 : 1);
    }
    /**
     * Voice aggregation per dimension: how many loci are engaged (activation > .45),
     * the choice histogram, and the strongest gates. A view, not a command channel.
     */
    voices() {
      const out = {};
      for (const dim of DIMENSIONS) {
        const ranked = [...this.loci].sort((a, b) => b.dimensions[dim].activation - a.dimensions[dim].activation || a.gate - b.gate);
        const engaged = ranked.filter((g) => g.dimensions[dim].activation > 0.45);
        const choices = {};
        for (const g of engaged) choices[g.dimensions[dim].choice] = (choices[g.dimensions[dim].choice] || 0) + 1;
        out[dim] = {
          question: DIMENSION_META[dim].interrogative,
          activation: ranked[0]?.dimensions[dim].activation || 0,
          voices: engaged.length,
          strongest: ranked.slice(0, 5).map((g) => g.gate),
          choices
        };
      }
      return out;
    }
    snapshot() {
      return this.last ? clone5(this.last) : null;
    }
  };

  // src/merged/lawful-grammar.js
  var LAWFUL_INVARIANTS = Object.freeze([
    "preserve-local-identity",
    "no-claim-without-evidence",
    "reversible-before-adoption",
    "no-global-boss"
  ]);
  var AUTOMATON_BNF = "<automaton> \u2192 <observer> <choice> <transition> <memory> <expression>";
  var GRAMMAR_RULES = Object.freeze({
    "<automaton>": Object.freeze(["<observer> <choice> <transition> <memory> <expression>"]),
    "<observer>": Object.freeze(["self", "relation", "world", "human", "capability-gap"]),
    "<choice>": Object.freeze(["hold", "question", "relate", "act", "adapt", "construct"]),
    "<transition>": Object.freeze(["evidence-gated", "pressure-gated", "relation-gated", "time-gated"]),
    "<memory>": Object.freeze(["episodic", "state", "relation", "outcome"]),
    "<expression>": Object.freeze(["silent", "question", "action", "morph", "tool"])
  });
  var LawfulGrammarConstructor = class {
    constructor() {
      this.grammar = GRAMMAR_RULES;
      this.counter = 0;
    }
    /**
     * automatonSpec({observer, choice, transition, memory, expression}) ->
     * declarative spec {id, structure, invariants, bnf}.
     * Each part must be a legal expansion of its BNF nonterminal.
     */
    automatonSpec({ observer, choice, transition, memory, expression } = {}) {
      const parts = { observer, choice, transition, memory, expression };
      const errors = [];
      for (const [slot, value] of Object.entries(parts)) {
        const legal = this.grammar[`<${slot}>`];
        if (!legal.includes(value)) {
          errors.push(`invalid <${slot}>: ${String(value)} (legal: ${legal.join(", ")})`);
        }
      }
      if (errors.length) throw new Error(`Unlawful automaton spec \u2014 ${errors.join("; ")}`);
      this.counter += 1;
      return Object.freeze({
        type: "declarative-recursive-automaton",
        version: 1,
        id: `constructed:${this.counter}`,
        structure: Object.freeze({ ...parts }),
        bnf: AUTOMATON_BNF,
        invariants: LAWFUL_INVARIANTS,
        state: Object.freeze({ phase: "proposed", observations: 0, transitions: 0 })
      });
    }
    /** Validate a spec against grammar + invariants. */
    validate(spec) {
      const errors = [];
      if (spec?.type !== "declarative-recursive-automaton") errors.push("wrong type");
      if (!spec?.id) errors.push("missing id");
      for (const slot of ["observer", "choice", "transition", "memory", "expression"]) {
        const value = spec?.structure?.[slot];
        if (!value) errors.push(`missing ${slot}`);
        else if (!this.grammar[`<${slot}>`].includes(value)) errors.push(`invalid ${slot}: ${value}`);
      }
      for (const invariant of LAWFUL_INVARIANTS) {
        if (!spec?.invariants?.includes(invariant)) errors.push(`missing invariant: ${invariant}`);
      }
      return { ok: errors.length === 0, errors };
    }
    snapshot() {
      return { grammar: JSON.parse(JSON.stringify(this.grammar)), bnf: AUTOMATON_BNF, invariants: [...LAWFUL_INVARIANTS] };
    }
  };

  // src/merged/mesh-memory.js
  var FORBIDDEN_PRIVATE_KEYS = Object.freeze([
    "degree",
    "minute",
    "second",
    "arcSecond",
    "arc",
    "zodiac",
    "house",
    "privateCoordinates",
    "conversation",
    "document",
    "rawText",
    "userId",
    "sessionId"
  ]);
  var FORBIDDEN = new Set(FORBIDDEN_PRIVATE_KEYS);
  var int = (v, min, max) => Math.max(min, Math.min(max, Math.floor(Number(v) || min)));
  function publicAddress(addr = {}) {
    return {
      gate: int(addr.gate, 1, 64),
      line: int(addr.line, 1, 6),
      color: int(addr.color, 1, 6),
      tone: int(addr.tone, 1, 6),
      base: int(addr.base, 1, 5)
    };
  }
  function hash32(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16).padStart(8, "0");
  }
  function sanitize(value) {
    if (value === null || typeof value !== "object") {
      return ["string", "number", "boolean"].includes(typeof value) ? value : null;
    }
    if (Array.isArray(value)) return value.map(sanitize);
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (FORBIDDEN.has(k)) continue;
      out[k] = sanitize(v);
    }
    return out;
  }
  var addressKey = (a) => `G${a.gate}.L${a.line}.C${a.color}.T${a.tone}.B${a.base}`;
  var _AnticipatoryMemory_instances, index_fn;
  var AnticipatoryMemory = class {
    constructor() {
      __privateAdd(this, _AnticipatoryMemory_instances);
      this.store = /* @__PURE__ */ new Map();
      this.byAddress = /* @__PURE__ */ new Map();
      this.counter = 0;
    }
    /**
     * Record a precedent observed at a full (possibly private) address.
     * Only the public address + sanitized precedent are retained.
     */
    observe(addr, precedent = {}) {
      this.counter += 1;
      const address = publicAddress(addr);
      const clean = sanitize(precedent) || {};
      const id = `precedent_${hash32(addressKey(address) + ":" + JSON.stringify(clean) + ":" + this.counter)}`;
      return __privateMethod(this, _AnticipatoryMemory_instances, index_fn).call(this, {
        precedentId: id,
        address,
        data: clean,
        evidenceCount: Math.max(1, Math.floor(Number(clean.evidenceCount) || 1)),
        confidence: Math.max(0, Math.min(1, Number(clean.confidence) || 0.5))
      });
    }
    /**
     * Local recall by public address. Accepts a full address (it is reduced to
     * its public form first) or an already-public one. Returns sanitized
     * precedents, most-confident first. Never returns private coordinates.
     */
    recall(publicAddr) {
      const key = addressKey(publicAddress(publicAddr));
      const ids = this.byAddress.get(key);
      if (!ids) return [];
      return [...ids].map((id) => this.store.get(id)).filter(Boolean).sort((a, b) => b.confidence * Math.log2(b.evidenceCount + 1) - a.confidence * Math.log2(a.evidenceCount + 1) || (a.precedentId < b.precedentId ? -1 : 1)).map((p) => JSON.parse(JSON.stringify(p)));
    }
    /**
     * Contribute local knowledge to the shared form: returns the sanitized
     * public precedent (and indexes it locally). This is the ONLY shape that
     * may be published to a mesh — private coordinates and raw content are gone.
     */
    contribute(addr, data = {}) {
      const observed = this.observe(addr, data);
      return JSON.parse(JSON.stringify(observed));
    }
    snapshot() {
      return {
        precedents: [...this.store.values()].map((p) => JSON.parse(JSON.stringify(p))),
        addresses: [...this.byAddress.keys()].sort()
      };
    }
  };
  _AnticipatoryMemory_instances = new WeakSet();
  index_fn = function(precedent) {
    const key = addressKey(precedent.address);
    if (!this.byAddress.has(key)) this.byAddress.set(key, /* @__PURE__ */ new Set());
    this.byAddress.get(key).add(precedent.precedentId);
    this.store.set(precedent.precedentId, precedent);
    return precedent;
  };

  // src/engine/klein.js
  var ENVELOPE_TRANSITIONS = /* @__PURE__ */ new Set(["ignition", "automatize"]);
  var DIRECTIONS = /* @__PURE__ */ new Set(["toward", "away", "neutral"]);
  var clamp012 = (v) => Math.min(1, Math.max(0, v));
  var deepEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  function dominantTransition(trace) {
    const counts = /* @__PURE__ */ new Map();
    for (const step of Array.isArray(trace) ? trace : []) {
      const id = step && step.transition;
      if (!id || ENVELOPE_TRANSITIONS.has(id)) continue;
      const entry = counts.get(id) || { count: 0, firstSeq: step.seq ?? counts.size };
      entry.count += 1;
      counts.set(id, entry);
    }
    let best = null;
    for (const [id, entry] of counts) {
      if (!best || entry.count > best.entry.count || entry.count === best.entry.count && entry.firstSeq < best.entry.firstSeq) {
        best = { id, entry };
      }
    }
    return best ? best.id : null;
  }
  function kleinOperator(toolAutomaton) {
    if (!toolAutomaton || typeof toolAutomaton.run !== "function") {
      throw new TypeError("kleinOperator requires an Automaton (an object with run())");
    }
    const tool = toolAutomaton;
    const K = (context = {}) => {
      const savedState = typeof tool.exportState === "function" ? tool.exportState() : null;
      const savedCalls = tool.calls;
      const savedLifecycle = tool.lifecycle;
      let result = null;
      let runError = null;
      try {
        result = tool.run(context.input, {
          klein: true,
          address: context.address || null,
          dimension: context.dimension || tool.dimension || null,
          meshState: context.meshState || null
        });
      } catch (error) {
        runError = error;
      } finally {
        if (typeof tool.hydrate === "function") tool.hydrate(savedState);
        tool.calls = savedCalls;
        tool.lifecycle = savedLifecycle;
      }
      const trace = result && Array.isArray(result.trace) ? result.trace : [];
      const internalSteps = trace.filter((s) => s && !ENVELOPE_TRANSITIONS.has(s.transition));
      const relation = dominantTransition(trace) || tool.automatonForm || tool.constructor?.name || "unknown";
      const statesGenerated = result && result.ledger ? result.ledger.statesGenerated || 0 : 0;
      const stateCount = Math.max(1, Array.isArray(tool.states) ? tool.states.length : 1);
      let intensity = statesGenerated / (statesGenerated + stateCount);
      const activation = context.meshState && typeof context.meshState.activation === "number" ? clamp012(context.meshState.activation) : null;
      if (activation !== null) intensity = (intensity + activation) / 2;
      intensity = clamp012(intensity);
      let direction;
      if (runError || !result) direction = "neutral";
      else if (result.accepted === false) direction = "away";
      else if (internalSteps.length === 0) direction = "neutral";
      else direction = "toward";
      return Object.freeze({ relation, intensity, direction });
    };
    K.toolId = tool.id;
    K.automatonForm = tool.automatonForm || null;
    K.compose = (otherK, context = {}) => kleinCompose(K, otherK, context);
    return Object.freeze(K);
  }
  function kleinCompose(Ki, Kj, context = {}) {
    if (typeof Ki !== "function" || typeof Kj !== "function") {
      throw new TypeError("kleinCompose requires two Klein operators");
    }
    const ti = Ki(context);
    const tj = Kj(context);
    return Object.freeze({
      relation: `channel:${Ki.toolId}~${Kj.toolId}`,
      intensity: clamp012(Math.sqrt(ti.intensity * tj.intensity)),
      direction: tj.direction
    });
  }
  function naiveSum(ti, tj) {
    return {
      relation: `${ti.relation}+${tj.relation}`,
      intensity: clamp012(ti.intensity + tj.intensity),
      direction: ti.direction === tj.direction ? ti.direction : "neutral"
    };
  }
  function kleinInvariants(K, context, samples = [], { composeWith = null } = {}) {
    if (typeof K !== "function") throw new TypeError("kleinInvariants requires a Klein operator");
    const first = K(context);
    const second = K(context);
    const deterministic = deepEqual(first, second);
    const triples = (Array.isArray(samples) ? samples : []).map((sample) => K(sample));
    const distinct = new Set(triples.map((t) => JSON.stringify(t)));
    const contextDependent = distinct.size >= 2;
    let compositionalEmergence = false;
    let composition = null;
    if (typeof composeWith === "function") {
      const ti = K(context);
      const tj = composeWith(context);
      const composed = kleinCompose(K, composeWith, context);
      const sum = naiveSum(ti, tj);
      compositionalEmergence = composed.relation === `channel:${K.toolId}~${composeWith.toolId}` && composed.relation !== ti.relation && composed.relation !== tj.relation && !deepEqual(composed, sum);
      composition = Object.freeze({
        Ki: ti,
        Kj: tj,
        composed,
        naiveSum: sum,
        note: "J(Ki,Kj,C) via the emergent-channel compose is not Ki(C)+Kj(C): relation becomes channel:a~b (a new relation), intensity is the geometric mean (not the sum), direction is the downstream tool's."
      });
    }
    return Object.freeze({
      deterministic,
      contextDependent,
      compositionalEmergence,
      ...composition ? { composition } : {}
    });
  }
  var KLEIN_DIRECTIONS = Object.freeze([...DIRECTIONS]);

  // src/sovereign-entry.js
  var engine = new SynthiaAutomata();
  var api = {
    engine,
    call: (input) => engine.call(input),
    listTools: () => engine.listTools(),
    meshMetrics: () => engine.meshMetrics(),
    replay: (derivationJSON) => engine.replay(derivationJSON),
    triples: () => engine.triples(),
    emergentChannels: () => engine.emergentChannels(),
    questions: () => engine.questions.list(),
    runRelationalExperiment: () => engine.runRelationalExperiment(),
    klein: { kleinOperator, kleinInvariants, OPEN_QUESTIONS },
    sounds: { soundFor, transitionSound },
    colors: { colorFor, transitionColor, COLOR_ANCHORS, DIMENSION_LAYERS },
    transitions: { NAMED_TRANSITIONS },
    letters: { LETTERS, letterState },
    operators: { OPERATORS, operatorById },
    addressing: {
      addressForArcSec,
      arcSecForAddress,
      gateBits,
      gateFromBits,
      hamming,
      addrKey,
      KING_WEN_TO_FUXI_DECIMAL
    },
    merged: merged_exports
  };
  if (typeof window !== "undefined") {
    window.SYNTHIA_SOVEREIGN = api;
  }
  if (typeof globalThis !== "undefined") {
    globalThis.SYNTHIA_SOVEREIGN = api;
  }
  var sovereign_entry_default = api;
  return __toCommonJS(sovereign_entry_exports);
})();
