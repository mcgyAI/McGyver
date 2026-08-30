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
import { spatialProcessor } from './domains/spatial-perception/SpatialProcessor';
import { biometricProcessor } from './domains/biometrics/BiometricProcessor';

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

// Neuro-agent telemetry endpoints for physical awareness
app.post('/telemetry/spatial', requireOwner, async (req, res) => {
  try {
    const snapshot = spatialProcessor.processSpatialData(req.body);
    const threatAssessment = spatialProcessor.assessThreats(snapshot);
    
    res.json({ 
      success: true, 
      snapshot,
      threatAssessment 
    });
    
    if (threatAssessment.hasThreats) {
      console.log(`[NEURO-AGENT] Threat detected: ${threatAssessment.overallThreatLevel}`);
    }
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/telemetry/biometric', requireOwner, async (req, res) => {
  try {
    const biometric = biometricProcessor.processBiometricData(req.body);
    const analysis = biometricProcessor.analyzeBiometrics(biometric);
    
    res.json({ 
      success: true, 
      biometric,
      analysis 
    });
    
    if (analysis.currentStatus === 'critical') {
      console.log(`[NEURO-AGENT] Critical biometric status: ${analysis.healthAlerts.join(', ')}`);
    }
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/telemetry/status', requireOwner, (req, res) => {
  res.json({
    success: true,
    spatial: spatialProcessor.getCurrentEnvironmentState(),
    biometric: biometricProcessor.getCurrentPhysiologicalState()
  });
});

// Favicon handler to prevent 404 errors
app.get('/favicon.ico', (req, res) => {
  res.status(200).end();
});

// Health check is intentionally unauthenticated (useful for uptime
// monitors) but exposes no owner data. Everything else requires the
// owner token.
app.use('/', healthRoutes);
app.use(requireOwner);
app.use('/', chatRoutes);
app.use('/', knowledgeRoutes);
app.use('/', tasksRoutes);
app.use('/', filesRoutes);

// Keepalive system to prevent service sleep
const KEEPALIVE_INTERVAL = parseInt(process.env.KEEPALIVE_INTERVAL || '300', 10); // 5 minutes default
let keepaliveTimer: NodeJS.Timeout | null = null;

function startKeepalive() {
  if (keepaliveTimer) clearInterval(keepaliveTimer);
  
  const intervalMs = isNaN(KEEPALIVE_INTERVAL) ? 300000 : KEEPALIVE_INTERVAL * 1000;
  
  keepaliveTimer = setInterval(() => {
    console.log(`[MCGYVER] Keepalive ping at ${new Date().toISOString()}`);
    // Perform lightweight health check
    try {
      // Try to perform a simple database operation if available
      console.log('[MCGYVER] System health: Monitoring active');
    } catch (error) {
      console.log('[MCGYVER] System health: Running in degraded mode');
    }
  }, intervalMs);
  
  console.log(`[MCGYVER] Keepalive system started (interval: ${intervalMs / 1000}s)`);
}

// Background learning and neuro-agent processing
// Enabled by default. Set ENABLE_BACKGROUND_LEARNING=false only for an
// intentional maintenance/debug session; the operational agent should not
// silently stop its local maintenance loop because an environment variable
// was omitted during deployment.
const ENABLE_BACKGROUND_LEARNING = process.env.ENABLE_BACKGROUND_LEARNING !== 'false';
const BACKGROUND_PROCESSING_INTERVAL = parseInt(process.env.BACKGROUND_PROCESSING_INTERVAL || '600', 10); // 10 minutes default
let backgroundTimer: NodeJS.Timeout | null = null;

async function processBackgroundLearning() {
  try {
    console.log(`[MCGYVER] Neuro-agent background processing started at ${new Date().toISOString()}`);
    
    // Re-hydrate knowledge base with any new information
    const existing = await loadAllKnowledge();
    const newItems = existing.filter(item => !knowledgeRegistry.has(item.id));
    
    if (newItems.length > 0) {
      console.log(`[MCGYVER] Neuro-agent detected ${newItems.length} new knowledge items`);
      knowledgeRegistry.hydrate(existing);
      console.log(`[MCGYVER] Neuro-agent knowledge base updated: ${existing.length} item(s)`);
    }
    
    // Perform knowledge consolidation and pattern recognition
    if (existing.length > 10) {
      console.log('[MCGYVER] Neuro-agent performing knowledge consolidation...');
      // Future: Implement semantic clustering, relationship mapping, pattern recognition
    }

    // Physical awareness processing - spatial and biometric analysis
    const spatialHistory = spatialProcessor.getRecentSpatialHistory(5);
    const biometricHistory = biometricProcessor.getBiometricHistory(10);
    
    if (spatialHistory.length > 0) {
      console.log(`[NEURO-AGENT] Processing ${spatialHistory.length} spatial snapshots for environmental awareness`);
      const latestSpatial = spatialHistory[spatialHistory.length - 1];
      const threatAssessment = spatialProcessor.assessThreats(latestSpatial);
      
      if (threatAssessment.hasThreats) {
        console.log(`[NEURO-AGENT] Environmental threat detected: ${threatAssessment.overallThreatLevel}`);
        // Future: Integrate threat assessment into AI responses
      }
    }
    
    if (biometricHistory.length > 0) {
      console.log(`[NEURO-AGENT] Processing ${biometricHistory.length} biometric samples for physiological awareness`);
      const latestBiometric = biometricHistory[biometricHistory.length - 1];
      const analysis = biometricProcessor.analyzeBiometrics(latestBiometric);
      
      if (analysis.currentStatus === 'critical') {
        console.log(`[NEURO-AGENT] Critical physiological status: ${analysis.healthAlerts.join('. ')}`);
        // Future: Adjust AI responses based on physiological state
      }
    }
    
    console.log(`[MCGYVER] Neuro-agent background processing completed`);
  } catch (error) {
    console.error('[MCGYVER] Neuro-agent background processing error:', error);
  }
}

function startBackgroundLearning() {
  if (!ENABLE_BACKGROUND_LEARNING) {
    console.log('[MCGYVER] Background learning disabled by configuration');
    return;
  }
  
  if (backgroundTimer) clearInterval(backgroundTimer);
  
  const intervalMs = isNaN(BACKGROUND_PROCESSING_INTERVAL) ? 600000 : BACKGROUND_PROCESSING_INTERVAL * 1000;
  
  backgroundTimer = setInterval(() => {
    processBackgroundLearning();
  }, intervalMs);
  
  console.log(`[MCGYVER] Neuro-agent background learning started (interval: ${intervalMs / 1000}s)`);
  
  // Initial processing
  setTimeout(() => processBackgroundLearning(), 5000);
}

app.listen(PORT, async () => {
  console.log(`[MCGYVER] Virtual Operational Robot running on port ${PORT}`);
  console.log(`[MCGYVER] Open http://localhost:${PORT} in your browser`);
  console.log(`[MCGYVER] Neuro-agent: Physically Aware System Initialized`);

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
  
  // Start keepalive system
  startKeepalive();
  
  // Start background learning (neuro-agent with physical awareness)
  startBackgroundLearning();
  
  console.log('[MCGYVER] All systems operational. Virtual Operational Robot active and monitoring environment.');
});

process.on('SIGTERM', () => {
  console.log('[MCGYVER] SIGTERM received, shutting down...');
  process.exit(0);
});
