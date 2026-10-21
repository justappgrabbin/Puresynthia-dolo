
// src/srmf-growth-and-rig.mjs

import {
  BINARY_BOOLEAN_FUNCTIONS,
  applyBinary,
  completeAnalogy as completeBooleanAnalogy,
  normalizeVector,
  toBitString,
} from "./vendor/boolean-operator-bank.mjs";

import {
  IntegratedToolFactory,
} from "./vendor/integrated-tool-factory.mjs";

const FULL_MASK = 63;
const STATE_WIDTH = 6;

const clamp = (value, min = 0, max = 1) =>
  Math.max(min, Math.min(max, value));

function integerToBits(value, width = STATE_WIDTH) {
  if (!Number.isInteger(value) || value < 0 || value >= (1 << width)) {
    throw new RangeError(`Expected integer fitting ${width} bits.`);
  }
  return value.toString(2).padStart(width, "0").split("").map(Number);
}

function bitsToInteger(bits) {
  return normalizeVector(bits).reduce(
    (value, bit) => (value << 1) | bit,
    0,
  );
}

function weightedChoice(items) {
  return items.reduce(
    (best, item) => item.score > best.score ? item : best,
    items[0],
  );
}

export class StateOperatorSwitcher {
  constructor({
    operators = BINARY_BOOLEAN_FUNCTIONS,
    learningRate = 0.15,
  } = {}) {
    this.operators = [...operators];
    this.learningRate = learningRate;
    this.reputation = new Map();
    this.history = [];
  }

  stateKey(state = {}) {
    const movement = Math.round(clamp(state.movement ?? 0.5) * 3);
    const evolution = Math.round(clamp(state.evolution ?? 0.5) * 3);
    const being = Math.round(clamp(state.being ?? 0.5) * 3);
    const design = Math.round(clamp(state.design ?? 0.5) * 3);
    const space = Math.round(clamp(state.space ?? 0.5) * 3);
    const tension = Math.round(clamp(state.tension ?? 0) * 3);
    return `${movement}:${evolution}:${being}:${design}:${space}:${tension}`;
  }

  scoreOperator(operator, state = {}, context = {}) {
    const key = `${this.stateKey(state)}|${operator}`;
    const learned = this.reputation.get(key) ?? 0;

    const movement = clamp(state.movement ?? 0.5);
    const evolution = clamp(state.evolution ?? 0.5);
    const being = clamp(state.being ?? 0.5);
    const design = clamp(state.design ?? 0.5);
    const space = clamp(state.space ?? 0.5);
    const tension = clamp(state.tension ?? 0);

    const priors = {
      xor: movement * 0.8 + tension * 0.4,
      xnor: being * 0.7 + design * 0.35,
      and: design * 0.7 + being * 0.25,
      or: space * 0.65 + evolution * 0.35,
      nand: tension * 0.65 + evolution * 0.35,
      nor: (1 - movement) * 0.45 + design * 0.35,
      a_implies_b: evolution * 0.7 + movement * 0.2,
      b_implies_a: evolution * 0.55 + being * 0.3,
      a_and_not_b: movement * 0.45 + tension * 0.45,
      not_a_and_b: evolution * 0.4 + tension * 0.45,
      a: being * 0.45,
      b: space * 0.45,
      not_a: tension * 0.35,
      not_b: tension * 0.35,
      false: context.allowConstant ? 0.05 : -1,
      true: context.allowConstant ? 0.05 : -1,
    };

    return learned + (priors[operator] ?? 0);
  }

  select(state = {}, context = {}) {
    if (context.operator) {
      return {
        operator: context.operator,
        score: this.scoreOperator(context.operator, state, context),
        reason: "explicit",
      };
    }

    const ranked = this.operators.map((operator) => ({
      operator,
      score: this.scoreOperator(operator, state, context),
    }));

    const winner = weightedChoice(ranked);
    return {
      ...winner,
      reason: "state+experience",
      ranked: ranked.sort((a, b) => b.score - a.score),
    };
  }

