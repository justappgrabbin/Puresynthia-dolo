"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DIMENSION_PERSPECTIVES = void 0;
exports.validateGeonatalAddress = validateGeonatalAddress;
exports.createFiveSpaceState = createFiveSpaceState;
exports.getPerspective = getPerspective;
exports.DIMENSION_PERSPECTIVES = [
    "being",
    "movement",
    "evolution",
    "design",
    "space",
];
const ranges = [
    ["gate", 1, 64],
    ["line", 1, 6],
    ["color", 1, 6],
    ["tone", 1, 6],
    ["base", 1, 5],
    ["degree", 0, 29],
    ["minute", 0, 59],
    ["second", 0, 59],
    ["arc", 0, 99],
    ["zodiac", 1, 12],
    ["house", 1, 12],
    ["ascendingSide", 1, 12],
];
function validateGeonatalAddress(address) {
    const issues = [];
    if (!address.planetary.trim())
        issues.push("planetary is required");
    for (const [field, minimum, maximum] of ranges) {
        const value = address[field];
        if (typeof value !== "number" || !Number.isInteger(value) || value < minimum || value > maximum) {
            issues.push(`${field} must be an integer from ${minimum} through ${maximum}`);
        }
    }
    return issues;
}
function createFiveSpaceState(id, subjectId, placements, macroPerspectives = []) {
    const buildStack = (perspective) => {
        const ownPlacements = placements.filter((placement) => placement.address.dimension === perspective);
        const layers = [{ scale: "micro", placements: ownPlacements }];
        if (perspective !== "being" && macroPerspectives.includes(perspective)) {
            layers.push({ scale: "macro", placements: [] });
        }
        return {
            perspective,
            position: perspective === "being" ? "center" : "corner",
            layers,
        };
    };
    return {
        id,
        subjectId,
        observedAt: new Date().toISOString(),
        being: buildStack("being"),
        movement: buildStack("movement"),
        evolution: buildStack("evolution"),
        design: buildStack("design"),
        space: buildStack("space"),
    };
}
function getPerspective(state, perspective) {
    return state[perspective];
}
//# sourceMappingURL=FiveSpaceState.js.map