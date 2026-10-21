"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvolutionOperator = void 0;
class EvolutionOperator {
    apply(node, field) {
        const updated = { ...node };
        const history = updated.activationHistory;
        const recent = history.slice(-5);
        const avgRecent = recent.reduce((s, r) => s + r.activation, 0) / Math.max(1, recent.length);
        updated.operators.evolution = Math.min(1, updated.memoryGravity * 0.5 + avgRecent * 0.5);
        updated.attractorWeight = Math.min(1, updated.attractorWeight + updated.activation * 0.05);
        updated.memoryGravity = Math.min(1, updated.memoryGravity + 0.02);
        return updated;
    }
    project(field) {
        const updated = { ...field };
        let total = 0;
        for (const node of updated.nodes.values())
            total += node.operators.evolution;
        updated.operatorProjections.evolution = total / updated.nodes.size;
        return updated;
    }
}
exports.EvolutionOperator = EvolutionOperator;
//# sourceMappingURL=EvolutionOperator.js.map