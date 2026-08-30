"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.capabilityRegistry = void 0;
class CapabilityRegistry {
    capabilities = new Map();
    register(capability) {
        this.capabilities.set(capability.id, capability);
    }
    get(id) {
        return this.capabilities.get(id);
    }
    list() {
        return Array.from(this.capabilities.values());
    }
}
exports.capabilityRegistry = new CapabilityRegistry();
// Seed with what exists today. Phases 1-4 each register their own
// capabilities here as they land, so /health can report real status
// instead of a hardcoded list.
exports.capabilityRegistry.register({ id: 'chat', description: 'Conversational chat with persistent memory', enabled: true });
exports.capabilityRegistry.register({ id: 'knowledge', description: 'Personal knowledge base with relevance search', enabled: true });
exports.capabilityRegistry.register({ id: 'tasks', description: 'Task and project tracking, via chat or direct API', enabled: true });
exports.capabilityRegistry.register({ id: 'automation', description: 'Local file access connector, extensible to more tools', enabled: true });
exports.capabilityRegistry.register({ id: 'voice', description: 'Push-to-talk voice in, spoken reply out', enabled: true });
//# sourceMappingURL=capabilityRegistry.js.map