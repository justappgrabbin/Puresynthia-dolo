"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.strongEquivalence = strongEquivalence;
exports.strongEquivalenceCode = strongEquivalenceCode;
exports.binaryState = binaryState;
exports.operatorBetween = operatorBetween;
exports.applyStrongEquivalence = applyStrongEquivalence;
exports.validateBinaryCatalog = validateBinaryCatalog;
function strongEquivalence(left, right, bits = 6) {
    const mask = (1 << bits) - 1;
    return (~(left ^ right)) & mask;
}
function strongEquivalenceCode(left, right) {
    validateMatchingCodes(left, right);
    const bits = left.length;
    return strongEquivalence(Number.parseInt(left, 2), Number.parseInt(right, 2), bits)
        .toString(2)
        .padStart(bits, "0");
}
function binaryState(code) {
    validateCode(code);
    return {
        code,
        value: Number.parseInt(code, 2),
        bits: code.length,
    };
}
function operatorBetween(rootCode, resultantCode) {
    return binaryState(strongEquivalenceCode(rootCode, resultantCode));
}
function applyStrongEquivalence(stateCode, operatorCode) {
    return binaryState(strongEquivalenceCode(stateCode, operatorCode));
}
function validateBinaryCatalog(entries, bits) {
    const codeCounts = new Map();
    const numberCounts = new Map();
    const invalidCodes = [];
    for (const entry of entries) {
        if (entry.code.length !== bits || !/^[01]+$/.test(entry.code)) {
            invalidCodes.push(entry.code);
        }
        codeCounts.set(entry.code, (codeCounts.get(entry.code) ?? 0) + 1);
        if (entry.number !== undefined) {
            numberCounts.set(entry.number, (numberCounts.get(entry.number) ?? 0) + 1);
        }
    }
    const duplicateCodes = [...codeCounts.entries()]
        .filter(([, count]) => count > 1)
        .map(([code]) => code)
        .sort();
    const duplicateNumbers = [...numberCounts.entries()]
        .filter(([, count]) => count > 1)
        .map(([number]) => number)
        .sort((a, b) => a - b);
    const expectedCodes = Array.from({ length: 1 << bits }, (_, value) => value.toString(2).padStart(bits, "0"));
    const presentCodes = new Set(entries.map((entry) => entry.code));
    const missingCodes = expectedCodes.filter((code) => !presentCodes.has(code));
    return {
        valid: duplicateCodes.length === 0 &&
            duplicateNumbers.length === 0 &&
            missingCodes.length === 0 &&
            invalidCodes.length === 0,
        duplicateCodes,
        duplicateNumbers,
        missingCodes,
        invalidCodes,
    };
}
function validateMatchingCodes(left, right) {
    validateCode(left);
    validateCode(right);
    if (left.length !== right.length) {
        throw new Error("Binary codes must have equal widths");
    }
}
function validateCode(code) {
    if (![3, 4, 6].includes(code.length) || !/^[01]+$/.test(code)) {
        throw new Error("Binary code must contain exactly 3, 4, or 6 bits");
    }
}
//# sourceMappingURL=KleinStrongEquivalence.js.map