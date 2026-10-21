"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.possibilityFromPlacement = possibilityFromPlacement;
exports.conditionEmergence = conditionEmergence;
exports.activateEmergence = activateEmergence;
function possibilityFromPlacement(placement) {
    const address = placement.address;
    return {
        id: `emergence:${placement.id}`,
        placementId: placement.id,
        perspective: address.dimension,
        orientation: address.orientation,
        gate: address.gate,
        lctb: {
            line: address.line,
            color: address.color,
            tone: address.tone,
            base: address.base,
        },
        status: "possible",
        conditionIds: [],
    };
}
function conditionEmergence(possibility, conditionIds) {
    const uniqueConditions = [...new Set(conditionIds.filter(Boolean))];
    return {
        ...possibility,
        conditionIds: uniqueConditions,
        status: uniqueConditions.length > 0 ? "conditioned" : "possible",
    };
}
function activateEmergence(possibility, completingConditionId) {
    if (!completingConditionId.trim()) {
        throw new Error("A completing condition is required for activation");
    }
    return {
        ...possibility,
        conditionIds: [...new Set([...possibility.conditionIds, completingConditionId])],
        status: "active",
    };
}
//# sourceMappingURL=GateEmergence.js.map