"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdapterRegistry = void 0;
class AdapterRegistry {
    adapters = new Map();
    constructor() {
        this.register({
            id: "temporal-buffer",
            sourceMode: "continuous",
            targetMode: "pulsed",
            operations: ["buffer", "normalize"],
            temporary: true,
            activationThreshold: 0.3,
            provenance: [{ id: "prov-adapt-1", category: "derived_operator", source: "AdapterRegistry", description: "Temporal buffer for continuous↔pulsed", timestamp: new Date().toISOString() }],
        });
        this.register({
            id: "symbolic-encoder",
            sourceMode: "symbolic",
            targetMode: "latent",
            operations: ["encode", "decode"],
            temporary: true,
            activationThreshold: 0.4,
            provenance: [{ id: "prov-adapt-2", category: "derived_operator", source: "AdapterRegistry", description: "Symbolic↔latent translation", timestamp: new Date().toISOString() }],
        });
        this.register({
            id: "attractor-projector",
            sourceMode: "attractor",
            targetMode: "feedforward",
            operations: ["project", "gate"],
            temporary: true,
            activationThreshold: 0.35,
            provenance: [{ id: "prov-adapt-3", category: "derived_operator", source: "AdapterRegistry", description: "Attractor→feedforward projection", timestamp: new Date().toISOString() }],
        });
        this.register({
            id: "tension-regulator",
            sourceMode: "adversarial",
            targetMode: "stable",
            operations: ["regulate_tension", "normalize"],
            temporary: true,
            activationThreshold: 0.5,
            provenance: [{ id: "prov-adapt-4", category: "derived_operator", source: "AdapterRegistry", description: "Adversarial↔stable tension regulation", timestamp: new Date().toISOString() }],
        });
        this.register({
            id: "salience-mapper",
            sourceMode: "radial",
            targetMode: "attention",
            operations: ["map_salience", "project"],
            temporary: true,
            activationThreshold: 0.3,
            provenance: [{ id: "prov-adapt-5", category: "derived_operator", source: "AdapterRegistry", description: "Radial↔attention salience mapping", timestamp: new Date().toISOString() }],
        });
    }
    register(adapter) {
        this.adapters.set(adapter.id, adapter);
    }
    findAdapter(sourceMode, targetMode) {
        return Array.from(this.adapters.values()).find((a) => a.sourceMode === sourceMode && a.targetMode === targetMode);
    }
    getAll() {
        return Array.from(this.adapters.values());
    }
}
exports.AdapterRegistry = AdapterRegistry;
//# sourceMappingURL=AdapterRegistry.js.map