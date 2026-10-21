"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ATOEngine = void 0;
const FuxiEncoder_1 = require("../topology/FuxiEncoder");
const KleinStrongEquivalence_1 = require("./KleinStrongEquivalence");
class ATOEngine {
    transform(operation) {
        FuxiEncoder_1.FuxiEncoder.decodePattern(operation.rootPattern);
        const uniqueLines = [...new Set(operation.changedLines)].sort();
        let resultantPattern = operation.rootPattern;
        for (const line of uniqueLines) {
            resultantPattern = FuxiEncoder_1.FuxiEncoder.flipLine(resultantPattern, (line - 1));
        }
        const reciprocalTriple = {
            id: `${operation.triple.id}:reciprocal`,
            subject: operation.triple.object,
            relation: operation.triple.relation,
            object: operation.triple.subject,
        };
        const reciprocal = {
            id: `${operation.id}:reciprocal`,
            triple: reciprocalTriple,
            rootPattern: resultantPattern,
            changedLines: uniqueLines,
            preservedDimensions: [...operation.preservedDimensions],
            provenanceIds: [...operation.provenanceIds],
        };
        return {
            operationId: operation.id,
            rootPattern: operation.rootPattern,
            resultantPattern,
            operatorPattern: (0, KleinStrongEquivalence_1.operatorBetween)(operation.rootPattern, resultantPattern).code,
            triple: operation.triple,
            changedLines: uniqueLines,
            preservedDimensions: [...operation.preservedDimensions],
            reciprocal,
        };
    }
    reverse(result) {
        return this.transform(result.reciprocal);
    }
}
exports.ATOEngine = ATOEngine;
//# sourceMappingURL=ATOEngine.js.map