"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SemanticResolver = void 0;
const SemanticAttractor_1 = require("./SemanticAttractor");
class SemanticResolver {
    scorer;
    attractor = new SemanticAttractor_1.SemanticAttractor();
    constructor(scorer) {
        this.scorer = scorer;
    }
    resolve(node) {
        const trace = [];
        const field = { ...node.semanticField };
        const allItems = [...field.center, ...field.central, ...field.peripheral, ...field.rejected];
        for (const item of allItems) {
            item.structuralSupport = this.scorer.computeSupport(node, item);
            item.confidence = item.structuralSupport.totalScore;
        }
        trace.push({ step: 1, operation: "compute_structural_support", input: allItems.length, output: "scores computed", confidence: 1 });
        const updated = this.attractor.updateField(field);
        trace.push({ step: 2, operation: "update_field", input: field.coherenceScore, output: updated.coherenceScore, confidence: updated.coherenceScore });
        return { field: updated, trace };
    }
    getPrimaryMeaning(node) {
        const meanings = [];
        for (const item of node.semanticField.center)
            meanings.push(item.term);
        for (const item of node.semanticField.central)
            meanings.push(item.term);
        return meanings;
    }
}
exports.SemanticResolver = SemanticResolver;
//# sourceMappingURL=SemanticResolver.js.map