"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.route = route;
const promptRegistry_1 = require("../registries/promptRegistry");
const knowledgeRegistry_1 = require("../registries/knowledgeRegistry");
const llm_1 = require("../../services/llm");
const Planner_1 = require("../planner/Planner");
const taskActions_1 = require("../../domains/tasks/taskActions");
const toolRouting_1 = require("./toolRouting");
// Three checks in order, cheapest/most specific first:
// 1. Task intent -> Planner -> deterministic reply, no general LLM call
// 2. Tool/connector intent -> run the tool -> hand result back to the LLM
//    once so the reply reads naturally instead of dumping raw output
// 3. Otherwise: ordinary chat, with knowledge-base context if relevant
async function route(message, history) {
    if ((0, Planner_1.looksTaskRelated)(message)) {
        const plan = await Planner_1.planner.plan(message);
        if (plan.action !== 'none') {
            return (0, taskActions_1.executeTaskAction)(plan);
        }
    }
    if ((0, toolRouting_1.looksToolRelated)(message)) {
        const toolPlan = await (0, toolRouting_1.classifyToolCall)(message);
        if (toolPlan.toolId) {
            const toolResult = await (0, toolRouting_1.executeToolCall)(toolPlan.toolId, toolPlan.input);
            const systemPrompt = promptRegistry_1.OWNER_SYSTEM_PROMPT +
                `\n\nYou just ran a tool for the owner and got this result. Answer their question using it, in your own words, not as a raw dump:\n${toolResult}`;
            return (0, llm_1.callLLM)({ systemPrompt, history, userMessage: message });
        }
    }
    let systemPrompt = promptRegistry_1.OWNER_SYSTEM_PROMPT;
    const relevant = knowledgeRegistry_1.knowledgeRegistry.search(message, 3);
    if (relevant.length > 0) {
        const context = relevant.map(r => `[${r.title}]: ${r.content}`).join('\n\n');
        systemPrompt += `\n\nRelevant context from your knowledge base:\n${context}`;
    }
    return (0, llm_1.callLLM)({ systemPrompt, history, userMessage: message });
}
//# sourceMappingURL=Router.js.map