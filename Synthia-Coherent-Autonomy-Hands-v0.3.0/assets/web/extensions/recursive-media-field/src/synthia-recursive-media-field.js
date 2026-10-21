// src/synthia-recursive-media-field.js

const NODE_COUNT = 64;
const STATE_BITS = 6;
const FULL_MASK = 63;
const DIMENSIONS = ["movement", "evolution", "being", "design", "space"];

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function hammingDistance(a, b) {
  let value = (a ^ b) & FULL_MASK;
  let count = 0;
  while (value) {
    count += value & 1;
    value >>>= 1;
  }
  return count;
}

export function atoXnor(a, b, bits = STATE_BITS) {
  if (!Number.isInteger(a) || !Number.isInteger(b)) {
    throw new TypeError("ATO operands must be integers.");
  }
  if (!Number.isInteger(bits) || bits < 1 || bits > 30) {
    throw new RangeError("bits must be an integer from 1 through 30.");
  }
  const mask = (1 << bits) - 1;
  if (a < 0 || a > mask || b < 0 || b > mask) {
    throw new RangeError(`ATO operands must fit in ${bits} bits.`);
  }
  return (~(a ^ b)) & mask;
}

export function completeAnalogy(a, b, c, bits = STATE_BITS) {
  return atoXnor(c, atoXnor(a, b, bits), bits);
}

