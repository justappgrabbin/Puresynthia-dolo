"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogger = void 0;
class AuditLogger {
    logs = [];
    log(result) {
        this.logs.push(result);
    }
    getLogs() {
        return [...this.logs];
    }
    getByRequestId(requestId) {
        return this.logs.find((l) => l.requestId === requestId);
    }
}
exports.AuditLogger = AuditLogger;
//# sourceMappingURL=AuditLogger.js.map