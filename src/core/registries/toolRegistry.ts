export interface Tool {
  id: string;
  description: string;
  // Phase 3 (ConnectorManager) fills these in with real handlers that
  // reach out to calendars, task systems, home automation, etc.
  handler: (input: Record<string, unknown>) => Promise<unknown>;
}

class ToolRegistry {
  private tools = new Map<string, Tool>();

  register(tool: Tool): void {
    this.tools.set(tool.id, tool);
  }

  get(id: string): Tool | undefined {
    return this.tools.get(id);
  }

  list(): Tool[] {
    return Array.from(this.tools.values());
  }
}

export const toolRegistry = new ToolRegistry();
