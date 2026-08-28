import { Router as ExpressRouter } from 'express';
import { parserManager } from '../core/parsers/ParserManager';
import { knowledgeRegistry } from '../core/registries/knowledgeRegistry';

const router = ExpressRouter();

router.post('/knowledge', async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Missing required fields: title, content' });
    }
    const source = await parserManager.ingestText(title, content);
    res.json({ success: true, source });
  } catch (e) {
    console.error('[MCGYVER] Knowledge add error:', e);
    res.status(500).json({ error: (e as Error).message });
  }
});

router.get('/knowledge', (_req, res) => {
  res.json({ success: true, sources: knowledgeRegistry.all() });
});

export default router;
