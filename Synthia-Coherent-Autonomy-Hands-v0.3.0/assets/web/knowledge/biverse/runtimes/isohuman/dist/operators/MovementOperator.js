"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MovementOperator = void 0;
class MovementOperator {
    apply(node, field) {
        const updated = { ...node };
        const neighbors = Array.from(field.nodes.values()).filter((n) => n.id !== node.id && this.hammingDistance(node.lines, n.lines) === 1);
        const avgNeighborActivation = neighbors.reduce((s, n) => s + n.activation, 0) / Math.max(1, neighbors.length);
        updated.operators.movement = Math.min(1, avgNeighborActivation * 1.2);
        updated.activation = Math.min(1, updated.activation + avgNeighborActivation * 0.15);
        return updated;
    }
    project(field) {
        const updated = { ...field };
        let total = 0;
        for (const node of updated.nodes.values())
            total += node.operators.movement;
        updated.operatorProjections.movement = total / updated.nodes.size;
        return updated;
    }
    hammingDistance(a, b) {
        let d = 0;
        for (let i = 0; i < 6; i++)
            if (a[i] !== b[i])
                d++;
        return d;
    }
}
exports.MovementOperator = MovementOperator;
//# sourceMappingURL=MovementOperator.js.map