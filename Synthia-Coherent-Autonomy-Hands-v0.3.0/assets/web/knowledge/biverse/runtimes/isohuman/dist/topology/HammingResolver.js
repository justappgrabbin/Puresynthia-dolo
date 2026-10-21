"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HammingResolver = void 0;
// ============================================================================
// Hamming Distance Resolver
// ============================================================================
const FuxiEncoder_1 = require("./FuxiEncoder");
class HammingResolver {
    static neighbors(pattern, maxDistance = 1) {
        return FuxiEncoder_1.FuxiEncoder.getNeighbors(pattern, maxDistance);
    }
    static distance(a, b) {
        return FuxiEncoder_1.FuxiEncoder.hammingDistance(a, b);
    }
    static isNeighbor(a, b, distance = 1) {
        return this.distance(a, b) === distance;
    }
    static sortedByDistance(reference, candidates) {
        return [...candidates].sort((a, b) => this.distance(reference, a) - this.distance(reference, b));
    }
}
exports.HammingResolver = HammingResolver;
//# sourceMappingURL=HammingResolver.js.map