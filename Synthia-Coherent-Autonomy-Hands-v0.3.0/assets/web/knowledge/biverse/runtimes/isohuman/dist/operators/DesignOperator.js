"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DesignOperator = void 0;
class DesignOperator {
    apply(node, field) {
        const updated = { ...node };
        const neighborCount = Array.from(field.nodes.values()).filter((n) => n.id !== node.id && this.topologicalDistance(node, n) < 2).length;
        updated.operators.design = Math.min(1, neighborCount / 6 + 0.2);
        return updated;
    }
    project(field) {
        const updated = { ...field };
        let total = 0;
        for (const node of updated.nodes.values())
            total += node.operators.design;
        updated.operatorProjections.design = total / updated.nodes.size;
        return updated;
    }
    topologicalDistance(a, b) {
        let diff = 0;
        for (let i = 0; i < 6; i++) {
            if (a.lines[i] !== b.lines[i])
                diff++;
        }
        return diff;
    }
}
exports.DesignOperator = DesignOperator;
//# sourceMappingURL=DesignOperator.js.map