function hashString(text) {
  let hash = 2166136261;
  for (const char of String(text)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededUnit(seed) {
  let x = seed >>> 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return (x >>> 0) / 0xffffffff;
}

export class AddressRegistry {
  constructor(namespace = "synthia") {
    this.namespace = namespace;
    this.sequence = 0;
    this.records = new Map();
  }

  create(kind, parent = null, metadata = {}) {
    const id = `${this.namespace}:${kind}:${String(++this.sequence).padStart(8, "0")}`;
    const record = Object.freeze({
      id,
      kind,
      parent: parent?.id ?? parent ?? null,
      createdAt: Date.now(),
      metadata: structuredClone(metadata),
    });
    this.records.set(id, record);
    return record;
  }

  derive(parent, kind, metadata = {}) {
    if (!parent) {
      throw new TypeError("A parent address is required.");
    }
    return this.create(kind, parent, metadata);
  }

  get(id) {
    return this.records.get(typeof id === "string" ? id : id?.id) ?? null;
  }

  snapshot() {
    return [...this.records.values()].map((item) => structuredClone(item));
  }
}

export class DependencyNetwork {
  constructor() {
    this.transitive = new Map();
    this.nodes = new Set();
    this.cachedClosure = null;
  }

  addLink(from, to) {
    this.nodes.add(from);
    this.nodes.add(to);
    if (!this.transitive.has(from)) {
      this.transitive.set(from, new Set());
    }
    this.transitive.get(from).add(to);
    this.cachedClosure = null;
  }

  closure() {
    const nodes = [...this.nodes];
    const closure = new Map(
      nodes.map((node) => [node, new Set(this.transitive.get(node) ?? [])]),
    );

    for (const via of nodes) {
      for (const from of nodes) {
        if (!closure.get(from)?.has(via)) {
          continue;
        }
        for (const to of closure.get(via) ?? []) {
          closure.get(from).add(to);
        }
      }
    }

    this.cachedClosure = closure;
    return closure;
  }

  reachableFrom(from) {
    const closure = this.cachedClosure ?? this.closure();
    return [...(closure.get(from) ?? [])];
  }

  plausible(from, to) {
    const closure = this.cachedClosure ?? this.closure();
    return closure.get(from)?.has(to) ?? false;
  }
}

export class RecursiveAutomatonNode {
  constructor(gate, addressRegistry) {
    if (!Number.isInteger(gate) || gate < 1 || gate > NODE_COUNT) {
      throw new RangeError("gate must be 1..64.");
    }

    this.gate = gate;
    this.fuxi = gate - 1;
    this.address = addressRegistry.create("recursive-node", null, {
      gate,
      fuxi: this.fuxi,
    });

    const seed = hashString(this.address.id);
    this.state = {
      movement: seededUnit(seed ^ 0x01),
      evolution: seededUnit(seed ^ 0x02),
      being: seededUnit(seed ^ 0x04),
      design: seededUnit(seed ^ 0x08),
      space: seededUnit(seed ^ 0x10),
      energy: 0.5,
      tension: 0,
    };

    this.activationHistory = new Float32Array(64);
    this.historyCursor = 0;
    this.children = new Map();
    this.experience = [];
  }

  addChild(child) {
    if (!child?.address?.id) {
      throw new TypeError("Recursive child must have an address.");
    }
    this.children.set(child.address.id, child);
  }

  recordActivation(value) {
    this.activationHistory[this.historyCursor % this.activationHistory.length] = value;
    this.historyCursor += 1;
  }

  observe(sample) {
    this.experience.push({
      at: Date.now(),
      sample: structuredClone(sample),
    });
    if (this.experience.length > 256) {
      this.experience.shift();
    }
  }

  update(nextState) {
    for (const dimension of DIMENSIONS) {
      if (Number.isFinite(nextState[dimension])) {
        this.state[dimension] = clamp(nextState[dimension]);
      }
    }
    if (Number.isFinite(nextState.energy)) {
      this.state.energy = clamp(nextState.energy);
    }
    if (Number.isFinite(nextState.tension)) {
      this.state.tension = clamp(nextState.tension);
    }
  }
}

export class RecurrentField {
  constructor(nodeCount = NODE_COUNT) {
    this.nodeCount = nodeCount;
    this.weights = Array.from(
      { length: nodeCount },
      () => new Float32Array(nodeCount),
    );
    this.learningRate = 0.025;
    this.decay = 0.999;
    this.initializeTopology();
  }

  initializeTopology() {
    for (let from = 0; from < this.nodeCount; from += 1) {
      for (let to = 0; to < this.nodeCount; to += 1) {
        if (from === to) {
          this.weights[from][to] = 0.15;
          continue;
        }
        const distance = hammingDistance(from, to);
        this.weights[from][to] = distance === 1 ? 0.08 : distance === 2 ? 0.025 : 0;
      }
    }
  }

  influence(activations, target) {
    let sum = 0;
    for (let source = 0; source < this.nodeCount; source += 1) {
      sum += activations[source] * this.weights[source][target];
    }
    return Math.tanh(sum);
  }

  learn(previous, current) {
    for (let source = 0; source < this.nodeCount; source += 1) {
      for (let target = 0; target < this.nodeCount; target += 1) {
        const oldWeight = this.weights[source][target] * this.decay;
        const delta = this.learningRate * previous[source] * current[target];
        this.weights[source][target] = clamp(oldWeight + delta, -1, 1);
      }
    }
  }
}

export class RecursiveMediaField {
  constructor({ addressRegistry = new AddressRegistry("srmf") } = {}) {
    this.addressRegistry = addressRegistry;
    this.address = addressRegistry.create("recursive-media-field", null, {
      nodeCount: NODE_COUNT,
    });
    this.nodes = Array.from(
      { length: NODE_COUNT },
      (_, index) => new RecursiveAutomatonNode(index + 1, addressRegistry),
    );
    this.recurrent = new RecurrentField(NODE_COUNT);
    this.dependencies = new DependencyNetwork();
    this.tickCount = 0;
    this.lastActivations = new Float32Array(NODE_COUNT);
    this.transitions = [];
  }

  activationVector() {
    return Float32Array.from(
      this.nodes,
      (node) =>
        (
          node.state.movement +
          node.state.evolution +
          node.state.being +
          node.state.design +
          node.state.space
        ) / 5,
    );
  }

  injectFuXi(fuxiValue, strength = 1) {
    if (!Number.isInteger(fuxiValue) || fuxiValue < 0 || fuxiValue > FULL_MASK) {
      throw new RangeError("Fu Xi value must be 0..63.");
    }

    for (let index = 0; index < NODE_COUNT; index += 1) {
      const distance = hammingDistance(index, fuxiValue);
      const resonance = Math.max(0, 1 - distance / STATE_BITS) * strength;
      const node = this.nodes[index];
      node.state.energy = clamp(node.state.energy * 0.8 + resonance * 0.2);
      node.state.tension = clamp(
        node.state.tension * 0.85 + Math.abs(resonance - node.state.being) * 0.15,
      );
    }
  }

  tick(externalState = null) {
    const previous = this.activationVector();
    const nextActivations = new Float32Array(NODE_COUNT);

    for (let index = 0; index < NODE_COUNT; index += 1) {
      const node = this.nodes[index];
      const recurrent = this.recurrent.influence(previous, index);
      const external =
        externalState == null
          ? 0
          : 1 - hammingDistance(index, externalState) / STATE_BITS;

      const movement = clamp(0.64 * node.state.movement + 0.18 * recurrent + 0.18 * external);
      const evolution = clamp(0.72 * node.state.evolution + 0.18 * Math.abs(recurrent) + 0.10 * node.state.tension);
      const being = clamp(0.70 * node.state.being + 0.20 * node.state.energy + 0.10 * recurrent);
      const design = clamp(0.76 * node.state.design + 0.14 * movement + 0.10 * evolution);
      const space = clamp(0.74 * node.state.space + 0.16 * recurrent + 0.10 * design);

      node.update({
        movement,
        evolution,
        being,
        design,
        space,
        energy: clamp(node.state.energy * 0.992 + external * 0.008),
        tension: clamp(node.state.tension * 0.95 + Math.abs(recurrent - being) * 0.05),
      });

      nextActivations[index] = (movement + evolution + being + design + space) / 5;
      node.recordActivation(nextActivations[index]);
    }

    this.recurrent.learn(previous, nextActivations);
    this.lastActivations = nextActivations;
    this.tickCount += 1;
    return this.snapshot();
  }

  recordTransition(fromFuXi, toFuXi, metadata = {}) {
    const changingMask = (fromFuXi ^ toFuXi) & FULL_MASK;
    const changingLines = [];
    for (let bit = 0; bit < STATE_BITS; bit += 1) {
      if (changingMask & (1 << bit)) {
        changingLines.push(bit + 1);
      }
    }

    const address = this.addressRegistry.derive(
      this.address,
      "state-transition",
      { fromFuXi, toFuXi, changingLines, ...metadata },
    );

    const transition = {
      address,
      fromFuXi,
      toFuXi,
      changingLines,
      metadata: structuredClone(metadata),
      at: Date.now(),
    };

    this.dependencies.addLink(fromFuXi, toFuXi);
    this.transitions.push(transition);
    if (this.transitions.length > 2048) {
      this.transitions.shift();
    }

    this.nodes[fromFuXi].observe({
      type: "transition-out",
      toFuXi,
      changingLines,
      transitionAddress: address.id,
    });
    this.nodes[toFuXi].observe({
      type: "transition-in",
      fromFuXi,
      changingLines,
      transitionAddress: address.id,
    });

    return transition;
  }

  learnSequence(sequence, metadata = {}) {
    if (!Array.isArray(sequence) || sequence.length < 2) {
      return [];
    }

    const transitions = [];
    for (let index = 0; index < sequence.length - 1; index += 1) {
      const from = sequence[index];
      const to = sequence[index + 1];
      transitions.push(this.recordTransition(from, to, { ...metadata, sequenceIndex: index }));
      this.injectFuXi(from, 0.8);
      this.tick(from);
      this.injectFuXi(to, 0.8);
      this.tick(to);
    }
    return transitions;
  }

  proposeAnalogy(a, b, c) {
    const d = completeAnalogy(a, b, c);
    return {
      a,
      b,
      c,
      d,
      relation: atoXnor(a, b),
      plausible: this.dependencies.plausible(c, d) || this.dependencies.plausible(a, b),
    };
  }

  snapshot() {
    return {
      tick: this.tickCount,
      fieldAddress: this.address.id,
      activations: [...this.lastActivations],
      nodes: this.nodes.map((node) => ({
        gate: node.gate,
        fuxi: node.fuxi,
        address: node.address.id,
        state: { ...node.state },
        children: node.children.size,
      })),
    };
  }
}

function stateBitsFromFeatures(features) {
  const bits = [
    features.centroidX >= 0.5,
    features.centroidY >= 0.5,
    features.occupancy >= 0.28,
    features.widthRatio >= 0.55,
    features.heightRatio >= 0.55,
    features.luminance >= 0.5,
  ];

  return bits.reduce(
    (value, enabled, index) => value | (enabled ? 1 << index : 0),
    0,
  );
}

function safeCanvas(width, height) {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(width, height);
  }
  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }
  throw new Error("A browser Canvas or OffscreenCanvas implementation is required.");
}

