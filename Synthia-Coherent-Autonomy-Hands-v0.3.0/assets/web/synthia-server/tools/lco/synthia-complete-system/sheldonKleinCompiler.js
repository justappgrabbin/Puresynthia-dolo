// sheldonKleinCompiler.js — THE LINGUISTIC PARSER
//
// Translates natural language into structural coordinate mutations.
// Not an LLM. A deterministic compiler that maps interrogative words
// onto the 5D ontology field using distributional heuristics.
//
// Axis Projections:
//   WHO  -> Namespace Signature (Base 5 / Space dimension)
//   WHAT -> Qualitative Metric (Base 2 / Evolution dimension)
//   WHERE -> Trajectory Angular Coordinate (Base 1 / Movement dimension)
//   WHEN -> Temporal Phase Offset (Base 3 / Being dimension)
//   WHY  -> Structural Constraint Bound (Base 4 / Design dimension)

import { ToolBase } from './ToolBase.js';

export class SheldonKleinCompiler extends ToolBase {
  constructor(mesh) {
    super(mesh, 'SheldonKleinCompiler', 'lang.sheldonklein');
    this.distributionalLexicon = new Map();
    this.heuristicWeights = {
      identity: 0.35,
      attribute: 0.25,
      vector: 0.20,
      interval: 0.12,
      limit: 0.08
    };
    this.bootstrapLexicon();
  }

  /**
   * Compiles natural language into coordinate mutations.
   * Returns a partial State.coordinates object that can be fed into
   * SemanticOS.resolve() to produce a resolved state.
   */
  compile(text) {
    const tokens = this.tokenizeAndSegment(text);
    let masterCoordinates = {
      gate: 1, line: 1, color: 1, tone: 1, base: 1,
      degree: 0, minute: 0, second: 0, arc: 0,
      zodiac: 'Aries', house: 1
    };

    const interrogativeMap = {
      WHO: 0, WHAT: 0, WHERE: 0, WHEN: 0, WHY: 0
    };

    let totalWeight = 0;

    for (const token of tokens) {
      interrogativeMap[token.axis] += token.weight;
      totalWeight += token.weight;

      const coordinateOffset = this.distributionalLexicon.get(token.lexeme.toLowerCase());
      if (coordinateOffset) {
        masterCoordinates = this.applySubstitutionHeuristic(
          masterCoordinates, coordinateOffset, token.weight
        );
      }
    }

    // Normalize interrogative map
    for (const key of Object.keys(interrogativeMap)) {
      interrogativeMap[key] = totalWeight > 0 ? interrogativeMap[key] / totalWeight : 0;
    }

    const confidence = Math.min(1, totalWeight);

    this.mesh.publish(this.channel, this.name, {
      event: 'TEXT_COMPILED',
      input: text.slice(0, 100),
      confidence,
      dominantAxis: this.getDominantAxis(interrogativeMap)
    });

    return { coordinates: masterCoordinates, interrogativeMap, confidence };
  }

  /**
   * Verifies convergence using historical failure data (Klein's Recycling Heuristic).
   * If resonance drops below threshold, triggers a fractal descent to next line.
   */
  verifyConvergence(state, resonanceScore) {
    const minCoherenceThreshold = 0.78;

    if (resonanceScore >= minCoherenceThreshold) {
      return { stable: true, action: "LOCK_STATE_COORDINATE" };
    }

    const adjustedLine = state.coordinates?.line === 6 ? 1 : (state.coordinates?.line || 1) + 1;
    return {
      stable: false,
      action: `RECYCLE_SEGMENTATION_TRIGGER_DESCENT_TO_LINE_${adjustedLine}`
    };
  }

  applySubstitutionHeuristic(current, offset, weight) {
    const fused = { ...current };
    if (offset.gate) fused.gate = Math.min(64, Math.max(1, Math.round((current.gate || 1) + (offset.gate * weight))));
    if (offset.line) fused.line = Math.min(6, Math.max(1, Math.round((current.line || 1) + (offset.line * weight))));
    if (offset.base) fused.base = Math.min(5, Math.max(1, Math.round((current.base || 1) + (offset.base * weight))));
    if (offset.degree) fused.degree = ((current.degree || 0) + (offset.degree * weight)) % 360;
    if (offset.house) fused.house = Math.min(12, Math.max(1, Math.round((current.house || 1) + (offset.house * weight))));
    return fused;
  }

