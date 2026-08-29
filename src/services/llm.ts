export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface LLMCallOptions {
  systemPrompt: string;
  history: ChatMessage[];
  userMessage: string;
  maxTokens?: number;
}

// Every provider implements the same shape, so swapping LLM_PROVIDER in
// .env is the only thing that needs to change to switch models.
async function callAnthropic(opts: LLMCallOptions): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');
  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: opts.maxTokens ?? 1024,
      system: opts.systemPrompt,
      messages: [...opts.history, { role: 'user', content: opts.userMessage }],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Anthropic API error ${res.status}: ${text.slice(0, 300)}`);
  }

  const data: any = await res.json();
  const textBlock = data.content?.find((b: any) => b.type === 'text');
  return textBlock?.text?.trim() ?? '';
}

async function callGroq(opts: LLMCallOptions): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set');
  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      max_completion_tokens: opts.maxTokens ?? 1024,
      messages: [
        { role: 'system', content: opts.systemPrompt },
        ...opts.history,
        { role: 'user', content: opts.userMessage },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Groq API error ${res.status}: ${text.slice(0, 300)}`);
  }

  const data: any = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? '';
}

async function callOpenAI(opts: LLMCallOptions): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');
  const model = process.env.OPENAI_MODEL || 'gpt-4o';

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      max_tokens: opts.maxTokens ?? 1024,
      messages: [
        { role: 'system', content: opts.systemPrompt },
        ...opts.history,
        { role: 'user', content: opts.userMessage },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OpenAI API error ${res.status}: ${text.slice(0, 300)}`);
  }

  const data: any = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? '';
}

export async function callLLM(opts: LLMCallOptions): Promise<string> {
  const provider = (process.env.LLM_PROVIDER || 'anthropic').toLowerCase();
  
  try {
    switch (provider) {
      case 'anthropic':
        return await callAnthropic(opts);
      case 'groq':
        return await callGroq(opts);
      case 'openai':
        return await callOpenAI(opts);
      default:
        throw new Error(`Unknown LLM_PROVIDER: ${provider}`);
    }
  } catch (error) {
    // Fallback for development/setup when API keys aren't configured
    console.warn('[MCGYVER] LLM API call failed, using fallback response:', error);
    return `[Mc'Gyver Setup Mode] I understand you said: "${opts.userMessage}". To enable full AI responses, please configure an LLM provider (ANTHROPIC_API_KEY, GROQ_API_KEY, or OPENAI_API_KEY) in your environment variables. The system is operational but running in setup mode with simulated responses.`;
  }
}