function context2d(canvas) {
  const context = canvas.getContext("2d", {
    alpha: true,
    willReadFrequently: true,
  });
  if (!context) {
    throw new Error("Could not obtain a 2D canvas context.");
  }
  return context;
}

export class SpriteFrameAnalyzer {
  analyze(canvas) {
    const context = context2d(canvas);
    const { width, height } = canvas;
    const image = context.getImageData(0, 0, width, height);
    const data = image.data;

    let count = 0;
    let sumX = 0;
    let sumY = 0;
    let sumLuminance = 0;
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const offset = (y * width + x) * 4;
        const alpha = data[offset + 3] / 255;
        if (alpha <= 0.08) {
          continue;
        }

        const red = data[offset] / 255;
        const green = data[offset + 1] / 255;
        const blue = data[offset + 2] / 255;
        const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;

        count += alpha;
        sumX += x * alpha;
        sumY += y * alpha;
        sumLuminance += luminance * alpha;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }

    if (count <= 0) {
      return {
        centroidX: 0.5,
        centroidY: 0.5,
        occupancy: 0,
        widthRatio: 0,
        heightRatio: 0,
        luminance: 0,
        bbox: { x: 0, y: 0, width, height },
        fuXi: 0,
      };
    }

    const bboxWidth = Math.max(1, maxX - minX + 1);
    const bboxHeight = Math.max(1, maxY - minY + 1);
    const features = {
      centroidX: clamp(sumX / count / Math.max(1, width - 1)),
      centroidY: clamp(sumY / count / Math.max(1, height - 1)),
      occupancy: clamp(count / (width * height)),
      widthRatio: clamp(bboxWidth / width),
      heightRatio: clamp(bboxHeight / height),
      luminance: clamp(sumLuminance / count),
      bbox: { x: minX, y: minY, width: bboxWidth, height: bboxHeight },
    };

