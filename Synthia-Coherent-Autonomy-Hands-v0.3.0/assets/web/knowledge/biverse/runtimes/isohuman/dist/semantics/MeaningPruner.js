"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeaningPruner = void 0;
class MeaningPruner {
    prune(field, threshold = 0.15) {
        const revisions = [];
        const allArrays = [field.center, field.central, field.peripheral];
        for (const arr of allArrays) {
            for (let i = arr.length - 1; i >= 0; i--) {
                const item = arr[i];
                if (item.confidence < threshold) {
                    const prevWeight = item.weight;
                    item.weight = 0;
                    item.status = "rejected";
                    field.rejected.push(item);
                    arr.splice(i, 1);
                    revisions.push({
                        id: `rev-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                        semanticItemId: item.id,
                        previousWeight: prevWeight,
                        newWeight: 0,
                        reason: `Confidence ${item.confidence.toFixed(3)} below threshold ${threshold}`,
                        evidenceIds: item.sourceIds,
                        timestamp: new Date().toISOString(),
                    });
                }
            }
        }
        return { field, revisions };
    }
}
exports.MeaningPruner = MeaningPruner;
//# sourceMappingURL=MeaningPruner.js.map