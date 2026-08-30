"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.route = route;
const promptRegistry_1 = require("../registries/promptRegistry");
const knowledgeRegistry_1 = require("../registries/knowledgeRegistry");
const llm_1 = require("../../services/llm");
const toolRouting_1 = require("./toolRouting");
// Two checks in order, cheapest/most specific first:
// 1. Tool/connector intent -> run the tool -> hand result back to the LLM
//    once so the reply reads naturally instead of dumping raw output
// 2. Otherwise: ordinary chat, with knowledge-base context if relevant
async function route(message, history) {
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