    return { ...features, fuXi: stateBitsFromFeatures(features) };
  }
}

export class SpriteSheet {
  constructor({ addressRegistry, parentAddress, analyzer = new SpriteFrameAnalyzer() }) {
    this.addressRegistry = addressRegistry;
    this.address = addressRegistry.derive(parentAddress, "sprite-sheet");
    this.analyzer = analyzer;
    this.frames = [];
    this.frameWidth = 0;
    this.frameHeight = 0;
  }

  load(source, { columns, rows, frameWidth, frameHeight, frameCount = null } = {}) {
    if (!source?.width || !source?.height) {
      throw new TypeError("Sprite source must expose width and height.");
    }

    const resolvedFrameWidth = frameWidth ?? (columns ? Math.floor(source.width / columns) : null);
    const resolvedFrameHeight = frameHeight ?? (rows ? Math.floor(source.height / rows) : null);

    if (!resolvedFrameWidth || !resolvedFrameHeight) {
      throw new Error("Provide frameWidth/frameHeight or columns/rows to slice the sprite sheet.");
    }

    const resolvedColumns = columns ?? Math.floor(source.width / resolvedFrameWidth);
    const resolvedRows = rows ?? Math.floor(source.height / resolvedFrameHeight);
    const maximumFrames = resolvedColumns * resolvedRows;
    const count = Math.min(frameCount ?? maximumFrames, maximumFrames);

    this.frameWidth = resolvedFrameWidth;
    this.frameHeight = resolvedFrameHeight;
    this.frames = [];

    for (let index = 0; index < count; index += 1) {
      const column = index % resolvedColumns;
      const row = Math.floor(index / resolvedColumns);
      const canvas = safeCanvas(resolvedFrameWidth, resolvedFrameHeight);
      const context = context2d(canvas);
      context.clearRect(0, 0, resolvedFrameWidth, resolvedFrameHeight);
      context.drawImage(
        source,
        column * resolvedFrameWidth,
        row * resolvedFrameHeight,
        resolvedFrameWidth,
        resolvedFrameHeight,
        0,
        0,
        resolvedFrameWidth,
        resolvedFrameHeight,
      );

      const features = this.analyzer.analyze(canvas);
      const address = this.addressRegistry.derive(
        this.address,
        "sprite-frame",
        { index, fuXi: features.fuXi },
      );

      this.frames.push({ index, address, canvas, features, fuXi: features.fuXi });
    }

    return this.frames;
  }
}

