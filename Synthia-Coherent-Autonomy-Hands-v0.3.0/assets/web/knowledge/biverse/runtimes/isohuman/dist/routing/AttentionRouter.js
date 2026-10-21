"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttentionRouter = void 0;
const FuxiEncoder_1 = require("../topology/FuxiEncoder");
class AttentionRouter {
    routeActivation(field, sourceId, amount) {
        const source = field.nodes.get(sourceId);
        if (!source)
            return new Map();
        const distribution = new Map();
        const sourcePattern = source.lines.join("");
        const neighbors = FuxiEncoder_1.FuxiEncoder.getNeighbors(sourcePattern, 1);
        for (const pattern of neighbors) {
            const idx = FuxiEncoder_1.FuxiEncoder.decodePattern(pattern);
            const nodeId = `node-${idx}`;
            const node = field.nodes.get(nodeId);
            if (node) {
                const weight = 1 / (1 + Math.abs(node.activation - source.activation));
                distribution.set(nodeId, amount * weight * 0.5);
            }
        }
        return distribution;
    }
}
exports.AttentionRouter = AttentionRouter;
//# sourceMappingURL=AttentionRouter.js.map