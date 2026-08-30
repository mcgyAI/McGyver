"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.looksToolRelated = looksToolRelated;
exports.classifyToolCall = classifyToolCall;
exports.executeToolCall = executeToolCall;
const llm_1 = require("../../services/llm");
const toolRegistry_1 = require("../registries/toolRegistry");
// Same cheap-gate-before-LLM-call pattern as Planner.looksTaskRelated -
// only worth checking if any tools are even registered.
const TOOL_HINT = /\b(file|folder|directory|notes?\.(txt|md)|read|open|list)\b/i;
function looksToolRelated(message) {
    return toolRegistry_1.toolRegistry.list().length > 0 && TOOL_HINT.test(message);
}
async function classifyToolCall(message) {
    const tools = toolRegistry_1.toolRegistry.list();
    if (tools.length === 0)
        return { toolId: null, input: {} };
    const toolList = tools.map(t => `- ${t.id}: ${t.description}`).join('\n');
    const prompt = `You decide whether a message should trigger one of these tools. Respond with ONLY raw JSON, no markdown fences, no explanation.

Available tools:
${toolList}

If a tool applies: {"toolId":"<id>","input":{...parameters the tool needs}}
If none apply: {"toolId":null,"input":{}}`;
    try {
        const raw = await (0, llm_1.callLLM)({ systemPrompt: prompt, history: [], userMessage: message, maxTokens: 200 });
        const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/```$/, '').trim();
        const parsed = JSON.parse(cleaned);
        return { toolId: parsed.toolId ?? null, input: parsed.input ?? {} };
    }
    catch (e) {
        console.warn('[MCGYVER] Tool classification failed, falling through to chat:', e.message);
        return { toolId: null, input: {} };
    }
}
async function executeToolCall(toolId, input) {
    const tool = toolRegistry_1.toolRegistry.get(toolId);
    if (!tool)
        return `Tool "${toolId}" isn't registered.`;
    try {
        const result = await tool.handler(input);
        return typeof result === 'string' ? result : JSON.stringify(result, null, 2);
    }
    catch (e) {
        return `Error running ${toolId}: ${e.message}`;
    }
}
//# sourceMappingURL=toolRouting.js.map