import { StateOperatorSwitcher, SkeletalSpriteMorphRenderer, ChangingLineToolBridge, RecursiveGrowthController } from "./srmf-growth-and-rig.mjs";

export class KleinSpriteMorphEngine {
  constructor({ field = new RecursiveMediaField(), addressRegistry = field.addressRegistry } = {}) {
    this.field = field;
    this.addressRegistry = addressRegistry;
    this.address = addressRegistry.create("klein-sprite-morph-engine");
    this.sheet = null;
    this.learnedRelations = new Map();
  }

  ingestSpriteSheet(source, options) {
    this.sheet = new SpriteSheet({
      addressRegistry: this.addressRegistry,
      parentAddress: this.address,
    });
    const frames = this.sheet.load(source, options);

    const sequence = frames.map((frame) => frame.fuXi);
    this.field.learnSequence(sequence, {
      source: "sprite-sheet",
      spriteSheetAddress: this.sheet.address.id,
    });

    this.learnedRelations.clear();
    for (let index = 0; index < frames.length - 1; index += 1) {
      const from = frames[index];
      const to = frames[index + 1];
      const relation = atoXnor(from.fuXi, to.fuXi);
      const key = `${from.fuXi}:${to.fuXi}`;
      this.learnedRelations.set(key, {
        address: this.addressRegistry.derive(
          this.address,
          "sprite-relation",
          { from: from.address.id, to: to.address.id, relation },
        ),
        fromFuXi: from.fuXi,
        toFuXi: to.fuXi,
        relation,
      });
    }

    return {
      address: this.sheet.address,
      frames: frames.map((frame) => ({
        index: frame.index,
        address: frame.address.id,
        fuXi: frame.fuXi,
        features: structuredClone(frame.features),
      })),
    };
  }

  inferNextState(aIndex, bIndex, cIndex) {
    this.#requireSheet();
    const a = this.#frame(aIndex);
    const b = this.#frame(bIndex);
    const c = this.#frame(cIndex);
    const d = completeAnalogy(a.fuXi, b.fuXi, c.fuXi);

    return {
      address: this.addressRegistry.derive(
        this.address,
        "inferred-sprite-state",
        { a: a.address.id, b: b.address.id, c: c.address.id, d },
      ),
      a: a.fuXi,
      b: b.fuXi,
      c: c.fuXi,
      d,
      relation: atoXnor(a.fuXi, b.fuXi),
      plausible: this.field.dependencies.plausible(c.fuXi, d) || this.field.dependencies.plausible(a.fuXi, b.fuXi),
    };
  }

