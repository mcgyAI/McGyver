import { Router as ExpressRouter } from 'express';
import { toolRegistry } from '../core/registries/toolRegistry';

const router = ExpressRouter();

router.get('/files', async (_req, res) => {
  try {
    const tool = toolRegistry.get('files.list');
    if (!tool) return res.status(500).json({ error: 'files.list not registered' });
    const files = await tool.handler({});
    res.json({ success: true, files });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post('/files/read', async (req, res) => {
  try {
    const { path } = req.body;
    if (!path) return res.status(400).json({ error: 'Missing required field: path' });
    const tool = toolRegistry.get('files.read');
    if (!tool) return res.status(500).json({ error: 'files.read not registered' });
    const content = await tool.handler({ path });
    res.json({ success: true, content });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
