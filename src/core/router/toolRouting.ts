import { callLLM } from '../../services/llm';
import { toolRegistry } from '../registries/toolRegistry';

// Same cheap-gate-before-LLM-call pattern as Planner.looksTaskRelated -
// only worth checking if any tools are even registered.
const TOOL_HINT = /\b(file|folder|directory|notes?\.(txt|md)|read|open|list)\b/i;

export function looksToolRelated(message: string): boolean {
  return toolRegistry.list().length > 0 && TOOL_HINT.test(message);
}

export interface ToolCallPlan {
  toolId: string | null;
  input: Record<string, unknown>;
}

export async function classifyToolCall(message: string): Promise<ToolCallPlan> {
  const tools = toolRegistry.list();
  if (tools.length === 0) return { toolId: null, input: {} };

  const toolList = tools.map(t => `- ${t.id}: ${t.description}`).join('\n');
  const prompt = `You decide whether a message should trigger one of these tools. Respond with ONLY raw JSON, no markdown fences, no explanation.

Available tools:
${toolList}

If a tool applies: {"toolId":"<id>","input":{...parameters the tool needs}}
If none apply: {"toolId":null,"input":{}}`;

  try {
    const raw = await callLLM({ systemPrompt: prompt, history: [], userMessage: message, maxTokens: 200 });
    const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(cleaned);
    return { toolId: parsed.toolId ?? null, input: parsed.input ?? {} };
  } catch (e) {
    console.warn('[MCGYVER] Tool classification failed, falling through to chat:', (e as Error).message);
    return { toolId: null, input: {} };
  }
}

export async function executeToolCall(toolId: string, input: Record<string, unknown>): Promise<string> {
  const tool = toolRegistry.get(toolId);
  if (!tool) return `Tool "${toolId}" isn't registered.`;
  try {
    const result = await tool.handler(input);
    return typeof result === 'string' ? result : JSON.stringify(result, null, 2);
  } catch (e) {
    return `Error running ${toolId}: ${(e as Error).message}`;
  }
}
