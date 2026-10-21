"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitRegistry = void 0;
class CircuitRegistry {
    circuits = new Map();
    constructor() {
        this.register({
            family: "understanding",
            description: "Logical, feedforward, constraint-driven",
            baseBehavior: "question → abstraction → constrained answer",
            primaryBias: ["logical", "feedforward", "consistency-seeking", "constraint-driven"],
            baseAnalogue: "deep feedforward computation",
        });
        this.register({
            family: "sensing",
            description: "Developmental, experiential, adaptive",
            baseBehavior: "experience → accumulation → maturation → adaptation",
            primaryBias: ["developmental", "experiential", "temporal", "incremental"],
            baseAnalogue: "deep belief and recurrent learning",
        });
        this.register({
            family: "knowing",
            description: "Reservoir-like, pulsed, emergent, metastable",
            baseBehavior: "silence → pulse → instability → mutation → expression",
            primaryBias: ["nonlinear", "emergent", "reservoir-like", "metastable"],
            baseAnalogue: "liquid state or reservoir computation",
        });
        this.register({
            family: "integration",
            description: "Agency-action, embodied exploration",
            baseBehavior: "actor-critic exploration",
            primaryBias: ["agency", "action", "exploration"],
            baseAnalogue: "actor-critic network",
        });
        this.register({
            family: "centering",
            description: "Threshold-disruption, initiation through shock",
            baseBehavior: "initiation through threshold crossing",
            primaryBias: ["threshold", "disruption", "initiation"],
            baseAnalogue: "spiking network",
        });
        this.register({
            family: "ego_defense",
            description: "Resource allocation, control, preservation",
            baseBehavior: "distribution and authority",
            primaryBias: ["control", "resource", "preservation"],
            baseAnalogue: "resource allocation network",
        });
    }
    register(def) {
        this.circuits.set(def.family, def);
    }
    get(family) {
        return this.circuits.get(family);
    }
    getAll() {
        return Array.from(this.circuits.values());
    }
}
exports.CircuitRegistry = CircuitRegistry;
//# sourceMappingURL=CircuitRegistry.js.map