  completeAnalogy(a, b, c, state = {}, context = {}) {
    const selected = this.select(state, context);
    const result = completeBooleanAnalogy(
      integerToBits(a),
      integerToBits(b),
      integerToBits(c),
      selected.operator,
    );

    return {
      operator: selected.operator,
      relationBits: toBitString(result.relation),
      resultBits: toBitString(result.result),
      relation: bitsToInteger(result.relation),
      result: bitsToInteger(result.result),
      selection: selected,
    };
  }

  reinforce(state, operator, reward, metadata = {}) {
    const key = `${this.stateKey(state)}|${operator}`;
    const previous = this.reputation.get(key) ?? 0;
    const next = previous + this.learningRate * (Number(reward) - previous);
    this.reputation.set(key, next);

    const record = {
      stateKey: this.stateKey(state),
      operator,
      reward: Number(reward),
      reputation: next,
      metadata: structuredClone(metadata),
      at: Date.now(),
    };
    this.history.push(record);
    if (this.history.length > 4096) {
      this.history.shift();
    }
    return record;
  }

  snapshot() {
    return {
      operators: [...this.operators],
      reputation: Object.fromEntries(this.reputation),
      history: structuredClone(this.history),
    };
  }
}

export class ChangingLineToolBridge {
  constructor({
    factory = new IntegratedToolFactory(),
    operatorSwitcher = new StateOperatorSwitcher(),
  } = {}) {
    this.factory = factory;
    this.operatorSwitcher = operatorSwitcher;
    this.generated = new Map();
    this.events = [];
  }

  changingLines(fromFuXi, toFuXi) {
    const mask = (fromFuXi ^ toFuXi) & FULL_MASK;
    const lines = [];
    for (let bit = 0; bit < STATE_WIDTH; bit += 1) {
      if (mask & (1 << bit)) {
        lines.push({
          lineNumber: bit + 1,
          from: (fromFuXi >> bit) & 1,
          to: (toFuXi >> bit) & 1,
        });
      }
    }
    return lines;
  }

  levelFor(changingLines) {
    if (changingLines.length >= 3) return 6;
    if (changingLines.length === 2) return 5;
    if (changingLines.length === 1) {
      return (changingLines[0].lineNumber - 1) % 3;
    }
    return 5;
  }

  generateForTransition({
    fromFuXi,
    toFuXi,
    state,
    address = null,
    purpose = "transform addressed media state",
  }) {
    const changingLines = this.changingLines(fromFuXi, toFuXi);
    const selected = this.operatorSwitcher.select(state, {});
    const level = this.levelFor(changingLines);

    const dimensionScores = {
      Movement: state.movement ?? 0,
      Evolution: state.evolution ?? 0,
      Being: state.being ?? 0,
      Design: state.design ?? 0,
      Space: state.space ?? 0,
    };
    const dimension = Object.entries(dimensionScores)
      .sort((a, b) => b[1] - a[1])[0][0];

    const request = {
      purpose: `${purpose}; boolean operator=${selected.operator}`,
      input: `${fromFuXi}->${toFuXi}`,
      dimension,
      level,
      gate: fromFuXi + 1,
      targetGate: toFuXi + 1,
      line: changingLines[0]?.lineNumber ?? 1,
      address,
      parents: [],
    };

    const result = this.factory.generate(request);
    const tool = result?.tool ?? null;

    const event = {
      fromFuXi,
      toFuXi,
      changingLines,
      operator: selected.operator,
      level,
      dimension,
      request,
      toolId: tool?.id ?? null,
      status: result?.status ?? "unresolved",
      at: Date.now(),
    };

    this.events.push(event);
    if (tool) {
      this.generated.set(tool.id, tool);
    }

    return { event, tool, result };
  }

  async executeForTransition(transition, input) {
    const generated = this.generateForTransition(transition);
    if (!generated.tool) {
      return {
        ok: false,
        event: generated.event,
        output: null,
      };
    }

    const output = await generated.tool.execute(input, {
      transition: generated.event,
    });

    return {
      ok: true,
      event: generated.event,
      tool: generated.tool.manifest(),
      output,
    };
  }

  snapshot() {
    return {
      events: structuredClone(this.events),
      factory: this.factory.snapshot(),
    };
  }
}

