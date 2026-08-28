import { Router as ExpressRouter } from 'express';
import { route } from '../core/router/Router';
import { loadMemory, saveMemory, clearMemory } from '../services/memory';

const router = ExpressRouter();

router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Missing required field: message' });
    }

    const history = await loadMemory();
    const reply = await route(message, history);

    const updated = [
      ...history,
      { role: 'user' as const, content: message },
      { role: 'assistant' as const, content: reply },
    ];
    await saveMemory(updated);

    res.json({ success: true, response: reply, timestamp: new Date().toISOString() });
  } catch (e) {
    console.error('[MCGYVER] Chat error:', e);
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post('/memory/clear', async (_req, res) => {
  await clearMemory();
  res.json({ success: true, message: 'Memory cleared' });
});

export default router;