  renderMorph(fromIndex, toIndex, t, targetCanvas = null) {
    this.#requireSheet();
    const from = this.#frame(fromIndex);
    const to = this.#frame(toIndex);
    const progress = clamp(t);

    const rendered = this.skeletalRenderer.render(
      from.canvas,
      to.canvas,
      progress,
      targetCanvas,
    );

    const sourceState = this.field.nodes[from.fuXi]?.state ?? {};
    const analogy = this.operatorSwitcher.completeAnalogy(
      from.fuXi,
      to.fuXi,
      progress < 0.5 ? from.fuXi : to.fuXi,
      sourceState,
    );
    const inferredFuXi = analogy.result;

    this.field.injectFuXi(inferredFuXi, 0.35);
    this.field.tick(inferredFuXi);

    return {
      canvas: rendered.canvas,
      rig: {
        from: rendered.fromRig,
        to: rendered.toRig,
      },
      progress,
      fromAddress: from.address.id,
      toAddress: to.address.id,
      inferredFuXi,
      operator: analogy.operator,
      relation: analogy.relation,
    };
  }

  generateInbetweens(fromIndex, toIndex, count = 3) {
    if (!Number.isInteger(count) || count < 1) {
      throw new RangeError("count must be a positive integer.");
    }

    const generated = [];
    for (let index = 1; index <= count; index += 1) {
      const progress = index / (count + 1);
      const rendered = this.renderMorph(fromIndex, toIndex, progress);
      const address = this.addressRegistry.derive(
        this.address,
        "generated-inbetween",
        { fromIndex, toIndex, progress, inferredFuXi: rendered.inferredFuXi },
      );
      generated.push({
        address,
        canvas: rendered.canvas,
        progress,
        inferredFuXi: rendered.inferredFuXi,
        operator: rendered.operator,
      });
    }
    return generated;
  }

  async animate({ canvas, framesPerPair = 5, framesPerSecond = 12, loop = true, signal = null }) {
    this.#requireSheet();
    if (!canvas) {
      throw new TypeError("animate requires an output canvas.");
    }

    const delay = 1000 / Math.max(1, framesPerSecond);

    do {
      for (let pair = 0; pair < this.sheet.frames.length - 1; pair += 1) {
        for (let step = 0; step < framesPerPair; step += 1) {
          if (signal?.aborted) {
            return;
          }
          const progress = step / framesPerPair;
          this.renderMorph(pair, pair + 1, progress, canvas);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
      this.renderMorph(
        this.sheet.frames.length - 1,
        this.sheet.frames.length - 1,
        1,
        canvas,
      );
    } while (loop && !signal?.aborted);
  }

  #frame(index) {
    const frame = this.sheet?.frames?.[index];
    if (!frame) {
      throw new RangeError(`No sprite frame exists at index ${index}.`);
    }
    return frame;
  }

  #requireSheet() {
    if (!this.sheet?.frames?.length) {
      throw new Error("Load a sprite sheet before morphing.");
    }
  }
}

export class RecursiveMediaOrgan {
  constructor({ field = new RecursiveMediaField(), morphEngine = null } = {}) {
    this.id = "recursive-media";
    this.capabilities = ["image", "sprite", "morph", "animation", "video", "game-media"];
    this.field = field;
    this.morphEngine = morphEngine ?? new KleinSpriteMorphEngine({
      field,
      addressRegistry: field.addressRegistry,
    });
  }

  accepts(intent) {
    return /\b(image|sprite|morph|animate|animation|video|game|media)\b/i.test(String(intent));
  }

  ingestSpriteSheet(source, options) {
    return this.morphEngine.ingestSpriteSheet(source, options);
  }

  snapshot() {
    return {
      id: this.id,
      capabilities: [...this.capabilities],
      field: this.field.snapshot(),
      addresses: this.field.addressRegistry.snapshot(),
    };
  }
}

export { NODE_COUNT, STATE_BITS, FULL_MASK };

export {
  StateOperatorSwitcher,
  SkeletalSpriteMorphRenderer,
  ChangingLineToolBridge,
  RecursiveGrowthController,
} from "./srmf-growth-and-rig.mjs";
