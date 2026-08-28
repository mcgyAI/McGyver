import { Router as ExpressRouter } from 'express';
import { capabilityRegistry } from '../core/registries/capabilityRegistry';

const router = ExpressRouter();

router.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'mcgyver',
    private: true,
    capabilities: capabilityRegistry.list(),
    timestamp: new Date().toISOString(),
  });
});

export default router;
