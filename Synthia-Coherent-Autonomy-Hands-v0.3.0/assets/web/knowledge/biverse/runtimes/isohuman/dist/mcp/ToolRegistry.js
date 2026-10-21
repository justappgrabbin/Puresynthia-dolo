"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolRegistry = void 0;
class ToolRegistry {
    tools = new Map();
    register(tool) {
        this.tools.set(tool.id, tool);
    }
    get(id) {
        return this.tools.get(id);
    }
    getAll() {
        return Array.from(this.tools.values());
    }
    getByCapability(capability) {
        return this.getAll().filter((t) => t.capabilities.includes(capability));
    }
}
exports.ToolRegistry = ToolRegistry;
//# sourceMappingURL=ToolRegistry.js.map