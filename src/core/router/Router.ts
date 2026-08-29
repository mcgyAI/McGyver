import { OWNER_SYSTEM_PROMPT } from '../registries/promptRegistry';
import { knowledgeRegistry } from '../registries/knowledgeRegistry';
import { callLLM, ChatMessage } from '../../services/llm';
import { looksToolRelated, classifyToolCall, executeToolCall } from './toolRouting';

// Two checks in order, cheapest/most specific first:
// 1. Tool/connector intent -> run the tool -> hand result back to the LLM
//    once so the reply reads naturally instead of dumping raw output
// 2. Otherwise: ordinary chat, with knowledge-base context if relevant
export async function route(message: string, history: ChatMessage[]): Promise<string> {

  if (looksToolRelated(message)) {
    const toolPlan = await classifyToolCall(message);
    if (toolPlan.toolId) {
      const toolResult = await executeToolCall(toolPlan.toolId, toolPlan.input);
      const systemPrompt =
        OWNER_SYSTEM_PROMPT +
        `\n\nYou just ran a tool for the owner and got this result. Answer their question using it, in your own words, not as a raw dump:\n${toolResult}`;
      return callLLM({ systemPrompt, history, userMessage: message });
    }
  }

  let systemPrompt = OWNER_SYSTEM_PROMPT;
  const relevant = knowledgeRegistry.search(message, 3);
  if (relevant.length > 0) {
    const context = relevant.map(r => `[${r.title}]: ${r.content}`).join('\n\n');
    systemPrompt += `\n\nRelevant context from your knowledge base:\n${context}`;
  }

  return callLLM({ systemPrompt, history, userMessage: message });
}