const PARTS = Object.freeze({
  head:  { x: 0.18, y: 0.00, w: 0.64, h: 0.42, pivotX: 0.50, pivotY: 0.34 },
  torso: { x: 0.25, y: 0.34, w: 0.50, h: 0.42, pivotX: 0.50, pivotY: 0.42 },
  armL:  { x: 0.08, y: 0.34, w: 0.34, h: 0.36, pivotX: 0.34, pivotY: 0.10 },
  armR:  { x: 0.58, y: 0.34, w: 0.34, h: 0.36, pivotX: 0.66, pivotY: 0.10 },
  legL:  { x: 0.20, y: 0.66, w: 0.32, h: 0.34, pivotX: 0.58, pivotY: 0.08 },
  legR:  { x: 0.48, y: 0.66, w: 0.32, h: 0.34, pivotX: 0.42, pivotY: 0.08 },
  rear:  { x: 0.00, y: 0.42, w: 1.00, h: 0.58, pivotX: 0.50, pivotY: 0.45 },
});

function partRect(part, width, height) {
  return {
    x: Math.round(part.x * width),
    y: Math.round(part.y * height),
    w: Math.max(1, Math.round(part.w * width)),
    h: Math.max(1, Math.round(part.h * height)),
    pivotX: part.pivotX,
    pivotY: part.pivotY,
  };
}

function analyzeRegion(canvas, rect) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const image = ctx.getImageData(rect.x, rect.y, rect.w, rect.h);
  const data = image.data;

  let mass = 0;
  let sx = 0;
  let sy = 0;
  let spreadX = 0;
  let spreadY = 0;

  for (let y = 0; y < rect.h; y += 1) {
    for (let x = 0; x < rect.w; x += 1) {
      const i = (y * rect.w + x) * 4;
      const alpha = data[i + 3] / 255;
      if (alpha <= 0.06) continue;
      mass += alpha;
      sx += x * alpha;
      sy += y * alpha;
    }
  }

  if (mass <= 0) {
    return {
      cx: 0.5,
      cy: 0.5,
      mass: 0,
      angle: 0,
      scaleX: 1,
      scaleY: 1,
    };
  }

  const cx = sx / mass;
  const cy = sy / mass;

  for (let y = 0; y < rect.h; y += 1) {
    for (let x = 0; x < rect.w; x += 1) {
      const i = (y * rect.w + x) * 4;
      const alpha = data[i + 3] / 255;
      if (alpha <= 0.06) continue;
      spreadX += (x - cx) ** 2 * alpha;
      spreadY += (y - cy) ** 2 * alpha;
    }
  }

  return {
    cx: cx / Math.max(1, rect.w - 1),
    cy: cy / Math.max(1, rect.h - 1),
    mass: mass / (rect.w * rect.h),
    angle: Math.atan2(cy - rect.h * 0.5, cx - rect.w * 0.5),
    scaleX: Math.sqrt(spreadX / mass) / Math.max(1, rect.w * 0.2),
    scaleY: Math.sqrt(spreadY / mass) / Math.max(1, rect.h * 0.2),
  };
}

export class SpriteRigAnalyzer {
  constructor(parts = PARTS) {
    this.parts = parts;
  }

  analyze(canvas) {
    const rig = {};
    for (const [name, part] of Object.entries(this.parts)) {
      const rect = partRect(part, canvas.width, canvas.height);
      rig[name] = {
        rect,
        feature: analyzeRegion(canvas, rect),
      };
    }
    return rig;
  }
}

function createCanvas(width, height) {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(width, height);
  }
  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }
  throw new Error("Canvas implementation required.");
}

export class SkeletalSpriteMorphRenderer {
  constructor({
    rigAnalyzer = new SpriteRigAnalyzer(),
  } = {}) {
    this.rigAnalyzer = rigAnalyzer;
    this.cache = new WeakMap();
  }

  rig(frameCanvas) {
    if (!this.cache.has(frameCanvas)) {
      this.cache.set(frameCanvas, this.rigAnalyzer.analyze(frameCanvas));
    }
    return this.cache.get(frameCanvas);
  }