  tokenizeAndSegment(input) {
    const normalized = input.replace(/[.,\/#!$%\^&\*;:{}=\-_\`~()]/g, "").toLowerCase();
    const words = normalized.split(/\s+/).filter(w => w.length > 0);

    return words.map((word) => {
      let axis = "WHAT";
      let weight = this.heuristicWeights.attribute;

      // Identity axis
      if (["i", "me", "my", "observer", "identity", "source", "self", "who", "name", "namespace"].includes(word)) {
        axis = "WHO"; weight = this.heuristicWeights.identity;
      }
      // Vector/trajectory axis
      else if (["move", "shift", "trajectory", "path", "delta", "where", "go", "travel", "position"].includes(word)) {
        axis = "WHERE"; weight = this.heuristicWeights.vector;
      }
      // Temporal axis
      else if (["now", "phase", "moment", "cycle", "clock", "when", "time", "then", "later"].includes(word)) {
        axis = "WHEN"; weight = this.heuristicWeights.interval;
      }
      // Constraint axis
      else if (["rule", "stop", "bound", "force", "must", "why", "because", "reason", "purpose", "constraint"].includes(word)) {
        axis = "WHY"; weight = this.heuristicWeights.limit;
      }
      // Attribute axis (default)
      else if (["what", "is", "are", "have", "has", "property", "trait", "feature"].includes(word)) {
        axis = "WHAT"; weight = this.heuristicWeights.attribute;
      }

      return { lexeme: word, weight, axis };
    });
  }

  getDominantAxis(map) {
    let max = 0, dominant = "WHAT";
    for (const [axis, weight] of Object.entries(map)) {
      if (weight > max) { max = weight; dominant = axis; }
    }
    return dominant;
  }

  bootstrapLexicon() {
    // Structural vectors defining key coordinate modifiers
    this.distributionalLexicon.set("observer", { base: 5, gate: 1 });
    this.distributionalLexicon.set("identity", { base: 5, gate: 1, tone: 2 });
    this.distributionalLexicon.set("shift", { degree: 15, line: 1 });
    this.distributionalLexicon.set("move", { degree: 30, line: 1, gate: 2 });
    this.distributionalLexicon.set("mutation", { gate: 3, line: 3 });
    this.distributionalLexicon.set("now", { base: 3, degree: 30 });
    this.distributionalLexicon.set("phase", { base: 3, degree: 15, line: 2 });
    this.distributionalLexicon.set("force", { base: 4, line: 5 });
    this.distributionalLexicon.set("constraint", { base: 4, line: 4, gate: 5 });
    this.distributionalLexicon.set("purpose", { base: 4, gate: 2, tone: 3 });
    this.distributionalLexicon.set("deep", { color: 2, tone: 3 });
    this.distributionalLexicon.set("ascend", { gate: 5, line: 1 });
    this.distributionalLexicon.set("reflect", { degree: 180, house: 6 });
    this.distributionalLexicon.set("mirror", { degree: 180, house: 6, line: 3 });
    this.distributionalLexicon.set("transform", { gate: 10, line: 2, color: 3 });
    this.distributionalLexicon.set("create", { gate: 1, line: 1, base: 5 });
    this.distributionalLexicon.set("destroy", { gate: 4, line: 6, base: 4 });
    this.distributionalLexicon.set("grow", { gate: 42, line: 2, color: 4 });
    this.distributionalLexicon.set("learn", { gate: 24, line: 3, tone: 2 });
    this.distributionalLexicon.set("know", { gate: 48, line: 4, tone: 5 });
    this.distributionalLexicon.set("love", { gate: 25, line: 2, color: 5 });
    this.distributionalLexicon.set("fear", { gate: 18, line: 5, base: 4 });
    this.distributionalLexicon.set("power", { gate: 34, line: 1, base: 5 });
    this.distributionalLexicon.set("wait", { gate: 52, line: 4, base: 3 });
  }
}
