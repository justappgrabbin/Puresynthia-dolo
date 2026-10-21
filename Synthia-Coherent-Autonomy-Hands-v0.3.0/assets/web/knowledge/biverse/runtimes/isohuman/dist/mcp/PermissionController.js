"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionController = void 0;
class PermissionController {
    permissions = new Map();
    grant(toolId, scopes) {
        this.permissions.set(toolId, scopes);
    }
    check(request) {
        const allowed = this.permissions.get(request.toolId) || [];
        return request.permissionScope.every((scope) => allowed.includes(scope));
    }
}
exports.PermissionController = PermissionController;
//# sourceMappingURL=PermissionController.js.map