  drawPart({
    ctx,
    sourceCanvas,
    sourceRig,
    targetRig,
    partName,
    t,
    alpha,
  }) {
    const source = sourceRig[partName];
    const target = targetRig[partName];
    if (!source || !target) return;

    const rect = source.rect;
    const src = source.feature;
    const dst = target.feature;

    const pivotX = rect.x + rect.w * PARTS[partName].pivotX;
    const pivotY = rect.y + rect.h * PARTS[partName].pivotY;

    const dx = (dst.cx - src.cx) * rect.w * t;
    const dy = (dst.cy - src.cy) * rect.h * t;
    const rotation = (dst.angle - src.angle) * t * 0.55;
    const scaleX = 1 + (dst.scaleX - src.scaleX) * t * 0.35;
    const scaleY = 1 + (dst.scaleY - src.scaleY) * t * 0.35;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(pivotX + dx, pivotY + dy);
    ctx.rotate(rotation);
    ctx.scale(
      Number.isFinite(scaleX) ? scaleX : 1,
      Number.isFinite(scaleY) ? scaleY : 1,
    );
    ctx.translate(-pivotX, -pivotY);

    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();

    ctx.drawImage(sourceCanvas, 0, 0);
    ctx.restore();
  }

  render(fromCanvas, toCanvas, t, outputCanvas = null) {
    const progress = clamp(t);
    const canvas = outputCanvas ?? createCanvas(fromCanvas.width, fromCanvas.height);
    canvas.width = fromCanvas.width;
    canvas.height = fromCanvas.height;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const fromRig = this.rig(fromCanvas);
    const toRig = this.rig(toCanvas);

    // Rear/background first, then torso/limbs/head for a stable painter order.
    const order = ["rear", "torso", "legL", "legR", "armL", "armR", "head"];

    for (const partName of order) {
      this.drawPart({
        ctx,
        sourceCanvas: fromCanvas,
        sourceRig: fromRig,
        targetRig: toRig,
        partName,
        t: progress,
        alpha: 1 - progress * 0.35,
      });

      this.drawPart({
        ctx,
        sourceCanvas: toCanvas,
        sourceRig: toRig,
        targetRig: fromRig,
        partName,
        t: 1 - progress,
        alpha: progress * 0.55,
      });
    }

    return {
      canvas,
      fromRig,
      toRig,
      progress,
    };
  }
}

export class RecursiveGrowthController {
  constructor({
    field,
    operatorSwitcher = new StateOperatorSwitcher(),
    bridge = new ChangingLineToolBridge({ operatorSwitcher }),
  }) {
    if (!field) {
      throw new TypeError("RecursiveGrowthController requires the media field.");
    }
    this.field = field;
    this.operatorSwitcher = operatorSwitcher;
    this.bridge = bridge;
    this.generatedChildren = [];
  }

  async processTransition(transition, input = {}) {
    const node = this.field.nodes[transition.fromFuXi];
    if (!node) {
      throw new RangeError("Transition source is not a valid 64-node state.");
    }

    const generated = await this.bridge.executeForTransition({
      fromFuXi: transition.fromFuXi,
      toFuXi: transition.toFuXi,
      state: node.state,
      address: node.address,
      purpose: "generate media morph capability from changing-line event",
    }, input);

    if (generated.ok) {
      const child = {
        address: {
          id: generated.tool.addressKey,
        },
        tool: generated.tool,
        output: generated.output,
      };
      node.addChild(child);
      this.generatedChildren.push({
        node: node.fuxi,
        toolId: generated.tool.id,
        at: Date.now(),
      });
    }

    return generated;
  }

  reinforce({
    nodeFuXi,
    operator,
    reward,
    metadata = {},
  }) {
    const node = this.field.nodes[nodeFuXi];
    if (!node) {
      throw new RangeError("nodeFuXi must be 0..63.");
    }
    return this.operatorSwitcher.reinforce(
      node.state,
      operator,
      reward,
      metadata,
    );
  }

  snapshot() {
    return {
      switcher: this.operatorSwitcher.snapshot(),
      bridge: this.bridge.snapshot(),
      generatedChildren: structuredClone(this.generatedChildren),
    };
  }
}
