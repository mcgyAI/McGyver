import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config();

import { connectDb } from './services/db';
import { requireOwner } from './services/auth';
import chatRoutes from './routes/chat';
import healthRoutes from './routes/health';
import knowledgeRoutes from './routes/knowledge';
import tasksRoutes from './routes/tasks';
import filesRoutes from './routes/files';
import voiceRoutes from './routes/voice';
import { knowledgeRegistry } from './core/registries/knowledgeRegistry';
import { loadAllKnowledge } from './services/knowledgeStore';
import { connectorManager } from './core/connectors/ConnectorManager';

const app = express();
const PORT = process.env.PORT || 4000;

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());

app.use(cors({ origin: allowedOrigins, credentials: true }));

// /voice needs the raw body (audio bytes) rather than JSON, so it's
// mounted before the global JSON parser - but it still requires the
// owner token like every other non-health route.
app.use('/voice', requireOwner, voiceRoutes);

app.use(express.json({ limit: '10mb' }));

// The browser UI itself is unauthenticated (just static HTML/CSS/JS -
// nothing owner-specific in the files), but every API route it calls is
// gated behind requireOwner via the token the page asks you to paste in.
app.use(express.static(path.join(process.cwd(), 'public')));

// Health check is intentionally unauthenticated (useful for uptime
// monitors) but exposes no owner data. Everything else requires the
// owner token.
app.use('/', healthRoutes);
app.use(requireOwner);
app.use('/', chatRoutes);
app.use('/', knowledgeRoutes);
app.use('/', tasksRoutes);
app.use('/', filesRoutes);

app.listen(PORT, async () => {
  console.log(`[MCGYVER] Private assistant running on port ${PORT}`);
  console.log(`[MCGYVER] Open http://localhost:${PORT} in your browser`);

  // No database dependency, so this runs immediately rather than waiting
  // behind the Mongo connection attempt below.
  connectorManager.registerAll();

  try {
    await connectDb();
    console.log('[MCGYVER] Ready.');
  } catch (e) {
    console.warn('[MCGYVER] Could not reach MongoDB - running on in-memory');
    console.warn('[MCGYVER] memory only. Nothing will persist across restarts');
    console.warn('[MCGYVER] until MONGO_URL points at a real database.');
    console.warn('[MCGYVER] Reason:', (e as Error).message);
  }

  const existing = await loadAllKnowledge();
  knowledgeRegistry.hydrate(existing);
  console.log(`[MCGYVER] Knowledge base loaded: ${existing.length} item(s)`);
});

process.on('SIGTERM', () => {
  console.log('[MCGYVER] SIGTERM received, shutting down...');
  process.exit(0);
});
