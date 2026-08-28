"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toolRegistry = void 0;
class ToolRegistry {
    tools = new Map();
    register(tool) {
        this.tools.set(tool.id, tool);
    }
    get(id) {
        return this.tools.get(id);
    }
    list() {
        return Array.from(this.tools.values());
    }
}
exports.toolRegistry = new ToolRegistry();
//# sourceMappingURL=toolRegistry.js.map