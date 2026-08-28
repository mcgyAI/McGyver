"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.planner = exports.Planner = void 0;
exports.looksTaskRelated = looksTaskRelated;
const llm_1 = require("../../services/llm");
// Cheap local gate so plain chat/knowledge questions never pay for an
// extra LLM call. Only messages that plausibly mention tasks reach plan()
// at all - see Router.ts.
const TASK_HINT = /\b(task|to-?do|remind(er)?|project|due|deadline|complete|finish|done|pending|on my (plate|list))\b/i;
function looksTaskRelated(message) {
    return TASK_HINT.test(message);
}
const PLANNER_PROMPT = `You classify whether a message is a task/project action, and extract structured data if so. Respond with ONLY raw JSON - no markdown fences, no explanation, no extra text.

Shapes:
- Not actually a task action: {"action":"none"}
- Adding a task: {"action":"create","title":"short task title","project":"optional project name","dueDate":"YYYY-MM-DD, omit key entirely if not mentioned"}
- Asking what's pending: {"action":"list"}
- Marking something done: {"action":"complete","match":"a few words identifying which task"}

Today's date is ${new Date().toISOString().slice(0, 10)} - use it to resolve relative dates like "next week" or "tomorrow" into YYYY-MM-DD.

Examples:
"remind me to call the accountant next week" -> {"action":"create","title":"Call the accountant","dueDate":"<resolved date>"}
"what's on my plate today" -> {"action":"list"}
"mark the accountant thing as done" -> {"action":"complete","match":"accountant"}
"what's the capital of France" -> {"action":"none"}`;
class Planner {
    async plan(request) {
        try {
            const raw = await (0, llm_1.callLLM)({
                systemPrompt: PLANNER_PROMPT,
                history: [],
                userMessage: request,
                maxTokens: 200,
            });
            const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/```$/, '').trim();
            const parsed = JSON.parse(cleaned);
            if (!parsed || typeof parsed.action !== 'string')
                return { action: 'none' };
            return parsed;
        }
        catch (e) {
            console.warn('[MCGYVER] Planner could not parse intent, falling through to chat:', e.message);
            return { action: 'none' };
        }
    }
}
exports.Planner = Planner;
exports.planner = new Planner();
//# sourceMappingURL=Planner.js.map