export interface Capability {
  id: string;
  description: string;
  enabled: boolean;
}

class CapabilityRegistry {
  private capabilities = new Map<string, Capability>();

  register(capability: Capability): void {
    this.capabilities.set(capability.id, capability);
  }

  get(id: string): Capability | undefined {
    return this.capabilities.get(id);
  }

  list(): Capability[] {
    return Array.from(this.capabilities.values());
  }
}

export const capabilityRegistry = new CapabilityRegistry();

// Seed with what exists today. Phases 1-4 each register their own
// capabilities here as they land, so /health can report real status
// instead of a hardcoded list.
capabilityRegistry.register({ id: 'chat', description: 'Conversational chat with persistent memory', enabled: true });
capabilityRegistry.register({ id: 'knowledge', description: 'Personal knowledge base with relevance search', enabled: true });
capabilityRegistry.register({ id: 'tasks', description: 'Task and project tracking, via chat or direct API', enabled: true });
capabilityRegistry.register({ id: 'automation', description: 'Local file access connector, extensible to more tools', enabled: true });
capabilityRegistry.register({ id: 'voice', description: 'Push-to-talk voice in, spoken reply out', enabled: true });
