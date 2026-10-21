"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpaceOperator = void 0;
class SpaceOperator {
    apply(node, field) {
        const updated = { ...node };
        const ctx = updated.observerContext;
        updated.operators.space = Math.min(1, ctx.scale * 0.3 + updated.operators.space * 0.7);
        return updated;
    }
    project(field) {
        const updated = { ...field };
        let total = 0;
        for (const node of updated.nodes.values())
            total += node.operators.space;
        updated.operatorProjections.space = total / updated.nodes.size;
        return updated;
    }
}
exports.SpaceOperator = SpaceOperator;
//# sourceMappingURL=SpaceOperator.js.map