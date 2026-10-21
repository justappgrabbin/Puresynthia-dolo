"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BeingOperator = void 0;
class BeingOperator {
    apply(node, field) {
        const updated = { ...node };
        updated.operators.being = Math.min(1, updated.operators.being + updated.activation * 0.1);
        if (updated.activation > 0.7) {
            updated.regime = "activated";
        }
        else if (updated.activation < 0.1) {
            updated.regime = "latent";
        }
        updated.activationHistory.push({
            timestamp: new Date().toISOString(),
            activation: updated.activation,
            tension: updated.tension,
            regime: updated.regime,
            triggeredBy: "BeingOperator",
        });
        return updated;
    }
    project(field) {
        const updated = { ...field };
        let totalBeing = 0;
        for (const node of updated.nodes.values()) {
            totalBeing += node.operators.being;
        }
        updated.operatorProjections.being = totalBeing / updated.nodes.size;
        return updated;
    }
}
exports.BeingOperator = BeingOperator;
//# sourceMappingURL=BeingOperator.js.map