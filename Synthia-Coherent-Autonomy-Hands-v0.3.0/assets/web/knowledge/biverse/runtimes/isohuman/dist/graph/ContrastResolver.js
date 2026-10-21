"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContrastResolver = void 0;
class ContrastResolver {
    graph;
    contrasts = [];
    constructor(graph) {
        this.graph = graph;
    }
    registerContrast(contrast) {
        this.contrasts.push(contrast);
    }
    getContrastsForNode(nodeId) {
        return this.contrasts.filter((c) => c.sourceNodeId === nodeId || c.targetNodeId === nodeId);
    }
    getContrastsByAxis(nodeId, axis) {
        return this.contrasts.filter((c) => (c.sourceNodeId === nodeId || c.targetNodeId === nodeId) && c.axis === axis);
    }
    getContrastPartner(nodeId, axis) {
        const c = this.contrasts.find((c) => c.sourceNodeId === nodeId && c.axis === axis);
        if (c)
            return this.graph.getNode(c.targetNodeId);
        const c2 = this.contrasts.find((c) => c.targetNodeId === nodeId && c.axis === axis);
        if (c2)
            return this.graph.getNode(c2.sourceNodeId);
        return undefined;
    }
    getAllAxesForNode(nodeId) {
        const axes = new Set();
        for (const c of this.contrasts) {
            if (c.sourceNodeId === nodeId || c.targetNodeId === nodeId) {
                axes.add(c.axis);
            }
        }
        return Array.from(axes);
    }
}
exports.ContrastResolver = ContrastResolver;
//# sourceMappingURL=ContrastResolver.js.map